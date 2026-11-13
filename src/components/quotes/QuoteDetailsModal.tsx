import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import type { Quote } from '../../types/quote.types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { CreditCard, ExternalLink, Tag } from 'lucide-react';

interface QuoteDetailsModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onPreparePayment?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
}

export const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({
  quote,
  isOpen,
  onClose,
  onPreparePayment,
  onReject,
}) => {
  if (!quote) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quote Specifications"
      description={`Reference ID: #${quote._id.slice(-8)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status & Provider */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2636]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold block">
              Vendor / Provider
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">{quote.provider}</h3>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        {/* Pricing Card */}
        <div className="bg-[#0E121A] border border-[#202738] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Quoted Price</span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(quote.price, quote.currency)}
            </span>
          </div>
        </div>

        {/* Plan Details & Scope */}
        <div>
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Service & Plan Scope</span>
          </h4>
          <div className="p-3 bg-[#0F131C] border border-[#1A2130] rounded-xl text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
            {quote.description}
          </div>
        </div>

        {/* Source Verification URL */}
        {quote.sourceUrl && (
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quote source</span>
            </h4>
            <a
              href={quote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 bg-[#0E121A] hover:bg-[#161D2B] border border-[#1D2536] rounded-xl text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span className="truncate pr-2">{quote.sourceUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        {/* Rejection notice if present */}
        {quote.rejectionReason && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300">
            <span className="font-semibold block mb-0.5">Rejection Reason:</span>
            <span>{quote.rejectionReason}</span>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-500 pt-2 border-t border-[#1F2636]">
          <div>
            <span>Generated: </span>
            <span className="text-gray-400">{formatDate(quote.createdAt)}</span>
          </div>
          <div>
            <span>Last Updated: </span>
            <span className="text-gray-400">{formatDate(quote.updatedAt)}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2636]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {quote.status === 'pending' && onReject && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onClose();
                onReject(quote._id);
              }}
            >
              Reject
            </Button>
          )}

          {(quote.status === 'pending' || quote.status === 'approved') && onPreparePayment && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40"
              leftIcon={<CreditCard className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                onPreparePayment(quote._id);
              }}
            >
              Prepare payment
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
