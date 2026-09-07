import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Check, 
  X, 
  Copy,
  Code,
  Sparkles,
  Layers,
  Zap,
  Download,
  HelpCircle
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../lib/googleSheetsAppsScript';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId?: string;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'guide' | 'sheets'>('code');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const sheetsList = [
    { name: 'المنتجات', icon: '📦', cols: 12, desc: 'بيانات المنتجات، الأكواد SKU، الأسعار، المخزون وروابط الصور' },
    { name: 'الطلبات', icon: '🛒', cols: 9, desc: 'تفاصيل المبيعات، إجمالي الفاتورة، طرق الدفع وحالة المبيعات' },
    { name: 'التصنيفات', icon: '📁', cols: 4, desc: 'أقسام المتجر الرئيسية، الصور والوصف' },
    { name: 'العملاء', icon: '👥', cols: 8, desc: 'سجلات المشتريات، رصيد العميل، الهواتف والعناوين' },
    { name: 'الفواتير', icon: '🧾', cols: 9, desc: 'فواتير المبيعات الضريبية ZATCA والرموز الرقمية QR' },
    { name: 'الموردين', icon: '🚚', cols: 6, desc: 'بيانات الموردين، شركات التوريد والهواتف' },
    { name: 'الموظفين', icon: '👔', cols: 6, desc: 'حسابات الموظفين، الأدوار والأذونات' },
    { name: 'العروض', icon: '🏷️', cols: 5, desc: 'عروض الخصم الترويجية والتخفيضات' },
    { name: 'الكوبونات', icon: '🎟️', cols: 6, desc: 'قسائم الخصم، التواريخ وحدود الاستخدام' },
    { name: 'العملات', icon: '💱', cols: 4, desc: 'أسعار الصرف المتعددة للعملات' },
    { name: 'إعدادات_المتجر', icon: '⚙️', cols: 2, desc: 'اسم المتجر، رقم الهاتف، الضريبة والإعدادات العامة' },
    { name: 'سجل_العمليات', icon: '📋', cols: 5, desc: 'تتبع كافة العمليات والتعديلات الزمانية' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto dir-rtl">
      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-4xl my-6 p-5 sm:p-7 space-y-6 shadow-2xl relative text-theme-main">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-theme-subtext hover:text-theme-main hover:bg-theme-inner transition-colors border border-theme-card"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-theme-card pb-5">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-inner">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-theme-main">
                سكربت الربط والمزامنة الشامل لـ Google Sheets
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                Code.gs احترافي
              </span>
            </div>
            <p className="text-xs text-theme-subtext mt-1 leading-relaxed">
              كود Google Apps Script متكامل يربط متجرك بجوجل شيت تلقائياً مع إنشاء 12 ورقة عمل كاملة بأعمدة وتنسيقات رائعة.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'code' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>كود السكربت البرمجي (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'guide' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>خطوات التثبيت في Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sheets' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>أوراق وأعمدة جدول البيانات (12 ورقة)</span>
          </button>
        </div>

        {/* TAB 1: CODE EDITOR & COPY */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>انسخ هذا الكود بالكامل، ثم افتح Google Sheets واضغط على "تطبيقات السكربت" (Apps Script):</span>
              </div>
              <button
                onClick={handleCopyCode}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${
                  copied 
                    ? 'bg-emerald-500 text-slate-950 scale-105' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ الكود بنجاح!' : 'نسخ الكود الكامل'}</span>
              </button>
            </div>

            {/* Code Viewbox */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 max-h-[380px] overflow-y-auto leading-relaxed dir-ltr">
              <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP SETUP GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">1</span>
                  <span>فتح ملف Excel / Google Sheets</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  افتح ملف Google Sheets الذي ترغب بربطه بالمتجر (مثل الملف الظاهر في صورتك <strong>mtgrrong1</strong>).
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">2</span>
                  <span>افتح محرّر تطبيقات السكربت</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  من القائمة العلويّة اضغط على <strong>الإضافات (Extensions)</strong> ثم اختر <strong>تطبيقات السكربت (Apps Script)</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                  <span>لصق الكود وتأسييس الأوراق تلقائياً</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  امسح الكود الموجود، والصق الكود الذي نسخته من هنا. ثم من أعلى المحرّر اختر دالة <strong className="text-emerald-300">setupDatabase</strong> واضغط على <strong>تشغيل (Run)</strong>. سيتم إنشاء كل الأوراق والأعمدة فورياً!
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">4</span>
                  <span>النشر كتطبيق ويب (Web App)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  اضغط زر <strong>نشر (Deploy)</strong> -&gt; <strong>تطبيق ويب جديد (New Deployment)</strong>. اجعل وصول التطبيق لـ <strong>"أي شخص" (Anyone)</strong> وانسخ الرابط الناتج وضعه في المتجر!
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SHEETS STRUCTURE */}
        {activeTab === 'sheets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto">
            {sheetsList.map((s) => (
              <div key={s.name} className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                    {s.cols} أعمدة
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 dir-rtl">
          <button
            onClick={handleCopyCode}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'تم نسخ الكود!' : 'نسخ الكود الكامل والبدء'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
