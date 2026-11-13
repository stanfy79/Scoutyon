import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { checkBackendHealth } from '../../api/auth.api';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const getPageInfo = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return { title: 'Overview', breadcrumb: 'SCOUTYON /' };
      case '/workspace':
        return { title: 'Workspace', breadcrumb: 'SCOUTYON /' };
      case '/history':
        return { title: 'Research history', breadcrumb: 'SCOUTYON /' };
      case '/quotes':
        return { title: 'Quotations', breadcrumb: 'SCOUTYON /' };
      case '/vendors':
        return { title: 'Vendors', breadcrumb: 'SCOUTYON /' };
      case '/purchases':
        return { title: 'Purchases', breadcrumb: 'SCOUTYON /' };
      case '/budgets':
        return { title: 'Budgets', breadcrumb: 'SCOUTYON /' };
      case '/transactions':
        return { title: 'Activity', breadcrumb: 'SCOUTYON /' };
      case '/settings':
        return { title: 'Settings', breadcrumb: 'Configuration' };
      default:
        return { title: 'Scoutyon', breadcrumb: 'App' };
    }
  };

  const { title, breadcrumb } = getPageInfo(location.pathname);

  useEffect(() => {
    let mounted = true;
    const pollHealth = async () => {
      try {
        await checkBackendHealth();
        if (mounted) setBackendOnline(true);
      } catch {
        if (mounted) setBackendOnline(false);
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-transparent backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">{breadcrumb}</span>
          <span className="text-xs text-gray-600 hidden sm:inline">/</span>
          <h1 className="text-xs md:text-sm font-medium tracking-wide text-gray-100">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real Backend Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-2 min-sm:py-1 rounded-full text-[11px] font-medium border ${
            backendOnline === true
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
              : backendOnline === false
                ? 'bg-red-950/30 text-red-400 border-red-800/40'
                : 'bg-gray-800/40 text-gray-400 border-gray-700/40'
          }`}
          title={
            backendOnline === true
              ? 'Backend API & MongoDB connected'
              : backendOnline === false
                ? 'Cannot connect to Scoutyon backend'
                : 'Checking backend status...'
          }
        >
          {backendOnline === true ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className='hidden min-sm:flex'>Backend Connected</span>
            </>
          ) : backendOnline === false ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className='hidden min-sm:flex'>Backend Offline</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-pulse text-gray-400" />
              <span>Connecting...</span>
            </>
          )}
        </div>

        {/* Gemini Engine Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#696FFD]/10 text-[#696FFD] border border-[#696FFD]/25">
          <ShieldCheck className="w-3.5 h-3.5 text-[#696FFD]" />
          <span>Gemini 3.8 Flash</span>
        </div>
      </div>
    </header>
  );
};
