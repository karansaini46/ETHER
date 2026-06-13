import type { GraphData, GraphNode, GraphEdge, NodeType } from '@/types/graph';

function node(
  id: string,
  type: NodeType,
  lang: string,
  size: number,
  pos: [number, number, number],
  opts: Partial<GraphNode> = {},
): GraphNode {
  const label = id.split('/').pop()?.replace(/\.[^.]+$/, '') ?? id;
  return {
    id,
    label,
    type,
    folder: id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : '/',
    language: lang,
    size,
    lineCount: Math.round(size / 35),
    position: pos,
    centrality: opts.centrality ?? 0.2,
    weight: opts.weight ?? 2,
    commits: opts.commits ?? Math.floor(Math.random() * 20),
    lastModified: null,
    isRecent: opts.isRecent ?? false,
    hasIssue: opts.hasIssue ?? false,
    riskLevel: opts.riskLevel ?? 'low',
    importCount: opts.importCount ?? 1,
    importedByCount: opts.importedByCount ?? 1,
  };
}

function edge(source: string, target: string): GraphEdge {
  return { source, target, weight: 1 };
}

const nodes: GraphNode[] = [
  // Core entry points
  node('src/main.tsx', 'entry', 'TypeScript', 280, [0, 5, 0], { centrality: 0.95, weight: 12, importedByCount: 0, importCount: 3, isRecent: true }),
  node('src/App.tsx', 'entry', 'TypeScript', 1200, [8, 10, -5], { centrality: 0.9, weight: 10, importedByCount: 1, importCount: 8 }),

  // Auth module
  node('src/features/auth/AuthProvider.tsx', 'component', 'TypeScript', 3200, [-40, 30, 20], { centrality: 0.7, weight: 8, importedByCount: 6, importCount: 4, riskLevel: 'medium' }),
  node('src/features/auth/LoginForm.tsx', 'component', 'TypeScript', 2100, [-50, 35, 25], { centrality: 0.3, importedByCount: 1, importCount: 3, isRecent: true }),
  node('src/features/auth/useAuth.ts', 'util', 'TypeScript', 1800, [-45, 25, 15], { centrality: 0.6, importedByCount: 8, importCount: 2, riskLevel: 'medium' }),
  node('src/features/auth/types.ts', 'util', 'TypeScript', 450, [-35, 28, 18], { centrality: 0.4, importedByCount: 5, importCount: 0 }),
  node('src/features/auth/auth.test.ts', 'test', 'TypeScript', 2800, [-55, 38, 30], { centrality: 0.1 }),

  // Dashboard module
  node('src/features/dashboard/Dashboard.tsx', 'component', 'TypeScript', 4500, [40, 30, -20], { centrality: 0.5, importedByCount: 2, importCount: 6 }),
  node('src/features/dashboard/StatsPanel.tsx', 'component', 'TypeScript', 2200, [50, 35, -15], { centrality: 0.3, importCount: 3 }),
  node('src/features/dashboard/ActivityFeed.tsx', 'component', 'TypeScript', 3100, [45, 40, -25], { centrality: 0.35, importCount: 4, isRecent: true }),
  node('src/features/dashboard/useDashboard.ts', 'util', 'TypeScript', 1500, [35, 25, -18], { centrality: 0.4, importedByCount: 3, importCount: 2 }),

  // API layer
  node('src/services/api.ts', 'util', 'TypeScript', 5200, [0, -30, 40], { centrality: 0.85, weight: 9, importedByCount: 12, importCount: 3, riskLevel: 'high' }),
  node('src/services/http.ts', 'util', 'TypeScript', 2800, [5, -35, 45], { centrality: 0.6, importedByCount: 4, importCount: 1 }),
  node('src/services/auth-api.ts', 'util', 'TypeScript', 1900, [-10, -25, 35], { centrality: 0.45, importedByCount: 3, importCount: 2 }),
  node('src/services/websocket.ts', 'util', 'TypeScript', 3400, [15, -28, 50], { centrality: 0.5, importedByCount: 5, importCount: 2, isRecent: true }),

  // State management
  node('src/stores/appStore.ts', 'store', 'TypeScript', 2900, [0, 50, 0], { centrality: 0.75, weight: 7, importedByCount: 9, importCount: 2, riskLevel: 'medium' }),
  node('src/stores/userStore.ts', 'store', 'TypeScript', 1800, [-10, 55, 5], { centrality: 0.5, importedByCount: 6, importCount: 1 }),
  node('src/stores/notificationStore.ts', 'store', 'TypeScript', 1200, [10, 55, -5], { centrality: 0.3, importedByCount: 3, importCount: 1 }),

  // Shared components
  node('src/components/ui/Button.tsx', 'component', 'TypeScript', 1600, [-20, -10, -30], { centrality: 0.6, importedByCount: 14, importCount: 1, riskLevel: 'medium' }),
  node('src/components/ui/Input.tsx', 'component', 'TypeScript', 1400, [-25, -5, -35], { centrality: 0.5, importedByCount: 10, importCount: 1 }),
  node('src/components/ui/Modal.tsx', 'component', 'TypeScript', 2200, [-15, -15, -25], { centrality: 0.45, importedByCount: 7, importCount: 2 }),
  node('src/components/ui/Card.tsx', 'component', 'TypeScript', 900, [-30, -8, -40], { centrality: 0.35, importedByCount: 8, importCount: 1 }),
  node('src/components/ui/Toast.tsx', 'component', 'TypeScript', 1800, [-10, -12, -28], { centrality: 0.4, importedByCount: 4, importCount: 2, isRecent: true }),
  node('src/components/ui/Spinner.tsx', 'component', 'TypeScript', 400, [-35, -3, -45], { centrality: 0.3, importedByCount: 6 }),

  // Layout
  node('src/components/layout/Header.tsx', 'component', 'TypeScript', 2500, [20, -10, -30], { centrality: 0.5, importedByCount: 2, importCount: 5 }),
  node('src/components/layout/Sidebar.tsx', 'component', 'TypeScript', 3200, [25, -5, -35], { centrality: 0.45, importedByCount: 1, importCount: 4 }),
  node('src/components/layout/Footer.tsx', 'component', 'TypeScript', 800, [30, -15, -25], { centrality: 0.2, importedByCount: 1, importCount: 1 }),

  // Settings
  node('src/features/settings/Settings.tsx', 'component', 'TypeScript', 3800, [-30, -40, 10], { centrality: 0.35, importedByCount: 1, importCount: 5 }),
  node('src/features/settings/ProfileForm.tsx', 'component', 'TypeScript', 2600, [-35, -45, 15], { centrality: 0.25, importCount: 3 }),
  node('src/features/settings/ThemeToggle.tsx', 'component', 'TypeScript', 900, [-25, -35, 5], { centrality: 0.2, importCount: 2 }),

  // Utilities
  node('src/utils/format.ts', 'util', 'TypeScript', 1200, [30, 0, 30], { centrality: 0.55, importedByCount: 9, importCount: 0 }),
  node('src/utils/validation.ts', 'util', 'TypeScript', 2100, [35, 5, 35], { centrality: 0.5, importedByCount: 7, importCount: 0 }),
  node('src/utils/constants.ts', 'util', 'TypeScript', 600, [25, -5, 25], { centrality: 0.4, importedByCount: 6, importCount: 0 }),
  node('src/utils/helpers.ts', 'util', 'TypeScript', 3500, [40, 0, 40], { centrality: 0.45, importedByCount: 5, importCount: 1 }),

  // Config files
  node('tsconfig.json', 'config', 'JSON', 680, [60, -50, 0], { centrality: 0.1 }),
  node('package.json', 'config', 'JSON', 1400, [65, -45, 5], { centrality: 0.15 }),
  node('vite.config.ts', 'config', 'TypeScript', 350, [55, -55, -5], { centrality: 0.1 }),
  node('tailwind.config.ts', 'config', 'TypeScript', 400, [70, -48, 10], { centrality: 0.1 }),
  node('.eslintrc.js', 'config', 'JavaScript', 500, [58, -52, -10], { centrality: 0.05 }),

  // Styles
  node('src/styles/globals.css', 'style', 'CSS', 2800, [-60, 0, -10], { centrality: 0.3, importedByCount: 1 }),
  node('src/styles/variables.css', 'style', 'CSS', 1200, [-65, 5, -5], { centrality: 0.25, importedByCount: 2 }),
  node('src/styles/animations.css', 'style', 'CSS', 900, [-55, -5, -15], { centrality: 0.2, importedByCount: 1 }),

  // Tests
  node('src/features/dashboard/Dashboard.test.tsx', 'test', 'TypeScript', 3200, [50, 45, -30], { centrality: 0.1 }),
  node('src/services/api.test.ts', 'test', 'TypeScript', 4100, [5, -40, 45], { centrality: 0.15, isRecent: true }),
  node('src/utils/validation.test.ts', 'test', 'TypeScript', 1800, [40, 10, 40], { centrality: 0.1 }),

  // Server files
  node('server/index.ts', 'entry', 'TypeScript', 1800, [0, -60, -40], { centrality: 0.6, importedByCount: 0, importCount: 5 }),
  node('server/routes/api.ts', 'util', 'TypeScript', 3200, [10, -65, -35], { centrality: 0.5, importedByCount: 1, importCount: 4, riskLevel: 'medium' }),
  node('server/middleware/auth.ts', 'util', 'TypeScript', 2400, [-5, -58, -45], { centrality: 0.55, importedByCount: 3, importCount: 2, riskLevel: 'high', hasIssue: true }),
  node('server/services/database.ts', 'util', 'TypeScript', 4200, [15, -70, -30], { centrality: 0.65, importedByCount: 5, importCount: 1, riskLevel: 'high' }),
  node('server/services/email.ts', 'util', 'TypeScript', 1600, [20, -62, -50], { centrality: 0.3, importedByCount: 2, importCount: 1 }),

  // Notification system
  node('src/features/notifications/NotificationCenter.tsx', 'component', 'TypeScript', 2800, [60, 20, 20], { centrality: 0.4, importedByCount: 2, importCount: 4, isRecent: true }),
  node('src/features/notifications/NotificationItem.tsx', 'component', 'TypeScript', 1200, [65, 25, 25], { centrality: 0.2, importCount: 2 }),
  node('src/features/notifications/useNotifications.ts', 'util', 'TypeScript', 1500, [55, 15, 15], { centrality: 0.35, importedByCount: 3, importCount: 2 }),
];

