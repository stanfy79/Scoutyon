import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessions, getSessionById } from '../api/agent.api';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoading } from '../components/common/Loading';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { formatDate } from '../utils/formatDate';
import {
  History,
  Search,
  ArrowRight,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';

export const ResearchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  const sessionPayload = sessions as unknown as {
    sessions?: unknown;
    data?: unknown;
  };
  const nestedSessionPayload = sessionPayload.data as
    | { sessions?: unknown; data?: unknown }
    | undefined;
  const sessionList = (Array.isArray(sessions)
    ? sessions
    : Array.isArray(sessionPayload.sessions)
      ? sessionPayload.sessions
      : Array.isArray(sessionPayload.data)
        ? sessionPayload.data
        : Array.isArray(nestedSessionPayload?.sessions)
          ? nestedSessionPayload.sessions
          : Array.isArray(nestedSessionPayload?.data)
            ? nestedSessionPayload.data
            : []) as typeof sessions;

  const {
    data: sessionDetail,
    isLoading: isDetailLoading,
  } = useQuery({
    queryKey: ['session', selectedSessionId],
    queryFn: () =>
      selectedSessionId ? getSessionById(selectedSessionId) : Promise.reject('No ID'),
    enabled: !!selectedSessionId,
  });

  const filteredSessions = sessionList.filter((s) => {
    if (!search.trim()) return true;
    return s.goal.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return <PageLoading message="Loading previous research sessions..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load research history"
        message={(error as Error)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Research Session History</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            View past autonomous investigations, inquiries, and generated provider reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search session objective..."
              className="w-full bg-[#121620] border border-[#202738] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/workspace')}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            New Research
          </Button>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No research sessions found"
          description={
            search
              ? 'No sessions match your search query.'
              : 'You have not conducted any research sessions yet. Start your first research task today.'
          }
          actionLabel="Start Research"
          onAction={() => navigate('/workspace')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session._id}
              className="bg-[#121620] border border-[#202738] hover:border-[#2C374D] rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] text-gray-500 font-mono">
                    #{session._id.slice(-6)}
                  </span>
                  <StatusBadge status={session.status} />
                </div>

                <h3 className="text-sm font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-3 leading-relaxed mb-4">
                  "{session.goal}"
                </h3>
              </div>

              <div className="pt-3 border-t border-[#1C2330] flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-500">
                  {formatDate(session.createdAt)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedSessionId(session._id)}
                    className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() =>
                      navigate('/workspace', { state: { sessionId: session._id } })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 rounded-md border border-indigo-800/40 transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Details Inspection Modal */}
      <Modal
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        title="Session Inspection"
        description={sessionDetail ? `Goal: "${sessionDetail.goal}"` : 'Loading...'}
        maxWidth="xl"
      >
        {isDetailLoading || !sessionDetail ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Fetching session messages...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3 p-1">
              {sessionDetail.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    m.role === 'user'
                      ? 'bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 ml-4'
                      : 'bg-[#0E121A] border border-[#1D2536] text-gray-300 mr-4'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[10px] text-gray-400">
                    {m.role === 'user' ? (
                      <User className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <Bot className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className="uppercase">{m.role}</span>
                    <span>•</span>
                    <span>{formatDate(m.timestamp)}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1F2636]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const sId = selectedSessionId;
                  setSelectedSessionId(null);
                  navigate('/workspace', { state: { sessionId: sId } });
                }}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Resume in Workspace
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
