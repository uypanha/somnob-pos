'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  isLowStock: boolean;
}

interface MovementLog {
  id: string;
  createdAt: string;
  productName: string;
  sku: string;
  movementType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SALE' | 'REFUND';
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  initiatedBy: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'bal-1',
    productName: 'Coca Cola Can',
    variantName: '330ml Can',
    sku: 'COKE-330',
    barcode: '8850123456789',
    unitOfMeasure: 'CAN',
    quantityOnHand: 48,
    quantityReserved: 3,
    quantityAvailable: 45,
    reorderPoint: 12,
    isLowStock: false,
  },
  {
    id: 'bal-2',
    productName: 'Angkor Premium Beer',
    variantName: '330ml Can',
    sku: 'BEER-330',
    barcode: '8850987654321',
    unitOfMeasure: 'CAN',
    quantityOnHand: 8,
    quantityReserved: 0,
    quantityAvailable: 8,
    reorderPoint: 15,
    isLowStock: true, // Triggering low stock
  },
  {
    id: 'bal-3',
    productName: 'Vital Mineral Water 500ml Case',
    variantName: 'Case (24x 500ml)',
    sku: 'VITAL-500-CASE',
    barcode: '8850111222333',
    unitOfMeasure: 'CASE',
    quantityOnHand: 4,
    quantityReserved: 1,
    quantityAvailable: 3,
    reorderPoint: 5,
    isLowStock: true, // Triggering low stock
  },
  {
    id: 'bal-4',
    productName: 'Lays Classic Potato Chips',
    variantName: '50g Bag',
    sku: 'LAYS-50',
    barcode: '8850444555666',
    unitOfMeasure: 'BAG',
    quantityOnHand: 60,
    quantityReserved: 0,
    quantityAvailable: 60,
    reorderPoint: 10,
    isLowStock: false,
  },
];

