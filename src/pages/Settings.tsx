import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { CopyButton } from '../components/common/CopyButton';
import { checkBackendHealth } from '../api/auth.api';
import {
  Settings,
  Shield,
  Server,
  LogOut,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wallet,
  Mail,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    user,
    privyUser,
    logout,
    syncUser,
    backendSyncStatus,
    syncError,
    authenticated,
  } = useAuth();
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refreshHealth,
  } = useQuery({
    queryKey: ['backend-health'],
    queryFn: checkBackendHealth,
    retry: false,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your account credentials, embedded wallet, backend connection, and agent runtime settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Info Card */}
        <div className="bg-[#121620] border border-[#202738] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Privy Account Profile</span>
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                authenticated
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
              }`}
            >
              {authenticated ? 'Privy authenticated' : 'Not authenticated'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Email Address
              </span>
              <span className="text-sm font-bold text-gray-100 mt-1 block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {user?.email || privyUser?.email?.address || 'No email attached'}
              </span>
            </div>

            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Backend Sync Status
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold capitalize text-indigo-300">
                  {backendSyncStatus}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={syncUser}
                  isLoading={backendSyncStatus === 'syncing'}
                  className="text-[11px] h-6 px-2"
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                >
                  Sync
                </Button>
              </div>
            </div>
          </div>
          {syncError && (
            <p role="alert" className="text-xs text-red-400">
              {syncError}
            </p>
          )}
        </div>

        {/* Embedded Wallet Card */}
        <div className="bg-[#121620] border border-[#202738] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Embedded Wallet</span>
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                user?.walletStatus === 'completed'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : user?.walletStatus === 'failed'
                    ? 'bg-red-950/40 text-red-400 border-red-800/40'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
              }`}
            >
              Status: {user?.walletStatus || 'Provisioning'}
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Wallet information is provided by your Scoutyon account. The current profile response does not include network or payment authorization details.
          </p>

          <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Wallet Address
              </span>
              <span className="text-xs font-mono text-indigo-300 truncate block mt-0.5">
                {user?.walletAddress || 'Provisioning in progress...'}
              </span>
            </div>
            {user?.walletAddress && (
              <CopyButton textToCopy={user.walletAddress} label="Copy Address" />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Network
              </span>
              <span className="text-gray-400 mt-1 block">{user?.chainType}</span>
            </div>
            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Payment authorization
              </span>
              <span className="text-gray-400 mt-1 block">
                Not provided by the profile API
              </span>
            </div>
          </div>
        </div>

        {/* Backend & Network Environment Card */}
        <div className="bg-[#121620] border border-[#202738] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Backend & Intelligence Pipeline</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refreshHealth()}
              isLoading={healthLoading}
              className="text-xs"
            >
              Check Health
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Server Status
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {healthLoading ? (
                  <span className="text-gray-400">Pinging...</span>
                ) : healthError ? (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span title={healthError.message}>Unreachable</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Online ({healthData?.status || 'ok'})</span>
                  </div>
                )}
              </div>
              {healthData?.timestamp && (
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Checked {new Date(healthData.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Agent configuration
              </span>
              <span className="text-gray-400 mt-1 block">Not reported by health endpoint</span>
            </div>

            <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Payment configuration
              </span>
              <span className="text-gray-400 mt-1 block">Not reported by health endpoint</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-red-400 hover:text-red-300 hover:border-red-800/40"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out of Privy
            </Button>
          </div>
        </div>

        {/* System Info */}        
        <div className="p-4 bg-[#0F131C] border border-[#1A2130] rounded-xl text-xs text-gray-500 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p>
            Scoutyon • Privy authentication. Wallet network, authorization and payment readiness are shown only when provided by the backend.
          </p>
        </div>
      </div>
    </div>
  );
};
