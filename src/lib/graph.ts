import type {
  GithubCommit,
  GithubFile,
  GithubIssue,
} from '@/types/github'
import type {
  GraphData,
  GraphEdge,
  GraphNode,
  NodeType,
} from '@/types/graph'

const SCRIPT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const LAYOUT_RADIUS = 200
const LAYOUT_ITERATIONS = 150
const REPULSION_STRENGTH = 2_400
const SPRING_LENGTH = 45
const SPRING_STRENGTH = 0.018
const CENTERING_STRENGTH = 0.0015
const VELOCITY_DAMPING = 0.82
const MAX_VELOCITY = 12
const MIN_NODE_DISTANCE = 1
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000

export function buildGraph(
  files: GithubFile[],
  contents: Map<string, string>,
  commits: GithubCommit[],
  issues: GithubIssue[],
): GraphData {
  const filePaths = new Set(files.map((file) => normalizePath(file.path)))
  const edges = buildEdges(files, contents, filePaths)
  const nodeIndexByPath = new Map(
    files.map((file, index) => [normalizePath(file.path), index]),
  )
  const degrees = computeDegrees(files.length, edges, nodeIndexByPath)
  const maxDegree = degrees.reduce(
    (currentMaximum, degree) => Math.max(currentMaximum, degree),
    0,
  )
  const positions = runForceLayout(
    files,
    edges,
    nodeIndexByPath,
    createSeed(files),
  )
  const commitsByPath = groupCommitsByPath(commits)
  const now = Date.now()

  const nodes = files.map((file, index): GraphNode => {
    const normalizedPath = normalizePath(file.path)
    const fileCommits = commitsByPath.get(normalizedPath) ?? []
    const degree = degrees[index] ?? 0
    const positionOffset = index * 3

    return {
      id: normalizedPath,
      label: getFileLabel(normalizedPath),
      type: classifyFile(normalizedPath),
      size: file.size,
      commits: fileCommits.length,
      hasIssue: issues.some((issue) => issueMentionsFile(issue, normalizedPath)),
      isRecent: hasRecentCommit(fileCommits, now),
      language: detectLanguage(normalizedPath),
      position: [
        positions[positionOffset] ?? 0,
        positions[positionOffset + 1] ?? 0,
        positions[positionOffset + 2] ?? 0,
      ],
      centrality: maxDegree === 0 ? 0 : degree / maxDegree,
      weight: Math.max(1, degree),
    }
  })

  return {
    nodes,
    edges,
    positions,
    repoName: getRepoName(files),
    fetchedAt: now,
  }
}

function classifyFile(filePath: string): NodeType {
  const normalizedPath = filePath.toLowerCase()
  const fileName = getFileName(normalizedPath)
  const extension = getExtension(fileName)

  if (
    ['main.tsx', 'main.ts', 'main.jsx', 'main.js', 'index.ts', 'index.js'].includes(
      fileName,
    )
  ) {
    return 'entry'
  }

  if (
    /(?:^|\/)__tests__(?:\/|$)/u.test(normalizedPath) ||
    /\.(?:test|spec)\.[^.]+$/u.test(fileName)
  ) {
    return 'test'
  }

  if (['.css', '.scss', '.sass', '.less'].includes(extension)) {
    return 'style'
  }

  if (
    fileName === 'package.json' ||
    /^tsconfig(?:\..+)?\.json$/u.test(fileName) ||
    /\.config\.[^.]+$/u.test(fileName)
  ) {
    return 'config'
  }

  if (/(?:^|\/)(?:src\/)?store(?:\/|$)/u.test(normalizedPath)) {
    return 'store'
  }

  if (/(?:^|\/)(?:src\/)?(?:lib|utils?)(?:\/|$)/u.test(normalizedPath)) {
    return 'util'
  }

  if (extension === '.tsx' || extension === '.jsx') {
    return 'component'
  }

  return 'unknown'
}

function buildEdges(
  files: GithubFile[],
  contents: Map<string, string>,
  filePaths: Set<string>,
): GraphEdge[] {
  const edgeKeys = new Set<string>()
  const edges: GraphEdge[] = []

  for (const file of files) {
    const source = normalizePath(file.path)
    const content = contents.get(file.path) ?? contents.get(source)

    if (content === undefined) {
      continue
    }

    for (const importPath of parseImportPaths(content)) {
      const target = resolveImportPath(source, importPath, filePaths)

      if (target === null) {
        continue
      }

      const edgeKey = `${source}\u0000${target}`

      if (edgeKeys.has(edgeKey)) {
        continue
      }

      edgeKeys.add(edgeKey)
      edges.push({ source, target, weight: 1 })
    }
  }

  return edges
}

