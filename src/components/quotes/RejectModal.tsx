import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Quote } from '../../types/quote.types';
import type { SSEQuoteData } from '../../types/agent.types';

interface RejectModalProps {
  quote: Quote | SSEQuoteData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quoteId: string, reason?: string) => Promise<unknown>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  quote,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Price or features unsuitable');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!quote) return null;
  const quoteId = 'quoteId' in quote ? quote.quoteId : quote._id;

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(quoteId, reason.trim() || undefined);
      onClose();
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null
      ) {
        const data = err.data as Record<string, unknown>;
        if (typeof data.message === 'string') {
          setError(data.message);
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'Failed to reject quote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Purchase Quote"
      description={`Are you sure you want to decline the quote from ${quote.provider}?`}
    >
      <form onSubmit={handleReject} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Reason for Rejection (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Found alternative provider / Exceeds expected cost"
            className="w-full bg-[#0E121A] border border-[#202738] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2636]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isLoading}
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
