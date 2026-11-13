import React from 'react';
import { Loader2 } from 'lucide-react';

export const AuthLoading: React.FC<{ message?: string }> = ({
  message = 'Initializing authentication...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
};
