export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolName?: string;
  timestamp: string;
  quoteId?: string;
  sources?: string[];
}

export type SessionStatus = 'active' | 'completed' | 'failed';

export interface AgentSessionSummary {
  _id: string;
  userId: string;
  budgetId?: string;
  goal: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSessionDetail extends AgentSessionSummary {
  messages: Array<{
    role: MessageRole;
    content: string;
    toolName?: string;
    timestamp: string;
  }>;
}

export interface ActivityStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'quote' | 'error' | 'done';
  title: string;
  details?: string;
  timestamp: string;
  status: 'pending' | 'running' | 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export interface SSEQuoteData {
  quoteId: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  sourceUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';
}

export type SSEEvent =
  | { type: 'session'; data: { sessionId: string } }
  | { type: 'text'; data: { text: string } }
  | { type: 'tool_call'; data: { name: string; args: Record<string, unknown> } }
  | { type: 'tool_result'; data: { name: string; preview?: string; quoteId?: string; error?: string } }
  | { type: 'quote'; data: SSEQuoteData }
  | { type: 'error'; data: { tool?: string; message: string } }
  | { type: 'done'; data: Record<string, unknown> };

export interface ProviderComparisonItem {
  provider: string;
  description: string;
  price?: number;
  currency?: string;
  sourceUrl?: string;
  verificationStatus: 'verified' | 'unverified' | 'estimated' | 'unknown';
  suitability?: string;
}
