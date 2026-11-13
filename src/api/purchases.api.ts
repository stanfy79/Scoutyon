import { apiClient, ApiError } from './client';
import type { CreatePurchaseInput, Purchase, PurchaseActivity, PurchaseAnalytics } from '../types/purchase.types';

function requireEnvelope<T>(value: unknown, key: string): T {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('success' in value) ||
    value.success !== true ||
    !(key in value)
  ) {
    throw new ApiError(502, `Backend returned an invalid ${key} response.`, value);
  }
  return (value as Record<string, unknown>)[key] as T;
}

export async function getPurchases(): Promise<Purchase[]> {
  const response = await apiClient<unknown>('/api/purchases');
  const purchases = requireEnvelope<Purchase[]>(response, 'purchases');
  if (!Array.isArray(purchases)) {
    throw new ApiError(502, 'Backend returned an invalid purchase list.', response);
  }
  return purchases;
}

export async function getPurchase(id: string): Promise<Purchase> {
  const response = await apiClient<unknown>(`/api/purchases/${encodeURIComponent(id)}`);
  return requireEnvelope<Purchase>(response, 'purchase');
}

export async function getPurchaseAnalytics(): Promise<PurchaseAnalytics> {
  const response = await apiClient<unknown>('/api/purchases/analytics');
  return requireEnvelope<PurchaseAnalytics>(response, 'analytics');
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const response = await apiClient<unknown>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return requireEnvelope<Purchase>(response, 'purchase');
}

export async function submitPurchase(id: string): Promise<Purchase> {
  const response = await apiClient<unknown>(`/api/purchases/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
  });
  return requireEnvelope<Purchase>(response, 'purchase');
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const response = await apiClient<unknown>(`/api/purchases/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
  return requireEnvelope<Purchase>(response, 'purchase');
}

export async function getPurchaseActivity(id: string): Promise<PurchaseActivity[]> {
  const response = await apiClient<unknown>(`/api/purchases/${encodeURIComponent(id)}/activity`);
  const activity = requireEnvelope<PurchaseActivity[]>(response, 'activity');
  if (!Array.isArray(activity)) {
    throw new ApiError(502, 'Backend returned invalid purchase activity.', response);
  }
  return activity;
}
