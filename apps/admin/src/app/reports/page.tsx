'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Download,
  Calendar,
  Filter,
  CreditCard,
  QrCode,
  Store,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<string>('7d');
  const [exchangeRate] = useState<number>(4100);

  // Financial Metrics State
  const financialSummary = {
    totalRevenueUsd: 1485.5,
    totalRevenueKhr: 6090550,
    totalCogsUsd: 712.0,
    grossProfitUsd: 773.5,
    grossMarginPercentage: 52.1,
    totalOrders: 64,
    avgOrderValueUsd: 23.21,
    cashDrawerVarianceUsd: -2.0, // slight variance
    cashDrawerVarianceKhr: 4100,
  };

  // Payment Breakdown
  const paymentBreakdown = [
    { method: 'CASH', name: 'Cash (USD & KHR)', count: 38, totalUsd: 812.5, share: 54.7 },
    { method: 'KHQR', name: 'NBC Bakong KHQR', count: 20, totalUsd: 510.0, share: 34.3 },
    { method: 'CARD', name: 'Card Terminal', count: 6, totalUsd: 163.0, share: 11.0 },
  ];

  // Best Selling Products
  const bestSellers = [
    {
      rank: 1,
      sku: 'COKE-330',
      name: 'Coca-Cola',
      variant: '330ml Can',
      unitsSold: 288,
      revenueUsd: 244.8,
      costUsd: 144.0,
      profitUsd: 100.8,
      marginPct: 41.2,
    },
    {
      rank: 2,
      sku: 'ANGKOR-330',
      name: 'Angkor Beer',
      variant: '330ml Can',
      unitsSold: 216,
      revenueUsd: 237.6,
      costUsd: 162.0,
      profitUsd: 75.6,
      marginPct: 31.8,
    },
    {
      rank: 3,
      sku: 'VITAL-500',
      name: 'Vital Mineral Water',
      variant: '500ml Bottle',
      unitsSold: 360,
      revenueUsd: 126.0,
      costUsd: 72.0,
      profitUsd: 54.0,
      marginPct: 42.9,
    },
    {
      rank: 4,
      sku: 'LAYS-50',
      name: "Lay's Classic Potato Chips",
      variant: '50g Pack',
      unitsSold: 94,
      revenueUsd: 117.5,
      costUsd: 75.2,
      profitUsd: 42.3,
      marginPct: 36.0,
    },
  ];

  // Daily Timeline Data
  const dailyTimeline = [
    { date: 'Oct 12', revenueUsd: 180.5, orders: 8 },
    { date: 'Oct 13', revenueUsd: 210.0, orders: 9 },
    { date: 'Oct 14', revenueUsd: 195.0, orders: 8 },
    { date: 'Oct 15', revenueUsd: 245.0, orders: 11 },
    { date: 'Oct 16', revenueUsd: 280.0, orders: 12 },
    { date: 'Oct 17', revenueUsd: 188.5, orders: 7 },
    { date: 'Oct 18', revenueUsd: 186.5, orders: 9 },
  ];

  // Shift Reconciliations
  const shiftAudits = [
    {
      id: 'shift-1',
      registerCode: 'REG-01',
      cashier: 'Sophea Chan',
      openedAt: '2026-10-18 08:00',
      closedAt: '2026-10-18 16:00',
      openingFloatUsd: 50.0,
      expectedCashUsd: 245.0,
      closingCashUsd: 243.0,
      varianceUsd: -2.0,
      status: 'CLOSED',
    },
    {
      id: 'shift-2',
      registerCode: 'REG-01',
      cashier: 'Vireak Men',
      openedAt: '2026-10-17 08:00',
      closedAt: '2026-10-17 16:00',
      openingFloatUsd: 50.0,
      expectedCashUsd: 310.0,
      closingCashUsd: 310.0,
      varianceUsd: 0.0,
      status: 'RECONCILED',
    },
  ];

  const handleExportCsv = (type: 'revenue' | 'products') => {
    let csvContent = '';
    if (type === 'products') {
      csvContent =
        'Rank,SKU,Product,Variant,Units Sold,Revenue USD,Profit USD,Margin %\n' +
        bestSellers
          .map(
            (b) =>
              `${b.rank},"${b.sku}","${b.name}","${b.variant}",${b.unitsSold},${b.revenueUsd.toFixed(2)},${b.profitUsd.toFixed(2)},${b.marginPct}%`,
          )
          .join('\n');
    } else {
      csvContent =
        'Date,Orders,Revenue USD,Revenue KHR\n' +
        dailyTimeline
          .map(
            (t) =>
              `"${t.date}",${t.orders},${t.revenueUsd.toFixed(2)},${Math.round(t.revenueUsd * exchangeRate)}`,
          )
          .join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `somnob-${type}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              marginBottom: '0.3rem',
            }}
          >
            <ChevronLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>
            Financial Intelligence & Reporting
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Multi-branch revenue analytics, profit margins, product velocity, and cash drawer reconciliations.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="all">All Store Branches</option>
            <option value="str-001">BKK1 Flagship Store</option>
            <option value="str-002">Toul Kork Branch</option>
          </select>

          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">This Month</option>
            <option value="year">All Time</option>
          </select>

          <button
            onClick={() => handleExportCsv('revenue')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* 1. TOP KPI METRICS ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Revenue */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>GROSS SALES REVENUE</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
            ${financialSummary.totalRevenueUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {financialSummary.totalRevenueKhr.toLocaleString()}៛ (Rate: 4,100៛)
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>GROSS PROFIT & MARGIN</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            ${financialSummary.grossProfitUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
            {financialSummary.grossMarginPercentage}% Gross Margin
          </div>
        </div>

        {/* Total Orders & AOV */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ORDERS & AVERAGE BASKET</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {financialSummary.totalOrders} Orders
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            AOV: ${financialSummary.avgOrderValueUsd.toFixed(2)} / order
          </div>
        </div>

        {/* Drawer Variance */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CASH DRAWER AUDIT</div>
          <div
            style={{
              fontSize: '1.7rem',
              fontWeight: 800,
              color: financialSummary.cashDrawerVarianceUsd < 0 ? '#ef4444' : '#059669',
              marginTop: '0.25rem',
            }}
          >
            {financialSummary.cashDrawerVarianceUsd < 0 ? '-$' : '+$'}
            {Math.abs(financialSummary.cashDrawerVarianceUsd).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Net Variance over {shiftAudits.length} closed shifts
          </div>
        </div>
      </div>

      {/* 2. REVENUE TIMELINE & PAYMENT BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Daily Sales Bar Chart */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
            Daily Revenue Trend (Last 7 Days)
          </h3>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '160px', paddingTop: '1rem' }}>
            {dailyTimeline.map((day, idx) => {
              const maxRev = 300;
              const barHeightPct = Math.round((day.revenueUsd / maxRev) * 100);

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                    ${Math.round(day.revenueUsd)}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${barHeightPct}%`,
                      background: '#3b82f6',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
            Payment Tender Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentBreakdown.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                    {item.method === 'CASH' ? (
                      <DollarSign size={15} color="#059669" />
                    ) : item.method === 'KHQR' ? (
                      <QrCode size={15} color="#e11d48" />
                    ) : (
                      <CreditCard size={15} color="#2563eb" />
                    )}
                    <span>{item.name}</span>
                  </div>
                  <strong>${item.totalUsd.toFixed(2)} ({item.share}%)</strong>
                </div>

                <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.share}%`,
                      background: item.method === 'CASH' ? '#10b981' : item.method === 'KHQR' ? '#f43f5e' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PRODUCT VELOCITY & BEST SELLERS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
              Product Velocity & Sales Margin Leaderboard
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Highest velocity inventory items ranked by sales volume and profitability.
            </span>
          </div>

          <button
            onClick={() => handleExportCsv('products')}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Export Products CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <tr>
                <th style={{ padding: '0.75rem' }}>Rank</th>
                <th style={{ padding: '0.75rem' }}>SKU</th>
                <th style={{ padding: '0.75rem' }}>Product Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Units Sold</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Revenue (USD)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Gross Profit</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((item) => (
                <tr key={item.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#2563eb' }}>#{item.rank}</td>
                  <td style={{ padding: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                    {item.name} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>({item.variant})</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>{item.unitsSold}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    ${item.revenueUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                    ${item.profitUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.marginPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. REGISTER SHIFTS AUDIT TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
          Cash Register Shifts & Z-Report Reconciliation Audit
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
          Track cashier shifts, opening floats, expected cash drawers, and physical reconciliation variances.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <tr>
                <th style={{ padding: '0.75rem' }}>Register</th>
                <th style={{ padding: '0.75rem' }}>Cashier</th>
                <th style={{ padding: '0.75rem' }}>Opening Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Opening Float</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Expected Cash</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Counted Cash</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Over / Short</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftAudits.map((shift) => {
                const hasVariance = shift.varianceUsd !== 0;

                return (
                  <tr key={shift.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{shift.registerCode}</td>
                    <td style={{ padding: '0.75rem' }}>{shift.cashier}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{shift.openedAt}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${shift.openingFloatUsd.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${shift.expectedCashUsd.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>${shift.closingCashUsd.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: shift.varianceUsd < 0 ? '#dc2626' : shift.varianceUsd > 0 ? '#2563eb' : '#059669',
                        }}
                      >
                        {shift.varianceUsd === 0 ? '$0.00 (Exact)' : `${shift.varianceUsd < 0 ? '-$' : '+$'}${Math.abs(shift.varianceUsd).toFixed(2)}`}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
