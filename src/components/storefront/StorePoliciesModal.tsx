import React from 'react';
import { 
  X, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  FileText, 
  Info, 
  Award, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';
import { AppSettings } from '../../types';

export type PolicyTabType = 'about' | 'warranty' | 'return' | 'shipping' | 'verification';

interface StorePoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTabType;
  settings?: AppSettings;
}

export const StorePoliciesModal: React.FC<StorePoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
  settings
}) => {
  const [activeTab, setActiveTab] = React.useState<PolicyTabType>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-2xl text-theme-main shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme-card flex items-center justify-between sticky top-0 bg-theme-card/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-theme-gradient flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-main">معلومات وتوثيق المتجر والسياسات</h3>
              <p className="text-xs text-theme-subtext">توثيق رسمي وضمان معتمد لجميع عملائنا الكرام</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-theme-subtext hover:text-theme-main rounded-xl hover:bg-theme-inner transition-colors cursor-pointer border border-transparent hover:border-theme-card"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 border-b border-theme-card bg-theme-inner flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'verification' as PolicyTabType, label: 'التوثيق والسجل', icon: ShieldCheck },
            { id: 'about' as PolicyTabType, label: 'من نحن', icon: Info },
            { id: 'warranty' as PolicyTabType, label: 'الضمان الذهبي', icon: Award },
            { id: 'return' as PolicyTabType, label: 'الاستبدال والاسترجاع', icon: RotateCcw },
            { id: 'shipping' as PolicyTabType, label: 'الشحن والتوصيل', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-theme-gradient text-white shadow-theme-primary'
                    : 'text-theme-subtext hover:text-theme-main bg-theme-card border border-theme-card hover:border-theme-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-theme-main">متجر سعودي موثق رسمياً</h4>
                    <p className="text-[11px] text-emerald-500">مسجل في منصة الأعمال التابعة للمركز السعودي للأعمال</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-theme-card rounded-xl border border-theme-card">
                    <span className="text-theme-subtext block text-[10px]">رقم السجل التجاري / وثيقة العمل:</span>
                    <span className="text-emerald-500 font-mono font-bold text-sm">
                      {settings?.commercialRegisterNumber || '7033543294'}
                    </span>
                  </div>
                  <div className="p-3 bg-theme-card rounded-xl border border-theme-card">
                    <span className="text-theme-subtext block text-[10px]">الرقم الضريبي (ZATCA):</span>
                    <span className="text-theme-primary font-mono font-bold text-sm">
                      {settings?.taxNumber || '310123456700003'}
                    </span>
                  </div>
                </div>

                {settings?.saudiBusinessVerificationUrl && (
                  <a
                    href={settings.saudiBusinessVerificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>التحقق المباشر من التوثيق عبر منصة الأعمال السعودية</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl space-y-2">
                <h5 className="font-bold text-theme-main text-xs">بيانات التواصل الرسمية للمتجر:</h5>
                <div className="space-y-1.5 text-theme-subtext">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>هاتف خدمة العملاء: </span>
                    <span className="font-mono text-theme-main font-bold">{settings?.storePhoneSaudi || settings?.storePhone || '966599539659'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    <span>البريد الإلكتروني المعتمد: </span>
                    <span className="font-mono text-theme-main font-bold">{settings?.storeEmail || 'support@store.sa'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>المقر الرئيسي: </span>
                    <span className="text-theme-main font-medium">{settings?.storeAddress || 'المملكة العربية السعودية'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3">
              <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-theme-main">{settings?.storeName || 'المتجر'} - {settings?.storeTagline || 'شريكك الأول للتسوق'}</h4>
                <p className="text-theme-subtext leading-relaxed">
                  {settings?.aboutUsText || settings?.footerAbout || 'متجر سعودي رائد وموثق رسمياً، يوفر تشكيلة واسعة ومختارة من أرقى المنتجات بأعلى معايير الجودة والضمان، مع تجربة تسوق سهلة وآمنة لكافة العملاء.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-theme-inner border border-theme-card rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                  <span className="font-bold text-theme-main block">أصالة وجودة %100</span>
                  <span className="text-[10px] text-theme-subtext">منتجات أصلية معتمدة</span>
                </div>
                <div className="p-3 bg-theme-inner border border-theme-card rounded-xl text-center space-y-1">
                  <Truck className="w-5 h-5 text-sky-500 mx-auto" />
                  <span className="font-bold text-theme-main block">شحن وتوصيل فوري</span>
                  <span className="text-[10px] text-theme-subtext">تغطية شاملة لكافة المدن</span>
                </div>
                <div className="p-3 bg-theme-inner border border-theme-card rounded-xl text-center space-y-1">
                  <RotateCcw className="w-5 h-5 text-amber-500 mx-auto" />
                  <span className="font-bold text-theme-main block">استرجاع واستبدال مرن</span>
                  <span className="text-[10px] text-theme-subtext">خلال 7 أيام بسهولة</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <Award className="w-5 h-5 text-amber-500" />
                <span>سياسة الضمان المعتمد</span>
              </div>
              <p className="text-theme-subtext leading-relaxed">
                {settings?.warrantyPolicyText || 'نلتزم بتقديم ضمان شامل ضد العيوب المصنعية لجميع المنتجات. يتم فحص كل منتج بدقة قبل الشحن لضمان وصوله بأفضل حالة ممكنة.'}
              </p>
              <ul className="space-y-1.5 text-theme-subtext list-disc list-inside pt-1">
                <li>استبدال فوري في حال وجود أي عيب مصنعي عند الاستلام.</li>
                <li>فريق دعم فني متواجد لمساعدتك عبر الواتساب على مدار الساعة.</li>
                <li>تغليف آمن ومحكم يحمي المنتجات طوال فترة الشحن.</li>
              </ul>
            </div>
          )}

          {activeTab === 'return' && (
            <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-sky-500 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-sky-500" />
                <span>سياسة الاستبدال والاسترجاع</span>
              </div>
              <p className="text-theme-subtext leading-relaxed">
                {settings?.returnPolicyText || 'يحق للعميل استبدال أو إرجاع المنتج خلال 7 أيام من تاريخ استلام الشحنة، بشرط أن يكون المنتج بحالته الأصلية غير مستخدم ومرفقاً بجميع ملحقاته.'}
              </p>
              <div className="p-3 bg-theme-card rounded-xl space-y-1 border border-theme-card text-[11px] text-theme-subtext">
                <p className="font-bold text-theme-main">خطوات الاستبدال والاسترجاع:</p>
                <p>1. تواصل مع خدمة العملاء عبر الواتساب مع تزويدنا برقم الطلب.</p>
                <p>2. يتم ترتيب استلام الشحنة عبر شركة الشحن المعتمدة.</p>
                <p>3. يتم استرجاع المبلغ أو إرسال البديل فور فحص المنتج.</p>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <Truck className="w-5 h-5 text-emerald-500" />
                <span>الشحن والتوصيل وشركات النقل</span>
              </div>
              <p className="text-theme-subtext leading-relaxed">
                {settings?.deliveryInfo || '🚀 توصيل سريع ومباشر لكافة مدن المملكة العربية السعودية والجمهورية اليمنية خلال 24 - 48 ساعة. شحن مجاني لكافة الطلبات المؤهلة.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-[10px] font-bold">
                <div className="p-2 bg-theme-card rounded-xl border border-theme-card text-theme-main">أرامكس (Aramex)</div>
                <div className="p-2 bg-theme-card rounded-xl border border-theme-card text-theme-main">سمسا (SMSA)</div>
                <div className="p-2 bg-theme-card rounded-xl border border-theme-card text-theme-main">سبل (SPL البريد)</div>
                <div className="p-2 bg-theme-card rounded-xl border border-theme-card text-theme-main">ريد بوكس (RedBox)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-card bg-theme-inner flex items-center justify-between">
          <div className="flex items-center gap-2 text-theme-subtext text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{settings?.storeName || 'المتجر'} - تسوق آمن وموثق</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-theme-card hover:opacity-90 text-theme-main font-bold rounded-xl text-xs transition-colors cursor-pointer border border-theme-card"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
