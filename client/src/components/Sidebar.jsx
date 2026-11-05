import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  MessageSquare,
  RotateCcw,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Orders', to: '/orders', icon: ShoppingBag },
  { name: 'Products', to: '/products', icon: Package },
  { name: 'Inventory', to: '/inventory', icon: Layers },
  { name: 'Customers', to: '/customers', icon: Users },
  { name: 'Inquiries', to: '/inquiries', icon: MessageSquare },
  { name: 'Returns & Exchanges', to: '/returns', icon: RotateCcw },
  { name: 'Shipping', to: '/shipping', icon: Truck },
  { name: 'Payments', to: '/payments', icon: CreditCard },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, currentBusiness, businesses, switchBusiness, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Workspace Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm shadow-subtle">
              SO
            </div>
            <div>
              <span className="font-semibold text-main text-base tracking-tight leading-none block">
                ShopOps
              </span>
              <span className="text-[11px] text-muted tracking-wide uppercase font-medium">
                Operating System
              </span>
            </div>
          </div>

          {/* Business Workspace Switcher */}
          <div className="relative group">
            <div className="flex items-center justify-between p-2 rounded-md bg-accent-light/50 border border-accent/20 cursor-pointer text-xs">
              <div className="flex items-center gap-2 truncate">
                <Store className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="font-medium text-main truncate">
                  {currentBusiness?.name || 'My Boutique'}
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-accent px-1.5 py-0.5 rounded bg-accent-light border border-accent/20">
                {currentBusiness?.role || 'Owner'}
              </span>
            </div>

            {businesses.length > 1 && (
              <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-md shadow-card p-1 z-50">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => switchBusiness(b.id)}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-stone-50 flex items-center justify-between"
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] text-muted uppercase">{b.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-light text-accent-dark font-semibold'
                      : 'text-main/80 hover:text-main hover:bg-stone-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-muted" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-border bg-stone-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-accent-light text-accent-dark border border-accent/20 flex items-center justify-center font-medium text-xs shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-main truncate leading-tight">
                  {user?.fullName}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-muted hover:text-status-danger hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
