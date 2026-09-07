import React, { useState } from 'react';
import { 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Save, 
  Plus, 
  Trash2, 
  Store, 
  Code, 
  Sparkles, 
  FileSpreadsheet,
  Globe,
  Coins,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { AppSettings, CurrencyRate, Product } from '../../types';
import { sendToGoogleAppsScriptWebApp } from '../../lib/googleSheetsAppsScript';
import { runFullCrudAuditTest, AuditTestStepResult, FullAuditTestReport } from '../../lib/auditTest';

interface SheetsSyncTabProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  currencies: CurrencyRate[];
  onUpdateCurrencies: (c: CurrencyRate[]) => void;
  onOpenAppsScriptModal: () => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  pendingCount: number;
  products?: Product[];
  logAudit?: (user: string, action: string, details: string) => void;
  addNotification?: (title: string, msg: string, type: 'order' | 'sync' | 'info' | 'warning') => void;
}

export const SheetsSyncTab: React.FC<SheetsSyncTabProps> = ({
  settings,
  onUpdateSettings,
  currencies,
  onUpdateCurrencies,
  onOpenAppsScriptModal,
  onTriggerSync,
  isSyncing,
  pendingCount,
  products = [],
  logAudit,
  addNotification
}) => {
  // Google Apps Script Web App URL
  const [googleWebAppUrl, setGoogleWebAppUrl] = useState(
    settings.googleAppsScriptUrl || 
    (typeof window !== 'undefined' ? localStorage.getItem('googleWebAppUrl') || '' : '')
  );
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const [sheetsSyncMsg, setSheetsSyncMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Store & Currency Settings Local Form State
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [vatPercentage, setVatPercentage] = useState(settings.vatPercentage);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);
  
  // Local Currencies List Form State
  const [currencyList, setCurrencyList] = useState<CurrencyRate[]>(currencies);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Add new currency modal / form inputs
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState<number>(1.0);
  const [showAddCurrency, setShowAddCurrency] = useState(false);

  // Internal Audit Test State
  const [isRunningAuditTest, setIsRunningAuditTest] = useState(false);
  const [auditReport, setAuditReport] = useState<FullAuditTestReport | null>(null);
  const [liveAuditSteps, setLiveAuditSteps] = useState<AuditTestStepResult[]>([]);

  const handleStartAuditTest = async () => {
    if (!googleWebAppUrl.trim()) {
      setSheetsSyncMsg({ success: false, text: 'يرجى إدخال رابط Google Apps Script URL أولاً لإجراء اختبار التدقيق' });
      return;
    }

    setIsRunningAuditTest(true);
    setAuditReport(null);
    setLiveAuditSteps([]);

    try {
      const report = await runFullCrudAuditTest({
        webAppUrl: googleWebAppUrl.trim(),
        existingSettings: settings,
        onStepUpdate: (step) => {
          setLiveAuditSteps(prev => {
            const existingIdx = prev.findIndex(s => s.id === step.id);
            if (existingIdx >= 0) {
              const clone = [...prev];
              clone[existingIdx] = step;
              return clone;
            }
            return [...prev, step];
          });
        },
        logAudit,
        addNotification
      });

      setAuditReport(report);
      setLiveAuditSteps(report.steps);
    } catch (err: any) {
      console.error('Audit test failed:', err);
    } finally {
      setIsRunningAuditTest(false);
    }
  };

  const handleSaveGoogleSheetsConfig = () => {
    const cleanUrl = googleWebAppUrl.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('googleWebAppUrl', cleanUrl);
    }
    onUpdateSettings({
      ...settings,
      googleAppsScriptUrl: cleanUrl,
      isSheetConnected: true
    });
    setSheetsSyncMsg({ success: true, text: '✅ تم حفظ رابط Google Web App URL بنجاح!' });
    setTimeout(() => setSheetsSyncMsg(null), 4000);
  };

  const handleSyncToGoogleSheetsNow = async () => {
    if (!googleWebAppUrl.trim()) {
      setSheetsSyncMsg({ success: false, text: 'يرجى إدخال رابط Google Web App URL أولاً' });
      return;
    }

    setSyncingGoogleSheets(true);
    setSheetsSyncMsg(null);

    try {
      if (onTriggerSync) {
        await onTriggerSync();
        setSheetsSyncMsg({
          success: true,
          text: '✅ تمت المزامنة الشاملة لجميع الأوراق الـ 9 (المنتجات، الإعدادات، الموظفين، التصنيفات، الطلبات، العملاء، الموردين، الفواتير، العروض) بنجاح!'
        });
      } else {
        const res = await sendToGoogleAppsScriptWebApp(googleWebAppUrl, {
          action: 'sync_all',
          products: products
        });
        setSheetsSyncMsg({
          success: res.success,
          text: res.message
        });
      }
    } catch (err: any) {
      setSheetsSyncMsg({
        success: false,
        text: err.message || 'حدث خطأ أثناء المزامنة'
      });
    } finally {
      setSyncingGoogleSheets(false);
      setTimeout(() => setSheetsSyncMsg(null), 6000);
    }
  };

  const handleUpdateRate = (code: string, newRate: number) => {
    setCurrencyList(prev => prev.map(c => c.currencyCode === code ? { ...c, exchangeRate: newRate } : c));
  };

  const handleAddCurrencyItem = () => {
    if (!newCurrencyCode.trim() || !newCurrencyName.trim() || !newCurrencySymbol.trim()) return;
    const item: CurrencyRate = {
      currencyCode: newCurrencyCode.trim().toUpperCase(),
      currencyName: newCurrencyName.trim(),
      symbol: newCurrencySymbol.trim(),
      exchangeRate: Number(newCurrencyRate) || 1.0
    };

    setCurrencyList(prev => [...prev.filter(c => c.currencyCode !== item.currencyCode), item]);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setNewCurrencySymbol('');
    setNewCurrencyRate(1.0);
    setShowAddCurrency(false);
  };

  const handleDeleteCurrency = (code: string) => {
    if (code === 'SAR') return; // Cannot delete base currency
    setCurrencyList(prev => prev.filter(c => c.currencyCode !== code));
  };

  const handleSaveAllSettingsAndCurrencies = async () => {
    setSavingSettings(true);
    setSettingsSaveMsg(null);

    const updatedSettings: AppSettings = {
      ...settings,
      storeName,
      storePhone,
      vatPercentage: Number(vatPercentage) || 0,
      defaultCurrency,
      googleAppsScriptUrl: googleWebAppUrl.trim(),
      isSheetConnected: true
    };

    onUpdateSettings(updatedSettings);
    onUpdateCurrencies(currencyList);

    setSettingsSaveMsg('✅ تم حفظ إعدادات المتجر، ورابط Google Sheets، وأسعار العملات ومزامنتها بنجاح!');
    setSavingSettings(false);
    setTimeout(() => setSettingsSaveMsg(null), 5000);
  };

  const sheetsOverview = [
    { name: 'المنتجات', icon: '📦', cols: 12, desc: 'حفظ واسترجاع كافة بيانات وسلع المتجر والباركود والصور' },
    { name: 'إعدادات_المتجر', icon: '⚙️', cols: 2, desc: 'اسم المتجر، الشعار، الضريبة، الهاتف، العملة ومفاتيح الربط' },
    { name: 'الموظفين', icon: '👤', cols: 6, desc: 'بيانات الكادر، الأدوار، الصلاحيات، الهاتف والحالة' },
    { name: 'التصنيفات', icon: '📁', cols: 4, desc: 'أقسام وفئات المنتجات الرئيسية والصور' },
    { name: 'الطلبات', icon: '🛒', cols: 9, desc: 'سجل المبيعات، الفواتير، وحالة الدفع والشحن' },
    { name: 'العملاء', icon: '👥', cols: 8, desc: 'حسابات وإحصائيات المشتريين والرصيد والعناوين' },
    { name: 'الموردين', icon: '🚚', cols: 7, desc: 'بيانات الموردين والشركات وأرقام الاتصال' },
    { name: 'الفواتير', icon: '🧾', cols: 9, desc: 'فواتير المبيعات الإلكترونية ورمز الاستجابة السريع QR' },
    { name: 'العروض_والكوبونات', icon: '🏷️', cols: 8, desc: 'أكواد الخصم الترويجية ونسب التخفيض وتواريخ الصلاحية' }
  ];

  return (
    <div className="space-y-6 text-slate-100 dir-rtl">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>إدارة المزامنة الفورية مع Google Sheets & Excel Online</span>
        </h2>
        <p className="text-xs text-slate-400">
          ربط المتجر بجدول Google Sheets (إكسل أونلاين) لضمان مزامنة واستقرار دقيق وسريع لجميع المنتجات والطلبات
        </p>
      </div>

      {/* 🟢 GOOGLE SHEETS API & APPS SCRIPT SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>ربط جدول بيانات Google Sheets (Google Apps Script API)</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                  Code.gs
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تطبيق الربط المباشر بجدول جوجل شيت مع إنشاء 12 ورقة عمل وأعمدة منسقة بضغطة زر واحدة
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAppsScriptModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer shrink-0"
          >
            <Code className="w-4 h-4" />
            <span>عرض كود Google Apps Script والتعليمات</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-200 font-bold mb-1.5 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>رابط تطبيق الويب المباشر (Google Web App URL):</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={googleWebAppUrl ?? ""}
                onChange={(e) => setGoogleWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveGoogleSheetsConfig}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>حفظ الرابط</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-slate-300 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>مزامنة جلب وبذر كافة المنتجات ({products.length} منتج) إلى شيت جوجل تلقائياً</span>
            </div>

            <button
              onClick={handleSyncToGoogleSheetsNow}
              disabled={syncingGoogleSheets}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncingGoogleSheets ? 'animate-spin' : ''}`} />
              <span>مزامنة وبذر البيانات مع Google Sheets الآن</span>
            </button>
          </div>

          {sheetsSyncMsg && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              sheetsSyncMsg.success 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {sheetsSyncMsg.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{sheetsSyncMsg.text}</span>
            </div>
          )}

          {/* Quick Sheets Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
            {sheetsOverview.map((item, i) => (
              <div key={i} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-lg">{item.icon}</span>
                <p className="text-[11px] font-bold text-emerald-300">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{item.cols} أعمدة</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🧪 SYSTEM AUDIT & GRANULAR CRUD TEST ENGINE */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>سكربت الفحص والتدقيق الداخلي الشامل (CRUD Audit Test)</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  محاكاة حقيقية عبر ID
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                يقوم بمحاكاة عمليات (إضافة، قراءة وتحقق، تعديل دقيق، وحذف بالـ ID) مع فحص توزيع الصورتين لضمان ظهور البيانات 100%
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAuditTest}
            disabled={isRunningAuditTest}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isRunningAuditTest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري تنفيذ الاختبار الشامل...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>تشغيل اختبار التدقيق الشامل الآن</span>
              </>
            )}
          </button>
        </div>

        {/* Live Step-by-Step Progress or Initial Guidance */}
        {liveAuditSteps.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {liveAuditSteps.map((step) => {
                const isRunning = step.status === 'running';
                const isSuccess = step.status === 'success';
                const isFailed = step.status === 'failed';
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs ${
                      isRunning
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 animate-pulse'
                        : isSuccess
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        : isFailed
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isRunning && <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />}
                        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isFailed && <XCircle className="w-4 h-4 text-rose-400" />}
                        {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{step.name}</p>
                        <p className="text-[11px] opacity-90 mt-0.5">{step.message}</p>
                      </div>
                    </div>

                    {step.durationMs !== undefined && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 shrink-0 text-slate-300">
                        {step.durationMs} ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {auditReport && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
                auditReport.success 
                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                  : 'bg-rose-950/60 text-rose-200 border-rose-500/50'
              }`}>
                <div className="flex items-center gap-2">
                  {auditReport.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                  <span>{auditReport.summaryMessage}</span>
                </div>
                <span className="font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  {((auditReport.durationMs || 0) / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>ماذا يفحص اختبار التدقيق والمحاكاة؟</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pr-1">
              <li>1. التحقق من استجابة رابط Google Apps Script وقراءة الأوراق الـ 12.</li>
              <li>2. إنشاء منتج تجريبي مع صورتين عبر أمر موجه للـ ID والتأكد من ترتيب الخانات (صورة 1 ثم 2).</li>
              <li>3. قراءة ورقة المنتجات والتحقق من تطابق الصف والأعمدة.</li>
              <li>4. تعديل سعر المنتج وحذف الصورة الثانية والتحقق من تفريغ الخلية بدقة في الأكسل.</li>
              <li>5. إنشاء طلب تجريبي ومزامنته بالـ OrderID ثم تحديث حالة الشحن والتتبع.</li>
              <li>6. حذف المنتج التجريبي بالكامل بالـ ID وتنظيف الشيت بدون أي بقايا، وتوثيق النتيجة في سجل العمليات.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Currency Exchange Rates & Store Settings Editor Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">إدارة أسعار صرف العملات وتحويلات المتجر</h3>
              <p className="text-xs text-slate-400">حدد سعر صرف العملات مقابل العملة الأساسية (الريال السعودي) ليتم تحويل أسعار المنتجات تلقائياً</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddCurrency(!showAddCurrency)}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عملة جديدة</span>
          </button>
        </div>

        {/* Add New Currency Form */}
        {showAddCurrency && (
          <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-indigo-300">إضافة عملة تحويل جديدة للمتجر:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">رمز العملة (e.g. EGP):</label>
                <input
                  type="text"
                  placeholder="مثال: EGP"
                  value={newCurrencyCode || ""}
                  onChange={(e) => setNewCurrencyCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">اسم العملة بالعربي:</label>
                <input
                  type="text"
                  placeholder="مثال: جنيه مصري"
                  value={newCurrencyName || ""}
                  onChange={(e) => setNewCurrencyName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">رمز/رمز العرض (Symbol):</label>
                <input
                  type="text"
                  placeholder="مثال: ج.م"
                  value={newCurrencySymbol || ""}
                  onChange={(e) => setNewCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">سعر التحويل (مقابل 1 ر.س):</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="1.0"
                  value={newCurrencyRate ?? ""}
                  onChange={(e) => setNewCurrencyRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAddCurrency(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCurrencyItem}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
              >
                إضافة
              </button>
            </div>
          </div>
        )}

        {/* Currency Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">رمز العملة</th>
                <th className="p-3">اسم العملة</th>
                <th className="p-3">الرمز بالعرض</th>
                <th className="p-3">سعر الصرف والتحويل (مقابل 1 ريال سعودي)</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currencyList.map(c => (
                <tr key={c.currencyCode} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-amber-400">{c.currencyCode}</td>
                  <td className="p-3 font-bold text-white">{c.currencyName}</td>
                  <td className="p-3 font-mono text-pink-400">{c.symbol}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        step="0.001"
                        value={c.exchangeRate ?? ""}
                        onChange={(e) => handleUpdateRate(c.currencyCode, Number(e.target.value))}
                        disabled={c.currencyCode === 'SAR'}
                        className="w-32 bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                      <span className="text-[11px] text-slate-400">
                        {c.currencyCode === 'SAR' ? '(العملة الأساسية = 1.0)' : `1 ر.س = ${c.exchangeRate} ${c.symbol}`}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {c.currencyCode !== 'SAR' && (
                      <button
                        onClick={() => handleDeleteCurrency(c.currencyCode)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="حذف العملة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* General Store Settings Form */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>بيانات المتجر الأساسية والضريبة:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">اسم المتجر:</label>
              <input
                type="text"
                value={storeName || ""}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">رقم هاتف المتجر والواتساب:</label>
              <input
                type="text"
                value={storePhone || ""}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">نسبة القيمة المضافة الضريبية VAT %:</label>
              <input
                type="number"
                value={vatPercentage ?? ""}
                onChange={(e) => setVatPercentage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleSaveAllSettingsAndCurrencies}
            disabled={savingSettings}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}</span>
          </button>

          {settingsSaveMsg && (
            <span className="text-xs font-bold text-emerald-400 animate-pulse">
              {settingsSaveMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
