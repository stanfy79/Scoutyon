import React, { useState } from 'react';
import { AlertCircle, Building2, ExternalLink, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import { Button } from '../components/common/Button';
import { ErrorState } from '../components/common/ErrorState';
import { PageLoading } from '../components/common/Loading';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Vendor, VendorDiscovery, VendorDiscoveryInput } from '../types/vendor.types';
import { formatDate } from '../utils/formatDate';

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Vendor discovery request failed.';
}

export const VendorsPage: React.FC = () => {
  const {
    vendors,
    isLoading,
    isError,
    error,
    refetch,
    discover,
    isDiscovering,
    refresh,
    isRefreshing,
  } = useVendors();
  const [requirement, setRequirement] = useState('');
  const [candidateUrls, setCandidateUrls] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [budgetMaximum, setBudgetMaximum] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [discovery, setDiscovery] = useState<VendorDiscovery | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleDiscover = async (event: React.FormEvent) => {
    event.preventDefault();
    const urls = splitLines(candidateUrls);
    if (!requirement.trim()) {
      setRequestError('Describe the product or service you need.');
      return;
    }
    if (urls.some((url) => {
      try {
        return !['http:', 'https:'].includes(new URL(url).protocol);
      } catch {
        return true;
      }
    })) {
      setRequestError('Each candidate site must be a complete http:// or https:// URL.');
      return;
    }

    const maximum = budgetMaximum.trim() ? Number(budgetMaximum) : undefined;
    if (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) {
      setRequestError('Budget maximum must be a non-negative number.');
      return;
    }

    const input: VendorDiscoveryInput = {
      requirement: requirement.trim(),
      candidateUrls: urls,
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(specifications.trim() ? { specifications: splitLines(specifications) } : {}),
      ...(maximum !== undefined ? { budget: { maximum, currency: budgetCurrency.trim() || 'USD' } } : {}),
    };

    setRequestError(null);
    try {
      const response = await discover(input);
      setDiscovery(response.discovery);
      setSelectedVendor(response.vendors[0] ?? null);
    } catch (requestFailure) {
      setRequestError(getErrorMessage(requestFailure));
    }
  };

  const handleRefresh = async (vendor: Vendor) => {
    setRequestError(null);
    try {
      const updatedVendor = await refresh(vendor._id);
      setSelectedVendor(updatedVendor);
    } catch (requestFailure) {
      setRequestError(getErrorMessage(requestFailure));
    }
  };

  if (isLoading) return <PageLoading message="Loading saved vendor records..." />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to load vendors"
        message={(error as Error)?.message}
        onRetry={refetch}
      />
    );
  }

  const discoveryVendors = discovery
    ? vendors.filter((vendor) => discovery.results.some((result) => result.vendorId === vendor._id))
    : [];
  const displayedVendors = discovery ? discoveryVendors : vendors;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-100">
          <Building2 className="h-5 w-5 text-indigo-400" />
          Discover and review vendors
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Review evidence collected from supplier websites. The backend currently checks candidate URLs you provide; it does not search the web from a description alone.
        </p>
      </header>

      <form onSubmit={handleDiscover} className="space-y-4 rounded-xl border border-[#202738] bg-[#121620] p-5">
        <div>
          <label htmlFor="vendor-requirement" className="mb-1.5 block text-xs font-medium text-gray-300">
            What are you looking for?
          </label>
          <textarea
            id="vendor-requirement"
            required
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] p-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            placeholder="Describe the product or service and important requirements"
          />
        </div>

        <div>
          <label htmlFor="candidate-urls" className="mb-1.5 block text-xs font-medium text-gray-300">
            Supplier websites to review (one URL per line)
          </label>
          <textarea
            id="candidate-urls"
            value={candidateUrls}
            onChange={(event) => setCandidateUrls(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] p-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            placeholder={'https://supplier.example\nhttps://another-supplier.example'}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            No URLs means the backend returns no results; no vendors are generated while searching.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-gray-400">
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" />
          </label>
          <label className="text-xs text-gray-400">
            Preferred location
            <input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" />
          </label>
          <label className="text-xs text-gray-400">
            Maximum budget
            <input type="number" min="0" step="0.01" value={budgetMaximum} onChange={(event) => setBudgetMaximum(event.target.value)} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" />
          </label>
          <label className="text-xs text-gray-400">
            Budget currency
            <input value={budgetCurrency} onChange={(event) => setBudgetCurrency(event.target.value.toUpperCase())} maxLength={3} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" />
          </label>
          <label className="text-xs text-gray-400 sm:col-span-2 lg:col-span-1">
            Specifications (one per line)
            <textarea value={specifications} onChange={(event) => setSpecifications(event.target.value)} rows={1} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" />
          </label>
        </div>
        <Button type="submit" isLoading={isDiscovering} leftIcon={<Search className="h-4 w-4" />}>
          Review candidate sites
        </Button>
      </form>

      {requestError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {requestError}
        </div>
      )}

      {discovery && (
        <section className="rounded-xl border border-[#202738] bg-[#121620] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-100">Latest review</h3>
              <p className="mt-1 text-xs text-gray-400">{discovery.requirement}</p>
            </div>
            <StatusBadge status={discovery.status} />
          </div>
          {discovery.status === 'no_results' && (
            <p className="mt-3 text-xs text-gray-400">No candidate sites were provided or no vendor records could be reviewed.</p>
          )}
          {discovery.status === 'failed' && (
            <p className="mt-3 text-xs text-amber-300">The backend reported that this review failed.</p>
          )}
          {discovery.results.some((result) => !result.vendorId) && (
            <ul className="mt-3 space-y-2">
              {discovery.results.filter((result) => !result.vendorId).map((result, index) => (
                <li key={`${result.website ?? result.name}-${index}`} className="rounded-lg border border-[#202738] bg-[#0E121A] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-200">{result.name}</span>
                    <StatusBadge status={result.verificationStatus ?? 'unavailable'} />
                  </div>
                  {result.website && <p className="mt-1 break-all text-[11px] text-gray-500">{result.website}</p>}
                  {result.summary && <p className="mt-1 text-xs text-gray-400">{result.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">{discovery ? 'Review results' : 'Saved vendors'}</h3>
          {displayedVendors.length === 0 ? (
            <div className="rounded-xl border border-[#202738] bg-[#121620] p-8 text-center">
              <Building2 className="mx-auto mb-2 h-6 w-6 text-gray-500" />
              <p className="text-sm font-semibold text-gray-300">No vendor records yet</p>
              <p className="mt-1 text-xs text-gray-500">Submit candidate websites above to create a review.</p>
            </div>
          ) : displayedVendors.map((vendor) => (
            <button
              type="button"
              key={vendor._id}
              onClick={() => setSelectedVendor(vendor)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedVendor?._id === vendor._id ? 'border-indigo-500/50 bg-indigo-950/20' : 'border-[#202738] bg-[#121620] hover:border-[#39445A]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-100">{vendor.name}</p>
                  {vendor.website && <p className="mt-1 truncate text-xs text-gray-500">{vendor.website}</p>}
                </div>
                <StatusBadge status={vendor.verificationStatus} />
              </div>
              {vendor.description && <p className="mt-2 line-clamp-2 text-xs text-gray-400">{vendor.description}</p>}
            </button>
          ))}
        </section>

        <section className="min-h-56 rounded-xl border border-[#202738] bg-[#121620] p-5">
          {!selectedVendor ? (
            <div className="flex h-full min-h-48 items-center justify-center text-center text-xs text-gray-500">
              Select a vendor to inspect the information returned by the backend.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-100">{selectedVendor.name}</h3>
                  <p className="mt-1 text-xs text-gray-400">{selectedVendor.location || 'Location unavailable'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedVendor.verificationStatus} />
                  <Button size="sm" variant="outline" isLoading={isRefreshing} onClick={() => void handleRefresh(selectedVendor)} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Refresh evidence
                  </Button>
                </div>
              </div>

              {selectedVendor.website && (
                <a className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200" href={selectedVendor.website} target="_blank" rel="noreferrer">
                  Open website <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {selectedVendor.description && <p className="text-sm text-gray-300">{selectedVendor.description}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#0E121A] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pricing</p>
                  <p className="mt-1 text-xs text-gray-300">
                    {selectedVendor.pricing?.typicalPrice !== undefined
                      ? `${selectedVendor.pricing.typicalPrice} ${selectedVendor.pricing.currency ?? ''}`
                      : 'Unavailable'}
                  </p>
                  {selectedVendor.pricing?.notes && <p className="mt-1 text-[11px] text-gray-500">{selectedVendor.pricing.notes}</p>}
                </div>
                <div className="rounded-lg bg-[#0E121A] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Products and services</p>
                  <p className="mt-1 text-xs text-gray-300">{selectedVendor.products.join(', ') || 'Unavailable'}</p>
                </div>
                <div className="rounded-lg bg-[#0E121A] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Shipping and returns</p>
                  <p className="mt-1 text-xs text-gray-300">{selectedVendor.shipping?.notes || 'Shipping details unavailable'}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{selectedVendor.refundPolicy || 'Return/refund policy unavailable'}</p>
                </div>
                <div className="rounded-lg bg-[#0E121A] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Payment methods</p>
                  <p className="mt-1 text-xs text-gray-300">{selectedVendor.paymentMethods.join(', ') || 'Unavailable'}</p>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" /> Evidence returned by backend
                </h4>
                {selectedVendor.evidence.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">No evidence is available for this vendor.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedVendor.evidence.map((item, index) => (
                      <li key={`${item.source}-${item.collectedAt}-${index}`} className="rounded-lg border border-[#202738] bg-[#0E121A] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-200">{item.source}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{item.summary}</p>
                        <div className="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-gray-500">
                          <span>{formatDate(item.collectedAt)}</span>
                          {item.url && <a className="text-indigo-300" href={item.url} target="_blank" rel="noreferrer">Source</a>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Reliability score: {selectedVendor.reliabilityScore}. This backend score is not an official verification badge.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
