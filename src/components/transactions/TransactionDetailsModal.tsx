import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { CopyButton } from '../common/CopyButton';
import type { Transaction } from '../../types/transaction.types';
import type { Quote } from '../../types/quote.types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Receipt, ExternalLink } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!transaction) return null;

  const quote = typeof transaction.quoteId === 'object' ? (transaction.quoteId as Quote) : null;
  const metadataMessage = typeof transaction.metadata?.message === 'string'
    ? transaction.metadata.message
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Settlement Record"
      description={`Ledger Reference: #${transaction._id.slice(-8)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2636]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold block">
              Counterparty
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {transaction.provider}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {transaction.simulated && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40">
                NEAR Testnet (Simulated)
              </span>
            )}
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-[#0E121A] border border-[#202738] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Authorized Amount</span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
          <div className="text-right text-xs text-gray-400">
            <span className="block">Settlement Rail</span>
            <span className="text-indigo-400 font-semibold">NEAR Intents (1Click)</span>
          </div>
        </div>

        {/* Intent & Blockchain Verification Identifiers */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
            <span>Onchain & Solver Intent Identifiers</span>
          </h4>

          {/* NEAR Intent ID */}
          <div className="p-3 bg-[#0F131C] border border-[#1A2130] rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                NEAR Intent ID
              </span>
              <span className="font-mono text-gray-200 truncate block mt-0.5">
                {transaction.nearIntentId || 'Intent Pending'}
              </span>
            </div>
            {transaction.nearIntentId && (
              <CopyButton textToCopy={transaction.nearIntentId} />
            )}
          </div>

          {/* Transaction Hash */}
          <div className="p-3 bg-[#0F131C] border border-[#1A2130] rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                Transaction Hash / Reference
              </span>
              <span className="font-mono text-gray-400 truncate block mt-0.5">
                {transaction.txHash || 'Simulated execution (no on-chain tx hash emitted)'}
              </span>
            </div>
            {transaction.txHash && (
              <CopyButton textToCopy={transaction.txHash} />
            )}
          </div>
        </div>

        {/* Related Quote Details */}
        {quote && (
          <div className="p-3 bg-[#0E121A] border border-[#202738] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between text-gray-400">
              <span>Related Quote Plan:</span>
              <span className="font-semibold text-gray-200">{quote.provider}</span>
            </div>
            <p className="text-gray-300">{quote.description}</p>
            {quote.sourceUrl && (
              <a
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 pt-1"
              >
                <span>Verified Pricing URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Metadata notes */}
        {metadataMessage && (
          <div className="p-3 bg-[#111622] border border-[#1F2636] rounded-xl text-xs text-gray-400">
            <span className="font-semibold text-gray-300 block mb-0.5">Execution Log:</span>
            <span>{metadataMessage}</span>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-500 pt-2 border-t border-[#1F2636]">
          <div>
            <span>Recorded: </span>
            <span className="text-gray-400">{formatDate(transaction.createdAt)}</span>
          </div>
          <div>
            <span>Status Updated: </span>
            <span className="text-gray-400">{formatDate(transaction.updatedAt)}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
