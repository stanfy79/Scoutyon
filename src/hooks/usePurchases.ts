import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPurchase,
  createPurchase,
  getPurchaseActivity,
  getPurchaseAnalytics,
  getPurchases,
  submitPurchase,
} from '../api/purchases.api';
import type { CreatePurchaseInput } from '../types/purchase.types';

export function usePurchases() {
  const queryClient = useQueryClient();
  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  });
  const analyticsQuery = useQuery({
    queryKey: ['purchase-analytics'],
    queryFn: getPurchaseAnalytics,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['purchases'] }),
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics'] }),
      queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: invalidate,
  });
  const submitMutation = useMutation({
    mutationFn: submitPurchase,
    onSuccess: invalidate,
  });
  const cancelMutation = useMutation({
    mutationFn: cancelPurchase,
    onSuccess: invalidate,
  });

  return {
    purchases: purchasesQuery.data ?? [],
    isLoading: purchasesQuery.isLoading || analyticsQuery.isLoading,
    isError: purchasesQuery.isError || analyticsQuery.isError,
    error: purchasesQuery.error ?? analyticsQuery.error,
    refetch: async () => {
      await Promise.all([purchasesQuery.refetch(), analyticsQuery.refetch()]);
    },
    analytics: analyticsQuery.data,
    createPurchase: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    submitPurchase: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    cancelPurchase: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}

export function usePurchaseActivity(purchaseId?: string) {
  return useQuery({
    queryKey: ['purchases', purchaseId, 'activity'],
    queryFn: () => getPurchaseActivity(purchaseId!),
    enabled: Boolean(purchaseId),
  });
}
