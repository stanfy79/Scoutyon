import type { SSEEvent } from '../types/agent.types';

export class SSEStreamParser {
  private buffer = '';
  private onEvent: (event: SSEEvent) => void;

  constructor(onEvent: (event: SSEEvent) => void) {
    this.onEvent = onEvent;
  }

  public feed(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');

    // Keep the last partial line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) {
        continue;
      }

      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr) as SSEEvent;
          if (parsed && typeof parsed === 'object' && 'type' in parsed) {
            this.onEvent(parsed);
          }
        } catch (err) {
          console.warn('[SSEParser] Failed to parse SSE JSON payload:', jsonStr, err);
        }
      }
    }
  }

  public flush(): void {
    if (this.buffer.trim().startsWith('data:')) {
      const jsonStr = this.buffer.trim().slice(5).trim();
      try {
        const parsed = JSON.parse(jsonStr) as SSEEvent;
        if (parsed && typeof parsed === 'object' && 'type' in parsed) {
          this.onEvent(parsed);
        }
      } catch {
        // ignore incomplete final buffer on abort
      }
    }
    this.buffer = '';
  }
}
