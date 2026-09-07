import { Product, Category, Customer, Order, Invoice, Employee, Supplier, Offer, Coupon, CurrencyRate, AppSettings, AuditLog, ReferralPartner, Subscription, AbandonedCart } from '../types';
import { initialProducts, initialCategories, initialCustomers, initialOrders, initialInvoices, initialEmployees, initialSuppliers, initialOffers, initialCoupons, initialCurrencies, defaultSettings, initialSubscriptions, initialAbandonedCarts } from '../data/initialData';

const KEYS = {
  PRODUCTS: 'shein_products_v1',
  CATEGORIES: 'shein_categories_v1',
  CUSTOMERS: 'shein_customers_v1',
  ORDERS: 'shein_orders_v1',
  INVOICES: 'shein_invoices_v1',
  EMPLOYEES: 'shein_employees_v1',
  SUPPLIERS: 'shein_suppliers_v1',
  OFFERS: 'shein_offers_v1',
  COUPONS: 'shein_coupons_v1',
  CURRENCIES: 'shein_currencies_v1',
  SETTINGS: 'shein_settings_v1',
  AUDIT_LOGS: 'shein_audit_logs_v1',
  PENDING_SYNC: 'shein_pending_sync_v1',
  AUTO_BACKUP: 'rwnaq_daily_auto_backup_v1',
  AUTO_BACKUP_DATE: 'rwnaq_last_auto_backup_date',
  REFERRAL_PARTNERS: 'rwnaq_referral_partners_v1',
  SUBSCRIPTIONS: 'shein_subscriptions_v1',
  ABANDONED_CARTS: 'shein_abandoned_carts_v1'
};

export interface PendingMutation {
  id: string;
  type: 'ADD_ORDER' | 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'ADD_CUSTOMER' | 'UPDATE_INVENTORY';
  payload: any;
  timestamp: string;
}

import { compressAndResizeImage } from './imageUtils';

// Helper function to convert a File object to Base64 string (compressed and resized)
export const convertFileToBase64 = (file: File): Promise<string> => {
  return compressAndResizeImage(file, 800, 0.7);
};

// Process product images list to convert any local File objects or Blobs to Base64 Data URLs
export const processProductImagesToBase64 = async (images: (string | File)[]): Promise<string[]> => {
  const processed: string[] = [];
  for (const item of images) {
    if (typeof item === 'string') {
      processed.push(item);
    } else if (item && item instanceof File) {
      try {
        const base64 = await convertFileToBase64(item);
        processed.push(base64);
      } catch (err) {
        console.error('Failed to convert file image to Base64', err);
      }
    }
  }
  return processed;
};

// Load initial state or read from localStorage
export const loadLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return defaultValue;
  }
};

export const saveLocalData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage key', key, e);
  }
};

