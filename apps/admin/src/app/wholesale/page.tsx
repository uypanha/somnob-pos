'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface WholesaleCustomer {
  id: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  appliedAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

const INITIAL_CUSTOMERS: WholesaleCustomer[] = [
  {
    id: 'cust-1',
    fullName: 'Sokheng Chea',
    businessName: 'Sokheng Mini-Mart BKK',
    phone: '+855 12 777 888',
    email: 'sokheng@minimart.com',
    appliedAt: '2026-10-18 10:20',
    status: 'PENDING_APPROVAL',
    notes: 'Grocery store owner buying 50+ cases weekly',
  },
  {
    id: 'cust-2',
    fullName: 'Dara Pich',
    businessName: 'Angkor Café & Bakery',
    phone: '+855 16 999 000',
    email: 'dara@angkorcafe.com',
    appliedAt: '2026-10-17 15:45',
    status: 'APPROVED',
    approvedAt: '2026-10-17 16:30',
    approvedBy: 'Panha Uong (Owner)',
    notes: 'Commercial coffee & beverage bulk buyer',
  },
];

export default function AdminWholesalePage() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>(INITIAL_CUSTOMERS);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');

  const pendingCount = customers.filter((c) => c.status === 'PENDING_APPROVAL').length;

  const handleDecision = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setCustomers(
      customers.map((c) =>
        c.id === id
          ? {
              ...c,
              status: decision,
              approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              approvedBy: 'Panha Uong (Owner)',
            }
          : c
      )
    );
  };

  const filteredCustomers = customers.filter((c) => {
    if (activeTab === 'PENDING') return c.status === 'PENDING_APPROVAL';
    if (activeTab === 'APPROVED') return c.status === 'APPROVED';
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>🤝 Wholesale Customer Approvals</h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Review wholesale club buyer applications and authorize bulk tier discount pricing.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'PENDING' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'PENDING' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Pending Review
          {pendingCount > 0 && (
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'APPROVED' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'APPROVED' ? '#059669' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Approved Wholesale Buyers
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ALL' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'ALL' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          All Customers ({customers.length})
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Applicant Name & Business</th>
              <th style={{ padding: '0.85rem 1rem' }}>Contact Info</th>
              <th style={{ padding: '0.85rem 1rem' }}>Application Notes</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Owner Decision</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>{c.businessName}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div>{c.phone}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.email}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                  <div>{c.notes}</div>
                  {c.approvedBy && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>
                      Approved by {c.approvedBy} on {c.approvedAt}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background:
                        c.status === 'APPROVED'
                          ? '#dcfce7'
                          : c.status === 'PENDING_APPROVAL'
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        c.status === 'APPROVED'
                          ? '#15803d'
                          : c.status === 'PENDING_APPROVAL'
                          ? '#b45309'
                          : '#b91c1c',
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  {c.status === 'PENDING_APPROVAL' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleDecision(c.id, 'APPROVED')}
                        style={{
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDecision(c.id, 'REJECTED')}
                        style={{
                          background: '#f1f5f9',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Decision finalized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No customer applications found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
