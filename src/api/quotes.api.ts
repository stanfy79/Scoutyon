import { apiClient } from './client';
import type { Quote } from '../types/quote.types';

export async function getQuotes(sessionId?: string): Promise<Quote[]> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return apiClient<Quote[]>(`/api/quotes${query}`);
}

export async function getQuoteById(id: string): Promise<Quote> {
  return apiClient<Quote>(`/api/quotes/${id}`);
}

export async function rejectQuote(id: string, reason?: string): Promise<Quote> {
  return apiClient<Quote>(`/api/quotes/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
