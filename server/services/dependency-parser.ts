const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

interface ParsedImport {
  specifier: string;
  isRelative: boolean;
}

/**
 * Parse import/require statements from JavaScript/TypeScript source code.
 * Handles ES modules, CommonJS, and dynamic imports.
 */
export function parseImports(content: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const seen = new Set<string>();

  // Strip comments to avoid false matches
  const cleaned = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of cleaned.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier || seen.has(specifier)) continue;
      seen.add(specifier);

      const isRelative = specifier.startsWith('.') || specifier.startsWith('/');
      // Skip node_modules references
      if (specifier.includes('node_modules')) continue;
      imports.push({ specifier, isRelative });
    }
  }

  return imports;
}

/**
 * Resolve a relative import path against a source file to find the target file.
 */
export function resolveImport(
  sourceFile: string,
  importSpecifier: string,
  allFiles: Set<string>,
): string | null {
  if (!importSpecifier.startsWith('.')) return null;

  const cleanSpecifier = importSpecifier.split(/[?#]/)[0];
  if (!cleanSpecifier) return null;

  const sourceDir = getDirectory(sourceFile);
  const resolved = normalizePath(`${sourceDir}/${cleanSpecifier}`);

  if (resolved.startsWith('../')) return null;

  // Direct match
  if (allFiles.has(resolved)) return resolved;

  // Try adding extensions
  const ext = getExtension(resolved);
  if (!SCRIPT_EXTENSIONS.has(ext)) {
    for (const tryExt of SCRIPT_EXTENSIONS) {
      const candidate = `${resolved}${tryExt}`;
      if (allFiles.has(candidate)) return candidate;
    }
    // Try index files
    for (const tryExt of SCRIPT_EXTENSIONS) {
      const candidate = `${resolved}/index${tryExt}`;
      if (allFiles.has(candidate)) return candidate;
    }
  }

  return null;
}

/**
 * Build edges from import analysis.
 */
export function buildDependencyEdges(
  files: Array<{ path: string }>,
  contents: Map<string, string>,
): Array<{ source: string; target: string }> {
  const filePaths = new Set(files.map((f) => normalizePath(f.path)));
  const edgeKeys = new Set<string>();
  const edges: Array<{ source: string; target: string }> = [];

  for (const file of files) {
    const source = normalizePath(file.path);
    const content = contents.get(file.path) ?? contents.get(source);
    if (!content) continue;

    // Only parse JS/TS files for imports
    const ext = getExtension(source);
    if (!SCRIPT_EXTENSIONS.has(ext)) continue;

    const imports = parseImports(content);
    for (const imp of imports) {
      if (!imp.isRelative) continue;
      const target = resolveImport(source, imp.specifier, filePaths);
      if (!target) continue;

      const key = `${source}\0${target}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ source, target });
    }
  }

  return edges;
}

/** Detect programming language from file extension */
export function detectLanguage(filePath: string): string {
  const ext = getExtension(filePath);
  const languages: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
    '.html': 'HTML', '.htm': 'HTML',
    '.json': 'JSON',
    '.md': 'Markdown', '.mdx': 'MDX',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.py': 'Python', '.rb': 'Ruby', '.go': 'Go',
    '.rs': 'Rust', '.java': 'Java', '.kt': 'Kotlin',
    '.swift': 'Swift', '.c': 'C', '.cpp': 'C++', '.h': 'C',
    '.cs': 'C#', '.php': 'PHP', '.vue': 'Vue', '.svelte': 'Svelte',
  };
  return languages[ext] ?? 'Unknown';
}

/** Classify file type for visualization */
export function classifyFile(filePath: string): string {
  const normalized = filePath.toLowerCase();
  const fileName = getFileName(normalized);
  const ext = getExtension(fileName);

  if (['main.tsx', 'main.ts', 'main.jsx', 'main.js', 'index.ts', 'index.js', 'app.tsx', 'app.ts'].includes(fileName)) return 'entry';
  if (/(?:^|\/)__tests__(?:\/|$)/.test(normalized) || /\.(?:test|spec)\.[^.]+$/.test(fileName)) return 'test';
  if (['.css', '.scss', '.sass', '.less'].includes(ext)) return 'style';
  if (fileName === 'package.json' || /^tsconfig/.test(fileName) || /\.config\.[^.]+$/.test(fileName)) return 'config';
  if (/(?:^|\/)(?:src\/)?store(?:\/|$)/.test(normalized)) return 'store';
  if (/(?:^|\/)(?:src\/)?(?:lib|utils?)(?:\/|$)/.test(normalized)) return 'util';
  if (ext === '.tsx' || ext === '.jsx') return 'component';
  return 'unknown';
}

function normalizePath(filePath: string): string {
  const segments: string[] = [];
  for (const seg of filePath.replace(/\\/g, '/').split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (segments.length === 0 || segments.at(-1) === '..') segments.push(seg);
      else segments.pop();
      continue;
    }
    segments.push(seg);
  }
  return segments.join('/');
}

function getDirectory(filePath: string): string {
  const idx = filePath.lastIndexOf('/');
  return idx === -1 ? '' : filePath.slice(0, idx);
}

function getFileName(filePath: string): string {
  return filePath.slice(filePath.lastIndexOf('/') + 1);
}

function getExtension(filePath: string): string {
  const name = getFileName(filePath);
  const idx = name.lastIndexOf('.');
  return idx <= 0 ? '' : name.slice(idx).toLowerCase();
}
