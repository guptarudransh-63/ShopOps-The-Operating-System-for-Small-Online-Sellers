import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export const FastOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);

  // Form State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [lines, setLines] = useState([
    { variantId: '', quantity: 1, lineDiscount: 0 },
  ]);

  const [orderDiscount, setOrderDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState('');
  const [autoConfirm, setAutoConfirm] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInventoryData();
    }
  }, [isOpen]);

  const loadInventoryData = async () => {
    try {
      const res = await api.get('/inventory');
      if (res.data.success) {
        setVariants(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory for fast order modal', err);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { variantId: '', quantity: 1, lineDiscount: 0 }]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  // Compute live estimates
  const calculatedSubtotal = lines.reduce((acc, l) => {
    const v = variants.find((item) => item.variantId === l.variantId);
    if (!v) return acc;
    return acc + (v.price * (parseInt(l.quantity, 10) || 1));
  }, 0);

  const calculatedLineDiscounts = lines.reduce((acc, l) => {
    return acc + ((parseFloat(l.lineDiscount) || 0) * 100);
  }, 0);

  const calculatedTotal = Math.max(
    0,
    calculatedSubtotal - calculatedLineDiscounts - (parseFloat(orderDiscount) || 0) * 100 + (parseFloat(shippingFee) || 0) * 100
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim()) {
      error('Customer Name and Phone are required.');
      return;
    }

    const validLines = lines.filter((l) => l.variantId);
    if (validLines.length === 0) {
      error('Please select at least one product variant.');
      return;
    }

    // Verify stock availability if autoConfirm is checked
    if (autoConfirm) {
      for (const line of validLines) {
        const v = variants.find((item) => item.variantId === line.variantId);
        if (v && v.available < parseInt(line.quantity, 10)) {
          error(`Insufficient stock for ${v.sku}. Available: ${v.available}, Requested: ${line.quantity}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          shippingAddress: {
            street: customer.street.trim(),
            city: customer.city.trim(),
            state: customer.state.trim(),
            postalCode: customer.postalCode.trim(),
          },
        },
        items: validLines.map((l) => ({
          variantId: l.variantId,
          quantity: parseInt(l.quantity, 10) || 1,
          lineDiscount: Math.round((parseFloat(l.lineDiscount) || 0) * 100),
        })),
        orderDiscount: Math.round((parseFloat(orderDiscount) || 0) * 100),
        shippingFee: Math.round((parseFloat(shippingFee) || 0) * 100),
        notes: notes.trim(),
        autoConfirm,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        success(autoConfirm ? `Order #${res.data.data.orderNumber} confirmed & stock reserved!` : `Draft Order #${res.data.data.orderNumber} created!`);
        onClose();
        if (onOrderCreated) onOrderCreated(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-stone-50/50">
          <div>
            <h2 className="text-base font-semibold text-main">Fast Order Entry</h2>
            <p className="text-xs text-muted">Create customer order, calculate totals, and reserve inventory</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Customer Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-main mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-main mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-main mb-1">Email</label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-main mb-1">City & State</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Order Items & Inventory Check
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-xs text-accent font-medium hover:text-accent-hover"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => {
                const selectedVariant = variants.find((v) => v.variantId === line.variantId);
                const isOverStock = selectedVariant && selectedVariant.available < parseInt(line.quantity, 10);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={line.variantId}
                        onChange={(e) => handleLineChange(idx, 'variantId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-border rounded-md focus:outline-none focus:border-accent font-medium"
                      >
                        <option value="">Select product variant...</option>
                        {variants.map((v) => (
                          <option key={v.variantId} value={v.variantId} disabled={v.available <= 0}>
                            {v.productName} — {v.title} ({v.sku}) • Available: {v.available} units • {formatCurrency(v.price)}
                          </option>
                        ))}
                      </select>
                      {selectedVariant && (
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className={isOverStock ? 'text-status-danger font-medium' : 'text-muted'}>
                            Stock Available: {selectedVariant.available}
                          </span>
                          {isOverStock && (
                            <span className="text-status-danger flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3 h-3" /> Exceeds stock!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-border rounded-md focus:outline-none focus:border-accent text-center"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Disc. ₹"
                          value={line.lineDiscount}
                          onChange={(e) => handleLineChange(idx, 'lineDiscount', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-border rounded-md focus:outline-none focus:border-accent text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length === 1}
                        className="p-1.5 text-muted hover:text-status-danger rounded disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-main mb-1">Order Discount (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-main mb-1">Shipping Charged to Customer (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="p-4 rounded-lg bg-accent-light/40 border border-accent/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted block">Calculated Total Payable</span>
              <span className="text-xl font-bold text-main">{formatCurrency(calculatedTotal)}</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-main">
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Confirm & Reserve Stock Immediately</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-muted hover:text-main hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-subtle disabled:opacity-50"
            >
              {loading ? 'Creating...' : autoConfirm ? 'Confirm & Reserve Order' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
