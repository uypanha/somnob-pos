'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'CASHIER' | 'STOCK_CLERK';
  hasPin: boolean;
  assignedBranch: string;
  isActive: boolean;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'user-1',
    fullName: 'Panha Uong',
    email: 'admin@somnob.com',
    role: 'SUPER_ADMIN',
    hasPin: false,
    assignedBranch: 'All Stores (Global)',
    isActive: true,
  },
  {
    id: 'user-2',
    fullName: 'Dara Sok',
    email: 'manager@somnob.com',
    role: 'BRANCH_MANAGER',
    hasPin: false,
    assignedBranch: 'BKK1 Flagship Store',
    isActive: true,
  },
  {
    id: 'user-3',
    fullName: 'Sophea Chan',
    email: 'cashier@somnob.com',
    role: 'CASHIER',
    hasPin: true, // Configured PIN 1234
    assignedBranch: 'BKK1 Flagship Store',
    isActive: true,
  },
  {
    id: 'user-4',
    fullName: 'Vireak Men',
    email: 'clerk@somnob.com',
    role: 'STOCK_CLERK',
    hasPin: true, // Configured PIN 5678
    assignedBranch: 'BKK1 Flagship Store',
    isActive: true,
  },
];

export default function AdminEmployeesPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [showModal, setShowModal] = useState(false);

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BRANCH_MANAGER' | 'CASHIER' | 'STOCK_CLERK'>('CASHIER');
  const [pinCode, setPinCode] = useState('');
  const [branch, setBranch] = useState('BKK1 Flagship Store');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    const newMember: StaffMember = {
      id: `user-${Date.now()}`,
      fullName,
      email,
      role,
      hasPin: Boolean(pinCode),
      assignedBranch: branch,
      isActive: true,
    };

    setStaff([...staff, newMember]);
    setShowModal(false);
    // Reset
    setFullName('');
    setEmail('');
    setPassword('');
    setPinCode('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>👥 Employee & Staff Management</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Manage employee access, role permissions, branch assignments, and cashier POS PIN codes.
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
          + Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Employee Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Email / Username</th>
              <th style={{ padding: '0.85rem 1rem' }}>Role</th>
              <th style={{ padding: '0.85rem 1rem' }}>POS PIN Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Assigned Branch</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#1e293b' }}>
                  {s.fullName}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                  {s.email}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background:
                        s.role === 'SUPER_ADMIN'
                          ? '#f3e8ff'
                          : s.role === 'BRANCH_MANAGER'
                          ? '#e0f2fe'
                          : '#fef3c7',
                      color:
                        s.role === 'SUPER_ADMIN'
                          ? '#7e22ce'
                          : s.role === 'BRANCH_MANAGER'
                          ? '#0369a1'
                          : '#b45309',
                    }}
                  >
                    {s.role}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {s.hasPin ? (
                    <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '600' }}>
                      🔑 PIN Configured
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No PIN (Password only)</span>
                  )}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#1e293b', fontWeight: '500' }}>
                  {s.assignedBranch}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', width: '500px', maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>Add Staff Member</h2>

            <form onSubmit={handleAddEmployee}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sok Pisey"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. pisey@somnob.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Cashier PIN (4-6 digits)</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Role *</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="STOCK_CLERK">Stock Clerk</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Assigned Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="BKK1 Flagship Store">BKK1 Flagship Store</option>
                    <option value="Toul Kork Branch">Toul Kork Branch</option>
                  </select>
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
