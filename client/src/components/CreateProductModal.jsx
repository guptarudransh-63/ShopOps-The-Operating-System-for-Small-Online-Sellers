import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CreateProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('1999');
  const [baseCostPrice, setBaseCostPrice] = useState('800');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Variant generator state
  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L']);
  const [colors, setColors] = useState(['Noir Black', 'Ivory White']);
  const [newColorInput, setNewColorInput] = useState('');

  // Generated variant rows
  const [variants, setVariants] = useState([]);

  // Generate variants whenever inputs change
  const handleGenerateVariants = () => {
    if (!name.trim()) {
      error('Enter product name first to generate SKU patterns.');
      return;
    }
    const slug = name
      .substring(0, 4)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'PRD');

    const list = [];
    selectedSizes.forEach((sz) => {
      colors.forEach((col) => {
        const colCode = col.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'COL');
        list.push({
          sku: `${slug}-${colCode}-${sz}`,
          title: `Size: ${sz} / Color: ${col}`,
          size: sz,
          color: col,
          price: parseFloat(basePrice) || 0,
          costPrice: parseFloat(baseCostPrice) || 0,
          initialStock: 10,
        });
      });
    });
    setVariants(list);
  };

  const handleAddColor = () => {
    if (newColorInput.trim() && !colors.includes(newColorInput.trim())) {
      setColors([...colors, newColorInput.trim()]);
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (col) => {
    if (colors.length === 1) return;
    setColors(colors.filter((c) => c !== col));
  };

  const toggleSize = (sz) => {
    if (selectedSizes.includes(sz)) {
      if (selectedSizes.length === 1) return;
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  const handleVariantRowChange = (index, field, value) => {
    const copy = [...variants];
    copy[index][field] = value;
    setVariants(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Product name is required.');
      return;
    }

    if (variants.length === 0) {
      error('Please generate at least one variant.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        basePrice: Math.round(parseFloat(basePrice) * 100),
        baseCostPrice: Math.round(parseFloat(baseCostPrice) * 100),
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          title: v.title.trim(),
          attributes: [
            { name: 'Size', value: v.size },
            { name: 'Color', value: v.color },
          ],
          price: Math.round(parseFloat(v.price) * 100),
          costPrice: Math.round(parseFloat(v.costPrice) * 100),
          initialStock: parseInt(v.initialStock, 10) || 0,
        })),
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        success(`Product "${res.data.data.name}" created with ${payload.variants.length} variants!`);
        onClose();
        if (onProductCreated) onProductCreated(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-stone-50/50">
          <div>
            <h2 className="text-base font-semibold text-main">New Product & Variant Matrix</h2>
            <p className="text-xs text-muted">Define product details, generate multi-variant sizes and colors</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-main mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Handwoven Linen Tunic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-main mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-main mb-1">Default Price (₹)</label>
              <input
                type="number"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-main mb-1">Cost of Goods / COGS (₹)</label>
              <input
                type="number"
                min="0"
                value={baseCostPrice}
                onChange={(e) => setBaseCostPrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-main mb-1">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-bg border border-border rounded-md focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Variant Matrix Generator */}
          <div className="p-4 rounded-lg bg-stone-50/70 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> Variant Generator
              </span>
              <button
                type="button"
                onClick={handleGenerateVariants}
                className="px-3 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
              >
                Generate Variants
              </button>
            </div>

            {/* Sizes */}
            <div>
              <span className="text-xs text-muted block mb-1">Sizes:</span>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      selectedSizes.includes(sz)
                        ? 'bg-accent-light border-accent text-accent-dark font-semibold'
                        : 'bg-white border-border text-muted hover:border-accent/40'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <span className="text-xs text-muted block mb-1">Colors:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {colors.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-white border border-border text-main"
                  >
                    {col}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(col)}
                      className="text-muted hover:text-status-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add color..."
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                    className="w-24 px-2 py-0.5 text-xs bg-white border border-border rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="p-1 text-muted hover:text-main"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Variants Table */}
          {variants.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Sellable Variants ({variants.length})
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-border text-muted uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Variant Title</th>
                      <th className="px-3 py-2 text-right">Price (₹)</th>
                      <th className="px-3 py-2 text-right">Cost (₹)</th>
                      <th className="px-3 py-2 text-right">Opening Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {variants.map((v, i) => (
                      <tr key={i} className="hover:bg-stone-50/50">
                        <td className="px-3 py-1.5 font-mono text-[11px] font-semibold text-main">
                          {v.sku}
                        </td>
                        <td className="px-3 py-1.5 text-main">{v.title}</td>
                        <td className="px-3 py-1.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.price}
                            onChange={(e) => handleVariantRowChange(i, 'price', e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-xs text-right border border-border rounded"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.costPrice}
                            onChange={(e) => handleVariantRowChange(i, 'costPrice', e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-xs text-right border border-border rounded"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.initialStock}
                            onChange={(e) => handleVariantRowChange(i, 'initialStock', e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-xs text-right border border-border rounded font-semibold text-accent-dark"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
              disabled={loading || variants.length === 0}
              className="px-5 py-2 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-subtle disabled:opacity-50"
            >
              {loading ? 'Creating Catalog...' : 'Publish Product & Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