const INITIAL_MOVEMENTS: MovementLog[] = [
  {
    id: 'mov-1',
    createdAt: '2026-10-18 14:15',
    productName: 'Coca Cola Can',
    sku: 'COKE-330',
    movementType: 'SALE',
    quantityDelta: -2,
    quantityBefore: 50,
    quantityAfter: 48,
    reason: 'POS Sale (ORD-20261018-0001)',
    initiatedBy: 'Sophea Chan (Cashier)',
  },
  {
    id: 'mov-2',
    createdAt: '2026-10-18 11:30',
    productName: 'Angkor Premium Beer',
    sku: 'BEER-330',
    movementType: 'ADJUSTMENT_OUT',
    quantityDelta: -4,
    quantityBefore: 12,
    quantityAfter: 8,
    reason: 'Damaged / Dented cans discarded',
    initiatedBy: 'Dara Sok (Manager)',
  },
  {
    id: 'mov-3',
    createdAt: '2026-10-18 09:00',
    productName: 'Vital Mineral Water 500ml Case',
    sku: 'VITAL-500-CASE',
    movementType: 'ADJUSTMENT_IN',
    quantityDelta: 10,
    quantityBefore: 0,
    quantityAfter: 10,
    reason: 'Initial branch opening float delivery',
    initiatedBy: 'Panha Uong (Owner)',
  },
];

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'LOW_STOCK' | 'MOVEMENTS'>('INVENTORY');
  const [selectedStore, setSelectedStore] = useState('STR-001');
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [movements, setMovements] = useState<MovementLog[]>(INITIAL_MOVEMENTS);

  // Stock adjustment modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('5');
  const [adjustmentAction, setAdjustmentAction] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustmentReason, setAdjustmentReason] = useState('Physical count variance');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const lowStockCount = inventory.filter((i) => i.isLowStock).length;

  const filteredInventory = inventory.filter((item) => {
    if (activeTab === 'LOW_STOCK' && !item.isLowStock) return false;
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm);
    return matchesSearch;
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const rawDelta = parseInt(adjustmentDelta, 10) || 0;
    if (rawDelta <= 0) return;

    const delta = adjustmentAction === 'ADD' ? rawDelta : -rawDelta;
    const newOnHand = selectedItem.quantityOnHand + delta;

    if (newOnHand < 0) {
      alert(`Error: Adjustment would result in negative stock (${newOnHand})!`);
      return;
    }

    // Update state
    setInventory(
      inventory.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              quantityOnHand: newOnHand,
              quantityAvailable: Math.max(0, newOnHand - i.quantityReserved),
              isLowStock: newOnHand <= i.reorderPoint,
            }
          : i
      )
    );

    // Append movement log
    const newMovement: MovementLog = {
      id: `mov-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      productName: selectedItem.productName,
      sku: selectedItem.sku,
      movementType: delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      quantityDelta: delta,
      quantityBefore: selectedItem.quantityOnHand,
      quantityAfter: newOnHand,
      reason: adjustmentNotes ? `${adjustmentReason} (${adjustmentNotes})` : adjustmentReason,
      initiatedBy: 'Panha Uong (Owner)',
    };

    setMovements([newMovement, ...movements]);
    setSelectedItem(null);
    setAdjustmentNotes('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header and Branch Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>📊 Branch Inventory & Audit Ledger</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time stock on hand, reservation guards, reorder alerts, and immutable movements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Active Branch:</span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
            }}
          >
            <option value="STR-001">BKK1 Flagship Store (STR-001)</option>
            <option value="STR-002">Toul Kork Branch (STR-002)</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'INVENTORY' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'INVENTORY' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          All Stock Levels ({inventory.length})
        </button>

        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'LOW_STOCK' ? '3px solid #dc2626' : '3px solid transparent',
            color: activeTab === 'LOW_STOCK' ? '#dc2626' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ⚠️ Low Stock Alerts
          {lowStockCount > 0 && (
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'MOVEMENTS' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'MOVEMENTS' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          📜 Movement Audit Ledger ({movements.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'MOVEMENTS' ? (
        <>
          {/* Search bar */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search inventory by product, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 1rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Inventory Table */}
          <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Product & Variant</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SKU / Barcode</th>
                  <th style={{ padding: '0.85rem 1rem' }}>On-Hand</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reserved</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Available</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reorder Point</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.variantName}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '500' }}>{item.sku}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.barcode}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold' }}>
                      {item.quantityOnHand} {item.unitOfMeasure}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {item.quantityReserved}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: item.quantityAvailable > 0 ? '#059669' : '#dc2626' }}>
                      {item.quantityAvailable}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {item.reorderPoint}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.isLowStock ? (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          LOW STOCK
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedItem(item)}
                        style={{
                          background: '#f1f5f9',
                          color: '#1e293b',
                          border: '1px solid #cbd5e1',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.85rem',
                        }}
                      >
                        ✏️ Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Movements Audit Ledger Table */
        <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Product / SKU</th>
                <th style={{ padding: '0.85rem 1rem' }}>Movement Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Delta</th>
                <th style={{ padding: '0.85rem 1rem' }}>Before → After</th>
                <th style={{ padding: '0.85rem 1rem' }}>Reason & Reference</th>
                <th style={{ padding: '0.85rem 1rem' }}>Initiated By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>{m.createdAt}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '600' }}>{m.productName}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{m.sku}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background:
                          m.movementType === 'ADJUSTMENT_IN'
                            ? '#dbeafe'
                            : m.movementType === 'SALE'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          m.movementType === 'ADJUSTMENT_IN'
                            ? '#1d4ed8'
                            : m.movementType === 'SALE'
                            ? '#b45309'
                            : '#b91c1c',
                      }}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: m.quantityDelta > 0 ? '#059669' : '#dc2626' }}>
                    {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    {m.quantityBefore} → {m.quantityAfter}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#1e293b' }}>{m.reason}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{m.initiatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Adjust Stock Level</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
              {selectedItem.productName} ({selectedItem.sku}) • Current On-Hand: <strong>{selectedItem.quantityOnHand}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAdjustmentAction('ADD')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: adjustmentAction === 'ADD' ? '#059669' : '#f1f5f9',
                    color: adjustmentAction === 'ADD' ? '#fff' : '#475569',
                  }}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentAction('DEDUCT')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: adjustmentAction === 'DEDUCT' ? '#dc2626' : '#f1f5f9',
                    color: adjustmentAction === 'DEDUCT' ? '#fff' : '#475569',
                  }}
                >
                  - Deduct / Damage
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Quantity Delta *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Reason Code *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Physical count variance">Physical count variance (Audit)</option>
                  <option value="Damaged goods">Damaged / Broken items</option>
                  <option value="Spoilage or expired">Expired / Spoilage</option>
                  <option value="Direct supplier shipment">Direct supplier shipment</option>
                  <option value="Internal branch transfer">Internal branch transfer</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Audit Notes</label>
                <input
                  type="text"
                  placeholder="Optional details for ledger tracking..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: adjustmentAction === 'ADD' ? '#059669' : '#dc2626',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
