import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSendTransaction } from '@privy-io/react-auth';
import { getSessions } from '../api/agent.api';
import { submitTransferTransaction } from '../api/transfers.api';
import { useAgent } from '../hooks/useAgent';
import { useBudgets } from '../hooks/useBudgets';
import { ChatWindow } from '../components/agent/ChatWindow';
import { ChatInput } from '../components/agent/ChatInput';
import { AgentActivity } from '../components/agent/AgentActivity';
import { ResearchSources } from '../components/agent/ResearchSources';
import { ScoutyonGlyph } from '../components/agent/ScoutyonGlyph';
import type { AgentSessionSummary } from '../types/agent.types';
import type { PrivyWalletAction } from '../types/transfer.types';
import {
  Shield,
  RotateCcw,
  AlertCircle,
  History,
  Plus,
  X,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const Workspace: React.FC = () => {
  const location = useLocation();
  const {
    messages,
    activitySteps,
    sources,
    currentSessionId,
    isLoadingSession,
    isStreaming,
    error,
    selectedBudgetId,
    setSelectedBudgetId,
    sendMessage,
    stopStream,
    startNewSession,
    loadSession,
  } = useAgent();

  const { budgets } = useBudgets();
  const { sendTransaction } = useSendTransaction();
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'chat' | 'context'>('chat');
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [isAuthorizingTransfer, setIsAuthorizingTransfer] = useState(false);
  const [authorizationNotice, setAuthorizationNotice] = useState<string | null>(null);
  const restoredLocationKeyRef = useRef<string | null>(null);


  const routeState = location.state as { initialGoal?: string; sessionId?: string } | null;

  useEffect(() => {
    if (restoredLocationKeyRef.current === location.key) return;
    restoredLocationKeyRef.current = location.key;

    if (routeState?.sessionId) {
      void loadSession(routeState.sessionId);
    } else if (routeState?.initialGoal) {
      startNewSession();
      void sendMessage(routeState.initialGoal);
    } else if (currentSessionId) {
      void loadSession(currentSessionId);
    }
  }, [
    location.key,
    routeState?.initialGoal,
    routeState?.sessionId,
    currentSessionId,
    loadSession,
    sendMessage,
    startNewSession,
  ]);

  useEffect(() => {
    if (currentSessionId && !isStreaming) {
      void refetchSessions();
    }
  }, [currentSessionId, isStreaming, refetchSessions]);

  const activeBudget = budgets.find((b) => b._id === selectedBudgetId);

  const authorizeTransfer = async (action: PrivyWalletAction) => {
    if (isAuthorizingTransfer) return;
    setIsAuthorizingTransfer(true);
    setAuthorizationNotice(null);
    try {
      const submitted = await sendTransaction({
        from: action.from,
        to: action.transaction.to,
        data: action.transaction.data,
        value: action.transaction.value,
        chainId: action.chainId,
      }, { address: action.from });
      const result = await submitTransferTransaction(action.transferId, action.sessionId, submitted.hash);
      setAuthorizationNotice(result.message || `Source transaction recorded. Current transfer status: ${result.status}.`);
    } catch (authorizationError) {
      setAuthorizationNotice(authorizationError instanceof Error ? authorizationError.message : 'Privy authorization or transfer submission failed.');
    } finally {
      setIsAuthorizingTransfer(false);
    }
  };

  return (
    <div className="scoutyon-workspace relative flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-3">
      <div className="scoutyon-panel flex items-center justify-between px-3 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/3">
            <ScoutyonGlyph className="h-6 w-6 scoutyon-cta" active={isStreaming} />
          </div>
          <div>
            <h2 className="text-[10px] font-bold text-gray-100 flex gap-1.5 flex-col min-sm:flex-row">
              <span className="hidden min-sm:block">Protocol Session</span>
              <span className="block min-sm:hidden">Session</span>
              {currentSessionId && (
                <span className="font-mono text-[10px] text-gray-500 font-normal">
                  #{currentSessionId.slice(-6)}
                </span>
              )}
            </h2>
            <p className="text-[10px] text-gray-400 hidden min-sm:block">
              Integrated with Google Gemini 3.8 & NEAR Intents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSessionHistoryOpen((open) => !open)}
            aria-expanded={isSessionHistoryOpen}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1.5 text-gray-300 transition-colors hover:bg-white/8"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conversations</span>
          </button>

          {/* Mobile view toggle */}
          <div className="flex md:hidden bg-[#18202F] p-0.5 rounded-lg border border-[#243044]">
            <button
              onClick={() => setMobileTab('chat')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'bg-[#696FFD]/20 text-[#696FFD] border border-[#696FFD]/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab('context')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                mobileTab === 'context'
                  ? 'bg-[#696FFD]/20 text-[#696FFD] border border-[#696FFD]/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Intel ({activitySteps.length + sources.length})
            </button>
          </div>

          <button
            onClick={startNewSession}
            disabled={isStreaming || isLoadingSession}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#18202F] hover:bg-[#202A3D] text-gray-300 rounded-lg border border-[#26334A] transition-colors disabled:opacity-50"
            title="Start fresh conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </div>

      {isSessionHistoryOpen && (
        <SessionHistoryPanel
          sessions={sessions}
          isLoading={isSessionsLoading}
          error={sessionsError}
          activeSessionId={currentSessionId}
          onClose={() => setIsSessionHistoryOpen(false)}
          onRetry={() => void refetchSessions()}
          onStartNew={() => {
            startNewSession();
            setIsSessionHistoryOpen(false);
          }}
          onOpen={(sessionId) => {
            setIsSessionHistoryOpen(false);
            void loadSession(sessionId);
          }}
        />
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Chat Window & Input (cols 7 or 8) */}
        <div
          className={`scoutyon-workspace-surface md:col-span-7 lg:col-span-8 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {error && (
            <div className="p-3 bg-red-950/30 border-b border-red-900/40 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Conversation history area */}
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            isLoading={isLoadingSession}
            onSelectPrompt={(p) => sendMessage(p)}
            onAuthorizeTransfer={authorizeTransfer}
            isAuthorizingTransfer={isAuthorizingTransfer}
          />

          {authorizationNotice && <div role="status" className="border-t border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-300">{authorizationNotice}</div>}

          {/* Chat input box */}
          <div className="z-10 shrink-0 border-t border-white/10 bg-[rgba(9,12,18,0.92)] p-3 backdrop-blur-md">
            <ChatInput
              onSend={(msg, budgetId) => sendMessage(msg, budgetId)}
              onStop={stopStream}
              isStreaming={isStreaming}
              isDisabled={isLoadingSession}
              budgets={budgets}
              selectedBudgetId={selectedBudgetId}
              onSelectBudget={setSelectedBudgetId}
            />
          </div>
        </div>

        {/* Right Column: Contextual Research Panel (cols 5 or 4) */}
        <div
          className={`md:col-span-5 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1 ${
            mobileTab === 'context' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Active Spending Policy Card */}
          <div className="bg-[#121620] border border-[#202738] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                <Shield className="w-4 h-4 text-[#696FFD]" />
                <span>Spending Policy</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  activeBudget
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {activeBudget ? 'Policy Enforced' : 'Unconstrained'}
              </span>
            </div>

            {activeBudget ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Selected Policy:</span>
                  <span className="font-semibold text-gray-200 truncate max-w-[150px]">
                    {activeBudget.label}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Available Balance:</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(
                      Math.max(0, activeBudget.totalLimit - activeBudget.spent),
                      activeBudget.currency,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                No policy constraint linked. Quotes will be proposed based on optimal market pricing.
              </p>
            )}
          </div>

          {/* Live Agent Activity Log */}
          <AgentActivity steps={activitySteps} isStreaming={isStreaming} />

          {/* Sources cited during research */}
          <ResearchSources sources={sources} />

        </div>
      </div>
    </div>
  );
};

interface SessionHistoryPanelProps {
  sessions: AgentSessionSummary[];
  isLoading: boolean;
  error: unknown;
  activeSessionId: string | null;
  onClose: () => void;
  onRetry: () => void;
  onStartNew: () => void;
  onOpen: (sessionId: string) => void;
}

function getSessionGroups(sessions: AgentSessionSummary[]) {
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const labels = ['Today', 'Yesterday', 'Previous 7 days', 'Older'] as const;
  const groups = new Map<(typeof labels)[number], AgentSessionSummary[]>(
    labels.map((label) => [label, []]),
  );

  for (const session of [...sessionList].sort(
    (first, second) =>
      Date.parse(second.updatedAt || second.createdAt) -
      Date.parse(first.updatedAt || first.createdAt),
  )) {
    const activityTime = Date.parse(session.updatedAt || session.createdAt);
    const daysAgo = Number.isFinite(activityTime)
      ? Math.max(0, Math.floor((today - new Date(activityTime).setHours(0, 0, 0, 0)) / 86_400_000))
      : Number.POSITIVE_INFINITY;
    const label =
      daysAgo <= 0
        ? 'Today'
        : daysAgo === 1
          ? 'Yesterday'
          : daysAgo < 7
            ? 'Previous 7 days'
            : 'Older';
    groups.get(label)?.push(session);
  }

  return labels
    .map((label) => ({ label, sessions: groups.get(label) ?? [] }))
    .filter((group) => group.sessions.length > 0);
}

const SessionHistoryPanel: React.FC<SessionHistoryPanelProps> = ({
  sessions,
  isLoading,
  error,
  activeSessionId,
  onClose,
  onRetry,
  onStartNew,
  onOpen,
}) => {
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const groups = getSessionGroups(sessionList);

  return (
    <aside className="absolute bottom-0 left-0 top-[3.5rem] z-30 flex w-full max-w-[340px] flex-col border-r border-white/10 bg-[#0d1016]/[0.98] shadow-2xl backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-gray-100">Conversations</h3>
          <p className="mt-1 text-[10px] text-gray-500">Saved by Scoutyon</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation history"
          className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <button
        type="button"
        onClick={onStartNew}
        className="mx-3 mt-3 flex items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 transition-colors hover:bg-white/[0.08]"
      >
        <Plus className="h-3.5 w-3.5" />
        Start a new conversation
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div role="status" className="px-2 py-4 text-xs text-gray-400">
            Loading conversations…
          </div>
        ) : error ? (
          <div role="alert" className="space-y-2 px-2 py-4 text-xs text-gray-400">
            <p>{error instanceof Error ? error.message : 'Conversations could not be loaded.'}</p>
            <button type="button" onClick={onRetry} className="text-gray-200 underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : sessionList.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-gray-500">
            Saved conversations will appear here after your first chat.
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.label}>
                <h4 className="px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-600">
                  {group.label}
                </h4>
                <ul className="mt-2 space-y-1">
                  {group.sessions.map((session) => {
                    const isActive = session._id === activeSessionId;
                    return (
                      <li key={session._id}>
                        <button
                          type="button"
                          onClick={() => onOpen(session._id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full border px-3 py-2.5 text-left transition-colors ${
                            isActive
                              ? 'border-white/15 bg-white/[0.06]'
                              : 'border-transparent hover:border-white/8 hover:bg-white/[0.03]'
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            <span
                              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                                isActive ? 'bg-gray-200' : 'bg-gray-700'
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block line-clamp-2 text-[11px] leading-relaxed text-gray-200">
                                {session.goal || 'Untitled conversation'}
                              </span>
                              <span className="mt-1 block text-[9px] text-gray-600">
                                {formatDate(session.updatedAt || session.createdAt)}
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
