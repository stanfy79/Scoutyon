import React from 'react';
import { Edit2, Trash2, ShieldCheck, Users, PauseCircle, PlayCircle } from 'lucide-react';
import type { Budget } from '../../types/budget.types';
import { SpendingProgress } from './SpendingProgress';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onToggleActive: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete, onToggleActive }) => {
  const remaining = Math.max(0, budget.totalLimit - budget.spent - (budget.reserved ?? 0));

  return (
    <div className="bg-[#131722] border border-[#202738] rounded-xl p-5 shadow-sm hover:border-[#2C364C] transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-gray-100">{budget.label}</h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Limit: {formatCurrency(budget.totalLimit, budget.currency)}
            </p>
          </div>

          <StatusBadge status={budget.active ? 'active' : 'inactive'} />
        </div>

        {/* Progress Bar */}
        <div className="my-4 p-3 bg-[#0E121A] border border-[#1C2330] rounded-lg">
          <SpendingProgress
            spent={budget.spent}
            reserved={budget.reserved ?? 0}
            totalLimit={budget.totalLimit}
            currency={budget.currency}
          />
        </div>

        {/* Approved Recipients allowlist */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span>Approved Recipients Policy:</span>
          </div>

          {budget.approvedRecipients && budget.approvedRecipients.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {budget.approvedRecipients.map((recipient, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[#18202F] text-indigo-300 text-[11px] rounded border border-[#253248]"
                >
                  {recipient}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-gray-500 italic">
              Any provider permitted (no recipient restrictions)
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#1C2330] flex items-center justify-between">
        <div className="text-[11px] text-gray-400">
          Remaining:{' '}
          <span className="font-semibold text-emerald-400">
            {formatCurrency(remaining, budget.currency)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(budget)}
            className="p-1.5 text-gray-400 hover:text-indigo-300 hover:bg-white/5 rounded-md transition-colors"
            title={budget.active ? 'Deactivate budget' : 'Activate budget'}
            aria-label={budget.active ? `Deactivate ${budget.label}` : `Activate ${budget.label}`}
          >
            {budget.active ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-md transition-colors"
            title="Edit Budget"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
            title="Delete Budget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
