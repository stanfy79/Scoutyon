import type { Quote } from './quote.types';

export type TxStatus = 'simulated' | 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  _id: string;
  quoteId: string | Quote;
  userId: string;
  provider: string;
  amount: number;
  currency: string;
  nearIntentId?: string;
  txHash?: string;
  status: TxStatus;
  simulated: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
