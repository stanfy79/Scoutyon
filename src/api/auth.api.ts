import { API_BASE_URL, ApiError } from './client';
import type { SyncUserResponse, ScoutyonUser } from '../types/auth.types';

export async function syncUserWithBackend(
  accessToken: string,
): Promise<SyncUserResponse> {
  if (!accessToken.trim()) {
    throw new ApiError(0, 'Privy access token is not available.');
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/sync`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, `Cannot connect to Scoutyon backend for user sync (${msg}).`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.reason ||
      data?.message ||
      `Synchronization failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, data);
  }

  if (
    data?.success !== true ||
    typeof data.user?.id !== 'string' ||
    typeof data.user?.privyUserId !== 'string' ||
    !data.user.wallet ||
    typeof data.user.wallet.provisioningStatus !== 'string'
  ) {
    throw new ApiError(502, 'Backend returned an invalid user synchronization response.', data);
  }

  return data as SyncUserResponse;
}

export async function getAuthenticatedProfile(accessToken: string): Promise<ScoutyonUser> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/me`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, `Failed to load authenticated profile (${msg}).`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.reason ||
      data?.message ||
      `Profile fetch failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, data);
  }

  return {
    id: data.id || data.userId || data._id,
    privyUserId: data.privyUserId,
    email: data.email || null,
    name: data.name || (data.email ? data.email.split('@')[0] : 'Scoutyon User'),
    walletAddress: data.walletAddress || null,
    walletId: data.walletId || null,
    walletStatus: data.walletProvisioningStatus || data.walletStatus || 'not_provisioned',
    accountStatus: data.accountStatus,
  };
}

export async function checkBackendHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/health`);
  if (!res.ok) {
    throw new Error('Backend health check failed');
  }
  return res.json();
}
