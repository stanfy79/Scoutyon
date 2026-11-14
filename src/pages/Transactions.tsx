import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionDetailsModal } from '../components/transactions/TransactionDetailsModal';
import { PageLoading } from '../components/common/Loading';
import { ErrorState } from '../components/common/ErrorState';
import type { Transaction } from '../types/transaction.types';
import { Receipt } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { transactions, isLoading, isError, error, refetch } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  if (isLoading) {
    return <PageLoading message="Loading settlement ledger..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load transactions"
        message={(error as Error)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-400" />
          <span>Transactions & Settlement Ledger</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Transfer and settlement activity recorded through NEAR Intents.
        </p>
      </div>

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        onViewDetails={(tx) => setSelectedTx(tx)}
      />

      {/* Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
