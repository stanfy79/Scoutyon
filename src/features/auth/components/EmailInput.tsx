import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface EmailInputProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    await onSubmit(trimmed);
  };

  return (
    <div className="space-y-6">
      {/* Brand & Value Proposition */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-lg shadow-indigo-600/10">
          <Cpu className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Your AI agent for research, decisions and smarter purchasing.
        </h2>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Tell Scoutyon what you need. Let it research the internet, compare options and prepare purchases within your spending limits.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 gap-2 text-left text-xs pt-1">
        <div className="p-2.5 bg-[#0E121A] border border-[#1D2433] rounded-xl flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-[11px] text-gray-300">Gemini 3.8 Intelligence</span>
        </div>
        <div className="p-2.5 bg-[#0E121A] border border-[#1D2433] rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-gray-300">NEAR Intents Spending Caps</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={isLoading}
              className="w-full bg-[#0E121A] border border-[#202738] rounded-xl pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={!email.trim() || !email.includes('@')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue with Email OTP
        </Button>
      </form>

      <p className="text-center text-[11px] text-gray-500">
        By continuing, you agree to Scoutyon's terms of service and autonomous purchase policy.
      </p>
    </div>
  );
};
