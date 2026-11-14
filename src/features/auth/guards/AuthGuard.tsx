import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { AuthLoading } from '../components/AuthLoading';
import { WalletProvisioningStatus } from '../components/WalletProvisioningStatus';
import { AuthError } from '../components/AuthError';
import { LogOut } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const {
    ready,
    authenticated,
    backendSyncStatus,
    syncError,
    syncUser,
    user,
    logout
  } = useAuth();

  // 1. Privy initialization check
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <AuthLoading message="Initializing Scoutyon secure environment..." />
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  // 3. Backend synchronization in progress
  if (backendSyncStatus === 'syncing' || backendSyncStatus === 'idle') {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121620] border border-[#202738] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <WalletProvisioningStatus
            status={user?.walletStatus || 'pending'}
            walletAddress={user?.walletAddress}
          />
        </div>
      </div>
    );
  }

  // 4. Backend synchronization failed
  if (backendSyncStatus === 'failed') {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121620] border border-[#202738] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
          <AuthError
            title="Account Synchronization Failed"
            message={
              syncError ||
              'Could not synchronize your verified Privy session with the Scoutyon backend.'
            }
            onRetry={syncUser}
          />
          <button className="text-xs flex gap-2 p-2 text-gray-400 hover:text-gray-200 transition-colors"
          onClick={logout}>
            Logout
            <LogOut className="w-4 h-4 mr-2" />
          </button>
        </div>
      </div>
    );
  }

  // 5. Synchronization completed — render protected content
  return <>{children}</>;
};
