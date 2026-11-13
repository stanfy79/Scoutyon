import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

interface SpendingProgressProps {
  spent: number;
  totalLimit: number;
  reserved?: number;
  currency?: string;
  showLabels?: boolean;
}

export const SpendingProgress: React.FC<SpendingProgressProps> = ({
  spent,
  totalLimit,
  reserved = 0,
  currency = 'USD',
  showLabels = true,
}) => {
  const committed = spent + reserved;
  const percentage = totalLimit > 0 ? Math.min(100, (committed / totalLimit) * 100) : 0;
  const remaining = Math.max(0, totalLimit - committed);

  let barColor = 'bg-emerald-500';
  if (percentage >= 90) {
    barColor = 'bg-red-500';
  } else if (percentage >= 70) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="space-y-1.5 w-full">
      {showLabels && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Spent: <strong className="text-gray-200">{formatCurrency(spent, currency)}</strong>
            </span>
            <span className="text-gray-400">
              Remaining: <strong className="text-gray-200">{formatCurrency(remaining, currency)}</strong>
            </span>
          </div>
          {reserved > 0 && (
          <div className="text-[10px] text-gray-500">
            Reserved: <strong className="text-gray-300">{formatCurrency(reserved, currency)}</strong>
          </div>
          )}
        </>
      )}

      {/* Progress Track */}
      <div className="w-full h-2 bg-[#0F131C] rounded-full overflow-hidden border border-[#202738]">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>0%</span>
          <span>{percentage.toFixed(0)}% utilized</span>
          <span>Limit: {formatCurrency(totalLimit, currency)}</span>
        </div>
      )}
    </div>
  );
};
