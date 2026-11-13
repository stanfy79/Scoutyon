import React, { useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Search, FileText, Wallet, ClipboardList, ArrowLeftRight, Send, Activity } from 'lucide-react';
import type { ChatMessage, SSEQuoteData } from '../../types/agent.types';
import type { Quote } from '../../types/quote.types';
import { MessageBubble } from './MessageBubble';
import { QuoteCard } from './QuoteCard';
import { ScoutyonGlyph } from './ScoutyonGlyph';

interface ChatWindowProps {
  messages: ChatMessage[];
  quotes: (Quote | SSEQuoteData)[];
  isStreaming: boolean;
  isLoading?: boolean;
  error?: string | null;
  onSelectPrompt: (prompt: string) => void;
  onPreparePayment?: (quoteId: string) => void;
  onRejectQuote?: (quoteId: string) => void;
  isRejectingQuote?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  quotes,
  isStreaming,
  isLoading = false,
  error,
  onSelectPrompt,
  onPreparePayment,
  onRejectQuote,
  isRejectingQuote,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldFollowStream = useRef(true);

  const suggestedPrompts = [
    {
      title: 'VENDOR DISCOVERY',
      prompt: 'Find reliable laptop suppliers under $2,000.',
      icon: Search,
    },
    {
      title: 'QUOTE COMPARISON',
      prompt: 'Compare quotations from three suppliers for 20 office chairs.',
      icon: FileText,
    },
    {
      title: 'BUDGET INTELLIGENCE',
      prompt: 'Analyze my spending and show how much remains in my equipment budget.',
      icon: Wallet,
    },
    {
      title: 'PURCHASE MANAGEMENT',
      prompt: 'Create a purchase request for 10 business laptops.',
      icon: ClipboardList,
    },
    {
      title: 'CROSS-CHAIN SWAP',
      prompt: 'Swap 100 USDC on Base to NEAR.',
      icon: ArrowLeftRight,
    },
    {
      title: 'CROSS-CHAIN TRANSFER',
      prompt: 'Send 0.5 ETH to this supported destination address.',
      icon: Send,
    },
    {
      title: 'TRANSACTION STATUS',
      prompt: 'Check the status of my last cross-chain transfer.',
      icon: Activity,
    },
  ];

  useEffect(() => {
    if (scrollRef.current && shouldFollowStream.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
    }
  }, [messages, isStreaming, quotes]);

  if (messages.length === 0) {
    return (
      <div className="scoutyon-empty-state min-h-0 flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
        {isLoading ? (
          <div role="status" className="flex items-center gap-3 text-sm text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
            Restoring conversation…
          </div>
        ) : (
          <>
        <div className="mb-5 flex h-14 w-14 items-center justify-center border border-white/15 bg-white/[0.02]">
          <ScoutyonGlyph className="h-10 w-10 scoutyon-cta" active />
        </div>
        <div className="text-[10px] tracking-[.2em] text-gray-500">SCOUTYON / INTELLIGENCE WORKSPACE</div>
        <h2 className="mt-3 text-xl sm:text-2xl font-medium tracking-tight text-gray-100">Your interface to the open economy.</h2>
        <p className="mt-3 text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
          Discover suppliers. Evaluate opportunities. Manage purchases. Move assets across chains.
        </p>

        {/* Suggested Prompts */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-4xl text-left">
          {suggestedPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-3 bg-[#111213] hover:bg-[#191a1b] border border-white/10 hover:border-white/30 rounded-sm transition-all group flex flex-col justify-between min-h-[112px]"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] tracking-[.12em] text-gray-500 group-hover:text-gray-300 transition-colors">{item.title}</span>
                  <span className="flex items-center gap-2 text-[9px] text-gray-600"><IconForPrompt item={item} /><span>0{idx + 1}</span></span>
                </div>
                <p className="text-[11px] text-gray-300 mt-3 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-600 mt-3">
                <span>LOAD COMMAND</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const element = event.currentTarget;
        shouldFollowStream.current = element.scrollHeight - element.scrollTop - element.clientHeight < 96;
      }}
      className="scoutyon-stream min-h-0 flex-1 overflow-y-auto p-4 md:p-5"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} isStreaming={isStreaming && message === messages[messages.length - 1]} />
      ))}

      {error && (
        <div role="alert" className="my-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Render session quotes at the bottom of the conversation */}
      {quotes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#1F2636] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <Sparkles className="w-4 h-4 text-[#696FFD]" />
            <span>Generated Purchase Quotes ({quotes.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quotes.map((quote) => (
              <QuoteCard
                key={'quoteId' in quote ? quote.quoteId : quote._id}
                quote={quote}
                onPreparePayment={onPreparePayment}
                onReject={onRejectQuote}
                isRejecting={isRejectingQuote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function IconForPrompt({ item }: { item: { icon: React.ComponentType<{ className?: string }> } }) {
  const Icon = item.icon;
  return <Icon className="h-3 w-3" />;
}
