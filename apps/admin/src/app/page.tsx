import React from 'react';
import Link from 'next/link';

export default function AdminHomePage() {
  const metrics = {
    totalStores: 2,
    totalProducts: 4,
    lowStockAlerts: 2,
    pendingWholesale: 1,
    activeShifts: 1,
    todaySalesUsd: 286.5,
    exchangeRate: 4100,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.85rem' }}>Somnob POS — Enterprise Admin</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Multi-Branch Retail Management • Dual-Currency (USD / KHR)
          </p>
        </div>
        <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
          Standard Rate: <strong>$1.00 = {metrics.exchangeRate.toLocaleString()}៛</strong>
        </div>
      </header>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>TODAY'S REVENUE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#059669', marginTop: '0.25rem' }}>
            ${metrics.todaySalesUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {(metrics.todaySalesUsd * metrics.exchangeRate).toLocaleString()}៛ KHR
          </div>
        </div>

        <Link href="/wholesale" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>PENDING WHOLESALE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#b45309', marginTop: '0.25rem' }}>
              {metrics.pendingWholesale}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#d97706' }}>Applications awaiting approval →</div>
          </div>
        </Link>

        <Link href="/inventory" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold' }}>LOW STOCK ALERTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.25rem' }}>
              {metrics.lowStockAlerts}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Items below reorder point →</div>
          </div>
        </Link>

        <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>ACTIVE BRANCH SHIFTS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#2563eb', marginTop: '0.25rem' }}>
            {metrics.activeShifts} Open
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Across {metrics.totalStores} branch locations</div>
        </div>
      </div>

      {/* Main Navigation Modules */}
      <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem' }}>Business Modules</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Link href="/stores" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🏬 Multi-Branch & Currency →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Configure physical branch stores, POS registers, and live USD/KHR exchange rates.</p>
          </div>
        </Link>

        <Link href="/products" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📦 Master Product Catalog →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Manage categories, variants, barcodes, standard retail prices, and wholesale pricing tiers.</p>
          </div>
        </Link>

        <Link href="/inventory" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📊 Real-Time Inventory & Ledger →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Live stock levels, reservation tracking, low stock reorder alerts, and immutable audit logs.</p>
          </div>
        </Link>

        <Link href="/wholesale" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🤝 Wholesale Approvals →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Review customer applications and grant wholesale buyer privileges with audit trail.</p>
          </div>
        </Link>

        <Link href="/employees" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>👥 Staff & Role Permissions →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Manage employee accounts, RBAC roles (Admin, Manager, Cashier, Clerk), and cashier PINs.</p>
          </div>
        </Link>

        <Link href="/orders" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🧾 Orders & Payment Lifecycle →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>View multi-channel sales, split-tenders, KHQR payments, and process customer refunds with restock.</p>
          </div>
        </Link>

        <Link href="/reports" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📈 Financial Intelligence & Analytics →</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Revenue trends, profit margins, product velocity rankings, shift audits, and CSV accounting exports.</p>
          </div>
        </Link>
      </div>
    </div>


  );
}
