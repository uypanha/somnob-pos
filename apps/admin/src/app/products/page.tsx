'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface SizeVariantConfig {
  size: string;
  quantity: number;
  priceUsd: number;
  sku: string;
  barcode: string;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  imageUrl?: string | null;
  costPriceUsd: number;
  sellingPriceUsd: number;
  wholesalePriceUsd: number | null;
  minWholesaleQty: number;
  unitOfMeasure: string;
  size?: string | null;
  color?: string | null;
  stockQty?: number;
  sizeVariants?: SizeVariantConfig[];
  isActive: boolean;
}

const SAMPLE_PHOTO_PRESETS = [
  { label: 'T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80' },
  { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80' },
  { label: 'Polo Shirt', url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=300&auto=format&fit=crop&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
  { label: 'Cola Drink', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80' },
  { label: 'Mineral Water', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80' },
  { label: 'Chips & Snacks', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80' },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Coca Cola Can',
    category: 'Beverages',
    sku: 'COKE-330',
    barcode: '8850123456789',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 0.4,
    sellingPriceUsd: 0.75,
    wholesalePriceUsd: 0.6,
    minWholesaleQty: 12,
    unitOfMeasure: 'CAN',
    stockQty: 150,
    isActive: true,
  },
  {
    id: 'prod-2',
    name: 'Angkor Premium Beer',
    category: 'Beverages',
    sku: 'BEER-330',
    barcode: '8850987654321',
    imageUrl: 'https://images.unsplash.com/photo-1608270546103-97992796c303?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 0.8,
    sellingPriceUsd: 1.25,
    wholesalePriceUsd: 1.0,
    minWholesaleQty: 24,
    unitOfMeasure: 'CAN',
    stockQty: 200,
    isActive: true,
  },
  {
    id: 'prod-3',
    name: 'Vital Mineral Water 500ml Case',
    category: 'Water & Hydration',
    sku: 'VITAL-500-CASE',
    barcode: '8850111222333',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 2.8,
    sellingPriceUsd: 4.5,
    wholesalePriceUsd: 3.8,
    minWholesaleQty: 3,
    unitOfMeasure: 'CASE',
    stockQty: 45,
    isActive: true,
  },
  {
    id: 'prod-4',
    name: 'Lays Classic Potato Chips',
    category: 'Snacks & Packaged Food',
    sku: 'LAYS-50',
    barcode: '8850444555666',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 0.6,
    sellingPriceUsd: 1.1,
    wholesalePriceUsd: 0.9,
    minWholesaleQty: 10,
    unitOfMeasure: 'BAG',
    stockQty: 80,
    isActive: true,
  },
  {
    id: 'prod-5',
    name: 'Angkor Heritage Graphic T-Shirt',
    category: 'Apparel & Clothing',
    sku: 'TEE-ANGKOR',
    barcode: '8850777000',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 6.0,
    sellingPriceUsd: 12.0,
    wholesalePriceUsd: 9.5,
    minWholesaleQty: 10,
    unitOfMeasure: 'PCS',
    color: 'Black',
    stockQty: 120,
    sizeVariants: [
      { size: 'S', quantity: 25, priceUsd: 12.0, sku: 'TEE-ANGKOR-S', barcode: '8850777001' },
      { size: 'M', quantity: 40, priceUsd: 12.0, sku: 'TEE-ANGKOR-M', barcode: '8850777002' },
      { size: 'L', quantity: 30, priceUsd: 12.0, sku: 'TEE-ANGKOR-L', barcode: '8850777003' },
      { size: 'XL', quantity: 15, priceUsd: 13.5, sku: 'TEE-ANGKOR-XL', barcode: '8850777004' },
      { size: 'XXL', quantity: 10, priceUsd: 14.5, sku: 'TEE-ANGKOR-XXL', barcode: '8850777005' },
    ],
    isActive: true,
  },
  {
    id: 'prod-6',
    name: 'Somnob Premium Fleece Hoodie',
    category: 'Apparel & Clothing',
    sku: 'HOODIE-FLEECE',
    barcode: '8850888000',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
    costPriceUsd: 15.0,
    sellingPriceUsd: 26.0,
    wholesalePriceUsd: 21.0,
    minWholesaleQty: 5,
    unitOfMeasure: 'PCS',
    color: 'Navy',
    stockQty: 58,
    sizeVariants: [
      { size: 'S', quantity: 12, priceUsd: 26.0, sku: 'HOODIE-FLEECE-S', barcode: '8850888001' },
      { size: 'M', quantity: 20, priceUsd: 26.0, sku: 'HOODIE-FLEECE-M', barcode: '8850888002' },
      { size: 'L', quantity: 18, priceUsd: 26.0, sku: 'HOODIE-FLEECE-L', barcode: '8850888003' },
      { size: 'XL', quantity: 8, priceUsd: 28.0, sku: 'HOODIE-FLEECE-XL', barcode: '8850888004' },
    ],
    isActive: true,
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New product master fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Apparel & Clothing');
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80');
  const [newCost, setNewCost] = useState('6.00');
  const [newRetail, setNewRetail] = useState('12.00');
  const [newWholesale, setNewWholesale] = useState('9.50');
  const [newMinWholesaleQty, setNewMinWholesaleQty] = useState('10');
  const [newUnit, setNewUnit] = useState('PCS');
  const [newColor, setNewColor] = useState('');

  // Multi-size variant configuration matrix state
  const [hasSizes, setHasSizes] = useState(true);
  const [sizeMatrix, setSizeMatrix] = useState<SizeVariantConfig[]>([
    { size: 'S', quantity: 20, priceUsd: 12.0, sku: '', barcode: '' },
    { size: 'M', quantity: 35, priceUsd: 12.0, sku: '', barcode: '' },
    { size: 'L', quantity: 30, priceUsd: 12.0, sku: '', barcode: '' },
    { size: 'XL', quantity: 15, priceUsd: 13.5, sku: '', barcode: '' },
    { size: 'XXL', quantity: 10, priceUsd: 14.5, sku: '', barcode: '' },
  ]);

  // Inventory Restock / Update Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<ProductItem | null>(null);
  const [adjustQuantities, setAdjustQuantities] = useState<{ [key: string]: number }>({});
  const [adjustReason, setAdjustReason] = useState<string>('Restock / New Shipment Arrival');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Photo Edit Modal State
  const [editPhotoProduct, setEditPhotoProduct] = useState<ProductItem | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exchangeRate = 4100;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preset size matrix generators
  const applyPreset = (type: 'clothing' | 'simple' | 'shoes') => {
    const baseRetail = parseFloat(newRetail) || 12.0;
    const baseSkuClean = newSku.trim() || 'PROD';
    if (type === 'clothing') {
      setSizeMatrix([
        { size: 'S', quantity: 20, priceUsd: baseRetail, sku: `${baseSkuClean}-S`, barcode: '' },
        { size: 'M', quantity: 35, priceUsd: baseRetail, sku: `${baseSkuClean}-M`, barcode: '' },
        { size: 'L', quantity: 30, priceUsd: baseRetail, sku: `${baseSkuClean}-L`, barcode: '' },
        { size: 'XL', quantity: 15, priceUsd: baseRetail + 1.5, sku: `${baseSkuClean}-XL`, barcode: '' },
        { size: 'XXL', quantity: 10, priceUsd: baseRetail + 2.5, sku: `${baseSkuClean}-XXL`, barcode: '' },
      ]);
    } else if (type === 'simple') {
      setSizeMatrix([
        { size: 'S', quantity: 25, priceUsd: baseRetail, sku: `${baseSkuClean}-S`, barcode: '' },
        { size: 'M', quantity: 40, priceUsd: baseRetail, sku: `${baseSkuClean}-M`, barcode: '' },
        { size: 'L', quantity: 30, priceUsd: baseRetail, sku: `${baseSkuClean}-L`, barcode: '' },
      ]);
    } else if (type === 'shoes') {
      setSizeMatrix([
        { size: '38', quantity: 10, priceUsd: baseRetail, sku: `${baseSkuClean}-38`, barcode: '' },
        { size: '39', quantity: 15, priceUsd: baseRetail, sku: `${baseSkuClean}-39`, barcode: '' },
        { size: '40', quantity: 20, priceUsd: baseRetail, sku: `${baseSkuClean}-40`, barcode: '' },
        { size: '41', quantity: 25, priceUsd: baseRetail, sku: `${baseSkuClean}-41`, barcode: '' },
        { size: '42', quantity: 20, priceUsd: baseRetail, sku: `${baseSkuClean}-42`, barcode: '' },
        { size: '43', quantity: 15, priceUsd: baseRetail, sku: `${baseSkuClean}-43`, barcode: '' },
        { size: '44', quantity: 10, priceUsd: baseRetail, sku: `${baseSkuClean}-44`, barcode: '' },
      ]);
    }
  };

  const addCustomSizeRow = () => {
    const baseRetail = parseFloat(newRetail) || 10.0;
    const baseSkuClean = newSku.trim() || 'PROD';
    setSizeMatrix((prev) => [
      ...prev,
      {
        size: '',
        quantity: 10,
        priceUsd: baseRetail,
        sku: `${baseSkuClean}-${prev.length + 1}`,
        barcode: '',
      },
    ]);
  };

  const updateSizeRow = (index: number, field: keyof SizeVariantConfig, val: any) => {
    setSizeMatrix((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeSizeRow = (index: number) => {
    setSizeMatrix((prev) => prev.filter((_, i) => i !== index));
  };

  const totalVariantStock = sizeMatrix.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // File upload reader for instant photo preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'new') {
        setNewImageUrl(result);
      } else {
        setEditPhotoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      p.barcode.includes(searchTerm) ||
      (p.color && p.color.toLowerCase().includes(searchLower)) ||
      (p.sizeVariants &&
        p.sizeVariants.some(
          (v) =>
            v.size.toLowerCase().includes(searchLower) ||
            v.sku.toLowerCase().includes(searchLower) ||
            (v.barcode && v.barcode.includes(searchTerm)),
        ));
    return matchesCategory && matchesSearch;
  });

  // Open Inventory Restock Modal
  const openAdjustModal = (product: ProductItem) => {
    setAdjustModalProduct(product);
    const initialMap: { [key: string]: number } = {};
    if (product.sizeVariants && product.sizeVariants.length > 0) {
      product.sizeVariants.forEach((v) => {
        initialMap[v.size] = v.quantity;
      });
    } else {
      initialMap['single'] = product.stockQty ?? 50;
    }
    setAdjustQuantities(initialMap);
    setAdjustReason('Restock / New Shipment Arrival');
    setAdjustNotes('');
  };

  // Save Inventory Restock
  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === adjustModalProduct.id) {
          if (item.sizeVariants && item.sizeVariants.length > 0) {
            const updatedVariants = item.sizeVariants.map((v) => ({
              ...v,
              quantity: adjustQuantities[v.size] !== undefined ? Math.max(0, adjustQuantities[v.size]) : v.quantity,
            }));
            const updatedTotal = updatedVariants.reduce((sum, v) => sum + v.quantity, 0);
            return {
              ...item,
              stockQty: updatedTotal,
              sizeVariants: updatedVariants,
            };
          } else {
            const updatedSingle = adjustQuantities['single'] !== undefined ? Math.max(0, adjustQuantities['single']) : (item.stockQty ?? 0);
            return {
              ...item,
              stockQty: updatedSingle,
            };
          }
        }
        return item;
      }),
    );

    triggerToast(`✅ Inventory updated for "${adjustModalProduct.name}" (${adjustReason})`);
    setAdjustModalProduct(null);
  };

  // Open Edit Photo Modal
  const openEditPhotoModal = (product: ProductItem) => {
    setEditPhotoProduct(product);
    setEditPhotoUrl(product.imageUrl || '');
  };

  // Save Product Photo
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhotoProduct) return;

    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === editPhotoProduct.id) {
          return {
            ...item,
            imageUrl: editPhotoUrl.trim() || null,
          };
        }
        return item;
      }),
    );

    triggerToast(`📸 Photo updated for "${editPhotoProduct.name}"`);
    setEditPhotoProduct(null);
  };

  // Add Product Form Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSku || !newRetail) return;

    let totalStock = 50;
    let variantsToSave: SizeVariantConfig[] | undefined = undefined;

    if (hasSizes && sizeMatrix.length > 0) {
      variantsToSave = sizeMatrix
        .filter((v) => v.size.trim().length > 0)
        .map((v) => ({
          ...v,
          size: v.size.trim().toUpperCase(),
          sku: v.sku.trim() || `${newSku}-${v.size.trim().toUpperCase()}`,
          barcode: v.barcode.trim() || `8850${Math.floor(10000000 + Math.random() * 90000000)}`,
          quantity: Number(v.quantity) || 0,
          priceUsd: Number(v.priceUsd) || parseFloat(newRetail) || 0,
        }));
      totalStock = variantsToSave.reduce((sum, v) => sum + v.quantity, 0);
    }

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newTitle,
      category: newCategory,
      sku: newSku,
      barcode: newBarcode || (variantsToSave ? variantsToSave[0]?.barcode : ''),
      imageUrl: newImageUrl.trim() || null,
      costPriceUsd: parseFloat(newCost) || 0,
      sellingPriceUsd: parseFloat(newRetail) || 0,
      wholesalePriceUsd: newWholesale ? parseFloat(newWholesale) : null,
      minWholesaleQty: parseInt(newMinWholesaleQty, 10) || 1,
      unitOfMeasure: newUnit,
      color: newColor.trim() ? newColor.trim() : null,
      stockQty: totalStock,
      sizeVariants: variantsToSave,
      isActive: true,
    };

    setProducts([newProd, ...products]);
    setShowModal(false);
    triggerToast(`✨ Successfully created product "${newTitle}" with ${totalStock} initial stock`);

    // Reset form
    setNewTitle('');
    setNewSku('');
    setNewBarcode('');
    setNewColor('');
    setNewImageUrl(SAMPLE_PHOTO_PRESETS[0].url);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#0f172a',
            color: '#38bdf8',
            padding: '0.85rem 1.4rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 2000,
            fontSize: '0.9rem',
            fontWeight: 600,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

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
            Manage master products, product photos, multi-size inventory balances, restock shipments, and retail/wholesale tiers.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.4rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)',
          }}
        >
          + Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search by title, SKU, barcode, size (e.g. S, XL), or color..."
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
          <option value="Apparel & Clothing">Apparel & Clothing</option>
          <option value="Beverages">Beverages</option>
          <option value="Water & Hydration">Water & Hydration</option>
          <option value="Snacks & Packaged Food">Snacks & Packaged Food</option>
        </select>
      </div>

      {/* Product List Table */}
      <div style={{ background: '#ffffff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Product & Photo</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>SKU / Variants</th>
              <th style={{ padding: '0.85rem 1rem' }}>Total Stock</th>
              <th style={{ padding: '0.85rem 1rem' }}>Standard Retail</th>
              <th style={{ padding: '0.85rem 1rem' }}>Wholesale Price</th>
              <th style={{ padding: '0.85rem 1rem' }}>Unit</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const minPrice = p.sizeVariants && p.sizeVariants.length > 0
                ? Math.min(...p.sizeVariants.map((v) => v.priceUsd))
                : p.sellingPriceUsd;
              const maxPrice = p.sizeVariants && p.sizeVariants.length > 0
                ? Math.max(...p.sizeVariants.map((v) => v.priceUsd))
                : p.sellingPriceUsd;

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {/* Product & Photo */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => openEditPhotoModal(p)}
                        title="Click to change photo"
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          flexShrink: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>📦</span>
                        )}
                      </div>

                      {/* Title & Details */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>{p.name}</span>
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

                        {/* Size Variants Matrix Chips */}
                        {p.sizeVariants && p.sizeVariants.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                            {p.sizeVariants.map((v) => (
                              <span
                                key={v.size}
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                              >
                                <strong>{v.size}:</strong> {v.quantity} pcs
                                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>(${v.priceUsd.toFixed(2)})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                    <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {p.category}
                    </span>
                  </td>

                  {/* SKU / Barcode */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.sku}</div>
                    {p.sizeVariants ? (
                      <div style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 600 }}>
                        {p.sizeVariants.length} sizes configured
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.barcode || 'No barcode'}</div>
                    )}
                  </td>

                  {/* Total Inventory Stock */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      {p.stockQty ?? 50} in stock
                    </span>
                  </td>

                  {/* Retail Price */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '700', color: '#059669' }}>
                      {minPrice === maxPrice
                        ? `$${minPrice.toFixed(2)}`
                        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {(minPrice * exchangeRate).toLocaleString()}៛
                    </div>
                  </td>

                  {/* Wholesale Tier */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {p.wholesalePriceUsd ? (
                      <div>
                        <span style={{ fontWeight: '600', color: '#2563eb' }}>
                          ${p.wholesalePriceUsd.toFixed(2)}
                        </span>{' '}
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          (Min {p.minWholesaleQty})
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {(p.wholesalePriceUsd * exchangeRate).toLocaleString()}៛
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No wholesale tier</span>
                    )}
                  </td>

                  {/* Unit */}
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{p.unitOfMeasure}</td>

                  {/* Actions Column */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
                      <button
                        onClick={() => openAdjustModal(p)}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ⚡ Restock / Adjust
                      </button>
                      <button
                        onClick={() => openEditPhotoModal(p)}
                        style={{
                          background: 'transparent',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        📷 Photo
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No products match your search or filter.
          </div>
        )}
      </div>

      {/* 1. UPDATE INVENTORY & RESTOCK MODAL */}
      {adjustModalProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', width: '680px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  {adjustModalProduct.imageUrl ? (
                    <img src={adjustModalProduct.imageUrl} alt={adjustModalProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Update Inventory: {adjustModalProduct.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    SKU: {adjustModalProduct.sku} • Current Total: <strong>{adjustModalProduct.stockQty} pcs</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setAdjustModalProduct(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInventory}>
              {/* Size Variants Restock List */}
              {adjustModalProduct.sizeVariants && adjustModalProduct.sizeVariants.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                    Adjust Stock Per Size Variant:
                  </label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Size</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Current</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Quick Add</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>New On-Hand</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adjustModalProduct.sizeVariants.map((v) => {
                          const currentQty = v.quantity;
                          const newQty = adjustQuantities[v.size] !== undefined ? adjustQuantities[v.size] : currentQty;
                          const delta = newQty - currentQty;

                          return (
                            <tr key={v.size} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#1e293b' }}>
                                Size {v.size}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>
                                {currentQty} pcs
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {[5, 10, 25].map((amt) => (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={() => setAdjustQuantities((prev) => ({ ...prev, [v.size]: (prev[v.size] ?? currentQty) + amt }))}
                                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                      +{amt}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={newQty}
                                  onChange={(e) => setAdjustQuantities({ ...adjustQuantities, [v.size]: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                  style={{ width: '80px', padding: '0.4rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                                />
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                {delta > 0 ? (
                                  <span style={{ color: '#16a34a', fontWeight: 700 }}>+{delta} pcs</span>
                                ) : delta < 0 ? (
                                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{delta} pcs</span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>No change</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Single Item Restock */
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>Current Stock Level:</span>
                    <strong style={{ fontSize: '1rem' }}>{adjustModalProduct.stockQty ?? 50} units</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>New On-Hand Count:</label>
                    <input
                      type="number"
                      min="0"
                      value={adjustQuantities['single'] ?? adjustModalProduct.stockQty ?? 50}
                      onChange={(e) => setAdjustQuantities({ single: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      style={{ width: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '1rem' }}
                    />
                  </div>

                  {/* Quick Add Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick Restock:</span>
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAdjustQuantities((prev) => ({ single: (prev['single'] ?? adjustModalProduct.stockQty ?? 50) + amt }))}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjustment Reason & Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Movement Reason *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Restock / New Shipment Arrival">Restock / New Shipment Arrival</option>
                    <option value="Physical Stock Count Variance">Physical Stock Count Variance</option>
                    <option value="Damaged / Defective Stock Removal">Damaged / Defective Stock Removal</option>
                    <option value="Customer Return / Restock">Customer Return / Restock</option>
                    <option value="Internal Store Display / Usage">Internal Store Display / Usage</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Reference / PO Number (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8821 / Delivery Slip"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Save Stock Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT PHOTO MODAL */}
      {editPhotoProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', width: '520px', maxWidth: '95vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Update Photo: {editPhotoProduct.name}</h3>
              <button onClick={() => setEditPhotoProduct(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSavePhoto}>
              {/* Preview Box */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '140px', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editPhotoUrl ? (
                    <img src={editPhotoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }}>📷</span>
                  )}
                </div>
              </div>

              {/* Upload file or enter URL */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Upload Image from Computer:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'edit')}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Or Image Web URL:</label>
                <input
                  type="text"
                  placeholder="https://images.example.com/item.jpg"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Sample Presets */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Quick Preset Samples:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {SAMPLE_PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setEditPhotoUrl(p.url)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      {p.label}
                    </button>
                  ))}
                  {editPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditPhotoUrl('')}
                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditPhotoProduct(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD MASTER PRODUCT MODAL WITH PHOTO & SIZE MATRIX */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '2rem', width: '740px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem' }}>✨ Create Master Product & Size Quantities</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              {/* Photo & Basic Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.25rem', marginBottom: '1rem', alignItems: 'start' }}>
                {/* Photo Upload & Preview */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Photo</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload image file"
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '10px',
                      border: '2px dashed #cbd5e1',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {newImageUrl ? (
                      <img src={newImageUrl} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>📷</span>
                        <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>Upload File</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'new')}
                  />
                  {newImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', marginTop: '0.25rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Title & Category */}
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Angkor Heritage Graphic T-Shirt"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          if (e.target.value === 'Apparel & Clothing') setHasSizes(true);
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="Apparel & Clothing">Apparel & Clothing</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Water & Hydration">Water & Hydration</option>
                        <option value="Snacks & Packaged Food">Snacks & Packaged Food</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Color (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Black"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Unit</label>
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Preset Bar */}
              <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Sample Photos:</span>
                {SAMPLE_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setNewImageUrl(p.url)}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Base SKU & Barcode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Base SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TEE-ANGKOR"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Master Barcode (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8850777000"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Base Cost & Retail Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Base Cost Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Base Retail Selling Price (USD) *</label>
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

              {/* --- SIZE VARIANT MATRIX GENERATOR SECTION --- */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '700', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={hasSizes}
                      onChange={(e) => setHasSizes(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Configure Multiple Sizes with Stock Quantities (Apparel / Shoes)</span>
                  </label>

                  {hasSizes && (
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                      Total: {totalVariantStock} units across {sizeMatrix.length} sizes
                    </span>
                  )}
                </div>

                {hasSizes && (
                  <div>
                    {/* Quick Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => applyPreset('clothing')}
                        style={{ background: '#e2e8f0', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Standard Clothing (S - XXL)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('simple')}
                        style={{ background: '#e2e8f0', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Simple (S, M, L)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('shoes')}
                        style={{ background: '#e2e8f0', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Shoes (38 - 44)
                      </button>
                    </div>

                    {/* Matrix Table */}
                    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Size</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Initial Qty</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Retail Price ($)</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Variant SKU</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Barcode (optional)</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>✕</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizeMatrix.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.4rem 0.75rem' }}>
                                <input
                                  type="text"
                                  value={row.size}
                                  placeholder="e.g. M"
                                  onChange={(e) => updateSizeRow(idx, 'size', e.target.value.toUpperCase())}
                                  style={{ width: '60px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.quantity}
                                  onChange={(e) => updateSizeRow(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                                  style={{ width: '70px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={row.priceUsd}
                                  onChange={(e) => updateSizeRow(idx, 'priceUsd', parseFloat(e.target.value) || 0)}
                                  style={{ width: '85px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem' }}>
                                <input
                                  type="text"
                                  value={row.sku || (newSku ? `${newSku}-${row.size}` : '')}
                                  onChange={(e) => updateSizeRow(idx, 'sku', e.target.value)}
                                  style={{ width: '130px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem' }}>
                                <input
                                  type="text"
                                  value={row.barcode}
                                  placeholder="Auto-assigned"
                                  onChange={(e) => updateSizeRow(idx, 'barcode', e.target.value)}
                                  style={{ width: '120px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => removeSizeRow(idx)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={addCustomSizeRow}
                        style={{ background: '#ffffff', border: '1px dashed #2563eb', color: '#2563eb', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        + Add Another Size
                      </button>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Each size gets its own inventory count and unique barcode automatically!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Wholesale Pricing Tier */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>🤝 Wholesale Pricing Tier (Optional)</h4>
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Save Product & Inventory ({hasSizes ? `${totalVariantStock} Units` : '1 Item'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
