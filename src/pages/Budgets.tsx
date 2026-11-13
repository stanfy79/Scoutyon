import React, { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageLoading } from '../components/common/Loading';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '../types/budget.types';
import { formatCurrency } from '../utils/formatCurrency';
import { WalletCards, Plus, AlertTriangle } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const {
    budgets,
    isLoading,
    isError,
    error,
    refetch,
    createBudget,
    isCreating,
    updateBudget,
    isUpdating,
    deleteBudget,
    isDeleting,
  } = useBudgets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Compute metrics
  const activeBudgets = budgets.filter((b) => b.active);
  const primaryCurrency = activeBudgets[0]?.currency || budgets[0]?.currency || 'USD';
  const currencyBudgets = activeBudgets.filter((budget) => budget.currency === primaryCurrency);
  const totalLimit = currencyBudgets.reduce((acc, budget) => acc + budget.totalLimit, 0);
  const totalSpent = currencyBudgets.reduce((acc, budget) => acc + budget.spent, 0);
  const totalReserved = currencyBudgets.reduce((acc, budget) => acc + (budget.reserved ?? 0), 0);
  const remaining = Math.max(0, totalLimit - totalSpent - totalReserved);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CreateBudgetInput | UpdateBudgetInput) => {
    if (editingBudget) {
      await updateBudget({ id: editingBudget._id, input: data as UpdateBudgetInput });
    } else {
      await createBudget(data as CreateBudgetInput);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudget(deleteTarget._id);
      setDeleteTarget(null);
      setOperationError(null);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Delete budget failed.');
    }
  };

  const handleToggleActive = async (budget: Budget) => {
    try {
      await updateBudget({ id: budget._id, input: { active: !budget.active } });
      setOperationError(null);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Budget update failed.');
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading spending policies..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load budgets"
        message={(error as Error)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <WalletCards className="w-5 h-5 text-indigo-400" />
            <span>Budget Policies & Spending Caps</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Set deterministic spending constraints and allowlists to keep autonomous purchasing secure.
          </p>
        </div>

        {operationError && (
          <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
            {operationError}
          </div>
        )}

        <Button
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Budget Policy
        </Button>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#121620] border border-[#202738] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">
            Total Authorized Limits
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
            {formatCurrency(totalLimit, primaryCurrency)}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {currencyBudgets.length} active spending rules ({primaryCurrency})
          </span>
        </div>

        <div className="bg-[#121620] border border-[#202738] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">
            Total Spent
          </span>
          <span className="text-xl sm:text-2xl font-bold text-amber-400 mt-1 block">
            {formatCurrency(totalSpent, primaryCurrency)}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {primaryCurrency} budgets
          </span>
        </div>

        <div className="bg-[#121620] border border-[#202738] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">
            Reserved
          </span>
          <span className="text-xl sm:text-2xl font-bold text-blue-300 mt-1 block">
            {formatCurrency(totalReserved, primaryCurrency)}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            Held for prepared payments
          </span>
        </div>

        <div className="bg-[#121620] border border-[#202738] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">
            Remaining Available
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 block">
            {formatCurrency(remaining, primaryCurrency)}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {primaryCurrency} budgets after reservations
          </span>
        </div>
      </div>

      {/* List of Budgets */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title="No budget policies created"
          description="Create your first budget policy to restrict agent spending to specific providers and dollar amounts."
          actionLabel="Create Spending Budget"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget._id}
              budget={budget}
              onEdit={handleOpenEdit}
              onDelete={(b) => setDeleteTarget(b)}
              onToggleActive={(b) => void handleToggleActive(b)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialBudget={editingBudget}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Budget Policy"
        description="Are you sure you want to delete this spending policy?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-red-200">
                Warning: Removing "{deleteTarget?.label}"
              </span>
              <span className="text-[11px] text-red-300/80 leading-normal block mt-0.5">
                Existing quotes associated with this budget will lose policy linkage.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2636]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
