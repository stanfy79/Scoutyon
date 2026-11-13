import { apiClient } from './client';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '../types/budget.types';

export async function getBudgets(): Promise<Budget[]> {
  return apiClient<Budget[]>('/api/budgets');
}

export async function getBudgetById(id: string): Promise<Budget> {
  return apiClient<Budget>(`/api/budgets/${id}`);
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  return apiClient<Budget>('/api/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
  return apiClient<Budget>(`/api/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  return apiClient<void>(`/api/budgets/${id}`, {
    method: 'DELETE',
  });
}
