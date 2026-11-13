import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { useAuth } from '../context/AuthContext';
import { EmailInput } from '../features/auth/components/EmailInput';
import { OtpInput } from '../features/auth/components/OtpInput';
import { WalletProvisioningStatus } from '../features/auth/components/WalletProvisioningStatus';
import { AuthError } from '../features/auth/components/AuthError';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    ready,
    authenticated,
    backendSyncStatus,
    syncError,
    syncUser,
    user,
  } = useAuth();

  const [enteredEmail, setEnteredEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNewUserRegistered, setIsNewUserRegistered] = useState(false);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: ({ isNewUser }) => {
      setIsNewUserRegistered(!!isNewUser);
      setErrorMessage(null);
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => {
      console.warn('[Privy Email Auth] Error:', err);
      const msg = typeof err === 'string' ? err : err?.message || String(err);
      setErrorMessage(msg || 'Authentication failed. Please check the code.');
    },
  });

  // Once both Privy and Backend sync are completed, redirect to dashboard
  useEffect(() => {
    if (ready && authenticated && backendSyncStatus === 'completed') {
      navigate('/dashboard', { replace: true });
    }
  }, [ready, authenticated, backendSyncStatus, navigate]);

  const handleSendCode = async (email: string) => {
    setErrorMessage(null);
    setEnteredEmail(email);
    try {
      await sendCode({ email });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send verification code. Please try again.');
    }
  };

  const handleVerifyCode = async (code: string) => {
    setErrorMessage(null);
    try {
      await loginWithCode({ code });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Incorrect or expired code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (!enteredEmail) return;
    setErrorMessage(null);
    try {
      await sendCode({ email: enteredEmail });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
    }
  };

  const handleBackToEmail = () => {
    setErrorMessage(null);
    window.location.reload();
  };

  // If already authenticated by Privy, show synchronization / wallet status
  if (authenticated) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-gray-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            {isNewUserRegistered && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-center">
                <span className="text-xs font-semibold text-indigo-300">
                  Welcome to Scoutyon! Your account is being provisioned.
                </span>
              </div>
            )}

            {backendSyncStatus === 'failed' ? (
              <AuthError
                title="Account Synchronization Failed"
                message={
                  syncError ||
                  'Could not synchronize with Scoutyon backend. Please try again.'
                }
                onRetry={syncUser}
              />
            ) : (
              <WalletProvisioningStatus
                status={user?.walletStatus || (backendSyncStatus === 'completed' ? 'completed' : 'pending')}
                walletAddress={user?.walletAddress}
                onProceed={() => navigate('/dashboard', { replace: true })}
                onRetry={syncUser}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const isSendingCode = state.status === 'sending-code';
  const isSubmittingCode = state.status === 'submitting-code';
  const isAwaitingCode =
    state.status === 'awaiting-code-input' || state.status === 'submitting-code';

  const stateError =
    state.status === 'error' ? (state as any).error?.message || 'Authentication error' : null;
  const activeError = errorMessage || stateError;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Container */}
        <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {isAwaitingCode ? (
            <OtpInput
              email={enteredEmail}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={handleBackToEmail}
              isLoading={isSubmittingCode}
              error={activeError}
            />
          ) : (
            <EmailInput
              onSubmit={handleSendCode}
              isLoading={isSendingCode}
              error={activeError}
            />
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-500 mt-6">
          Protected by Privy Email Authentication & NEAR Intents
        </p>
      </div>
    </div>
  );
};
