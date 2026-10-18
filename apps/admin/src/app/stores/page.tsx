'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StoreBranch {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  activeRegisters: number;
  exchangeRate: number; // USD -> KHR
  isActive: boolean;
}

const INITIAL_STORES: StoreBranch[] = [
  {
    id: 'store-1',
    name: 'BKK1 Flagship Store',
    code: 'STR-001',
    phone: '+855 23 888 999',
    address: 'Street 302, BKK1, Phnom Penh, Cambodia',
    activeRegisters: 2,
    exchangeRate: 4100.0,
    isActive: true,
  },
  {
    id: 'store-2',
    name: 'Toul Kork Branch',
    code: 'STR-002',
    phone: '+855 23 777 666',
    address: 'Street 315, Toul Kork, Phnom Penh, Cambodia',
    activeRegisters: 1,
    exchangeRate: 4100.0,
    isActive: true,
  },
];

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreBranch[]>(INITIAL_STORES);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>('4100');

  const handleUpdateRate = (storeId: string) => {
    const parsed = parseFloat(newRate);
    if (!parsed || parsed <= 0) return;

    setStores(
      stores.map((s) =>
        s.id === storeId ? { ...s, exchangeRate: parsed } : s
      )
    );
    setEditingStoreId(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>🏬 Stores & Multi-Branch Settings</h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Manage physical retail store locations, POS register terminals, and live USD/KHR exchange rates.
        </p>
      </div>

      {/* Stores Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {stores.map((store) => (
          <div
            key={store.id}
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>{store.name}</h3>
                  <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                    {store.code}
                  </span>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                📍 {store.address}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                📞 {store.phone}
              </div>

              {/* Exchange Rate Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Live Dual-Currency Exchange Rate</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#2563eb' }}>
                      $1.00 USD = {store.exchangeRate.toLocaleString()} ៛ KHR
                    </div>
                  </div>
                  {editingStoreId !== store.id ? (
                    <button
                      onClick={() => {
                        setEditingStoreId(store.id);
                        setNewRate(store.exchangeRate.toString());
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Change Rate
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        style={{ width: '80px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #3b82f6' }}
                      />
                      <button
                        onClick={() => handleUpdateRate(store.id)}
                        style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.6rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
              <span>🖥️ POS Registers: <strong>{store.activeRegisters} Active</strong></span>
              <span style={{ color: '#059669', fontWeight: '600' }}>Cash & KHQR Ready</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
