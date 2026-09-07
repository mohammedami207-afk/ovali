import React, { memo } from 'react';
import { ShoppingCart, Eye, Percent, Share2, Clock, Sparkles, Heart, Star } from 'lucide-react';
import { Product, CurrencyRate } from '../../types';
import { formatRelativeTime } from '../../lib/dateUtils';
import { DEFAULT_PRODUCT_IMAGE } from '../../lib/imageUtils';

interface ProductCardProps {
  product: Product;
  currency: CurrencyRate;
  onQuickView: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onShareProduct?: (p: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  currency,
  onQuickView,
  onAddToCart,
  onShareProduct,
  isWishlisted = false,
  onToggleWishlist
}) => {
  // Image Slideshow state to automatically animate products with multiple images
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const validImages = React.useMemo(() => {
    return (product.images || [])
      .map(img => img ? img.trim() : '')
      .filter(img => img.length > 0)
      .slice(0, 2); // قصر التبديل على أول صورتين فقط
  }, [product.images]);

  React.useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;

    // تبديل تلقائي بفاصل زمني قصير (2.5 ثانية) عند عدم وجود مؤشر الماوس
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % 2);
    }, 2500);

    return () => clearInterval(interval);
  }, [validImages, isHovered]);

  // Adjust active image on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (validImages.length > 1) {
      // الانتقال الفوري للصورة الثانية عند تمرير الماوس
      setActiveImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (validImages.length > 1) {
      // العودة للصورة الأولى افتراضياً عند مغادرة الماوس
      setActiveImageIndex(0);
    }
  };

  // Compute Current (Sale) Price vs Previous (Old) Price with high precision
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

  const convertedCurrentPrice = ((currentSalePriceSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2);
  const convertedPreviousPrice = previousPriceSAR ? ((previousPriceSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2) : null;
  const convertedSavedAmount = discountAmountSAR > 0 ? ((discountAmountSAR || 0) * (currency?.exchangeRate || 1)).toFixed(2) : null;

  return (
    <div 
      className="group bg-theme-bg border border-theme-card/70 rounded-xl overflow-hidden hover:border-theme-primary transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md relative will-change-transform text-theme-main"
      id={`product-card-${product.ProductID}`}
    >
      {/* Top Floating Discount & Savings Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-0.5 items-end pointer-events-none">
          <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 border border-white/20">
            <Percent className="w-2.5 h-2.5 shrink-0" />
            <span>خصم {discountPercentage}%</span>
          </div>
          {convertedSavedAmount && Number(convertedSavedAmount) > 0 && (
            <span className="bg-slate-950/85 backdrop-blur-xs text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
              وفّر {convertedSavedAmount} {currency.symbol}
            </span>
          )}
        </div>
      )}

      {/* Top Left Buttons: Share & Wishlist */}
      <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
        {onShareProduct && (
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onShareProduct(product); 
            }}
            className="p-1.5 glass-overlay-btn hover:scale-105 rounded-full transition-all shadow-md cursor-pointer"
            title="مشاركة المنتج للواتساب وشبكات التواصل"
          >
            <Share2 className="w-3 h-3" />
          </button>
        )}

        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleWishlist(product.ProductID); 
            }}
            className={`p-1.5 rounded-full transition-all shadow-md cursor-pointer ${
              isWishlisted
                ? 'bg-rose-600 text-white border border-rose-500 shadow-rose-600/30'
                : 'glass-overlay-btn hover:scale-105'
            }`}
            title={isWishlisted ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Image Gallery Showcase with Instant Loading */}
      <div 
        onClick={() => onQuickView(product)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[3/4] overflow-hidden bg-theme-inner cursor-pointer group/image"
      >
        {validImages.length === 0 ? (
          <img
            src={DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          validImages.map((imgUrl, idx) => (
            <img
              key={`${imgUrl}-${idx}`}
              src={imgUrl}
              alt={`${product.name} - صورة ${idx + 1}`}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => { 
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; 
              }}
              className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === activeImageIndex ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              } group-hover:scale-105 transition-transform duration-500`}
            />
          ))
        )}

        {/* Hover overlay actions & Mini Details */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-3 text-center">
          
          {/* Mini Details */}
          <div className="text-white space-y-1 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            {product.description && (
              <p className="text-[9.5px] text-slate-300 line-clamp-3 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono mt-1">
              <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                SKU: {product.SKU}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 delay-75">
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                onQuickView(product); 
              }}
              className="p-2 bg-white/95 text-slate-950 rounded-full hover:bg-white transition-colors shadow-md cursor-pointer"
              title="معاينة سريعة"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            
            {onShareProduct && (
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onShareProduct(product); 
                }}
                className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
                title="مشاركة المنتج"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                onAddToCart(product); 
              }}
              className="p-2 bg-theme-gradient text-white rounded-full hover:opacity-90 transition-colors shadow-theme-primary cursor-pointer"
              title="إضافة للسلة"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Available Sizes Badge */}
        {product.size && product.size.length > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-theme-inner/90 backdrop-blur-xs text-theme-main text-[8.5px] px-1.5 py-0.2 rounded font-mono border border-theme-card">
            {product.size.slice(0, 3).join(' • ')}
          </div>
        )}
      </div>

      {/* Content & High-Fashion Pricing */}
      <div className="p-1.5 sm:p-2 space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-1 text-[8.5px] sm:text-[9.5px]">
            <span className="font-extrabold text-theme-primary uppercase tracking-wider truncate">
              {product.category || 'عام'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {((product.rating && product.rating > 0) || (product.ratings && product.ratings.length > 0)) && (
                <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 text-[9px]" title={`التقييم: ${(product.rating || (product.ratings ? product.ratings.reduce((a,b)=>a+b,0)/product.ratings.length : 5)).toFixed(1)} من 5 (${product.ratingCount || (product.ratings ? product.ratings.length : 1)} تقييم)`}>
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span className="font-bold">
                    {(product.rating || (product.ratings ? product.ratings.reduce((a,b)=>a+b,0)/product.ratings.length : 5)).toFixed(1)}
                  </span>
                  <span className="text-[8px] opacity-80 font-mono">
                    ({product.ratingCount || (product.ratings ? product.ratings.length : 1)})
                  </span>
                </div>
              )}
              <span className="flex items-center gap-0.5 text-theme-subtext font-medium bg-theme-inner px-1 py-0.2 rounded border border-theme-card">
                <Clock className="w-2 h-2 text-theme-primary" />
                <span>{formatRelativeTime(product.createdAt || product.updatedAt)}</span>
              </span>
            </div>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="text-[11px] sm:text-xs font-black text-theme-main line-clamp-2 hover:text-theme-primary transition-colors cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Product Description */}
          {product.description && (
            <p 
              className="text-[9.5px] text-theme-subtext line-clamp-1 leading-tight font-normal"
              title={product.description}
            >
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Cart Container */}
        <div className="pt-1 border-t border-theme-card/70 flex items-center justify-between gap-1">
          {/* Formatted Prices: Columns for Old and New Price */}
          <div className="flex items-center gap-1">
            {convertedPreviousPrice && (
              <div className="flex flex-col items-center justify-center px-1 py-0.2 rounded bg-theme-inner border border-theme-card relative">
                <span className="text-[7.5px] text-theme-subtext font-bold leading-none">قبل</span>
                <span className="text-[8.5px] sm:text-[9.5px] text-rose-500 line-through font-mono font-bold leading-none">
                  {convertedPreviousPrice}
                </span>
              </div>
            )}
            
            <div className={`flex flex-col items-center justify-center px-1.5 py-0.5 rounded-lg border ${convertedPreviousPrice ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-theme-inner border-theme-card'}`}>
              {convertedPreviousPrice && <span className="text-[7.5px] text-emerald-600 dark:text-emerald-400 font-bold leading-none">الآن</span>}
              <div className="flex items-baseline gap-0.5">
                <span className={`text-[11px] sm:text-xs font-black font-mono tracking-tight leading-none ${convertedPreviousPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-primary'}`}>
                  {convertedCurrentPrice}
                </span>
                <span className="text-[8px] font-bold text-theme-subtext font-sans">
                  {currency.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Clear & Recognizable Shopping Cart Button */}
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="p-1.5 sm:p-2 rounded-lg bg-theme-inner hover:bg-theme-primary text-theme-main hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs border border-theme-card hover:border-transparent cursor-pointer active:scale-90"
            title="إضافة للسلة"
            aria-label="إضافة للسلة"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-primary hover:text-white group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
});

