import React, { useEffect, useState } from 'react';
import { ArrowDown, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { ChatResponseType } from '../../types/agent.types';
import type { PreparedTransfer, PrivyWalletAction, TransferExecutableQuote, TransferQuotePreview } from '../../types/transfer.types';
import { Button } from '../common/Button';
import { parseExecutableQuote, parsePrivyAction, parseTransferPreview } from '../../utils/transferPayload';

type TransferCardData = TransferQuotePreview | TransferExecutableQuote | PrivyWalletAction | Record<string, unknown>;

interface Props {
  responseType: ChatResponseType;
  data: TransferCardData;
  onAction?: (prompt: string) => void;
  onAuthorize?: (action: PrivyWalletAction) => Promise<void>;
  isAuthorizing?: boolean;
}

export const TransferLifecycleCard: React.FC<Props> = ({ responseType, data, onAction, onAuthorize, isAuthorizing = false }) => {
  if (responseType === 'transfer_quote_preview') {
    const preview = parseTransferPreview(data);
    return preview ? <PreviewCard preview={preview} onPrepare={() => onAction?.('Proceed with the current transfer quote.')} /> : null;
  }
  if (responseType === 'transfer_preparation') {
    const prepared = parseExecutableQuote(data);
    return prepared ? <PreparedCard transfer={prepared.transfer} onConfirm={() => onAction?.('Confirm this prepared transfer.')} /> : null;
  }
  if (responseType === 'transfer_authorization') {
    const action = parsePrivyAction(data);
    return action ? <AuthorizationCard action={action} onAuthorize={onAuthorize} isAuthorizing={isAuthorizing} /> : null;
  }
  return null;
};

const PreviewCard: React.FC<{ preview: TransferQuotePreview; onPrepare: () => void }> = ({ preview, onPrepare }) => {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setActive(false), Math.max(0, Date.parse(preview.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [preview.expiresAt]);
  if (!active) return null;
  return <CardShell title="Live transfer quote" subtitle="Review the route before preparation" status="Preview · not executable">
    <Route source={preview.source} destination={preview.destination} />
    <dl className="transfer-quote-metrics">
      <Metric label="Amount sent" value={`${preview.source.amount} ${preview.source.asset}`} />
      <Metric label="Expected received" value={`${preview.destination.amount} ${preview.destination.asset}`} />
      <Metric label="Minimum received (base units)" value={preview.destination.minimumAmount ? `${preview.destination.minimumAmount} ${preview.destination.asset}` : 'Not provided by quote provider'} />
      <Metric label="Estimated time" value={preview.estimatedTimeSeconds === null ? 'Not provided by quote provider' : formatDuration(preview.estimatedTimeSeconds)} />
      <Metric label="Quote expires" value={new Date(preview.expiresAt).toLocaleTimeString()} />
    </dl>
    {preview.feeDisclosure && <p className="transfer-quote-note">{preview.feeDisclosure}</p>}
    <Button size="sm" onClick={onPrepare} disabled={!active}>Prepare this transfer</Button>
  </CardShell>;
};

const PreparedCard: React.FC<{ transfer: PreparedTransfer; onConfirm: () => void }> = ({ transfer, onConfirm }) => <CardShell title="Transfer prepared" subtitle="Executable quote · wallet confirmation required" status="Awaiting your confirmation">
  <Route source={{ asset: transfer.source.symbol, network: transfer.source.blockchain, amount: formatAtomic(transfer.source.amountAtomic, transfer.source.decimals) }} destination={{ asset: transfer.destination.symbol, network: transfer.destination.blockchain, amount: formatAtomic(transfer.destination.amountAtomic, transfer.destination.decimals) }} />
  <dl className="transfer-quote-metrics">
    <Metric label="Minimum received" value={`${formatAtomic(transfer.destination.minimumAmountAtomic, transfer.destination.decimals)} ${transfer.destination.symbol}`} />
    <Metric label="Deposit address" value={transfer.depositAddress} />
    <Metric label="Destination" value={transfer.destination.recipient} />
    <Metric label="Quote expires" value={new Date(transfer.expiresAt).toLocaleTimeString()} />
  </dl>
  <Button size="sm" onClick={onConfirm}>Review and confirm transfer</Button>
</CardShell>;

const AuthorizationCard: React.FC<{ action: PrivyWalletAction; onAuthorize?: (action: PrivyWalletAction) => Promise<void>; isAuthorizing: boolean }> = ({ action, onAuthorize, isAuthorizing }) => <CardShell title="Privy authorization" subtitle="Scoutyon has not signed or sent this transaction" status="Explicit wallet approval required">
  <dl className="transfer-quote-metrics">
    <Metric label="Sending" value={`${action.reviewedTransfer.sourceSymbol} · ${action.reviewedTransfer.sourceBlockchain}`} />
    <Metric label="Receiving" value={`${action.reviewedTransfer.destinationSymbol} · ${action.reviewedTransfer.destinationBlockchain}`} />
    <Metric label="Destination address" value={action.reviewedTransfer.destinationRecipient} />
    <Metric label="Minimum received" value={action.reviewedTransfer.minimumAmountOutAtomic} />
  </dl>
  <Button size="sm" onClick={() => void onAuthorize?.(action)} disabled={!onAuthorize || isAuthorizing} leftIcon={isAuthorizing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}>
    {isAuthorizing ? 'Waiting for Privy…' : 'Authorize in Privy'}
  </Button>
</CardShell>;

const CardShell: React.FC<{ title: string; subtitle: string; status: string; children: React.ReactNode }> = ({ title, subtitle, status, children }) => <section className="transfer-review" aria-label={title}>
  <header className="transfer-review-header"><div className="transfer-review-heading"><span className="transfer-review-icon"><ShieldCheck className="h-4 w-4" /></span><div><h2>{title}</h2><p>{subtitle}</p></div></div><span className="transfer-review-status"><span className="status-indicator" />{status}</span></header>
  <div className="transfer-lifecycle-body">{children}</div>
</section>;

const Route: React.FC<{ source: { asset: string; network: string; amount: string }; destination: { asset: string; network: string; amount: string } }> = ({ source, destination }) => <div className="transfer-route"><div className="transfer-endpoint"><span>FROM</span><strong>{source.amount} {source.asset}</strong><small>{source.network}</small></div><div className="transfer-route-connector"><i /><ArrowDown className="h-4 w-4" /></div><div className="transfer-endpoint"><span>TO</span><strong>{destination.amount} {destination.asset}</strong><small>{destination.network}</small></div></div>;

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div><dt>{label}</dt><dd title={value}>{value}</dd></div>;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  return `${Math.ceil(seconds / 60)} minutes`;
}

function formatAtomic(amount: string, decimals: number): string {
  if (!/^\d+$/.test(amount) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return amount;
  const base = 10n ** BigInt(decimals);
  const whole = BigInt(amount) / base;
  const fraction = (BigInt(amount) % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

