import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Check, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Barcode, 
  Layers,
  Sparkles,
  ArrowRight,
  Share2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Clock,
  Image as ImageIcon,
  Gift,
  Play,
  Pause,
  Maximize,
  ZoomIn
} from 'lucide-react';
import { Product, CurrencyRate, Offer } from '../../types';
import { formatRelativeTime } from '../../lib/dateUtils';
import { DEFAULT_PRODUCT_IMAGE } from '../../lib/imageUtils';
import { ImageLightboxModal } from './ImageLightboxModal';

interface ProductDetailModalProps {
  product: Product | null;
  offers?: Offer[];
  currency: CurrencyRate;
  onClose: () => void;
  onAddToCart: (p: Product, size: string, color: string, qty: number) => void;
  onShareProduct?: (p: Product) => void;
  onRateProduct?: (productId: string, rating: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  offers = [],
  currency,
  onClose,
  onAddToCart,
  onShareProduct,
  onRateProduct
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(product?.size?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product?.color?.[0] || 'افتراضي');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [autoPlayIntervalMs, setAutoPlayIntervalMs] = useState(3500);
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const imagesList = product?.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80'];
  const currentImage = imagesList[selectedImageIndex] || imagesList[0];

  useEffect(() => {
    if (!product) return;
    setIsImageLoading(true);
  }, [selectedImageIndex, product?.ProductID]);

  const handleRate = (r: number) => {
    if (!product || hasRated || !onRateProduct) return;
    setUserRating(r);
    setHasRated(true);
    onRateProduct(product.ProductID, r);
  };

  const handleCopyLink = () => {
    if (!product) return;
    const directUrl = `${window.location.origin}${window.location.pathname}?product=${product.ProductID}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Swipe handling for touch devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  // Auto-play interval effect with custom timing & hover pause
  useEffect(() => {
    if (!product || imagesList.length <= 1 || !isAutoPlay || isHovered) return;
    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
    }, autoPlayIntervalMs);
    return () => clearInterval(interval);
  }, [imagesList.length, isAutoPlay, isHovered, autoPlayIntervalMs, product]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeThreshold = Math.abs(distance) > 35; // minimum threshold px

    if (isSwipeThreshold) {
      if (distance > 0) {
        // Swiped left -> next image
        handleNextImage();
      } else {
        // Swiped right -> prev image
        handlePrevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!product) return null;

  let currentSalePriceSAR = product.salePrice;
  let previousPriceSAR: number | null = null;
  let discountPercentage = 0;
  let discountAmountSAR = 0;

  if (product.originalPrice && product.originalPrice > product.salePrice) {
    previousPriceSAR = product.originalPrice;
    currentSalePriceSAR = product.salePrice;
    discountAmountSAR = previousPriceSAR - currentSalePriceSAR;
    discountPercentage = Math.round((discountAmountSAR / previousPriceSAR) * 100);
  } else if (product.discount && product.discount > 0) {
    previousPriceSAR = product.salePrice;
    currentSalePriceSAR = product.salePrice * (1 - product.discount / 100);
    discountAmountSAR = previousPriceSAR - currentSalePriceSAR;
    discountPercentage = Math.round(product.discount);
  }

  const finalPrice = ((currentSalePriceSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2);
  const originalPriceFormatted = previousPriceSAR ? ((previousPriceSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2) : null;
  const savedAmountFormatted = discountAmountSAR > 0 ? ((discountAmountSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2) : null;

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="border border-theme-card rounded-3xl w-full max-w-4xl my-auto p-4 sm:p-6 space-y-5 shadow-2xl relative bg-theme-card text-theme-main"
      >
        
        {/* Top Header Bar with Prominent Back Button */}
        <div className="flex items-center justify-between border-b border-theme-card pb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-inner hover:bg-theme-card text-theme-main font-bold text-xs transition-all border border-theme-card"
          >
            <ArrowRight className="w-4 h-4 text-theme-primary" />
            <span>رجوع للمتجر</span>
          </button>

          <span className="text-xs font-bold text-theme-subtext truncate max-w-[200px]">
            {product.name}
          </span>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-theme-inner hover:bg-rose-600/20 text-theme-subtext hover:text-rose-500 transition-colors border border-theme-card"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Gallery Showcase with Touch Swipe Support */}
          <div className="space-y-3">
            <div 
              className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-theme-inner border border-theme-card relative group touch-pan-y select-none cursor-pointer flex items-center justify-center"
              onClick={() => setIsLightboxOpen(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Circular Loading Spinner while fetching image */}
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-theme-inner/80 backdrop-blur-xs z-20">
                  <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin shadow-md" />
                </div>
              )}

              <img
                key={selectedImageIndex}
                src={(currentImage && currentImage.trim()) ? currentImage.trim() : DEFAULT_PRODUCT_IMAGE}
                alt={product.name}
                onLoad={() => setIsImageLoading(false)}
                onError={(e) => { 
                  setIsImageLoading(false); 
                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; 
                }}
                className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                  isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              />

              {/* Floating Expand Image Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                className="absolute bottom-3 right-3 bg-black/70 hover:bg-theme-primary text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all opacity-90 group-hover:opacity-100 z-10 cursor-pointer"
                title="تكبير الصورة لرؤيتها بالكامل"
              >
                <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-bold text-[11px]">تكبير الصورة</span>
              </button>

              {product.discount > 0 && (
                <span className="absolute top-3 right-3 bg-theme-primary text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-lg z-10">
                  خصم {product.discount}%
                </span>
              )}

              {/* Mobile Swipe Hint, AutoPlay Speed & Toggle Badges */}
              {imagesList.length > 1 && (
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-mono border border-white/20 flex items-center gap-1">
                    <span>👈 اسحب 👉</span>
                    <span className="font-bold text-amber-300">({selectedImageIndex + 1}/{imagesList.length})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className={`p-1 rounded-full text-white backdrop-blur-sm border transition-all text-[10px] flex items-center gap-1 px-2.5 cursor-pointer ${
                      isAutoPlay 
                        ? 'bg-emerald-950/80 border-emerald-500/50 hover:bg-emerald-900' 
                        : 'bg-black/60 border-white/20 hover:bg-black/80'
                    }`}
                    title={isAutoPlay ? 'إيقاف التمرير التلقائي' : 'تشغيل التمرير التلقائي'}
                  >
                    {isAutoPlay ? <Pause className="w-3 h-3 text-amber-300 animate-pulse" /> : <Play className="w-3 h-3 text-emerald-400" />}
                    <span>{isAutoPlay ? (isHovered ? 'موقوف مؤقتاً' : 'تمرير تلقائي') : 'موقوف'}</span>
                  </button>

                  {/* Speed Selector */}
                  {isAutoPlay && (
                    <div className="bg-black/60 backdrop-blur-sm text-white text-[9px] p-0.5 rounded-full border border-white/20 flex items-center gap-0.5 font-mono">
                      {[
                        { label: '2ث', val: 2000 },
                        { label: '3.5ث', val: 3500 },
                        { label: '5ث', val: 5000 }
                      ].map(speed => (
                        <button
                          key={speed.val}
                          type="button"
                          onClick={() => setAutoPlayIntervalMs(speed.val)}
                          className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            autoPlayIntervalMs === speed.val
                              ? 'bg-theme-primary text-white font-bold shadow-xs'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {speed.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Arrows for Image Gallery */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-theme-primary text-white backdrop-blur-sm border border-white/20 transition-all opacity-80 group-hover:opacity-100 z-10 cursor-pointer"
                    title="الصورة السابقة"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-theme-primary text-white backdrop-blur-sm border border-white/20 transition-all opacity-80 group-hover:opacity-100 z-10 cursor-pointer"
                    title="الصورة التالية"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Visual Dots Indicators */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl flex items-center gap-2 pointer-events-auto">
                      {imagesList.map((_, idx) => {
                        const isActive = selectedImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                              isActive
                                ? 'w-7 h-2.5 bg-gradient-to-r from-theme-primary to-pink-400 shadow-md shadow-theme-primary/60 ring-2 ring-white/40 scale-105'
                                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                            }`}
                            title={`الانتقال إلى صورة ${idx + 1}`}
                            aria-label={`عرض الصورة رقم ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dynamic Carousel Thumbnail Strip */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-thin pb-1">
              {imagesList.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => img && setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-theme-primary bg-theme-inner shadow-lg shadow-theme-primary/20 scale-105'
                        : 'border-theme-card bg-theme-inner hover:border-theme-primary/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img.trim() || DEFAULT_PRODUCT_IMAGE} 
                      alt={`صورة ${idx + 1}`} 
                      onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className={`absolute bottom-0 inset-x-0 p-0.5 text-center text-[9px] font-bold backdrop-blur-md ${
                      isSelected ? 'bg-theme-primary text-white' : 'bg-black/60 text-white'
                    }`}>
                      صورة {idx + 1} {idx === 0 ? '(رئيسية)' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Info & Specifications */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-theme-primary uppercase tracking-widest bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-0.5 rounded-full inline-block">
                {product.category}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-theme-main leading-snug">
                {product.name}
              </h2>
              
              {product.ratings && product.ratings.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex items-center gap-0.5 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold text-xs text-yellow-600 dark:text-yellow-500">
                      {(product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-theme-subtext">
                    ({product.ratings.length} تقييم)
                  </span>
                </div>
              )}

              {/* Special Offer Badge Alert */}
              {offers.filter(o => o.status === 'active').map(offer => {
                const match = offer.title.match(/(\d+)\s*\+\s*(\d+)/) || offer.title.includes('اشتري 4');
                if (match) {
                  return (
                    <div key={offer.OfferID} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3 mt-2">
                      <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
                        <Gift className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-500 text-sm">عرض خاص: {offer.title}</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-300/80 mt-1">
                          أضف هذا المنتج ومنتجات أخرى لتستفيد من العرض وتخفيض السعر في سلة المشتريات مباشرة.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              <div className="flex flex-wrap items-center gap-3 text-xs text-theme-subtext mt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Barcode className="w-3.5 h-3.5 opacity-60" />
                  SKU: {product.SKU}
                </span>
                <span>•</span>
                <span>المخزون المتاح: <b className="text-theme-main">{product.quantity} قطعة</b></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-theme-primary font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>تاريخ الإضافة: {formatRelativeTime(product.createdAt || product.updatedAt)}</span>
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-theme-inner border border-theme-card flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {originalPriceFormatted && (
                  <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] p-2 sm:p-2.5 rounded-xl bg-theme-card border border-theme-card/50 relative">
                    <span className="text-[10px] sm:text-xs text-theme-subtext font-bold mb-1">قبل</span>
                    <span className="text-xs sm:text-sm text-rose-500 line-through font-mono font-bold leading-none">
                      {originalPriceFormatted}
                    </span>
                  </div>
                )}
                
                <div className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border ${originalPriceFormatted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-theme-card border-theme-card/50'} min-w-[80px] sm:min-w-[100px]`}>
                  {originalPriceFormatted && <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">الآن</span>}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${originalPriceFormatted ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-primary'}`}>
                      {finalPrice}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-theme-subtext font-sans">
                      {currency.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {discountPercentage > 0 && (
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-theme-gradient text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                    خصم {discountPercentage}%
                  </span>
                  {savedAmountFormatted && (
                    <span className="text-emerald-500 text-[10px] font-bold">
                      وفّرت {savedAmountFormatted} {currency.symbol}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sizes Selection */}
            {product.size && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-main">اختر المقاس:</label>
                <div className="flex flex-wrap gap-2">
                  {product.size.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedSize === sz
                          ? 'bg-theme-primary border-theme-primary text-white shadow-lg shadow-theme-primary/30'
                          : 'bg-theme-inner border-theme-card text-theme-main hover:border-theme-primary/50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.color && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-main">اختر اللون:</label>
                <div className="flex flex-wrap gap-2">
                  {product.color.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedColor === col
                          ? 'bg-theme-main border-theme-main text-theme-bg shadow-lg'
                          : 'bg-theme-inner border-theme-card text-theme-main hover:border-theme-primary/50'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-theme-main">الكمية:</label>
              <div className="flex items-center bg-theme-inner border border-theme-card rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-theme-main hover:text-theme-primary font-bold"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-theme-main">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-theme-main hover:text-theme-primary font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-theme-subtext leading-relaxed bg-theme-inner p-3 rounded-2xl border border-theme-card">
              {product.description}
            </p>

            {/* Rating System */}
            {onRateProduct && (
              <div className="bg-theme-inner p-3.5 rounded-2xl border border-theme-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-theme-main">تقييم المنتج</h4>
                  <p className="text-[10px] text-theme-subtext">شاركنا رأيك في هذا المنتج المميز</p>
                </div>
                <div className="flex items-center gap-1.5" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      disabled={hasRated}
                      className={`p-1 transition-all ${
                        (userRating >= star) 
                          ? 'text-yellow-500 scale-110' 
                          : 'text-theme-card hover:text-yellow-400 hover:scale-110'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${(userRating >= star) ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                {hasRated && (
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    شكراً لتقييمك!
                  </span>
                )}
              </div>
            )}

            {/* Add to Cart CTA & Share / Copy Link Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-2xl bg-theme-gradient hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-theme-primary flex items-center justify-center gap-2 transition-all min-w-[160px]"
              >
                {added ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{added ? 'تمت الإضافة للسلة بنجاح!' : 'إضافة للسلة الآن'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className={`px-3.5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-500 dark:text-indigo-300 border border-indigo-500/30'
                }`}
                title="نسخ رابط المنتج المباشر"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Link2 className="w-4 h-4 text-indigo-500" />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط المنتج'}</span>
              </button>

              {onShareProduct && (
                <button
                  onClick={() => onShareProduct(product)}
                  className="px-3.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  title="مشاركة المنتج للواتساب"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">مشاركة</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-theme-inner hover:bg-theme-card text-theme-main font-bold text-xs transition-colors border border-theme-card"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Image View Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        images={imagesList}
        initialIndex={selectedImageIndex}
        title={product.name}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};