export const sanitizeAndDeduplicateProducts = (products: Product[]): Product[] => {
  if (!Array.isArray(products)) return [];
  const seenIds = new Set<string>();
  const sanitized: Product[] = [];

  products.forEach((p, idx) => {
    if (!p) return;
    let prodId = String(p.ProductID || '').trim();
    let sku = String(p.SKU || '').trim();

    // If no ID or already seen ID, generate a guaranteed unique ID
    if (!prodId || seenIds.has(prodId)) {
      prodId = `PRD_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(prodId);

    if (!sku) {
      sku = `SKU-${Date.now()}-${idx}`;
    }

    sanitized.push({
      ...p,
      ProductID: prodId,
      SKU: sku
    });
  });

  return sanitized;
};

export const getLocalProducts = (): Product[] => {
  const data = loadLocalData(KEYS.PRODUCTS, initialProducts);
  if (!Array.isArray(data) || data.length === 0) {
    return sanitizeAndDeduplicateProducts(initialProducts);
  }
  return sanitizeAndDeduplicateProducts(data);
};

export const saveLocalProducts = (products: Product[]) => {
  const sanitized = sanitizeAndDeduplicateProducts(products);
  saveLocalData(KEYS.PRODUCTS, sanitized);
};

export const sanitizeAndDeduplicateCategories = (categories: Category[]): Category[] => {
  if (!Array.isArray(categories)) return [];
  const seenIds = new Set<string>();
  const sanitized: Category[] = [];

  categories.forEach((c, idx) => {
    if (!c) return;
    let catId = String(c.CategoryID || '').trim();

    if (!catId || seenIds.has(catId)) {
      catId = `CAT_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(catId);

    sanitized.push({
      ...c,
      CategoryID: catId,
      name: String(c.name || '').trim()
    });
  });

  return sanitized;
};

export const getLocalCategories = (): Category[] => {
  const data = loadLocalData(KEYS.CATEGORIES, initialCategories);
  return sanitizeAndDeduplicateCategories(data);
};

export const saveLocalCategories = (categories: Category[]) => {
  const sanitized = sanitizeAndDeduplicateCategories(categories);
  saveLocalData(KEYS.CATEGORIES, sanitized);
};

export const getLocalSubscriptions = (): Subscription[] => loadLocalData(KEYS.SUBSCRIPTIONS, initialSubscriptions);
export const saveLocalSubscriptions = (subs: Subscription[]) => saveLocalData(KEYS.SUBSCRIPTIONS, subs);

export const getLocalCustomers = (): Customer[] => loadLocalData(KEYS.CUSTOMERS, initialCustomers);
export const saveLocalCustomers = (customers: Customer[]) => saveLocalData(KEYS.CUSTOMERS, customers);

export const getLocalOrders = (): Order[] => loadLocalData(KEYS.ORDERS, initialOrders);
export const saveLocalOrders = (orders: Order[]) => saveLocalData(KEYS.ORDERS, orders);

export const getLocalInvoices = (): Invoice[] => loadLocalData(KEYS.INVOICES, initialInvoices);
export const saveLocalInvoices = (invoices: Invoice[]) => saveLocalData(KEYS.INVOICES, invoices);

export const getLocalEmployees = (): Employee[] => loadLocalData(KEYS.EMPLOYEES, initialEmployees);
export const saveLocalEmployees = (employees: Employee[]) => saveLocalData(KEYS.EMPLOYEES, employees);

export const sanitizeAndDeduplicateSuppliers = (suppliers: Supplier[]): Supplier[] => {
  if (!Array.isArray(suppliers)) return [];
  const seenIds = new Set<string>();
  const sanitized: Supplier[] = [];

  suppliers.forEach((s, idx) => {
    if (!s) return;
    const name = String(s.name || '').trim();
    if (!name && !s.SupplierID) return;

    let supId = String(s.SupplierID || '').trim();
    if (!supId) {
      supId = `SUP_${idx + 101}`;
    }
    if (seenIds.has(supId)) {
      supId = `${supId}_${idx + 1}`;
    }
    seenIds.add(supId);

    sanitized.push({
      SupplierID: supId,
      name: name || `مورد ${idx + 1}`,
      phone: String(s.phone || '').trim(),
      email: String(s.email || '').trim(),
      balance: Number(s.balance) || 0
    });
  });

  return sanitized;
};

export const sanitizeAndDeduplicateOffers = (offers: Offer[]): Offer[] => {
  if (!Array.isArray(offers)) return [];
  const seenIds = new Set<string>();
  const sanitized: Offer[] = [];

  offers.forEach((o, idx) => {
    if (!o || !o.title || !o.title.trim()) return;
    let offId = String(o.OfferID || '').trim();
    if (!offId || seenIds.has(offId)) {
      offId = `OFF_${Date.now()}_${idx}`;
    }
    seenIds.add(offId);

    sanitized.push({
      OfferID: offId,
      title: o.title.trim(),
      discountPercentage: Number(o.discountPercentage) || 0,
      startDate: String(o.startDate || '2026-08-01').trim(),
      endDate: String(o.endDate || '2026-08-31').trim(),
      status: o.status === 'expired' ? 'expired' : 'active'
    });
  });

  return sanitized;
};

export const sanitizeAndDeduplicateCoupons = (coupons: Coupon[]): Coupon[] => {
  if (!Array.isArray(coupons)) return [];
  const seenCodes = new Set<string>();
  const sanitized: Coupon[] = [];

  coupons.forEach(c => {
    if (!c || !c.CouponCode || !c.CouponCode.trim()) return;
    const code = c.CouponCode.trim().toUpperCase();
    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    sanitized.push({
      CouponCode: code,
      discountValue: Number(c.discountValue) || 0,
      discountType: c.discountType === 'fixed' ? 'fixed' : 'percentage',
      minOrderAmount: Number(c.minOrderAmount) || 0,
      expiryDate: String(c.expiryDate || '2026-12-31').trim(),
      usageCount: Number(c.usageCount) || 0
    });
  });

  return sanitized;
};

export const getLocalSuppliers = (): Supplier[] => {
  const data = loadLocalData(KEYS.SUPPLIERS, initialSuppliers);
  return sanitizeAndDeduplicateSuppliers(data);
};
export const saveLocalSuppliers = (suppliers: Supplier[]) => {
  const sanitized = sanitizeAndDeduplicateSuppliers(suppliers);
  saveLocalData(KEYS.SUPPLIERS, sanitized);
};

export const getLocalOffers = (): Offer[] => {
  const data = loadLocalData(KEYS.OFFERS, initialOffers);
  return sanitizeAndDeduplicateOffers(data);
};
export const saveLocalOffers = (offers: Offer[]) => {
  const sanitized = sanitizeAndDeduplicateOffers(offers);
  saveLocalData(KEYS.OFFERS, sanitized);
};

export const getLocalCoupons = (): Coupon[] => {
  const data = loadLocalData(KEYS.COUPONS, initialCoupons);
  return sanitizeAndDeduplicateCoupons(data);
};
export const saveLocalCoupons = (coupons: Coupon[]) => {
  const sanitized = sanitizeAndDeduplicateCoupons(coupons);
  saveLocalData(KEYS.COUPONS, sanitized);
};

export const getLocalCurrencies = (): CurrencyRate[] => loadLocalData(KEYS.CURRENCIES, initialCurrencies);
export const saveLocalCurrencies = (currencies: CurrencyRate[]) => saveLocalData(KEYS.CURRENCIES, currencies);

export const getLocalAbandonedCarts = (): AbandonedCart[] => loadLocalData(KEYS.ABANDONED_CARTS, initialAbandonedCarts);
export const saveLocalAbandonedCarts = (carts: AbandonedCart[]) => saveLocalData(KEYS.ABANDONED_CARTS, carts);

export const getLocalSettings = (): AppSettings => {
  const loaded = loadLocalData(KEYS.SETTINGS, defaultSettings);
  let changed = false;

  const defaultUrl = 'https://script.google.com/macros/s/AKfycbxMrMXb7KyNuI0Ec-hhZ6a_WI5kWWga1yEUf6j9aYzqkx57793_BCHV9Fmqpw4uXuF77A/exec';

  if (!loaded.googleAppsScriptUrl || loaded.googleAppsScriptUrl.includes('AKfycbzRB1RB9WFHdOI') || loaded.googleAppsScriptUrl.includes('AKfycbwLj4LtLEpj6i') || loaded.googleAppsScriptUrl.includes('AKfycbzIoJEI')) {
    loaded.googleAppsScriptUrl = defaultUrl;
    changed = true;
  }
  if (!loaded.defaultStoreUrl || loaded.defaultStoreUrl.includes('AKfycbzRB1RB9WFHdOI') || loaded.defaultStoreUrl.includes('AKfycbwLj4LtLEpj6i')) {
    loaded.defaultStoreUrl = defaultUrl;
    changed = true;
  }
  if (!loaded.themePrimaryColor) {
    loaded.themePreset = defaultSettings.themePreset || 'shein_pink';
    loaded.themePrimaryColor = defaultSettings.themePrimaryColor || '#ec4899';
    loaded.themeSecondaryColor = defaultSettings.themeSecondaryColor || '#a855f7';
    loaded.themeAccentColor = defaultSettings.themeAccentColor || '#f43f5e';
    loaded.themeBgColor = defaultSettings.themeBgColor || '#090d16';
    changed = true;
  }

  if (changed) {
    saveLocalSettings(loaded);
  }
  return loaded;
};
export const saveLocalSettings = (settings: AppSettings) => saveLocalData(KEYS.SETTINGS, settings);

export const getLocalAuditLogs = (): AuditLog[] => loadLocalData(KEYS.AUDIT_LOGS, []);
export const saveLocalAuditLogs = (logs: AuditLog[]) => saveLocalData(KEYS.AUDIT_LOGS, logs);

export const clearLocalAuditLogs = (): void => {
  saveLocalAuditLogs([]);
};

export const addAuditLog = (employeeName: string, action: string, details: string) => {
  const logs = getLocalAuditLogs();
  const newLog: AuditLog = {
    AuditID: `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    employeeName,
    action,
    details,
    timestamp: new Date().toLocaleString('ar-SA')
  };
  saveLocalAuditLogs([newLog, ...logs.slice(0, 199)]);
};

// Pending Offline Sync Queue Management
export const getPendingSyncQueue = (): PendingMutation[] => loadLocalData(KEYS.PENDING_SYNC, []);
export const savePendingSyncQueue = (queue: PendingMutation[]) => saveLocalData(KEYS.PENDING_SYNC, queue);

export const addPendingMutation = (type: PendingMutation['type'], payload: any) => {
  const queue = getPendingSyncQueue();
  const mutation: PendingMutation = {
    id: `SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    type,
    payload,
    timestamp: new Date().toISOString()
  };
  savePendingSyncQueue([...queue, mutation]);
};

export const clearPendingMutation = (id: string) => {
  const queue = getPendingSyncQueue();
  savePendingSyncQueue(queue.filter(q => q.id !== id));
};

// ==========================================
// 1. Daily Auto-Backup System
// ==========================================
export interface FullSystemSnapshot {
  timestamp: string;
  dateKey: string;
  version: string;
  data: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    orders: Order[];
    invoices: Invoice[];
    employees: Employee[];
    suppliers: Supplier[];
    offers: Offer[];
    coupons: Coupon[];
    currencies: CurrencyRate[];
    settings: AppSettings;
  };
}

