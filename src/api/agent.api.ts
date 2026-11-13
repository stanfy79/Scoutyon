import { apiClient, API_BASE_URL, getCurrentAccessToken, ApiError } from './client';
import type { AgentSessionSummary, AgentSessionDetail, SSEEvent } from '../types/agent.types';
import { SSEStreamParser } from '../utils/sseParser';

export async function getSessions(): Promise<AgentSessionSummary[]> {
  return apiClient<AgentSessionSummary[]>('/api/agent/sessions');
}

export async function getSessionById(id: string): Promise<AgentSessionDetail> {
  return apiClient<AgentSessionDetail>(`/api/agent/sessions/${encodeURIComponent(id)}`);
}

export interface StreamChatParams {
  goal: string;
  budgetId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  onEvent: (event: SSEEvent) => void;
}

function getChatErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'object' || value === null) return fallback;
  if ('error' in value && typeof value.error === 'string') return value.error;
  if ('message' in value && typeof value.message === 'string') return value.message;
  return fallback;
}

export async function streamAgentChat(params: StreamChatParams): Promise<void> {
  const { goal, budgetId, sessionId, signal, onEvent } = params;
  const token = await getCurrentAccessToken();

  if (!token) {
    throw new ApiError(401, 'No Privy access token available. Please authenticate first.');
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/api/agent/chat`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        goal,
        ...(budgetId ? { budgetId } : {}),
        ...(sessionId ? { sessionId } : {}),
      }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      return;
    }
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, `Failed to stream research agent: ${msg}`);
  }

  if (!response.ok) {
    let errData: unknown;
    try {
      errData = await response.json();
    } catch {
      errData = { error: `Server returned ${response.status}` };
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('scoutyon:unauthorized'));
    }
    throw new ApiError(
      response.status,
      getChatErrorMessage(errData, 'Chat stream failed'),
      errData,
    );
  }

  if (!response.body) {
    throw new ApiError(500, 'ReadableStream not supported by browser or empty body returned');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const parser = new SSEStreamParser(onEvent);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value, { stream: true });
      parser.feed(textChunk);
    }
    parser.flush();
  } catch (err) {
    if (signal?.aborted) {
      // Intentionally aborted by user
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}
