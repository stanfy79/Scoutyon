import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '../../types/budget.types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBudgetInput | UpdateBudgetInput) => Promise<any>;
  initialBudget?: Budget | null;
  isLoading?: boolean;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBudget,
  isLoading,
}) => {
  const [label, setLabel] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [recipientsText, setRecipientsText] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');

  const isEdit = !!initialBudget;

  useEffect(() => {
    if (initialBudget) {
      setLabel(initialBudget.label);
      setTotalLimit(initialBudget.totalLimit.toString());
      setCurrency(initialBudget.currency);
      setRecipientsText(initialBudget.approvedRecipients?.join(', ') || '');
      setActive(initialBudget.active);
    } else {
      setLabel('');
      setTotalLimit('');
      setCurrency('USD');
      setRecipientsText('');
      setActive(true);
    }
    setFormError('');
  }, [initialBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setFormError('Budget label is required.');
      return;
    }

    const limitNum = parseFloat(totalLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setFormError('Total limit must be a positive number.');
      return;
    }

    const recipients = recipientsText
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      if (isEdit) {
        await onSubmit({
          label: trimmedLabel,
          totalLimit: limitNum,
          approvedRecipients: recipients,
          active,
        });
      } else {
        await onSubmit({
          label: trimmedLabel,
          totalLimit: limitNum,
          currency: currency.toUpperCase(),
          approvedRecipients: recipients,
        });
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save budget policy.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Spending Budget' : 'Create Spending Budget'}
      description="Define an autonomous spending cap and recipient allowlist for Scoutyon."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Budget Name / Label
          </label>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. AI API Infrastructure"
            className="w-full bg-[#0E121A] border border-[#202738] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Spending Limit
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
              placeholder="e.g. 50.00"
              className="w-full bg-[#0E121A] border border-[#202738] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isEdit}
              className="w-full bg-[#0E121A] border border-[#202738] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="NEAR">NEAR (Ⓝ)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Approved Recipients Allowlist
          </label>
          <input
            type="text"
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="e.g. OpenAI, Deepgram, Render (comma-separated)"
            className="w-full bg-[#0E121A] border border-[#202738] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Leave blank to permit quotes from any provider within the limit.
          </p>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="budget-active-toggle"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded bg-[#0E121A] border-gray-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="budget-active-toggle"
              className="text-xs font-medium text-gray-300 cursor-pointer"
            >
              Policy active and enforced
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1F2636]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
