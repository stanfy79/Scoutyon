import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  discoverVendors,
  getVendors,
  refreshVendor,
  verifyVendor,
} from '../api/vendors.api';
import type { VendorDiscoveryInput } from '../types/vendor.types';

export function useVendors() {
  const queryClient = useQueryClient();
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const discoveryMutation = useMutation({
    mutationFn: (input: VendorDiscoveryInput) => discoverVendors(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  });

  return {
    vendors: vendorsQuery.data ?? [],
    isLoading: vendorsQuery.isLoading,
    isError: vendorsQuery.isError,
    error: vendorsQuery.error,
    refetch: vendorsQuery.refetch,
    discover: discoveryMutation.mutateAsync,
    isDiscovering: discoveryMutation.isPending,
    verify: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    refresh: refreshMutation.mutateAsync,
    isRefreshing: refreshMutation.isPending,
  };
}
