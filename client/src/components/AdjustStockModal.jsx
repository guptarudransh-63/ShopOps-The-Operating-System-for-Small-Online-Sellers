import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export const AdjustStockModal = ({ isOpen, onClose, variantItem, onStockAdjusted }) => {
  const { success, error } = useToast();
  const [quantity, setQuantity] = useState('');
  const [isAddition, setIsAddition] = useState(true);
  const [reason, setReason] = useState('Stock Count Audit');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !variantItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyVal = parseInt(quantity, 10);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      error('Enter a positive quantity to adjust.');
      return;
    }
    if (!reason.trim()) {
      error('A clear adjustment reason is required for the audit ledger.');
      return;
    }

    const adjustmentQuantity = isAddition ? qtyVal : -qtyVal;

    // Client-side guard check against reserved units
    if (variantItem.onHand + adjustmentQuantity < variantItem.reserved) {
      error(`Cannot reduce stock below active reserved units (${variantItem.reserved}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/inventory/adjust', {
        variantId: variantItem.variantId,
        adjustmentQuantity,
        reason: reason.trim(),
      });

      if (res.data.success) {
        success(`Stock for ${variantItem.sku} adjusted by ${adjustmentQuantity > 0 ? '+' : ''}${adjustmentQuantity}!`);
        onClose();
        if (onStockAdjusted) onStockAdjusted();
      }
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-main">Manual Stock Adjustment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-stone-50 rounded-lg border border-border text-xs">
            <div className="font-semibold text-main">{variantItem.productName}</div>
            <div className="text-muted">{variantItem.title} ({variantItem.sku})</div>
            <div className="flex items-center gap-4 mt-2 font-mono text-[11px]">
              <span>On Hand: <strong>{variantItem.onHand}</strong></span>
              <span>Reserved: <strong className="text-amber-700">{variantItem.reserved}</strong></span>
              <span>Available: <strong className="text-emerald-700">{variantItem.available}</strong></span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddition(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                isAddition
                  ? 'bg-status-success-bg border-emerald-300 text-status-success font-semibold'
                  : 'bg-white border-border text-muted hover:bg-stone-50'
              }`}
            >
              + Increase Stock
            </button>
            <button
              type="button"
              onClick={() => setIsAddition(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                !isAddition
                  ? 'bg-status-danger-bg border-rose-300 text-status-danger font-semibold'
                  : 'bg-white border-border text-muted hover:bg-stone-50'
              }`}
            >
              - Decrease Stock
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-main mb-1">
              Quantity to {isAddition ? 'Add' : 'Remove'} *
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-main mb-1">Audit Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent mb-2"
            >
              <option value="Stock Count Audit">Stock Count Audit (Physical reconciliation)</option>
              <option value="Supplier Restock Batch">Supplier Restock Batch</option>
              <option value="Damaged in Storage">Damaged in Storage</option>
              <option value="Display Sample Write-off">Display Sample Write-off</option>
              <option value="Other Manual Correction">Other Manual Correction</option>
            </select>
          </div>

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
              {loading ? 'Adjusting...' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
