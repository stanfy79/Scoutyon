import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Quote } from '../../types/quote.types';
import type { SSEQuoteData } from '../../types/agent.types';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ApprovalModalProps {
  quote: Quote | SSEQuoteData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quoteId: string) => Promise<unknown>;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null
  ) {
    const data = error.data as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  return error instanceof Error ? error.message : 'Failed to approve quote.';
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  quote,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  if (!quote) return null;
  const quoteId = 'quoteId' in quote ? quote.quoteId : quote._id;

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(quoteId);
      setApproved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setApproved(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Approve purchasing quote"
      description="Quote approval is separate from preparing and confirming a payment."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#202738] bg-[#0E121A] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400">Provider</span>
            <span className="font-semibold text-white">{quote.provider}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Purchase</span>
            <p className="mt-1 text-gray-200">{quote.description}</p>
          </div>
          <div className="flex items-center justify-between border-t border-[#1C2330] pt-3">
            <span className="text-xs text-gray-400">Quote price</span>
            <span className="text-lg font-bold text-white">
              {formatCurrency(quote.price, quote.currency)}
            </span>
          </div>
        </div>

        {approved ? (
          <div className="flex gap-2 rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Quote approved. No payment has been prepared, confirmed, or executed.
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Approving this quote does not prepare a payment or authorize a transfer.
          </p>
        )}

        {error && (
          <div role="alert" className="flex gap-2 rounded-xl border border-red-800/40 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[#1F2636] pt-3">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
            {approved ? 'Close' : 'Cancel'}
          </Button>
          {!approved && (
            <Button size="sm" onClick={handleApprove} 
            isLoading={isLoading}
            disabled={error == 'Prepare and review a payment before explicitly confirming it.'}>
              Approve quote
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
