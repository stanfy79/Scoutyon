import type { PrivyWalletAction, TransferExecutableQuote, TransferQuotePreview } from '../types/transfer.types';

export function parseTransferPreview(value: unknown): TransferQuotePreview | null {
  if (!isRecord(value) || value.kind !== 'swap_preview' || value.executable !== false ||
    typeof value.quoteId !== 'string' || !value.quoteId || typeof value.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now() ||
    !isRecord(value.source) || !isRecord(value.destination)) return null;
  const source = value.source;
  const destination = value.destination;
  if (![source.asset, source.network, source.amount, destination.asset, destination.network,
    destination.amount].every(isNonEmptyString) ||
    (destination.minimumAmount !== null && typeof destination.minimumAmount !== 'string') ||
    (value.estimatedTimeSeconds !== null && (typeof value.estimatedTimeSeconds !== 'number' || !Number.isFinite(value.estimatedTimeSeconds) || value.estimatedTimeSeconds < 0))) return null;
  return value as unknown as TransferQuotePreview;
}

export function parseExecutableQuote(value: unknown): TransferExecutableQuote | null {
  if (!isRecord(value) || value.kind !== 'swap_executable_quote' || !isRecord(value.transfer)) return null;
  const transfer = value.transfer;
  if (typeof transfer.id !== 'string' || typeof transfer.status !== 'string' ||
    transfer.status !== 'pending_authorization' || typeof transfer.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(transfer.expiresAt)) || Date.parse(transfer.expiresAt) <= Date.now() ||
    !isRecord(transfer.source) || !isRecord(transfer.destination) ||
    !isNonEmptyString(transfer.depositAddress)) return null;
  return value as unknown as TransferExecutableQuote;
}

export function parsePrivyAction(value: unknown): PrivyWalletAction | null {
  if (!isRecord(value) || value.type !== 'privy_wallet_send_transaction' ||
    typeof value.transferId !== 'string' || typeof value.sessionId !== 'string' ||
    typeof value.chainId !== 'number' || !isNonEmptyString(value.from) || !isRecord(value.transaction) ||
    !isNonEmptyString(value.transaction.to) || !isNonEmptyString(value.transaction.data) ||
    typeof value.transaction.value !== 'string' || !isRecord(value.reviewedTransfer) ||
    !isNonEmptyString(value.reviewedTransfer.destinationRecipient)) return null;
  return value as unknown as PrivyWalletAction;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
