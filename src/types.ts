export type ViewMode = 'store' | 'admin';

export type AdminTab = 
  | 'overview' 
  | 'products' 
  | 'excel' 
  | 'orders' 
  | 'invoices' 
  | 'customers' 
  | 'suppliers' 
  | 'employees' 
  | 'affiliates'
  | 'offers' 
  | 'coupons' 
  | 'sheets-sync' 
  | 'settings'
  | 'audit-log';

export interface Product {
  ProductID: string;
  name: string;
  SKU: string;
  Barcode: string;
  group?: string; // Group name e.g. "مجموعة الورد", "مجموعة الساعات"
  category: string;
  costPrice: number;
  salePrice: number;
  originalPrice?: number; // Pre-discount regular price (e.g. was 70 SAR, now 40 SAR)
  wholesalePrice: number;
  discount: number; // percentage or fixed
  quantity: number;
  minStock: number;
  images: string[]; // array of image URLs
  description: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  isVisible?: boolean; // Visibility toggle (1 or 0 in Google Sheets)
  sortOrder?: number;
  createdAt: string;
  updatedAt?: string;
  size?: string[];
  color?: string[];
  ratings?: number[];
  rating?: number;
  ratingCount?: number;
}

export interface Category {
  CategoryID: string;
  name: string;
  group?: string; // Group name e.g. "مجموعة الورد", "مجموعة الساعات"
  image?: string;
  description: string;
  isVisible?: boolean; // Visibility toggle (1 or 0 in Google Sheets)
  sortOrder?: number; // ترتيب القسم يدوياً بالقائمة
}

