export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';

export interface Quote {
  _id: string;
  sessionId: string;
  userId: string;
  budgetId?: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  sourceUrl: string;
  status: QuoteStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
