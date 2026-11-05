import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export const Analytics = () => {
  const { currentBusiness } = useAuth();
  const [profitData, setProfitData] = useState(null);
  const [productPerf, setProductPerf] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profit'); // 'profit' | 'products' | 'valuation'

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [pRes, prodRes, vRes] = await Promise.all([
        api.get('/analytics/profitability'),
        api.get('/analytics/products'),
        api.get('/analytics/valuation'),
      ]);
      if (pRes.data.success) setProfitData(pRes.data.data);
      if (prodRes.data.success) setProductPerf(prodRes.data.data);
      if (vRes.data.success) setValuation(vRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted">Calculating business metrics...</div>;
  }

  const p = profitData || {};
  const marginPct = p.netSales > 0 ? Math.round((p.contributionProfit / p.netSales) * 100) : 0;
  const grossMarginPct = p.netSales > 0 ? Math.round((p.grossProfit / p.netSales) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-main tracking-tight">Business Intelligence & Profitability</h1>
          <p className="text-xs text-muted mt-0.5">
            Real contribution profit, product margins, and warehouse asset valuation
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 border border-border rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'profit'
                ? 'bg-white text-main shadow-subtle'
                : 'text-muted hover:text-main'
            }`}
          >
            Profit Breakdown
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-main shadow-subtle'
                : 'text-muted hover:text-main'
            }`}
          >
            Product Margins
          </button>
          <button
            onClick={() => setActiveTab('valuation')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'valuation'
                ? 'bg-white text-main shadow-subtle'
                : 'text-muted hover:text-main'
            }`}
          >
            Inventory Valuation
          </button>
        </div>
      </div>

      {activeTab === 'profit' && (
        <div className="space-y-6">
          {/* Contribution Profit KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-card border border-border shadow-subtle">
              <span className="text-xs font-medium text-muted block">True Contribution Profit</span>
              <div className="text-2xl font-bold text-accent-dark mt-1">
                {formatCurrency(p.contributionProfit, currentBusiness?.currency)}
              </div>
              <span className="text-[11px] text-muted mt-1 block">
                Net Contribution Margin: <strong>{marginPct}%</strong>
              </span>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border shadow-subtle">
              <span className="text-xs font-medium text-muted block">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-bold text-main mt-1">
                {formatCurrency(p.gmv, currentBusiness?.currency)}
              </div>
              <span className="text-[11px] text-muted mt-1 block">
                Total Discounts: -{formatCurrency(p.discounts, currentBusiness?.currency)}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border shadow-subtle">
              <span className="text-xs font-medium text-muted block">Outstanding Receivables</span>
              <div className="text-2xl font-bold text-amber-800 mt-1">
                {formatCurrency(p.outstandingReceivables, currentBusiness?.currency)}
              </div>
              <span className="text-[11px] text-muted mt-1 block">
                Collected: {formatCurrency(p.netCashCollected, currentBusiness?.currency)}
              </span>
            </div>
          </div>

          {/* Contribution Profit Waterfall Accounting Card */}
          <div className="p-5 rounded-xl bg-card border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-main">Contribution Profit Waterfall</h2>
                <p className="text-xs text-muted">Authoritative reconciliation from revenue to actual retained earnings</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-accent-light text-accent-dark border border-accent/20">
                Gross Margin: {grossMarginPct}%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-main">1. Gross Merchandise Value (GMV)</span>
                <span className="font-bold text-main">{formatCurrency(p.gmv)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Promotional Discounts (Line + Order)</span>
                <span>-{formatCurrency(p.discounts)}</span>
              </div>

              <div className="flex justify-between items-center py-1 font-semibold text-main bg-stone-50 p-2 rounded">
                <span>= Net Product Sales</span>
                <span>{formatCurrency(p.netSales)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Cost of Goods Sold (COGS for sold retained units)</span>
                <span>-{formatCurrency(p.cogs)}</span>
              </div>

              <div className="flex justify-between items-center py-1 font-semibold text-main bg-stone-50 p-2 rounded">
                <span>= Gross Profit</span>
                <span>{formatCurrency(p.grossProfit)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Outbound Shipping Borne by Seller</span>
                <span>-{formatCurrency(p.outboundShippingCost)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Packaging Materials & Boxes</span>
                <span>-{formatCurrency(p.packagingCost)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Return Shipping & Unsalvageable Damaged Stock</span>
                <span>-{formatCurrency((p.returnShippingCosts || 0) + (p.damagedLossCost || 0))}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700 pl-4 border-l-2 border-stone-200">
                <span>(-) Customer Refunds Issued</span>
                <span>-{formatCurrency(p.totalRefunded || 0)}</span>
              </div>

              <div className="flex justify-between items-center py-3 font-bold text-accent-dark text-sm bg-accent-light/50 p-3 rounded-lg border border-accent/20">
                <span>= Net Contribution Profit</span>
                <span>{formatCurrency(p.contributionProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="rounded-xl bg-card border border-border shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-main">Product Margins & Performance</h2>
              <p className="text-xs text-muted">Distinguishing high sales volume items from high profit contributors</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-b border-border text-muted uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Variant / SKU</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-center">Units Sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productPerf.map((prod) => (
                  <tr key={prod.variantId} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-main">
                      <div>{prod.sku}</div>
                      <div className="text-muted font-sans font-normal text-[11px]">{prod.variantTitle}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-main">{prod.productName}</td>
                    <td className="px-4 py-3 text-center font-bold text-main">{prod.unitsSold}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatCurrency(prod.revenue)}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatCurrency(prod.cost)}</td>
                    <td className="px-4 py-3 text-right font-bold text-accent-dark">
                      {formatCurrency(prod.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${prod.marginPercent >= 50 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
                        {prod.marginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'valuation' && valuation && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted">Total Warehouse Asset Valuation</span>
              <div className="text-2xl font-bold text-main mt-1">
                {formatCurrency(valuation.totalValuation, currentBusiness?.currency)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Physical Units on Hand: <strong>{valuation.totalOnHandUnits}</strong></span>
              <span className="text-xs text-rose-700 block">Damaged Write-offs: <strong>{valuation.totalDamagedUnits}</strong></span>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-border text-muted uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Variant Title</th>
                    <th className="px-4 py-3 text-right">Unit Cost Basis</th>
                    <th className="px-4 py-3 text-right">On Hand Units</th>
                    <th className="px-4 py-3 text-right">Asset Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {valuation.items?.map((it) => (
                    <tr key={it.variantId} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 font-mono font-semibold text-main text-[11px]">{it.sku}</td>
                      <td className="px-4 py-3 text-main">{it.title}</td>
                      <td className="px-4 py-3 text-right text-muted">{formatCurrency(it.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-medium text-main">{it.onHand}</td>
                      <td className="px-4 py-3 text-right font-bold text-accent-dark">
                        {formatCurrency(it.assetValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
