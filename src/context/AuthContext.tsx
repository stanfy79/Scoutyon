import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessTokenGetter } from '../api/client';
import { syncUserWithBackend } from '../api/auth.api';
import type {
  ScoutyonUser,
  BackendSyncStatus,
  AuthContextType,
} from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    ready,
    authenticated,
    user: privyUser,
    getAccessToken,
    logout: privyLogout,
  } = usePrivy();

  const queryClient = useQueryClient();

  const [user, setUser] = useState<ScoutyonUser | null>(null);
  const [backendSyncStatus, setBackendSyncStatus] = useState<BackendSyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncedPrivyIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Keep API client wired to Privy access token getter
  useEffect(() => {
    if (ready && authenticated) {
      setAccessTokenGetter(getAccessToken);
    } else {
      setAccessTokenGetter(null);
    }
  }, [ready, authenticated, getAccessToken]);

  // Synchronize Privy user with Scoutyon backend
  const syncUser = useCallback(async () => {
    if (!ready || !authenticated || !privyUser) {
      setBackendSyncStatus('idle');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    setBackendSyncStatus('syncing');
    setSyncError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Privy access token could not be retrieved.');
      }

      const syncResponse = await syncUserWithBackend(accessToken);
      const { user: syncedUser } = syncResponse;
      setUser({
        id: syncedUser.id,
        privyUserId: syncedUser.privyUserId,
        email: syncedUser.email,
        name: syncedUser.email?.split('@')[0],
        walletAddress: syncedUser.wallet.address,
        chainType: syncedUser.wallet.chainType,
        walletId: syncedUser.wallet.id,
        walletStatus: syncedUser.wallet.provisioningStatus,
        accountStatus: syncedUser.accountStatus,
      });

      syncedPrivyIdRef.current = privyUser.id;
      setBackendSyncStatus('completed');
    } catch (err: any) {
      console.warn('[AuthContext] Backend sync attempt failed:', err);
      const isNotFound = err?.status === 404;
      const message = isNotFound
        ? 'Backend endpoint /api/auth/sync is not yet implemented on the server (404 Not Found).'
        : err?.message || 'Failed to synchronize Privy session with backend.';
      setSyncError(message);
      setBackendSyncStatus('failed');
    } finally {
      isSyncingRef.current = false;
    }
  }, [ready, authenticated, privyUser, getAccessToken]);

  // Auto-trigger sync when Privy becomes authenticated
  useEffect(() => {
    if (ready && authenticated && privyUser) {
      if (syncedPrivyIdRef.current !== privyUser.id && backendSyncStatus === 'idle') {
        syncUser();
      }
    } else if (ready && !authenticated) {
      setUser(null);
      setBackendSyncStatus('idle');
      setSyncError(null);
      syncedPrivyIdRef.current = null;
    }
  }, [ready, authenticated, privyUser, backendSyncStatus, syncUser]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await privyLogout();
    } catch (err) {
      console.error('[AuthContext] Error during Privy logout:', err);
    } finally {
      setUser(null);
      setBackendSyncStatus('idle');
      setSyncError(null);
      syncedPrivyIdRef.current = null;
      isSyncingRef.current = false;
      queryClient.clear();
    }
  }, [privyLogout, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        privyUser,
        ready,
        authenticated,
        backendSyncStatus,
        syncError,
        getAccessToken,
        syncUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