export const checkAndPerformDailyAutoBackup = (snapshotData: FullSystemSnapshot['data']): { backedUp: boolean; date: string } => {
  try {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastBackupDate = localStorage.getItem(KEYS.AUTO_BACKUP_DATE);

    if (lastBackupDate !== todayKey) {
      const backupPayload: FullSystemSnapshot = {
        timestamp: new Date().toISOString(),
        dateKey: todayKey,
        version: '2.0',
        data: snapshotData
      };
      localStorage.setItem(KEYS.AUTO_BACKUP, JSON.stringify(backupPayload));
      localStorage.setItem(KEYS.AUTO_BACKUP_DATE, todayKey);
      return { backedUp: true, date: todayKey };
    }
    return { backedUp: false, date: lastBackupDate || todayKey };
  } catch (e) {
    console.error('Failed to perform daily auto backup', e);
    return { backedUp: false, date: '' };
  }
};

export const createManualSnapshotNow = (snapshotData: FullSystemSnapshot['data']): FullSystemSnapshot => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const backupPayload: FullSystemSnapshot = {
    timestamp: new Date().toISOString(),
    dateKey: todayKey,
    version: '2.0',
    data: snapshotData
  };
  try {
    localStorage.setItem(KEYS.AUTO_BACKUP, JSON.stringify(backupPayload));
    localStorage.setItem(KEYS.AUTO_BACKUP_DATE, todayKey);
  } catch (e) {
    console.error('Error saving manual snapshot', e);
  }
  return backupPayload;
};

