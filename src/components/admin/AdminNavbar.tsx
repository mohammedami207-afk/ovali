import React, { useState, useEffect } from 'react';
import { 
  Store, 
  RefreshCw, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  Radio,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Check,
  Zap,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';
import { AppSettings } from '../../types';
import { getCurrentThemeMode, applyThemeGlobal } from '../../lib/themeHelper';

interface AdminNavbarProps {
  onOpenStore: () => void;
  onOpenAppsScriptModal: () => void;
  onTriggerSync: () => void;
  settings: AppSettings;
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  pendingCount: number;
  currentRole?: string;
  onRoleChange?: (role: 'SuperAdmin' | 'Manager' | 'Supplier') => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onOpenStore,
  onOpenAppsScriptModal,
  onTriggerSync,
  settings,
  isOnline,
  isSyncing,
  syncStatus,
  pendingCount,
  currentRole = 'SuperAdmin',
  onRoleChange,
  themeMode,
  onToggleTheme
}) => {
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcMsg, setNfcMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Real-time Network & Google Sheets Connection Monitor Hook
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    const checkConnection = () => {
      if (!navigator.onLine) {
        setConnectionSpeed('offline');
        return;
      }
      // @ts-ignore
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const type = conn.effectiveType;
        if (type === 'slow-2g' || type === '2g' || type === '3g') {
          setConnectionSpeed('slow');
        } else {
          setConnectionSpeed('fast');
        }
      } else {
        setConnectionSpeed('fast');
      }
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    // @ts-ignore
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', checkConnection);
    }

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      if (conn) {
        conn.removeEventListener('change', checkConnection);
      }
    };
  }, []);

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

  // Direct clean store URL (around 50 bytes)
  const cleanUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shein-store.app';
  const cleanBytes = new TextEncoder().encode(cleanUrl).length;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cleanUrl)}&color=0f172a&bgcolor=ffffff&margin=10`;

  const handleQuickCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Store_QR_${settings?.storeName || 'store'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleWriteNfc = async () => {
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!('NDEFReader' in window)) {
      setNfcMsg({ text: 'خاصية Web NFC غير مدعومة في متصفحك. استخدم تطبيق NFC Tools بنسخ الرابط الصافي.', ok: false });
      return;
    }

    if (isInsideIframe) {
      setNfcMsg({ text: 'برمجة Web NFC تتطلب فتح المتجر في تبويب مستقل خارج إطار المعاينة (IFrame). أو انسخ الرابط واستخدم تطبيق NFC Tools.', ok: false });
      return;
    }

    try {
      setNfcWriting(true);
      setNfcMsg({ text: 'المس بطاقة NFC بظهر الهاتف الآن...', ok: true });
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.write({ records: [{ recordType: 'url', data: cleanUrl }] });
      setNfcMsg({ text: '✨ تمت برمجة البطاقة بنجاح بالرابط الصافي!', ok: true });
    } catch (e: any) {
      const isTopLevelError = e.message?.includes('top-level browsing context') || e.name === 'SecurityError';
      if (isTopLevelError) {
        setNfcMsg({ text: 'أمان المتصفح يمنع Web NFC داخل المعاينة المضمنة (IFrame). افتح المتجر في نافذة مستقلة أو انسخ الرابط لتطبيق NFC Tools.', ok: false });
      } else {
        setNfcMsg({ text: e.message || 'فشلت الكتابة على البطاقة.', ok: false });
      }
    } finally {
      setNfcWriting(false);
    }
  };

  const isSheetsConfigured = Boolean(
    settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')
  );

  // Compute exact status and visual styles
  const effectiveStatus = !isOnline 
    ? 'offline' 
    : isSyncing || syncStatus === 'syncing' 
    ? 'syncing' 
    : syncStatus === 'error' 
    ? 'error' 
    : syncStatus === 'synced' || isSheetsConfigured 
    ? 'synced' 
    : 'idle';

  return (
    <header className="bg-theme-card border-b border-theme-card px-3 sm:px-6 py-2 text-theme-main flex items-center justify-between gap-2 shrink-0 z-30 relative shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {settings?.storeLogoUrl && settings.storeLogoUrl.trim() ? (
          <img 
            src={settings.storeLogoUrl} 
            alt={settings.storeName || 'شعار المتجر'} 
            className="h-8 sm:h-9 w-auto max-w-[100px] sm:max-w-[140px] object-contain rounded-lg bg-theme-inner p-1 border border-theme-card shadow shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.admin-logo-fallback') as HTMLElement;
              if (fallback) fallback.style.display = 'inline-block';
            }}
          />
        ) : null}
        <span 
          className="admin-logo-fallback bg-theme-gradient text-white font-black text-sm sm:text-lg px-2 sm:px-3 py-0.5 rounded-lg shadow-md font-serif shrink-0"
          style={{ display: settings?.storeLogoUrl && settings.storeLogoUrl.trim() ? 'none' : 'inline-block' }}
        >
          {settings?.storeName ? settings.storeName.split(' ')[0] : 'المتجر'}
        </span>

        <div className="leading-tight min-w-0 hidden xs:block">
          <h1 className="text-xs sm:text-sm font-bold text-theme-main truncate">
            {settings?.storeName ? `${settings.storeName} - لوحة التحكم` : 'لوحة التحكم'}
          </h1>
          <p className="text-[10px] text-emerald-500 font-bold hidden sm:block">Google Sheets & Excel Live Sync</p>
        </div>

        {/* Real-time Google Sheets Connection Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isSheetsConfigured ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              <span>Sheets غير مهيأ</span>
            </span>
          ) : connectionSpeed === 'offline' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse select-none" title="الرجاء التحقق من اتصال الانترنت لديك">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>غير متصل ❌</span>
            </span>
          ) : connectionSpeed === 'slow' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 select-none" title="جودة الاتصال ضعيفة">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>متصل ببطء ⚠️</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 select-none" title="اتصال Google Sheets جاهز ومستقر بشكل لحظي">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>متصل لحظياً ✅</span>
            </span>
          )}
        </div>

        {/* Active Role Indicator Badge (Read-only) */}
        <div className="relative shrink-0">
          <div className="bg-theme-inner border border-theme-card text-theme-primary font-bold text-[10px] sm:text-[11px] px-2.5 py-1 rounded-xl shadow-xs">
            {currentRole === 'Supplier' ? '📦 مورد' : currentRole === 'Manager' ? '💼 مدير' : '👑 سوبر أدمن'}
          </div>
        </div>

        {/* Single Unified Smart Sync Action Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              if (!isSyncing && isOnline) {
                onTriggerSync();
              }
            }}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              effectiveStatus === 'syncing'
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20'
                : effectiveStatus === 'synced'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                : effectiveStatus === 'error'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
            title="انقر للمزامنة الفورية مع Google Sheets"
          >
            {/* Live Indicator Dot or Spinner */}
            {effectiveStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
            ) : effectiveStatus === 'synced' ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : effectiveStatus === 'error' ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}

            {/* Sync Label */}
            <span className="hidden sm:inline font-bold">
              {effectiveStatus === 'syncing'
                ? 'جاري المزامنة...'
                : effectiveStatus === 'synced'
                ? 'مزامنة Google Sheets'
                : effectiveStatus === 'offline'
                ? 'أوفلاين (غير متصل)'
                : 'إعادة المزامنة'}
            </span>

            <span className="sm:hidden text-[11px] font-bold">
              {effectiveStatus === 'syncing'
                ? 'مزامنة...'
                : effectiveStatus === 'synced'
                ? 'مزامنة'
                : effectiveStatus === 'offline'
                ? 'أوفلاين'
                : 'إعادة'}
            </span>

            {/* Pending count badge if any */}
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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

        {/* Quick NFC & QR Link Button */}
        <button
          onClick={() => setShowNfcModal(true)}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-theme-inner hover:bg-theme-card text-theme-main border border-theme-card rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          title="رابط NFC والباركود السريع للمتجر"
        >
          <Radio className="w-3.5 h-3.5 text-theme-primary animate-pulse" />
          <span className="hidden sm:inline">رابط NFC والباركود</span>
          <span className="sm:hidden text-[11px]">NFC</span>
        </button>

        {/* Google Sheets Config Setup Modal Trigger */}
        <button
          onClick={onOpenAppsScriptModal}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          title="كود وسكربت Google Sheets Apps Script"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">ربط Google Sheets</span>
        </button>

        {/* Switch to Storefront */}
        <button
          onClick={onOpenStore}
          className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 bg-theme-gradient hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md shadow-theme-primary/20 transition-all whitespace-nowrap cursor-pointer"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">الذّهاب للمتجر</span>
          <span className="xs:hidden text-[11px]">المتجر</span>
        </button>
      </div>

      {/* NFC & QR Quick Modal */}
      {showNfcModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowNfcModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl text-slate-100 space-y-5 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">رابط المتجر الصافي لـ NFC والباركود</h3>
                  <p className="text-[11px] text-slate-400">حجم خفيف جداً ({cleanBytes} بايت فقط) مناسب لجميع البطاقات</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNfcModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* QR Code & Direct Link */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="p-2 bg-white rounded-xl shadow-md border shrink-0">
                <img src={qrUrl} alt="Store QR" className="w-28 h-28 object-contain" />
              </div>
              <div className="space-y-2 text-xs flex-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">الرابط الفعلي للمتجر:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    {cleanBytes}B
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={cleanUrl ?? ""}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs select-all focus:outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleQuickCopy}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                  <button
                    onClick={handleDownloadQr}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تنزيل QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Web NFC Writer */}
            <div className="space-y-2">
              <button
                onClick={handleWriteNfc}
                disabled={nfcWriting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" />
                <span>{nfcWriting ? 'جاري الكتابة (المس البطاقة)...' : 'برمجة بطاقة NFC مباشرة من الهاتف'}</span>
              </button>

              {nfcMsg && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  nfcMsg.ok ? 'bg-emerald-950 text-emerald-200 border border-emerald-800' : 'bg-amber-950 text-amber-200 border border-amber-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{nfcMsg.text}</span>
                </div>
              )}
            </div>

            {/* Simple Tip for NFC Tools */}
            <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-indigo-300 block">💡 لتطبيق NFC Tools:</span>
              <p>اضغط "نسخ الرابط"، ثم في التطبيق اختر <strong>WRITE</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL</strong> والصق الرابط فقط والمس البطاقة.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
