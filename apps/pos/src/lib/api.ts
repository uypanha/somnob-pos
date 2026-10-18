import {
  saveCatalogCache,
  getCachedCatalog,
  saveCustomersCache,
  getCachedCustomers,
  enqueueOfflineSale,
  getPendingOfflineSales,
  removeOfflineSale,
} from './db';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('pos_access_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('pos_access_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('pos_access_token');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Cashier PIN Login
  async posLogin(pin: string, storeId: string) {
    const data = await request('/auth/pos-login', {
      method: 'POST',
      body: JSON.stringify({ pin, storeId }),
    });
    setAuthToken(data.accessToken);
    return data;
  },

  // Shifts
  async getCurrentShift(registerId?: string) {
    try {
      const q = registerId ? `?registerId=${registerId}` : '';
      return await request(`/shifts/current${q}`);
    } catch {
      return null;
    }
  },

  async getRegisters(storeId: string) {
    return request(`/shifts/registers?storeId=${storeId}`);
  },

  async openShift(dto: { registerId: string; openingFloatUsd: number; openingFloatKhr: number; notes?: string }) {
    return request('/shifts/open', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async closeShift(shiftId: string, dto: { closingCashUsd: number; closingCashKhr: number; notes?: string }) {
    return request(`/shifts/${shiftId}/close`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getShiftReport(shiftId: string) {
    return request(`/shifts/${shiftId}/z-report`);
  },

  // Catalog with offline caching
  async getCatalog(storeId?: string) {
    try {
      const q = storeId ? `?storeId=${storeId}&limit=100` : '?limit=100';
      const res = await request(`/catalog/products${q}`);
      const products = res.data || [];
      await saveCatalogCache(products);
      return products;
    } catch (err) {
      console.warn('Network offline or error, falling back to cached catalog', err);
      const cached = await getCachedCatalog();
      if (cached.length > 0) return cached;
      throw err;
    }
  },

  async getCategories() {
    try {
      return await request('/catalog/categories');
    } catch {
      return [];
    }
  },

  // Customers with offline caching
  async getCustomers() {
    try {
      const customers = await request('/customers');
      await saveCustomersCache(customers);
      return customers;
    } catch (err) {
      console.warn('Network offline or error, falling back to cached customers', err);
      return await getCachedCustomers();
    }
  },

  // Checkout with Offline Resilience
  async checkout(payload: any, isOnline: boolean) {
    if (!isOnline) {
      await enqueueOfflineSale(payload);
      return {
        isOfflineQueued: true,
        orderNumber: `OFFLINE-${payload.idempotencyKey.slice(0, 8).toUpperCase()}`,
        totalUsd: payload.totalUsd,
        totalKhr: payload.totalKhr,
        createdAt: new Date().toISOString(),
        items: payload.items,
        paymentMethod: payload.payment.paymentMethod,
        tenderedUsd: payload.payment.tenderedUsd || 0,
        tenderedKhr: payload.payment.tenderedKhr || 0,
        changeUsd: payload.changeUsd || 0,
        changeKhr: payload.changeKhr || 0,
      };
    }

    try {
      return await request('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      // If network dropped right during checkout, queue offline
      if (err.message?.includes('Failed to fetch') || !navigator.onLine) {
        await enqueueOfflineSale(payload);
        return {
          isOfflineQueued: true,
          orderNumber: `OFFLINE-${payload.idempotencyKey.slice(0, 8).toUpperCase()}`,
          totalUsd: payload.totalUsd,
          totalKhr: payload.totalKhr,
          createdAt: new Date().toISOString(),
          items: payload.items,
          paymentMethod: payload.payment.paymentMethod,
          tenderedUsd: payload.payment.tenderedUsd || 0,
          tenderedKhr: payload.payment.tenderedKhr || 0,
          changeUsd: payload.changeUsd || 0,
          changeKhr: payload.changeKhr || 0,
        };
      }
      throw err;
    }
  },

  // Sync Offline Queue
  async syncOfflineSales() {
    const queue = await getPendingOfflineSales();
    if (queue.length === 0) return { total: 0, synced: 0, failed: 0 };

    const payloads = queue.map((q) => q.payload);
    const result = await request('/pos/sync', {
      method: 'POST',
      body: JSON.stringify(payloads),
    });

    for (const res of result.results || []) {
      if (res.success) {
        await removeOfflineSale(res.idempotencyKey);
      }
    }

    return result;
  },

  async getPendingCount() {
    const queue = await getPendingOfflineSales();
    return queue.length;
  },
};
