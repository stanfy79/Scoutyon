import React, { useState } from 'react';
import type { Transaction } from '../../types/transaction.types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Search, Eye, Receipt } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails: (tx: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onViewDetails,
}) => {
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tx.provider.toLowerCase().includes(q) ||
      (tx.nearIntentId && tx.nearIntentId.toLowerCase().includes(q)) ||
      (tx.txHash && tx.txHash.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by provider or NEAR Intent ID..."
            className="w-full bg-[#121620] border border-[#202738] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#121620] border border-[#202738] rounded-xl p-8 text-center">
          <Receipt className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">No transactions found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {search
              ? 'No records match your query.'
              : 'Approved quotes and payment settlements will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#121620] border border-[#202738] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161B26] border-b border-[#202738] text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Provider / Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">NEAR Intent ID</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2230]">
                {filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[#151A25] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-400 text-[11px]">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-gray-200">{tx.provider}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-gray-100">
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={tx.status} />
                        {tx.simulated && (
                          <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                            Simulated
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {tx.nearIntentId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-300 text-[11px] max-w-[140px] truncate">
                            {tx.nearIntentId}
                          </span>
                          <CopyButton textToCopy={tx.nearIntentId} />
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => onViewDetails(tx)}
                        className="p-1.5 text-gray-400 hover:text-indigo-300 hover:bg-white/5 rounded-md transition-colors"
                        title="View Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((tx) => (
              <div
                key={tx._id}
                className="bg-[#121620] border border-[#202738] rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{tx.provider}</h4>
                    <span className="text-[11px] text-gray-500">
                      {formatDate(tx.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={tx.status} />
                    {tx.simulated && (
                      <span className="text-[9px] text-purple-400 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-800/40">
                        Simulated
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1C2330]">
                  <span className="font-bold text-gray-100 text-sm">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <button
                    onClick={() => onViewDetails(tx)}
                    className="px-2.5 py-1 text-xs text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 rounded-md border border-indigo-800/40"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
