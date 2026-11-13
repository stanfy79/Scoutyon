import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[450px] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-full text-indigo-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white">404 — Page Not Found</h2>
      <p className="mt-2 text-sm text-gray-400 max-w-sm">
        The requested path does not exist in Scoutyon.
      </p>
      <Button
        className="mt-6"
        size="sm"
        onClick={() => navigate('/dashboard')}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
