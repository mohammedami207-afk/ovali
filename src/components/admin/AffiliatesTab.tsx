import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Gift, 
  Wallet, 
  TrendingUp, 
  MousePointerClick, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  CreditCard,
  Building,
  RefreshCw,
  X,
  FileSpreadsheet,
  ArrowDownToLine,
  PhoneCall,
  Sparkles,
  Percent,
  Layers,
  Database,
  CheckCircle,
  CloudCheck,
  Send
} from 'lucide-react';
import { ReferralPartner, CurrencyRate, AppSettings, Order } from '../../types';
import { 
  getLocalReferralPartners, 
  saveLocalReferralPartners, 
  addReferralPartner, 
  updateReferralPartner, 
  deleteReferralPartner, 
  payoutReferralPartner 
} from '../../lib/offlineStorage';
import { executeUnifiedSheetsOperation, sendToGoogleAppsScriptWebApp } from '../../lib/googleSheetsAppsScript';
import { IdBadge } from './SimpleTabs';

interface AffiliatesTabProps {
  partners?: ReferralPartner[];
  orders?: Order[];
  currency?: CurrencyRate;
  currencies?: CurrencyRate[];
  settings: AppSettings;
  onAddPartner?: (partner: ReferralPartner) => Promise<void> | void;
  onUpdatePartner?: (partner: ReferralPartner) => Promise<void> | void;
  onDeletePartner?: (id: string) => Promise<void> | void;
  onPayoutPartner?: (id: string, amountOrNote?: any) => Promise<void> | void;
  onLogAudit?: (action: string, details: string) => void;
  onSyncSheets?: () => Promise<void>;
  isSyncing?: boolean;
}

