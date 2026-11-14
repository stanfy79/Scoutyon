import { apiClient, ApiError } from './client';
import type { Vendor, VendorDiscovery, VendorDiscoveryInput, VendorDiscoveryResponse, VendorEvidence } from '../types/vendor.types';

function requireEnvelope<T>(value: unknown, key: string): T {
  if (typeof value !== 'object' || value === null || !('success' in value) || value.success !== true || !(key in value)) {
    throw new ApiError(502, `Backend returned an invalid ${key} response.`, value);
  }
  return (value as Record<string, unknown>)[key] as T;
}

export async function discoverVendors(input: VendorDiscoveryInput): Promise<VendorDiscoveryResponse> {
  const response = await apiClient<unknown>('/api/vendors/discover', { method: 'POST', body: JSON.stringify(input) });
  if (typeof response !== 'object' || response === null || !('success' in response) || response.success !== true || !('discovery' in response) || !('vendors' in response) || !Array.isArray(response.vendors)) {
    throw new ApiError(502, 'Backend returned an invalid vendor discovery response.', response);
  }
  return response as VendorDiscoveryResponse;
}

export async function getVendorDiscovery(id: string): Promise<VendorDiscovery> {
  return requireEnvelope(await apiClient<unknown>(`/api/vendors/discover/${encodeURIComponent(id)}`), 'discovery');
}

export async function getVendors(): Promise<Vendor[]> {
  const response = await apiClient<unknown>('/api/vendors');
  const vendors = requireEnvelope<Vendor[]>(response, 'vendors');
  if (!Array.isArray(vendors)) throw new ApiError(502, 'Backend returned an invalid vendor list.', response);
  return vendors;
}

export async function getVendor(id: string): Promise<Vendor> {
  return requireEnvelope(await apiClient<unknown>(`/api/vendors/${encodeURIComponent(id)}`), 'vendor');
}

export async function getVendorEvidence(id: string): Promise<{ vendorId: string; verificationStatus: Vendor['verificationStatus']; evidence: VendorEvidence[] }> {
  const response = await apiClient<unknown>(`/api/vendors/${encodeURIComponent(id)}/evidence`);
  if (typeof response !== 'object' || response === null || !('success' in response) || response.success !== true || !('vendorId' in response) || !('verificationStatus' in response) || !('evidence' in response) || !Array.isArray(response.evidence)) {
    throw new ApiError(502, 'Backend returned an invalid vendor evidence response.', response);
  }
  return response as { vendorId: string; verificationStatus: Vendor['verificationStatus']; evidence: VendorEvidence[] };
}

export async function verifyVendor(id: string): Promise<Vendor> {
  return requireEnvelope(await apiClient<unknown>(`/api/vendors/${encodeURIComponent(id)}/verify`, { method: 'POST' }), 'vendor');
}

export async function refreshVendor(id: string): Promise<Vendor> {
  return requireEnvelope(await apiClient<unknown>(`/api/vendors/${encodeURIComponent(id)}/refresh`, { method: 'POST' }), 'vendor');
}
