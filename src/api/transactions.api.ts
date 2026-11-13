import { apiClient } from './client';
import type { Transaction } from '../types/transaction.types';

export async function getTransactions(): Promise<Transaction[]> {
  return apiClient<Transaction[]>('/api/transactions');
}

export async function getTransactionById(id: string): Promise<Transaction> {
  return apiClient<Transaction>(`/api/transactions/${id}`);
}