export const getDailyAutoBackupInfo = (): { exists: boolean; snapshot: FullSystemSnapshot | null; lastDate: string | null } => {
  try {
    const raw = localStorage.getItem(KEYS.AUTO_BACKUP);
    const lastDate = localStorage.getItem(KEYS.AUTO_BACKUP_DATE);
    if (raw) {
      const snapshot: FullSystemSnapshot = JSON.parse(raw);
      return { exists: true, snapshot, lastDate: snapshot.timestamp || lastDate };
    }
  } catch (e) {
    console.error('Error parsing daily auto backup', e);
  }
  return { exists: false, snapshot: null, lastDate: null };
};

// ==========================================
// 2. Real-time Referral & Affiliate Engine
// ==========================================
const DEFAULT_PARTNERS: ReferralPartner[] = [
  {
    id: 'REF_101',
    name: 'محمد العماري (VIP)',
    phone: '966599539659',
    code: 'mohammed_vip',
    totalClicks: 142,
    registeredCount: 38,
    ordersCount: 14,
    totalEarnings: 350,
    paidEarnings: 150,
    availableBalance: 200,
    withdrawalStatus: 'none',
    bankDetails: 'مصرف الراجحي - SA4580000123456789012345',
    createdAt: '2026-08-01',
    lastActive: '2026-08-18'
  },
  {
    id: 'REF_102',
    name: 'سارة القحطاني',
    phone: '0559876543',
    code: 'sara_style',
    totalClicks: 89,
    registeredCount: 22,
    ordersCount: 8,
    totalEarnings: 180,
    paidEarnings: 0,
    availableBalance: 180,
    withdrawalStatus: 'requested',
    bankDetails: 'بنك الأهلي السعودي - SA9210000098765432109876',
    createdAt: '2026-08-05',
    lastActive: '2026-08-17'
  }
];

