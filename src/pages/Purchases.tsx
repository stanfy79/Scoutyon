import React, { useState } from 'react';
import { AlertCircle, ClipboardList, Plus, X } from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import { usePurchaseActivity, usePurchases } from '../hooks/usePurchases';
import { Button } from '../components/common/Button';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';
import { PageLoading } from '../components/common/Loading';
import { StatusBadge } from '../components/common/StatusBadge';
import type { CreatePurchaseInput, Purchase, PurchaseStatus } from '../types/purchase.types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const statuses: Array<'all' | PurchaseStatus> = [
  'all', 'draft', 'submitted', 'approved', 'rejected', 'paid', 'fulfilled', 'cancelled', 'failed',
];

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'message' in error.data &&
    typeof error.data.message === 'string'
  ) return error.data.message;
  return error instanceof Error ? error.message : 'Purchase operation failed.';
}

export const PurchasesPage: React.FC = () => {
  const purchasesQuery = usePurchases();
  const budgetsQuery = useBudgets();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | PurchaseStatus>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    budgetId: '',
    title: '',
    description: '',
    vendorName: '',
    category: '',
    quantity: '1',
    unitPrice: '',
    currency: 'USD',
    justification: '',
  });
  const activityQuery = usePurchaseActivity(selectedPurchase?._id);

  if (purchasesQuery.isLoading || budgetsQuery.isLoading) {
    return <PageLoading message="Loading purchase requests..." />;
  }
  if (purchasesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load purchases"
        message={(purchasesQuery.error as Error)?.message}
        onRetry={purchasesQuery.refetch}
      />
    );
  }
  if (budgetsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load budgets"
        message={(budgetsQuery.error as Error)?.message}
        onRetry={budgetsQuery.refetch}
      />
    );
  }

  const activeBudgets = budgetsQuery.budgets.filter((budget) => budget.active);
  const filteredPurchases = purchasesQuery.purchases.filter((purchase) => filter === 'all' || purchase.status === filter);
  const analytics = purchasesQuery.analytics;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    if (!form.budgetId || !form.title.trim() || !form.description.trim()) {
      setFormError('Choose a budget and provide a title and description.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setFormError('Quantity and unit price must be greater than zero.');
      return;
    }

    const input: CreatePurchaseInput = {
      budgetId: form.budgetId,
      title: form.title.trim(),
      description: form.description.trim(),
      quantity,
      unitPrice,
      currency: form.currency.trim() || 'USD',
      ...(form.vendorName.trim() ? { vendorName: form.vendorName.trim() } : {}),
      ...(form.category.trim() ? { category: form.category.trim() } : {}),
      ...(form.justification.trim() ? { justification: form.justification.trim() } : {}),
    };
    setFormError(null);
    setOperationError(null);
    try {
      await purchasesQuery.createPurchase(input);
      setIsCreateOpen(false);
      setForm({
        budgetId: '',
        title: '',
        description: '',
        vendorName: '',
        category: '',
        quantity: '1',
        unitPrice: '',
        currency: 'USD',
        justification: '',
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const runOperation = async (operation: () => Promise<unknown>) => {
    setOperationError(null);
    try {
      await operation();
      setSelectedPurchase(null);
    } catch (error) {
      setOperationError(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-100">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            Procurement and purchases
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Create and track requests against an active budget. Approval and fulfillment permissions are not exposed by the current backend contract.
          </p>
        </div>
        <Button onClick={() => { setFormError(null); setIsCreateOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
          New purchase request
        </Button>
      </header>

      {operationError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {operationError}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#202738] bg-[#121620] p-4">
          <p className="text-xs text-gray-400">Purchase requests recorded</p>
          <p className="mt-1 text-2xl font-bold text-gray-100">{analytics?.totalPurchases ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#202738] bg-[#121620] p-4">
          <p className="text-xs text-gray-400">Status counts (backend analytics)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(analytics?.byStatus ?? {}).map(([status, count]) => (
              <span key={status} className="rounded-md bg-[#0E121A] px-2 py-1 text-[11px] text-gray-300">
                {status}: {count}
              </span>
            ))}
            {Object.keys(analytics?.byStatus ?? {}).length === 0 && <span className="text-xs text-gray-500">No purchase activity yet.</span>}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize ${filter === status ? 'border border-indigo-500/30 bg-indigo-600/20 text-indigo-200' : 'border border-transparent text-gray-400 hover:bg-white/5'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="rounded-xl border border-[#202738] bg-[#121620] p-8 text-center">
            <ClipboardList className="mx-auto mb-2 h-6 w-6 text-gray-500" />
            <p className="text-sm font-semibold text-gray-300">No matching purchase requests</p>
            <p className="mt-1 text-xs text-gray-500">Create a request to begin tracking procurement activity.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#202738] bg-[#121620]">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-[#202738] bg-[#161B26] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500 md:grid">
              <span>Request</span><span>Amount</span><span>Payment / fulfillment</span><span>Status</span>
            </div>
            <ul className="divide-y divide-[#1B2230]">
              {filteredPurchases.map((purchase) => (
                <li key={purchase._id}>
                  <button type="button" onClick={() => { setOperationError(null); setSelectedPurchase(purchase); }} className="grid w-full gap-2 px-4 py-4 text-left hover:bg-[#151A25] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-100">{purchase.title}</span>
                      <span className="mt-1 block truncate text-xs text-gray-500">{purchase.vendorName || purchase.description}</span>
                      <span className="mt-1 block text-[10px] text-gray-600">{formatDate(purchase.createdAt)}</span>
                    </span>
                    <span className="text-sm font-semibold text-gray-200">{formatCurrency(purchase.amount, purchase.currency)}</span>
                    <span className="flex flex-wrap gap-1.5 text-[11px] text-gray-400">
                      <span>Payment: {purchase.status === 'paid' ? 'paid' : purchase.paymentAttemptId ? 'linked' : 'not started'}</span>
                      <span>Fulfillment: {purchase.fulfillmentStatus ?? 'pending'}</span>
                    </span>
                    <StatusBadge status={purchase.status} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create purchase request" description="The backend validates the active budget and remaining amount." maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">{formError}</p>}
          <label className="block text-xs text-gray-400">
            Active budget
            <select required value={form.budgetId} onChange={(event) => {
              const budget = activeBudgets.find((entry) => entry._id === event.target.value);
              setForm((current) => ({ ...current, budgetId: event.target.value, currency: budget?.currency ?? current.currency }));
            }} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100">
              <option value="">Select a budget</option>
              {activeBudgets.map((budget) => <option key={budget._id} value={budget._id}>{budget.label} ({budget.currency})</option>)}
            </select>
          </label>
          {activeBudgets.length === 0 && <p className="text-xs text-amber-300">Create an active budget before submitting a purchase request.</p>}
          <label className="block text-xs text-gray-400">Title<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
          <label className="block text-xs text-gray-400">Description<textarea required rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-gray-400">Vendor name<input value={form.vendorName} onChange={(event) => setForm((current) => ({ ...current, vendorName: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
            <label className="text-xs text-gray-400">Category<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
            <label className="text-xs text-gray-400">Quantity<input required type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
            <label className="text-xs text-gray-400">Unit price<input required type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
            <label className="text-xs text-gray-400 sm:col-span-2">Justification<textarea rows={2} value={form.justification} onChange={(event) => setForm((current) => ({ ...current, justification: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0C0F15] px-3 py-2 text-sm text-gray-100" /></label>
          </div>
          <div className="rounded-lg border border-[#202738] bg-[#0E121A] p-3 text-sm text-gray-200">
            Estimated total: {formatCurrency((Number(form.quantity) || 0) * (Number(form.unitPrice) || 0), form.currency)}
          </div>
          <div className="flex justify-end gap-2 border-t border-[#1F2636] pt-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={purchasesQuery.isCreating} disabled={activeBudgets.length === 0}>Save draft</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedPurchase} onClose={() => setSelectedPurchase(null)} title="Purchase request details" description="Payment and fulfillment are tracked as separate states." maxWidth="lg">
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-sm font-semibold text-gray-100">{selectedPurchase.title}</h3><p className="mt-1 text-xs text-gray-400">{selectedPurchase.description}</p></div>
              <StatusBadge status={selectedPurchase.status} />
            </div>
            <dl className="grid gap-2 rounded-lg bg-[#0E121A] p-3 text-xs sm:grid-cols-2">
              <div><dt className="text-gray-500">Vendor</dt><dd className="mt-1 text-gray-200">{selectedPurchase.vendorName || 'Not specified'}</dd></div>
              <div><dt className="text-gray-500">Budget</dt><dd className="mt-1 text-gray-200">{budgetsQuery.budgets.find((budget) => budget._id === selectedPurchase.budgetId)?.label ?? selectedPurchase.budgetId}</dd></div>
              <div><dt className="text-gray-500">Amount</dt><dd className="mt-1 text-gray-200">{formatCurrency(selectedPurchase.amount, selectedPurchase.currency)}</dd></div>
              <div><dt className="text-gray-500">Payment</dt><dd className="mt-1 text-gray-200">{selectedPurchase.status === 'paid' ? 'Paid' : selectedPurchase.paymentAttemptId ? 'Payment linked' : 'Not started'}</dd></div>
              <div><dt className="text-gray-500">Fulfillment</dt><dd className="mt-1 text-gray-200">{selectedPurchase.fulfillmentStatus ?? 'pending'}</dd></div>
              <div><dt className="text-gray-500">Justification</dt><dd className="mt-1 text-gray-200">{selectedPurchase.justification || 'Not provided'}</dd></div>
            </dl>
            {activityQuery.isLoading ? <p className="text-xs text-gray-500">Loading activity...</p> : activityQuery.isError ? <p className="text-xs text-red-300">{(activityQuery.error as Error).message}</p> : (
              <div>
                <h4 className="text-xs font-semibold text-gray-200">Activity history</h4>
                <ul className="mt-2 space-y-2">
                  {(activityQuery.data ?? []).map((activity, index) => (
                    <li key={`${activity.type}-${activity.createdAt}-${index}`} className="flex items-start justify-between gap-3 border-l border-[#30394B] pl-3 text-xs">
                      <span className="text-gray-300">{activity.message}</span><span className="shrink-0 text-[10px] text-gray-500">{formatDate(activity.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#1F2636] pt-3">
              {selectedPurchase.status === 'draft' && (
                <Button isLoading={purchasesQuery.isSubmitting} onClick={() => void runOperation(() => purchasesQuery.submitPurchase(selectedPurchase._id))}>Submit for review</Button>
              )}
              {['draft', 'submitted', 'approved'].includes(selectedPurchase.status) && (
                <Button variant="danger" isLoading={purchasesQuery.isCancelling} leftIcon={<X className="h-4 w-4" />} onClick={() => void runOperation(() => purchasesQuery.cancelPurchase(selectedPurchase._id))}>Cancel request</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
