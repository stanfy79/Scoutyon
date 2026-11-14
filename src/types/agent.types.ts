import type { PrivyWalletAction, TransferExecutableQuote, TransferQuotePreview } from './transfer.types';

export type MessageRole = 'user' | 'assistant' | 'tool';
export type ChatResponseType =
  | 'research_result'
  | 'general_response'
  | 'transfer_quote_preview'
  | 'transfer_preparation'
  | 'transfer_authorization'
  | 'transfer_status'
  | 'transfer_error'
  | 'normal_message';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolName?: string;
  timestamp: string;
  quoteId?: string;
  sources?: string[];
  responseType?: ChatResponseType;
  structuredData?: TransferQuotePreview | TransferExecutableQuote | PrivyWalletAction | Record<string, unknown>;
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
  transactionContext?: {
    quoteId?: string | null;
    transactionStatus?: string;
    quoteExpiry?: string | null;
    activeTransactionIntent?: string;
  };
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
  | { type: 'tool_result'; data: { name: string; preview?: string; quoteId?: string; error?: string; result?: unknown } }
  | { type: 'quote'; data: SSEQuoteData | TransferQuotePreview | TransferExecutableQuote }
  | { type: 'wallet_action'; data: PrivyWalletAction }
  | { type: 'intent'; data: { intent?: string; status?: string; [key: string]: unknown } }
  | { type: 'response_metadata'; data: { responseType: ChatResponseType; quoteId?: string } }
  | { type: 'error'; data: { tool?: string; code?: string; message: string } }
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
