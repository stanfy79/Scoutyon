import { apiClient } from './client';

export interface TransferSubmissionResponse {
  success: boolean;
  status: string;
  transfer?: unknown;
  message?: string;
}

export function submitTransferTransaction(
  transferId: string,
  sessionId: string,
  transactionHash: string,
): Promise<TransferSubmissionResponse> {
  return apiClient<TransferSubmissionResponse>(`/api/transfers/${encodeURIComponent(transferId)}/submit`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, transactionHash }),
  });
}
