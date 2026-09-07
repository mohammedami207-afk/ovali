import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Smartphone, 
  Copy, 
  ExternalLink, 
  QrCode, 
  Download, 
  CheckCircle2, 
  Zap, 
  Building2, 
  Share2, 
  Wifi, 
  AlertCircle,
  RefreshCw,
  Info,
  Check,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppSettings } from '../../types';

interface NFCStoreCardProps {
  settings: AppSettings;
}

export const NFCStoreCard: React.FC<NFCStoreCardProps> = ({ settings }) => {
  const [copiedCleanUrl, setCopiedCleanUrl] = useState(false);
  const [copiedNamedUrl, setCopiedNamedUrl] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const [isNfcSupported, setIsNfcSupported] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'clean' | 'qr' | 'guide'>('clean');

  // Store & Company information
  const companyName = settings.storeName?.trim() || 'اوفالي | Rwna';
  
  // Clean origin URL (Best & smallest for NFC, ~45-60 Bytes)
  const getDirectCleanUrl = () => {
    if (typeof window === 'undefined') return 'https://shein-store.app';
    const origin = window.location.origin;
    // Strip any admin or subpaths if running inside iframe or main
    return origin;
  };

  const directCleanUrl = getDirectCleanUrl();
  const directCleanUrlBytes = new TextEncoder().encode(directCleanUrl).length;

  // Named URL with slug for brand customization
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-store';
  const namedStoreUrl = `${directCleanUrl}?store=${encodeURIComponent(companySlug)}`;
  const namedUrlBytes = new TextEncoder().encode(namedStoreUrl).length;

  // Selected Target URL for QR and NFC Writing
  const targetUrl = activeView === 'clean' ? directCleanUrl : namedStoreUrl;

  // High-Res QR Code Image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(directCleanUrl)}&color=0f172a&bgcolor=ffffff&margin=12`;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNfcSupported(true);
    }
  }, []);

  const handleCopyCleanUrl = async () => {
    try {
      await navigator.clipboard.writeText(directCleanUrl);
      setCopiedCleanUrl(true);
      setTimeout(() => setCopiedCleanUrl(false), 3000);
    } catch (e) {
      console.error('Failed to copy clean URL', e);
    }
  };

  const handleCopyNamedUrl = async () => {
    try {
      await navigator.clipboard.writeText(namedStoreUrl);
      setCopiedNamedUrl(true);
      setTimeout(() => setCopiedNamedUrl(false), 3000);
    } catch (e) {
      console.error('Failed to copy named URL', e);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${companySlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handleWriteNFC = async () => {
    // Check if inside iframe
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!('NDEFReader' in window)) {
      setNfcStatus('error');
      setNfcMessage('خاصية Web NFC غير مدعومة في متصفحك الحالي. يمكنك نسخ الرابط الصافي واستخدام تطبيق NFC Tools بسهولة.');
      return;
    }

    if (isInsideIframe) {
      setNfcStatus('error');
      setNfcMessage('برمجة Web NFC تتطلب فتح التطبيق في تبويب مستقل خارج إطار المعاينة (IFrame). يمكنك فتح المتجر في تبويب جديد أو استخدام تطبيق NFC Tools بالرابط الصافي المنسوخ.');
      return;
    }

    try {
      setNfcStatus('writing');
      setNfcMessage('قرب بطاقة أو ميدالية الـ NFC من ظهر هاتفك الآن لكتابة الرابط الصافي...');

      // @ts-ignore - Web NFC API
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: directCleanUrl
          }
        ]
      });

      setNfcStatus('success');
      setNfcMessage('✨ تمت برمجة بطاقة NFC بالرابط الصافي بنجاح! مجرد لمس الهاتف للبطاقة سيفتح المتجر فوراً.');
      setTimeout(() => setNfcStatus('idle'), 6000);
    } catch (error: any) {
      console.error('NFC write error:', error);
      const isTopLevelError = error.message?.includes('top-level browsing context') || error.name === 'SecurityError';
      setNfcStatus('error');
      if (isTopLevelError) {
        setNfcMessage('أمان المتصفح يمنع Web NFC داخل المعاينة المضمنة (IFrame). يرجى فتح المتجر في نافذة/تبويب جديد أو نسخ الرابط الصافي لبرمجته عبر تطبيق NFC Tools.');
      } else {
        setNfcMessage(error.message || 'تعذر كتابة بطاقة NFC. تأكد من تفعيل NFC في الهاتف واقتراب البطاقة.');
      }
    }
  };

  return (
    <div id="nfc-store-link-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-2xl space-y-6 relative overflow-hidden dir-rtl">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-white">رابط المتجر الذكي عبر NFC والباركود (QR & NFC)</h3>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                رابط خفيف وصغير جداً ({directCleanUrlBytes} Bytes)
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              توليد رابط مباشر وصغير للمتجر ({companyName}) لبرمجته على بطاقات وميداليات الـ NFC وطباعة رمز الـ QR للدخول الفوري.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('clean')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'clean' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>رابط الـ NFC الصافي</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('qr')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'qr' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>رمز الباركود QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('guide')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'guide' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>دليل NFC Tools</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Visual NFC Card & Fast Copy */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          
          {/* Visual Smart Card */}
          <div className="relative w-full aspect-[1.7/1] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-5 border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col justify-between group">
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />

            {/* Top Bar */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {settings.storeLogoUrl && settings.storeLogoUrl.trim() ? (
                  <img 
                    src={settings.storeLogoUrl} 
                    alt={companyName} 
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
                    {companyName.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-sm text-white truncate max-w-[180px]">{companyName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">NFC DIRECT SMART STORE</p>
                </div>
              </div>

              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 animate-pulse">
                <Wifi className="w-5 h-5 rotate-90" />
              </div>
            </div>

            {/* Middle Section */}
            <div className="flex items-center justify-between my-2 relative z-10">
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-medium">المس الكارت بهاتفك للدخول الفوري</p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>NFC Ready • {directCleanUrlBytes} Bytes</span>
                </div>
              </div>

              <div className="p-1 bg-white rounded-xl shadow-lg border border-slate-200 shrink-0">
                <img src={qrCodeUrl} alt="Store QR" className="w-14 h-14 object-contain" />
              </div>
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 relative z-10 text-[11px] font-mono">
              <span className="text-slate-400 truncate max-w-[220px]">
                {directCleanUrl.replace(/^https?:\/\//, '')}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold">
                خفيف وصافي 100%
              </span>
            </div>
          </div>

          {/* Quick Copy Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">الرابط الصافي المباشر (المخصص لـ NFC Tools والبطاقات)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono font-bold rounded-md">
                {directCleanUrlBytes} Bytes فقط
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={directCleanUrl ?? ""} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyCleanUrl}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shrink-0 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                {copiedCleanUrl ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCleanUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={directCleanUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl shrink-0 transition"
                title="فتح الرابط"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 هذا الرابط صافٍ وخفيف جداً، عند نسخه ولصقه في تطبيق <strong>NFC Tools</strong> كـ <strong>URL</strong> سيفتح المتجر بلمسة واحدة بدون أخطاء.
            </p>
          </div>
        </div>

        {/* Right Column: QR Code & Direct Web NFC & Actions */}
        <div className="lg:col-span-6 space-y-4">
          
          {activeView === 'qr' ? (
            /* QR Code View */
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-slate-800">
                <img 
                  src={qrCodeUrl} 
                  alt="Store QR Code" 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg" 
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>رمز QR للدخول المباشر للمتجر</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  امسح الرمز بكاميرا الهاتف للدخول الفوري، أو قم بتنزيله لطباعته على اليافطات أو الكروت الورقية.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="flex-1 min-w-[150px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الباركود (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCleanUrl}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                >
                  {copiedCleanUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCleanUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
            </div>
          ) : activeView === 'guide' ? (
            /* Visual Step-by-Step Guide for NFC Tools */
            <div className="bg-slate-950 p-5 rounded-3xl border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-2 text-purple-400 pb-2 border-b border-slate-800">
                <Info className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">طريقة برمجة بطاقة NFC في تطبيق NFC Tools (شرح مبسط)</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</div>
                  <div>
                    <strong className="text-white block">انسخ الرابط الصافي</strong>
                    <span className="text-slate-400">اضغط على زر "نسخ الرابط الصافي" بالأعلى للحصول على رابط المتجر المباشر ({directCleanUrlBytes} بايت فقط).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</div>
                  <div>
                    <strong className="text-white block">افتح تطبيق NFC Tools على الهاتف</strong>
                    <span className="text-slate-400">انتقل لتبويب <strong>WRITE (كتابة)</strong> ثم اضغط <strong>Add a record (إضافة سجل)</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</div>
                  <div>
                    <strong className="text-white block">اختر نوع السجل: URL / URI</strong>
                    <span className="text-slate-400">⚠️ اختر <strong>URL</strong> فقط (ولا تقم بلصق كود JSON أو نصوص كبيرة)، ثم الصق الرابط واضغط OK.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">4</div>
                  <div>
                    <strong className="text-white block">اضغط Write والمس البطاقة بهاتفك</strong>
                    <span className="text-slate-400">المس البطاقة خلف الهاتف، وستتم البرمجة في ثانية واحدة بحجم صغير جداً ليفتح المتجر مباشرة!</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCleanUrl}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                {copiedCleanUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCleanUrl ? 'تم نسخ الرابط الصافي بنجاح!' : 'نسخ الرابط الصافي للبدء في NFC Tools'}</span>
              </button>
            </div>
          ) : (
            /* Direct Web NFC Programmer */
            <div className="bg-slate-950 p-5 rounded-3xl border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">برمجة بطاقات NFC المباشرة من المتصفح (Web NFC)</h4>
                </div>
                {isNfcSupported ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> مدعوم بمتصفحك
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3 h-3" /> متاح عبر Chrome أندرويد
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                إذا كنت تفتح المتجر من متصفح Chrome على هاتف Android يدعم NFC، يمكنك الضغط على الزر وتقريب البطاقة من ظهر هاتفك لكتابة الرابط فورياً بلمسة واحدة.
              </p>

              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">الرابط الصافي المكتوب على الشريحة:</span>
                <span className="font-mono text-emerald-400 font-bold">{directCleanUrl}</span>
              </div>

              <button
                type="button"
                onClick={handleWriteNFC}
                disabled={nfcStatus === 'writing'}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {nfcStatus === 'writing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ضع بطاقة الـ NFC خلف هاتفك الآن...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>برمجة بطاقة الـ NFC الآن بلمسة واحدة</span>
                  </>
                )}
              </button>

              {/* Status Message */}
              {nfcMessage && (
                <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                  nfcStatus === 'writing' ? 'bg-indigo-950 text-indigo-200 border border-indigo-800' :
                  nfcStatus === 'success' ? 'bg-emerald-950 text-emerald-200 border border-emerald-800' :
                  'bg-amber-950 text-amber-200 border border-amber-800'
                }`}>
                  {nfcStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : nfcStatus === 'writing' ? (
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{nfcMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('guide')}
              className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold flex items-center justify-center gap-2 transition"
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span>دليل تطبيق NFC Tools</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>تنزيل كود QR</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
