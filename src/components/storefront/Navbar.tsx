import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Heart, 
  User, 
  Shield, 
  Wifi, 
  WifiOff, 
  Percent, 
  Tag,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Gift,
  RefreshCw,
  Download,
  Menu,
  Truck,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { CurrencyRate, Category, AppSettings } from '../../types';
import { getCurrentThemeMode, toggleThemeMode, applyThemeGlobal } from '../../lib/themeHelper';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  isOnline: boolean;
  currencies: CurrencyRate[];
  selectedCurrency: CurrencyRate;
  setSelectedCurrency: (c: CurrencyRate) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedGroup?: string;
  setSelectedGroup?: (grp: string) => void;
  settings?: AppSettings;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onOpenDrawer?: () => void;
  onOpenTracking?: () => void;
  onOpenPolicies?: () => void;
  onOpenCatalog?: () => void;
  onOpenReferral?: () => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps & { 
  onOpenCatalog?: () => void;
  onOpenReferral?: () => void;
}> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onTriggerSync,
  isSyncing = false,
  isOnline,
  currencies,
  selectedCurrency,
  setSelectedCurrency,
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedGroup = 'all',
  setSelectedGroup,
  settings,
  onOpenCatalog,
  onOpenReferral,
  wishlistCount = 0,
  onOpenWishlist,
  onOpenDrawer,
  onOpenTracking,
  onOpenPolicies,
  themeMode,
  onToggleTheme
}) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const currentThemeMode = themeMode || (typeof window !== 'undefined' ? (localStorage.getItem('store_theme_mode') as 'dark' | 'light') || settings?.themeMode || 'dark' : 'dark');
  const isDarkMode = currentThemeMode === 'dark';

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const nextMode = isDarkMode ? 'light' : 'dark';
      localStorage.setItem('store_theme_mode', nextMode);
      if (settings) {
        applyThemeGlobal({ ...settings, themeMode: nextMode });
      }
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    } else {
      alert('لتثبيت التطبيق على جهازك: انقر على قائمة المتصفح (النقاط الثلاث بالأعلى) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-theme-card/95 backdrop-blur-md border-b border-theme-card text-theme-main transition-colors shadow-md">
      {/* Top Ticker Bar (Saudi Verified & Special Discount) */}
      <div className="bg-theme-gradient text-white py-1.5 px-4 text-[11px] font-bold text-center flex items-center justify-between tracking-wide shadow-sm">
        <div className="hidden sm:flex items-center gap-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={onOpenPolicies}>
          <ShieldCheck className="w-3 h-3 text-emerald-300" />
          <span>متجر سعودي موثق | س.ت: {settings?.commercialRegisterNumber || '7033543294'}</span>
        </div>

        <span className="flex items-center justify-center gap-1 mx-auto">
          <Percent className="w-3.5 h-3.5" />
          {settings?.storeName ? `${settings.storeName}: ` : 'المتجر: '} خصم 20% لكافة الطلبات فوق 100 ر.س - كود: <u className="font-mono bg-white/20 px-1.5 py-0.5 rounded">SHEIN20</u>
        </span>

        {onOpenTracking && (
          <button 
            onClick={onOpenTracking}
            className="hidden md:flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full transition-all cursor-pointer"
          >
            <Truck className="w-3 h-3" />
            <span>تتبع شحنتك 🚚</span>
          </button>
        )}
      </div>

      {/* Main Bar */}
      <div className="max-w-full w-full mx-auto px-4 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left / Start: Drawer Toggle + Brand / Logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger Menu Toggle Button */}
          {onOpenDrawer && (
            <button
              onClick={onOpenDrawer}
              className="p-2 rounded-xl bg-theme-inner hover:bg-theme-primary/10 text-theme-main border border-theme-card hover:border-theme-primary transition-all cursor-pointer"
              title="فتح القائمة الرئيسية والأقسام"
            >
              <Menu className="w-4 h-4 text-theme-primary" />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedCategory('all')}>
            {settings?.storeLogoUrl && settings.storeLogoUrl.trim() ? (
              <img 
                src={settings.storeLogoUrl} 
                alt={settings?.storeName || 'شعار المتجر'} 
                className="h-10 sm:h-11 w-auto max-w-[130px] sm:max-w-[170px] object-contain rounded-xl bg-theme-inner p-1 border border-theme-primary shadow-md transition-transform hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}

            <div 
              className="logo-fallback items-center gap-2"
              style={{ display: settings?.storeLogoUrl && settings.storeLogoUrl.trim() ? 'none' : 'flex' }}
            >
              <span className="bg-theme-gradient text-white font-black text-xl sm:text-2xl tracking-tight px-3 py-0.5 rounded-xl shadow-md font-serif">
                {settings?.storeName ? settings.storeName.split(' ')[0] : 'رونق'}
              </span>
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider line-clamp-1 text-theme-main">
                {settings?.storeName || 'اوفالي'}
              </span>
              <span className="text-[9px] text-theme-primary font-medium hidden sm:block">
                {settings?.storeTagline || (settings?.storeAddress ? settings.storeAddress.slice(0, 30) : 'شريكك الأول للتسوق')}
              </span>
            </div>
          </div>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 max-w-sm relative hidden md:block">
          <Search className="w-4 h-4 text-theme-subtext absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتجات، فساتين، أزياء، عطور، كود SKU..."
            className="w-full bg-theme-inner border border-theme-card rounded-full text-xs text-theme-main placeholder:text-theme-subtext focus:outline-none focus:border-theme-primary pr-10 pl-4 py-2 transition-all shadow-inner"
          />
        </div>

        {/* Right Actions - Scrollable Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-[65vw] sm:max-w-none scrollbar-thin scrollbar-thumb-theme-card scrollbar-track-transparent">
          {/* Customer Order Tracking Button in Header */}
          {onOpenTracking && (
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1 bg-theme-inner hover:bg-theme-card text-sky-500 border border-sky-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:border-sky-400 cursor-pointer"
              title="تتبع مسار شحنتك وطلبك"
            >
              <Truck className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">تتبع طلبي</span>
            </button>
          )}

          {/* Referral Program Button */}
          {onOpenReferral && (() => {
            const yerCurrency = currencies.find(c => c.currencyCode === 'YER');
            const yerRate = yerCurrency?.exchangeRate || 142.5;
            const baseBonusInSAR = 50 / yerRate;
            const rawBonusVal = baseBonusInSAR * (selectedCurrency?.exchangeRate || 1);
            const bonusText = (selectedCurrency?.currencyCode || 'SAR') === 'YER'
              ? '50 ر.ي'
              : rawBonusVal < 1
                ? `${(rawBonusVal || 0).toFixed(2)} ${selectedCurrency?.symbol || 'ر.س'}`
                : `${Math.round(rawBonusVal || 0)} ${selectedCurrency?.symbol || 'ر.س'}`;

            return (
              <button
                onClick={onOpenReferral}
                className="flex items-center gap-1 bg-theme-gradient-accent hover:opacity-90 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-theme-primary transition-all shrink-0 animate-pulse cursor-pointer"
                title={`شارك رابط دعوتك واربح ${bonusText}`}
              >
                <Gift className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">اربح {bonusText}</span>
              </button>
            );
          })()}

          {/* Full Catalog Modal Trigger */}
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-1 bg-theme-inner hover:bg-theme-card text-theme-main border border-theme-card px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:border-theme-primary cursor-pointer"
              title="تصفح جميع المنتجات والفلترة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-theme-primary" />
              <span className="hidden sm:inline">التسوق والفلترة</span>
            </button>
          )}

          {/* Beautiful and Robust Currency Switcher (with invisible native select overlay to prevent overflow-x container clipping) */}
          <div className="relative shrink-0 flex items-center bg-theme-inner border border-theme-card rounded-xl px-2.5 py-1.5 text-xs hover:border-theme-primary transition-colors cursor-pointer select-none">
            <Globe className="w-3.5 h-3.5 text-theme-primary shrink-0 ml-1.5" />
            <span className="font-extrabold text-theme-main text-[11px] select-none">{selectedCurrency.symbol || selectedCurrency.currencyCode}</span>
            <ChevronDown className="w-3 h-3 text-theme-subtext mr-1 shrink-0" />
            
            {/* Invisible native select overlaid on top to trigger the robust native options list anywhere on screen */}
            <select
              value={selectedCurrency.currencyCode}
              onChange={(e) => {
                const found = currencies.find(c => c.currencyCode === e.target.value);
                if (found) setSelectedCurrency(found);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20 text-right font-extrabold bg-transparent focus:outline-none"
            >
              {currencies.map(c => (
                <option 
                  key={c.currencyCode} 
                  value={c.currencyCode}
                  className="bg-theme-card text-theme-main text-right"
                >
                  {c.currencyName} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Drawer Trigger Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-theme-gradient hover:opacity-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-theme-primary transition-all shrink-0 relative cursor-pointer"
            title="عرض سلة المشتريات"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-slate-950 font-black text-[10px] flex items-center justify-center border-2 border-theme-card shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Wishlist Button */}
          {onOpenWishlist && (
            <button
              onClick={onOpenWishlist}
              className="p-2 bg-theme-inner hover:bg-theme-card text-theme-main border border-theme-card hover:border-rose-500 rounded-xl transition-all relative cursor-pointer flex items-center justify-center shrink-0"
              title="قائمة المفضلة"
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-theme-subtext'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Heart Sync Button (قلب خاص بالمزامنه) */}
          {onTriggerSync && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className={`p-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1 relative ${
                isSyncing
                  ? 'bg-pink-600/20 text-pink-500 border-pink-500/50 animate-pulse'
                  : 'bg-theme-inner hover:bg-theme-card text-theme-main border-theme-card hover:border-pink-500'
              }`}
              title="قلب ومزامنة لحظية مع Google Sheets"
            >
              <div className="relative flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500/30" />
                <RefreshCw className={`w-2.5 h-2.5 text-pink-500 absolute -bottom-0.5 -right-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <span className="hidden lg:inline text-[11px]">{isSyncing ? 'جاري المزامنة...' : 'مزامنة'}</span>
            </button>
          )}

          {/* Theme Mode Toggle Button (Light/Dark Switcher) */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-2 bg-theme-inner hover:bg-theme-card text-theme-main border border-theme-card hover:border-amber-400 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
            title={isDarkMode ? 'التحويل للوضع الفاتح (Light Mode)' : 'التحويل للوضع الداكن (Dark Mode)'}
            aria-label="تبديل الوضع الداكن والفاتح"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Install App Button */}
          <button
            onClick={handleInstallApp}
            className="px-2.5 py-1.5 rounded-xl bg-theme-gradient hover:opacity-90 text-white border border-white/20 transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
            title="تثبيت التطبيق على جهازك"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold hidden md:inline">تثبيت التطبيق</span>
          </button>

          {/* Admin Dashboard Switcher Button */}
          <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-xl bg-theme-inner hover:bg-theme-card text-theme-main border border-theme-card hover:border-theme-primary transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            title="لوحة التحكم"
          >
            <Shield className="w-4 h-4 shrink-0 text-theme-primary" />
            <span className="text-xs font-bold hidden sm:inline">لوحة التحكم</span>
          </button>
        </div>
      </div>

    </header>
  );
};
