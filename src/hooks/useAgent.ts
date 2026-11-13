import { useState, useRef, useCallback } from 'react';
import { streamAgentChat, getSessionById } from '../api/agent.api';
import { getQuotes } from '../api/quotes.api';
import type {
  ChatMessage,
  ActivityStep,
  SSEQuoteData,
  SSEEvent,
} from '../types/agent.types';
import type { Quote } from '../types/quote.types';

export function useAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [sessionQuotes, setSessionQuotes] = useState<(Quote | SSEQuoteData)[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem('scoutyon.activeSessionId'),
  );
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSessionRef = useRef<string | null>(currentSessionId);
  const operationRef = useRef(0);
  const isStreamingRef = useRef(false);

  const setActiveSession = useCallback((sessionId: string | null) => {
    activeSessionRef.current = sessionId;
    setCurrentSessionId(sessionId);
    if (typeof window !== 'undefined') {
      if (sessionId) {
        window.localStorage.setItem('scoutyon.activeSessionId', sessionId);
      } else {
        window.localStorage.removeItem('scoutyon.activeSessionId');
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    operationRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    setIsStreaming(false);

    setActivitySteps((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        type: 'done',
        title: 'Research stopped by user',
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const startNewSession = useCallback(() => {
    stopStream();
    setMessages([]);
    setActivitySteps([]);
    setSources([]);
    setSessionQuotes([]);
    setActiveSession(null);
    setIsLoadingSession(false);
    setError(null);
  }, [setActiveSession, stopStream]);

  const loadSession = useCallback(async (sessionId: string) => {
    operationRef.current += 1;
    const operationId = operationRef.current;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    isStreamingRef.current = false;
    setIsStreaming(false);
    setIsLoadingSession(true);
    setMessages([]);
    setActivitySteps([]);
    setSources([]);
    setSessionQuotes([]);
    setError(null);
    setActiveSession(sessionId);
    try {
      const detail = await getSessionById(sessionId);
      if (operationId !== operationRef.current) return;
      if (detail._id !== sessionId) {
        throw new Error('The backend returned a different session than the one requested.');
      }

      let restoredQuotes: (Quote | SSEQuoteData)[] = [];
      try {
        restoredQuotes = await getQuotes(sessionId);
      } catch (quotesError) {
        if (operationId === operationRef.current) {
          const message = quotesError instanceof Error ? quotesError.message : 'Unknown error';
          setError(`Conversation restored, but its saved quotes could not be loaded: ${message}`);
        }
      }
      if (operationId !== operationRef.current) return;

      const loadedMessages: ChatMessage[] = detail.messages.map((m, idx) => ({
        id: `${detail._id}-msg-${idx}`,
        role: m.role,
        content: m.content,
        toolName: m.toolName,
        timestamp: m.timestamp || detail.updatedAt || detail.createdAt,
      }));

      setMessages(loadedMessages);
      setSessionQuotes(restoredQuotes);
      setSelectedBudgetId(detail.budgetId || '');
    } catch (err) {
      if (operationId === operationRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load research session');
      }
    } finally {
      if (operationId === operationRef.current) {
        setIsLoadingSession(false);
      }
    }
  }, [setActiveSession]);

  const sendMessage = useCallback(
    async (goal: string, budgetIdToUse?: string) => {
      const trimmed = goal.trim();
      if (!trimmed || isStreamingRef.current || isLoadingSession) return;

      setError(null);
      const operationId = ++operationRef.current;
      const sessionId = activeSessionRef.current ?? undefined;

      // Create user message
      const userMessageId = `user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Create empty placeholder for assistant response
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // Set initial activity step
      const initialStep: ActivityStep = {
        id: `step-${Date.now()}`,
        type: 'thinking',
        title: 'Understanding research request & search parameters...',
        status: 'running',
        timestamp: new Date().toISOString(),
      };
      setActivitySteps((prev) => [...prev, initialStep]);

      setIsStreaming(true);
      isStreamingRef.current = true;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const activeBudgetId = budgetIdToUse !== undefined ? budgetIdToUse : selectedBudgetId;

      let currentAssistantText = '';

      const handleSSEEvent = (event: SSEEvent) => {
        if (operationId !== operationRef.current) return;
        switch (event.type) {
          case 'session': {
            const sid = event.data.sessionId;
            setActiveSession(sid);
            break;
          }

          case 'text': {
            const chunk = event.data.text;
            if (chunk) {
              currentAssistantText += chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: currentAssistantText }
                    : m,
                ),
              );
            }
            break;
          }

          case 'tool_call': {
            const { name, args } = event.data;
            if (name === 'fetch_page') {
              const url = (args?.url as string) || '';
              if (url) {
                setSources((prev) => (prev.includes(url) ? prev : [...prev, url]));
              }
              setActivitySteps((prev) => [
                ...prev,
                {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  type: 'tool_call',
                  title: `Inspecting verified source page`,
                  details: url,
                  status: 'running',
                  timestamp: new Date().toISOString(),
                  metadata: { url },
                },
              ]);
            } else if (name === 'create_quote') {
              const provider = (args?.provider as string) || 'Provider';
              const price = args.price;
              const currency = args.currency;
              const priceDetails =
                (typeof price === 'string' || typeof price === 'number') &&
                typeof currency === 'string'
                  ? `Price: ${price} ${currency}`
                  : undefined;
              setActivitySteps((prev) => [
                ...prev,
                {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  type: 'quote',
                  title: `Generating purchase quote for ${provider}`,
                  details: priceDetails,
                  status: 'running',
                  timestamp: new Date().toISOString(),
                },
              ]);
            } else {
              setActivitySteps((prev) => [
                ...prev,
                {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  type: 'tool_call',
                  title: `Executing research tool: ${name}`,
                  status: 'running',
                  timestamp: new Date().toISOString(),
                },
              ]);
            }
            break;
          }

          case 'tool_result': {
            const { preview, quoteId } = event.data;
            setActivitySteps((prev) => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].status === 'running') {
                  updated[i] = {
                    ...updated[i],
                    status: 'success',
                    details: quoteId
                      ? `Quote record confirmed #${quoteId.slice(-6)}`
                      : preview
                        ? `${preview.slice(0, 100)}...`
                        : updated[i].details,
                  };
                  break;
                }
              }
              return updated;
            });
            break;
          }

          case 'quote': {
            const q = event.data;
            setSessionQuotes((prev) => {
              const exists = prev.some((item) =>
                'quoteId' in item ? item.quoteId === q.quoteId : item._id === q.quoteId,
              );
              if (exists) return prev;
              return [...prev, q];
            });

            // If quote has a sourceUrl, collect it
            if (q.sourceUrl) {
              setSources((prev) => (prev.includes(q.sourceUrl) ? prev : [...prev, q.sourceUrl]));
            }

            setActivitySteps((prev) => [
              ...prev,
              {
                id: `quote-${Date.now()}`,
                type: 'quote',
                title: `Purchase Quote Verified: ${q.provider} (${q.price} ${q.currency})`,
                details: q.description,
                status: 'success',
                timestamp: new Date().toISOString(),
              },
            ]);
            break;
          }

          case 'error': {
            const err = event.data;
            setActivitySteps((prev) => [
              ...prev,
              {
                id: `err-${Date.now()}`,
                type: 'error',
                title: err.tool ? `Error in ${err.tool}` : 'Agent Warning',
                details: err.message,
                status: 'error',
                timestamp: new Date().toISOString(),
              },
            ]);
            break;
          }

          case 'done': {
            setActivitySteps((prev) => [
              ...prev,
              {
                id: `done-${Date.now()}`,
                type: 'done',
                title: 'Research and comparative synthesis complete',
                status: 'success',
                timestamp: new Date().toISOString(),
              },
            ]);
            break;
          }
        }
      };

      try {
        await streamAgentChat({
          goal: trimmed,
          budgetId: activeBudgetId || undefined,
          sessionId,
          signal: abortController.signal,
          onEvent: handleSSEEvent,
        });
      } catch (err: unknown) {
        if (!abortController.signal.aborted && operationId === operationRef.current) {
          const errMsg =
            err instanceof Error ? err.message : 'Agent research stream encountered an error';
          setError(errMsg);
          setActivitySteps((prev) => [
            ...prev,
            {
              id: `fail-${Date.now()}`,
              type: 'error',
              title: 'Research stream interrupted',
              details: errMsg,
              status: 'error',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (operationId === operationRef.current) {
          isStreamingRef.current = false;
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [isLoadingSession, selectedBudgetId, setActiveSession],
  );

  return {
    messages,
    activitySteps,
    sources,
    sessionQuotes,
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
  };
}
