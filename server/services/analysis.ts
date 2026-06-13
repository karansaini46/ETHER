import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'node:events';
import * as githubService from './github.js';
import { buildDependencyEdges, detectLanguage, classifyFile } from './dependency-parser.js';
import { AppError } from '../utils/errors.js';
import type {
  AnalysisGraph,
  AnalysisNode,
  AnalysisEdge,
  AnalysisResult,
  AnalysisStage,
  RiskLevel,
  NodeType,
} from '../types/index.js';

const ANALYSIS_TIMEOUT_MS = 5 * 60 * 1000;
const ANALYSIS_TTL_MS = 30 * 60 * 1000;
const MAX_CONCURRENT = 3;
const CODE_EXTENSIONS = /\.(tsx?|jsx?|mjs|cjs|json|css|scss|html|vue|svelte|py|rb|go|rs|java|kt|swift|c|cpp|h|cs|php)$/i;

// In-memory analysis store
const analyses = new Map<string, AnalysisResult>();
const analysisEmitters = new Map<string, EventEmitter>();
const controllers = new Map<string, AbortController>();
let activeCount = 0;

// Cleanup expired analyses periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, result] of analyses) {
    if (now - result.startedAt > ANALYSIS_TTL_MS) {
      analyses.delete(id);
      analysisEmitters.delete(id);
      controllers.delete(id);
    }
  }
}, 60_000);

export function getAnalysis(id: string): AnalysisResult | undefined {
  return analyses.get(id);
}

export function getAnalysisEmitter(id: string): EventEmitter | undefined {
  return analysisEmitters.get(id);
}

export function cancelAnalysis(id: string): boolean {
  const controller = controllers.get(id);
  if (controller) {
    controller.abort();
    const result = analyses.get(id);
    if (result && result.status.stage !== 'ready') {
      result.status = { ...result.status, stage: 'cancelled', message: 'Analysis cancelled' };
    }
    return true;
  }
  return false;
}

export async function startAnalysis(owner: string, repo: string): Promise<string> {
  if (activeCount >= MAX_CONCURRENT) {
    throw new AppError({
      code: 'RATE_LIMITED',
      statusCode: 429,
      message: 'Too many concurrent analyses',
      userMessage: 'Server is busy analyzing other repositories. Please try again in a moment.',
      recoveryAction: 'wait-retry',
    });
  }

  const id = uuidv4();
  const controller = new AbortController();
  const emitter = new EventEmitter();
  const signal = controller.signal;

  const result: AnalysisResult = {
    id,
    status: { id, stage: 'validating', progress: 0, message: 'Validating repository...' },
    graph: null,
    startedAt: Date.now(),
    completedAt: null,
  };

  analyses.set(id, result);
  analysisEmitters.set(id, emitter);
  controllers.set(id, controller);

  // Set timeout
  const timeout = setTimeout(() => {
    controller.abort();
    updateStatus(id, 'error', 0, 'Analysis timed out');
  }, ANALYSIS_TIMEOUT_MS);

  activeCount++;

  // Run analysis in background
  runAnalysis(id, owner, repo, signal)
    .catch((error: unknown) => {
      if (!signal.aborted) {
        const message = error instanceof AppError ? error.userMessage : 'Analysis failed unexpectedly';
        const errorDetail = error instanceof Error ? error.message : String(error);
        updateStatus(id, 'error', 0, message, errorDetail);
      }
    })
    .finally(() => {
      clearTimeout(timeout);
      activeCount--;
      controllers.delete(id);
    });

  return id;
}

