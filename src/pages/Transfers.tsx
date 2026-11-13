import React from 'react';
import { ArrowLeftRight, CircleAlert, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPaymentReadiness, getSupportedPaymentAssets } from '../api/payments.api';
import { ErrorState } from '../components/common/ErrorState';
import { PageLoading } from '../components/common/Loading';
import { StatusBadge } from '../components/common/StatusBadge';

export const TransfersPage: React.FC = () => {
  const readinessQuery = useQuery({
    queryKey: ['payment-readiness'],
    queryFn: getPaymentReadiness,
  });
  const assetsQuery = useQuery({
    queryKey: ['supported-payment-assets'],
    queryFn: getSupportedPaymentAssets,
  });

  if (readinessQuery.isLoading || assetsQuery.isLoading) {
    return <PageLoading message="Checking backend payment capabilities..." />;
  }
  if (readinessQuery.isError || assetsQuery.isError) {
    const error = readinessQuery.error ?? assetsQuery.error;
    return (
      <ErrorState
        title="Payment capabilities could not be loaded"
        message={(error as Error)?.message}
        onRetry={() => {
          void Promise.all([readinessQuery.refetch(), assetsQuery.refetch()]);
        }}
      />
    );
  }

  const readiness = readinessQuery.data;
  const assets = assetsQuery.data;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-100">
          <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
          Transfers and swaps
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          This backend currently supports payment execution only for eligible vendor quotes and verified merchant invoices.
        </p>
      </header>

      <section role="status" className="flex items-start gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <h3 className="text-sm font-semibold text-amber-200">Standalone transfers are not available</h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            No API contract exists for a user-entered indicative swap quote, arbitrary destination, or independent transfer preparation. This page does not create a quote or initiate a transaction.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#202738] bg-[#121620] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
              <Wallet className="h-4 w-4 text-indigo-300" /> Quote-payment readiness
            </h3>
            <StatusBadge status={readiness?.ready ? 'ready' : 'unavailable'} />
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Provisioned wallet</dt><dd className="text-right text-gray-200">{readiness?.walletExists ? 'Available' : 'Unavailable'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Server signer delegation</dt><dd className="text-right text-gray-200">{readiness?.signerDelegated ? 'Available' : readiness?.signerError || 'Unavailable'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Live payment configuration</dt><dd className="text-right text-gray-200">{readiness?.livePaymentsEnabled ? 'Enabled' : 'Disabled'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Source network</dt><dd className="text-right text-gray-200">{readiness?.sourceAsset?.blockchain ?? 'Unavailable'}</dd></div>
            {readiness?.sourceAssetError && <div role="alert" className="rounded-md border border-amber-900/40 bg-amber-950/20 p-2 text-amber-200">{readiness.sourceAssetError}</div>}
          </dl>
        </div>

        <div className="rounded-xl border border-[#202738] bg-[#121620] p-5">
          <h3 className="text-sm font-semibold text-gray-100">Backend-supported assets</h3>
          <p className="mt-1 text-[11px] text-gray-500">These are configured for the merchant-payment flow and do not imply arbitrary swap support.</p>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Configured source assets</h4>
              {assets?.source.length ? (
                <ul className="mt-2 space-y-2">
                  {assets.source.map((asset) => <li key={asset.assetId} className="rounded-lg bg-[#0E121A] p-3 text-xs text-gray-200">{asset.symbol} · {asset.blockchain} <span className="text-gray-500">({asset.decimals} decimals)</span></li>)}
                </ul>
              ) : <p className="mt-2 text-xs text-gray-500">No source asset is configured.</p>}
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Verified merchant destinations</h4>
              {assets?.destinations.length ? (
                <ul className="mt-2 space-y-2">
                  {assets.destinations.map((asset) => <li key={asset.assetId} className="rounded-lg bg-[#0E121A] p-3 text-xs text-gray-200">{asset.symbol} · {asset.blockchain} <span className="text-gray-500">({asset.decimals} decimals)</span></li>)}
                </ul>
              ) : <p className="mt-2 text-xs text-gray-500">No verified merchant destination assets are configured.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
