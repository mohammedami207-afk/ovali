import React, { useState } from 'react';
import { 
  Wifi, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Building2, 
  Smartphone, 
  Sparkles, 
  CreditCard,
  Layers,
  AlertCircle,
  Zap
} from 'lucide-react';
import { AppSettings } from '../types';

interface NFCGeneratorProps {
  settings?: AppSettings;
  companyId?: string;
  companyName?: string;
}

export const NFCGenerator: React.FC<NFCGeneratorProps> = ({ 
  settings, 
  companyId, 
  companyName 
}) => {
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedNamed, setCopiedNamed] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Derive Company Identifier & Name
  const targetCompanyName = companyName || settings?.storeName || 'اوفالي | Rwna';

  // Construct Clean Direct Origin URL for NFC & Store (Short & Light)
  const getDirectCleanUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://shein-store.app';
  };

  const directCleanUrl = getDirectCleanUrl();
  const directCleanBytes = new TextEncoder().encode(directCleanUrl).length;

  // QR Code Image API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(directCleanUrl)}&color=0f172a&bgcolor=ffffff&margin=10`;

  // Copy Direct Clean URL to Clipboard for NFC Tools
  const handleCopyCleanUrl = () => {
    navigator.clipboard.writeText(directCleanUrl);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2500);
  };

  // Download QR Code Image
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFC-QR-${targetCompanyName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  // Web NFC Write Implementation
  const handleWriteNfc = async () => {
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!('NDEFReader' in window)) {
      setNfcStatus({
        type: 'error',
        text: 'خاصية Web NFC غير مدعومة مباشرة في متصفحك. يرجى نسخ الرابط الصافي واستخدام تطبيق NFC Tools واختيار نوع URL.'
      });
      return;
    }

    if (isInsideIframe) {
      setNfcStatus({
        type: 'error',
        text: 'برمجة Web NFC تتطلب فتح المتجر في تبويب مستقل خارج إطار المعاينة (IFrame). أو يمكنك نسخ الرابط الصافي واستخدام تطبيق NFC Tools بسهولة.'
      });
      return;
    }

    try {
      setNfcWriting(true);
      setNfcStatus({
        type: 'info',
        text: 'قم بتقريب شريحة أو بطاقة الـ NFC من ظهر الهاتف الآن لكتابة الرابط الصافي...'
      });

      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: directCleanUrl
          }
        ]
      });

      setNfcStatus({
        type: 'success',
        text: '✨ تم برمجة بطاقة الـ NFC بنجاح! يمكن للعملاء الآن لمس البطاقة بهواتفهم للانتقال للمتجر مباشرة.'
      });
    } catch (error: any) {
      console.error('NFC Write Error:', error);
      const isTopLevelError = error.message?.includes('top-level browsing context') || error.name === 'SecurityError';
      setNfcStatus({
        type: 'error',
        text: isTopLevelError
          ? 'أمان المتصفح يمنع Web NFC داخل المعاينة المضمنة (IFrame). افتح المتجر في نافذة مستقلة أو انسخ الرابط لتطبيق NFC Tools.'
          : `تعذر كتابة شريحة NFC: ${error.message || 'تم إلغاء العملية أو لم يتم التعرف على الشريحة'}`
      });
    } finally {
      setNfcWriting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden dir-rtl">
      {/* Background Decorative Accent */}
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">مولد رابط NFC الصافي للمتجر</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {directCleanBytes} بايت فقط
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              رابط مباشر خفيف وسريع جداً مخصص للبرمجة على بطاقات الـ NFC وتطبيق NFC Tools دون تعقيد.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{targetCompanyName}</span>
          </span>
        </div>
      </div>

      {/* NFC Interactive Card & QR Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Virtual Visual NFC Physical Card Preview */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 rounded-2xl border border-slate-800 p-6 relative overflow-hidden group shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span className="font-mono tracking-widest uppercase font-bold text-slate-300">NFC STORE CARD</span>
            </div>
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-500/30">
              <Wifi className="w-5 h-5 rotate-90" />
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">اسم المتجر الرسمي</div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-wide truncate">
              {targetCompanyName}
            </div>
          </div>

          {/* Clean URL display */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 truncate flex items-center justify-between">
            <span className="truncate">{directCleanUrl}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-300 shrink-0 mr-2">
              {directCleanBytes}B
            </span>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>المس هذا الكارت بالهاتف للفتح المباشر دون الحاجة لتنزيل أي تطبيق.</span>
          </div>
        </div>

        {/* QR Code Graphic Box */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-2 bg-white rounded-2xl shadow-xl border-4 border-slate-800">
            <img 
              src={qrCodeUrl} 
              alt="Store QR Code" 
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg" 
              loading="lazy"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>كود الاستجابة السريعة (QR Code)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              امسح الرمز أو اطبعه على البطاقات والمطبوعات
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Copy Clean URL */}
          <button
            type="button"
            onClick={handleCopyCleanUrl}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {copiedClean ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedClean ? 'تم نسخ الرابط الصافي!' : 'نسخ الرابط الصافي لـ NFC'}</span>
          </button>

          {/* Test / Open Link */}
          <a
            href={directCleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700 active:scale-95"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            <span>اختبار وفتح المتجر</span>
          </a>

          {/* Download QR */}
          <button
            type="button"
            onClick={handleDownloadQR}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700 active:scale-95"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>تنزيل كود QR</span>
          </button>

          {/* Program NFC Tag */}
          <button
            type="button"
            onClick={handleWriteNfc}
            disabled={nfcWriting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{nfcWriting ? 'جاري الكتابة...' : 'برمجة بطاقة NFC'}</span>
          </button>
        </div>

        {/* Status notification banner */}
        {nfcStatus && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
            nfcStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            nfcStatus.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
            'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{nfcStatus.text}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFCGenerator;