const edges: GraphEdge[] = [
  // Core
  edge('src/main.tsx', 'src/App.tsx'),
  edge('src/App.tsx', 'src/features/auth/AuthProvider.tsx'),
  edge('src/App.tsx', 'src/features/dashboard/Dashboard.tsx'),
  edge('src/App.tsx', 'src/components/layout/Header.tsx'),
  edge('src/App.tsx', 'src/components/layout/Sidebar.tsx'),
  edge('src/App.tsx', 'src/stores/appStore.ts'),
  edge('src/App.tsx', 'src/features/settings/Settings.tsx'),
  edge('src/App.tsx', 'src/features/notifications/NotificationCenter.tsx'),
  edge('src/main.tsx', 'src/styles/globals.css'),

  // Auth
  edge('src/features/auth/AuthProvider.tsx', 'src/features/auth/useAuth.ts'),
  edge('src/features/auth/AuthProvider.tsx', 'src/features/auth/types.ts'),
  edge('src/features/auth/AuthProvider.tsx', 'src/stores/userStore.ts'),
  edge('src/features/auth/LoginForm.tsx', 'src/features/auth/useAuth.ts'),
  edge('src/features/auth/LoginForm.tsx', 'src/components/ui/Button.tsx'),
  edge('src/features/auth/LoginForm.tsx', 'src/components/ui/Input.tsx'),
  edge('src/features/auth/useAuth.ts', 'src/services/auth-api.ts'),
  edge('src/features/auth/useAuth.ts', 'src/features/auth/types.ts'),

  // Dashboard
  edge('src/features/dashboard/Dashboard.tsx', 'src/features/dashboard/StatsPanel.tsx'),
  edge('src/features/dashboard/Dashboard.tsx', 'src/features/dashboard/ActivityFeed.tsx'),
  edge('src/features/dashboard/Dashboard.tsx', 'src/features/dashboard/useDashboard.ts'),
  edge('src/features/dashboard/Dashboard.tsx', 'src/components/ui/Card.tsx'),
  edge('src/features/dashboard/StatsPanel.tsx', 'src/components/ui/Card.tsx'),
  edge('src/features/dashboard/ActivityFeed.tsx', 'src/services/api.ts'),
  edge('src/features/dashboard/useDashboard.ts', 'src/services/api.ts'),

  // API
  edge('src/services/api.ts', 'src/services/http.ts'),
  edge('src/services/api.ts', 'src/utils/constants.ts'),
  edge('src/services/auth-api.ts', 'src/services/http.ts'),
  edge('src/services/websocket.ts', 'src/stores/notificationStore.ts'),
  edge('src/services/websocket.ts', 'src/utils/constants.ts'),

  // Stores
  edge('src/stores/appStore.ts', 'src/utils/helpers.ts'),
  edge('src/stores/userStore.ts', 'src/features/auth/types.ts'),

  // Shared UI
  edge('src/components/layout/Header.tsx', 'src/components/ui/Button.tsx'),
  edge('src/components/layout/Header.tsx', 'src/stores/userStore.ts'),
  edge('src/components/layout/Header.tsx', 'src/features/auth/useAuth.ts'),
  edge('src/components/layout/Sidebar.tsx', 'src/components/ui/Button.tsx'),
  edge('src/components/layout/Sidebar.tsx', 'src/stores/appStore.ts'),
  edge('src/components/ui/Toast.tsx', 'src/stores/notificationStore.ts'),

  // Settings
  edge('src/features/settings/Settings.tsx', 'src/features/settings/ProfileForm.tsx'),
  edge('src/features/settings/Settings.tsx', 'src/features/settings/ThemeToggle.tsx'),
  edge('src/features/settings/Settings.tsx', 'src/components/ui/Card.tsx'),
  edge('src/features/settings/ProfileForm.tsx', 'src/components/ui/Button.tsx'),
  edge('src/features/settings/ProfileForm.tsx', 'src/components/ui/Input.tsx'),
  edge('src/features/settings/ProfileForm.tsx', 'src/utils/validation.ts'),

  // Utils
  edge('src/utils/helpers.ts', 'src/utils/constants.ts'),

  // Server
  edge('server/index.ts', 'server/routes/api.ts'),
  edge('server/index.ts', 'server/middleware/auth.ts'),
  edge('server/routes/api.ts', 'server/services/database.ts'),
  edge('server/routes/api.ts', 'server/services/email.ts'),
  edge('server/routes/api.ts', 'server/middleware/auth.ts'),
  edge('server/middleware/auth.ts', 'server/services/database.ts'),

  // Notifications
  edge('src/features/notifications/NotificationCenter.tsx', 'src/features/notifications/NotificationItem.tsx'),
  edge('src/features/notifications/NotificationCenter.tsx', 'src/features/notifications/useNotifications.ts'),
  edge('src/features/notifications/useNotifications.ts', 'src/stores/notificationStore.ts'),
  edge('src/features/notifications/useNotifications.ts', 'src/services/websocket.ts'),

  // Styles
  edge('src/styles/globals.css', 'src/styles/variables.css'),
  edge('src/styles/globals.css', 'src/styles/animations.css'),
];

export const demoGraph: GraphData = {
  nodes,
  edges,
  repoName: 'acme-platform',
  repoOwner: 'demo',
  defaultBranch: 'main',
  totalFiles: nodes.length + 24,
  analyzedFiles: nodes.length,
  languages: {
    TypeScript: 42,
    CSS: 3,
    JSON: 2,
    JavaScript: 1,
  },
  fetchedAt: Date.now(),
};
