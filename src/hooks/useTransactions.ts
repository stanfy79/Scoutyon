import { useQuery } from '@tanstack/react-query';
import { getTransactions, getTransactionById } from '../api/transactions.api';

export function useTransactions() {
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
  };
}

export function useTransaction(id?: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => (id ? getTransactionById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}
