import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  MessageCircle, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  ExternalLink, 
  Image as ImageIcon, 
  Send, 
  Download, 
  Wand2,
  Clock,
  Smartphone,
  Eye
} from 'lucide-react';
import { Product, CurrencyRate, AppSettings } from '../../types';
import { formatProductWhatsAppShareText, shareProductWithNativeMedia, getStoreWhatsAppNumber } from '../../lib/whatsappHelper';
import { formatRelativeTime } from '../../lib/dateUtils';

interface ProductShareModalProps {
  product: Product | null;
  currency: CurrencyRate;
  isOpen: boolean;
  onClose: () => void;
  storePhone?: string;
  settings?: AppSettings;
}

export const ProductShareModal: React.FC<ProductShareModalProps> = ({
  product,
  currency,
  isOpen,
  onClose,
  storePhone = '966599539659',
  settings
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLinkOnly, setCopiedLinkOnly] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharingMedia, setIsSharingMedia] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);

  const [cardTheme, setCardTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (product && isOpen) {
      setCardDataUrl(null);
      setShowCardPreview(false);
      setShareSuccessNotice(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const { shareText, directProductUrl, timeAgo, convertedPrice } = formatProductWhatsAppShareText(
    product,
    currency,
    settings
  );

  const originalPrice = ((Number(product.salePrice) || 0) * (currency?.exchangeRate || 1)).toFixed(2);
  const cleanPhone = getStoreWhatsAppNumber(settings, currency.currencyCode);
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(directProductUrl);
    setCopiedLinkOnly(true);
    setTimeout(() => setCopiedLinkOnly(false), 2500);
  };

  // 1-Click Native Share with Image File (Attaches the real photo into WhatsApp with caption)
  const handleShareWithPhoto = async () => {
    setIsSharingMedia(true);
    try {
      const res = await shareProductWithNativeMedia(product, currency, settings);
      if (res.sharedWithFile) {
        setShareSuccessNotice('تم إرفاق صورة المنتج والنص بنجاح في نافذة المشاركة!');
      } else {
        setShareSuccessNotice('تم فتح الواتساب مع النص المنسق ورابط المعاينة!');
      }
      setTimeout(() => setShareSuccessNotice(null), 4000);
    } catch (e) {
      console.error('Share error', e);
      window.open(whatsappShareUrl, '_blank');
    } finally {
      setIsSharingMedia(false);
    }
  };

  // Generate High-Quality Marketing Card Canvas
  const handleGenerateMarketingCard = async (themeToUse = cardTheme) => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const isLight = themeToUse === 'light';

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (isLight) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#f8fafc');
        grad.addColorStop(1, '#f1f5f9');
      } else {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Radial Glow Accent
      const radial = ctx.createRadialGradient(900, 200, 10, 900, 200, 500);
      radial.addColorStop(0, isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(236, 72, 153, 0.3)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1080, 1080);

      // Outer Frame Border
      ctx.strokeStyle = isLight ? '#8b5cf6' : '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(35, 35, 1010, 1010);

      ctx.strokeStyle = isLight ? 'rgba(139, 92, 246, 0.25)' : 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(45, 45, 990, 990);

      // Store Header
      ctx.fillStyle = isLight ? '#6d28d9' : '#f59e0b';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`👑 ${settings?.storeName || 'المتجر الإلكتروني'} 👑`, 540, 105);

      ctx.fillStyle = isLight ? '#64748b' : '#cbd5e1';
      ctx.font = '22px sans-serif';
      ctx.fillText(`العرض المميز • وقت العرض: ${timeAgo}`, 540, 145);

      // Load product image safely with fallback
      const imageUrl = (product.images && product.images[0] && product.images[0].trim())
        ? product.images[0]
        : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';

      let imgLoaded = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve) => {
        img.onload = () => { imgLoaded = true; resolve(true); };
        img.onerror = () => { resolve(false); };
        img.src = imageUrl;
      });

      // Draw image container box
      const imgBoxX = 140;
      const imgBoxY = 175;
      const imgBoxW = 800;
      const imgBoxH = 490;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 24);
      ctx.clip();

      ctx.fillStyle = isLight ? '#f1f5f9' : '#0f172a';
      ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

      if (imgLoaded && img.width && img.height) {
        const imgRatio = img.width / img.height;
        const containerRatio = imgBoxW / imgBoxH;
        let drawW = imgBoxW;
        let drawH = imgBoxH;
        let drawX = imgBoxX;
        let drawY = imgBoxY;

        if (imgRatio > containerRatio) {
          drawW = imgBoxH * imgRatio;
          drawX = imgBoxX - (drawW - imgBoxW) / 2;
        } else {
          drawH = imgBoxW / imgRatio;
          drawY = imgBoxY - (drawH - imgBoxH) / 2;
        }

        try {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } catch (e) {
          console.warn('Canvas image draw error or CORS blocked, rendering fallback text box');
          imgLoaded = false;
        }
      }

      if (!imgLoaded) {
        // Fallback placeholder image box
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

        ctx.fillStyle = isLight ? '#6d28d9' : '#f59e0b';
        ctx.font = 'bold 54px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(product.name.slice(0, 20), 540, 410);
      }
      ctx.restore();

      // Details Box Container
      ctx.fillStyle = isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(140, 680, 800, 240, 20);
      ctx.fill();

      // Border on Details Box
      ctx.strokeStyle = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Category
      ctx.fillStyle = isLight ? '#7c3aed' : '#ec4899';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`قسم: ${product.category}`, 910, 725);

      // Product Title
      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = product.name.length > 28 ? 'bold 32px sans-serif' : 'bold 38px sans-serif';
      ctx.fillText(product.name, 910, 780);

      // Price
      ctx.fillStyle = isLight ? '#059669' : '#34d399';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(`${convertedPrice} ${currency.symbol}`, 910, 855);

      if (product.discount > 0) {
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`🔥 خصم ${product.discount}% (بدلاً من ${originalPrice})`, 480, 855);
      }

      // Footer
      ctx.fillStyle = isLight ? '#4f46e5' : '#f59e0b';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`للطلب المباشر أو الاستفسار: wa.me/${cleanPhone}`, 540, 980);

      try {
        const url = canvas.toDataURL('image/png');
        setCardDataUrl(url);
        setShowCardPreview(true);
      } catch (taintErr) {
        console.error('Canvas tainted by CORS, regenerating without crossOrigin image');
        // Fallback re-generate clean canvas without external image if CORS tainted
        ctx.clearRect(0, 0, 1080, 1080);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.strokeStyle = isLight ? '#8b5cf6' : '#f59e0b';
        ctx.lineWidth = 8;
        ctx.strokeRect(35, 35, 1010, 1010);
        ctx.fillStyle = isLight ? '#6d28d9' : '#f59e0b';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`👑 ${settings?.storeName || 'المتجر الإلكتروني'} 👑`, 540, 120);
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText(product.name, 540, 400);
        ctx.fillStyle = isLight ? '#059669' : '#34d399';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText(`${convertedPrice} ${currency.symbol}`, 540, 520);
        ctx.fillStyle = isLight ? '#4f46e5' : '#f59e0b';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(`wa.me/${cleanPhone}`, 540, 920);

        setCardDataUrl(canvas.toDataURL('image/png'));
        setShowCardPreview(true);
      }
      setIsGenerating(false);
    } catch (err) {
      console.error('Card generation error:', err);
      setIsGenerating(false);
    }
  };

  const handleDownloadCard = () => {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `بطاقة_منتج_${product.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto dir-rtl">
      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-lg my-auto p-5 sm:p-6 space-y-4.5 shadow-2xl relative text-theme-main animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-card pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 text-white rounded-2xl shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-theme-main">مشاركة المنتج ورابط العرض السريع</h3>
              <p className="text-[11px] text-theme-subtext">إرسال صورة المنتج، السعر، وتوقيت العرض للواتساب فوراً</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-theme-inner hover:bg-theme-card text-theme-subtext hover:text-theme-main transition-colors border border-theme-card cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Notice Alert */}
        {shareSuccessNotice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{shareSuccessNotice}</span>
          </div>
        )}

        {/* Visual Share Card Preview */}
        <div className="bg-theme-inner border border-theme-card rounded-2xl overflow-hidden shadow-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-theme-card pb-2">
            <div className="flex items-center gap-2">
              <span className="bg-theme-gradient text-white font-black text-xs px-2.5 py-0.5 rounded-lg font-serif">
                {settings?.storeName || 'المتجر'}
              </span>
              <span className="text-xs font-bold text-theme-main">{settings?.storeName || 'المتجر الإلكتروني'}</span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Image & Price */}
          <div className="flex gap-3 items-center bg-theme-card p-2.5 rounded-xl border border-theme-card">
            <div className="relative shrink-0">
              <img
                src={(product.images && product.images[0] && product.images[0].trim()) ? product.images[0] : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'}
                alt={product.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'; }}
                className="w-20 h-24 object-cover rounded-xl border border-theme-card shadow-md"
              />
              <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded-md font-mono">
                صورة المنتج
              </span>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-theme-primary font-bold bg-theme-primary/10 px-2 py-0.5 rounded-full inline-block">
                  {product.category}
                </span>
                <span className="text-[10px] text-theme-subtext flex items-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5 text-theme-subtext" />
                  <span>{timeAgo}</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-theme-main leading-tight truncate">
                {product.name}
              </h4>

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-sm font-black text-emerald-500 font-mono">
                  {convertedPrice} {currency.symbol}
                </span>
                {product.discount > 0 && (
                  <span className="text-[10px] text-theme-subtext line-through font-mono">
                    {originalPrice}
                  </span>
                )}
              </div>
              {product.discount > 0 && (
                <span className="text-[10px] text-rose-500 font-bold">
                  🔥 خصم حصري {product.discount}%
                </span>
              )}
            </div>
          </div>

          {/* Formatted Text Box */}
          <div className="bg-theme-card/60 p-3 rounded-xl border border-theme-card text-[11px] text-theme-subtext whitespace-pre-wrap font-sans max-h-32 overflow-y-auto leading-relaxed dir-rtl selection:bg-theme-primary selection:text-white">
            {shareText}
          </div>
        </div>

        {/* Dynamic Marketing Image Card Generator Box */}
        <div className="bg-theme-inner border border-theme-card p-3 rounded-2xl space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-theme-primary shrink-0" />
              <span className="text-xs font-bold text-theme-main">بطاقة تسويقية مصورة (صورة + سعر + توقيت)</span>
            </div>

            {/* Theme Selector Pills */}
            <div className="flex items-center gap-1 bg-theme-card p-1 rounded-xl border border-theme-card self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setCardTheme('light');
                  handleGenerateMarketingCard('light');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  cardTheme === 'light'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-theme-subtext hover:text-theme-main'
                }`}
              >
                ☀️ أبيض فاتح (لون المتجر)
              </button>

              <button
                type="button"
                onClick={() => {
                  setCardTheme('dark');
                  handleGenerateMarketingCard('dark');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  cardTheme === 'dark'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-theme-subtext hover:text-theme-main'
                }`}
              >
                🌙 داكن فخم
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-theme-subtext">
              {cardTheme === 'light' ? 'تصميم فاتح وأنيق يطابق لون خلفية المتجر الأبيض' : 'تصميم داكن بنمط ليلي جذاب'}
            </span>

            <button
              onClick={() => handleGenerateMarketingCard(cardTheme)}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-theme-gradient hover:opacity-95 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'جاري التوليد...' : 'توليد بطاقة العرض ✨'}</span>
            </button>
          </div>

          {showCardPreview && cardDataUrl && cardDataUrl.trim() ? (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <div className="border border-theme-card rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-square max-w-[260px] mx-auto shadow-xl p-1">
                <img src={cardDataUrl} alt="Marketing Card" className="w-full h-full object-contain rounded-xl" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCard}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل البطاقة المصورة (.PNG)</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons: Exactly Two Buttons as Requested */}
        <div className="space-y-3 pt-2">
          {/* Button 1: Share via WhatsApp */}
          <button
            onClick={handleShareWithPhoto}
            disabled={isSharingMedia}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer ring-2 ring-emerald-400/40"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
            <span>{isSharingMedia ? 'جاري تحضير المشاركة...' : 'مشاركة عبر الواتساب (صورة ورابط المعاينة) 🚀'}</span>
          </button>

          {/* Button 2: Copy Data & Link */}
          <button
            onClick={handleCopy}
            className="w-full py-3.5 bg-theme-inner hover:bg-theme-card text-theme-main font-bold text-xs sm:text-sm rounded-2xl border border-theme-card flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-lg"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-theme-primary" />}
            <span>{copied ? 'تم نسخ البيانات والرابط للحافظة بنجاح!' : 'نسخ البيانات والرابط 📋'}</span>
          </button>

          <div className="text-center text-[11px] text-theme-subtext pt-1">
            يتضمن اسم المنتج، السعر، تفاصيل الخصم، ورابط المعاينة المباشر مع صورة المنتج
          </div>
        </div>
      </div>
    </div>
  );
};

