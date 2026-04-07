// base URL for all backend calls
// SSE streaming is handled separately in useSSEStream.ts
export const API_BASE = 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  version: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
