import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface AuthErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AuthError: React.FC<AuthErrorProps> = ({
  title = 'Authentication Error',
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl space-y-3 text-left">
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <h4 className="text-xs font-bold text-red-200">{title}</h4>
      </div>
      <p className="text-xs text-red-300/90 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          isLoading={isRetrying}
          className="w-full text-xs"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