function parseImportPaths(content: string): string[] {
  const importPaths = new Set<string>()
  const source = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gmu, '')
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gu,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
  ]

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const importPath = match[1]

      if (
        importPath?.startsWith('.') &&
        !importPath.split('/').includes('node_modules')
      ) {
        importPaths.add(importPath)
      }
    }
  }

  return [...importPaths]
}

function resolveImportPath(
  sourcePath: string,
  importPath: string,
  filePaths: Set<string>,
): string | null {
  const cleanImportPath = importPath.split(/[?#]/u, 1)[0]

  if (!cleanImportPath) {
    return null
  }

  const sourceDirectory = getDirectoryName(sourcePath)
  const resolvedBase = normalizePath(`${sourceDirectory}/${cleanImportPath}`)

  if (resolvedBase.startsWith('../')) {
    return null
  }

  const candidates = [resolvedBase]

  if (!SCRIPT_EXTENSIONS.includes(getExtension(resolvedBase))) {
    for (const extension of SCRIPT_EXTENSIONS) {
      candidates.push(`${resolvedBase}${extension}`)
    }

    for (const extension of SCRIPT_EXTENSIONS) {
      candidates.push(`${resolvedBase}/index${extension}`)
    }
  }

  return candidates.find((candidate) => filePaths.has(candidate)) ?? null
}

function computeDegrees(
  nodeCount: number,
  edges: GraphEdge[],
  nodeIndexByPath: Map<string, number>,
): number[] {
  const degrees = Array.from({ length: nodeCount }, () => 0)

  for (const edge of edges) {
    const sourceIndex = nodeIndexByPath.get(edge.source)
    const targetIndex = nodeIndexByPath.get(edge.target)

    if (sourceIndex === undefined || targetIndex === undefined) {
      continue
    }

    degrees[sourceIndex] = (degrees[sourceIndex] ?? 0) + 1
    degrees[targetIndex] = (degrees[targetIndex] ?? 0) + 1
  }

  return degrees
}

function runForceLayout(
  files: GithubFile[],
  edges: GraphEdge[],
  nodeIndexByPath: Map<string, number>,
  seed: number,
): Float32Array {
  const nodeCount = files.length
  const positions = new Float32Array(nodeCount * 3)
  const velocities = new Float64Array(nodeCount * 3)
  const forces = new Float64Array(nodeCount * 3)
  const random = createRandom(seed)
  const indexedEdges = edges.flatMap((edge): Array<[number, number]> => {
    const sourceIndex = nodeIndexByPath.get(edge.source)
    const targetIndex = nodeIndexByPath.get(edge.target)

    return sourceIndex === undefined || targetIndex === undefined
      ? []
      : [[sourceIndex, targetIndex]]
  })

  for (let index = 0; index < nodeCount; index += 1) {
    const zDirection = random() * 2 - 1
    const angle = random() * Math.PI * 2
    const radialScale = Math.cbrt(random()) * LAYOUT_RADIUS
    const planeScale = Math.sqrt(1 - zDirection * zDirection)
    const offset = index * 3

    positions[offset] = radialScale * planeScale * Math.cos(angle)
    positions[offset + 1] = radialScale * planeScale * Math.sin(angle)
    positions[offset + 2] = radialScale * zDirection
  }

  for (let iteration = 0; iteration < LAYOUT_ITERATIONS; iteration += 1) {
    forces.fill(0)

    for (let first = 0; first < nodeCount; first += 1) {
      for (let second = first + 1; second < nodeCount; second += 1) {
        applyRepulsion(positions, forces, first, second)
      }
    }

    for (const [sourceIndex, targetIndex] of indexedEdges) {
      applySpringForce(positions, forces, sourceIndex, targetIndex)
    }

    const timeStep = 0.075 * (1 - iteration / (LAYOUT_ITERATIONS * 1.5))

    for (let index = 0; index < nodeCount; index += 1) {
      const offset = index * 3

      for (let axis = 0; axis < 3; axis += 1) {
        const coordinateOffset = offset + axis
        const centeredForce =
          (forces[coordinateOffset] ?? 0) -
          (positions[coordinateOffset] ?? 0) * CENTERING_STRENGTH
        const velocity = Math.max(
          -MAX_VELOCITY,
          Math.min(
            MAX_VELOCITY,
            ((velocities[coordinateOffset] ?? 0) +
              centeredForce * timeStep) *
              VELOCITY_DAMPING,
          ),
        )

        velocities[coordinateOffset] = velocity
        positions[coordinateOffset] =
          (positions[coordinateOffset] ?? 0) + velocity
      }

      clampToRadius(positions, index, LAYOUT_RADIUS)
    }
  }

  separateOverlappingNodes(positions)

  return positions
}

function applyRepulsion(
  positions: Float32Array,
  forces: Float64Array,
  firstIndex: number,
  secondIndex: number,
): void {
  const firstOffset = firstIndex * 3
  const secondOffset = secondIndex * 3
  let deltaX =
    (positions[firstOffset] ?? 0) - (positions[secondOffset] ?? 0)
  let deltaY =
    (positions[firstOffset + 1] ?? 0) - (positions[secondOffset + 1] ?? 0)
  let deltaZ =
    (positions[firstOffset + 2] ?? 0) - (positions[secondOffset + 2] ?? 0)
  let distanceSquared =
    deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ

  if (distanceSquared < 0.0001) {
    const direction = deterministicDirection(firstIndex, secondIndex)
    deltaX = direction[0]
    deltaY = direction[1]
    deltaZ = direction[2]
    distanceSquared = 1
  }

  const distance = Math.sqrt(distanceSquared)
  const forceMagnitude =
    REPULSION_STRENGTH / Math.max(distanceSquared, MIN_NODE_DISTANCE)
  const forceScale = forceMagnitude / distance
  const forceX = deltaX * forceScale
  const forceY = deltaY * forceScale
  const forceZ = deltaZ * forceScale

  forces[firstOffset] = (forces[firstOffset] ?? 0) + forceX
  forces[firstOffset + 1] = (forces[firstOffset + 1] ?? 0) + forceY
  forces[firstOffset + 2] = (forces[firstOffset + 2] ?? 0) + forceZ
  forces[secondOffset] = (forces[secondOffset] ?? 0) - forceX
  forces[secondOffset + 1] = (forces[secondOffset + 1] ?? 0) - forceY
  forces[secondOffset + 2] = (forces[secondOffset + 2] ?? 0) - forceZ
}

function applySpringForce(
  positions: Float32Array,
  forces: Float64Array,
  sourceIndex: number,
  targetIndex: number,
): void {
  const sourceOffset = sourceIndex * 3
  const targetOffset = targetIndex * 3
  const deltaX =
    (positions[targetOffset] ?? 0) - (positions[sourceOffset] ?? 0)
  const deltaY =
    (positions[targetOffset + 1] ?? 0) - (positions[sourceOffset + 1] ?? 0)
  const deltaZ =
    (positions[targetOffset + 2] ?? 0) - (positions[sourceOffset + 2] ?? 0)
  const distance = Math.max(
    Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ),
    0.001,
  )
  const forceScale =
    (SPRING_STRENGTH * (distance - SPRING_LENGTH)) / distance
  const forceX = deltaX * forceScale
  const forceY = deltaY * forceScale
  const forceZ = deltaZ * forceScale

  forces[sourceOffset] = (forces[sourceOffset] ?? 0) + forceX
  forces[sourceOffset + 1] = (forces[sourceOffset + 1] ?? 0) + forceY
  forces[sourceOffset + 2] = (forces[sourceOffset + 2] ?? 0) + forceZ
  forces[targetOffset] = (forces[targetOffset] ?? 0) - forceX
  forces[targetOffset + 1] = (forces[targetOffset + 1] ?? 0) - forceY
  forces[targetOffset + 2] = (forces[targetOffset + 2] ?? 0) - forceZ
}

function separateOverlappingNodes(positions: Float32Array): void {
  const nodeCount = positions.length / 3

  for (let first = 0; first < nodeCount; first += 1) {
    for (let second = first + 1; second < nodeCount; second += 1) {
      const firstOffset = first * 3
      const secondOffset = second * 3
      const deltaX =
        (positions[secondOffset] ?? 0) - (positions[firstOffset] ?? 0)
      const deltaY =
        (positions[secondOffset + 1] ?? 0) -
        (positions[firstOffset + 1] ?? 0)
      const deltaZ =
        (positions[secondOffset + 2] ?? 0) -
        (positions[firstOffset + 2] ?? 0)
      const distance = Math.sqrt(
        deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ,
      )

      if (distance >= MIN_NODE_DISTANCE) {
        continue
      }

      const direction =
        distance > 0
          ? ([deltaX / distance, deltaY / distance, deltaZ / distance] as const)
          : deterministicDirection(first, second)
      const adjustment = (MIN_NODE_DISTANCE - distance) / 2 + 0.001

      positions[firstOffset] =
        (positions[firstOffset] ?? 0) - direction[0] * adjustment
      positions[firstOffset + 1] =
        (positions[firstOffset + 1] ?? 0) - direction[1] * adjustment
      positions[firstOffset + 2] =
        (positions[firstOffset + 2] ?? 0) - direction[2] * adjustment
      positions[secondOffset] =
        (positions[secondOffset] ?? 0) + direction[0] * adjustment
      positions[secondOffset + 1] =
        (positions[secondOffset + 1] ?? 0) + direction[1] * adjustment
      positions[secondOffset + 2] =
        (positions[secondOffset + 2] ?? 0) + direction[2] * adjustment

      clampToRadius(positions, first, LAYOUT_RADIUS)
      clampToRadius(positions, second, LAYOUT_RADIUS)
    }
  }
}

function clampToRadius(
  positions: Float32Array,
  index: number,
  radius: number,
): void {
  const offset = index * 3
  const x = positions[offset] ?? 0
  const y = positions[offset + 1] ?? 0
  const z = positions[offset + 2] ?? 0
  const distance = Math.sqrt(x * x + y * y + z * z)

  if (distance <= radius || distance === 0) {
    return
  }

  const scale = radius / distance
  positions[offset] = x * scale
  positions[offset + 1] = y * scale
  positions[offset + 2] = z * scale
}

function groupCommitsByPath(
  commits: GithubCommit[],
): Map<string, GithubCommit[]> {
  const commitsByPath = new Map<string, GithubCommit[]>()

  for (const commit of commits) {
    if (!commit.path) {
      continue
    }

    const normalizedPath = normalizePath(commit.path)
    const pathCommits = commitsByPath.get(normalizedPath) ?? []
    pathCommits.push(commit)
    commitsByPath.set(normalizedPath, pathCommits)
  }

  return commitsByPath
}

function issueMentionsFile(issue: GithubIssue, filePath: string): boolean {
  const fileName = getFileName(filePath)
  const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  const fileNamePattern = new RegExp(
    `(^|[^\\w.-])${escapedFileName}($|[^\\w.-])`,
    'u',
  )

  return (
    issue.filePaths.some((issuePath) => {
      const normalizedIssuePath = normalizePath(issuePath)

      return (
        normalizedIssuePath === filePath ||
        getFileName(normalizedIssuePath) === fileName
      )
    }) || fileNamePattern.test(issue.body)
  )
}

function hasRecentCommit(commits: GithubCommit[], now: number): boolean {
  const latestCommitTime = commits.reduce((latestTime, commit) => {
    const commitTime = Date.parse(commit.authorDate)

    return Number.isFinite(commitTime)
      ? Math.max(latestTime, commitTime)
      : latestTime
  }, Number.NEGATIVE_INFINITY)
  const age = now - latestCommitTime

  return age >= 0 && age <= RECENT_WINDOW_MS
}

function detectLanguage(filePath: string): string {
  const extension = getExtension(filePath)
  const languages: Record<string, string> = {
    '.css': 'CSS',
    '.html': 'HTML',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.json': 'JSON',
    '.less': 'Less',
    '.md': 'Markdown',
    '.sass': 'Sass',
    '.scss': 'SCSS',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.yaml': 'YAML',
    '.yml': 'YAML',
  }

  return languages[extension] ?? 'Unknown'
}

function getRepoName(files: GithubFile[]): string {
  for (const file of files) {
    const match = /\/repos\/[^/]+\/([^/]+)\//u.exec(file.url)
    const repoName = match?.[1]

    if (repoName) {
      return decodeURIComponent(repoName)
    }
  }

  return ''
}

function createSeed(files: GithubFile[]): number {
  let seed = 2_166_136_261

  for (const file of files) {
    for (const character of file.path) {
      seed ^= character.codePointAt(0) ?? 0
      seed = Math.imul(seed, 16_777_619)
    }
  }

  return seed >>> 0
}

function createRandom(initialSeed: number): () => number {
  let state = initialSeed || 1

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function deterministicDirection(
  firstIndex: number,
  secondIndex: number,
): readonly [number, number, number] {
  const angle = ((firstIndex + 1) * 1.618 + secondIndex) * Math.PI
  const z = (((firstIndex + secondIndex) % 5) - 2) / 2.5
  const planeScale = Math.sqrt(1 - z * z)

  return [planeScale * Math.cos(angle), planeScale * Math.sin(angle), z]
}

function normalizePath(filePath: string): string {
  const segments: string[] = []

  for (const segment of filePath.replace(/\\/gu, '/').split('/')) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      if (segments.length === 0) {
        segments.push(segment)
      } else if (segments.at(-1) === '..') {
        segments.push(segment)
      } else {
        segments.pop()
      }
      continue
    }

    segments.push(segment)
  }

  return segments.join('/')
}

function getDirectoryName(filePath: string): string {
  const separatorIndex = filePath.lastIndexOf('/')
  return separatorIndex === -1 ? '' : filePath.slice(0, separatorIndex)
}

function getFileName(filePath: string): string {
  return filePath.slice(filePath.lastIndexOf('/') + 1)
}

function getFileLabel(filePath: string): string {
  const fileName = getFileName(filePath)
  const extensionIndex = fileName.lastIndexOf('.')

  return extensionIndex <= 0 ? fileName : fileName.slice(0, extensionIndex)
}

function getExtension(filePath: string): string {
  const fileName = getFileName(filePath)
  const extensionIndex = fileName.lastIndexOf('.')

  return extensionIndex <= 0 ? '' : fileName.slice(extensionIndex).toLowerCase()
}