export const AffiliatesTab: React.FC<AffiliatesTabProps> = ({
  partners: propsPartners,
  orders = [],
  currency: propCurrency,
  currencies = [
    { currencyCode: 'SAR', currencyName: 'ريال سعودي', exchangeRate: 1.0, symbol: 'ر.س' },
    { currencyCode: 'YER', currencyName: 'ريال يمني', exchangeRate: 142.5, symbol: 'ر.ي' },
    { currencyCode: 'USD', currencyName: 'دولار أمريكي', exchangeRate: 0.266, symbol: '$' }
  ],
  settings,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onPayoutPartner,
  onLogAudit,
  onSyncSheets,
  isSyncing: propIsSyncing = false
}) => {
  const [localPartners, setLocalPartners] = useState<ReferralPartner[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'paid' | 'none'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isInternalSyncing, setIsInternalSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ReferralPartner | null>(null);
  const [payoutModalPartner, setPayoutModalPartner] = useState<ReferralPartner | null>(null);
  const [showOrdersModalPartner, setShowOrdersModalPartner] = useState<ReferralPartner | null>(null);
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formBalance, setFormBalance] = useState(0);

  const isConnectedToSheets = Boolean(
    settings?.googleAppsScriptUrl && 
    settings.googleAppsScriptUrl.trim().startsWith('http')
  );

  const isSyncing = propIsSyncing || isInternalSyncing;

  const loadPartners = () => {
    const data = getLocalReferralPartners();
    setLocalPartners(data);
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const partners = propsPartners && propsPartners.length > 0 ? propsPartners : localPartners;

  const showNotification = (title: string, message: string) => {
    setSyncToastMessage(`${title}: ${message}`);
    setTimeout(() => setSyncToastMessage(null), 4000);
  };

  // Trigger Instant Live Sync from Google Sheets directly
  const handleLiveSync = async () => {
    if (onSyncSheets) {
      await onSyncSheets();
      return;
    }

    if (!isConnectedToSheets) {
      showNotification('💾 التخزين المحلي', 'تم تحديث البيانات من التخزين المحلي');
      loadPartners();
      return;
    }

    setIsInternalSyncing(true);
    try {
      const res = await sendToGoogleAppsScriptWebApp(settings.googleAppsScriptUrl!, {
        action: 'read_all'
      }) as any;

      if (res.success && Array.isArray(res.affiliates)) {
        setLocalPartners(res.affiliates);
        saveLocalReferralPartners(res.affiliates);
        showNotification('⚡ مزامنة Google Sheets', `تم جلب وتحديث ${res.affiliates.length} مسوق من ورقة الإكسل بنجاح!`);
      } else {
        showNotification('⚠️ تنبيه', res.message || 'تعذر جلب بيانات المسوقين من شيت جوجل');
      }
    } catch (err: any) {
      showNotification('❌ خطأ في الاتصال', 'فشلت المزامنة المباشرة مع جدول المسوقين');
    } finally {
      setIsInternalSyncing(false);
    }
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const q = search.toLowerCase().trim();
      const matchesSearch = 
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.bankDetails && p.bankDetails.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || p.withdrawalStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [partners, search, statusFilter]);

  // Analytics Calculations
  const totalClicks = partners.reduce((sum, p) => sum + (p.totalClicks || 0), 0);
  const totalRegistered = partners.reduce((sum, p) => sum + (p.registeredCount || 0), 0);
  const totalOrders = partners.reduce((sum, p) => sum + (p.ordersCount || 0), 0);
  const totalAvailableBalance = partners.reduce((sum, p) => sum + (p.availableBalance || 0), 0);
  const totalPaidEarnings = partners.reduce((sum, p) => sum + (p.paidEarnings || 0), 0);
  const withdrawalRequestsCount = partners.filter(p => p.withdrawalStatus === 'requested').length;

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rwnaq-store.app';
    const link = `${origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setFormName('');
    setFormPhone('');
    setFormCode(`ref_${Date.now().toString().slice(-4)}`);
    setFormBankDetails('');
    setFormBalance(0);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: ReferralPartner) => {
    setEditingPartner(p);
    setFormName(p.name);
    setFormPhone(p.phone);
    setFormCode(p.code);
    setFormBankDetails(p.bankDetails || '');
    setFormBalance(p.availableBalance);
    setShowAddModal(true);
  };

  // Add / Edit Partner with Real-Time Google Sheets Sync
  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    setIsSubmitting(true);
    const cleanCode = formCode.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      if (editingPartner) {
        const updated: ReferralPartner = {
          ...editingPartner,
          name: formName.trim(),
          phone: formPhone.trim(),
          code: cleanCode,
          bankDetails: formBankDetails.trim(),
          availableBalance: Number(formBalance) || 0,
          lastActive: new Date().toISOString().slice(0, 10)
        };

        let updatedList: ReferralPartner[] = [];
        if (onUpdatePartner) {
          await onUpdatePartner(updated);
        } else {
          updateReferralPartner(updated);
          updatedList = getLocalReferralPartners();
          setLocalPartners(updatedList);
        }

        // Direct Google Sheets Instant Upsert
        if (isConnectedToSheets) {
          await executeUnifiedSheetsOperation({
            action: 'save_affiliate',
            payload: {
              id: updated.id,
              affiliate: updated,
              affiliates: updatedList.length > 0 ? updatedList : partners.map(p => p.id === updated.id ? updated : p)
            },
            entityName: `المسوق "${updated.name}"`,
            operationType: 'تحديث سحابي',
            webAppUrl: settings.googleAppsScriptUrl
          });
        }

        if (onLogAudit) {
          onLogAudit('تعديل بيانات مسوق إحالة', `تم تعديل بيانات المسوق ${updated.name} (الكود: ${updated.code}) والرصيد: ${updated.availableBalance} ر.س ومزامنتها مع Google Sheets`);
        }
        showNotification('✅ تم الحفظ', `تم تحديث بيانات المسوق "${updated.name}" وحفظها في Google Sheets بنجاح!`);
      } else {
        const newPartner: ReferralPartner = {
          id: `REF_${Date.now().toString().slice(-6)}`,
          name: formName.trim(),
          phone: formPhone.trim(),
          code: cleanCode,
          totalClicks: 0,
          registeredCount: 0,
          ordersCount: 0,
          totalEarnings: Number(formBalance) || 0,
          paidEarnings: 0,
          availableBalance: Number(formBalance) || 0,
          withdrawalStatus: 'none',
          bankDetails: formBankDetails.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
          lastActive: new Date().toISOString().slice(0, 10)
        };

        let updatedList: ReferralPartner[] = [];
        if (onAddPartner) {
          await onAddPartner(newPartner);
        } else {
          addReferralPartner(newPartner);
          updatedList = getLocalReferralPartners();
          setLocalPartners(updatedList);
        }

        // Direct Google Sheets Instant Upsert
        if (isConnectedToSheets) {
          await executeUnifiedSheetsOperation({
            action: 'save_affiliate',
            payload: {
              id: newPartner.id,
              affiliate: newPartner,
              affiliates: updatedList.length > 0 ? updatedList : [newPartner, ...partners]
            },
            entityName: `المسوق "${newPartner.name}"`,
            operationType: 'إضافة سحابية',
            webAppUrl: settings.googleAppsScriptUrl
          });
        }

        if (onLogAudit) {
          onLogAudit('إضافة مسوق إحالة جديد', `تم تسجيل مسوق جديد ${newPartner.name} بكود الإحالة ${newPartner.code} ومزامنته مع Google Sheets`);
        }
        showNotification('🎉 تم التسجيل', `تمت إضافة المسوق "${newPartner.name}" وإنشاء صفه في Google Sheets بنجاح!`);
      }

      loadPartners();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error saving affiliate partner:', err);
      showNotification('❌ خطأ', 'حدث خطأ أثناء حفظ المسوق في Google Sheets');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Partner with Real-Time Google Sheets Sync
  const handleDelete = async (p: ReferralPartner) => {
    if (window.confirm(`هل أنت متأكد من حذف المسوق "${p.name}" (كود: ${p.code})؟ سيتم حذفه من النظام ومن شيت Google Sheets فورياً.`)) {
      try {
        let updatedList: ReferralPartner[] = [];
        if (onDeletePartner) {
          await onDeletePartner(p.id);
        } else {
          deleteReferralPartner(p.id);
          updatedList = getLocalReferralPartners();
          setLocalPartners(updatedList);
        }

        if (isConnectedToSheets) {
          await executeUnifiedSheetsOperation({
            action: 'delete_affiliate',
            payload: {
              id: p.id,
              code: p.code,
              affiliates: updatedList.length > 0 ? updatedList : partners.filter(item => item.id !== p.id)
            },
            entityName: `المسوق "${p.name}"`,
            operationType: 'حذف سحابي',
            webAppUrl: settings.googleAppsScriptUrl
          });
        }

        if (onLogAudit) {
          onLogAudit('حذف مسوق إحالة', `تم حذف المسوق ${p.name} (الكود: ${p.code}) من النظام ومن Google Sheets`);
        }
        showNotification('🗑️ تم الحذف', `تم حذف صف المسوق "${p.name}" من Google Sheets بنجاح.`);
        loadPartners();
      } catch (err: any) {
        showNotification('❌ خطأ في الحذف', 'تعذر حذف المسوق من Google Sheets');
      }
    }
  };

  const handleOpenPayout = (p: ReferralPartner) => {
    setPayoutModalPartner(p);
    setPayoutNote('');
    setPayoutSuccess(false);
  };

  // Payout & Clear Commission Balance with Real-Time Google Sheets Sync
  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalPartner) return;

    setIsSubmitting(true);
    try {
      let updatedList: ReferralPartner[] = [];
      if (onPayoutPartner) {
        await onPayoutPartner(payoutModalPartner.id, payoutModalPartner.availableBalance);
        setPayoutSuccess(true);
      } else {
        const result = payoutReferralPartner(payoutModalPartner.id, payoutNote);
        if (result.success) {
          setPayoutSuccess(true);
          updatedList = getLocalReferralPartners();
          setLocalPartners(updatedList);
        }
      }

      if (isConnectedToSheets) {
        await executeUnifiedSheetsOperation({
          action: 'payout_affiliate',
          payload: {
            id: payoutModalPartner.id,
            code: payoutModalPartner.code,
            amount: payoutModalPartner.availableBalance,
            note: payoutNote,
            affiliates: updatedList
          },
          entityName: `صرف عمولة "${payoutModalPartner.name}"`,
          operationType: 'صرف وتصفير الرصيد سحابياً',
          webAppUrl: settings.googleAppsScriptUrl
        });
      }

      if (onLogAudit) {
        onLogAudit(
          'سحب وتصفير عمولة مسوق (Payout)', 
          `تم تسليم وصرف مبلغ عمولة قدره ${payoutModalPartner.availableBalance} ر.س للمسوق ${payoutModalPartner.name} (كود: ${payoutModalPartner.code}) وتصفير رصيده في Google Sheets. الملاحظات: ${payoutNote || 'تحويل بنكي مباشر'}`
        );
      }

      loadPartners();
      showNotification('💸 تم الصرف', `تم صرف وتصفير عمولة المسوق "${payoutModalPartner.name}" وتحديث Google Sheets بنجاح!`);

      setTimeout(() => {
        setPayoutSuccess(false);
        setPayoutModalPartner(null);
      }, 2000);
    } catch (err: any) {
      showNotification('❌ خطأ في الصرف', 'حدث خطأ أثناء صرف العمولة في Google Sheets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportAffiliatesToCSV = () => {
    const headers = ['معرف المسوق', 'الاسم', 'كود الإحالة', 'رقم الجوال', 'النقرات والزيارات', 'العملاء المسجلين', 'الطلبات المكتملة', 'الرصيد المتاح للسحب (SAR)', 'إجمالي العمولات المدفوعة (SAR)', 'إجمالي الأرباح (SAR)', 'حالة السحب', 'بيانات الحساب البنكي', 'تاريخ التسجيل', 'آخر نشاط'];
    const rows = partners.map(p => [
      p.id,
      `"${p.name}"`,
      p.code,
      `"${p.phone}"`,
      p.totalClicks,
      p.registeredCount,
      p.ordersCount,
      p.availableBalance,
      p.paidEarnings || 0,
      p.totalEarnings || 0,
      p.withdrawalStatus,
      `"${p.bankDetails || ''}"`,
      p.createdAt,
      p.lastActive
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `affiliates_referrals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onLogAudit) {
      onLogAudit('تصدير المسوقين لإكسل', `تم تصدير ${partners.length} مسوق إحالة إلى ملف CSV/Excel`);
    }
  };

  return (
    <div className="space-y-5 text-slate-100 dir-rtl">
      
      {/* Toast Notification Banner */}
      {syncToastMessage && (
        <div className="bg-gradient-to-r from-indigo-900/90 to-pink-900/90 border border-pink-500/50 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="font-bold">{syncToastMessage}</span>
          </div>
          <button onClick={() => setSyncToastMessage(null)} className="p-1 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-pink-500/30 p-5 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 bg-gradient-to-tr from-pink-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-pink-600/30">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white">إدارة نظام المسوقين والعمولات السحابي</h2>
              {isConnectedToSheets ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مزامنة لحظية مع Google Sheets ⚡
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  تخزين محلي مؤقت 💾
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة شبكة المسوقين، احتساب العمولات التلقائية لكل طلب، وحفظ وإدارة السحوبات في ورقة (المسوقين) بجدول Google Sheets فورياً.
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap z-10">
          <button
            onClick={handleLiveSync}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="مزامنة لحظية مع Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pink-400' : ''}`} />
            <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة لحظية'}</span>
          </button>

          <button
            onClick={exportAffiliatesToCSV}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="تصدير لجدول إكسل"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير إكسل</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مسوق جديد</span>
          </button>
        </div>
      </div>

      {/* 5 Live Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Partners */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">إجمالي المسوقين</span>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{partners.length}</p>
          <span className="text-[10px] text-slate-500 block">شريك مسجل في Google Sheets</span>
        </div>

        {/* Total Clicks */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">إجمالي الزيارات</span>
            <MousePointerClick className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{totalClicks}</p>
          <span className="text-[10px] text-slate-500 block">نقرة على روابط الإحالة</span>
        </div>

        {/* Completed Orders */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">الطلبات المكتملة</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{totalOrders}</p>
          <span className="text-[10px] text-slate-500 block">طلب تم شراؤه عبر المسوقين</span>
        </div>

        {/* Available Pending Commission Balance */}
        <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-3xl space-y-1 shadow-md bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-[11px] font-bold">الرصيد المستحق للسحب</span>
            <Wallet className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 font-mono">{totalAvailableBalance.toFixed(2)} <span className="text-xs font-sans">ر.س</span></p>
          <span className="text-[10px] text-rose-300/70 block">{withdrawalRequestsCount} طلب سحب معلق</span>
        </div>

        {/* Total Paid Earnings */}
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-3xl space-y-1 shadow-md bg-gradient-to-b from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-bold">إجمالي العمولات المصروفة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">{totalPaidEarnings.toFixed(2)} <span className="text-xs font-sans">ر.س</span></p>
          <span className="text-[10px] text-emerald-400/70 block">تم صرفها وتصفيرها بالشيت</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث باسم المسوق، كود الإحالة، رقم الجوال، أو رقم الحساب..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 pr-10 transition-colors font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-bold"
          >
            <option value="all">كل حالات السحب ({partners.length})</option>
            <option value="requested">🚨 بانتظار السحب والصرف ({withdrawalRequestsCount})</option>
            <option value="paid">✅ تم الصرف والتصفير</option>
            <option value="none">⏳ قيد تجميع العمولات</option>
          </select>
        </div>
      </div>

      {/* Partners List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto min-w-full">
        <table className="w-full text-right text-xs text-slate-300 min-w-[850px]">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap">
            <tr>
              <th className="p-3.5">معرف المسوق (ID)</th>
              <th className="p-3.5">اسم المسوق والبيانات</th>
              <th className="p-3.5">كود ورابط الإحالة</th>
              <th className="p-3.5 text-center">النقرات</th>
              <th className="p-3.5 text-center">المسجلين</th>
              <th className="p-3.5 text-center">الطلبات</th>
              <th className="p-3.5">الرصيد المتاح للسحب</th>
              <th className="p-3.5">الحالة البنكية</th>
              <th className="p-3.5 text-center">إجراءات وعمليات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
            {filteredPartners.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-500 font-bold">
                  لا يوجد مسوقون يطابقون خيارات البحث الحالية
                </td>
              </tr>
            ) : (
              filteredPartners.map(p => {
                const isRequested = p.withdrawalStatus === 'requested';
                const hasBalance = p.availableBalance > 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* ID */}
                    <td className="p-3.5">
                      <IdBadge id={p.id} color="pink" tooltip="معرف المسوق في النظام - انقر للنسخ" />
                    </td>

                    {/* Partner Name & Phone */}
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.phone || 'بدون هاتف'}</span>
                      </div>
                    </td>

                    {/* Referral Code & Quick Copy Link */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-pink-400 text-xs">
                          {p.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(p.code)}
                          className="p-1.5 bg-slate-800 hover:bg-pink-600/30 text-slate-300 hover:text-pink-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="نسخ رابط الإحالة"
                        >
                          {copiedCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Clicks */}
                    <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                      {p.totalClicks || 0}
                    </td>

                    {/* Registered Users */}
                    <td className="p-3.5 text-center font-mono font-bold text-indigo-400">
                      {p.registeredCount || 0}
                    </td>

                    {/* Orders */}
                    <td className="p-3.5 text-center font-mono font-bold text-amber-400">
                      {p.ordersCount || 0}
                    </td>

                    {/* Available Balance */}
                    <td className="p-3.5 font-mono">
                      <span className={`font-black text-sm ${hasBalance ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {p.availableBalance.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 mr-1">ر.س</span>
                    </td>

                    {/* Status & Bank Info */}
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1 max-w-xs">
                        {isRequested ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                            <Clock className="w-3 h-3" /> طلب سحب معلق
                          </span>
                        ) : p.withdrawalStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> تم الصرف
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            قيد التجميع
                          </span>
                        )}
                        {p.bankDetails && (
                          <span className="text-[10px] text-slate-400 truncate font-mono" title={p.bankDetails}>
                            {p.bankDetails}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions: Payout/Withdraw (سحب وتصفير الرصيد), Edit, Delete */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Payout / Clear Balance Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPayout(p)}
                          disabled={!hasBalance}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                            hasBalance
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          }`}
                          title={hasBalance ? 'صرف وتصفير رصيد العمولة في Google Sheets' : 'الرصيد 0 ر.س'}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>سحب وتصفير</span>
                        </button>

                        {/* Edit Partner */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="تعديل بيانات المسوق والمزامنة مع Google Sheets"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* View Orders History */}
                        <button
                          type="button"
                          onClick={() => setShowOrdersModalPartner(p)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="عرض سجل الطلبات والعمولات المرتبطة بكود المسوق"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Partner */}
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="حذف المسوق من النظام وGoogle Sheets"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add/Edit Partner */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in dir-rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-500/20 text-pink-400 rounded-xl">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPartner ? 'تعديل بيانات المسوق بالعمولة' : 'إضافة مسوق إحالة جديد'}
                  </h3>
                  <p className="text-[11px] text-pink-300">
                    {isConnectedToSheets ? '⚡ سيتم الحفظ والمزامنة مباشرة في Google Sheets' : '💾 حفظ في التخزين المحلي'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المسوق الكامل:</label>
                  <input
                    type="text"
                    required
                    value={formName || ""}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: سارة القحطاني"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الجوال / الواتساب:</label>
                  <input
                    type="tel"
                    value={formPhone || ""}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="مثال: 0559876543 أو 967..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود الإحالة (الرمز التعريفي):</label>
                  <input
                    type="text"
                    required
                    value={formCode || ""}
                    onChange={(e) => setFormCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="مثال: sara_vip"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono lowercase focus:outline-none focus:border-pink-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">يستخدم في نهاية الرابط: ?ref=code</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الرصيد المتاح المبدئي (SAR):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formBalance ?? ""}
                    onChange={(e) => setFormBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">بيانات الحساب البنكي / التحويل:</label>
                <textarea
                  rows={2}
                  value={formBankDetails || ""}
                  onChange={(e) => setFormBankDetails(e.target.value)}
                  placeholder="مثال: مصرف الراجحي - SA4580000... أو كريمي / النجم..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري المزامنة...</span>
                    </>
                  ) : (
                    <span>{editingPartner ? 'حفظ وتحديث سحابي' : 'تسجيل ومزامنة مع الشيت'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Payout & Clear Commission Balance (نافذة سحب وتصفير الرصيد) */}
      {payoutModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in dir-rtl">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">صرف عمولة المسوق وتصفير الرصيد</h3>
                  <p className="text-[11px] text-slate-400">{payoutModalPartner.name} ({payoutModalPartner.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalPartner(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-sm">تم صرف العمولة وتصفير رصيد المسوق بنجاح!</h4>
                <p className="text-xs text-slate-300">تم تسجيل العملية في سجل العمليات ومزامنتها في ورقة (المسوقين) بجدول Google Sheets.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayout} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">المبلغ المستحق للصرف:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {payoutModalPartner.availableBalance.toFixed(2)} ر.س
                    </span>
                  </div>
                  {payoutModalPartner.bankDetails && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">بيانات الحساب / IBAN:</span>
                      <p className="text-slate-200 font-mono text-[11px] select-all bg-slate-900 p-2 rounded-lg mt-1 border border-slate-800">
                        {payoutModalPartner.bankDetails}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم مرجع التحويل أو الملاحظات:</label>
                  <input
                    type="text"
                    value={payoutNote || ""}
                    onChange={(e) => setPayoutNote(e.target.value)}
                    placeholder="مثال: رقم الحوالة 8839210 أو تم التحويل عبر StcPay"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>تأكيد تصفير الرصيد في Google Sheets:</span>
                  </p>
                  <p className="text-slate-400">
                    عند التأكيد، سيتم نقل المبلغ إلى "إجمالي العمولات المصروفة" وتصفير الرصيد المتاح (0.00 ر.س) في Google Sheets محلياً وسحابياً.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPayoutModalPartner(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الصرف في الشيت...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تأكيد الصرف وتصفير الرصيد</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Affiliate Orders & Commissions Modal */}
      {showOrdersModalPartner && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-5 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>سجل الطلبات والعمولات المرتبطة بالمسوق: {showOrdersModalPartner.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  كود الإحالة: <strong className="text-pink-400">{showOrdersModalPartner.code}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrdersModalPartner(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Orders List for this Code */}
            <div className="space-y-3">
              {(() => {
                const linkedOrders = orders.filter(o => 
                  o.referralCode && o.referralCode.trim().toLowerCase() === showOrdersModalPartner.code.trim().toLowerCase()
                );

                if (linkedOrders.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-500 font-bold space-y-2 bg-slate-950 rounded-2xl border border-slate-800">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>لا توجد طلبات مسجلة بهذا الكود ({showOrdersModalPartner.code}) حتى الآن</p>
                      <span className="text-[11px] text-slate-600 block">عندما يقوم أي عميل بإتمام طلب عبر رابط أو كود هذا المسوق، سيظهر السجل والعمولة هنا تلقائياً.</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-400 mb-2">
                      إجمالي الطلبات المرتبطة: <span className="text-amber-400 font-mono">{linkedOrders.length} طلب</span>
                    </div>
                    {linkedOrders.map(order => {
                      const commission = order.referralCommission || (order.totalAmount * 0.1);
                      const isPaid = order.paymentStatus === 'paid';
                      return (
                        <div key={order.OrderID || order.orderNumber} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs font-mono">
                                طلب #{order.orderNumber || order.OrderID}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                order.orderStatus === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                                order.orderStatus === 'shipped' ? 'bg-indigo-500/20 text-indigo-300' :
                                'bg-amber-500/20 text-amber-300'
                              }`}>
                                {order.orderStatus === 'delivered' ? 'مكتمل (تم التسليم)' :
                                 order.orderStatus === 'shipped' ? 'جاري الشحن' : 'قيد المعالجة'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">
                              العميل: <strong className="text-white">{order.customerName}</strong> ({order.phone})
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              التاريخ: {order.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                            <div className="text-left font-mono">
                              <span className="text-xs text-slate-400 block">إجمالي الطلب: {order.totalAmount.toFixed(2)} ر.س</span>
                              <span className="text-sm font-black text-emerald-400">عمولة: {commission.toFixed(2)} ر.س</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              isPaid ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {isPaid ? 'تم الدفع' : 'معلق'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowOrdersModalPartner(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
