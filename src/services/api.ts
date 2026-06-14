import type { AnalysisStatus, ApiError } from '@/types/api';
import type { GraphData } from '@/types/graph';
import type { NavigatorResponse } from '@/types/navigator';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as ApiError;
      throw new ApiRequestError(
        response.status,
        body.code ?? 'UNKNOWN_ERROR',
        body.message ?? `Request failed (${response.status})`,
        body.recoveryAction,
      );
    }

    return response.json() as Promise<T>;
  }

  async healthCheck(): Promise<{ status: string; ai: boolean; github: boolean }> {
    return this.request('/health');
  }

  async navigatorStatus(): Promise<{ available: boolean; provider: string | null }> {
    return this.request('/navigator/status');
  }

  async startAnalysis(url: string, signal?: AbortSignal): Promise<{ id: string }> {
    return this.request('/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
  }

  subscribeToAnalysis(analysisId: string, onStatus: (status: AnalysisStatus) => void, onError: (error: string) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/repositories/${analysisId}/status`);

    eventSource.onmessage = (event) => {
      try {
        const status = JSON.parse(event.data) as AnalysisStatus;
        onStatus(status);
        if (status.stage === 'ready' || status.stage === 'error' || status.stage === 'cancelled') {
          eventSource.close();
        }
      } catch {
        onError('Failed to parse analysis status');
      }
    };

    eventSource.onerror = () => {
      onError('Lost connection to analysis stream');
      eventSource.close();
    };

    return () => eventSource.close();
  }

  async getGraph(analysisId: string): Promise<GraphData> {
    return this.request(`/repositories/${analysisId}/graph`);
  }

  async cancelAnalysis(analysisId: string): Promise<void> {
    await this.request(`/repositories/${analysisId}/cancel`, { method: 'POST' });
  }

  async queryNavigator(
    analysisId: string,
    message: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<NavigatorResponse> {
    return this.request(`/repositories/${analysisId}/navigator`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  }
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly recoveryAction?: string;

  constructor(status: number, code: string, message: string, recoveryAction?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.recoveryAction = recoveryAction;
  }
}

export const api = new ApiClient();
