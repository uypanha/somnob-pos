'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  costPriceUsd: number;
  sellingPriceUsd: number;
  wholesalePriceUsd: number | null;
  minWholesaleQty: number;
  unitOfMeasure: string;
  size?: string | null;
  color?: string | null;
  isActive: boolean;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Coca Cola Can',
    category: 'Beverages',
    sku: 'COKE-330',
    barcode: '8850123456789',
    costPriceUsd: 0.4,
    sellingPriceUsd: 0.75,
    wholesalePriceUsd: 0.6,
    minWholesaleQty: 12,
    unitOfMeasure: 'CAN',
    isActive: true,
  },
  {
    id: 'prod-2',
    name: 'Angkor Premium Beer',
    category: 'Beverages',
    sku: 'BEER-330',
    barcode: '8850987654321',
    costPriceUsd: 0.8,
    sellingPriceUsd: 1.25,
    wholesalePriceUsd: 1.0,
    minWholesaleQty: 24,
    unitOfMeasure: 'CAN',
    isActive: true,
  },
  {
    id: 'prod-3',
    name: 'Vital Mineral Water 500ml Case',
    category: 'Water & Hydration',
    sku: 'VITAL-500-CASE',
    barcode: '8850111222333',
    costPriceUsd: 2.8,
    sellingPriceUsd: 4.5,
    wholesalePriceUsd: 3.8,
    minWholesaleQty: 3,
    unitOfMeasure: 'CASE',
    isActive: true,
  },
  {
    id: 'prod-4',
    name: 'Lays Classic Potato Chips',
    category: 'Snacks & Packaged Food',
    sku: 'LAYS-50',
    barcode: '8850444555666',
    costPriceUsd: 0.6,
    sellingPriceUsd: 1.1,
    wholesalePriceUsd: 0.9,
    minWholesaleQty: 10,
    unitOfMeasure: 'BAG',
    isActive: true,
  },
  {
    id: 'prod-5',
    name: 'Angkor Heritage Graphic T-Shirt',
    category: 'Apparel & Clothing',
    sku: 'TEE-ANGKOR-M',
    barcode: '8850777002',
    costPriceUsd: 6.0,
    sellingPriceUsd: 12.0,
    wholesalePriceUsd: 9.5,
    minWholesaleQty: 10,
    unitOfMeasure: 'PCS',
    size: 'M',
    color: 'Black',
    isActive: true,
  },
  {
    id: 'prod-6',
    name: 'Angkor Heritage Graphic T-Shirt',
    category: 'Apparel & Clothing',
    sku: 'TEE-ANGKOR-L',
    barcode: '8850777003',
    costPriceUsd: 6.0,
    sellingPriceUsd: 12.0,
    wholesalePriceUsd: 9.5,
    minWholesaleQty: 10,
    unitOfMeasure: 'PCS',
    size: 'L',
    color: 'Black',
    isActive: true,
  },
  {
    id: 'prod-7',
    name: 'Somnob Premium Fleece Hoodie',
    category: 'Apparel & Clothing',
    sku: 'HOODIE-FLEECE-L',
    barcode: '8850888003',
    costPriceUsd: 15.0,
    sellingPriceUsd: 26.0,
    wholesalePriceUsd: 21.0,
    minWholesaleQty: 5,
    unitOfMeasure: 'PCS',
    size: 'L',
    color: 'Navy',
    isActive: true,
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // New product form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Beverages');
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newCost, setNewCost] = useState('0.50');
  const [newRetail, setNewRetail] = useState('1.00');
  const [newWholesale, setNewWholesale] = useState('0.85');
  const [newMinWholesaleQty, setNewMinWholesaleQty] = useState('10');
  const [newUnit, setNewUnit] = useState('PCS');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const exchangeRate = 4100;

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSku || !newRetail) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newTitle,
      category: newCategory,
      sku: newSku,
      barcode: newBarcode,
      costPriceUsd: parseFloat(newCost) || 0,
      sellingPriceUsd: parseFloat(newRetail) || 0,
      wholesalePriceUsd: newWholesale ? parseFloat(newWholesale) : null,
      minWholesaleQty: parseInt(newMinWholesaleQty, 10) || 1,
      unitOfMeasure: newUnit,
      size: newSize.trim() ? newSize.trim().toUpperCase() : null,
      color: newColor.trim() ? newColor.trim() : null,
      isActive: true,
    };

    setProducts([newProd, ...products]);
    setShowModal(false);
    // Reset form
    setNewTitle('');
    setNewSku('');
    setNewBarcode('');
    setNewSize('');
    setNewColor('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>📦 Product Master Catalog</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Manage master products, unique barcodes, retail pricing, and wholesale tier thresholds.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search by title, SKU, or barcode (e.g. 8850123...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '260px',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            fontSize: '0.95rem',
          }}
        >
          <option value="ALL">All Categories</option>
          <option value="Beverages">Beverages</option>
          <option value="Water & Hydration">Water & Hydration</option>
          <option value="Snacks & Packaged Food">Snacks & Packaged Food</option>
          <option value="Apparel & Clothing">Apparel & Clothing</option>
        </select>
      </div>

      {/* Product List Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Product Title</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>SKU / Barcode</th>
              <th style={{ padding: '0.85rem 1rem' }}>Standard Retail</th>
              <th style={{ padding: '0.85rem 1rem' }}>Wholesale Price (Tier)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Unit</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span>{p.name}</span>
                    {p.size && (
                      <span
                        style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        Size: {p.size}
                      </span>
                    )}
                    {p.color && (
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {p.color}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                  <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '500' }}>{p.sku}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.barcode || 'No barcode'}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '600', color: '#059669' }}>${p.sellingPriceUsd.toFixed(2)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {(p.sellingPriceUsd * exchangeRate).toLocaleString()}៛
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {p.wholesalePriceUsd ? (
                    <div>
                      <span style={{ fontWeight: '600', color: '#2563eb' }}>
                        ${p.wholesalePriceUsd.toFixed(2)}
                      </span>{' '}
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        (Min {p.minWholesaleQty})
                      </span>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {(p.wholesalePriceUsd * exchangeRate).toLocaleString()}៛
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No wholesale tier</span>
                  )}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{p.unitOfMeasure}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No products match your search or filter.
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', width: '560px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>Add Master Product</h2>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Bull Energy Drink"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Water & Hydration">Water & Hydration</option>
                    <option value="Snacks & Packaged Food">Snacks & Packaged Food</option>
                    <option value="Apparel & Clothing">Apparel & Clothing</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Unit of Measure</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Size & Color Variant Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Size Variant (e.g. S, M, L, XL)</label>
                  <input
                    type="text"
                    placeholder="e.g. M, L, XL (optional)"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Color (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Black, Navy, White"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RB-250"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8850999888111"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Cost Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Retail Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newRetail}
                    onChange={(e) => setNewRetail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Wholesale Pricing Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>🤝 Wholesale Pricing Tier</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Wholesale Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional wholesale rate"
                      value={newWholesale}
                      onChange={(e) => setNewWholesale(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Min Wholesale Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newMinWholesaleQty}
                      onChange={(e) => setNewMinWholesaleQty(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
