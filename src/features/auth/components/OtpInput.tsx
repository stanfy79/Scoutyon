import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface OtpInputProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading,
  error,
}) => {
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (!cleanCode) return;
    await onVerify(cleanCode);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(30);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-lg shadow-indigo-600/10">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Enter Verification Code
        </h2>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          We sent a temporary one-time code to{' '}
          <span className="text-gray-200 font-medium">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 text-center">
            6-digit security code
          </label>
          <input
            type="text"
            required
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            disabled={isLoading}
            className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 bg-[#0E121A] border border-[#202738] rounded-xl text-indigo-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={code.trim().length < 4}
          rightIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Verify & Sign In
        </Button>
      </form>

      <div className="flex items-center justify-between pt-2 border-t border-[#1C2330] text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change email</span>
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending || isLoading}
          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          <span>
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </span>
        </button>
      </div>
    </div>
  );
};
