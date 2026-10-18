import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PosDB extends DBSchema {
  catalog: {
    key: string;
    value: any;
  };
  customers: {
    key: string;
    value: any;
  };
  offline_sales: {
    key: string; // idempotencyKey
    value: {
      idempotencyKey: string;
      payload: any;
      createdAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PosDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PosDB>('somnob-pos-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('catalog')) {
          db.createObjectStore('catalog', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_sales')) {
          db.createObjectStore('offline_sales', { keyPath: 'idempotencyKey' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveCatalogCache(products: any[]) {
  const db = await getDb();
  const tx = db.transaction('catalog', 'readwrite');
  await tx.objectStore('catalog').clear();
  for (const p of products) {
    await tx.objectStore('catalog').put(p);
  }
  await tx.done;
}

export async function getCachedCatalog() {
  const db = await getDb();
  return db.getAll('catalog');
}

export async function saveCustomersCache(customers: any[]) {
  const db = await getDb();
  const tx = db.transaction('customers', 'readwrite');
  await tx.objectStore('customers').clear();
  for (const c of customers) {
    await tx.objectStore('customers').put(c);
  }
  await tx.done;
}

export async function getCachedCustomers() {
  const db = await getDb();
  return db.getAll('customers');
}

export async function enqueueOfflineSale(payload: any) {
  const db = await getDb();
  await db.put('offline_sales', {
    idempotencyKey: payload.idempotencyKey,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingOfflineSales() {
  const db = await getDb();
  return db.getAll('offline_sales');
}

export async function removeOfflineSale(idempotencyKey: string) {
  const db = await getDb();
  await db.delete('offline_sales', idempotencyKey);
}
