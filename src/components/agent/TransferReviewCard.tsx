import React, { useState } from 'react';
import { ArrowDown, ChevronDown, ChevronUp, Clock3, ShieldCheck } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';
import type { TransferPrepareRequest } from './transferPrepareRequest';

function shorten(value: string): string {
  return value.length > 18 ? `${value.slice(0, 6)}...${value.slice(-7)}` : value;
}

function formatAmount(amount: string, asset: string): { amount: string; symbol: string } {
  const symbol = asset.split(/[ (]/, 1)[0] || asset;
  const match = amount.match(/^\s*(\d+(?:\.\d+)?)\s*([^\s]*)\s*$/);
  if (!match) return { amount, symbol };
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return { amount, symbol: match[2] || symbol };
  return { amount: new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(numeric), symbol: match[2] || symbol };
}

function friendlyStatus(status: string): string {
  if (status === 'pending_user_review') return 'Awaiting your review';
  return status.replaceAll('_', ' ');
}

export const TransferReviewCard: React.FC<{ request: TransferPrepareRequest }> = ({ request }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const details = request.transferDetails;
  const value = formatAmount(details.amount, details.sourceAsset);
  const sameNetwork = details.sourceNetwork.trim().toLowerCase() === details.destinationNetwork.trim().toLowerCase();
  const sameAsset = details.sourceAssetId.trim().toLowerCase() === details.destinationAssetId.trim().toLowerCase();
  const operationLabel = sameNetwork && sameAsset ? 'Same-network transfer' : sameAsset ? 'Cross-chain transfer' : sameNetwork ? 'Token swap' : 'Cross-chain swap';
  const sourceSymbol = details.sourceAsset.split(/[ (]/, 1)[0] || details.sourceAsset;
  const destinationSymbol = details.destinationAsset.split(/[ (]/, 1)[0] || details.destinationAsset;
  const status = friendlyStatus(request.status);

  return (
    <section className="transfer-review" aria-label="Transaction review">
      <header className="transfer-review-header">
        <div className="transfer-review-heading"><span className="transfer-review-icon"><ShieldCheck className="h-4 w-4" /></span><div><h2>Transaction review</h2><p>{operationLabel}</p></div></div>
        <span className="transfer-review-status"><span className="status-indicator" />{status}</span>
      </header>

      <div className="transfer-amount-block">
        <div className="transfer-amount">{value.amount} <span>{value.symbol}</span></div>
        <div className="transfer-asset-caption">{value.symbol === 'USDC' ? 'USD Coin' : details.sourceAsset} · {details.sourceNetwork}</div>
      </div>

      <div className="transfer-route" aria-label={`${details.sourceAsset} on ${details.sourceNetwork} to ${details.destinationAsset} on ${details.destinationNetwork}`}>
        <div className="transfer-endpoint"><span>FROM</span><strong>{sourceSymbol}</strong><small>{details.sourceNetwork}</small></div>
        <div className="transfer-route-connector"><i /><ArrowDown className="h-4 w-4" /></div>
        <div className="transfer-endpoint"><span>TO</span><strong>{destinationSymbol}</strong><small>{details.destinationNetwork}</small></div>
      </div>

      <div className="transfer-recipient">
        <div><span className="transfer-field-label">RECIPIENT</span><code title={details.recipientAddress}>{shorten(details.recipientAddress)}</code></div>
        <CopyButton textToCopy={details.recipientAddress} label="Copy address" className="transfer-copy" />
      </div>

      <button className="transfer-details-toggle" type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
        <span>Advanced transaction details</span>{detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {detailsOpen && <div className="transfer-advanced">
        <TechnicalField label="Source asset ID" value={details.sourceAssetId} />
        <TechnicalField label="Destination asset ID" value={details.destinationAssetId} />
        <TechnicalField label="Source network" value={details.sourceNetwork} />
        <TechnicalField label="Destination network" value={details.destinationNetwork} />
        <TechnicalField label="Amount (atomic units)" value={details.amountAtomicUnits} />
      </div>}

      <footer className="transfer-review-footer">
        <p><Clock3 className="h-4 w-4 shrink-0" />{request.requiresExplicitConfirmation
          ? 'Explicit confirmation is required. This response does not include a persisted payment preparation ID, so it cannot be authorized yet.'
          : 'No confirmation action is available for this response.'}</p>
      </footer>
    </section>
  );
};

const TechnicalField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="transfer-technical-field"><span>{label}</span><code title={value}>{value}</code><CopyButton textToCopy={value} label="Copy" className="transfer-copy" /></div>
);
