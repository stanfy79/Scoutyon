import React from 'react';
import { ExternalLink, X, ShieldAlert, Sparkles, CreditCard } from 'lucide-react';
import type { Quote } from '../../types/quote.types';
import type { SSEQuoteData } from '../../types/agent.types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface QuoteCardProps {
  quote: Quote | SSEQuoteData;
  onPreparePayment?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
  isPreparingPayment?: boolean;
  isRejecting?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  onPreparePayment,
  onReject,
  isPreparingPayment,
  isRejecting,
}) => {
  const quoteId = 'quoteId' in quote ? quote.quoteId : quote._id;
  const isPending = quote.status === 'pending';
  const canPreparePayment = isPending || quote.status === 'approved';

  return (
    <div className="bg-[#141924] border border-[#232B3B] rounded-xl p-4 shadow-md transition-all hover:border-[#2E394E]">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-sm font-bold text-gray-100">{quote.provider}</h4>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {quote.description}
          </p>
        </div>

        <StatusBadge status={quote.status} />
      </div>

      {/* Price row */}
      <div className="my-3 py-2 px-3 bg-[#0E121A] border border-[#1D2433] rounded-lg flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">Quoted amount</span>
        <div className="text-right">
          <span className="text-base font-bold text-white">
            {formatCurrency(quote.price, quote.currency)}
          </span>
        </div>
      </div>

      {/* Source URL link */}
      {quote.sourceUrl && (
        <div className="mb-3">
          <a
            href={quote.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Open quote source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Rejection notice if rejected */}
      {(quote as Quote).rejectionReason && (
        <div className="p-2.5 mb-3 bg-red-950/25 border border-red-900/40 rounded-lg text-xs text-red-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{(quote as Quote).rejectionReason}</span>
        </div>
      )}

      {/* Actions */}
      {((isPending && onReject) || (canPreparePayment && onPreparePayment)) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1F2636]">
          {canPreparePayment && onPreparePayment && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onPreparePayment(quoteId)}
              isLoading={isPreparingPayment}
              disabled={isRejecting}
              className="flex-1"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Prepare payment
            </Button>
          )}

          {isPending && onReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(quoteId)}
              isLoading={isRejecting}
              disabled={isPreparingPayment}
              className="text-gray-400 hover:text-red-400 hover:border-red-800/40"
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
