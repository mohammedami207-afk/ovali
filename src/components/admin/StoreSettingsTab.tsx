import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  Share2, 
  Receipt, 
  Database, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Upload, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  AlertCircle, 
  Layers, 
  Trash2, 
  Plus, 
  RefreshCw,
  ChevronDown,
  MessageCircle,
  Sliders,
  Sparkles,
  DollarSign,
  Palette,
  Globe,
  Link2,
  Smartphone,
  Apple,
  Laptop,
  QrCode,
  ExternalLink,
  SmartphoneNfc, CreditCard, Crown, Lock,
  Gift,
  
  MapPin,
  Truck,
  Sun,
  Moon,
  Wand2,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Play
} from 'lucide-react';
import { AppSettings, CurrencyRate, Product, Order, Customer, Supplier, Employee, Offer, Coupon, Invoice, Category } from '../../types';
import { exportFullSystemBackup, parseFullSystemBackup, exportStoreSettingsExcel } from '../../lib/excelHelper';
import { compressAndResizeImage } from '../../lib/imageUtils';
import { NFCStoreCard } from './NFCStoreCard';
import { playNotificationSound } from '../NotificationToast';
import { THEME_PRESETS, ThemePreset, applyThemeGlobal, hexToRgb } from '../../lib/themeHelper';
import { CategoryManagementTab } from './CategoryManagementTab';
import { fetchMainStoreControlData, MainStoreControlData } from '../../lib/mainControlSheet';
import { MASTER_CONTROL_CONFIG } from '../../config/masterControlConfig';