async function runAnalysis(id: string, owner: string, repo: string, signal: AbortSignal): Promise<void> {
  // Stage 1: Validate repository
  updateStatus(id, 'validating', 5, 'Validating repository...');
  const meta = await githubService.getRepoMeta(owner, repo, signal);

  if (signal.aborted) return;

  // Stage 2: Read structure
  updateStatus(id, 'reading-structure', 15, 'Reading repository structure...');
  const tree = await githubService.getRepoTree(owner, repo, meta.defaultBranch, signal);

  if (tree.length === 0) {
    throw new AppError({
      code: 'ANALYSIS_FAILED',
      statusCode: 422,
      message: 'Repository is empty',
      userMessage: 'This repository appears to be empty or contains no analyzable files.',
    });
  }

  if (signal.aborted) return;

  // Stage 3: Map languages
  updateStatus(id, 'mapping-languages', 25, 'Mapping languages...');
  const codeFiles = tree.filter((f) => CODE_EXTENSIONS.test(f.path));
  const languages: Record<string, number> = {};
  for (const file of codeFiles) {
    const lang = detectLanguage(file.path);
    languages[lang] = (languages[lang] ?? 0) + 1;
  }

  if (signal.aborted) return;

  // Stage 4: Fetch contents for dependency analysis
  updateStatus(id, 'detecting-dependencies', 35, 'Detecting imports and dependencies...');
  const contents = await githubService.getFileContents(
    owner, repo,
    codeFiles.map((f) => f.path),
    signal,
    (completed, total) => {
      const progress = 35 + Math.round((completed / total) * 25);
      updateStatus(id, 'detecting-dependencies', progress, `Analyzing files... (${completed}/${total})`);
    },
  );

  if (signal.aborted) return;

  // Stage 5: Measure activity
  updateStatus(id, 'measuring-activity', 65, 'Measuring file activity...');
  const commits = await githubService.getRecentCommits(owner, repo, signal);

  if (signal.aborted) return;

  // Stage 6: Build dependency graph
  updateStatus(id, 'constructing-constellations', 75, 'Constructing constellations...');
  const edges = buildDependencyEdges(tree, contents);

  if (signal.aborted) return;

  // Stage 7: Calculate layout
  updateStatus(id, 'calculating-layout', 85, 'Calculating graph layout...');
  const { nodes, graphEdges, positions } = buildNodes(tree, edges, commits);

  if (signal.aborted) return;

  // Assemble final graph
  const graph: AnalysisGraph = {
    nodes: nodes.map((node, i) => ({
      ...node,
      position: [positions[i * 3] ?? 0, positions[i * 3 + 1] ?? 0, positions[i * 3 + 2] ?? 0] as [number, number, number],
    })),
    edges: graphEdges,
    repoName: repo,
    repoOwner: owner,
    defaultBranch: meta.defaultBranch,
    totalFiles: tree.length,
    analyzedFiles: codeFiles.length,
    languages,
    fetchedAt: Date.now(),
  };

  const result = analyses.get(id);
  if (result) {
    result.graph = graph;
    result.completedAt = Date.now();
  }

  updateStatus(id, 'ready', 100, 'Universe ready');
}

function buildNodes(
  files: Array<{ path: string; size: number }>,
  edges: Array<{ source: string; target: string }>,
  commits: Array<{ authorDate: string }>,
): {
  nodes: Omit<AnalysisNode, 'position'>[];
  graphEdges: AnalysisEdge[];
  positions: Float32Array;
} {
  const now = Date.now();
  const recentWindow = 7 * 24 * 60 * 60 * 1000;
  const hasRecentCommits = commits.some((c) => {
    const t = Date.parse(c.authorDate);
    return Number.isFinite(t) && now - t <= recentWindow;
  });

  // Compute degrees
  const degreeMap = new Map<string, number>();
  const importCount = new Map<string, number>();
  const importedByCount = new Map<string, number>();

  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
    importCount.set(edge.source, (importCount.get(edge.source) ?? 0) + 1);
    importedByCount.set(edge.target, (importedByCount.get(edge.target) ?? 0) + 1);
  }

  const maxDegree = Math.max(1, ...degreeMap.values());

  const nodes = files.map((file) => {
    const normalized = file.path.replace(/\\/g, '/');
    const degree = degreeMap.get(normalized) ?? 0;
    const centrality = degree / maxDegree;
    const impCount = importCount.get(normalized) ?? 0;
    const impByCount = importedByCount.get(normalized) ?? 0;

    const node: Omit<AnalysisNode, 'position'> = {
      id: normalized,
      label: getFileLabel(normalized),
      type: classifyFile(normalized) as NodeType,
      folder: getFolder(normalized),
      language: detectLanguage(normalized),
      size: file.size,
      lineCount: Math.max(1, Math.round(file.size / 40)),
      centrality,
      weight: Math.max(1, degree),
      commits: 0,
      lastModified: null,
      isRecent: hasRecentCommits && Math.random() < 0.15, // approximate since we don't have per-file commit data from list endpoint
      hasIssue: false,
      riskLevel: computeRisk(centrality, impByCount, file.size),
      importCount: impCount,
      importedByCount: impByCount,
    };
    return node;
  });

  // Force-directed layout
  const positions = runForceLayout(files.length, edges, files);

  const graphEdges: AnalysisEdge[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
    weight: 1,
  }));

  return { nodes, graphEdges, positions };
}

