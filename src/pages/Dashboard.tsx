import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getSessions } from '../api/agent.api';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { SpendingProgress } from '../components/budgets/SpendingProgress';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Sparkles, ArrowRight, History, Receipt, ShieldCheck, ArrowLeftRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const { data: response } = useQuery({ queryKey: ['sessions'], queryFn: getSessions });
  const payload = response as { data?: unknown; sessions?: unknown } | null | undefined;
  const sessions = (Array.isArray(response) ? response : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.sessions) ? payload.sessions : []) as NonNullable<typeof response>;
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const currency = budgets.find((budget) => budget.active)?.currency || budgets[0]?.currency || 'USD';
  const currencyBudgets = budgets.filter((budget) => budget.active && budget.currency === currency);
  const limit = currencyBudgets.reduce((sum, budget) => sum + budget.totalLimit, 0);
  const spent = currencyBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const reserved = currencyBudgets.reduce((sum, budget) => sum + (budget.reserved ?? 0), 0);
  const remaining = Math.max(0, limit - spent - reserved);
  const startChat = (event: React.FormEvent) => {
    event.preventDefault();
    navigate('/workspace', prompt.trim() ? { state: { initialGoal: prompt.trim() } } : undefined);
  };

  return <div className="space-y-6 py-5">
    <section className="relative overflow-hidden rounded-2xl border border-[#20293D] bg-gradient-to-r from-[#141A29] to-[#121620] p-6 shadow-md sm:p-8">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300"><Sparkles className="h-3.5 w-3.5" />Cross-chain transfers</div>
        <h2 className="text-xl font-bold text-white sm:text-2xl">Welcome back{user?.name ? `, ${user.name}` : ''}</h2>
        <p className="text-sm leading-relaxed text-gray-300">Scoutyon helps move assets across chains, and can also research companies, projects and products, compare options, and answer questions with sources.</p>
        <form onSubmit={startChat} className="flex gap-2 rounded-xl border border-[#263248] bg-[#0C0F15] p-1.5 shadow-inner focus-within:border-indigo-500">
          <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about a transfer, research a topic, or ask a question..." className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" />
          <Button type="submit" size="sm" className="shrink-0" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Open chat</Button>
        </form>
        <button onClick={() => navigate('/workspace')} className="inline-flex items-center gap-2 pt-1 text-xs text-gray-400 transition-colors hover:text-white"><ArrowLeftRight className="h-3.5 w-3.5"/>Start a cross-chain transfer conversation</button>
      </div>
    </section>

    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-[#202738] bg-[#121620] p-5 lg:col-span-1">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-400"/><h3 className="text-sm font-bold text-gray-100">Spending overview</h3></div><button onClick={() => navigate('/budgets')} className="text-xs text-gray-400 hover:text-white">Manage</button></div>
        {currencyBudgets.length ? <><SpendingProgress spent={spent} reserved={reserved} totalLimit={limit} currency={currency}/><p className="mt-3 text-xs text-gray-400">Available {formatCurrency(remaining, currency)}</p></> : <p className="text-xs text-gray-500">No spending policies configured.</p>}
      </div>
      <div className="rounded-xl border border-[#202738] bg-[#121620] p-5 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between border-b border-[#1E2536] pb-3"><div className="flex items-center gap-2"><History className="h-4 w-4 text-indigo-400"/><h3 className="text-sm font-bold text-gray-100">Recent conversations</h3></div><button onClick={() => navigate('/history')} className="text-xs text-gray-400 hover:text-white">View all</button></div>
        {sessions.length ? <div className="space-y-2">{sessions.slice(0, 4).map((session) => <button key={session._id} onClick={() => navigate('/workspace', { state: { sessionId: session._id } })} className="group flex w-full items-center justify-between rounded-lg border border-[#1C2330] bg-[#0E121A] p-3 text-left transition-colors hover:bg-[#151B27]"><span className="min-w-0 pr-3"><span className="block truncate text-xs font-semibold text-gray-200 group-hover:text-indigo-300">{session.goal}</span><span className="mt-1 block text-[10px] text-gray-500">{formatDate(session.updatedAt || session.createdAt)}</span></span><StatusBadge status={session.status}/></button>)}</div> : <p className="py-5 text-xs text-gray-500">Your saved conversations will appear here.</p>}
      </div>
    </section>
    <button onClick={() => navigate('/transactions')} className="flex w-full items-center gap-3 rounded-xl border border-[#202738] bg-[#121620] p-4 text-left transition-colors hover:border-indigo-500/40"><Receipt className="h-5 w-5 text-indigo-400"/><span className="flex-1"><span className="block text-sm font-semibold text-gray-100">Transfer activity</span><span className="text-xs text-gray-500">Persisted transaction history</span></span><span className="text-lg font-bold text-white">{transactions.length}</span></button>
  </div>;
};
