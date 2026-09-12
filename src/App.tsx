import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ViewMode, 
  AdminTab, 
  Product, 
  Category, 
  Customer, 
  Order, 
  Invoice, 
  Employee, 
  Supplier, 
  Offer, 
  Coupon, 
  CurrencyRate, 
  AppSettings,
  OrderItem,
  AuditLog,
  ReferralPartner
} from './types';

import { 
  getLocalProducts, saveLocalProducts,
  getLocalCategories, saveLocalCategories,
  getLocalCustomers, saveLocalCustomers,
  getLocalOrders, saveLocalOrders,
  getLocalInvoices, saveLocalInvoices,
  getLocalEmployees, saveLocalEmployees,
  getLocalSuppliers, saveLocalSuppliers,
  getLocalOffers, saveLocalOffers,
  getLocalCoupons, saveLocalCoupons,
  getLocalCurrencies, saveLocalCurrencies,
  getLocalSettings, saveLocalSettings,
  getLocalAuditLogs, saveLocalAuditLogs, clearLocalAuditLogs, addAuditLog,
  getLocalReferralPartners, saveLocalReferralPartners,
  getPendingSyncQueue, addPendingMutation,
  trackReferralClick, recordReferralOrder,
  checkAndPerformDailyAutoBackup
} from './lib/offlineStorage';

import { initialCurrencies, initialProducts, defaultSettings } from './data/initialData';
import { DEFAULT_PRODUCT_IMAGE } from './lib/imageUtils';
import { getTrackingUrl } from './lib/dateUtils';
import { applyThemeGlobal, getCurrentThemeMode, toggleThemeMode } from './lib/themeHelper';
import { 
  sendToGoogleAppsScriptWebApp, 
  fetchDataFromGoogleSheets, 
  pingGoogleAppsScript,
  buildFullSyncPayload,
  executeUnifiedSheetsOperation
} from './lib/googleSheetsAppsScript';

// Storefront components
import { Navbar } from './components/storefront/Navbar';
import { StoreHome } from './components/storefront/StoreHome';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { ProductShareModal } from './components/storefront/ProductShareModal';
import { MissingProductModal } from './components/storefront/MissingProductModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { ReferralModal } from './components/storefront/ReferralModal';
import { WishlistModal } from './components/storefront/WishlistModal';
import { OfferAnnouncementModal } from './components/storefront/OfferAnnouncementModal';
import { NavigationDrawer } from './components/storefront/NavigationDrawer';
import { OrderTrackingModal } from './components/storefront/OrderTrackingModal';
import { StorePoliciesModal, PolicyTabType } from './components/storefront/StorePoliciesModal';
import { BottomNavigationBar } from './components/storefront/BottomNavigationBar';

// Admin components
import { AdminNavbar } from './components/admin/AdminNavbar';
const AdminSidebar = lazy(() => import('./components/admin/AdminSidebar').then(m => ({ default: m.AdminSidebar })));
const OverviewTab = lazy(() => import('./components/admin/OverviewTab').then(m => ({ default: m.OverviewTab })));
const ProductsTab = lazy(() => import('./components/admin/ProductsTab').then(m => ({ default: m.ProductsTab })));
const ExcelTab = lazy(() => import('./components/admin/ExcelTab').then(m => ({ default: m.ExcelTab })));
const OrdersTab = lazy(() => import('./components/admin/OrdersTab').then(m => ({ default: m.OrdersTab })));
const InvoicesTab = lazy(() => import('./components/admin/InvoicesTab').then(m => ({ default: m.InvoicesTab })));
const SheetsSyncTab = lazy(() => import('./components/admin/SheetsSyncTab').then(m => ({ default: m.SheetsSyncTab })));
import { CustomersTab, SuppliersTab, EmployeesTab, OffersTab, CouponsTab, AuditLogTab } from './components/admin/SimpleTabs';
const AffiliatesTab = lazy(() => import('./components/admin/AffiliatesTab').then(m => ({ default: m.AffiliatesTab })));
const StoreSettingsTab = lazy(() => import('./components/admin/StoreSettingsTab').then(m => ({ default: m.StoreSettingsTab })));

// Modals & Notifications
import { AppsScriptModal } from './components/AppsScriptModal';
import { ToastMessage, NotificationToastContainer, playNotificationSound } from './components/NotificationToast';
import { AdminLockModal } from './components/AdminLockModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { FullCatalogModal } from './components/FullCatalogModal';
import { SocialLinksMenu } from './components/SocialLinksMenu';
import { BlockingLoader } from './components/BlockingLoader';

