import React, { useState } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { QuoteTable } from '../components/quotes/QuoteTable';
import { QuoteDetailsModal } from '../components/quotes/QuoteDetailsModal';
import { RejectModal } from '../components/quotes/RejectModal';
import { PageLoading } from '../components/common/Loading';
import { ErrorState } from '../components/common/ErrorState';
import type { Quote } from '../types/quote.types';
import { FileCheck } from 'lucide-react';
import { PaymentPreparationModal } from '../components/quotes/PaymentPreparationModal';

export const QuotesPage: React.FC = () => {
  const {
    quotes,
    isLoading,
    isError,
    error,
    refetch,
    preparePayment,
    confirmPayment,
    rejectQuote,
  } = useQuotes();

  const [inspectQuote, setInspectQuote] = useState<Quote | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Quote | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Quote | null>(null);

  const handleRejectClick = (quoteId: string) => {
    const q = quotes.find((item) => item._id === quoteId);
    if (q) setRejectTarget(q);
  };

  const handlePreparePaymentClick = (quoteId: string) => {
    const q = quotes.find((item) => item._id === quoteId);
    if (q) setPaymentTarget(q);
  };

  if (isLoading) {
    return <PageLoading message="Loading quote records..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load quotes"
        message={(error as Error)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-400" />
          <span>Quotes & Purchases</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Review quotes and prepare eligible payments for explicit review. Quote approval is not available in the current backend contract.
        </p>
      </div>

      {/* Main Table */}
      <QuoteTable
        quotes={quotes}
        onViewDetails={(q) => setInspectQuote(q)}
        onPreparePayment={handlePreparePaymentClick}
        onReject={handleRejectClick}
      />

      {/* Inspection Modal */}
      <QuoteDetailsModal
        quote={inspectQuote}
        isOpen={!!inspectQuote}
        onClose={() => setInspectQuote(null)}
        onPreparePayment={handlePreparePaymentClick}
        onReject={handleRejectClick}
      />

      {paymentTarget && (
        <PaymentPreparationModal
          key={paymentTarget._id}
          quote={paymentTarget}
          isOpen
          onClose={() => setPaymentTarget(null)}
          onPrepare={preparePayment}
          onConfirm={confirmPayment}
        />
      )}

      {/* Explicit Rejection Confirmation Modal */}
      <RejectModal
        quote={rejectTarget}
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (id, reason) => {
          await rejectQuote({ quoteId: id, reason });
        }}
      />
    </div>
  );
};
