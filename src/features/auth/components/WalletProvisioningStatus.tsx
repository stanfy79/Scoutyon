import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Wallet, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { CopyButton } from '../../../components/common/CopyButton';
import type { WalletProvisioningStatus as WalletStatus } from '../../../types/auth.types';

interface WalletProvisioningStatusProps {
  status: WalletStatus;
  walletAddress?: string | null;
  onRetry?: () => void;
  onProceed?: () => void;
  isRetrying?: boolean;
}

export const WalletProvisioningStatus: React.FC<WalletProvisioningStatusProps> = ({
  status,
  walletAddress,
  onRetry,
  onProceed,
  isRetrying = false,
}) => {
  if (status === 'completed') {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Your Scoutyon wallet is ready</h3>
          <p className="text-xs text-gray-400 mt-1">
            An Ethereum embedded wallet has been provisioned for autonomous purchases.
          </p>
        </div>

        {walletAddress && (
          <div className="p-3 bg-[#0E121A] border border-[#202738] rounded-xl flex items-center justify-between gap-2 text-left">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                Ethereum Wallet Address
              </span>
              <span className="font-mono text-xs text-indigo-300 truncate block mt-0.5">
                {walletAddress}
              </span>
            </div>
            <CopyButton textToCopy={walletAddress} label="Copy" />
          </div>
        )}

        {onProceed && (
          <Button
            onClick={onProceed}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Enter Scoutyon Workspace
          </Button>
        )}
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-950/20">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            Wallet setup could not be completed
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            The backend could not provision your embedded wallet at this time. Your account remains secure and you can retry synchronization.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              isLoading={isRetrying}
              className="w-full"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry Wallet Setup
            </Button>
          )}

          {onProceed && (
            <Button
              variant="outline"
              onClick={onProceed}
              className="w-full text-xs text-gray-400"
            >
              Continue to Dashboard (Read-only)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Pending / default state
  return (
    <div className="space-y-5 text-center py-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto animate-pulse shadow-lg shadow-indigo-600/10">
        <Wallet className="w-6 h-6" />
      </div>

      <div>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Setting up your secure wallet...
          </h3>
        </div>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Synchronizing credentials and provisioning an embedded wallet on the backend.
        </p>
      </div>
    </div>
  );
};