interface StoreSettingsTabProps {
  settings: AppSettings;
  currencies: CurrencyRate[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  offers: Offer[];
  coupons: Coupon[];
  invoices: Invoice[];
  categories: Category[];
  onSaveSettings: (settings: AppSettings) => void;
  onUpdateCurrencies: (currencies: CurrencyRate[]) => void;
  onRestoreBackup?: (restoredData: any) => void;
  onAddCategory?: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onToggleCategoryVisibility?: (categoryId: string, isVisible: boolean) => void;
  onToggleGroupVisibility?: (groupName: string, isVisible: boolean) => void;
  isSyncing?: boolean;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({
  settings,
  currencies,
  products,
  orders,
  customers,
  suppliers,
  employees,
  offers,
  coupons,
  invoices,
  categories,
  onSaveSettings,
  onRestoreBackup,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryVisibility,
  onToggleGroupVisibility,
  isSyncing = false
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'theme' | 'identity' | 'contact' | 'financial' | 'apps' | 'categories' | 'sync' | 'nfc' | 'subscription' | 'notifications'>('theme');
  const [presetFilter, setPresetFilter] = useState<'all' | 'dark' | 'light' | 'colored'>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Main Store Control Sheet (mainmtger) State
  const [isSyncingControlSheet, setIsSyncingControlSheet] = useState(false);
  const [controlSheetData, setControlSheetData] = useState<MainStoreControlData | null>(null);
  const [controlSheetError, setControlSheetError] = useState<string | null>(null);

  const handleSyncControlSheet = async () => {
    if (!formData.controlSpreadsheetUrl) {
      alert('يرجى إدخال رابط ملف الإكسل (Google Sheets) الخاص بالتحكم أولاً');
      return;
    }
    setIsSyncingControlSheet(true);
    setControlSheetError(null);
    try {
      const data = await fetchMainStoreControlData(
        formData.controlSpreadsheetUrl,
        formData.controlStoreNumber || settings?.storeNumber || formData.storeName || ''
      );
      if (data) {
        setControlSheetData(data);
        const updated: AppSettings = {
          ...formData,
          controlStoreStatus: data.status,
          controlNearExpiryNotice: data.nearExpiryNotice,
          controlExpiredNotice: data.expiredNotice,
          controlNoticeTitle: data.noticeTitle,
          controlLastSyncedAt: data.lastSyncedAt,
          subscriptionPlanName: data.subscriptionType || formData.subscriptionPlanName,
          subscriptionExpiryDate: data.endDate || formData.subscriptionExpiryDate,
          planMaxProducts: data.productsCount !== undefined && data.productsCount > 0 ? data.productsCount : formData.planMaxProducts,
          planMaxOrders: data.ordersCount !== undefined && data.ordersCount > 0 ? data.ordersCount : formData.planMaxOrders,
          planMaxEmployees: data.staffCount !== undefined && data.staffCount > 0 ? data.staffCount : formData.planMaxEmployees
        };
        setFormData(updated);
        onSaveSettings(updated);
      } else {
        setControlSheetError('لم يتم العثور على بيانات هذا المتجر في ملف الإكسل المربوط. تأكد من إدخال "رقم المتجر" أو "اسم المتجر" بشكل صحيح للمطابقة.');
      }
    } catch (err: any) {
      setControlSheetError(`فشل جلب ملف التحكم: ${err.message || 'يرجى التأكد من نشر الملف ويب (Publish to Web) بصيغة CSV'}`);
    } finally {
      setIsSyncingControlSheet(false);
    }
  };

  // Sync form state if parent settings change
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Apply theme live and persist
  const updateAndApplyTheme = (partial: Partial<AppSettings>, autoSave = true) => {
    const updated: AppSettings = {
      ...formData,
      ...partial
    };
    setFormData(updated);
    applyThemeGlobal(updated);
    if (autoSave) {
      onSaveSettings(updated);
    }
  };

  // Harmonize all colors from primary color
  const handleHarmonizeFromPrimary = (primaryHex: string) => {
    const clean = primaryHex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 236;
    const g = parseInt(clean.substring(2, 4), 16) || 72;
    const b = parseInt(clean.substring(4, 6), 16) || 153;

    // Shift hue for secondary
    const secR = Math.min(255, Math.max(0, Math.round(r * 0.7 + b * 0.3)));
    const secG = Math.min(255, Math.max(0, Math.round(g * 0.5 + 40)));
    const secB = Math.min(255, Math.max(0, Math.round(b * 0.9 + 50)));
    const secHex = `#${secR.toString(16).padStart(2, '0')}${secG.toString(16).padStart(2, '0')}${secB.toString(16).padStart(2, '0')}`;

    // Accent
    const accR = Math.min(255, Math.max(0, Math.round(r * 0.95 + 20)));
    const accG = Math.min(255, Math.max(0, Math.round(g * 0.4)));
    const accB = Math.min(255, Math.max(0, Math.round(b * 0.6 + 20)));
    const accHex = `#${accR.toString(16).padStart(2, '0')}${accG.toString(16).padStart(2, '0')}${accB.toString(16).padStart(2, '0')}`;

    const isCurrentLight = formData.themeMode === 'light';
    const bgHex = isCurrentLight ? '#ffffff' : '#090d16';
    const textHex = isCurrentLight ? '#0f172a' : '#f8fafc';
    const iconHex = isCurrentLight ? '#0f172a' : '#f8fafc';

    updateAndApplyTheme({
      themePrimaryColor: primaryHex,
      themeSecondaryColor: secHex,
      themeAccentColor: accHex,
      themeBgColor: bgHex,
      themeTextColor: textHex,
      themeIconColor: iconHex
    });
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    updateAndApplyTheme({
      themePrimaryColor: preset.primary,
      themeSecondaryColor: preset.secondary,
      themeAccentColor: preset.accent,
      themeBgColor: preset.bg,
      themeTextColor: preset.text,
      themeIconColor: preset.icon,
      themeMode: preset.mode
    });
  };

  const handleResetToDefaultTheme = () => {
    updateAndApplyTheme({
      themePrimaryColor: '#ec4899',
      themeSecondaryColor: '#a855f7',
      themeAccentColor: '#f43f5e',
      themeBgColor: '#090d16',
      themeTextColor: '#f8fafc',
      themeIconColor: '#f8fafc',
      themeMode: 'dark'
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndResizeImage(file, 600, 600, 0.85);
        setFormData(prev => ({ ...prev, storeLogoUrl: compressedBase64 }));
      } catch (err) {
        console.error("Error compressing logo image", err);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim() || !onAddCategory) return;
    const cat: Category = {
      CategoryID: `CAT_${Date.now()}`,
      name: newCatName.trim(),
      image: newCatImage.trim() || '',
      description: ''
    };
    onAddCategory(cat);
    setNewCatName('');
    setNewCatImage('');
  };

  return (
    <div className="space-y-6 w-full pb-16">
      
      {/* Top Header & Sticky Save Bar */}
      <div className="bg-theme-card/95 backdrop-blur-md border border-theme-card rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-4 z-40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center text-theme-primary shrink-0 shadow-inner">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-theme-main">إعدادات المتجر الشاملة</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                مزامنة فورية ⚡
              </span>
            </div>
            <p className="text-xs text-theme-subtext">تحكم كامل في هوية المتجر، الألوان، العملات، الضرائب، والتطبيقات</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم الحفظ والتطبيق بنجاح!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onSaveSettings(formData);
              setSavedSuccess(true);
              setTimeout(() => setSavedSuccess(false), 4000);
            }}
            className="px-6 py-3 bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-xl shadow-theme-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer w-full md:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات والمزامنة</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'theme'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>المظهر والألوان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>هوية وبيانات المتجر</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>أرقام التواصل والشبكات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'financial'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>الضرائب والعملات والتوثيق</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'apps'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>تطبيقات الجوال والمسوقين</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>أقسام وفئات المنتجات ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'sync'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>جداول جوجل والنسخ الاحتياطي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nfc')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'nfc'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <SmartphoneNfc className="w-4 h-4" />
          <span>بطاقة المتجر الذكية (NFC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>التنبيهات الصوتية ومهلة الطلبات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'subscription'
              ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30 border border-white/20'
              : 'bg-theme-card hover:bg-theme-inner text-theme-subtext hover:text-theme-main border border-theme-card'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>الاشتراك والباقات وصلاحيات المتجر</span>
        </button>
      </div>

      {/* Main Settings Container */}
      <div className="space-y-6">

        {/* TAB 1: Theme & Colors (المظهر والألوان) */}
        {activeTab === 'theme' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Presets Card */}
            <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-theme-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-theme-main">قوالب وتنسيقات الألوان الجاهزة (Themes)</h3>
                    <p className="text-xs text-theme-subtext">اختر نمطك المفضل ليتم تطبيقه فوراً على كامل أجزاء المتجر ولوحة الإدارة</p>
                  </div>
                </div>

                {/* Preset Category Filters (Dark / Light / Colored / All) */}
                <div className="flex items-center gap-1.5 p-1 bg-theme-inner rounded-2xl border border-theme-card self-stretch sm:self-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPresetFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      presetFilter === 'all'
                        ? 'bg-theme-primary text-white shadow-md'
                        : 'text-theme-subtext hover:text-theme-main'
                    }`}
                  >
                    الكل ({THEME_PRESETS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFilter('dark')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      presetFilter === 'dark'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-theme-subtext hover:text-theme-main'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>الداكن ({THEME_PRESETS.filter(p => p.category === 'dark').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFilter('light')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      presetFilter === 'light'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-theme-subtext hover:text-theme-main'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>الفاتح ({THEME_PRESETS.filter(p => p.category === 'light').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFilter('colored')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      presetFilter === 'colored'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-theme-subtext hover:text-theme-main'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    <span>الملونة ({THEME_PRESETS.filter(p => p.category === 'colored').length})</span>
                  </button>
                </div>
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {THEME_PRESETS
                  .filter(preset => presetFilter === 'all' || preset.category === presetFilter)
                  .map((preset) => {
                    const isSelected = 
                      formData.themePrimaryColor?.toLowerCase() === preset.primary.toLowerCase() &&
                      formData.themeBgColor?.toLowerCase() === preset.bg.toLowerCase();

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-4 rounded-2xl text-right transition-all group cursor-pointer border relative overflow-hidden flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-theme-inner border-theme-primary ring-2 ring-theme-primary/50 shadow-xl'
                            : 'bg-theme-inner/60 hover:bg-theme-inner border-theme-card'
                        }`}
                      >
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-theme-main group-hover:text-theme-primary transition-colors">
                              {preset.name}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0 ${
                              preset.category === 'light'
                                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                                : preset.category === 'colored'
                                ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                                : 'bg-slate-700/20 text-slate-700 border border-slate-700/30'
                            }`}>
                              {preset.category === 'light' ? '☀️ فاتح' : preset.category === 'colored' ? '🎨 ملون' : '🌙 داكن'}
                            </span>
                          </div>

                          <p className="text-[11px] text-theme-subtext line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {/* Color Swatch Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-theme-card w-full">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.primary }}
                              title="الأساسي"
                            />
                            <span 
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.secondary }}
                              title="الثانوي"
                            />
                            <span 
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.accent }}
                              title="التمييز"
                            />
                            <span 
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.bg }}
                              title="الخلفية"
                            />
                            <span 
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.text }}
                              title="النصوص"
                            />
                          </div>

                          <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-500 flex items-center gap-1' : 'text-theme-subtext group-hover:text-theme-main'}`}>
                            {isSelected ? '✓ مفعّل حالياً' : 'تطبيق القالب ←'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Custom Theme Color Matrix */}
            <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-theme-card">
                <div>
                  <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
                    <Palette className="w-4 h-4 text-theme-primary" />
                    <span>تخصيص ألوان المتجر المتقدم (6 عناصر دقيقة)</span>
                  </h3>
                  <p className="text-xs text-theme-subtext mt-0.5">تحكم كامل في كل عنصر لوني مع تطبيق فوري وحفظ مباشر</p>
                </div>

                {/* Harmonize & Reset Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleHarmonizeFromPrimary(formData.themePrimaryColor || '#ec4899')}
                    className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-500 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>توليد تلقائي متناسق</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultTheme}
                    className="px-3.5 py-2 bg-theme-inner hover:bg-theme-card text-theme-subtext border border-theme-card rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-theme-subtext" />
                    <span>الوضع الافتراضي</span>
                  </button>
                </div>
              </div>

              {/* Theme Mode Quick Switch */}
              <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-theme-main block">نمط الإضاءة الأساسي (Display Mode):</span>
                  <span className="text-[11px] text-theme-subtext block">تبديل النمط يضبط الخلفيات والنصوص والأيقونات تلقائياً لتكون مريحة وعالية التباين</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAndApplyTheme({
                        themeMode: 'dark',
                        themeBgColor: '#090d16',
                        themeTextColor: '#f8fafc',
                        themeIconColor: '#f8fafc'
                      });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      formData.themeMode !== 'light'
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>الوضع الداكن (Dark)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateAndApplyTheme({
                        themeMode: 'light',
                        themeBgColor: '#ffffff',
                        themeTextColor: '#0f172a',
                        themeIconColor: '#0f172a'
                      });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      formData.themeMode === 'light'
                        ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-md font-black ring-2 ring-amber-400/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-slate-950" />
                    <span>الوضع الفاتح (Light)</span>
                  </button>
                </div>
              </div>

              {/* 6 Color Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* 1. Primary Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-primary">1. اللون الأساسي (Primary):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themePrimaryColor || '#ec4899' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themePrimaryColor || '#ec4899'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndApplyTheme({ themePrimaryColor: val });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themePrimaryColor || '#ec4899'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themePrimaryColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themePrimaryColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">للأزرار الرئيسية، شريط التبويب، والرموز التفاعلية</p>
                </div>

                {/* 2. Secondary Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-secondary">2. اللون الثانوي (Secondary):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themeSecondaryColor || '#a855f7' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themeSecondaryColor || '#a855f7'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndApplyTheme({ themeSecondaryColor: val });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themeSecondaryColor || '#a855f7'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themeSecondaryColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themeSecondaryColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">للتدرجات والبطاقات التفاعلية والظلال المميزة</p>
                </div>

                {/* 3. Accent Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-500">3. لون التمييز والخصومات (Accent):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themeAccentColor || '#f43f5e' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themeAccentColor || '#f43f5e'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndApplyTheme({ themeAccentColor: val });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themeAccentColor || '#f43f5e'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themeAccentColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themeAccentColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">لأوسمة الخصومات، الأسعار المخفضة، وشارات العروض</p>
                </div>

                {/* 4. Background Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-main">4. لون الخلفية (Background):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themeBgColor || '#090d16' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themeBgColor || '#090d16'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const clean = val.replace('#', '');
                        const r = parseInt(clean.substring(0, 2), 16) || 0;
                        const g = parseInt(clean.substring(2, 4), 16) || 0;
                        const b = parseInt(clean.substring(4, 6), 16) || 0;
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        const autoText = brightness > 140 ? '#0f172a' : '#f8fafc';

                        updateAndApplyTheme({
                          themeBgColor: val,
                          themeTextColor: autoText,
                          themeIconColor: autoText,
                          themeMode: brightness > 140 ? 'light' : 'dark'
                        });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themeBgColor || '#090d16'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themeBgColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themeBgColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">الخلفية العميقة للواجهة وصفحات المتجر</p>
                </div>

                {/* 5. Text Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-main">5. لون الخط والنصوص (Text):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themeTextColor || '#f8fafc' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themeTextColor || '#f8fafc'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndApplyTheme({ themeTextColor: val });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themeTextColor || '#f8fafc'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themeTextColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themeTextColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">لون النصوص والعناوين الرئيسية والفقرات</p>
                </div>

                {/* 6. Icon Color */}
                <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-theme-main">6. لون الأيقونات (Icons):</label>
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: formData.themeIconColor || '#f8fafc' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.themeIconColor || '#f8fafc'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndApplyTheme({ themeIconColor: val });
                      }}
                      className="w-10 h-10 rounded-xl border border-theme-card bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.themeIconColor || '#f8fafc'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, themeIconColor: val }));
                        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                          updateAndApplyTheme({ themeIconColor: val });
                        }
                      }}
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-2 text-theme-main font-mono font-bold tracking-wider uppercase text-xs text-left"
                    />
                  </div>
                  <p className="text-[10px] text-theme-subtext">لون الأيقونات في القوائم والأزرار والعناصر</p>
                </div>
              </div>

              {/* Live Store Interactive Preview Box */}
              <div className="pt-4 border-t border-theme-card space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-theme-main flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-theme-primary" />
                    <span>معاينة حية ومباشرة للمتجر (Live Store Preview):</span>
                  </label>
                  <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    مظهر فوري
                  </span>
                </div>

                <div 
                  className="p-5 rounded-3xl border border-slate-700 shadow-2xl transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: formData.themeBgColor || '#090d16',
                    color: formData.themeTextColor || '#f8fafc',
                  }}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md"
                        style={{ backgroundColor: formData.themePrimaryColor || '#ec4899', color: '#ffffff' }}
                      >
                        🛍️
                      </div>
                      <span className="font-black text-sm" style={{ color: formData.themeTextColor || '#f8fafc' }}>
                        {formData.storeName || 'متجرك الإلكتروني'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-xl text-[10px] font-bold"
                        style={{ backgroundColor: formData.themeSecondaryColor || '#a855f7', color: '#ffffff' }}
                      >
                        تصنيف تجريبي
                      </span>
                      <span 
                        className="px-3 py-1 rounded-xl text-[10px] font-bold"
                        style={{ backgroundColor: formData.themeAccentColor || '#f43f5e', color: '#ffffff' }}
                      >
                        خصم 20%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-[11px] font-bold opacity-75" style={{ color: formData.themeTextColor || '#f8fafc' }}>عينة بطاقة منتج</div>
                      <div className="text-xs font-black" style={{ color: formData.themeTextColor || '#f8fafc' }}>
                        فستان سهرة فاخر
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-xs" style={{ color: formData.themeAccentColor || '#f43f5e' }}>180.00 ر.س</span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: formData.themeIconColor || '#f8fafc' }}>❤️</span>
                          <span style={{ color: formData.themeIconColor || '#f8fafc' }}>🛒</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-2">
                      <div className="text-[11px] opacity-75" style={{ color: formData.themeTextColor || '#f8fafc' }}>أزرار الشراء الفوري</div>
                      <button
                        type="button"
                        className="w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        style={{ backgroundColor: formData.themePrimaryColor || '#ec4899', color: '#ffffff' }}
                      >
                        <span>🛍️</span>
                        <span>إضافة للسلة الآن</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <div className="text-[11px] opacity-75" style={{ color: formData.themeTextColor || '#f8fafc' }}>أيقونات التنقل</div>
                      <div className="flex items-center justify-around py-1">
                        <div className="p-2 rounded-xl bg-white/10 text-xs" style={{ color: formData.themeIconColor || '#f8fafc' }}>🏠 رئيسية</div>
                        <div className="p-2 rounded-xl bg-white/10 text-xs" style={{ color: formData.themeIconColor || '#f8fafc' }}>🔍 بحث</div>
                        <div className="p-2 rounded-xl bg-white/10 text-xs" style={{ color: formData.themeIconColor || '#f8fafc' }}>⚙️ إعدادات</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Store Identity & Info (هوية وبيانات المتجر) */}
        {activeTab === 'identity' && (
          <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">بيانات وهوية المتجر والعناوين</h3>
                <p className="text-xs text-theme-subtext">اسم المتجر، الشعار، العناوين، الفروع، والرمز السري للإدارة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">اسم المتجر الرسمي:</label>
                <input
                  type="text"
                  value={formData.storeName || ""}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="مثال: اوفالي"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">شعار المتجر اللفظي (Slogan):</label>
                <input
                  type="text"
                  value={formData.storeTagline || ""}
                  onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                  placeholder="مثال: وجهتك الأولى للأناقة والجمال"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">عنوان البانر الرئيسي (Hero Title):</label>
                <input
                  type="text"
                  value={formData.heroTitle || ""}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  placeholder="مثال: أحدث صيحات الموضة والأزياء بين يديك"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">وصف البانر الرئيسي (Hero Subtitle):</label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle || ""}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  placeholder="مثال: اكتشفي الأناقة الاستثنائية..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>

              {/* Logo with Image Upload */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">شعار المتجر (Logo):</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {formData.storeLogoUrl && (
                    <img
                      src={formData.storeLogoUrl}
                      alt="Store Logo"
                      className="w-14 h-14 object-contain rounded-2xl bg-theme-inner p-2 border border-theme-card shadow-sm shrink-0"
                    />
                  )}
                  <input
                    type="url"
                    value={formData.storeLogoUrl || ""}
                    onChange={(e) => setFormData({ ...formData, storeLogoUrl: e.target.value })}
                    placeholder="رابط صورة الشعار أو ارفعها من جهازك..."
                    className="flex-1 bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                  <label className="px-4 py-3 bg-theme-inner hover:bg-theme-card text-theme-main rounded-2xl cursor-pointer font-bold flex items-center gap-2 shrink-0 border border-theme-card transition">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>رفع صورة الشعار</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">العنوان الرئيسي للمتجر:</label>
                <input
                  type="text"
                  value={formData.storeAddress || ""}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  placeholder="مثال: الرياض - العليا / صنعاء - حدة"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">الرابط الافتراضي للمتجر:</label>
                <input
                  type="text"
                  value={formData.storeDefaultUrl || ""}
                  onChange={(e) => setFormData({ ...formData, storeDefaultUrl: e.target.value })}
                  placeholder="مثال: https://mystore.com"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">فروع وعناوين المتجر (تظهر في تفاصيل المتجر):</label>
                <textarea
                  rows={2}
                  value={formData.storeBranches || ""}
                  onChange={(e) => setFormData({ ...formData, storeBranches: e.target.value })}
                  placeholder="🇸🇦 فرع الرياض: حي العليا - طريق الملك فهد | 🇾🇪 فرع صنعاء: شارع حدة | 🇾🇪 فرع عدن: كريتر"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">نبذة تعريفية عن المتجر (Footer About):</label>
                <textarea
                  rows={2}
                  value={formData.footerAbout || ""}
                  onChange={(e) => setFormData({ ...formData, footerAbout: e.target.value })}
                  placeholder="متجرنا وجهتكم الأولى للتسوق المعتمد في السعودية واليمن بأفضل الأسعار..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-theme-main">معلومات الشحن والتوصيل:</label>
                <textarea
                  rows={2}
                  value={formData.deliveryInfo || ""}
                  onChange={(e) => setFormData({ ...formData, deliveryInfo: e.target.value })}
                  placeholder="توصيل سريع ومباشر لكافة مدن السعودية واليمن خلال 24 - 48 ساعة..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-amber-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>رمز الدخول السري للإدارة (Admin PIN / Password):</span>
                </label>
                <input
                  type="password"
                  value={formData.adminPassword || ""}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="الرمز الافتراضي: 123456"
                  className="w-full bg-theme-inner border border-amber-500/40 rounded-2xl p-3 text-theme-main focus:outline-none focus:border-amber-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Contact & Social (أرقام التواصل والشبكات) */}
        {activeTab === 'contact' && (
          <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
              <Phone className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">أرقام التواصل وخدمة العملاء وروابط السوشيال ميديا</h3>
                <p className="text-xs text-theme-subtext">واتساب السعودية، واتساب اليمن، الهاتف وروابط شبكات التواصل</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-emerald-600">🇸🇦 واتساب خدمة العملاء (السعودية):</label>
                <input
                  type="text"
                  value={formData.storePhoneSaudi || ""}
                  onChange={(e) => setFormData({ ...formData, storePhoneSaudi: e.target.value })}
                  placeholder="966531093972"
                  className="w-full bg-theme-inner border border-emerald-500/40 rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-amber-600">🇾🇪 واتساب خدمة العملاء (اليمن):</label>
                <input
                  type="text"
                  value={formData.storePhoneYemen || ""}
                  onChange={(e) => setFormData({ ...formData, storePhoneYemen: e.target.value })}
                  placeholder="967771234567"
                  className="w-full bg-theme-inner border border-amber-500/40 rounded-2xl p-3 text-theme-main focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رقم الهاتف العام:</label>
                <input
                  type="text"
                  value={formData.storePhone || ""}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                  placeholder="0531093972"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={formData.storeEmail || ""}
                  onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                  placeholder="info@mystore.com"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رابط تيك توك (TikTok):</label>
                <input
                  type="url"
                  value={formData.tiktokUrl || ""}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  placeholder="https://tiktok.com/@store"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رابط انستقرام (Instagram):</label>
                <input
                  type="url"
                  value={formData.instagramUrl || ""}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/store"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رابط تلجرام (Telegram):</label>
                <input
                  type="url"
                  value={formData.telegramUrl || ""}
                  onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
                  placeholder="https://t.me/store"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رابط سناب شات (Snapchat):</label>
                <input
                  type="url"
                  value={formData.snapchatUrl || ""}
                  onChange={(e) => setFormData({ ...formData, snapchatUrl: e.target.value })}
                  placeholder="https://snapchat.com/add/store"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">رابط فيسبوك (Facebook):</label>
                <input
                  type="url"
                  value={formData.facebookUrl || ""}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/store"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Financial, Tax & Verification (الضرائب والعملات والتوثيق) */}
        {activeTab === 'financial' && (
          <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
              <Receipt className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">الضرائب، العملات وتوثيق المتجر السعودي</h3>
                <p className="text-xs text-theme-subtext">ضريبة ZATCA، أسعار الصرف، السجل التجاري ورابط التحقق في منصة الأعمال</p>
              </div>
            </div>

            {/* VAT Control */}
            <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-sm text-theme-main block">إظهار وتطبيق ضريبة القيمة المضافة (VAT) للعملاء</span>
                <span className="text-xs text-theme-subtext block">عند إيقاف هذا الخيار، لن تظهر أي ضريبة في السلة وسيكون السعر المعروض هو الصافي النهائي.</span>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableVat: !formData.enableVat })}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  formData.enableVat
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-theme-inner hover:bg-theme-card text-theme-subtext border border-theme-card'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${formData.enableVat ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                <span>{formData.enableVat ? 'الضريبة مفعلة الآن (15%)' : 'الضريبة موقفة (إخفاء الضريبة)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">الرقم الضريبي ZATCA:</label>
                <input
                  type="text"
                  value={formData.taxNumber || ""}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="310123456700003"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">نسبة الضريبة المضافة (%):</label>
                <input
                  type="number"
                  disabled={!formData.enableVat}
                  value={formData.vatPercentage ?? 15}
                  onChange={(e) => setFormData({ ...formData, vatPercentage: e.target.value })}
                  className={`w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono ${!formData.enableVat ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">العملة الافتراضية للمتجر:</label>
                <select
                  value={formData.defaultCurrency || "SAR"}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="YER">YER - ريال يمني</option>
                  <option value="USD">USD - دولار أمريكي</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">سعر صرف الريال اليمني (مقابل 1 ر.س):</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.yerExchangeRate ?? ""}
                  onChange={(e) => setFormData({ ...formData, yerExchangeRate: e.target.value })}
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">سعر صرف الدولار (مقابل 1 ر.س):</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.usdExchangeRate ?? ""}
                  onChange={(e) => setFormData({ ...formData, usdExchangeRate: e.target.value })}
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-emerald-600">رقم السجل التجاري السعودي:</label>
                <input
                  type="text"
                  value={formData.commercialRegisterNumber || ""}
                  onChange={(e) => setFormData({ ...formData, commercialRegisterNumber: e.target.value })}
                  placeholder="7033543294"
                  className="w-full bg-theme-inner border border-emerald-500/40 rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                <label className="font-bold text-emerald-600">رابط شهادة التوثيق في المركز السعودي للأعمال:</label>
                <input
                  type="url"
                  value={formData.saudiBusinessVerificationUrl || ""}
                  onChange={(e) => setFormData({ ...formData, saudiBusinessVerificationUrl: e.target.value })}
                  placeholder="https://eauthenticate.saudibusiness.gov.sa/..."
                  className="w-full bg-theme-inner border border-emerald-500/40 rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Mobile Apps & Affiliates (تطبيقات الجوال والمسوقين) */}
        {activeTab === 'apps' && (
          <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
              <Smartphone className="w-5 h-5 text-sky-500" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">روابط تحميل تطبيقات الجوال ونظام عمولات المسوقين</h3>
                <p className="text-xs text-theme-subtext">بانر تحميل تطبيق المتجر للأندرويد والآيفون، وإعدادات التسويق بالعمولة</p>
              </div>
            </div>

            {/* Mobile App Banner Toggle */}
            <div className="p-4 bg-theme-inner rounded-2xl border border-theme-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-sm text-theme-main block">إظهار بانر تحميل التطبيق في الصفحة الرئيسية</span>
                <span className="text-xs text-theme-subtext block">يعرض بطاقة أنيقة بأسفل المتجر مع روابط التحميل لمختلف المنصات</span>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, showAppDownloadBanner: !formData.showAppDownloadBanner })}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  formData.showAppDownloadBanner !== false
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
                    : 'bg-theme-inner hover:bg-theme-card text-theme-subtext border border-theme-card'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${formData.showAppDownloadBanner !== false ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                <span>{formData.showAppDownloadBanner !== false ? 'البانر مفعل ومعروض' : 'البانر مخفي'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">عنوان بانر التطبيق:</label>
                <input
                  type="text"
                  value={formData.appDownloadTitle || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadTitle: e.target.value })}
                  placeholder="حمّل تطبيق المتجر الآن"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-sky-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-theme-main">وصف بانر التطبيق:</label>
                <input
                  type="text"
                  value={formData.appDownloadDescription || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadDescription: e.target.value })}
                  placeholder="تسوق أسرع واحصل على خصومات حصرية وإشعارات فورية..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-emerald-600">رابط تطبيق الأندرويد (Google Play):</label>
                <input
                  type="url"
                  value={formData.appDownloadAndroid || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadAndroid: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-sky-600">رابط تطبيق الآيفون (App Store):</label>
                <input
                  type="url"
                  value={formData.appDownloadiOS || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadiOS: e.target.value })}
                  placeholder="https://apps.apple.com/app/..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-rose-500">رابط تطبيق هواوي (AppGallery):</label>
                <input
                  type="url"
                  value={formData.appDownloadHuawei || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadHuawei: e.target.value })}
                  placeholder="https://appgallery.huawei.com/..."
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-rose-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-purple-600">رابط برنامج الكمبيوتر (Windows / Desktop):</label>
                <input
                  type="url"
                  value={formData.appDownloadDesktop || ""}
                  onChange={(e) => setFormData({ ...formData, appDownloadDesktop: e.target.value })}
                  placeholder="https://mystore.com/download/desktop.exe"
                  className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Affiliate System Section */}
            <div className="pt-4 border-t border-theme-card space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500" />
                <h4 className="font-bold text-theme-main text-xs">نظام التسويق بالعمولة للمسوقين (Affiliate System)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-theme-inner rounded-2xl border border-theme-card space-y-2">
                  <span className="font-bold text-theme-main block">حالة نظام المسوقين:</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enableAffiliateSystem: !formData.enableAffiliateSystem })}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.enableAffiliateSystem
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-theme-inner text-theme-subtext border border-theme-card'
                    }`}
                  >
                    {formData.enableAffiliateSystem ? 'النظام مفعل' : 'النظام معطل'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-theme-main">نسبة العمولة الافتراضية (%):</label>
                  <input
                    type="number"
                    value={formData.affiliateCommissionRate ?? 10}
                    onChange={(e) => setFormData({ ...formData, affiliateCommissionRate: Number(e.target.value) })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-theme-main">الحد الأدنى لسحب الأرباح (ر.س):</label>
                  <input
                    type="number"
                    value={formData.affiliateMinWithdrawal ?? 100}
                    onChange={(e) => setFormData({ ...formData, affiliateMinWithdrawal: Number(e.target.value) })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Categories Management (أقسام وفئات ومجموعات المنتجات) */}
        {activeTab === 'categories' && (
          <CategoryManagementTab
            categories={categories}
            products={products}
            settings={settings}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            onToggleCategoryVisibility={onToggleCategoryVisibility}
            onToggleGroupVisibility={onToggleGroupVisibility}
            isSyncing={isSyncing}
          />
        )}

        {/* TAB 7: Sync & Backup (جداول جوجل والنسخ الاحتياطي) */}
        {activeTab === 'sync' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Google Sheets Sync */}
            <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
                <Database className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="text-sm font-bold text-theme-main">إعدادات المزامنة السحابية وجداول جوجل (Google Sheets Sync)</h3>
                  <p className="text-xs text-theme-subtext">ربط السكريبت البرمجي Google Apps Script WebApp ومعرف الجدول</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-theme-main">Spreadsheet ID (معرف ملف جوجل شيت):</label>
                  <input
                    type="text"
                    value={formData.spreadsheetId || ""}
                    onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-theme-main">رابط WebApp URL من Apps Script:</label>
                  <input
                    type="text"
                    value={formData.googleAppsScriptUrl || ""}
                    onChange={(e) => setFormData({ ...formData, googleAppsScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Excel Full Backup Card */}
            <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-theme-main">النسخ الاحتياطي الكامل بصيغة Excel (Backup & Restore)</h3>
                  <p className="text-xs text-theme-subtext">تصدير واستيراد كافة بيانات النظام (المنتجات، الطلبات، العملاء، الإعدادات، الفواتير)</p>
                </div>
              </div>

              {backupMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  backupMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{backupMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      exportFullSystemBackup({
                        settings: formData,
                        currencies,
                        products,
                        orders,
                        customers,
                        suppliers,
                        employees,
                        offers,
                        coupons,
                        invoices,
                        categories
                      });
                      setBackupMessage({ type: 'success', text: 'تم تصدير ملف النسخة الاحتياطية بنجاح!' });
                      setTimeout(() => setBackupMessage(null), 4000);
                    } catch (e) {
                      setBackupMessage({ type: 'error', text: 'فشل تصدير النسخة الاحتياطية' });
                    }
                  }}
                  className="p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-600 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>تصدير نسخة احتياطية كاملة (Excel .xlsx)</span>
                </button>

                <label className="p-4 bg-theme-inner hover:bg-theme-card border border-theme-card rounded-2xl text-theme-main font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد واستعادة نسخة احتياطية من Excel'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    disabled={isImporting}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsImporting(true);
                      try {
                        const parsed = await parseFullSystemBackup(file);
                        if (parsed && onRestoreBackup) {
                          onRestoreBackup(parsed);
                          if (parsed.settings) setFormData(parsed.settings);
                          setBackupMessage({ type: 'success', text: 'تمت استعادة البيانات والنسخة الاحتياطية بنجاح!' });
                        }
                      } catch (err) {
                        setBackupMessage({ type: 'error', text: 'فشل استيراد الملف، تأكد من صحة التنسيق' });
                      } finally {
                        setIsImporting(false);
                        setTimeout(() => setBackupMessage(null), 5000);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: Smart NFC Store Card (بطاقة المتجر الذكية) */}
        {activeTab === 'nfc' && (
          <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-5 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
              <SmartphoneNfc className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-sm font-bold text-theme-main">بطاقة المتجر الذكية وتقنية NFC</h3>
                <p className="text-xs text-theme-subtext">مشاركة سريعة للمتجر مع العملاء عبر بطاقة NFC الذكية ورمز QR Code</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs max-w-md">
              <label className="font-bold text-theme-main">رابط بطاقة NFC المباشر:</label>
              <input
                type="url"
                value={formData.nfcUrl || ""}
                onChange={(e) => setFormData({ ...formData, nfcUrl: e.target.value })}
                placeholder="https://mystore.com/nfc"
                className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3 text-theme-main focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2">
              <NFCStoreCard settings={formData} />
            </div>
          </div>
        )}

        {/* TAB 9: Subscription & SaaS Limits (الاشتراك والباقات وصلاحيات المتجر) */}
        {activeTab === 'subscription' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-theme-card border border-amber-500/30 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2.5 pb-3 border-b border-theme-card">
                <Crown className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-theme-main">تفاصيل اشتراك المتجر وصلاحياته (باقات المتجر)</h3>
                  <p className="text-xs text-amber-600 mt-1">إعدادات حدود المنتجات، الطلبات، وباقة المتجر الأساسية.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-theme-main block">اسم الباقة الحالية</label>
                  <input
                    type="text"
                    value={formData.subscriptionPlanName || ''}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlanName: e.target.value })}
                    placeholder="مثال: باقة التاجر المبتدئ، الباقة الاحترافية..."
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3.5 text-theme-main text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <p className="text-[10px] text-theme-subtext">هذا الاسم سيظهر للمشرفين لمعرفة حالة اشتراكهم.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-theme-main block">تاريخ انتهاء صلاحية الاشتراك</label>
                  <input
                    type="date"
                    value={formData.subscriptionExpiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, subscriptionExpiryDate: e.target.value })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3.5 text-theme-main text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-theme-subtext">تاريخ انتهاء الباقة لإرسال تنبيهات اقتراب التجديد في اللوحة.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-theme-main block">
                    الحد الأقصى للممنتجات المسموح بها <span className="text-amber-500">(0 = عدد لا نهائي)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.planMaxProducts || 0}
                    onChange={(e) => setFormData({ ...formData, planMaxProducts: parseInt(e.target.value) || 0 })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3.5 text-theme-main text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-theme-subtext">سيتم إيقاف إضافة منتجات جديدة عند بلوغ هذا الحد.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-theme-main block">
                    الحد الأقصى للطلبات المسموحة <span className="text-amber-500">(0 = عدد لا نهائي)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.planMaxOrders || 0}
                    onChange={(e) => setFormData({ ...formData, planMaxOrders: parseInt(e.target.value) || 0 })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3.5 text-theme-main text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-theme-subtext">حدد عدد الطلبات المستلمة كحد أقصى للحساب.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-theme-main block">
                    الحد الأقصى للموظفين المسموح بهم <span className="text-amber-500">(0 = عدد لا نهائي)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.planMaxEmployees || 0}
                    onChange={(e) => setFormData({ ...formData, planMaxEmployees: parseInt(e.target.value) || 0 })}
                    className="w-full bg-theme-inner border border-theme-card rounded-2xl p-3.5 text-theme-main text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-theme-subtext">الحد الأقصى لعدد المشرفين المسموح بإضافتهم.</p>
                </div>
              </div>

              {/* NFC Notice */}
              <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-theme-main leading-relaxed">
                  <strong>صلاحيات بطاقة المتجر الذكية (NFC):</strong>
                  <br />
                  بشكل افتراضي، خاصية بطاقات الـ NFC متاحة لكل المتاجر. يمكنك تفعيلها أو تقييدها لاحقاً من خلال ربطها مباشرة بنوع اشتراك العميل. هذا النظام يتيح لك تحويل المنصة إلى نظام اشتراكات (SaaS) متكامل ومربوط بالمتجر، بحيث يمكن للتاجر الحصول على صلاحيات معينة (مثل ربط متجره بمتاجر أخرى، أو إضافة عدد لا محدود من المنتجات) بحسب باقته.
                </div>
              </div>

              {/* Salla Integration Info */}
              <div className="mt-2 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-theme-main leading-relaxed">
                  <strong>هل يمكن الربط مع متجر سلة (Salla) أو متاجر أخرى؟</strong>
                  <br />
                  نعم! يمكنك ربط متجرك بـ "سلة" أو "زد" أو أي منصات تجارة إلكترونية أخرى. حيث أن النظام هنا مبني على خادم Node.js مستقل، يمكنك استخدام واجهات الربط البرمجي (APIs) و (Webhooks) الخاصة بسلة لمزامنة المخزون والطلبات تلقائياً مع هذا النظام.
                </div>
              </div>

              {/* 📊 MAIN STORE CONTROL EXCEL SHEET INTEGRATION (mainmtger) */}
              <div className="mt-6 pt-6 border-t border-theme-card space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-theme-main">ربط شيت إكسل المتاجر والتحكم المركزي (mainmtger)</h4>
                      <p className="text-[11px] text-theme-subtext">إدارة المتاجر المنشورة (70+ عميل) والتحقق من حالة الاشتراك وتفعيل/إيقاف المتجر عن بعد عبر ملف Excel المحمي.</p>
                    </div>
                  </div>

                  {formData.controlLastSyncedAt && (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      آخر مزامنة: {formData.controlLastSyncedAt}
                    </span>
                  )}
                </div>

                {/* Fixed Code Credentials Info Notice */}
                <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-start gap-3 text-xs text-sky-800 dark:text-sky-300">
                  <Lock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">إعدادات التحكم المباشرة المحمية من داخل الكود (`src/config/masterControlConfig.ts`):</span>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      تم تضمين رابط الشيت الموحد ورقم المتجر الثابت داخل الكود لمنع أي عميل من مسح أو تغيير رابط المزامنة. يمكنك تغيير الثوابت فوراً من الملف <code>src/config/masterControlConfig.ts</code>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-theme-inner p-4 rounded-2xl border border-theme-card">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>رابط ملف الإكسل (Google Sheets) المنشور للويب (ثابت بالكود)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.controlSpreadsheetUrl || MASTER_CONTROL_CONFIG.MASTER_SPREADSHEET_URL}
                        onChange={(e) => setFormData({ ...formData, controlSpreadsheetUrl: e.target.value })}
                        placeholder="https://docs.google.com/spreadsheets/d/e/.../pubhtml أو export?format=csv"
                        className="w-full bg-theme-card border border-theme-card rounded-xl p-3 text-theme-main text-xs font-mono focus:outline-none focus:border-emerald-500 dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={handleSyncControlSheet}
                        disabled={isSyncingControlSheet}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingControlSheet ? 'animate-spin' : ''}`} />
                        <span>{isSyncingControlSheet ? 'جاري الجلب...' : 'مزامنة وجلب'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-theme-subtext">تأكد من نشر الملف من Google Sheets عبر: (ملف -&gt; مشاركة -&gt; نشر على الويب -&gt; قيم مفصولة بفاصلة CSV).</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>رقم المتجر المرجعي الثابت لهذه النسخة (من داخل الكود)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.controlStoreNumber || MASTER_CONTROL_CONFIG.STORE_ID}
                      onChange={(e) => setFormData({ ...formData, controlStoreNumber: e.target.value })}
                      placeholder="مثال: 101 أو S-99"
                      className="w-full bg-theme-card border border-theme-card rounded-xl p-3 text-theme-main text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-theme-subtext">رقم المتجر المعتمد للبحث والمطابقة في ملف الإكسل الرئيسي <code>STORE_ID</code>.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-theme-main block">حالة المتجر الحالية من الشيت</label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-theme-card border border-theme-card">
                      <span className={`w-3 h-3 rounded-full ${formData.controlStoreStatus === 'غير فعال' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      <span className="text-xs font-bold text-theme-main">
                        {formData.controlStoreStatus || 'فعال (نشط)'}
                      </span>
                    </div>
                  </div>
                </div>

                {controlSheetError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{controlSheetError}</span>
                  </div>
                )}

                {(controlSheetData || formData.controlNearExpiryNotice) && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>تم جلب بيانات التحكم والاشتراكات بنجاح</span>
                      </div>
                      <span className="text-[10px] opacity-80">{controlSheetData?.subscriptionType || formData.subscriptionPlanName}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="p-2 rounded-xl bg-theme-card/60 border border-theme-card">
                        <span className="text-theme-subtext block text-[9px]">تاريخ البدء</span>
                        <span className="font-bold font-mono text-theme-main">{controlSheetData?.startDate || '-'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-theme-card/60 border border-theme-card">
                        <span className="text-theme-subtext block text-[9px]">تاريخ الانتهاء</span>
                        <span className="font-bold font-mono text-theme-main">{controlSheetData?.endDate || formData.subscriptionExpiryDate || '-'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-theme-card/60 border border-theme-card">
                        <span className="text-theme-subtext block text-[9px]">حالة المتجر</span>
                        <span className={`font-bold ${formData.controlStoreStatus === 'غير فعال' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formData.controlStoreStatus || 'فعال'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-theme-card/60 border border-theme-card">
                        <span className="text-theme-subtext block text-[9px]">نوع الباقة</span>
                        <span className="font-bold text-theme-main">{controlSheetData?.subscriptionType || formData.subscriptionPlanName || '-'}</span>
                      </div>
                    </div>

                    {(controlSheetData?.nearExpiryNotice || formData.controlNearExpiryNotice) && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                        <span className="font-bold block">ملاحظة اقتراب انتهاء الباقة (تظهر للعميل):</span>
                        <p>{controlSheetData?.nearExpiryNotice || formData.controlNearExpiryNotice}</p>
                      </div>
                    )}

                    {(controlSheetData?.expiredNotice || formData.controlExpiredNotice) && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-800 dark:text-red-300 space-y-1">
                        <span className="font-bold block">ملاحظة انتهاء الباقة:</span>
                        <p>{controlSheetData?.expiredNotice || formData.controlExpiredNotice}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: Notification Sound & Processing SLA Settings (التنبيهات الصوتية ومهلة معالجة الطلبات) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header Card */}
            <div className="bg-theme-card border border-theme-card p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-theme-card pb-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-theme-main">تخصيص التنبيهات الصوتية ومراقبة تأخير المعالجة</h2>
                  <p className="text-xs text-theme-subtext">حدد نوع النغمة الصوتية المفضلة عند وصول طلب جديد، واضبط مهلة معالجة الطلبات لعمل العداد التنازلي التلقائي.</p>
                </div>
              </div>

              {/* 1. Audio Sound Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-theme-main flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>نغمة التنبيه عند وصول طلب جديد (New Order Notification Sound):</span>
                  </label>
                  <span className="text-[11px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                    حالة النغمة: {formData.orderNotificationSound === 'none' ? 'صامت (موقوف)' : 'مفعلة'}
                  </span>
                </div>

                {/* Sound Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'none', label: 'إيقاف الصوت (صامت)', desc: 'بدون تشغيل أي رنة عند استقبال الطلب', icon: VolumeX, badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                    { id: 'chime', label: 'جرس ناعم (Chime)', desc: 'نغمة ثنائية هادئة ومريحة', icon: Bell, badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                    { id: 'cash_register', label: 'رنة الكاشير (Cha-Ching)', desc: 'نغمة مبهجة تُمثل إنجاز عملية بيع', icon: Sparkles, badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                    { id: 'bell', label: 'جرس كلاسيكي (Crystal Bell)', desc: 'رنة جرس كريستالي نقي وواضح', icon: Volume2, badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                    { id: 'pulse', label: 'تنبيه سريع (Pulse Beep)', desc: 'نغمة نبضية ثنائية لافتة للانتباه', icon: Clock, badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
                  ].map((sound) => {
                    const isSelected = (formData.orderNotificationSound || 'chime') === sound.id;
                    const IconComp = sound.icon;

                    return (
                      <div
                        key={sound.id}
                        onClick={() => setFormData({ ...formData, orderNotificationSound: sound.id as any })}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                          isSelected
                            ? 'bg-theme-primary/10 border-theme-primary shadow-lg ring-2 ring-theme-primary/30'
                            : 'bg-theme-inner border-theme-card hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${sound.badgeBg}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-theme-main">{sound.label}</h3>
                              <p className="text-[10px] text-theme-subtext mt-0.5">{sound.desc}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'border-theme-primary bg-theme-primary text-white' : 'border-slate-500'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        {/* Test Button */}
                        {sound.id !== 'none' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playNotificationSound('order', sound.id as any);
                            }}
                            className="mt-1 px-3 py-1.5 rounded-xl bg-theme-card hover:bg-theme-primary hover:text-white border border-theme-card text-theme-main text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current text-amber-400" />
                            <span>استماع تجريبي للنغمة</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Processing SLA Window & Countdown Settings */}
              <div className="pt-6 border-t border-theme-card space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-theme-main">مهلة معالجة الطلب والعداد التنازلي للتأخير</h3>
                    <p className="text-xs text-theme-subtext">حدد الحد الأقصى للمدة الزمنية المسموح بها لتجهيز الطلب قبل احتسابه كمُتأخر وسيعرض النظام عداداً تنازلياً ينبه المشرفين تلقائياً.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 bg-theme-inner p-4 rounded-2xl border border-theme-card">
                    <label className="text-xs font-bold text-theme-main block">
                      الحد الأقصى لمعالجة الطلب (بالساعات):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.5"
                        max="72"
                        step="0.5"
                        value={formData.orderMaxProcessingHours ?? 2}
                        onChange={(e) => setFormData({ ...formData, orderMaxProcessingHours: parseFloat(e.target.value) || 2 })}
                        className="w-full bg-theme-card border border-theme-card rounded-xl p-3 text-theme-main text-sm font-mono focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-theme-subtext shrink-0">ساعة</span>
                    </div>
                    <p className="text-[10px] text-theme-subtext leading-relaxed">
                      الافتراضي: ساعتان (2 ساعة). الطلبات التي تتجاوز هذا الوقت سيتغير لون عدادها التنازلي إلى الأحمر مع تنبيه بالوقت المتأخر بالدقائق والساعات.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-theme-main space-y-2">
                    <strong className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> كيف يعمل العداد التنازلي للتأخير؟
                    </strong>
                    <ul className="space-y-1.5 text-[11px] text-theme-subtext list-disc list-inside leading-relaxed">
                      <li>تظهر شارة العداد التنازلي تلقائياً بجانب أي طلب حالته <strong className="text-amber-300">⏳ قيد الانتظار</strong> أو <strong className="text-blue-300">📦 جاري التجهيز</strong>.</li>
                      <li>إذا تبقي أكثر من 30 دقيقة: يظهر العداد باللون الأخضر/الأزرق <span className="text-indigo-400 font-mono">⏳ متبقي 1س 20د</span>.</li>
                      <li>عند بقاء أقل من 30 دقيقة: يظهر تنبيه نبضي باللون الأصفر <span className="text-amber-400 font-mono">⚠️ اقتراب التأخير</span>.</li>
                      <li>عند تجاوز الوقت المسموح: يتحول العداد فوراً للتنبيه الأحمر النابض <span className="text-rose-400 font-mono">🚨 متأخر عن المعالجة بـ Xد</span>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Bottom Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-theme-primary/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>حفظ كافة إعدادات المتجر والمزامنة الفورية</span>
          </button>
        </div>

      </div>
    </div>
  );
};
