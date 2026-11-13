export type PurchaseStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'paid'
  | 'fulfilled'
  | 'failed';

export interface PurchaseActivity {
  type: string;
  message: string;
  createdAt: string;
}

export interface Purchase {
  _id: string;
  budgetId: string;
  vendorId?: string | null;
  vendorName?: string;
  quoteId?: string | null;
  title: string;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  amount: number;
  justification?: string;
  status: PurchaseStatus;
  paymentAttemptId?: string | null;
  fulfillmentStatus?: 'pending' | 'fulfilled' | 'failed';
  activity: PurchaseActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseInput {
  budgetId: string;
  title: string;
  description: string;
  category?: string;
  vendorName?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  amount?: number;
  justification?: string;
}

export interface PurchaseAnalytics {
  totalPurchases: number;
  byStatus: Record<string, number>;
  averageAmount: number;
  totalAmount: number;
}
