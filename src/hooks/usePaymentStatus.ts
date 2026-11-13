import { useQuery } from '@tanstack/react-query';
import { getPaymentStatus } from '../api/payments.api';

const terminalStatuses = new Set([
  'SUCCESS',
  'REFUNDED',
  'FAILED',
  'INCOMPLETE_DEPOSIT',
  'EXPIRED',
]);

export function usePaymentStatus(paymentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['payments', paymentId, 'status'],
    queryFn: () => getPaymentStatus(paymentId!),
    enabled: Boolean(paymentId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && terminalStatuses.has(status) ? false : 15_000;
    },
  });
}
