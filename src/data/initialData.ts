import { Product, Category, Customer, Order, Invoice, Employee, Supplier, Offer, Coupon, CurrencyRate, AppSettings, TargetCountry, Subscription, AbandonedCart } from '../types';
import { APP_CONFIG } from '../config/appConfig';

export const initialCategories: Category[] = [];

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialOrders: Order[] = [];

export const initialInvoices: Invoice[] = [];

export const initialEmployees: Employee[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialOffers: Offer[] = [];

export const initialCoupons: Coupon[] = [];

export const initialCurrencies: CurrencyRate[] = [
  { currencyCode: 'SAR', currencyName: 'ريال سعودي', exchangeRate: 1.0, symbol: 'ر.س' },
  { currencyCode: 'YER', currencyName: 'ريال يمني', exchangeRate: 142.5, symbol: 'ر.ي' },
  { currencyCode: 'USD', currencyName: 'دولار أمريكي', exchangeRate: 0.266, symbol: '$' }
];

export const defaultSettings: AppSettings = {
  spreadsheetId: APP_CONFIG.googleSheets.spreadsheetId,
  googleAppsScriptUrl: APP_CONFIG.googleSheets.googleAppsScriptUrl,
  defaultStoreUrl: APP_CONFIG.googleSheets.defaultStoreUrl,
  storeName: APP_CONFIG.store.name,
  storeTagline: APP_CONFIG.store.tagline,
  storeLogoUrl: APP_CONFIG.store.logoUrl,
  storePhone: APP_CONFIG.contact.phoneSaudi,
  storeWhatsApp: APP_CONFIG.contact.whatsapp,
  storePhoneSaudi: APP_CONFIG.contact.phoneSaudi,
  storePhoneYemen: APP_CONFIG.contact.phoneYemen,
  storeEmail: APP_CONFIG.store.email,
  storeAddress: APP_CONFIG.store.address,
  storeBranches: APP_CONFIG.policies.storeBranches,
  deliveryInfo: APP_CONFIG.policies.deliveryInfo,
  footerAbout: APP_CONFIG.policies.footerAbout,
  taxNumber: APP_CONFIG.store.taxNumber,
  commercialRegisterNumber: APP_CONFIG.store.commercialRegisterNumber,
  maroofNumber: APP_CONFIG.store.maroofNumber,
  saudiBusinessVerificationUrl: APP_CONFIG.store.saudiBusinessVerificationUrl,
  aboutUsText: APP_CONFIG.policies.aboutUsText,
  warrantyPolicyText: APP_CONFIG.policies.warrantyPolicyText,
  returnPolicyText: APP_CONFIG.policies.returnPolicyText,
  enableVat: false,
  vatPercentage: 15,
  defaultCurrency: APP_CONFIG.currency.defaultCurrency,
  targetCountry: APP_CONFIG.currency.targetCountry as TargetCountry,
  yerExchangeRate: APP_CONFIG.currency.yerExchangeRate,
  usdExchangeRate: APP_CONFIG.currency.usdExchangeRate,
  themePreset: APP_CONFIG.theme.preset,
  themePrimaryColor: APP_CONFIG.theme.primaryColor,
  themeSecondaryColor: APP_CONFIG.theme.secondaryColor,
  themeAccentColor: APP_CONFIG.theme.accentColor,
  themeBgColor: APP_CONFIG.theme.bgColor,
  themeTextColor: APP_CONFIG.theme.textColor,
  themeIconColor: APP_CONFIG.theme.iconColor,
  socialLinks: APP_CONFIG.socialLinks,
  adminPasswordHash: APP_CONFIG.admin.adminPasswordHash,
  orderNotificationSound: APP_CONFIG.admin.orderNotificationSound as any,
  orderMaxProcessingHours: APP_CONFIG.store.orderMaxProcessingHours,
  subscriptionPlanName: APP_CONFIG.subscription.planName,
  subscriptionExpiryDate: APP_CONFIG.subscription.expiryDate,
  planMaxProducts: APP_CONFIG.subscription.maxProducts,
  planMaxOrders: APP_CONFIG.subscription.maxOrders,
  planMaxEmployees: APP_CONFIG.subscription.maxEmployees,
  autoSyncOffline: APP_CONFIG.subscription.autoSyncOffline,
  isSheetConnected: false,
  appDownloadAndroid: APP_CONFIG.appDownload.androidUrl,
  appDownloadiOS: APP_CONFIG.appDownload.iosUrl,
  appDownloadHuawei: APP_CONFIG.appDownload.huaweiUrl,
  appDownloadDesktop: APP_CONFIG.appDownload.desktopUrl,
  appDownloadTitle: APP_CONFIG.appDownload.title,
  appDownloadDescription: APP_CONFIG.appDownload.description,
  showAppDownloadBanner: APP_CONFIG.appDownload.showAppDownloadBanner
};

export const initialSubscriptions: Subscription[] = [
  {
    SubscriptionID: 'SUB_101',
    subscriberName: 'متجر رَوْنَقْ للعبايات والأزياء',
    subscriptionType: 'متجر إلكتروني متكامل SaaS',
    planName: 'الباقة الماسية VIP (السنوية)',
    amount: 1499,
    billingCycle: 'سنوي',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    status: 'نشط',
    paymentMethod: 'تحويل بنكي / مدى',
    updatedAt: '2026-08-01'
  },
  {
    SubscriptionID: 'SUB_102',
    subscriberName: 'فرع الرياض - التوزيع السريع',
    subscriptionType: 'نظام الكاشير ونقاط البيع POS',
    planName: 'باقة الفروع الاحترافية Pro',
    amount: 450,
    billingCycle: 'شهري',
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    status: 'نشط',
    paymentMethod: 'بطاقة ائتمانية (Visa)',
    updatedAt: '2026-08-15'
  }
];

const nowTime = Date.now();
const h28Ago = new Date(nowTime - 28 * 60 * 60 * 1000).toISOString();
const h36Ago = new Date(nowTime - 36 * 60 * 60 * 1000).toISOString();
const h6Ago = new Date(nowTime - 6 * 60 * 60 * 1000).toISOString();

export const initialAbandonedCarts: AbandonedCart[] = [
  {
    id: 'CART_AB_101',
    customerName: 'فاطمة العتيبي',
    phone: '0551234567',
    city: 'الرياض',
    items: [
      {
        productID: 'PRD-101',
        productName: 'قلم باركر جيل فاخر ذهبي',
        price: 96,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800'
      }
    ],
    totalAmount: 192,
    createdAt: h28Ago,
    updatedAt: h28Ago,
    reminderSent: false
  },
  {
    id: 'CART_AB_102',
    customerName: 'عبدالرحمن الدوسري',
    phone: '0509876543',
    city: 'جدة',
    items: [
      {
        productID: 'PRD-102',
        productName: 'ساعة يد كلاسيك فضية',
        price: 170,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'
      }
    ],
    totalAmount: 170,
    createdAt: h36Ago,
    updatedAt: h36Ago,
    reminderSent: false
  },
  {
    id: 'CART_AB_103',
    customerName: 'سارة الشمري',
    phone: '0543210987',
    city: 'الدمام',
    items: [
      {
        productID: 'PRD-103',
        productName: 'عطر الفخامة الملكية 100مل',
        price: 135,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
      }
    ],
    totalAmount: 135,
    createdAt: h6Ago,
    updatedAt: h6Ago,
    reminderSent: false
  }
];

