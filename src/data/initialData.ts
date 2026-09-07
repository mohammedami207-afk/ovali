import { Product, Category, Customer, Order, Invoice, Employee, Supplier, Offer, Coupon, CurrencyRate, AppSettings, TargetCountry, Subscription, AbandonedCart } from '../types';
import { APP_CONFIG } from '../config/appConfig';

export const initialCategories: Category[] = [
  {
    CategoryID: 'CAT_01',
    name: 'التخفيضات',
    group: 'مجموعة الورد',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80',
    description: 'أقوى العروض والتخفيضات الحصرية',
    isVisible: true,
    sortOrder: 1
  },
  {
    CategoryID: 'CAT_02',
    name: 'أجهزة سحبة',
    group: 'مجموعة الورد',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80',
    description: 'أحدث أجهزة السحبات الذكية والمدمجة',
    isVisible: true,
    sortOrder: 2
  },
  {
    CategoryID: 'CAT_03',
    name: 'أجهزة الفيب',
    group: 'مجموعة الورد',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=80',
    description: 'أجهزة الفيب المتطورة والقوية',
    isVisible: true,
    sortOrder: 3
  },
  {
    CategoryID: 'CAT_05',
    name: 'بودات',
    group: 'مجموعة الورد',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80',
    description: 'بودات وكويلات أصلية متوافقة',
    isVisible: true,
    sortOrder: 4
  },
  {
    CategoryID: 'CAT_06',
    name: 'سيجار',
    group: 'مجموعة الورد',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop&q=80',
    description: 'سيجار فاخر ونكهات تبغ أصلية',
    isVisible: true,
    sortOrder: 5
  },
  {
    CategoryID: 'CAT_07',
    name: 'شيشة',
    group: 'مجموعة الساعات',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80',
    description: 'شيشة إلكترونية وتقليدية وملحقاتها',
    isVisible: true,
    sortOrder: 6
  },
  {
    CategoryID: 'CAT_08',
    name: 'عروض خاصة',
    group: 'مجموعة الساعات',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80',
    description: 'باقات وبكجات حصرية بأسعار مميزة',
    isVisible: true,
    sortOrder: 7
  },
  {
    CategoryID: 'CAT_09',
    name: 'نكهات',
    group: 'مجموعة الساعات',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
    description: 'نكهات سولت وفري بيز فاخرة ومتنوعة',
    isVisible: true,
    sortOrder: 8
  }
];

