import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();

  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    // Quote statuses
    pending: {
      label: 'Pending',
      bg: 'bg-amber-950/40',
      text: 'text-amber-400',
      border: 'border-amber-800/40',
    },
    draft: {
      label: 'Draft',
      bg: 'bg-gray-800/40',
      text: 'text-gray-300',
      border: 'border-gray-700/40',
    },
    submitted: {
      label: 'Awaiting Review',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      border: 'border-amber-800/40',
    },
    approved: {
      label: 'Approved',
      bg: 'bg-blue-950/40',
      text: 'text-blue-400',
      border: 'border-blue-800/40',
    },
    paid: {
      label: 'Paid / Settled',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-800/40',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-red-950/40',
      text: 'text-red-400',
      border: 'border-red-800/40',
    },
    // Transaction statuses
    simulated: {
      label: 'Simulated',
      bg: 'bg-[#696FFD]/10',
      text: 'text-[#696FFD]',
      border: 'border-[#696FFD]/25',
    },
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-800/40',
    },
    failed: {
      label: 'Failed',
      bg: 'bg-red-950/40',
      text: 'text-red-400',
      border: 'border-red-800/40',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-gray-800/40',
      text: 'text-gray-400',
      border: 'border-gray-700/40',
    },
    fulfilled: {
      label: 'Fulfilled',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-800/40',
    },
    corroborated: {
      label: 'Corroborated',
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      border: 'border-blue-800/40',
    },
    unverified: {
      label: 'Unverified',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      border: 'border-amber-800/40',
    },
    contradicted: {
      label: 'Conflicting evidence',
      bg: 'bg-red-950/40',
      text: 'text-red-300',
      border: 'border-red-800/40',
    },
    unavailable: {
      label: 'Unavailable',
      bg: 'bg-gray-800/40',
      text: 'text-gray-400',
      border: 'border-gray-700/40',
    },
    ready: {
      label: 'Ready for quote payments',
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      border: 'border-blue-800/40',
    },
    no_results: {
      label: 'No results',
      bg: 'bg-gray-800/40',
      text: 'text-gray-400',
      border: 'border-gray-700/40',
    },
    // Budget & session statuses
    active: {
      label: 'Active',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-400',
      border: 'border-emerald-800/30',
    },
    inactive: {
      label: 'Inactive',
      bg: 'bg-gray-800/40',
      text: 'text-gray-400',
      border: 'border-gray-700/40',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-blue-950/30',
      text: 'text-blue-400',
      border: 'border-blue-800/30',
    },
  };

  const current = config[norm] || {
    label: status,
    bg: 'bg-gray-800/40',
    text: 'text-gray-300',
    border: 'border-gray-700/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {current.label}
    </span>
  );
};
