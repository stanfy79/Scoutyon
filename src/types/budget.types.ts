export interface Budget {
  _id: string;
  userId: string;
  label: string;
  totalLimit: number;
  spent: number;
  reserved?: number;
  currency: string;
  active: boolean;
  approvedRecipients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  label: string;
  totalLimit: number;
  currency?: string;
  approvedRecipients?: string[];
}

export interface UpdateBudgetInput {
  label?: string;
  totalLimit?: number;
  approvedRecipients?: string[];
  active?: boolean;
}