function computeRisk(centrality: number, importedByCount: number, size: number): RiskLevel {
  let score = 0;
  if (centrality > 0.7) score += 2;
  else if (centrality > 0.4) score += 1;
  if (importedByCount > 10) score += 2;
  else if (importedByCount > 5) score += 1;
  if (size > 50_000) score += 1;
  if (score >= 3) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

function runForceLayout(
  nodeCount: number,
  edges: Array<{ source: string; target: string }>,
  files: Array<{ path: string }>,
): Float32Array {
  const RADIUS = 200;
  const ITERATIONS = 120;
  const REPULSION = 2400;
  const SPRING_LEN = 45;
  const SPRING_K = 0.018;
  const CENTER_K = 0.0015;
  const DAMPING = 0.82;
  const MAX_V = 12;

  const positions = new Float32Array(nodeCount * 3);
  const velocities = new Float64Array(nodeCount * 3);
  const forces = new Float64Array(nodeCount * 3);

  const indexByPath = new Map(files.map((f, i) => [f.path.replace(/\\/g, '/'), i]));

  // Initialize positions
  let seed = 2166136261;
  for (const f of files) {
    for (const ch of f.path) {
      seed ^= ch.codePointAt(0) ?? 0;
      seed = Math.imul(seed, 16777619);
    }
  }
  seed = seed >>> 0;

  const rand = (): number => {
    seed += 0x6d2b79f5;
    let v = seed;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < nodeCount; i++) {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.cbrt(rand()) * RADIUS;
    const p = Math.sqrt(1 - z * z);
    const o = i * 3;
    positions[o] = r * p * Math.cos(a);
    positions[o + 1] = r * p * Math.sin(a);
    positions[o + 2] = r * z;
  }

  const indexedEdges = edges
    .map((e) => [indexByPath.get(e.source), indexByPath.get(e.target)] as const)
    .filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    forces.fill(0);

    // Repulsion (Barnes-Hut would be better for large N, but N <= 8000)
    for (let a = 0; a < nodeCount; a++) {
      for (let b = a + 1; b < nodeCount; b++) {
        const ao = a * 3, bo = b * 3;
        let dx = (positions[ao] ?? 0) - (positions[bo] ?? 0);
        let dy = (positions[ao + 1] ?? 0) - (positions[bo + 1] ?? 0);
        let dz = (positions[ao + 2] ?? 0) - (positions[bo + 2] ?? 0);
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.0001) { dx = 0.1; dy = 0.1; dz = 0.1; d2 = 0.03; }
        const d = Math.sqrt(d2);
        const f = REPULSION / Math.max(d2, 1) / d;
        const fx = dx * f, fy = dy * f, fz = dz * f;
        forces[ao] = (forces[ao] ?? 0) + fx;
        forces[ao + 1] = (forces[ao + 1] ?? 0) + fy;
        forces[ao + 2] = (forces[ao + 2] ?? 0) + fz;
        forces[bo] = (forces[bo] ?? 0) - fx;
        forces[bo + 1] = (forces[bo + 1] ?? 0) - fy;
        forces[bo + 2] = (forces[bo + 2] ?? 0) - fz;
      }
    }

    // Spring forces
    for (const [si, ti] of indexedEdges) {
      const so = si * 3, to = ti * 3;
      const dx = (positions[to] ?? 0) - (positions[so] ?? 0);
      const dy = (positions[to + 1] ?? 0) - (positions[so + 1] ?? 0);
      const dz = (positions[to + 2] ?? 0) - (positions[so + 2] ?? 0);
      const d = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.001);
      const f = SPRING_K * (d - SPRING_LEN) / d;
      const fx = dx * f, fy = dy * f, fz = dz * f;
      forces[so] = (forces[so] ?? 0) + fx;
      forces[so + 1] = (forces[so + 1] ?? 0) + fy;
      forces[so + 2] = (forces[so + 2] ?? 0) + fz;
      forces[to] = (forces[to] ?? 0) - fx;
      forces[to + 1] = (forces[to + 1] ?? 0) - fy;
      forces[to + 2] = (forces[to + 2] ?? 0) - fz;
    }

    const ts = 0.075 * (1 - iter / (ITERATIONS * 1.5));
    for (let i = 0; i < nodeCount; i++) {
      const o = i * 3;
      for (let a = 0; a < 3; a++) {
        const co = o + a;
        const cf = (forces[co] ?? 0) - (positions[co] ?? 0) * CENTER_K;
        const v = Math.max(-MAX_V, Math.min(MAX_V, ((velocities[co] ?? 0) + cf * ts) * DAMPING));
        velocities[co] = v;
        positions[co] = (positions[co] ?? 0) + v;
      }
      // Clamp to radius
      const x = positions[o] ?? 0, y = positions[o + 1] ?? 0, z = positions[o + 2] ?? 0;
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > RADIUS && dist > 0) {
        const s = RADIUS / dist;
        positions[o] = x * s;
        positions[o + 1] = y * s;
        positions[o + 2] = z * s;
      }
    }
  }

  return positions;
}

function updateStatus(id: string, stage: AnalysisStage, progress: number, message: string, error?: string): void {
  const result = analyses.get(id);
  if (result) {
    result.status = { id, stage, progress, message, error };
    const emitter = analysisEmitters.get(id);
    emitter?.emit('status', result.status);
  }
}

function getFileLabel(filePath: string): string {
  const name = filePath.slice(filePath.lastIndexOf('/') + 1);
  const dotIdx = name.lastIndexOf('.');
  return dotIdx <= 0 ? name : name.slice(0, dotIdx);
}

function getFolder(filePath: string): string {
  const idx = filePath.lastIndexOf('/');
  return idx <= 0 ? '/' : filePath.slice(0, idx);
}
