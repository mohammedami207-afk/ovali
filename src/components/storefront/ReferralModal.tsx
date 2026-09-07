import React, { useState, useEffect, useMemo } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Users, 
  Wallet, 
  ArrowRight, 
  X, 
  MessageCircle, 
  Sparkles,
  Search,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  MousePointerClick
} from 'lucide-react';
import { CurrencyRate, ReferralPartner, AppSettings } from '../../types';
import { getLocalReferralPartners, saveLocalReferralPartners, requestReferralWithdrawal } from '../../lib/offlineStorage';
import { executeUnifiedSheetsOperation } from '../../lib/googleSheetsAppsScript';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: CurrencyRate;
  currencies?: CurrencyRate[];
  settings?: AppSettings;
  partners?: ReferralPartner[];
  onRefreshPartners?: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ 
  isOpen, 
  onClose, 
  currency = { currencyCode: 'SAR', currencyName: 'ريال سعودي', exchangeRate: 1.0, symbol: 'ر.س' },
  currencies = [
    { currencyCode: 'SAR', currencyName: 'ريال سعودي', exchangeRate: 1.0, symbol: 'ر.س' },
    { currencyCode: 'YER', currencyName: 'ريال يمني', exchangeRate: 142.5, symbol: 'ر.ي' },
    { currencyCode: 'USD', currencyName: 'دولار أمريكي', exchangeRate: 0.266, symbol: '$' }
  ],
  settings,
  partners: propPartners,
  onRefreshPartners
}) => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [partners, setPartners] = useState<ReferralPartner[]>(propPartners || []);
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);
  
  // Withdrawal Form States
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankInfo, setBankInfo] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Load live partners on modal open
  useEffect(() => {
    if (isOpen) {
      const list = propPartners && propPartners.length > 0 ? propPartners : getLocalReferralPartners();
      setPartners(list);
      
      // Auto-select first partner or match existing code
      if (list.length > 0) {
        setSelectedPartner(list[0]);
        setUserName(list[0].code);
        setUserPhone(list[0].phone);
      }
    }
  }, [isOpen, propPartners]);

  // Minimum withdrawal threshold in SAR (default 100 SAR)
  const minThresholdSAR = settings?.minWithdrawalAmount || 100;
  const minThresholdInSelectedCurrency = minThresholdSAR * (currency?.exchangeRate || 1);

  // Real-time lookup as user types
  const handleCodeChange = (val: string) => {
    setUserName(val);
    const clean = val.trim().toLowerCase();
    const match = partners.find(p => p.code.toLowerCase() === clean || p.phone.includes(clean));
    if (match) {
      setSelectedPartner(match);
      setUserPhone(match.phone);
    }
  };

  const handlePhoneChange = (val: string) => {
    setUserPhone(val);
    const clean = val.trim();
    const match = partners.find(p => p.phone.includes(clean) || p.code.toLowerCase() === clean.toLowerCase());
    if (match) {
      setSelectedPartner(match);
      setUserName(match.code);
    }
  };

  // Base bonus formatting
  const yerCurrency = currencies.find(c => c.currencyCode === 'YER');
  const yerRate = yerCurrency?.exchangeRate || 142.5;
  const baseBonusInSAR = 50 / yerRate; // ~50 YER in SAR
  const rawBonusVal = baseBonusInSAR * (currency?.exchangeRate || 1);

  const bonusFormatted = (currency?.currencyCode || 'SAR') === 'YER'
    ? '50'
    : rawBonusVal < 1
      ? (rawBonusVal || 0).toFixed(2)
      : Math.round(rawBonusVal || 0).toString();

  // Active Partner Stats
  const currentClicks = selectedPartner ? selectedPartner.totalClicks : 24;
  const currentRegistered = selectedPartner ? selectedPartner.registeredCount : 8;
  const currentOrders = selectedPartner ? selectedPartner.ordersCount : 3;
  const currentBalanceSAR = selectedPartner ? selectedPartner.availableBalance : 65;
  const currentBalanceConverted = (currentBalanceSAR * (currency?.exchangeRate || 1)).toFixed(2);
  const totalEarnedConverted = ((selectedPartner ? selectedPartner.totalEarnings : 120) * (currency?.exchangeRate || 1)).toFixed(2);

  // Withdrawal Eligibility
  const canWithdraw = currentBalanceSAR >= minThresholdSAR;
  const progressPercent = Math.min(100, Math.round((currentBalanceSAR / minThresholdSAR) * 100));

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rwnaq-store.app';
  const cleanCode = userName.trim() ? encodeURIComponent(userName.trim().replace(/\s+/g, '_').toLowerCase()) : 'rwnaq_vip';
  const referralUrl = `${currentOrigin}/?ref=${cleanCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw || !bankInfo.trim()) return;

    const codeToUse = selectedPartner ? selectedPartner.code : cleanCode;
    const success = requestReferralWithdrawal(codeToUse, bankInfo);
    if (success) {
      setWithdrawSuccess(true);
      const updated = getLocalReferralPartners();
      setPartners(updated);
      const found = updated.find(p => p.code.toLowerCase() === codeToUse.toLowerCase());
      if (found) setSelectedPartner(found);

      // Unified Google Sheets Sync
      if (settings?.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
        executeUnifiedSheetsOperation({
          action: 'request_affiliate_withdrawal',
          payload: {
            code: codeToUse,
            bankDetails: bankInfo.trim(),
            affiliates: updated
          },
          entityName: `طلب سحب أرباح للمسوق "${codeToUse}"`,
          operationType: 'تسجيل طلب سحب',
          webAppUrl: settings.googleAppsScriptUrl
        }).catch(err => console.warn('Background withdrawal sync error:', err));
      }

      if (onRefreshPartners) onRefreshPartners();

      setTimeout(() => {
        setWithdrawSuccess(false);
        setShowWithdrawForm(false);
      }, 3000);
    }
  };

  const storeDisplayName = settings?.storeName || 'اوفالي الفاخر';
  const storeDisplayTagline = settings?.storeTagline || 'للفساتين والأزياء والمنتجات';
  const shareWhatsAppMessage = `✨ مرحباً! أنصحك بالتسوق من ${storeDisplayName} (${storeDisplayTagline})، استخدم رابط دعوتي الخاص للحصول على عروض حصرية وتوصيل فوري:\n${referralUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareWhatsAppMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-theme-main my-auto dir-rtl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-theme-card pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-pink-500 text-white rounded-2xl shadow-lg">
              <Gift className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-theme-main flex items-center gap-2">
                <span>نظام المسوقين والإحالات الفوري (Affiliate & Referrals)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">مزامنة سحابية</span>
              </h2>
              <p className="text-xs text-theme-primary font-semibold">اربح رصيداً نقدياً مع كل زيارة وشراء يتم عبر رابطك الخاص</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-theme-inner hover:bg-rose-600/20 text-theme-subtext hover:text-rose-500 transition-colors border border-theme-card"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Partner Profile & Search Bar */}
        <div className="bg-theme-inner p-4 rounded-2xl border border-theme-card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-theme-main mb-1">كود الإحالة / الاسم:</label>
              <input
                type="text"
                value={userName || ""}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="مثال: mohammed_vip أو اكتب اسمك"
                className="w-full bg-theme-card border border-theme-card rounded-xl p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-theme-main mb-1">رقم الجوال للربط:</label>
              <input
                type="tel"
                value={userPhone || ""}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="مثال: 0559876543 أو 9665..."
                className="w-full bg-theme-card border border-theme-card rounded-xl p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary font-mono"
              />
            </div>
          </div>

          {selectedPartner && (
            <div className="flex items-center justify-between text-xs bg-theme-card p-2.5 rounded-xl border border-theme-card text-theme-subtext">
              <span className="flex items-center gap-1.5 font-bold text-theme-main">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>حساب معتمد: {selectedPartner.name} ({selectedPartner.code})</span>
              </span>
              <span className="text-[10px] text-theme-subtext font-mono">تاريخ التسجيل: {selectedPartner.createdAt}</span>
            </div>
          )}
        </div>

        {/* 4 Live Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Clicks */}
          <div className="p-3 bg-theme-inner border border-theme-card rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-theme-subtext">
              <span className="text-[10px] font-bold">النقرات والزيارات</span>
              <MousePointerClick className="w-3.5 h-3.5 text-theme-primary" />
            </div>
            <p className="text-lg font-black text-theme-main font-mono">{currentClicks}</p>
            <span className="text-[9px] text-theme-subtext block">زيارة مسجلة</span>
          </div>

          {/* Registered Users */}
          <div className="p-3 bg-theme-inner border border-theme-card rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-theme-subtext">
              <span className="text-[10px] font-bold">الأصدقاء المنضمين</span>
              <Users className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-lg font-black text-theme-main font-mono">{currentRegistered}</p>
            <span className="text-[9px] text-theme-subtext block">عميل مسجل</span>
          </div>

          {/* Completed Orders */}
          <div className="p-3 bg-theme-inner border border-theme-card rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-theme-subtext">
              <span className="text-[10px] font-bold">الطلبات المكتملة</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-lg font-black text-theme-main font-mono">{currentOrders}</p>
            <span className="text-[9px] text-theme-subtext block">طلبية ناجحة</span>
          </div>

          {/* Available Balance */}
          <div className="p-3 bg-theme-inner border border-emerald-500/30 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-[10px] font-bold">الرصيد المتاح للسحب</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-black text-emerald-500 font-mono">{currentBalanceConverted} {currency.symbol}</p>
            <span className="text-[9px] text-theme-subtext block">إجمالي الأرباح: {totalEarnedConverted}</span>
          </div>
        </div>

        {/* Withdrawal Threshold Progress & Action Banner */}
        <div className="bg-theme-inner p-4 rounded-2xl border border-theme-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-theme-primary" />
                <span>شروط طلب سحب الأرباح البنكية:</span>
              </span>
              <p className="text-[11px] text-theme-subtext mt-0.5">
                الحد الأدنى لتفعيل زر السحب هو <b className="text-emerald-500">{minThresholdInSelectedCurrency.toFixed(2)} {currency?.symbol || 'ر.س'} ({minThresholdSAR} ر.س)</b>.
              </p>
            </div>

            {/* Withdrawal Action Button (Enabled ONLY upon reaching threshold) */}
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              disabled={!canWithdraw}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shrink-0 ${
                canWithdraw
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse'
                  : 'bg-theme-card text-theme-subtext cursor-not-allowed opacity-60 border border-theme-card'
              }`}
              title={canWithdraw ? 'طلب سحب الأرباح الآن' : `يتبقى ${(Math.max(0, minThresholdSAR - currentBalanceSAR) * (currency?.exchangeRate || 1)).toFixed(2)} ${currency?.symbol || 'ر.س'} للوصول للحد الأدنى`}
            >
              <Building className="w-4 h-4" />
              <span>{canWithdraw ? 'طلب سحب الأرباح الآن 💵' : 'زر السحب غير متاح (لم يكتمل الحد الأدنى)'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-theme-subtext font-mono">
              <span>نسبة اكتمال شرط السحب</span>
              <span className={canWithdraw ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                {progressPercent}% ({currentBalanceConverted} / {minThresholdInSelectedCurrency.toFixed(2)} {currency?.symbol || 'ر.س'})
              </span>
            </div>
            <div className="w-full h-2 bg-theme-card rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  canWithdraw ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-theme-gradient'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Withdrawal Request Form (When Enabled & Opened) */}
          {showWithdrawForm && canWithdraw && (
            <form onSubmit={handleWithdrawRequest} className="pt-3 border-t border-theme-card space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-emerald-500">
                أدخل تفاصيل حسابك البنكي أو رقم المحفظة (الراجحي / الأهلي / بنك الكريمي / محفظة جوالي):
              </label>
              <input
                type="text"
                required
                value={bankInfo || ""}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder="مثال: مصرف الراجحي - IBAN: SA4580000... أو اسم ورقم المستلم"
                className="w-full bg-theme-card border border-theme-card rounded-xl p-2.5 text-xs text-theme-main focus:outline-none focus:border-emerald-500 font-mono"
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وإرسال طلب التحويل المالي</span>
                </button>
                {withdrawSuccess && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم إرسال طلب السحب بنجاح! سيتم التحويل خلال 24 ساعة.</span>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Link Input & Customization */}
        <div className="space-y-3 bg-theme-inner p-4 rounded-2xl border border-theme-card">
          <label className="block text-xs font-bold text-theme-main">رابط الدعوة المخصص لحسابك:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl || ""}
              className="flex-1 bg-theme-card border border-theme-card rounded-xl p-2.5 text-xs text-theme-primary font-mono select-all focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-theme-gradient hover:opacity-95 text-white shadow-theme-primary'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>نشر الرابط مباشرة عبر الواتساب (WhatsApp)</span>
          </a>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-theme-subtext pt-2 border-t border-theme-card">
          <span>يتم احتساب الأرباح والعمولات بصورة فورية لحظة إتمام الطلب.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-theme-inner hover:bg-theme-card text-theme-main font-bold rounded-xl text-xs border border-theme-card cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

