import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FastOrderModal } from './FastOrderModal';
import { CreateProductModal } from './CreateProductModal';

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fastOrderOpen, setFastOrderOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Persistent Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          setMobileOpen={setMobileOpen}
          onOpenNewOrder={() => setFastOrderOpen(true)}
          onOpenNewProduct={() => setCreateProductOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <FastOrderModal
        isOpen={fastOrderOpen}
        onClose={() => setFastOrderOpen(false)}
        onOrderCreated={() => {
          navigate('/orders');
        }}
      />

      <CreateProductModal
        isOpen={createProductOpen}
        onClose={() => setCreateProductOpen(false)}
        onProductCreated={() => {
          navigate('/products');
        }}
      />
    </div>
  );
};
