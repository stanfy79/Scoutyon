import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudgets, getBudgetById, createBudget, updateBudget, deleteBudget } from '../api/budgets.api';
import type { CreateBudgetInput, UpdateBudgetInput } from '../types/budget.types';

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudget(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) =>
      updateBudget(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  return {
    budgets: budgetsQuery.data || [],
    isLoading: budgetsQuery.isLoading,
    isError: budgetsQuery.isError,
    error: budgetsQuery.error,
    refetch: budgetsQuery.refetch,
    createBudget: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateBudget: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteBudget: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useBudget(id?: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => (id ? getBudgetById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}
