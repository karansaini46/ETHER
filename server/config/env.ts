import fs from 'node:fs';
import path from 'node:path';

// Load .env file manually (no dotenv dependency)
function loadEnvFile(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // Silent fail — env vars may be set externally
  }
}

loadEnvFile();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigin: string;
  githubToken: string | null;
  geminiApiKey: string | null;
  githubClientId: string | null;
  githubClientSecret: string | null;
  sessionSecret: string;
}

function parsePort(value: string | undefined): number {
  const port = Number(value);
  if (!Number.isFinite(port) || port < 1 || port > 65535) return 3001;
  return port;
}

function parseNodeEnv(value: string | undefined): ServerConfig['nodeEnv'] {
  if (value === 'production') return 'production';
  if (value === 'test') return 'test';
  return 'development';
}

export function loadConfig(): ServerConfig {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const config: ServerConfig = {
    port: parsePort(process.env.PORT),
    nodeEnv,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    githubToken: process.env.GITHUB_TOKEN || null,
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    githubClientId: process.env.GITHUB_CLIENT_ID || null,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || null,
    sessionSecret: process.env.SESSION_SECRET || 'ether-dev-secret-change-me',
  };

  // Validate production requirements
  if (nodeEnv === 'production') {
    if (!config.githubToken) {
      console.warn('[config] GITHUB_TOKEN is not set — repository analysis will fail');
    }
    if (config.sessionSecret === 'ether-dev-secret-change-me') {
      console.warn('[config] SESSION_SECRET is using default value — set a strong secret for production');
    }
  }

  return config;
}

export const config = loadConfig();
