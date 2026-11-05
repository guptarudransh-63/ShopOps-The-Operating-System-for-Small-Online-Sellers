import React from 'react';
import { Menu, Search, Plus, Bell } from 'lucide-react';

export const Topbar = ({ setMobileOpen, onOpenNewOrder, onOpenNewProduct }) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-muted hover:text-main hover:bg-stone-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Quick Search */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search orders, SKU, customers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent text-main placeholder:text-muted"
          />
        </div>
      </div>

      {/* Quick Action CTAs */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenNewProduct}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-main border border-border bg-white hover:bg-stone-50 transition-colors shadow-subtle"
        >
          <Plus className="w-3.5 h-3.5 text-muted" />
          <span>New Product</span>
        </button>

        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-subtle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>
      </div>
    </header>
  );
};