export interface CategoryGroup {
  name: string;
  image?: string;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface Customer {
  CustomerID: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  taxNumber: string;
  balance: number;
  loyaltyPoints: number;
  createdAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export interface OrderItem {
  productID: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

export interface SocialLinks {
  whatsapp?: string;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
  telegram?: string;
  snapchat?: string;
  twitter?: string;
}

export type TargetCountry = 'SA' | 'YE' | 'BOTH';

export interface AbandonedCart {
  id: string;
  customerName: string;
  phone: string;
  city?: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
}

export interface Order {
  OrderID: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  country?: 'SA' | 'YE';
  city?: string;
  address?: string;
  orderType?: 'local' | 'shipping';
  items: OrderItem[];
  totalQuantity: number;
  tax: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  currencyCode?: string;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'cod';
  paymentMethod: string;
  employeeName: string;
  date: string;
  trackingNumber?: string;
  shippingCompany?: string;
  referralCode?: string;
  referralCommission?: number;
  syncedToSheets?: boolean;
  pricesFinished?: boolean;
}

export interface Invoice {
  InvoiceID: string;
  invoiceNumber: string;
  customerName: string;
  taxNumber: string;
  itemsSummary: string;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  qrCodeUrl: string;
  pdfUrl?: string;
  employeeName: string;
  date: string;
  orderType?: 'local' | 'shipping';
  city?: string;
}

export interface Employee {
  EmployeeID: string;
  name: string;
  username: string;
  passwordHash: string;
  role: 'SuperAdmin' | 'Admin' | 'Manager' | 'Supplier' | 'Cashier' | 'StockKeeper';
  permissions: string[];
  lastLogin: string;
}

export interface Supplier {
  SupplierID: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
}

export interface InventoryMovement {
  ProductID: string;
  productName: string;
  inwardQuantity: number;
  outwardQuantity: number;
  currentBalance: number;
  lastUpdated: string;
}

export interface Offer {
  OfferID: string;
  title: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
}

export interface Coupon {
  CouponCode: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  minOrderAmount: number;
  expiryDate: string;
  usageCount: number;
}

export interface CurrencyRate {
  currencyCode: string;
  currencyName: string;
  exchangeRate: number; // relative to base SAR
  symbol: string;
}

export interface AuditLog {
  AuditID: string;
  employeeName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppSettings {
  spreadsheetId: string;
  googleAppsScriptUrl: string;
  storeName: string;
  storeTagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  storeLogoUrl?: string;
  storePhone: string;
  storeWhatsApp?: string;
  storePhoneSaudi?: string;
  storePhoneYemen?: string;
  storeEmail?: string;
  storeAddress: string;
  storeBranches?: string;
  deliveryInfo?: string;
  footerAbout?: string;
  taxNumber: string;
  commercialRegisterNumber?: string;
  maroofNumber?: string;
  saudiBusinessVerificationUrl?: string;
  aboutUsText?: string;
  warrantyPolicyText?: string;
  returnPolicyText?: string;
  enableVat?: boolean;
  vatPercentage: number;
  defaultCurrency: string;
  targetCountry: TargetCountry;
  yerExchangeRate: number; // e.g. 1 SAR = 535 YER
  usdExchangeRate: number; // e.g. 1 USD = 3.75 SAR
  socialLinks: SocialLinks;
  defaultStoreUrl?: string;
  themePreset?: string;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  themeAccentColor?: string;
  themeBgColor?: string;
  themeTextColor?: string;
  themeIconColor?: string;
  themeMode?: 'dark' | 'light';
  adminPasswordHash?: string;
  // Audio Notifications & Order Processing SLA
  orderNotificationSound?: 'none' | 'chime' | 'cash_register' | 'bell' | 'pulse';
  orderMaxProcessingHours?: number; // Target processing SLA in hours (e.g. 2 hours)

  // Subscription & Plan Limits
  subscriptionPlanName?: string;
  subscriptionExpiryDate?: string; // YYYY-MM-DD
  planMaxProducts?: number; // 0 = unlimited
  planMaxOrders?: number; // 0 = unlimited 
  planMaxEmployees?: number; // 0 = unlimited

  // Main Store Control Sheet (mainmtger - التحكم والاشتراكات)
  controlSpreadsheetUrl?: string; // رابط شيت التحكم والاشتراكات الرئيسي
  controlStoreNumber?: string; // رقم المتجر للتطابق في شيت التحكم
  controlStoreStatus?: 'فعال' | 'غير فعال' | string; // حالة المتجر
  controlNearExpiryNotice?: string; // ملاحظة اقتراب انتهاء الاشتراك
  controlExpiredNotice?: string; // ملاحظة انتهاء الباقة
  controlNoticeTitle?: string; // عنوان الملاحظة
  controlLastSyncedAt?: string;

  autoSyncOffline: boolean;
  isSheetConnected: boolean;
  // App Download Links & Settings (Synced with Google Sheets)
  appDownloadAndroid?: string;
  appDownloadiOS?: string;
  appDownloadHuawei?: string;
  appDownloadDesktop?: string;
  appDownloadTitle?: string;
  appDownloadDescription?: string;
  showAppDownloadBanner?: boolean;
  minWithdrawalAmount?: number;
  referralBonusAmount?: number;
  
  // Banners
  banner1_image?: string;
  banner1_title?: string;
  banner1_link?: string;
  banner2_image?: string;
  banner2_title?: string;
  banner2_link?: string;
  banner3_image?: string;
  banner3_title?: string;
  banner3_link?: string;
}

export interface ReferralPartner {
  id: string;
  name: string;
  phone: string;
  code: string;
  totalClicks: number;
  registeredCount: number;
  ordersCount: number;
  totalEarnings: number;
  paidEarnings: number;
  availableBalance: number;
  withdrawalStatus: 'none' | 'requested' | 'paid';
  bankDetails?: string;
  createdAt: string;
  lastActive: string;
}

export interface Subscription {
  SubscriptionID: string;
  subscriberName: string;
  subscriptionType: string; // نوع الاشتراك e.g. متجر إلكتروني، نظام محاسبة
  planName: string; // خطة الاشتراك e.g. باقة Pro، باقة كبار التجار
  amount: number; // المبلغ
  billingCycle: string; // دورية السداد e.g. شهري، سنوي، سنوي بخصم
  startDate: string; // تاريخ البدء
  endDate: string; // تاريخ الانتهاء
  status: string; // حالة الاشتراك e.g. نشط، منتهي، معلق
  paymentMethod: string; // طريقة الدفع e.g. تحويل بنكي، مدى، فيزا
  updatedAt?: string;
}