export function App() {
  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [currentRole, setCurrentRole] = useState<'SuperAdmin' | 'Manager' | 'Supplier' | 'Customer'>('SuperAdmin');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);

  // Global Loading State (Blocks UI during fetch/mutations)
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(true);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string>('تحميل العروضات الجديده...');
  const isFirstLoad = useRef(true);

  const handleRoleChange = (newRole: 'SuperAdmin' | 'Manager' | 'Supplier' | 'Customer') => {
    setCurrentRole(newRole);
    if (newRole === 'Supplier' && adminTab !== 'products' && adminTab !== 'overview') {
      setAdminTab('products');
    } else if (newRole === 'Manager' && (adminTab === 'settings' || adminTab === 'sheets-sync' || adminTab === 'employees' || adminTab === 'audit-log')) {
      setAdminTab('products');
    } else if (newRole === 'Customer') {
      setViewMode('store');
    }
  };

  // New Modals State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showAdminLockModal, setShowAdminLockModal] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showOfferAnnouncement, setShowOfferAnnouncement] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingInitialOrderNum, setTrackingInitialOrderNum] = useState<string>('');
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState<boolean>(false);
  const [policiesInitialTab, setPoliciesInitialTab] = useState<PolicyTabType>('about');

  const handleOpenTracking = (orderNum: string = '') => {
    setTrackingInitialOrderNum(orderNum);
    setIsTrackingModalOpen(true);
  };

  const handleOpenPolicies = (tab: PolicyTabType = 'about') => {
    setPoliciesInitialTab(tab);
    setIsPoliciesModalOpen(true);
  };

  // Function to switch to Admin mode safely with password
  const handleOpenAdmin = () => {
    if (isAdminUnlocked) {
      setViewMode('admin');
    } else {
      setShowAdminLockModal(true);
    }
  };

  const handleAdminUnlockSuccess = (
    role: 'SuperAdmin' | 'Manager' | 'Supplier' | 'Customer' = 'SuperAdmin',
    empName?: string
  ) => {
    setIsAdminUnlocked(true);
    setShowAdminLockModal(false);
    setCurrentRole(role);

    if (role === 'Customer') {
      setViewMode('store');
      addNotification('👋 مرحباً بك عزيزي العميل', 'تم التحقق من حساب العميل. يمكنك تسوق العروض والمنتجات الآن.', 'info');
    } else {
      setViewMode('admin');
      if (role === 'Supplier') {
        setAdminTab('products');
      } else {
        setAdminTab('overview');
      }
      const roleLabel = role === 'SuperAdmin' ? 'المدير العام (Super Admin)' : role === 'Manager' ? 'مدير المتجر' : 'المورد';
      addNotification('🔑 تم تسجيل الدخول', `أهلاً بك ${empName || ''}! تم توجيهك بالصلاحيات المناسبة: [${roleLabel}].`, 'sync');
    }
  };

  // In-App Notifications State
  const [notifications, setNotifications] = useState<ToastMessage[]>([]);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );

  // Helper to add notification toast & trigger browser notification
  const addNotification = (title: string, message: string, type: 'order' | 'sync' | 'info' | 'warning') => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newNotif: ToastMessage = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    playNotificationSound(type === 'order' ? 'order' : 'sync', settings?.orderNotificationSound);

    // Trigger Native Browser Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          dir: 'rtl',
          lang: 'ar'
        });
      } catch (err) {
        console.warn('Browser notification failed:', err);
      }
    }

    // Auto dismiss notifications after 1 second (1000ms)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 1000);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRequestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationsEnabled(true);
        addNotification('🔔 تم تفعيل إشعارات المتصفح', 'ستتلقى تنبيهات فورية عند وصول طلبات جديدة أو إتمام المزامنة', 'info');
      }
    }
  };

  // Entities Data State
  const [products, setProducts] = useState<Product[]>(getLocalProducts);
  const [categories, setCategories] = useState<Category[]>(getLocalCategories);
  const [customers, setCustomers] = useState<Customer[]>(getLocalCustomers);
  const [orders, setOrders] = useState<Order[]>(getLocalOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(getLocalInvoices);
  const [employees, setEmployees] = useState<Employee[]>(getLocalEmployees);
  const [suppliers, setSuppliers] = useState<Supplier[]>(getLocalSuppliers);
  const [offers, setOffers] = useState<Offer[]>(getLocalOffers);
  const [coupons, setCoupons] = useState<Coupon[]>(getLocalCoupons);
  const [partners, setPartners] = useState<ReferralPartner[]>(getLocalReferralPartners);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>(getLocalCurrencies);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate>(() => {
    const list = getLocalCurrencies();
    return list[0] || initialCurrencies[0];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = getLocalSettings();
    if (!s.googleAppsScriptUrl || !s.googleAppsScriptUrl.trim().startsWith('http')) {
      s.googleAppsScriptUrl = defaultSettings.googleAppsScriptUrl;
      saveLocalSettings(s);
    }
    return s;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getLocalAuditLogs);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const handleUpdateCurrencies = (newCurrencies: CurrencyRate[]) => {
    setCurrencies(newCurrencies);
    saveLocalCurrencies(newCurrencies);
    // Keep selected currency updated
    const matched = newCurrencies.find(c => c.currencyCode === selectedCurrency?.currencyCode);
    if (matched) {
      setSelectedCurrency(matched);
    } else if (newCurrencies.length > 0) {
      setSelectedCurrency(newCurrencies[0]);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveLocalSettings(newSettings);
    applyThemeGlobal(newSettings);
  };

  const handleToggleTheme = () => {
    const currentMode = getCurrentThemeMode(settings);
    const nextMode = currentMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('store_theme_mode', nextMode);
    applyThemeGlobal(settings);
  };

  // Live Reactive Theme & CSS Updater
  useEffect(() => {
    applyThemeGlobal(settings);
  }, [
    settings?.themePrimaryColor,
    settings?.themeSecondaryColor,
    settings?.themeAccentColor,
    settings?.themeBgColor,
    settings?.themeTextColor,
    settings?.themeIconColor,
    settings?.themeMode
  ]);

  // Storage event listener for instant theme/settings synchronization across windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shein_settings_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) {
            setSettings(parsed);
            applyThemeGlobal(parsed);
          }
        } catch (err) {}
      }
      if (e.key === 'store_theme_mode') {
        applyThemeGlobal(settings);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [settings]);

  // Storefront Interaction States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSelectGroup = (groupName: string) => {
    setSelectedGroup(groupName);
    setSelectedCategory('all');
  };
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
  const [showMissingProductModal, setShowMissingProductModal] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('rwnaq_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rwnaq_wishlist');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('rwnaq_cart', JSON.stringify(cart));
    } catch(e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('rwnaq_wishlist', JSON.stringify(wishlist));
    } catch(e) {}
  }, [wishlist]);

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Dynamic OpenGraph Meta Tags Updater for WhatsApp & Social Sharing Previews
  useEffect(() => {
    const targetProduct = quickViewProduct || sharingProduct;
    if (targetProduct) {
      const updateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        } else {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      };

      updateMeta('og:title', targetProduct.name);
      updateMeta('og:description', `سعر المنتج: ${targetProduct.salePrice} ر.س ${targetProduct.discount ? `(خصم ${targetProduct.discount}%)` : ''} - اوفالي`);
      updateMeta('og:image', targetProduct.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800');
      updateMeta('og:url', `${window.location.origin}${window.location.pathname}?product=${targetProduct.ProductID}`);
      document.title = `${targetProduct.name} | اوفالي الفاخر`;
    }
  }, [quickViewProduct, sharingProduct]);

  // Deep Link Handling for ?product=ID or ?p=ID and ?ref=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Referral Partner Tracking (?ref=xyz or ?r=xyz)
    const refCode = params.get('ref') || params.get('r');
    if (refCode) {
      const cleanRef = refCode.trim();
      trackReferralClick(cleanRef);
      try {
        localStorage.setItem('active_referral_code', cleanRef);
      } catch (e) {
        console.error('Error saving ref code', e);
      }
    }

    const groupParam = params.get('group') || params.get('g');
    if (groupParam) {
      setSelectedGroup(decodeURIComponent(groupParam));
    }
    const catParam = params.get('category') || params.get('c');
    if (catParam) {
      setSelectedCategory(decodeURIComponent(catParam));
    }

    const productId = params.get('product') || params.get('p');
    if (productId && products.length > 0) {
      const targetProduct = products.find(
        p => p.ProductID.toLowerCase() === productId.trim().toLowerCase()
      );

      if (targetProduct) {
        setQuickViewProduct(targetProduct);
      } else {
        // Product was deleted or missing -> notify user and clean query params
        setShowMissingProductModal(true);
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);
      }
    }
  }, [products]);

  // Periodic and on-load Daily Auto-Backup Snapshot to LocalStorage
  useEffect(() => {
    if (products.length > 0) {
      checkAndPerformDailyAutoBackup({
        products,
        categories,
        customers,
        orders,
        invoices,
        employees,
        suppliers,
        offers,
        coupons,
        currencies,
        settings
      });
    }
  }, [products.length, orders.length]);

  // Sync pending mutations count
  const pendingQueue = getPendingSyncQueue();

  // Listen to Online/Offline network status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // ALWAYS pull fresh data from Google Sheets when coming online
      // NEVER overwrite Google Sheets with local state automatically!
      pullDataFromGoogleSheets(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to local persistence whenever state changes
  useEffect(() => { saveLocalProducts(products); }, [products]);
  useEffect(() => { saveLocalOrders(orders); }, [orders]);
  useEffect(() => { saveLocalInvoices(invoices); }, [invoices]);
  useEffect(() => { saveLocalCustomers(customers); }, [customers]);
  useEffect(() => { saveLocalSettings(settings); }, [settings]);
  useEffect(() => { saveLocalCoupons(coupons); }, [coupons]);
  useEffect(() => { saveLocalSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { saveLocalEmployees(employees); }, [employees]);
  useEffect(() => { saveLocalOffers(offers); }, [offers]);

  // Centralized Real-Time Audit Logger with immediate Google Sheets sync
  const logAudit = (employeeName: string, action: string, details: string) => {
    const newLog = addAuditLog(employeeName, action, details);
    setAuditLogs(getLocalAuditLogs());
    if (settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
        action: 'save_audit_log',
        log: newLog
      }).catch(err => console.warn('Background audit sync skipped:', err));
    }
    return newLog;
  };

  // Suppliers Management Handlers with Google Sheets sync
  const handleAddSupplier = async (newSup: Supplier) => {
    let updatedList: Supplier[] = [];
    setSuppliers(prev => {
      const filtered = prev.filter(s => s.SupplierID !== newSup.SupplierID);
      updatedList = [newSup, ...filtered];
      saveLocalSuppliers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'إضافة مورد', `تمت إضافة المورد: ${newSup.name}`);
    addNotification('🚚 تم إضافة المورد', `تم تسجيل المورد ${newSup.name} محلياً وجاري المزامنة...`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_supplier',
      payload: { 
        SupplierID: newSup.SupplierID,
        supplier: newSup,
        suppliers: updatedList 
      },
      entityName: `المورد "${newSup.name}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdateSupplier = async (updatedSup: Supplier) => {
    let updatedList: Supplier[] = [];
    setSuppliers(prev => {
      updatedList = prev.map(s => s.SupplierID === updatedSup.SupplierID ? updatedSup : s);
      saveLocalSuppliers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'تعديل مورد', `تم تعديل بيانات المورد: ${updatedSup.name}`);
    addNotification('✏️ تم تحديث المورد', `تم حفظ بيانات المورد ${updatedSup.name}`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_supplier',
      payload: { 
        SupplierID: updatedSup.SupplierID,
        supplier: updatedSup,
        suppliers: updatedList 
      },
      entityName: `المورد "${updatedSup.name}"`,
      operationType: 'تحديث',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeleteSupplier = async (id: string) => {
    const sup = suppliers.find(s => s.SupplierID === id);
    let updatedList: Supplier[] = [];
    setSuppliers(prev => {
      updatedList = prev.filter(s => s.SupplierID !== id);
      saveLocalSuppliers(updatedList);
      return updatedList;
    });
    if (sup) {
      logAudit('المدير المسؤول', 'حذف مورد', `تم حذف المورد: ${sup.name}`);
      addNotification('🗑️ تم حذف المورد', `تم إزالة المورد ${sup.name} من النظام`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_supplier',
      payload: { 
        SupplierID: id,
        id: id,
        suppliers: updatedList 
      },
      entityName: `المورد "${sup?.name || id}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleBulkAddSuppliers = async (imported: Supplier[]) => {
    if (!imported || imported.length === 0) return;

    const hasSheet = Boolean(settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'));

    if (hasSheet) {
      const isAlive = await pingGoogleAppsScript(settings.googleAppsScriptUrl);
      if (!isAlive && !isOnline) {
        addNotification(
          '❌ فشل الاتصال بجداول Google Sheets',
          'تعذر التحقق من الاتصال بالسكربت السحابي. تم إيقاف المزامنة الجماعية للموردين لمنع فقدان البيانات أو تعارضها.',
          'warning'
        );
        setSyncStatus('error');
        return;
      }
    }

    let updatedList: Supplier[] = [];
    setSuppliers(prev => {
      const mergedMap = new Map<string, Supplier>();
      prev.forEach(s => mergedMap.set(s.SupplierID || s.name, s));
      imported.forEach(s => mergedMap.set(s.SupplierID || s.name, s));
      updatedList = Array.from(mergedMap.values());
      saveLocalSuppliers(updatedList);
      return updatedList;
    });

    logAudit('المدير المسؤول', 'استيراد موردين', `تم استيراد ${imported.length} مورد من ملف إكسل`);
    addNotification('🚚 تم استيراد الموردين', `تم إضافة ${imported.length} مورد وجاري المزامنة مع الإكسل...`, 'info');

    if (hasSheet) {
      await executeUnifiedSheetsOperation({
        action: 'save_suppliers',
        payload: { 
          suppliers: updatedList 
        },
        entityName: `قائمة الموردين (${updatedList.length})`,
        operationType: 'حفظ جماعي',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  // Customers Management Handlers with Google Sheets sync
  const handleAddCustomer = async (newCust: Customer) => {
    let updatedList: Customer[] = [];
    setCustomers(prev => {
      const filtered = prev.filter(c => c.CustomerID !== newCust.CustomerID);
      updatedList = [newCust, ...filtered];
      saveLocalCustomers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'إضافة عميل', `تم تسجيل العميل: ${newCust.name} (${newCust.CustomerID})`);
    addNotification('👤 تم تسجيل العميل', `تمت إضافة العميل "${newCust.name}" بنجاح وجاري المزامنة...`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_customer',
      payload: { 
        CustomerID: newCust.CustomerID,
        customer: newCust,
        customers: updatedList 
      },
      entityName: `العميل "${newCust.name}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdateCustomer = async (updatedCust: Customer) => {
    let updatedList: Customer[] = [];
    setCustomers(prev => {
      updatedList = prev.map(c => c.CustomerID === updatedCust.CustomerID ? updatedCust : c);
      saveLocalCustomers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'تعديل عميل', `تم تعديل بيانات العميل: ${updatedCust.name} (${updatedCust.CustomerID})`);
    addNotification('✏️ تم تحديث العميل', `تم حفظ تغييرات العميل "${updatedCust.name}"`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_customer',
      payload: { 
        CustomerID: updatedCust.CustomerID,
        customer: updatedCust,
        customers: updatedList 
      },
      entityName: `العميل "${updatedCust.name}"`,
      operationType: 'تحديث',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeleteCustomer = async (id: string) => {
    const cust = customers.find(c => c.CustomerID === id);
    let updatedList: Customer[] = [];
    setCustomers(prev => {
      updatedList = prev.filter(c => c.CustomerID !== id);
      saveLocalCustomers(updatedList);
      return updatedList;
    });
    if (cust) {
      logAudit('المدير المسؤول', 'حذف عميل', `تم حذف العميل: ${cust.name} (${cust.CustomerID})`);
      addNotification('🗑️ تم حذف العميل', `تم إزالة العميل ${cust.name} من النظام`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_customer',
      payload: { 
        CustomerID: id,
        id: id,
        customers: updatedList 
      },
      entityName: `العميل "${cust?.name || id}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Employees Management Handlers with Google Sheets sync
  const handleAddEmployee = async (newEmp: Employee) => {
    if (settings?.planMaxEmployees && settings.planMaxEmployees > 0 && employees.length >= settings.planMaxEmployees) {
      alert(`عذراً، وصل المتجر للحد الأقصى المسموح به للموظفين في باقته الحالية (${settings.planMaxEmployees} موظف).\n\nممنوع الإضافة! يرجى التواصل مع إدارة المتجر/المنصة لترقية الباقة والتوسع.`);
      return;
    }
    let updatedList: Employee[] = [];
    setEmployees(prev => {
      const updated = [newEmp, ...prev];
      updatedList = updated;
      saveLocalEmployees(updated);
      return updated;
    });
    logAudit('المدير المسؤول', 'إضافة موظف', `تمت إضافة الموظف: ${newEmp.name} (${newEmp.role})`);
    addNotification('👤 تم إضافة الموظف', `تم إنشاء حساب الموظف ${newEmp.name} بنجاح ومزامنته سحابياً`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_employee',
      payload: { 
        EmployeeID: newEmp.EmployeeID,
        employee: newEmp,
        employees: updatedList 
      },
      entityName: `الموظف "${newEmp.name}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    let updatedList: Employee[] = [];
    setEmployees(prev => {
      const updated = prev.map(e => e.EmployeeID === updatedEmp.EmployeeID ? updatedEmp : e);
      updatedList = updated;
      saveLocalEmployees(updated);
      return updated;
    });
    logAudit('المدير المسؤول', 'تعديل موظف', `تم تعديل بيانات الموظف: ${updatedEmp.name}`);
    addNotification('✏️ تم تحديث الموظف', `تمت تحديث بيانات الموظف ${updatedEmp.name} بنجاح`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_employee',
      payload: { 
        EmployeeID: updatedEmp.EmployeeID,
        employee: updatedEmp,
        employees: updatedList 
      },
      entityName: `الموظف "${updatedEmp.name}"`,
      operationType: 'تحديث',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeleteEmployee = async (id: string) => {
    const emp = employees.find(e => e.EmployeeID === id);
    let updatedList: Employee[] = [];
    setEmployees(prev => {
      const updated = prev.filter(e => e.EmployeeID !== id);
      updatedList = updated;
      saveLocalEmployees(updated);
      return updated;
    });
    if (emp) {
      logAudit('المدير المسؤول', 'حذف موظف', `تم إلغاء حساب الموظف: ${emp.name}`);
      addNotification('🗑️ تم حذف الحساب', `تم حذف حساب الموظف ${emp.name}`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_employee',
      payload: { 
        EmployeeID: id,
        id: id,
        employees: updatedList 
      },
      entityName: `الموظف "${emp?.name || id}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Offers Management Handlers with Google Sheets sync
  const handleAddOffer = async (newOff: Offer) => {
    let updatedList: Offer[] = [];
    setOffers(prev => {
      const filtered = prev.filter(o => o.OfferID !== newOff.OfferID);
      updatedList = [newOff, ...filtered];
      saveLocalOffers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'إضافة عرض ترويجي', `تم إنشاء عرض: ${newOff.title} (خصم ${newOff.discountPercentage}%)`);
    addNotification('🔥 تم تفعيل العرض', `العرض "${newOff.title}" أصبح فعالاً الآن وجاري المزامنة...`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_offer',
      payload: { 
        OfferID: newOff.OfferID,
        offer: newOff,
        offers: updatedList 
      },
      entityName: `العرض "${newOff.title}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdateOffer = async (updatedOff: Offer) => {
    let updatedList: Offer[] = [];
    setOffers(prev => {
      updatedList = prev.map(o => o.OfferID === updatedOff.OfferID ? updatedOff : o);
      saveLocalOffers(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'تعديل عرض', `تم تعديل بيانات العرض: ${updatedOff.title}`);
    addNotification('✏️ تم تحديث العرض', `تم حفظ تغييرات العرض "${updatedOff.title}"`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_offer',
      payload: { 
        OfferID: updatedOff.OfferID,
        offer: updatedOff,
        offers: updatedList 
      },
      entityName: `العرض "${updatedOff.title}"`,
      operationType: 'تحديث',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeleteOffer = async (id: string) => {
    const off = offers.find(o => o.OfferID === id);
    let updatedList: Offer[] = [];
    setOffers(prev => {
      updatedList = prev.filter(o => o.OfferID !== id);
      saveLocalOffers(updatedList);
      return updatedList;
    });
    if (off) {
      logAudit('المدير المسؤول', 'حذف عرض', `تم حذف العرض: ${off.title}`);
      addNotification('🗑️ تم إلغاء العرض', `تم إزالة العرض ${off.title}`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_offer',
      payload: { 
        OfferID: id,
        id: id,
        offers: updatedList 
      },
      entityName: `العرض "${off?.title || id}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Store Settings Handler with instant Google Sheets sync
  const handleSaveStoreSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveLocalSettings(newSettings);
    logAudit('المدير المسؤول', 'تعديل إعدادات المتجر', 'تم تحديث اسم المتجر والشعار وأرقام التواصل والروابط');
    addNotification('⚙️ تم حفظ الإعدادات', 'تم حفظ بيانات المتجر محلياً وجاري المزامنة...', 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_settings',
      payload: { settings: newSettings },
      entityName: 'إعدادات المتجر',
      operationType: 'حفظ وتحديث',
      webAppUrl: newSettings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Restore Full System Backup Handler
  const handleRestoreBackup = (backup: {
    products?: Product[];
    orders?: Order[];
    customers?: Customer[];
    suppliers?: Supplier[];
    employees?: Employee[];
    offers?: Offer[];
    coupons?: Coupon[];
    invoices?: Invoice[];
    settings?: Partial<AppSettings>;
    currencies?: CurrencyRate[];
    importedCounts: { [key: string]: number };
  }) => {
    if (backup.products && backup.products.length > 0) {
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.ProductID));
        const newItems = backup.products!.filter(p => !existingIds.has(p.ProductID));
        return [...newItems, ...prev];
      });
    }
    if (backup.orders && backup.orders.length > 0) {
      setOrders(prev => {
        const existingIds = new Set(prev.map(o => o.OrderID));
        const newItems = backup.orders!.filter(o => !existingIds.has(o.OrderID));
        return [...newItems, ...prev];
      });
    }
    if (backup.customers && backup.customers.length > 0) {
      setCustomers(prev => {
        const existingIds = new Set(prev.map(c => c.CustomerID));
        const newItems = backup.customers!.filter(c => !existingIds.has(c.CustomerID));
        return [...newItems, ...prev];
      });
    }
    if (backup.suppliers && backup.suppliers.length > 0) {
      setSuppliers(prev => {
        const existingIds = new Set(prev.map(s => s.SupplierID));
        const newItems = backup.suppliers!.filter(s => !existingIds.has(s.SupplierID));
        return [...newItems, ...prev];
      });
    }
    if (backup.employees && backup.employees.length > 0) {
      setEmployees(prev => {
        const existingIds = new Set(prev.map(e => e.EmployeeID));
        const newItems = backup.employees!.filter(e => !existingIds.has(e.EmployeeID));
        return [...newItems, ...prev];
      });
    }
    if (backup.offers && backup.offers.length > 0) {
      setOffers(prev => {
        const existingIds = new Set(prev.map(o => o.OfferID));
        const newItems = backup.offers!.filter(o => !existingIds.has(o.OfferID));
        return [...newItems, ...prev];
      });
    }
    if (backup.coupons && backup.coupons.length > 0) {
      setCoupons(prev => {
        const existingCodes = new Set(prev.map(c => c.CouponCode));
        const newItems = backup.coupons!.filter(c => !existingCodes.has(c.CouponCode));
        return [...newItems, ...prev];
      });
    }
    if (backup.invoices && backup.invoices.length > 0) {
      setInvoices(prev => {
        const existingIds = new Set(prev.map(i => i.InvoiceID));
        const newItems = backup.invoices!.filter(i => !existingIds.has(i.InvoiceID));
        return [...newItems, ...prev];
      });
    }
    if (backup.settings && Object.keys(backup.settings).length > 0) {
      setSettings(prev => {
        const updated = { ...prev, ...backup.settings };
        saveLocalSettings(updated);
        return updated;
      });
    }

    const summary = Object.entries(backup.importedCounts)
      .map(([k, v]) => `${v} ${k}`)
      .join('، ');

    addAuditLog('المدير المسؤول', 'استيراد نسخة احتياطية', `تم استيراد بيانات من ملف الإكسل: ${summary}`);
    addNotification('📦 تم استعادة النسخة الاحتياطية', `تم تحديث بيانات النظام بنجاح (${summary})`, 'info');
  };

  // Coupon Management Handlers with Google Sheets sync
  const handleAddCoupon = async (newCoupon: Coupon) => {
    let updatedList: Coupon[] = [];
    setCoupons(prev => {
      const filtered = prev.filter(c => c.CouponCode !== newCoupon.CouponCode);
      updatedList = [newCoupon, ...filtered];
      saveLocalCoupons(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'إضافة كوبون خصم', `تم إنشاء كود الخصم الجديد: ${newCoupon.CouponCode}`);
    addNotification('🏷️ تم إضافة الكوبون', `الكود ${newCoupon.CouponCode} أصبح فعالاً الآن بالمتجر`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_coupon',
      payload: { 
        CouponCode: newCoupon.CouponCode,
        coupon: newCoupon,
        coupons: updatedList 
      },
      entityName: `الكوبون "${newCoupon.CouponCode}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeleteCoupon = async (code: string) => {
    let updatedList: Coupon[] = [];
    setCoupons(prev => {
      updatedList = prev.filter(c => c.CouponCode !== code);
      saveLocalCoupons(updatedList);
      return updatedList;
    });
    logAudit('المدير المسؤول', 'حذف كوبون', `تم إزالة كود الخصم: ${code}`);
    addNotification('🗑️ تم حذف الكوبون', `تم إلغاء الكود ${code}`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'delete_coupon',
      payload: { 
        CouponCode: code,
        code: code,
        coupons: updatedList 
      },
      entityName: `الكوبون "${code}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Affiliates & Referral Partners Handlers with Google Sheets sync
  const handleAddPartner = async (partner: ReferralPartner) => {
    let updatedList: ReferralPartner[] = [];
    setPartners(prev => {
      const filtered = prev.filter(p => p.id !== partner.id && p.code.toLowerCase() !== partner.code.toLowerCase());
      updatedList = [partner, ...filtered];
      saveLocalReferralPartners(updatedList);
      return updatedList;
    });

    logAudit('المدير المسؤول', 'إضافة شريك تسويقي', `تم تسجيل المسوق الجديد: ${partner.name} (كود: ${partner.code})`);
    addNotification('🤝 تم تسجيل المسوق', `تم إضافة الشريك التسويقي "${partner.name}" بنجاح وجاري المزامنة...`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_affiliate',
      payload: {
        id: partner.id,
        affiliate: partner,
        affiliates: updatedList
      },
      entityName: `المسوق "${partner.name}"`,
      operationType: 'حفظ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdatePartner = async (partner: ReferralPartner) => {
    let updatedList: ReferralPartner[] = [];
    setPartners(prev => {
      updatedList = prev.map(p => p.id === partner.id ? partner : p);
      saveLocalReferralPartners(updatedList);
      return updatedList;
    });

    logAudit('المدير المسؤول', 'تعديل مسوق', `تم تعديل بيانات المسوق: ${partner.name} (كود: ${partner.code})`);
    addNotification('✏️ تم تحديث المسوق', `تم حفظ بيانات المسوق "${partner.name}" بنجاح`, 'info');

    await executeUnifiedSheetsOperation({
      action: 'save_affiliate',
      payload: {
        id: partner.id,
        affiliate: partner,
        affiliates: updatedList
      },
      entityName: `المسوق "${partner.name}"`,
      operationType: 'تحديث',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleDeletePartner = async (id: string) => {
    const partner = partners.find(p => p.id === id);
    let updatedList: ReferralPartner[] = [];
    setPartners(prev => {
      updatedList = prev.filter(p => p.id !== id);
      saveLocalReferralPartners(updatedList);
      return updatedList;
    });

    if (partner) {
      logAudit('المدير المسؤول', 'حذف مسوق', `تم حذف حساب المسوق: ${partner.name} (كود: ${partner.code})`);
      addNotification('🗑️ تم حذف المسوق', `تم إزالة حساب المسوق ${partner.name} من النظام`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_affiliate',
      payload: {
        id: id,
        affiliates: updatedList
      },
      entityName: `المسوق "${partner?.name || id}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handlePayoutPartner = async (partnerId: string, amount: number) => {
    let targetPartner: ReferralPartner | undefined;
    let updatedList: ReferralPartner[] = [];

    setPartners(prev => {
      updatedList = prev.map(p => {
        if (p.id === partnerId) {
          const newPaid = (p.paidEarnings || 0) + amount;
          const newBalance = Math.max(0, (p.totalEarnings || 0) - newPaid);
          targetPartner = {
            ...p,
            paidEarnings: newPaid,
            balance: newBalance,
            lastPayoutDate: new Date().toISOString().split('T')[0]
          };
          return targetPartner;
        }
        return p;
      });
      saveLocalReferralPartners(updatedList);
      return updatedList;
    });

    if (targetPartner) {
      logAudit('المدير المسؤول', 'صرف عمولة مسوق', `تم صرف عمولة بقيمة ${amount} ر.س للمسوق: ${targetPartner.name}`);
      addNotification('💵 تم صرف الأرباح', `تم تسجيل حوالة أرباح للمسوق ${targetPartner.name} بقيمة ${(Number(amount) || 0).toFixed(2)} ر.س`, 'info');

      await executeUnifiedSheetsOperation({
        action: 'payout_affiliate',
        payload: {
          id: partnerId,
          amount: amount,
          partner: targetPartner,
          affiliates: updatedList
        },
        entityName: `صرف عمولة "${targetPartner.name}"`,
        operationType: 'صرف أرباح',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  // Clear and Reset Audit Logs Handler (تهيئة وتفريغ السجل)
  const handleClearAuditLogs = async () => {
    clearLocalAuditLogs();
    setAuditLogs([]);
    const initLog = logAudit('المدير المسؤول', 'تهيئة السجل', 'تم تفريغ وتهيئة سجل العمليات والأحداث محلياً وفي Google Sheets');
    addNotification('🧹 تم تهيئة السجل', 'تم مسح وتصفير سجل العمليات محلياً وإرسال أمر التفريغ لـ Google Sheets بنجاح', 'info');

    await executeUnifiedSheetsOperation({
      action: 'clear_audit_logs',
      payload: { initialLog: initLog },
      entityName: 'ورقة سجل العمليات',
      operationType: 'تهيئة وتفريغ',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  // Categories Management Handlers
  const handleAddCategory = async (newCat: Category) => {
    let updated: Category[] = [];
    setCategories(prev => {
      if (prev.some(c => c.name.trim().toLowerCase() === newCat.name.trim().toLowerCase())) return prev;
      updated = [newCat, ...prev];
      saveLocalCategories(updated);
      return updated;
    });
    logAudit('المدير المسؤول', 'إضافة قسم', `تم إضافة قسم جديد: ${newCat.name}`);
    addNotification('📁 تم إضافة قسم جديد', `تم إضافة التصنيف ${newCat.name} بنجاح`, 'info');

    if (updated.length > 0) {
      await executeUnifiedSheetsOperation({
        action: 'save_category',
        payload: { 
          CategoryID: newCat.CategoryID,
          category: newCat,
          categories: updated 
        },
        entityName: `القسم "${newCat.name}"`,
        operationType: 'حفظ',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const cat = categories.find(c => c.CategoryID === categoryId);
    let updated: Category[] = [];
    setCategories(prev => {
      updated = prev.filter(c => c.CategoryID !== categoryId);
      saveLocalCategories(updated);
      return updated;
    });
    if (cat) {
      logAudit('المدير المسؤول', 'حذف قسم', `تم حذف القسم: ${cat.name}`);
      addNotification('🗑️ تم حذف القسم', `تم إزالة التصنيف ${cat.name}`, 'info');
    }

    await executeUnifiedSheetsOperation({
      action: 'delete_category',
      payload: { 
        CategoryID: categoryId,
        name: cat?.name,
        categories: updated 
      },
      entityName: `القسم "${cat?.name || categoryId}"`,
      operationType: 'حذف',
      webAppUrl: settings.googleAppsScriptUrl,
      setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
      showToast: addNotification,
      onSuccess: () => pullDataFromGoogleSheets(false)
    });
  };

  const handleUpdateCategory = async (updatedCat: Category) => {
    let updated: Category[] = [];
    setCategories(prev => {
      updated = prev.map(c => c.CategoryID === updatedCat.CategoryID ? updatedCat : c);
      saveLocalCategories(updated);
      return updated;
    });
    logAudit('المدير المسؤول', 'تعديل قسم', `تم تعديل بيانات القسم: ${updatedCat.name}`);
    addNotification('✅ تم تحديث القسم', `تم حفظ بيانات ${updatedCat.name}`, 'info');

    if (settings.googleAppsScriptUrl) {
      await executeUnifiedSheetsOperation({
        action: 'save_category',
        payload: { 
          CategoryID: updatedCat.CategoryID,
          category: updatedCat,
          categories: updated 
        },
        entityName: `القسم "${updatedCat.name}"`,
        operationType: 'حفظ',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  const handleToggleCategoryVisibility = async (categoryId: string, isVisible: boolean) => {
    const targetCat = categories.find(c => c.CategoryID === categoryId);
    if (!targetCat) return;

    const updatedCat = { ...targetCat, isVisible };
    let updated: Category[] = [];
    setCategories(prev => {
      updated = prev.map(c => c.CategoryID === categoryId ? updatedCat : c);
      saveLocalCategories(updated);
      return updated;
    });

    const statusMsg = isVisible ? 'تفعيل ظهور (1)' : 'إخفاء (0)';
    logAudit('المدير المسؤول', 'تغيير ظهور قسم', `${statusMsg} للقسم: ${targetCat.name}`);
    addNotification(
      isVisible ? '👁️ تم تفعيل ظهور القسم' : '🙈 تم إخفاء القسم',
      `تم تغيير حالة ظهور "${targetCat.name}" إلى ${statusMsg}`,
      'info'
    );

    if (settings.googleAppsScriptUrl) {
      await executeUnifiedSheetsOperation({
        action: 'save_category',
        payload: { 
          CategoryID: targetCat.CategoryID,
          category: updatedCat,
          categories: updated 
        },
        entityName: `حالة ظهور "${targetCat.name}"`,
        operationType: 'تعديل',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  const handleToggleGroupVisibility = async (groupName: string, isVisible: boolean) => {
    const targetGroup = groupName.trim();
    let updated: Category[] = [];
    setCategories(prev => {
      updated = prev.map(c => {
        const cGroup = (c.group && c.group.trim()) ? c.group.trim() : '';
        if (cGroup && cGroup === targetGroup) {
          return { ...c, isVisible };
        }
        return c;
      });
      saveLocalCategories(updated);
      return updated;
    });

    const statusMsg = isVisible ? 'تفعيل ظهور (1)' : 'إخفاء (0)';
    logAudit('المدير المسؤول', 'تغيير ظهور مجموعة', `${statusMsg} لكافة أقسام مجموعة: ${groupName}`);
    addNotification(
      isVisible ? '👁️ تم تفعيل ظهور المجموعة' : '🙈 تم إخفاء المجموعة بالكامل',
      `تم تحديث ظهور مجموعة "${groupName}" في المتجر`,
      'info'
    );

    if (settings.googleAppsScriptUrl) {
      await executeUnifiedSheetsOperation({
        action: 'save_all_categories',
        payload: { 
          categories: updated 
        },
        entityName: `مجموعة "${groupName}"`,
        operationType: 'تعديل شامل',
        webAppUrl: settings.googleAppsScriptUrl,
        setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
        showToast: addNotification,
        onSuccess: () => pullDataFromGoogleSheets(false)
      });
    }
  };

  // Filter visible categories and products for the storefront customer experience
  const visibleCategories = useMemo(() => {
    return categories.filter(c => c.isVisible !== false);
  }, [categories]);

  const visibleProducts = useMemo(() => {
    const visibleCatNames = new Set(visibleCategories.map(c => c.name));
    return products.filter(p => {
      if (p.isVisible === false) return false;
      if (p.status === 'draft') return false;
      if (p.category && !visibleCatNames.has(p.category)) {
        return false;
      }
      return true;
    });
  }, [products, visibleCategories]);

  // Ref to always hold latest store state
  const latestStateRef = useRef({
    products, categories, orders, invoices, customers, suppliers, employees, offers, coupons, settings, currencies
  });

  useEffect(() => {
    latestStateRef.current = {
      products, categories, orders, invoices, customers, suppliers, employees, offers, coupons, settings, currencies
    };
  }, [products, categories, orders, invoices, customers, suppliers, employees, offers, coupons, settings, currencies]);

  // Dynamic Page Title, Favicon & Meta Tags Update based on store settings, synchronized with server-side cache
  useEffect(() => {
    if (settings.storeName) {
      document.title = `${settings.storeName} | ${settings.storeTagline || 'أحدث الموضات والأزياء'}`;
      
      // Update DOM meta tags for social share previews
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          if (property.startsWith('og:')) {
            meta.setAttribute('property', property);
          } else {
            meta.setAttribute('name', property);
          }
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateMetaTag('og:title', `👑 ${settings.storeName} 👑`);
      updateMetaTag('og:description', settings.storeTagline || settings.heroTitle || 'تسوق أحدث الفساتين والملابس والمنتجات الفاخرة بعروض وخصومات مميزة!');
      if (settings.storeLogoUrl) {
        updateMetaTag('og:image', settings.storeLogoUrl);
        updateMetaTag('twitter:image', settings.storeLogoUrl);
      }
      updateMetaTag('twitter:title', `👑 ${settings.storeName} 👑`);
      updateMetaTag('twitter:description', settings.storeTagline || settings.heroTitle || 'تسوق أحدث الفساتين والملابس والمنتجات الفاخرة بعروض وخصومات مميزة!');

      // Synchronize settings with server-side API so crawler/bots always fetch the dynamic updated values
      fetch('/api/store-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeName: settings.storeName,
          storeTagline: settings.storeTagline || '',
          heroTitle: settings.heroTitle || '',
          storeLogoUrl: settings.storeLogoUrl || '',
          heroSubtitle: settings.heroSubtitle || '',
        })
      }).catch(err => {
        console.debug('Failed to cache settings on server (running client-only or offline):', err);
      });
    }

    const logoUrlToUse = settings.storeLogoUrl?.trim() || 'https://www.hbhoz.id/foto_logo/4637980-Ovale.jpg';

    // Update Favicons, Shortcut Icon and Apple Touch Icon for PWA & Browser tabs
    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((relType) => {
      let link: HTMLLinkElement | null = document.querySelector(`link[rel='${relType}']`) || document.querySelector(`link[rel*='${relType}']`);
      if (!link) {
        link = document.createElement('link');
        link.rel = relType;
        document.head.appendChild(link);
      }
      link.href = logoUrlToUse;
    });

    // Dynamic Manifest Injection for Chrome PWA "تثبيت هذه الصفحة كتطبيق" dialog
    try {
      let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }

      const dynamicManifest = {
        name: settings.storeName || 'اوفالي',
        short_name: settings.storeName || 'اوفالي',
        description: settings.storeTagline || 'شريكك الأول للتسوق الموثوق والآمن',
        start_url: '/',
        display: 'standalone',
        background_color: settings.themeBgColor || '#090d16',
        theme_color: settings.themePrimaryColor || '#ec4899',
        icons: [
          {
            src: logoUrlToUse,
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: logoUrlToUse,
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      };
      const stringManifest = JSON.stringify(dynamicManifest);
      const blob = new Blob([stringManifest], { type: 'application/manifest+json' });
      manifestLink.href = URL.createObjectURL(blob);
    } catch (e) {
      console.debug('Dynamic manifest creation error:', e);
    }
  }, [
    settings.storeName, 
    settings.storeLogoUrl, 
    settings.storeTagline, 
    settings.heroTitle, 
    settings.heroSubtitle
  ]);

function hexToRgbString(hex: string, fallback: string = '236, 72, 153'): string {
  if (!hex || typeof hex !== 'string') return fallback;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
    return `${r}, ${g}, ${b}`;
  }
  if (cleanHex.length >= 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `${r}, ${g}, ${b}`;
  }
  return fallback;
}

  // Dynamic Theme Colors CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const primary = settings.themePrimaryColor || '#ec4899';
    const secondary = settings.themeSecondaryColor || '#a855f7';
    const accent = settings.themeAccentColor || '#f43f5e';
    const bg = settings.themeBgColor || '#090d16';

    const cleanBg = bg.replace('#', '');
    const r = parseInt(cleanBg.substring(0, 2), 16) || 0;
    const g = parseInt(cleanBg.substring(2, 4), 16) || 0;
    const b = parseInt(cleanBg.substring(4, 6), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const isLightByBrightness = brightness > 140;
    const isLight = isLightByBrightness || settings.themeMode === 'light';
    const textColor = settings.themeTextColor || (isLight ? '#0f172a' : '#f8fafc');
    const iconColor = settings.themeIconColor || (isLight ? '#0f172a' : '#f8fafc');

    const cardBg = isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.88)';
    const cardBorder = isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.55)';
    const innerBg = isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.65)';
    const subtext = isLight ? '#64748b' : '#94a3b8';

    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-primary-rgb', hexToRgbString(primary, '236, 72, 153'));
    root.style.setProperty('--theme-secondary', secondary);
    root.style.setProperty('--theme-secondary-rgb', hexToRgbString(secondary, '168, 85, 247'));
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-accent-rgb', hexToRgbString(accent, '244, 63, 94'));
    root.style.setProperty('--theme-bg', bg);
    root.style.setProperty('--theme-text', textColor);
    root.style.setProperty('--theme-icon', iconColor);
    root.style.setProperty('--theme-card-bg', cardBg);
    root.style.setProperty('--theme-card-border', cardBorder);
    root.style.setProperty('--theme-inner-bg', innerBg);
    root.style.setProperty('--theme-subtext', subtext);

    document.body.style.backgroundColor = bg;
    document.body.style.color = textColor;

    if (isLight) {
      root.classList.add('light-theme', 'light');
      root.classList.remove('dark-theme', 'dark');
    } else {
      root.classList.remove('light-theme', 'light');
      root.classList.add('dark-theme', 'dark');
    }
  }, [settings.themePrimaryColor, settings.themeSecondaryColor, settings.themeAccentColor, settings.themeBgColor, settings.themeTextColor, settings.themeIconColor, settings.themeMode]);

  // Pull data directly from Google Sheets for all sheets
  const pullDataFromGoogleSheets = async (showNotification = false) => {
    if (!settings?.googleAppsScriptUrl || !settings.googleAppsScriptUrl.trim().startsWith('http')) {
      if (isFirstLoad.current) {
        setIsGlobalLoading(false);
        isFirstLoad.current = false;
        setTimeout(() => setShowOfferAnnouncement(true), 500);
      }
      return;
    }

    if (isFirstLoad.current) {
      setGlobalLoadingMessage('تحميل العروضات الجديده...');
    }

    setSyncStatus('syncing');
    try {
      const res = await fetchDataFromGoogleSheets(settings.googleAppsScriptUrl);
      if (res.success) {
        if (Array.isArray(res.products)) {
          setProducts(res.products);
          saveLocalProducts(res.products);
        }
        if (res.settings && Object.keys(res.settings).length > 0) {
          setSettings(prev => {
            const merged = { ...prev, ...res.settings };
            saveLocalSettings(merged);
            return merged;
          });
        }
        if (Array.isArray(res.employees)) {
          setEmployees(res.employees);
          saveLocalEmployees(res.employees);
        }
        if (Array.isArray(res.categories)) {
          setCategories(res.categories);
          saveLocalCategories(res.categories);
        }
        if (Array.isArray(res.orders)) {
          setOrders(res.orders);
          saveLocalOrders(res.orders);
        }
        if (Array.isArray(res.customers)) {
          setCustomers(res.customers);
          saveLocalCustomers(res.customers);
        }
        if (Array.isArray(res.currencies)) {
          setCurrencies(res.currencies);
        }
        if (Array.isArray(res.offers)) {
          setOffers(res.offers);
          saveLocalOffers(res.offers);
        }
        if (Array.isArray(res.coupons)) {
          setCoupons(res.coupons);
          saveLocalCoupons(res.coupons);
        }
        if (Array.isArray(res.suppliers)) {
          setSuppliers(res.suppliers);
          saveLocalSuppliers(res.suppliers);
        }
        if (Array.isArray(res.invoices)) {
          setInvoices(res.invoices);
          saveLocalInvoices(res.invoices);
        }
        if (Array.isArray(res.auditLogs)) {
          setAuditLogs(res.auditLogs);
          saveLocalAuditLogs(res.auditLogs);
        }
        if (Array.isArray(res.affiliates)) {
          setPartners(res.affiliates);
          saveLocalReferralPartners(res.affiliates);
        }
        setSyncStatus('synced');
        if (showNotification) {
          addNotification('📊 Google Sheets', `تم جلب وتحديث كافة البيانات والعملات والعروض وإعدادات المتجر والمسوقين من الأكسل!`, 'sync');
        }
      } else {
        setSyncStatus('error');
        if (showNotification) {
          addNotification('⚠️ خطأ في الربط', res.message || 'تعذر جلب البيانات من شيت جوجل', 'warning');
        }
      }
    } catch (err: any) {
      console.error('Failed to pull data from Google Sheets:', err);
      setSyncStatus('error');
      if (showNotification) {
        addNotification('❌ خطأ في الاتصال', 'تعذر الاتصال بجدول Google Sheets', 'warning');
      }
    } finally {
      if (isFirstLoad.current) {
        setIsGlobalLoading(false);
        isFirstLoad.current = false;
        setTimeout(() => setShowOfferAnnouncement(true), 500); // Show offer modal after loading
      }
    }
  };

  // Trigger manual smart sync directly with Google Sheets Web App for ALL sheets (Safe PULL from Google Sheets)
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        await pullDataFromGoogleSheets(true);
      } else {
        setSyncStatus('synced');
        addNotification(
          '💾 مزامنة التخزين المحلي',
          'تم حفظ كافة البيانات والمنتجات في التخزين المحلي المحمي بنجاح!',
          'sync'
        );
      }
    } catch (e: any) {
      console.error('Google Sheets sync error:', e);
      setSyncStatus('error');
      addNotification('❌ خطأ في المزامنة', e.message || 'فشلت المزامنة مع جوجل شيت', 'warning');
    } finally {
      setIsSyncing(false);
      setAuditLogs(getLocalAuditLogs());
    }
  };

  // Auto-sync & live poller on app load / browser refresh: Wait for initial fetch to finish before removing loader
  useEffect(() => {
    // Safety fallback timer (10s) in case network is disconnected or server takes too long
    const safetyFallbackTimer = setTimeout(() => {
      if (isFirstLoad.current) {
        console.warn('Sync timeout reached, displaying store with local cache.');
        setIsGlobalLoading(false);
        isFirstLoad.current = false;
        setShowOfferAnnouncement(true);
      }
    }, 10000);

    if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      pullDataFromGoogleSheets(false);
      const interval = setInterval(() => {
        pullDataFromGoogleSheets(false);
      }, 15000);
      return () => {
        clearTimeout(safetyFallbackTimer);
        clearInterval(interval);
      };
    } else {
      if (isFirstLoad.current) {
        setIsGlobalLoading(false);
        isFirstLoad.current = false;
        setShowOfferAnnouncement(true);
      }
      return () => clearTimeout(safetyFallbackTimer);
    }
  }, [settings?.googleAppsScriptUrl]);


  const handleRateProduct = async (productId: string, ratingValue: number) => {
    let updatedProduct: Product | undefined;
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.ProductID === productId) {
          const currentCount = p.ratingCount || (p.ratings && p.ratings.length > 0 ? p.ratings.length : (p.rating ? 1 : 0));
          const currentRating = p.rating || (p.ratings && p.ratings.length > 0 ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) : 5);
          const newCount = currentCount + 1;
          const newRating = Number(((currentRating * currentCount + ratingValue) / newCount).toFixed(1));
          
          updatedProduct = {
            ...p,
            rating: newRating,
            ratingCount: newCount,
            ratings: [...(p.ratings || []), ratingValue]
          };
          return updatedProduct;
        }
        return p;
      });
      saveLocalProducts(updatedList);
      return updatedList;
    });

    if (updatedProduct) {
      addNotification('⭐ شُكراً لتقييمك!', `تم إضافة تقييمك للمنتج "${updatedProduct.name}" بنجاح (${ratingValue} نجوم)`, 'info');
      
      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        await executeUnifiedSheetsOperation({
          action: 'save_product',
          payload: { 
            product: updatedProduct
          },
          entityName: `تقييم المنتج "${updatedProduct.name}"`,
          operationType: 'تحديث التقييم',
          webAppUrl: settings.googleAppsScriptUrl,
          setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
          showToast: addNotification,
          onSuccess: () => pullDataFromGoogleSheets(false)
        });
      }
    }
  };

  // Add Product to Cart
  const handleAddToCart = (product: Product, size: string = 'M', color: string = 'افتراضي', qty: number = 1) => {
    const discountedPrice = product.salePrice * (1 - (product.discount || 0) / 100);

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productID === product.ProductID && item.size === size && item.color === color);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }
      return [...prev, {
        productID: product.ProductID,
        productName: product.name,
        price: discountedPrice,
        quantity: qty,
        image: product.images[0] || '',
        size,
        color
      }];
    });

    if (quickViewProduct) setQuickViewProduct(null);
  };

  // Place Order & Create ZATCA Invoice
  const handlePlaceOrder = (orderData: Partial<Order>): { order: Order; invoice: Invoice } => {
    if (settings?.planMaxOrders && settings.planMaxOrders > 0 && orders.length >= settings.planMaxOrders) {
      alert(`عذراً، تم الوصول للحد الأقصى المسموح به للطلبات في الباقة الحالية (${settings.planMaxOrders} طلب).\n\nممنوع استقبال طلبات جديدة! يرجى التواصل مع إدارة المتجر لترقية الباقة وتوسيع السعة.`);
      throw new Error(`تم الوصول للحد الأقصى للطلبات (${settings.planMaxOrders} طلب).`);
    }
    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    const isLocal = (orderData.orderType === 'local');
    const orderPrefix = isLocal ? 'LOC' : 'SHN';
    const orderNum = `${orderPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentDate = new Date().toLocaleString('ar-SA');

    const newOrder: Order = {
      OrderID: orderId,
      orderNumber: orderNum,
      customerName: orderData.customerName || 'عميل المتجر',
      phone: orderData.phone || '0500000000',
      country: orderData.country || 'SA',
      city: orderData.city || 'الرياض',
      address: orderData.address || 'العنوان الرئيسي',
      orderType: orderData.orderType || 'local',
      items: orderData.items || [],
      totalQuantity: orderData.totalQuantity || 1,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
      shippingFee: orderData.shippingFee || 0,
      totalAmount: orderData.totalAmount || 0,
      orderStatus: 'pending',
      paymentStatus: 'paid',
      paymentMethod: orderData.paymentMethod || 'مدى (Mada)',
      employeeName: 'المتجر الإلكتروني',
      date: currentDate,
      syncedToSheets: false
    };

    const newInvoice: Invoice = {
      InvoiceID: `INV-${orderId}`,
      invoiceNumber: `INV-${orderNum}`,
      customerName: newOrder.customerName,
      taxNumber: settings.taxNumber,
      itemsSummary: newOrder.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
      taxAmount: newOrder.tax,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      orderType: newOrder.orderType,
      city: newOrder.city,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Invoice:${orderNum}|Tax:${settings.taxNumber}|Total:${newOrder.totalAmount}`)}`,
      employeeName: 'المتجر الإلكتروني',
      date: currentDate
    };

    // Update Local States
    setOrders(prev => [newOrder, ...prev]);
    setInvoices(prev => [newInvoice, ...prev]);

    // Auto register or update customer in customers list with auto registration date
    const cleanOrderPhone = (newOrder.phone || '').trim();
    setCustomers(prev => {
      const existingIdx = prev.findIndex(c => c.phone.replace(/[^0-9]/g, '') === cleanOrderPhone.replace(/[^0-9]/g, ''));
      const todayStr = new Date().toISOString().slice(0, 10);
      let updatedList = [...prev];
      if (existingIdx >= 0) {
        const existing = updatedList[existingIdx];
        updatedList[existingIdx] = {
          ...existing,
          name: newOrder.customerName || existing.name,
          city: newOrder.city || existing.city,
          address: newOrder.address || existing.address,
          totalOrders: (existing.totalOrders || 0) + 1,
          totalSpent: (existing.totalSpent || 0) + newOrder.totalAmount,
          lastOrderDate: todayStr
        };
      } else {
        const newCust: Customer = {
          CustomerID: `CUS_${Date.now()}`,
          name: newOrder.customerName || 'عميل المتجر',
          phone: newOrder.phone || '',
          email: '',
          city: newOrder.city || 'الرياض',
          address: newOrder.address || '',
          taxNumber: '',
          balance: 0,
          loyaltyPoints: 100,
          createdAt: todayStr,
          totalOrders: 1,
          totalSpent: newOrder.totalAmount,
          lastOrderDate: todayStr
        };
        updatedList = [newCust, ...updatedList];
      }
      return updatedList;
    });

    // Auto sync order & customers to Google Sheets if web app URL is present
    if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
        action: 'save_order',
        order: newOrder
      }).then(res => {
        if (res.success) {
          addNotification('📊 Google Sheets', `تم تسجيل الطلب #${newOrder.orderNumber} في جدول Google Sheets!`, 'sync');
        }
      }).catch(err => console.error('Google Sheets order sync failed:', err));
    }

    addAuditLog('العميل', 'إنشاء طلب فرعي', `طلب جديد رقم ${orderNum} بقيمة ${newOrder.totalAmount} ر.س`);

    // Record Referral Affiliate Commission if an active referral was tracked
    try {
      const activeRef = localStorage.getItem('active_referral_code');
      if (activeRef) {
        recordReferralOrder(activeRef, newOrder.totalAmount, settings.referralBonusAmount || 25);
      }
    } catch (e) {
      console.error('Error tracking referral commission', e);
    }

    // WhatsApp Message trigger
    const targetPhone = '966531093972';
    const waText = `🛍️ *طلب جديد رقم ${orderNum}*
------------------------------
👤 *العميل:* ${newOrder.customerName}
📱 *الهاتف:* ${newOrder.phone}
📍 *العنوان والمدينة:* ${newOrder.city} - ${newOrder.address}
💳 *طريقة الدفع:* ${newOrder.paymentMethod}
------------------------------
📦 *المنتجات:*
${newInvoice.itemsSummary}
------------------------------
💵 *الإجمالي النهائي:* ${(Number(newOrder.totalAmount) || 0).toFixed(2)} ${selectedCurrency?.symbol || 'ر.س'}
------------------------------
🌐 *موقع المتجر:* ${window.location.origin}`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`;
    
    // Automatically open WhatsApp in new tab for developer/store confirmation
    try {
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.log('WhatsApp popup blocked', e);
    }

    // Trigger Notification Toast and Audio Sound
    addNotification(
      '🛍️ طلب جديد جديد وصل!',
      `تم استلام طلب جديد رقم ${orderNum} من ${newOrder.customerName} بقيمة ${(Number(newOrder.totalAmount) || 0).toFixed(2)} ر.س`,
      'order'
    );
    
    // Show offer modal after checkout success
    setTimeout(() => setShowOfferAnnouncement(true), 2000);

    return { order: newOrder, invoice: newInvoice };
  };

  // Product Admin Operations
  // Product Admin Operations
  const handleAddProduct = async (p: Product) => {
    if (settings?.planMaxProducts && settings.planMaxProducts > 0 && products.length >= settings.planMaxProducts) {
      alert(`عذراً، وصل المتجر للحد الأقصى المسموح به للمنتجات في باقته الحالية (${settings.planMaxProducts} منتج).\n\nممنوع الإضافة! يرجى التواصل مع إدارة المتجر/المنصة لترقية الباقة والتوسع.`);
      return;
    }

    const rawImages = Array.isArray(p.images) ? p.images : [];
    const col1 = rawImages[0] !== undefined ? String(rawImages[0]).trim() : '';
    const col2 = rawImages[1] !== undefined ? String(rawImages[1]).trim() : '';
    const cleanImages = [col1, col2];

    const nowIso = new Date().toISOString();
    const cleanProduct: Product = {
      ...p,
      images: cleanImages,
      createdAt: p.createdAt || nowIso,
      updatedAt: nowIso
    };

    // ⚡ Instant Local Save (Optimistic UI - 0ms delay)
    setProducts(prev => {
      const newList = [cleanProduct, ...prev];
      saveLocalProducts(newList);
      return newList;
    });
    addAuditLog('مدير النظام', 'إضافة منتج', `تم إضافة المنتج ${cleanProduct.name}`);

    const hasSheet = Boolean(settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'));
    if (hasSheet && isOnline) {
      setSyncStatus('syncing');
      
      // Asynchronous background sync - non-blocking!
      sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
        action: 'save_product',
        product: cleanProduct
      }).then(res => {
        if (res.success) {
          setSyncStatus('synced');
          addNotification('📊 Google Sheets', `تم حفظ المنتج "${cleanProduct.name}" في شيت جوجل بنجاح!`, 'sync');
        } else {
          setSyncStatus('error');
          addNotification('⚠️ تنبيه المزامنة', res.message || 'تم الحفظ محلياً فقط', 'warning');
        }
      }).catch(() => {
        setSyncStatus('error');
        addNotification('❌ تنبيه المزامنة', 'تعذر الاتصال بـ Google Sheets، تم الحفظ محلياً', 'warning');
      });
    } else {
      setSyncStatus('synced');
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    if (!updated || !updated.ProductID) return;

    // Unique slot identifiers for image tracking
    const existingProd = products.find(p => p.ProductID === updated.ProductID);
    const existingImgs = Array.isArray(existingProd?.images) ? existingProd.images : [];
    const updatedImgs = Array.isArray(updated.images) ? updated.images : [];

    // Primary & Secondary Image slots
    const slot1 = updatedImgs.length > 0 ? String(updatedImgs[0] || '').trim() : (existingImgs[0] ? String(existingImgs[0]).trim() : '');
    const slot2 = updatedImgs.length > 1 ? String(updatedImgs[1] || '').trim() : '';

    const finalImages = [slot1, slot2];

    const nowIso = new Date().toISOString();
    const fixedCreatedAt = existingProd?.createdAt || updated.createdAt || nowIso;

    const cleanUpdated: Product = {
      ...updated,
      images: finalImages,
      createdAt: fixedCreatedAt,
      updatedAt: nowIso
    };

    // ⚡ Instant Local Save (Optimistic UI - 0ms delay)
    setProducts(prev => {
      const updatedList = prev.map(p => p.ProductID === cleanUpdated.ProductID ? cleanUpdated : p);
      saveLocalProducts(updatedList);
      return updatedList;
    });

    addAuditLog('مدير النظام', 'تعديل منتج', `تم تعديل بيانات المنتج ${cleanUpdated.name} (SKU: ${cleanUpdated.SKU})`);

    const hasSheet = Boolean(settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'));
    if (hasSheet && isOnline) {
      setSyncStatus('syncing');
      
      // Asynchronous background sync - non-blocking!
      sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
        action: 'save_product',
        product: cleanUpdated,
        imageSlots: {
          slot0: { id: `IMG_${cleanUpdated.ProductID}_SLOT_0`, url: slot1 },
          slot1: { id: `IMG_${cleanUpdated.ProductID}_SLOT_1`, url: slot2 }
        }
      }).then(res => {
        if (res.success) {
          setSyncStatus('synced');
          addNotification('📊 Google Sheets', `تم تحديث المنتج "${cleanUpdated.name}" في شيت جوجل بنجاح!`, 'sync');
        } else {
          setSyncStatus('error');
          addNotification('⚠️ تنبيه المزامنة', res.message || 'تم الحفظ محلياً فقط', 'warning');
        }
      }).catch(() => {
        setSyncStatus('error');
        addNotification('❌ تنبيه المزامنة', 'تعذر الاتصال بـ Google Sheets، تم الحفظ محلياً', 'warning');
      });
    } else {
      setSyncStatus('synced');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const targetProd = products.find(p => p.ProductID === id || p.SKU === id);
    const targetSku = targetProd?.SKU || id;

    // ⚡ Instant Local Delete (Optimistic UI - 0ms delay)
    setProducts(prev => {
      const filtered = prev.filter(p => p.ProductID !== id && p.SKU !== id);
      saveLocalProducts(filtered);
      return filtered;
    });
    addAuditLog('مدير النظام', 'حذف منتج', `تم حذف المنتج رقم/SKU: ${targetSku}`);

    const hasSheet = Boolean(settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'));
    if (hasSheet && isOnline) {
      setSyncStatus('syncing');
      
      // Asynchronous background sync - non-blocking!
      sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
        action: 'delete_product',
        productId: id,
        sku: targetSku
      }).then(res => {
        if (res.success) {
          setSyncStatus('synced');
          addNotification('🗑️ Google Sheets', 'تم حذف المنتج من ورقة الأكسل بنجاح!', 'sync');
        } else {
          setSyncStatus('error');
          addNotification('⚠️ تنبيه المزامنة', res.message || 'تم الحذف محلياً فقط', 'warning');
        }
      }).catch(() => {
        setSyncStatus('error');
        addNotification('❌ تنبيه المزامنة', 'تعذر الاتصال بـ Google Sheets، تم الحفظ محلياً', 'warning');
      });
    } else {
      setSyncStatus('synced');
    }
  };

  const handleBatchImportProducts = async (imported: Product[]) => {
    if (!imported || imported.length === 0) return;

    if (settings?.planMaxProducts && settings.planMaxProducts > 0) {
      if (products.length + imported.length > settings.planMaxProducts) {
        alert(`عذراً، استيراد ${imported.length} منتج جديد سيتجاوز الحد الأقصى للباقة الحالية (${settings.planMaxProducts} منتج).\nلديك حالياً ${products.length} منتج.\n\nيرجى تقليل عدد المنتجات المستوردة أو التواصل مع إدارة المتجر لترقية الباقة.`);
        return;
      }
    }

    const hasSheet = Boolean(settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'));

    if (hasSheet) {
      const isAlive = await pingGoogleAppsScript(settings.googleAppsScriptUrl);
      if (!isAlive && !isOnline) {
        addNotification(
          '❌ فشل الاتصال بجداول Google Sheets',
          'تعذر التحقق من الاتصال بالسكربت السحابي. تم إيقاف الاستيراد الجماعي للمنتجات لمنع فقدان البيانات أو تعارضها.',
          'warning'
        );
        setSyncStatus('error');
        return;
      }
    }

    setSyncStatus('syncing');

    // 1. Auto-create missing categories
    const existingCatNames = new Set(categories.map(c => c.name.trim().toLowerCase()));
    const newCatNames = new Set<string>();

    imported.forEach(p => {
      if (p.category && p.category.trim()) {
        const trimmedCat = p.category.trim();
        if (!existingCatNames.has(trimmedCat.toLowerCase())) {
          newCatNames.add(trimmedCat);
        }
      }
    });

    const newCreatedCategories: Category[] = [];
    if (newCatNames.size > 0) {
      let idx = 0;
      newCatNames.forEach(catName => {
        idx++;
        const newCat: Category = {
          CategoryID: `CAT_AUTO_${Date.now()}_${idx}`,
          name: catName,
          image: DEFAULT_PRODUCT_IMAGE,
          description: 'فئة مضافة تلقائياً عبر استيراد الإكسل'
        };
        newCreatedCategories.push(newCat);
        existingCatNames.add(catName.toLowerCase());
      });

      setCategories(prev => {
        const updatedCats = [...prev, ...newCreatedCategories];
        saveLocalCategories(updatedCats);
        return updatedCats;
      });
    }

    // 2. Strict SKU-Based Upsert & Multi-Image Handling (Max 2 images per product)
    let newProductsCount = 0;
    let updatedProductsCount = 0;
    let finalProductsList: Product[] = [];

    setProducts(prev => {
      const mergedMap = new Map<string, Product>();
      const skuToId = new Map<string, string>();
      const idToId = new Map<string, string>();
      const orderKeys: string[] = [];

      prev.forEach((p, idx) => {
        if (!p) return;
        const validId = p.ProductID || `PRD_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
        const sanitized = { ...p, ProductID: validId };
        mergedMap.set(validId, sanitized);
        orderKeys.push(validId);

        if (sanitized.SKU && sanitized.SKU.trim()) {
          skuToId.set(sanitized.SKU.trim().toLowerCase(), validId);
        }
        if (sanitized.ProductID && sanitized.ProductID.trim()) {
          idToId.set(sanitized.ProductID.trim().toLowerCase(), validId);
        }
      });

      imported.forEach((impProduct, idx) => {
        if (!impProduct) return;
        const impSku = (impProduct.SKU || '').trim().toLowerCase();
        const impId = (impProduct.ProductID || '').trim().toLowerCase();

        const matchId = (impSku && skuToId.get(impSku)) || (impId && idToId.get(impId));

        // Process and limit images to max 2
        const processedImages = Array.isArray(impProduct.images) && impProduct.images.length > 0
          ? impProduct.images.slice(0, 2)
          : [DEFAULT_PRODUCT_IMAGE];

        if (matchId && mergedMap.has(matchId)) {
          // Update existing product cleanly (UPSERT)
          updatedProductsCount++;
          const existing = mergedMap.get(matchId)!;
          const merged: Product = {
            ...existing,
            ...impProduct,
            ProductID: existing.ProductID,
            SKU: impProduct.SKU || existing.SKU,
            createdAt: existing.createdAt || impProduct.createdAt || new Date().toISOString(),
            images: processedImages
          };
          mergedMap.set(matchId, merged);
        } else {
          // Add brand new product with guaranteed unique ProductID
          newProductsCount++;
          const newId = impProduct.ProductID && !mergedMap.has(impProduct.ProductID)
            ? impProduct.ProductID
            : `PRD_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
          const newSku = impProduct.SKU || `SKU-${Date.now()}-${idx}`;

          const newProd: Product = {
            ...impProduct,
            ProductID: newId,
            SKU: newSku,
            images: processedImages
          };

          mergedMap.set(newId, newProd);
          orderKeys.unshift(newId);

          if (newSku) skuToId.set(newSku.trim().toLowerCase(), newId);
          idToId.set(newId.trim().toLowerCase(), newId);
        }
      });

      const updatedProducts = orderKeys.map(k => mergedMap.get(k)!).filter(Boolean);
      saveLocalProducts(updatedProducts);
      finalProductsList = updatedProducts;
      return updatedProducts;
    });

    // Auto-sync batch import to Google Sheets
    if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      try {
        const res = await sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl, {
          action: 'sync_all',
          products: finalProductsList.length > 0 ? finalProductsList : imported
        });

        if (res.success) {
          setSyncStatus('synced');
          addNotification('📊 Google Sheets', 'تمت مزامنة كافة المنتجات المستوردة مع صورها إلى جدول جوجل فورياً!', 'sync');
          pullDataFromGoogleSheets(false);
        } else {
          setSyncStatus('error');
          addNotification('⚠️ تنبيه المزامنة', res.message, 'warning');
        }
      } catch (err: any) {
        setSyncStatus('error');
        addNotification('❌ خطأ في الربط', err.message || 'فشلت مزامنة الدفعة مع أكسل جوجل', 'warning');
      }
    } else {
      setSyncStatus('synced');
    }

    addAuditLog(
      'مدير النظام',
      'استيراد إكسل المحترف',
      `تم استيراد ومزامنة ${imported.length} منتج (إضافة ${newProductsCount} جديد، تحديث ${updatedProductsCount} سابق، إنشاء ${newCreatedCategories.length} فئة جديدة تلقائياً)`
    );

    addNotification(
      '📊 مزامنة إكسل ناجحة',
      `تمت المزامنة بنجاح: إضافة ${newProductsCount} منتج جديد، تحديث ${updatedProductsCount} منتج، وإنشاء ${newCreatedCategories.length} فئة تلقائياً!`,
      'sync'
    );
  };

  // WhatsApp Automated Shipping Notification Helper
  const sendCustomerShippedWhatsApp = (order: Order) => {
    const storeTitle = settings?.storeName || 'متجرنا';
    const trackingNum = order.trackingNumber || 'قيد الاستخراج من شركة الشحن';
    const shippingCo = order.shippingCompany || 'شركة الشحن والتوصيل';
    const trackingUrl = order.trackingNumber ? getTrackingUrl(order.shippingCompany, order.trackingNumber) : '';

    let waMessage = `✨ مرحباً بك عزيزي العميل *${order.customerName}* 🌸\n\n` +
      `🚚 *يسرنا إبلاغك بأنه تم شحن وتجهيز طلبك بنجاح من متجر ${storeTitle}!*\n\n` +
      `📦 *رقم الطلب:* #${order.orderNumber}\n` +
      `🏢 *شركة الشحن:* ${shippingCo}\n` +
      `🔢 *رقم التتبع (Tracking Number):* ${trackingNum}\n`;

    if (trackingUrl && order.trackingNumber) {
      waMessage += `🌐 *رابط التتبع المباشر:* ${trackingUrl}\n`;
    }

    waMessage += `\n💵 *إجمالي المبلغ:* ${(Number(order.totalAmount) || 0).toFixed(2)} ر.س\n\n` +
      `نشكرك على ثقتك وتسوقك معنا، ونسعد دائماً بخدمتك! ❤️`;

    let phone = (order.phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('05')) {
      phone = `966${phone.slice(1)}`;
    } else if (phone.startsWith('7') && phone.length === 9) {
      phone = `967${phone}`;
    }

    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.warn('WhatsApp auto-open popup blocked:', e);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    let targetOrder: Order | undefined;
    let updatedList: Order[] = [];
    setOrders(prev => {
      updatedList = prev.map(o => {
        if (o.OrderID === orderId) {
          targetOrder = { ...o, orderStatus: status };
          return targetOrder;
        }
        return o;
      });
      saveLocalOrders(updatedList);
      return updatedList;
    });

    if (targetOrder) {
      const statusLabels: Record<string, string> = {
        pending: '⏳ قيد الانتظار',
        processing: '📦 جاري التجهيز والإعداد',
        shipped: '🚚 تم الشحن وتسليم الشحنة لشركة النقل',
        delivered: '✅ تم توصيل الطلب بنجاح',
        cancelled: '❌ تم إلغاء الطلب'
      };
      const label = statusLabels[status] || status;

      addNotification(
        '🔔 إشعار حالة الطلب',
        `تم تحديث حالة طلب العميل ${targetOrder.customerName} (#${targetOrder.orderNumber}) إلى: ${label}`,
        'order'
      );

      logAudit('مدير النظام', 'تحديث حالة طلب', `تحديث حالة الطلب ${targetOrder.orderNumber} إلى ${status}`);

      // Automated WhatsApp message to customer when status changes to 'shipped'
      if (status === 'shipped') {
        sendCustomerShippedWhatsApp(targetOrder);
      }

      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        await executeUnifiedSheetsOperation({
          action: 'save_order_status',
          payload: { 
            orderId: orderId,
            status: status,
            orders: updatedList
          },
          entityName: `حالة الطلب #${targetOrder.orderNumber}`,
          operationType: 'تحديث',
          webAppUrl: settings.googleAppsScriptUrl,
          setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
          showToast: addNotification,
          onSuccess: () => pullDataFromGoogleSheets(false)
        });
      }
    }
  };

  const handleToggleOrderPricesFinished = async (orderId: string) => {
    let targetOrder: Order | undefined;
    let updatedList: Order[] = [];
    setOrders(prev => {
      updatedList = prev.map(o => {
        if (o.OrderID === orderId) {
          targetOrder = { ...o, pricesFinished: !o.pricesFinished };
          return targetOrder;
        }
        return o;
      });
      saveLocalOrders(updatedList);
      return updatedList;
    });

    if (targetOrder) {
      const isFinished = targetOrder.pricesFinished;
      addNotification(
        '💰 تسوية أسعار الطلب',
        `تم ${isFinished ? 'إنهاء واعتماد' : 'إعادة فتح'} أسعار طلب العميل ${targetOrder.customerName} (#${targetOrder.orderNumber}) بنجاح`,
        'order'
      );

      logAudit('مدير النظام', 'تحديث حالة تسعير طلب', `تم ${isFinished ? 'إنهاء' : 'فتح'} الأسعار للطلب ${targetOrder.orderNumber}`);

      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        await executeUnifiedSheetsOperation({
          action: 'save_order_status',
          payload: { 
            orderId: orderId,
            pricesFinished: isFinished,
            orders: updatedList
          },
          entityName: `تسعير الطلب #${targetOrder.orderNumber}`,
          operationType: 'تحديث',
          webAppUrl: settings.googleAppsScriptUrl,
          setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
          showToast: addNotification,
          onSuccess: () => pullDataFromGoogleSheets(false)
        });
      }
    }
  };

  const handleUpdateOrderTracking = async (orderId: string, trackingNumber: string, shippingCompany?: string) => {
    let targetOrder: Order | undefined;
    let updatedList: Order[] = [];
    setOrders(prev => {
      updatedList = prev.map(o => {
        if (o.OrderID === orderId) {
          targetOrder = { ...o, trackingNumber, shippingCompany };
          return targetOrder;
        }
        return o;
      });
      saveLocalOrders(updatedList);
      return updatedList;
    });

    if (targetOrder) {
      addNotification(
        '🚚 تحديث تتبع الشحنة',
        `تم إضافة رقم تتبع (${trackingNumber}) للطلب #${targetOrder.orderNumber}`,
        'order'
      );
      logAudit('مدير النظام', 'تحديث تتبع الشحن', `تحديث رقم التتبع للطلب ${targetOrder.orderNumber}: ${trackingNumber} (${shippingCompany || 'شركة شحن'})`);

      // If already shipped, re-send or trigger notification with new tracking info
      if (targetOrder.orderStatus === 'shipped') {
        sendCustomerShippedWhatsApp(targetOrder);
      }

      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        await executeUnifiedSheetsOperation({
          action: 'save_order_status',
          payload: { 
            orderId: orderId,
            trackingNumber: trackingNumber,
            shippingCompany: shippingCompany || 'شركة شحن',
            orders: updatedList
          },
          entityName: `رقم تتبع الطلب #${targetOrder.orderNumber}`,
          operationType: 'تحديث',
          webAppUrl: settings.googleAppsScriptUrl,
          setLoadingState: (loading) => setSyncStatus(loading ? 'syncing' : 'synced'),
          showToast: addNotification,
          onSuccess: () => pullDataFromGoogleSheets(false)
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-main font-sans dir-rtl select-none relative transition-colors">
      
      {/* Global Blocking Loader */}
      {isGlobalLoading && (
        <BlockingLoader message={globalLoadingMessage} />
      )}

      {/* Welcome & Special Offers Announcement */}
      <OfferAnnouncementModal 
        isOpen={showOfferAnnouncement}
        onClose={() => setShowOfferAnnouncement(false)}
        offers={offers}
      />

      {/* Storefront Mode View */}
      {viewMode === 'store' && (
        <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
          <Navbar
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAdmin={handleOpenAdmin}
            onOpenCatalog={() => setShowCatalogModal(true)}
            onOpenReferral={() => setShowReferralModal(true)}
            onTriggerSync={handleTriggerSync}
            isSyncing={isSyncing}
            isOnline={isOnline}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={visibleCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedGroup={selectedGroup}
            setSelectedGroup={handleSelectGroup}
            settings={settings}
            themeMode={getCurrentThemeMode(settings)}
            onToggleTheme={handleToggleTheme}
            wishlistCount={wishlist.length}
            onOpenWishlist={() => {
              setIsWishlistOpen(true);
              setShowOfferAnnouncement(true);
            }}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenTracking={() => handleOpenTracking()}
            onOpenPolicies={() => handleOpenPolicies('verification')}
          />

          <main className="flex-1 max-w-full w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
            <StoreHome
              products={visibleProducts}
              categories={visibleCategories}
              offers={offers}
              currency={selectedCurrency}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedGroup={selectedGroup}
              setSelectedGroup={handleSelectGroup}
              onQuickView={(p) => setQuickViewProduct(p)}
              onAddToCart={(p) => handleAddToCart(p)}
              onShareProduct={(p) => setSharingProduct(p)}
              onOpenCatalog={() => setShowCatalogModal(true)}
              settings={settings}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onOpenTracking={() => handleOpenTracking()}
              onOpenPolicies={(tab) => handleOpenPolicies(tab || 'verification')}
              onRefreshStore={() => pullDataFromGoogleSheets(true)}
            />
          </main>

          {/* Navigation Drawer (SHEIN / Modern eCommerce Style) */}
          <NavigationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            products={products}
            categories={visibleCategories}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onOpenTracking={() => handleOpenTracking()}
            onOpenCatalog={() => setShowCatalogModal(true)}
            onOpenReferral={() => setShowReferralModal(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onOpenAdmin={handleOpenAdmin}
            settings={settings}
            wishlistCount={wishlist.length}
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
          />

          {/* Mobile Bottom Navigation Bar */}
          <BottomNavigationBar
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            cartTotal={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
            currency={selectedCurrency}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenCategories={() => setIsDrawerOpen(true)}
            onOpenTracking={() => handleOpenTracking()}
            onOpenSearch={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (searchInput) searchInput.focus();
            }}
            onGoHome={() => {
              setSelectedCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activeTab={selectedCategory === 'all' ? 'home' : 'categories'}
          />

          {/* Customer Order Tracking Modal */}
          <OrderTrackingModal
            isOpen={isTrackingModalOpen}
            onClose={() => {
              setIsTrackingModalOpen(false);
              setTrackingInitialOrderNum('');
            }}
            orders={orders}
            settings={settings}
            currency={selectedCurrency}
            initialOrderNumber={trackingInitialOrderNum}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />

          {/* Store Policies & Saudi Trust Modal */}
          <StorePoliciesModal
            isOpen={isPoliciesModalOpen}
            onClose={() => setIsPoliciesModalOpen(false)}
            initialTab={policiesInitialTab}
            settings={settings}
          />

          {/* Wishlist Modal */}
          <WishlistModal
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            wishlistIds={wishlist}
            products={products}
            currency={selectedCurrency}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
          />

          {/* Product Detail Modal */}
          <ProductDetailModal
            product={quickViewProduct}
            offers={offers}
            currency={selectedCurrency}
            onClose={() => setQuickViewProduct(null)}
            onAddToCart={handleAddToCart}
            onShareProduct={(p) => setSharingProduct(p)}
            onRateProduct={handleRateProduct}
          />

          {/* Product Social Share Modal */}
          <ProductShareModal
            product={sharingProduct}
            currency={selectedCurrency}
            isOpen={!!sharingProduct}
            onClose={() => setSharingProduct(null)}
            storePhone={settings?.storePhone}
            settings={settings}
          />

          {/* Missing/Deleted Product Direct Notification Modal */}
          <MissingProductModal
            isOpen={showMissingProductModal}
            onClose={() => setShowMissingProductModal(false)}
            onBrowseCatalog={() => setShowCatalogModal(true)}
          />

          {/* Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            setCart={setCart}
            coupons={coupons}
            offers={offers}
            currency={selectedCurrency}
            settings={settings}
            ordersCount={orders.length}
            onPlaceOrder={handlePlaceOrder}
            onOpenTracking={(orderNo) => handleOpenTracking(orderNo)}
          />

          {/* Floating Social Media Speed Dial Menu & AI Assistant Button */}
          <SocialLinksMenu
            socialLinks={settings?.socialLinks}
            storePhone={settings?.storePhone}
            settings={settings}
            currency={selectedCurrency}
            onOpenAI={() => setShowAIModal(true)}
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenCatalog={() => setShowCatalogModal(true)}
          />
        </div>
      )}

      {/* Admin Dashboard Mode View */}
      {viewMode === 'admin' && (
        <div className="h-screen flex flex-col bg-theme-bg text-theme-main overflow-hidden font-sans">
          <AdminNavbar
            onOpenStore={() => setViewMode('store')}
            onOpenAppsScriptModal={() => setShowAppsScriptModal(true)}
            onTriggerSync={handleTriggerSync}
            settings={settings}
            isOnline={isOnline}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            pendingCount={pendingQueue.length}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            themeMode={getCurrentThemeMode(settings)}
            onToggleTheme={handleToggleTheme}
          />

          <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center bg-theme-bg text-theme-main font-bold p-12 gap-3">
              <div className="w-10 h-10 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
              <span>جاري تحميل لوحة التحكم الذكية...</span>
            </div>
          }>
            <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 overflow-hidden">
            <AdminSidebar
              activeTab={adminTab}
              setActiveTab={setAdminTab}
              pendingSyncCount={pendingQueue.length}
              currentRole={currentRole}
              counts={{
                products: products.length,
                orders: orders.length,
                invoices: invoices.length,
                customers: customers.length,
                suppliers: suppliers.length,
                employees: employees.length,
                affiliates: partners.length,
                offers: offers.length,
                coupons: coupons.length,
                'audit-log': auditLogs.length,
              }}
            />

            <main className="flex-1 min-w-0 min-h-0 h-full p-3 sm:p-6 overflow-y-auto overflow-x-hidden bg-theme-bg text-theme-main scrollbar-thin">
              {/* Role Permission Guards */}
              {currentRole === 'Supplier' && adminTab !== 'products' && adminTab !== 'overview' ? (
                <div className="bg-theme-card border border-amber-500/30 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto my-12 text-theme-main">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
                    📦
                  </div>
                  <h3 className="text-lg font-bold text-theme-main">صلاحية المورد المحدودة</h3>
                  <p className="text-xs text-theme-subtext">كمورد، يحق لك الوصول حصراً لإدارة منتجاتك وتقاريرها فقط.</p>
                  <button
                    onClick={() => setAdminTab('products')}
                    className="px-5 py-2.5 bg-theme-gradient text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    الانتقال لإدارة المنتجات
                  </button>
                </div>
              ) : currentRole === 'Manager' && (adminTab === 'settings' || adminTab === 'sheets-sync' || adminTab === 'employees' || adminTab === 'audit-log') ? (
                <div className="bg-theme-card border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto my-12 text-theme-main">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
                    🛡️
                  </div>
                  <h3 className="text-lg font-bold text-theme-main">غير مصرح بالوصول (خاص بالسوبر أدمن)</h3>
                  <p className="text-xs text-theme-subtext">إعدادات النظام الربط البرمجي وإدارة الموظفين مقتصرة حصرياً على حساب السوبر أدمن.</p>
                  <button
                    onClick={() => setAdminTab('overview')}
                    className="px-5 py-2.5 bg-theme-gradient text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    العودة للوحة التحليلات
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={adminTab}
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.995 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                  >
                    {adminTab === 'overview' && (
                      <OverviewTab
                        products={products}
                        orders={orders}
                        invoices={invoices}
                        settings={settings}
                        employees={employees}
                        auditLogs={auditLogs}
                        onNavigateTab={setAdminTab}
                        onToggleOrderPricesFinished={handleToggleOrderPricesFinished}
                      />
                    )}

                    {adminTab === 'products' && (
                      <ProductsTab
                        products={products}
                        categories={categories}
                        settings={settings}
                        onAddProduct={handleAddProduct}
                        onUpdateProduct={handleUpdateProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onAddCategory={handleAddCategory}
                        onBatchImport={handleBatchImportProducts}
                      />
                    )}

                    {adminTab === 'excel' && (
                      <ExcelTab 
                        onBatchImport={handleBatchImportProducts} 
                        existingProducts={products}
                      />
                    )}

                    {adminTab === 'orders' && (
                      <OrdersTab
                        orders={orders}
                        invoices={invoices}
                        settings={settings}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                        onUpdateOrderTracking={handleUpdateOrderTracking}
                      />
                    )}

                    {adminTab === 'invoices' && (
                      <InvoicesTab invoices={invoices} settings={settings} />
                    )}

                    {adminTab === 'customers' && (
                      <CustomersTab
                        customers={customers}
                        onAddCustomer={handleAddCustomer}
                        onUpdateCustomer={handleUpdateCustomer}
                        onDeleteCustomer={handleDeleteCustomer}
                      />
                    )}

                    {adminTab === 'suppliers' && (
                      <SuppliersTab
                        suppliers={suppliers}
                        onAddSupplier={handleAddSupplier}
                        onUpdateSupplier={handleUpdateSupplier}
                        onDeleteSupplier={handleDeleteSupplier}
                        onBulkAddSuppliers={handleBulkAddSuppliers}
                      />
                    )}

                    {adminTab === 'employees' && (
                      <EmployeesTab
                        employees={employees}
                        orders={orders}
                        settings={settings}
                        onAddEmployee={handleAddEmployee}
                        onUpdateEmployee={handleUpdateEmployee}
                        onDeleteEmployee={handleDeleteEmployee}
                      />
                    )}

                    {adminTab === 'affiliates' && (
                      <AffiliatesTab
                        currency={selectedCurrency}
                        currencies={currencies}
                        settings={settings}
                        partners={partners}
                        orders={orders}
                        onAddPartner={handleAddPartner}
                        onUpdatePartner={handleUpdatePartner}
                        onDeletePartner={handleDeletePartner}
                        onPayoutPartner={handlePayoutPartner}
                        onLogAudit={logAudit}
                        onSyncSheets={handleTriggerSync}
                        isSyncing={isSyncing}
                      />
                    )}

                    {adminTab === 'offers' && (
                      <OffersTab
                        offers={offers}
                        onAddOffer={handleAddOffer}
                        onUpdateOffer={handleUpdateOffer}
                        onDeleteOffer={handleDeleteOffer}
                      />
                    )}

                    {adminTab === 'coupons' && (
                      <CouponsTab
                        coupons={coupons}
                        onAddCoupon={handleAddCoupon}
                        onDeleteCoupon={handleDeleteCoupon}
                      />
                    )}

                    {adminTab === 'settings' && (
                      <StoreSettingsTab
                        settings={settings}
                        onSaveSettings={handleSaveStoreSettings}
                        currencies={currencies}
                        categories={categories}
                        products={products}
                        orders={orders}
                        customers={customers}
                        suppliers={suppliers}
                        employees={employees}
                        offers={offers}
                        coupons={coupons}
                        invoices={invoices}
                        onRestoreBackup={handleRestoreBackup}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onToggleCategoryVisibility={handleToggleCategoryVisibility}
                        onToggleGroupVisibility={handleToggleGroupVisibility}
                        isSyncing={isSyncing}
                      />
                    )}

                    {adminTab === 'sheets-sync' && (
                      <SheetsSyncTab
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        currencies={currencies}
                        onUpdateCurrencies={handleUpdateCurrencies}
                        onOpenAppsScriptModal={() => setShowAppsScriptModal(true)}
                        onTriggerSync={handleTriggerSync}
                        isSyncing={isSyncing}
                        pendingCount={pendingQueue.length}
                        products={products}
                        logAudit={logAudit}
                        addNotification={addNotification}
                      />
                    )}

                    {adminTab === 'audit-log' && (
                      <AuditLogTab logs={auditLogs} onClearLogs={handleClearAuditLogs} isSyncing={isSyncing} />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </main>
          </div>
          </Suspense>
        </div>
      )}

      {/* Admin Lock Password Modal */}
      <AdminLockModal
        isOpen={showAdminLockModal}
        onClose={() => setShowAdminLockModal(false)}
        onSuccess={handleAdminUnlockSuccess}
        requiredPin={settings.adminPasswordHash || '2003'}
        employees={employees}
      />

      {/* AI Assistant Chat Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        products={products}
        currency={selectedCurrency}
        settings={settings}
        onSelectProduct={(p) => {
          setShowAIModal(false);
          setQuickViewProduct(p);
        }}
      />

      {/* Full Catalog Browser & Filter Modal */}
      <FullCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        products={products}
        categories={categories}
        currency={selectedCurrency}
        onQuickView={(p) => setQuickViewProduct(p)}
        onAddToCart={(p) => handleAddToCart(p)}
        onShareProduct={(p) => setSharingProduct(p)}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onOpenCart={() => {
          setShowCatalogModal(false);
          setIsCartOpen(true);
        }}
      />

      {/* Referral & Affiliate Rewards Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        currency={selectedCurrency}
        currencies={currencies}
        settings={settings}
        partners={partners}
        onRefreshPartners={() => setPartners(getLocalReferralPartners())}
      />

      {/* Google Apps Script Code Generator Modal */}
      <AppsScriptModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
        spreadsheetId={settings.spreadsheetId}
      />

      {/* Notifications Toast Stack & Browser Permission Banner */}
      <NotificationToastContainer
        notifications={notifications}
        onDismiss={handleDismissNotification}
        browserNotificationsEnabled={browserNotificationsEnabled}
        onRequestBrowserPermission={handleRequestBrowserPermission}
      />
    </div>
  );
}

export default App;
