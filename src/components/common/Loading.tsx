import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`animate-spin text-indigo-400 ${sizeMap[size]} ${className}`} />
  );
};

export const PageLoading: React.FC<{ message?: string }> = ({
  message = 'Loading Scoutyon data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-400">{message}</p>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[#1C2330] rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};
