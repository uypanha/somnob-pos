'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  generateKhqrPayload,
  PricingTier,
  PaymentMethod,
  OrderStatus,
  OrderType,
} from '@somnob/shared';
import {
  Search,
  Filter,
  DollarSign,
  QrCode,
  CreditCard,
  RotateCcw,
  CheckCircle,
  Clock,
  Truck,
  Store,
  ChevronLeft,
  X,
  Package,
} from 'lucide-react';

interface OrderRecord {
  id: string;
  orderNumber: string;
  storeName: string;
  orderType: OrderType;
  pricingTier: PricingTier;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotalUsd: number;
  taxUsd: number;
  deliveryFee: number;
  totalUsd: number;
  totalKhr: number;
  exchangeRate: number;
  status: OrderStatus;
  createdAt: string;
  payments: Array<{
    method: PaymentMethod;
    amountUsd: number;
    transactionRef?: string | null;
    status: string;
  }>;
  items: Array<{
    name: string;
    variant: string;
    sku: string;
    quantity: number;
    unitPriceUsd: number;
    subtotalUsd: number;
  }>;
}

export default function OrdersPage() {
  const [exchangeRate] = useState<number>(4100);

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([
    {
      id: 'ord-1',
      orderNumber: 'POS-20261018-0012',
      storeName: 'BKK1 Flagship Store',
      orderType: OrderType.IN_STORE,
      pricingTier: PricingTier.RETAIL,
      customerName: 'Walk-in Retail',
      customerPhone: null,
      subtotalUsd: 12.5,
      taxUsd: 0,
      deliveryFee: 0,
      totalUsd: 12.5,
      totalKhr: 51250,
      exchangeRate: 4100,
      status: OrderStatus.COMPLETED,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      payments: [
        {
          method: PaymentMethod.CASH,
          amountUsd: 12.5,
          transactionRef: null,
          status: 'COMPLETED',
        },
      ],
      items: [
        {
          name: 'Coca-Cola',
          variant: '330ml Can',
          sku: 'COKE-330',
          quantity: 10,
          unitPriceUsd: 0.85,
          subtotalUsd: 8.5,
        },
        {
          name: 'Angkor Beer',
          variant: '330ml Can',
          sku: 'ANGKOR-330',
          quantity: 4,
          unitPriceUsd: 1.0,
          subtotalUsd: 4.0,
        },
      ],
    },
    {
      id: 'ord-2',
      orderNumber: 'POS-20261018-0011',
      storeName: 'BKK1 Flagship Store',
      orderType: OrderType.IN_STORE,
      pricingTier: PricingTier.WHOLESALE,
      customerName: 'Vannak Mart BKK1',
      customerPhone: '+855 12 345 678',
      subtotalUsd: 39.6,
      taxUsd: 0,
      deliveryFee: 0,
      totalUsd: 39.6,
      totalKhr: 162360,
      exchangeRate: 4100,
      status: OrderStatus.COMPLETED,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      payments: [
        {
          method: PaymentMethod.CASH,
          amountUsd: 20.0,
          transactionRef: null,
          status: 'COMPLETED',
        },
        {
          method: PaymentMethod.KHQR,
          amountUsd: 19.6,
          transactionRef: 'BAKONG-TX-88229',
          status: 'COMPLETED',
        },
      ],
      items: [
        {
          name: 'Coca-Cola',
          variant: '330ml Can',
          sku: 'COKE-330',
          quantity: 24,
          unitPriceUsd: 0.7,
          subtotalUsd: 16.8,
        },
        {
          name: 'Angkor Beer',
          variant: '330ml Can',
          sku: 'ANGKOR-330',
          quantity: 24,
          unitPriceUsd: 0.95,
          subtotalUsd: 22.8,
        },
      ],
    },
    {
      id: 'ord-3',
      orderNumber: 'WEB-20261018-0003',
      storeName: 'BKK1 Flagship Store',
      orderType: OrderType.DELIVERY,
      pricingTier: PricingTier.RETAIL,
      customerName: 'Sokha Meng',
      customerPhone: '+855 77 112 233',
      subtotalUsd: 8.85,
      taxUsd: 0,
      deliveryFee: 1.5,
      totalUsd: 10.35,
      totalKhr: 42435,
      exchangeRate: 4100,
      status: OrderStatus.PREPARING,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      payments: [
        {
          method: PaymentMethod.CASH,
          amountUsd: 10.35,
          transactionRef: null,
          status: 'PENDING',
        },
      ],
      items: [
        {
          name: "Lay's Classic Potato Chips",
          variant: '50g Pack',
          sku: 'LAYS-50',
          quantity: 3,
          unitPriceUsd: 1.25,
          subtotalUsd: 3.75,
        },
        {
          name: 'Coca-Cola',
          variant: '330ml Can',
          sku: 'COKE-330',
          quantity: 6,
          unitPriceUsd: 0.85,
          subtotalUsd: 5.1,
        },
      ],
    },
  ]);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Refund Dialog
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>('Customer returned goods');
  const [restockInventory, setRestockInventory] = useState<boolean>(true);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  // Dynamic KHQR Dialog
  const [khqrPayload, setKhqrPayload] = useState<string | null>(null);

  const handleOpenRefund = (order: OrderRecord) => {
    setSelectedOrder(order);
    setShowRefundModal(true);
  };

  const handleConfirmRefund = () => {
    if (!selectedOrder) return;
    setIsRefunding(true);

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === selectedOrder.id) {
            return {
              ...ord,
              status: OrderStatus.CANCELLED,
              payments: ord.payments.map((p) => ({ ...p, status: 'REFUNDED' })),
            };
          }
          return ord;
        }),
      );

      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          status: OrderStatus.CANCELLED,
          payments: selectedOrder.payments.map((p) => ({ ...p, status: 'REFUNDED' })),
        });
      }

      setIsRefunding(false);
      setShowRefundModal(false);
      alert(
        `Order ${selectedOrder.orderNumber} successfully refunded! $${selectedOrder.totalUsd.toFixed(2)} refunded. Inventory restocked: ${restockInventory ? 'Yes' : 'No'}.`,
      );
    }, 600);
  };

  const handleShowKhqr = (order: OrderRecord) => {
    const payload = generateKhqrPayload({
      bakongAccountId: 'somnob_retail@aclb',
      merchantName: 'Somnob Retail Group',
      merchantCity: 'Phnom Penh',
      currency: 'USD',
      amount: order.totalUsd,
      orderNumber: order.orderNumber,
      storeCode: 'STR-001',
    });
    setKhqrPayload(payload);
  };

  const filteredOrders = orders.filter((o) => {
    const matchType = selectedType === 'all' || o.orderType === selectedType;
    const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const matchSearch =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

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
            Order Management & Payment Lifecycle
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Multi-channel sales transactions, split-tenders, KHQR payments, and returns with inventory restock.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div
            style={{
              background: '#f1f5f9',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              border: '1px solid #cbd5e1',
            }}
          >
            Live Rate: <strong>$1 = {exchangeRate.toLocaleString()}៛</strong>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.6rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Channel Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            outline: 'none',
          }}
        >
          <option value="all">All Channels</option>
          <option value={OrderType.IN_STORE}>In-Store POS</option>
          <option value={OrderType.DELIVERY}>Web Delivery</option>
          <option value={OrderType.PICKUP}>Web Pickup</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            outline: 'none',
          }}
        >
          <option value="all">All Statuses</option>
          <option value={OrderStatus.COMPLETED}>Completed</option>
          <option value={OrderStatus.PREPARING}>Preparing</option>
          <option value={OrderStatus.PENDING}>Pending</option>
          <option value={OrderStatus.CANCELLED}>Refunded / Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
            <tr>
              <th style={{ padding: '0.85rem 1rem' }}>Order Number</th>
              <th style={{ padding: '0.85rem 1rem' }}>Channel</th>
              <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
              <th style={{ padding: '0.85rem 1rem' }}>Payment Method</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total (USD / KHR)</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const isRefunded = ord.status === OrderStatus.CANCELLED;
                const isCompleted = ord.status === OrderStatus.COMPLETED;

                return (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: '#0f172a' }}>{ord.orderNumber}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(ord.createdAt).toLocaleTimeString()} • {ord.storeName}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {ord.orderType === OrderType.IN_STORE ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 600 }}>
                          <Store size={14} /> POS Counter
                        </span>
                      ) : ord.orderType === OrderType.DELIVERY ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#0891b2', fontWeight: 600 }}>
                          <Truck size={14} /> Delivery
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#7c3aed', fontWeight: 600 }}>
                          <Package size={14} /> Pickup
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.customerName || 'Walk-in'}</div>
                      {ord.pricingTier === PricingTier.WHOLESALE && (
                        <span style={{ fontSize: '0.7rem', color: '#b45309', background: '#fef3c7', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          Wholesale
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {ord.payments.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: p.status === 'REFUNDED' ? '#dc2626' : '#334155',
                            }}
                          >
                            {p.method} (${p.amountUsd.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        ${ord.totalUsd.toFixed(2)}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ord.totalKhr.toLocaleString()}៛
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isRefunded ? '#fee2e2' : isCompleted ? '#dcfce7' : '#e0f2fe',
                          color: isRefunded ? '#991b1b' : isCompleted ? '#166534' : '#075985',
                        }}
                      >
                        {isRefunded ? 'REFUNDED' : ord.status}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleShowKhqr(ord)}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <QrCode size={13} />
                          <span>KHQR</span>
                        </button>

                        {isCompleted && (
                          <button
                            onClick={() => handleOpenRefund(ord)}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#b91c1c',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {selectedOrder && !showRefundModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                  {selectedOrder.orderNumber}
                </strong>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString()} • {selectedOrder.storeName}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>Purchased Items</h4>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <div>
                    <strong>{i.name}</strong> ({i.variant}) x {i.quantity}
                  </div>
                  <div>${i.subtotalUsd.toFixed(2)}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total:</span>
                <span style={{ color: '#2563eb' }}>
                  ${selectedOrder.totalUsd.toFixed(2)} ({selectedOrder.totalKhr.toLocaleString()}៛)
                </span>
              </div>
            </div>

            {/* Payments */}
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>Payments Breakdown</h4>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              {selectedOrder.payments.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span>
                    {p.method} {p.transactionRef ? `(${p.transactionRef})` : ''}
                  </span>
                  <strong style={{ color: p.status === 'REFUNDED' ? '#dc2626' : '#16a34a' }}>
                    ${p.amountUsd.toFixed(2)} [{p.status}]
                  </strong>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>

              {selectedOrder.status === OrderStatus.COMPLETED && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '6px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '450px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c' }}>Confirm Order Refund</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Refund order <strong>{selectedOrder.orderNumber}</strong> for amount <strong>${selectedOrder.totalUsd.toFixed(2)}</strong>.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>
                Reason for Refund:
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: '#1e293b',
                }}
              >
                <input
                  type="checkbox"
                  checked={restockInventory}
                  onChange={(e) => setRestockInventory(e.target.checked)}
                />
                <span>Automatically restock items into branch inventory ledger</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowRefundModal(false)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={isRefunding}
                onClick={handleConfirmRefund}
                style={{
                  flex: 2,
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isRefunding ? 'Processing...' : 'Confirm & Refund Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC KHQR MODAL */}
      {khqrPayload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '360px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setKhqrPayload(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'inline-block', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', marginBottom: '1rem' }}>
              <QrCode size={160} color="#0f172a" />
            </div>

            <h3 style={{ margin: '0 0 0.2rem 0', color: '#e11d48', fontSize: '1.1rem' }}>
              NBC Bakong KHQR
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Somnob Retail Group • Phnom Penh
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: '#475569',
                maxHeight: '80px',
                overflowY: 'auto',
                marginBottom: '1rem',
              }}
            >
              {khqrPayload}
            </div>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(khqrPayload);
                alert('KHQR payload copied to clipboard!');
              }}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Copy KHQR Payload String
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
