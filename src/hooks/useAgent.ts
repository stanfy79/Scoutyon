import { useState, useRef, useCallback } from 'react';
import { streamAgentChat, getSessionById } from '../api/agent.api';
import type {
  ChatMessage,
  ActivityStep,
  SSEEvent,
} from '../types/agent.types';
import { parseExecutableQuote, parsePrivyAction, parseTransferPreview } from '../utils/transferPayload';

function explicitlyReviewsTransfer(message: string): boolean {
  return /\b(review|show|reopen|remind me of|details of)\b.*\b(quote|transfer|route)\b/i.test(message);
}
export function useAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
  const [sources, setSources] = useState<string[]>([]);
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
  const shownTransferPreviewsRef = useRef(new Set<string>());
  const intentRef = useRef('');
  const activePersistedPreviewRef = useRef<import('../types/transfer.types').TransferQuotePreview | null>(null);

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
    shownTransferPreviewsRef.current.clear();
    activePersistedPreviewRef.current = null;
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
    shownTransferPreviewsRef.current.clear();
    activePersistedPreviewRef.current = null;
    setError(null);
    setActiveSession(sessionId);
    try {
      const detail = await getSessionById(sessionId);
      if (operationId !== operationRef.current) return;
      if (detail._id !== sessionId) {
        throw new Error('The backend returned a different session than the one requested.');
      }

      const loadedMessages: ChatMessage[] = detail.messages.map((m, idx) => ({
        id: `${detail._id}-msg-${idx}`,
        role: m.role,
        content: m.content,
        toolName: m.toolName,
        timestamp: m.timestamp || detail.updatedAt || detail.createdAt,
      }));

      setMessages(loadedMessages);
      const context = detail.transactionContext;
      if (context?.transactionStatus === 'quote_preview' && context.quoteId &&
        typeof context.quoteExpiry === 'string' && Date.parse(context.quoteExpiry) > Date.now()) {
        try {
          const cached = window.localStorage.getItem(`scoutyon.transferPreview.${sessionId}`);
          const candidate = cached ? parseTransferPreview(JSON.parse(cached)) : null;
          if (candidate && candidate.quoteId === context.quoteId && Date.parse(candidate.expiresAt) > Date.now()) {
            activePersistedPreviewRef.current = candidate;
            shownTransferPreviewsRef.current.add(candidate.quoteId);
          }
        } catch {
          activePersistedPreviewRef.current = null;
        }
      }
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

      const previousPreview = explicitlyReviewsTransfer(trimmed)
        ? [...messages].reverse().find((message) => message.responseType === 'transfer_quote_preview' && message.structuredData)?.structuredData ?? activePersistedPreviewRef.current
        : undefined;
      const reusablePreview = previousPreview ? parseTransferPreview(previousPreview) : null;
      setMessages((prev) => [
        ...prev,
        userMsg,
        ...(reusablePreview ? [{
          id: `transfer-review-${reusablePreview.quoteId}-${Date.now()}`,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date().toISOString(),
          responseType: 'transfer_quote_preview' as const,
          quoteId: reusablePreview.quoteId,
          structuredData: reusablePreview,
        }] : []),
        assistantMsg,
      ]);

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
      let assistantResponseType: ChatMessage['responseType'] = 'normal_message';
      intentRef.current = '';

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
                    ? { ...m, content: currentAssistantText, responseType: assistantResponseType }
                    : m,
                ),
              );
            }
            break;
          }

          case 'intent': {
            intentRef.current = event.data.intent ?? '';
            const classifiedResponse: Record<string, ChatMessage['responseType']> = {
              general_chat: 'general_response',
              transfer_quote_request: 'transfer_quote_preview',
              transfer_execute_request: 'transfer_quote_preview',
              transfer_prepare_request: 'transfer_preparation',
              transfer_confirm_request: 'transfer_authorization',
              transfer_status_request: 'transfer_status',
            };
            assistantResponseType = classifiedResponse[intentRef.current] ?? 'normal_message';
            setMessages((prev) => prev.map((message) => message.id === assistantMessageId
              ? { ...message, responseType: assistantResponseType }
              : message));
            if (['transfer_prepare_request', 'transfer_confirm_request', 'transfer_status_request'].includes(intentRef.current)) {
              activePersistedPreviewRef.current = null;
              setMessages((prev) => prev.map((message) => message.responseType === 'transfer_quote_preview'
                ? { ...message, responseType: 'normal_message', structuredData: undefined }
                : message));
            }
            break;
          }

          case 'quote': {
            const payload = event.data;
            if (typeof payload === 'object' && payload !== null && 'kind' in payload && payload.kind === 'swap_preview') {
              const preview = parseTransferPreview(payload);
              const allowedIntent = ['transfer_quote_request', 'transfer_execute_request', 'transfer_prepare_request'].includes(intentRef.current);
              if (preview && allowedIntent && !shownTransferPreviewsRef.current.has(preview.quoteId)) {
                shownTransferPreviewsRef.current.add(preview.quoteId);
                activePersistedPreviewRef.current = preview;
                const previewSessionId = activeSessionRef.current;
                if (previewSessionId && typeof window !== 'undefined') {
                  window.localStorage.setItem(`scoutyon.transferPreview.${previewSessionId}`, JSON.stringify(preview));
                }
                setMessages((prev) => [...prev.filter((message) => message.responseType !== 'transfer_quote_preview'), { id: `transfer-preview-${preview.quoteId}-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date().toISOString(), responseType: 'transfer_quote_preview', quoteId: preview.quoteId, structuredData: preview }]);
              }
            } else if (typeof payload === 'object' && payload !== null && 'kind' in payload && payload.kind === 'swap_executable_quote') {
              const prepared = parseExecutableQuote(payload);
              if (prepared && intentRef.current === 'transfer_prepare_request' && !shownTransferPreviewsRef.current.has(prepared.transfer.id)) {
                shownTransferPreviewsRef.current.add(prepared.transfer.id);
                setMessages((prev) => [...prev, { id: `transfer-preparation-${prepared.transfer.id}`, role: 'assistant', content: '', timestamp: new Date().toISOString(), responseType: 'transfer_preparation', quoteId: prepared.transfer.id, structuredData: prepared }]);
              }
            }
            break;
          }

          case 'wallet_action': {
            const action = parsePrivyAction(event.data);
            if (action && intentRef.current === 'transfer_confirm_request' && !shownTransferPreviewsRef.current.has(`auth:${action.transferId}`)) {
              shownTransferPreviewsRef.current.add(`auth:${action.transferId}`);
              setMessages((prev) => [...prev, { id: `transfer-authorization-${action.transferId}`, role: 'assistant', content: '', timestamp: new Date().toISOString(), responseType: 'transfer_authorization', quoteId: action.transferId, structuredData: action }]);
            }
            break;
          }

          case 'tool_call': {
            const { name, args } = event.data;
            if (['fetch_page', 'search_vendors', 'create_quote'].includes(name)) {
              assistantResponseType = 'research_result';
              setMessages((prev) => prev.map((message) => message.id === assistantMessageId
                ? { ...message, responseType: assistantResponseType }
                : message));
            }
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

          case 'error': {
            const err = event.data;
            if (err.tool && ['get_transfer_quote', 'prepare_transfer', 'confirm_transaction', 'get_transaction_status'].includes(err.tool)) {
              assistantResponseType = 'transfer_error';
              setMessages((prev) => prev.map((message) => message.id === assistantMessageId
                ? { ...message, responseType: assistantResponseType }
                : message));
            }
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

          case 'response_metadata': {
            assistantResponseType = event.data.responseType;
            setMessages((prev) => prev.map((message) => message.id === assistantMessageId
              ? { ...message, responseType: assistantResponseType, quoteId: event.data.quoteId }
              : message));
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
    [isLoadingSession, messages, selectedBudgetId, setActiveSession],
  );

  return {
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
  };
}
