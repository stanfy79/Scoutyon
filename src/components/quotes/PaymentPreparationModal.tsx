import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import type {
  PaymentConfirmationResponse,
  PaymentPreparationResponse,
  PaymentPreview,
} from '../../types/payment.types';
import type { Quote } from '../../types/quote.types';
import type { SSEQuoteData } from '../../types/agent.types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatCurrency';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';

interface PaymentPreparationModalProps {
  quote: Quote | SSEQuoteData | null;
  isOpen: boolean;
  onClose: () => void;
  onPrepare: (quoteId: string) => Promise<PaymentPreparationResponse>;
  onConfirm: (paymentId: string) => Promise<PaymentConfirmationResponse>;
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
  return error instanceof Error ? error.message : 'The payment request failed.';
}

function isExpired(payment: PaymentPreview): boolean {
  const expiration = Date.parse(payment.expiresAt);
  return Number.isFinite(expiration) && expiration <= Date.now();
}

export const PaymentPreparationModal: React.FC<PaymentPreparationModalProps> = ({
  quote,
  isOpen,
  onClose,
  onPrepare,
  onConfirm,
}) => {
  const [payment, setPayment] = useState<PaymentPreview | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<PaymentPreview | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentStatusQuery = usePaymentStatus(payment?.id, confirmationSent);

  if (!quote) return null;
  const quoteId = 'quoteId' in quote ? quote.quoteId : quote._id;

  const busy = isPreparing || isConfirming;
  const handleClose = () => {
    if (!busy) onClose();
  };

  const handlePrepare = async () => {
    setIsPreparing(true);
    setError(null);
    try {
      const response = await onPrepare(quoteId);
      setPayment(response.payment);
      setConfirmedPayment(null);
      setConfirmationSent(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsPreparing(false);
    }
  };

  const handleConfirm = async () => {
    if (!payment || confirmationSent || isExpired(payment)) return;
    setIsConfirming(true);
    setError(null);
    try {
      const response = await onConfirm(payment.id);
      setConfirmationSent(true);
      setConfirmedPayment(response.payment);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsConfirming(false);
    }
  };

  const latestPayment = paymentStatusQuery.data ?? confirmedPayment;
  const currentPayment = payment
    ? { ...payment, ...(latestPayment ?? {}) }
    : null;
  const expired = currentPayment ? isExpired(currentPayment) : false;
  const settled = currentPayment?.status === 'SUCCESS';
  const paymentFailed = ['FAILED', 'EXPIRED', 'REFUNDED', 'INCOMPLETE_DEPOSIT'].includes(
    currentPayment?.status ?? '',
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentPayment ? 'Review payment details' : 'Prepare a payment'}
      description="Quote approval and payment confirmation are separate actions."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#202738] bg-[#0E121A] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400">Merchant</span>
            <span className="font-semibold text-white">{currentPayment?.merchant || quote.provider}</span>
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

        {!currentPayment && (
          <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-3 text-xs text-indigo-200">
            Preparing creates a payment preview and may reserve budget. It does not transfer funds.
            Review the returned payment details before confirming.
          </div>
        )}

        {payment && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">Payment preview</span>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                  payment.simulation
                    ? 'border-purple-800/50 bg-purple-950/30 text-purple-300'
                    : 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                }`}
              >
                {payment.simulation ? 'Simulated' : 'Live payment'}
              </span>
            </div>

            <div className="rounded-xl border border-[#202738] bg-[#0E121A] p-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Payment status</span>
                <span className="font-semibold text-gray-200">{payment.status}</span>
              </div>
              <div className="border-t border-[#1C2330] pt-3">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Source</span>
                  <span className="text-right font-semibold text-gray-100">
                    {payment.source.amount} {payment.source.asset} · {payment.source.chain}
                  </span>
                </div>
                {payment.maximumInput && (
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-gray-400">Maximum source amount</span>
                    <span className="text-right text-gray-200">
                      {payment.maximumInput} {payment.source.asset}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-[#1C2330] pt-3">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Destination</span>
                  <span className="text-right font-semibold text-gray-100">
                    {payment.destination.amount} {payment.destination.asset} · {payment.destination.chain}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-400">Merchant recipient</span>
                  <span className="max-w-[65%] break-all text-right font-mono text-gray-200">
                    {payment.destination.recipient}
                  </span>
                </div>
              </div>
              {payment.invoiceId && (
                <div className="flex justify-between gap-3 border-t border-[#1C2330] pt-3">
                  <span className="text-gray-400">Invoice</span>
                  <span className="break-all text-right text-gray-200">{payment.invoiceId}</span>
                </div>
              )}
              {payment.estimatedNetworkFeeAtomic && (
                <div className="flex justify-between gap-3 border-t border-[#1C2330] pt-3">
                  <span className="text-gray-400">Estimated network fee (atomic units)</span>
                  <span className="text-right text-gray-200">
                    {payment.estimatedNetworkFeeAtomic}
                  </span>
                </div>
              )}
              {currentPayment?.sourceTransactionHash && (
                <div className="flex justify-between gap-3 border-t border-[#1C2330] pt-3">
                  <span className="text-gray-400">Source transaction</span>
                  <span className="max-w-[65%] break-all text-right font-mono text-gray-200">
                    {currentPayment?.sourceTransactionHash}
                  </span>
                </div>
              )}
              {currentPayment?.destinationTransactionHash && (
                <div className="flex justify-between gap-3 border-t border-[#1C2330] pt-3">
                  <span className="text-gray-400">Destination transaction</span>
                  <span className="max-w-[65%] break-all text-right font-mono text-gray-200">
                    {currentPayment?.destinationTransactionHash}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-[#1C2330] pt-3">
                <span className="text-gray-400">Expires</span>
                <span className="text-right text-gray-200">
                  {Number.isFinite(Date.parse(payment.expiresAt))
                    ? new Date(payment.expiresAt).toLocaleString()
                    : payment.expiresAt}
                </span>
              </div>
            </div>

            {payment.simulation ? (
              <p className="rounded-lg border border-purple-900/50 bg-purple-950/20 p-3 text-xs text-purple-200">
                This is a backend-reported simulation. No real tokens are transferred.
              </p>
            ) : (
              <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-200">
                This is a live payment. Nothing has been transferred yet. Confirming authorizes the
                backend to initiate the payment; settlement is not complete until the backend reports
                status SUCCESS.
              </p>
            )}

            {expired && (
              <div role="alert" className="flex gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-200">
                <Clock3 className="h-4 w-4 shrink-0" />
                <span>This payment preview has expired and cannot be confirmed.</span>
              </div>
            )}

            {confirmationSent && !settled && (
              <div className="flex gap-2 rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-3 text-xs text-indigo-200">
                {paymentFailed ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <Clock3 className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {paymentFailed
                    ? `The backend reports payment status ${currentPayment?.status}. No successful settlement is claimed.`
                    : `Confirmation was submitted. Backend payment status is ${
                        currentPayment?.status || 'not yet available'
                      }; this is not a settlement confirmation.`}
                </span>
              </div>
            )}
            {confirmationSent && paymentStatusQuery.isError && (
              <div role="alert" className="flex gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Could not refresh payment status: {(paymentStatusQuery.error as Error).message}.
                  No settlement success is assumed.
                </span>
              </div>
            )}

            {settled && (
              <div className="flex gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  The backend reports that payment settled. Merchant fulfillment is separate and is
                  not confirmed by this response.
                </span>
              </div>
            )}

            {!settled && !confirmationSent && (
              <div className="flex gap-2 rounded-lg border border-[#30384A] bg-[#151B27] p-3 text-xs text-gray-300">
                <ShieldAlert className="h-4 w-4 shrink-0 text-indigo-300" />
                <span>
                  Confirming sends only the payment ID and explicit confirmation. The backend
                  revalidates the stored payment details and policy.
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800/40 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#1F2636] pt-3">
          {payment && !settled && !confirmationSent && (
            <Button variant="outline" size="sm" onClick={handleClose} disabled={busy}>
              Close without confirming
            </Button>
          )}
          {!payment && (
            <Button variant="outline" size="sm" onClick={handleClose} disabled={busy}>
              Close
            </Button>
          )}
          {!payment && (
            <Button
              size="sm"
              onClick={handlePrepare}
              isLoading={isPreparing}
              disabled={isConfirming || error == 'This provider has not registered a verified crypto payment method'}
            >
              Prepare payment
            </Button>
          )}
          {payment && !settled && !confirmationSent && (
            <Button
              size="sm"
              onClick={handleConfirm}
              isLoading={isConfirming}
              disabled={busy || expired || payment.status !== 'AWAITING_USER_CONFIRMATION'}
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40"
            >
              {payment.simulation ? 'Confirm simulation' : 'Confirm live payment'}
            </Button>
          )}
          {(settled || confirmationSent) && (
            <Button size="sm" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>

        {payment && !settled && !confirmationSent && (
          <p className="text-[11px] text-gray-500">
            Closing leaves this preparation active on the server until it expires. A budget
            reservation may remain active. No cancellation endpoint is available in the provided
            backend contract.
          </p>
        )}
      </div>
    </Modal>
  );
};
