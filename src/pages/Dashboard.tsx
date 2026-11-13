import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getSessions } from '../api/agent.api';
import { useQuotes } from '../hooks/useQuotes';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { usePurchases } from '../hooks/usePurchases';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { SpendingProgress } from '../components/budgets/SpendingProgress';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  Sparkles,
  ArrowRight,
  History,
  FileCheck,
  Receipt,
  WalletCards,
  ShieldCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickPrompt, setQuickPrompt] = useState('');

  // Fetch real backend data
  const { data: sessionsResponse } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });
  const sessionPayload = sessionsResponse as
    | { data?: unknown; sessions?: unknown }
    | null
    | undefined;
  const sessions = (
    Array.isArray(sessionsResponse)
      ? sessionsResponse
      : Array.isArray(sessionPayload?.data)
        ? sessionPayload.data
        : Array.isArray(sessionPayload?.sessions)
          ? sessionPayload.sessions
          : []
  ) as typeof sessionsResponse extends (infer T)[] | undefined ? T[] : never[];

  const { quotes } = useQuotes();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const { purchases, analytics: purchaseAnalytics } = usePurchases();

  // Metrics computation from real data
  const totalSessions = sessions.length;
  const totalQuotes = quotes.length;
  const pendingApprovals = quotes.filter((q) => q.status === 'pending').length;
  const pendingPurchases = purchases.filter((purchase) => purchase.status === 'submitted').length;
  const completedPurchases = purchases.filter((purchase) => purchase.status === 'fulfilled').length;
  const totalTransactionsCount = transactions.length;

  const primaryCurrency = budgets.find((budget) => budget.active)?.currency || budgets[0]?.currency || 'USD';
  const currencyBudgets = budgets.filter((budget) => budget.active && budget.currency === primaryCurrency);
  const totalBudgetLimit = currencyBudgets.reduce((acc, budget) => acc + budget.totalLimit, 0);
  const totalBudgetSpent = currencyBudgets.reduce((acc, budget) => acc + budget.spent, 0);
  const totalBudgetReserved = currencyBudgets.reduce((acc, budget) => acc + (budget.reserved ?? 0), 0);
  const totalBudgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent - totalBudgetReserved);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    navigate('/workspace', { state: { initialGoal: quickPrompt.trim() } });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#141A29] to-[#121620] border border-[#20293D] rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence & Purchasing Agent</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Welcome back{user?.name ? `, ${user.name}` : user?.email ? `, ${user.email}` : ''}
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Research suppliers, track purchase requests, manage budgets and review quote-bound payments. Available operations depend on backend support and account configuration.
          </p>

          {/* Quick Prompt Input */}
          <form onSubmit={handleQuickSearch} className="pt-2">
            <div className="flex items-center gap-2 bg-[#0C0F15] border border-[#263248] rounded-xl p-1.5 focus-within:border-indigo-500 transition-colors shadow-inner">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="What service or provider would you like to research today?"
                className="flex-1 bg-transparent border-0 px-3 py-1.5 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="shrink-0"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Start Research
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Research Sessions */}
        <div
          onClick={() => navigate('/history')}
          className="bg-[#121620] border border-[#202738] hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Research Sessions</span>
            <History className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSessions}</div>
          <p className="text-[11px] text-gray-500 mt-1">Total recorded runs</p>
        </div>

        {/* Quotes Generated */}
        <div
          onClick={() => navigate('/quotes')}
          className="bg-[#121620] border border-[#202738] hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Quotes Generated</span>
            <FileCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white">{totalQuotes}</div>
          <p className="text-[11px] text-gray-500 mt-1">
            {pendingApprovals} awaiting approval
          </p>
        </div>

        {/* Spending Cap & Remaining */}
        <div
          onClick={() => navigate('/budgets')}
          className="bg-[#121620] border border-[#202738] hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Remaining Budget</span>
            <WalletCards className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(totalBudgetRemaining, primaryCurrency)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {currencyBudgets.length} active {primaryCurrency} policies
          </p>
        </div>

        {/* Transactions */}
        <div
          onClick={() => navigate('/transactions')}
          className="bg-[#121620] border border-[#202738] hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Total Transactions</span>
            <Receipt className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white">
            {totalTransactionsCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">NEAR Intents ledger</p>
        </div>

        <div
          onClick={() => navigate('/purchases')}
          className="bg-[#121620] border border-[#202738] hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Purchase Requests</span>
            <FileCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white">{purchaseAnalytics?.totalPurchases ?? 0}</div>
          <p className="text-[11px] text-gray-500 mt-1">
            {pendingPurchases} awaiting review · {completedPurchases} fulfilled
          </p>
        </div>
      </div>

      {/* Main Grid: Spending Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spending Overview */}
        <div className="lg:col-span-1 bg-[#121620] border border-[#202738] rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100">Spending Overview</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/budgets')}
                className="text-xs"
              >
                Manage
              </Button>
            </div>

            {budgets.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <p>No active spending budget configured.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/budgets')}
                  className="mt-3"
                >
                  Create Spending Cap
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-3">
                <div className="p-3 bg-[#0E121A] border border-[#1C2330] rounded-xl">
                  <SpendingProgress
                    spent={totalBudgetSpent}
                    reserved={totalBudgetReserved}
                    totalLimit={totalBudgetLimit}
                    currency={primaryCurrency}
                  />
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Configured Total Limit:</span>
                    <span className="font-semibold text-gray-200">
                      {formatCurrency(totalBudgetLimit, primaryCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Amount Spent:</span>
                    <span className="font-semibold text-gray-200">
                      {formatCurrency(totalBudgetSpent, primaryCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Available Capacity:</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(totalBudgetRemaining, primaryCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-[11px] text-indigo-300">
            Quotes exceeding your budget balance are automatically rejected by the policy engine.
          </div>
        </div>

        {/* Right Columns: Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Research Sessions */}
          <div className="bg-[#121620] border border-[#202738] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2536] mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100">
                  Recent Research Sessions
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                className="text-xs"
              >
                View All
              </Button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No research sessions yet. Click "Start Research" above.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session) => (
                  <div
                    key={session._id}
                    onClick={() =>
                      navigate('/workspace', { state: { sessionId: session._id } })
                    }
                    className="flex items-center justify-between p-3 bg-[#0E121A] hover:bg-[#151B27] border border-[#1C2330] rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors truncate">
                        {session.goal}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quotes */}
          <div className="bg-[#121620] border border-[#202738] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2536] mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-gray-100">Recent Quotes</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/quotes')}
                className="text-xs"
              >
                View All
              </Button>
            </div>

            {quotes.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No purchase quotes created yet.
              </div>
            ) : (
              <div className="space-y-2">
                {quotes.slice(0, 3).map((quote) => (
                  <div
                    key={quote._id}
                    onClick={() => navigate('/quotes')}
                    className="flex items-center justify-between p-3 bg-[#0E121A] hover:bg-[#151B27] border border-[#1C2330] rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors">
                        {quote.provider}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {quote.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(quote.price, quote.currency)}
                      </span>
                      <StatusBadge status={quote.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