export const getLocalReferralPartners = (): ReferralPartner[] => {
  return loadLocalData(KEYS.REFERRAL_PARTNERS, DEFAULT_PARTNERS);
};

export const saveLocalReferralPartners = (partners: ReferralPartner[]): void => {
  saveLocalData(KEYS.REFERRAL_PARTNERS, partners);
};

export const trackReferralClick = (code: string): void => {
  if (!code) return;
  const clean = code.trim().toLowerCase();
  const partners = getLocalReferralPartners();
  let partner = partners.find(p => p.code.toLowerCase() === clean);

  if (partner) {
    partner.totalClicks += 1;
    partner.lastActive = new Date().toISOString().slice(0, 10);
  } else {
    // Create new referral entry
    const newPartner: ReferralPartner = {
      id: `REF_${Date.now()}`,
      name: code.replace(/_/g, ' '),
      phone: '',
      code: clean,
      totalClicks: 1,
      registeredCount: 1,
      ordersCount: 0,
      totalEarnings: 0,
      paidEarnings: 0,
      availableBalance: 0,
      withdrawalStatus: 'none',
      createdAt: new Date().toISOString().slice(0, 10),
      lastActive: new Date().toISOString().slice(0, 10)
    };
    partners.push(newPartner);
  }
  saveLocalReferralPartners(partners);
};

export const recordReferralOrder = (code: string, orderTotalSAR: number, commissionSAR: number = 25): void => {
  if (!code) return;
  const clean = code.trim().toLowerCase();
  const partners = getLocalReferralPartners();
  const partner = partners.find(p => p.code.toLowerCase() === clean);

  if (partner) {
    partner.ordersCount += 1;
    partner.totalEarnings += commissionSAR;
    partner.availableBalance += commissionSAR;
    partner.lastActive = new Date().toISOString().slice(0, 10);
    saveLocalReferralPartners(partners);
  }
};

export const requestReferralWithdrawal = (code: string, bankDetails: string): boolean => {
  if (!code) return false;
  const clean = code.trim().toLowerCase();
  const partners = getLocalReferralPartners();
  const partner = partners.find(p => p.code.toLowerCase() === clean);

  if (partner && partner.availableBalance > 0) {
    partner.withdrawalStatus = 'requested';
    partner.bankDetails = bankDetails;
    saveLocalReferralPartners(partners);
    return true;
  }
  return false;
};

export const addReferralPartner = (partner: ReferralPartner): void => {
  const partners = getLocalReferralPartners();
  const existingIndex = partners.findIndex(p => p.id === partner.id || p.code.toLowerCase() === partner.code.toLowerCase());
  if (existingIndex >= 0) {
    partners[existingIndex] = partner;
  } else {
    partners.push(partner);
  }
  saveLocalReferralPartners(partners);
};

export const updateReferralPartner = (partner: ReferralPartner): void => {
  const partners = getLocalReferralPartners();
  const index = partners.findIndex(p => p.id === partner.id);
  if (index >= 0) {
    partners[index] = { ...partners[index], ...partner };
    saveLocalReferralPartners(partners);
  }
};

export const deleteReferralPartner = (id: string): void => {
  const partners = getLocalReferralPartners();
  const filtered = partners.filter(p => p.id !== id);
  saveLocalReferralPartners(filtered);
};

export const payoutReferralPartner = (idOrCode: string, payoutNote?: string): { success: boolean; amountPaid: number; partnerName: string } => {
  const partners = getLocalReferralPartners();
  const clean = idOrCode.trim().toLowerCase();
  const partner = partners.find(p => p.id.toLowerCase() === clean || p.code.toLowerCase() === clean);

  if (!partner) {
    return { success: false, amountPaid: 0, partnerName: '' };
  }

  const amount = partner.availableBalance;
  partner.paidEarnings = (partner.paidEarnings || 0) + amount;
  partner.availableBalance = 0;
  partner.withdrawalStatus = 'paid';
  if (payoutNote) {
    partner.bankDetails = partner.bankDetails ? `${partner.bankDetails} | ملاحظة الصرف: ${payoutNote}` : `ملاحظة الصرف: ${payoutNote}`;
  }
  partner.lastActive = new Date().toISOString().slice(0, 10);
  saveLocalReferralPartners(partners);

  return { success: true, amountPaid: amount, partnerName: partner.name };
};

