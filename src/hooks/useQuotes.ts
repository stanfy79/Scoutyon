import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotes, getQuoteById, rejectQuote } from '../api/quotes.api';
import { confirmPayment, prepareQuotePayment } from '../api/payments.api';

export function useQuotes(sessionId?: string) {
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['quotes', sessionId],
    queryFn: () => getQuotes(sessionId),
  });

  const preparePaymentMutation = useMutation({
    mutationFn: (quoteId: string) => prepareQuotePayment(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => confirmPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason?: string }) =>
      rejectQuote(quoteId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  return {
    quotes: quotesQuery.data || [],
    isLoading: quotesQuery.isLoading,
    isError: quotesQuery.isError,
    error: quotesQuery.error,
    refetch: quotesQuery.refetch,
    preparePayment: preparePaymentMutation.mutateAsync,
    isPreparingPayment: preparePaymentMutation.isPending,
    confirmPayment: confirmPaymentMutation.mutateAsync,
    isConfirmingPayment: confirmPaymentMutation.isPending,
    rejectQuote: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  };
}

export function useQuote(id?: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => (id ? getQuoteById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}
