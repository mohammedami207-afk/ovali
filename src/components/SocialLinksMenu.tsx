import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, MessageCircle, Video, Facebook, Instagram, Send, X, Sparkles, ShoppingCart, Store } from 'lucide-react';
import { SocialLinks, AppSettings, CurrencyRate } from '../types';

interface SocialLinksMenuProps {
  socialLinks?: SocialLinks;
  storePhone?: string;
  settings?: AppSettings;
  currency?: CurrencyRate;
  onOpenAI?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenCatalog?: () => void;
}

export const SocialLinksMenu: React.FC<SocialLinksMenuProps> = ({ 
  socialLinks, 
  storePhone, 
  settings, 
  currency,
  onOpenAI,
  cartCount = 0,
  onOpenCart,
  onOpenCatalog
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isYemen = currency?.currencyCode === 'YER';
  const targetPhone = isYemen
    ? (settings?.storePhoneYemen || '967715989357')
    : (settings?.storePhoneSaudi || socialLinks?.whatsapp || storePhone || '966599539659');

  const cleanPhone = targetPhone.toString().replace(/[^0-9]/g, '');
  const countryName = isYemen ? 'اليمن 🇾🇪' : 'السعودية 🇸🇦';
  const storeDisplayName = settings?.storeName || 'المتجر';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`السلام عليكم ${storeDisplayName} (${countryName})، أود الاستفسار عن الطلبات والمنتجات`)}`;

  const links = [
    {
      id: 'whatsapp',
      label: 'واتساب',
      icon: <MessageCircle className="w-4 h-4 text-emerald-400" />,
      url: whatsappUrl,
      color: 'bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500/50 text-emerald-300'
    },
    {
      id: 'tiktok',
      label: 'تيك توك',
      icon: <Video className="w-4 h-4 text-pink-400" />,
      url: socialLinks?.tiktok || 'https://tiktok.com',
      color: 'bg-pink-600/30 hover:bg-pink-600/50 border-pink-500/50 text-pink-300'
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      icon: <Facebook className="w-4 h-4 text-blue-400" />,
      url: socialLinks?.facebook || 'https://facebook.com',
      color: 'bg-blue-600/30 hover:bg-blue-600/50 border-blue-500/50 text-blue-300'
    },
    {
      id: 'instagram',
      label: 'إنستغرام',
      icon: <Instagram className="w-4 h-4 text-purple-400" />,
      url: socialLinks?.instagram || 'https://instagram.com',
      color: 'bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/50 text-purple-300'
    },
    {
      id: 'telegram',
      label: 'تلغرام',
      icon: <Send className="w-4 h-4 text-sky-400" />,
      url: socialLinks?.telegram || 'https://t.me',
      color: 'bg-sky-600/30 hover:bg-sky-600/50 border-sky-500/50 text-sky-300'
    }
  ];

  return (
    <div className="fixed bottom-20 sm:bottom-8 left-2 sm:left-4 z-40 flex flex-col items-center gap-1.5 dir-rtl">
      {/* Expanded Compact Icon-Only Social Links */}
      {isOpen && (
        <div className="flex flex-col gap-1.5 mb-0.5 animate-in fade-in slide-in-from-bottom-4 items-center">
          {links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={item.label}
              className={`group relative p-1.5 rounded-full border backdrop-blur-xl shadow-md transition-all duration-200 hover:scale-110 active:scale-95 ${item.color}`}
            >
              {item.icon}
              
              {/* Tooltip on hover */}
              <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-900 border border-slate-700 text-white font-bold text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {item.label}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* 1. TOPMOST FLOATING BUTTON: Full Shopping Catalog Icon (Image #3 Style) */}
      {onOpenCatalog && (
        <motion.button
          onClick={onOpenCatalog}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className="group w-7.5 h-7.5 sm:w-8 sm:h-8 bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 text-white rounded-xl shadow-md shadow-pink-500/20 hover:shadow-pink-500/50 transition-all flex items-center justify-center relative border border-white/60 cursor-pointer"
          title="صفحة التسوق والكتالوج الكامل"
          aria-label="صفحة التسوق والكتالوج الكامل"
        >
          {/* Custom Storefront Icon Matching Image 3 */}
          <div className="p-0.5 text-white">
            <Store className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>

          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-950/95 border border-slate-700/80 text-white font-black text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-30">
            🏬 صفحة التسوق
          </span>
        </motion.button>
      )}

      {/* 2. MIDDLE FLOATING BUTTON: Compact Cart Button with Continuous Rotating / Spinning Effect */}
      {onOpenCart && (
        <motion.button
          onClick={onOpenCart}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className="group w-7.5 h-7.5 sm:w-8 sm:h-8 bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white rounded-full shadow-md shadow-rose-500/30 hover:shadow-rose-500/60 transition-all flex items-center justify-center relative border-2 border-white/60 cursor-pointer"
          title={`سلة التسوق (${cartCount})`}
          aria-label="سلة التسوق"
        >
          {/* Rotating Circular Ring effect around cart */}
          <motion.span 
            className="absolute -inset-0.5 rounded-full border border-dashed border-white/70 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Interactive Radar Ring Effect */}
          <span className="absolute -inset-0.5 rounded-full bg-rose-500/25 animate-ping pointer-events-none" />

          {/* Cart Icon with Smooth Continuous Circular Wobble / Spin Animation */}
          <motion.div
            animate={{ rotate: [0, 12, 0, -12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="z-10"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white drop-shadow-sm" />
          </motion.div>

          {/* Cart Badge with Item Count */}
          {cartCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-slate-950 text-white border border-white font-mono text-[8px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-md font-black z-20 animate-bounce">
              {cartCount}
            </span>
          ) : (
            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 border border-white rounded-full z-20 animate-pulse" />
          )}

          {/* Hover Tooltip Label */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-950/95 border border-slate-700/80 text-white font-black text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-30">
            🛒 السلة ({cartCount})
          </span>
        </motion.button>
      )}

      {/* 3. AI Assistant Floating Button directly above Share Button */}
      {onOpenAI && (
        <button
          onClick={onOpenAI}
          className="group w-7 h-7 sm:w-7.5 sm:h-7.5 bg-theme-gradient text-white rounded-full shadow-md shadow-theme-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative border border-white/30 cursor-pointer animate-pulse"
          title="المرشد الذكي للمتجر (ذكاء اصطناعي)"
        >
          <Sparkles className="w-3 h-3 text-white" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-900/95 border border-slate-700 text-white font-bold text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {settings?.storeName ? `مرشد ${settings.storeName.split(' ')[0]} الذكي ✨` : 'المرشد الذكي ✨'}
          </span>
        </button>
      )}

      {/* 4. Bottom Social Links Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-7.5 h-7.5 sm:w-8 sm:h-8 bg-theme-gradient text-white rounded-full shadow-md shadow-theme-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative border border-white/30 cursor-pointer"
        title="روابط التواصل الاجتماعي والمشاركة"
      >
        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-theme-accent"></span>
        </span>

        {isOpen ? (
          <X className="w-3 h-3" />
        ) : (
          <Share2 className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};
