export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

export function setAccessTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
}

export async function getCurrentAccessToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch (err) {
    console.warn('[ApiClient] Failed to obtain access token:', err);
    return null;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  retryOn401?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = true, retryOn401 = true, headers = {}, ...rest } = options;

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getCurrentAccessToken();
    if (token) {
      resolvedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: resolvedHeaders,
      ...rest,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, `Cannot connect to Scoutyon backend (${msg}). Please ensure backend is running.`);
  }

  // Handle expired access token with controlled retry
  if (response.status === 401 && requiresAuth && retryOn401) {
    const freshToken = await getCurrentAccessToken();
    if (freshToken) {
      resolvedHeaders['Authorization'] = `Bearer ${freshToken}`;
      try {
        const retryResponse = await fetch(url, {
          headers: resolvedHeaders,
          ...rest,
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204) return undefined as unknown as T;
          const retryContentType = retryResponse.headers.get('content-type') || '';
          if (retryContentType.includes('application/json')) {
            return await retryResponse.json();
          }
          return (await retryResponse.text()) as unknown as T;
        }
      } catch {
        // Fall through to error handling
      }
    }
    window.dispatchEvent(new CustomEvent('scoutyon:unauthorized'));
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.reason ||
      data?.message ||
      `Request failed with status ${response.status}`;

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('scoutyon:unauthorized'));
    }

    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}
