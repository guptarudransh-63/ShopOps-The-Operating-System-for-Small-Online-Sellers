import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export const InspectReturnModal = ({ isOpen, onClose, returnRequest, onInspectionCompleted }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Inspection split per line: { [variantId]: { resellable: num, damaged: num } }
  const [inspectionState, setInspectionState] = useState(() => {
    if (!returnRequest) return {};
    const initial = {};
    returnRequest.lines.forEach((l) => {
      initial[l.variantId] = {
        resellable: l.requestedQuantity, // default suggestion is resellable
        damaged: 0,
      };
    });
    return initial;
  });

  const [issueRefund, setIssueRefund] = useState(true);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('Physical inspection verified. Garment tags intact.');

  if (!isOpen || !returnRequest) return null;

  const handleQtyChange = (variantId, field, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setInspectionState((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: num,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that resellable + damaged <= requestedQuantity for every line
    const payloadInspection = [];
    for (const line of returnRequest.lines) {
      const state = inspectionState[line.variantId] || { resellable: 0, damaged: 0 };
      const total = state.resellable + state.damaged;

      if (total === 0) {
        error(`Please enter inspected received quantities for ${line.productName}`);
        return;
      }
      if (total > line.requestedQuantity) {
        error(`Total received for ${line.sku} (${total}) cannot exceed requested return quantity (${line.requestedQuantity})`);
        return;
      }

      payloadInspection.push({
        variantId: line.variantId,
        resellableQuantity: state.resellable,
        damagedQuantity: state.damaged,
      });
    }

    setLoading(true);
    try {
      const res = await api.post(`/returns/${returnRequest._id}/inspect`, {
        inspectionData: payloadInspection,
        issueRefund,
        refundPaymentMethod,
        notes: notes.trim(),
      });

      if (res.data.success) {
        success(`Return #${returnRequest.returnNumber} inspected! Resellable units restocked into inventory.`);
        onClose();
        if (onInspectionCompleted) onInspectionCompleted();
      }
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to complete inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-stone-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <div>
              <h2 className="text-sm font-semibold text-main">Physical Receipt & Restock Inspection</h2>
              <span className="text-[11px] text-muted">Return #{returnRequest.returnNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs text-amber-900">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Restocking Invariant:
            </p>
            <p>
              Only units marked as <strong>Resellable</strong> will be restored to sellable on-hand inventory.
              Items marked as <strong>Damaged</strong> will be recorded in the damaged bucket and excluded from available stock.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Inspect Returned Units
            </h3>
            {returnRequest.lines.map((line) => {
              const state = inspectionState[line.variantId] || { resellable: 0, damaged: 0 };
              return (
                <div key={line._id} className="p-3 rounded-lg border border-border bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-main block">{line.productName}</span>
                      <span className="text-muted font-mono text-[11px]">{line.sku} ({line.variantTitle})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium text-[11px]">
                      Requested: {line.requestedQuantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 mb-1">
                        Resellable (Restock to On-Hand)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={line.requestedQuantity}
                        value={state.resellable}
                        onChange={(e) => handleQtyChange(line.variantId, 'resellable', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-emerald-300 rounded focus:outline-none focus:border-emerald-600 bg-emerald-50/30 font-semibold text-emerald-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-rose-800 mb-1">
                        Damaged / Write-off
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={line.requestedQuantity}
                        value={state.damaged}
                        onChange={(e) => handleQtyChange(line.variantId, 'damaged', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-rose-300 rounded focus:outline-none focus:border-rose-600 bg-rose-50/30 font-semibold text-rose-900"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refund Options */}
          <div className="p-3 rounded-lg bg-stone-50 border border-border space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-main">
              <input
                type="checkbox"
                checked={issueRefund}
                onChange={(e) => setIssueRefund(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Record Refund of {formatCurrency(returnRequest.refundAmount)}</span>
            </label>

            {issueRefund && (
              <div className="pt-2">
                <label className="block text-[11px] text-muted mb-1">Refund Method</label>
                <select
                  value={refundPaymentMethod}
                  onChange={(e) => setRefundPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-border rounded"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI Refund</option>
                  <option value="cash">Cash Settlement</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-main mb-1">Inspection Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
            />
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
              {loading ? 'Processing...' : 'Complete Inspection & Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
