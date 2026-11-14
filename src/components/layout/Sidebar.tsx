import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  History,
  WalletCards,
  Receipt,
  Settings,
  PlusCircle,
  LogOut,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/workspace', label: 'Workspace', icon: Sparkles },
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/history', label: 'Research', icon: History },
    { to: '/budgets', label: 'Budgets', icon: WalletCards },
    { to: '/transactions', label: 'Activity', icon: Receipt },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleNewResearch = () => {
    navigate('/workspace');
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 w-64 bg-[#0a0b0c] border-r border-white/10 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border border-white/20 bg-white/[0.04] flex items-center justify-center text-gray-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-[0.14em] text-white block">
                SCOUTYON
              </span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-gray-500 block">
                Protocol Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={handleNewResearch}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-gray-100 text-[11px] font-medium rounded-sm border border-white/15 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New session</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-sm text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#696FFD]/[0.08] text-gray-100 border border-[#696FFD]/25'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#696FFD]' : ''}`} />
                    <span className="tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 border border-white/15 bg-white/[0.05] flex items-center justify-center text-[10px] font-semibold text-gray-300 shrink-0">
                {user?.name
                  ? user.name.slice(0, 2).toUpperCase()
                  : user?.email
                    ? user.email.slice(0, 2).toUpperCase()
                    : 'SC'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {user?.name || user?.email || 'Scoutyon User'}
                </p>
                <p className="text-[10px] text-gray-500 font-mono truncate">
                  {user?.walletAddress
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                    : 'Privy Verified'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