export const initialProducts: Product[] = [
  {
    ProductID: 'PRD1001',
    name: 'سحبة متاح نكهات متعددة وبطارية قابلة للشحن',
    SKU: 'VAP-POD-001',
    Barcode: '629110001001',
    group: 'مجموعة الورد',
    category: 'أجهزة سحبة',
    costPrice: 25,
    salePrice: 70,
    originalPrice: 90,
    wholesalePrice: 45,
    discount: 22,
    quantity: 45,
    minStock: 10,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'جهاز سحبة إلكترونية أنيق بتصميم عصري وأداء بطارية قوي يدوم طوال اليوم.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-01',
    size: ['قياس موحد'],
    color: ['أسود', 'فضي', 'أزرق']
  },
  {
    ProductID: 'PRD1002',
    name: 'جهاز فيب مود احترافي مع شاشة رقمية وتحكم كامل بالواط',
    SKU: 'VAP-MOD-002',
    Barcode: '629110001002',
    group: 'مجموعة الورد',
    category: 'أجهزة الفيب',
    costPrice: 60,
    salePrice: 160,
    originalPrice: 200,
    wholesalePrice: 110,
    discount: 20,
    quantity: 60,
    minStock: 15,
    images: [
      'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'جهاز فيب متميز بقدرة عالية وتحكم ذكي بالحرارة لتجربة سحب غنية وسلسة.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-02',
    size: ['80W', '100W'],
    color: ['كربوني', 'رمادي', 'أحمر']
  },
  {
    ProductID: 'PRD1003',
    name: 'بكج بودات تعبئة سريعة مقاومة للتسريب 3 حبات',
    SKU: 'VAP-PODS-003',
    Barcode: '629110001003',
    group: 'مجموعة الورد',
    category: 'بودات',
    costPrice: 15,
    salePrice: 45,
    originalPrice: 55,
    wholesalePrice: 28,
    discount: 18,
    quantity: 120,
    minStock: 20,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'بودات أصلية متوافقة مصممة بأعلى معايير الجودة لمنع التسريب وإعطاء نكهة مركزة.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-03',
    size: ['0.8 ohm', '1.2 ohm'],
    color: ['شفاف']
  },
  {
    ProductID: 'PRD1004',
    name: 'شيشة إلكترونية محمولة فاخرة مع رأسين إضافيين',
    SKU: 'SHI-PRO-004',
    Barcode: '629110001004',
    group: 'مجموعة الساعات',
    category: 'شيشة',
    costPrice: 90,
    salePrice: 240,
    originalPrice: 300,
    wholesalePrice: 170,
    discount: 20,
    quantity: 25,
    minStock: 5,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'شيشة فاخرة ذات أداء عالي وتصميم زجاجي معدني رائع مع بطارية ليثيوم تدوم طويلاً.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-04',
    size: ['قياس موحد'],
    color: ['ذهبي ملكي', 'أسود غير لامع']
  },
  {
    ProductID: 'PRD1005',
    name: 'نكهة سولت بطيخ مثلج منعش 30 مل',
    SKU: 'FLV-SLT-005',
    Barcode: '629110001005',
    group: 'مجموعة الساعات',
    category: 'نكهات',
    costPrice: 12,
    salePrice: 40,
    originalPrice: 50,
    wholesalePrice: 22,
    discount: 20,
    quantity: 150,
    minStock: 30,
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'نكهة سولت فاخرة بطعم البطيخ البارد المنعش، تمنحك إحساساً رائعاً مع كل سحبة.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-05',
    size: ['25mg', '50mg'],
    color: ['30ml']
  },
  {
    ProductID: 'PRD1006',
    name: 'سيجار هافانا فاخر بنكهة التبغ الطبيعي الكوبي المعتق',
    SKU: 'CIG-HAV-006',
    Barcode: '629110001006',
    group: 'مجموعة الورد',
    category: 'سيجار',
    costPrice: 40,
    salePrice: 110,
    originalPrice: 135,
    wholesalePrice: 75,
    discount: 18,
    quantity: 35,
    minStock: 10,
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'سيجار عالي النقاء بنكهة أوراق التبغ الكوبية الأصلية لمحبي المذاق الكلاسيكي الأصيل.',
    status: 'active',
    isVisible: true,
    createdAt: '2026-08-06',
    size: ['عبوة 5 حبات', 'عبوة 10 حبات'],
    color: ['بني كلاسيكي']
  }
];

export const initialCustomers: Customer[] = [
  {
    CustomerID: 'CST101',
    name: 'مها الشمري',
    phone: '0551234567',
    email: 'maha@example.com',
    city: 'الرياض',
    address: 'حي العليا، شارع التخصصي',
    taxNumber: '300012345600003',
    balance: 0,
    loyaltyPoints: 340
  },
  {
    CustomerID: 'CST102',
    name: 'عبدالله العتيبي',
    phone: '0509876543',
    email: 'abdullah@example.com',
    city: 'جدة',
    address: 'حي الخالدية، طريق الملك',
    taxNumber: '300098765400003',
    balance: 150,
    loyaltyPoints: 520
  }
];

export const initialOrders: Order[] = [
  {
    OrderID: 'ORD-9001',
    orderNumber: 'SHN-2026-9001',
    customerName: 'مها الشمري',
    phone: '0551234567',
    city: 'الرياض',
    address: 'حي العليا',
    items: [
      {
        productID: 'PRD1001',
        productName: 'فستان صيفي مزهر بتصميم ملفوف أنيق',
        price: 103.2,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        size: 'M'
      }
    ],
    totalQuantity: 1,
    tax: 15.48,
    discount: 0,
    shippingFee: 15,
    totalAmount: 118.68,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'بطاقة إلكترونية Mada',
    employeeName: 'المتجر الإلكتروني',
    date: '2026-08-05 14:30',
    syncedToSheets: true
  }
];

export const initialInvoices: Invoice[] = [
  {
    InvoiceID: 'INV-8001',
    invoiceNumber: 'INV-2026-8001',
    customerName: 'مها الشمري',
    taxNumber: '300012345600003',
    itemsSummary: 'فستان صيفي مزهر (x1)',
    taxAmount: 15.48,
    totalAmount: 118.68,
    paymentMethod: 'Mada',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-8001-SHEIN-STORE',
    employeeName: 'المتجر الإلكتروني',
    date: '2026-08-05'
  }
];

export const initialEmployees: Employee[] = [
  {
    EmployeeID: 'EMP01',
    name: 'أحمد مدير النظام',
    username: 'admin',
    passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // mock hash
    role: 'Admin',
    permissions: ['all'],
    lastLogin: '2026-08-06 10:00'
  },
  {
    EmployeeID: 'EMP02',
    name: 'سارة الكاشير',
    username: 'sara',
    passwordHash: 'e10adc3949ba59abbe56e057f20f883e',
    role: 'Cashier',
    permissions: ['orders', 'invoices'],
    lastLogin: '2026-08-06 09:15'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    SupplierID: 'SUP01',
    name: 'شركة الأزياء العالمية لتوريد الملابس',
    phone: '0112233445',
    email: 'info@fashion-supply.com',
    balance: 5400
  }
];

export const initialOffers: Offer[] = [
  {
    OfferID: 'OFF01',
    title: 'تخفيضات موسم الصيف الكبرى (Flash Sale)',
    discountPercentage: 20,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'active'
  }
];

export const initialCoupons: Coupon[] = [
  {
    CouponCode: 'SHEIN20',
    discountValue: 20,
    discountType: 'percentage',
    minOrderAmount: 100,
    expiryDate: '2026-12-31',
    usageCount: 142
  },
  {
    CouponCode: 'FREE50',
    discountValue: 50,
    discountType: 'fixed',
    minOrderAmount: 300,
    expiryDate: '2026-12-31',
    usageCount: 89
  }
];

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

