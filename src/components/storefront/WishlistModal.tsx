import React from 'react';
import { Heart, X, ShoppingCart, Trash2 } from 'lucide-react';
import { Product, CurrencyRate } from '../../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  products: Product[];
  currency: CurrencyRate;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  products,
  currency,
  onToggleWishlist,
  onAddToCart,
  onQuickView
}) => {
  if (!isOpen) return null;

  const wishlistProducts = products.filter(p => wishlistIds.includes(p.ProductID));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto dir-rtl">
      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative text-theme-main max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-theme-card pb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="text-base font-bold text-theme-main">قائمة المفضلة (الرغبات)</h3>
            <span className="bg-rose-500/20 text-rose-500 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {wishlistProducts.length} منتج
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-theme-inner hover:bg-theme-card text-theme-subtext hover:text-theme-main border border-theme-card rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-theme-inner rounded-2xl border border-theme-card">
            <Heart className="w-12 h-12 text-theme-subtext mx-auto opacity-40" />
            <p className="text-theme-main font-bold">قائمة المفضلة فارغة حالياً</p>
            <p className="text-xs text-theme-subtext max-w-xs mx-auto">
              اضغط على أيقونة القلب في أي منتج لإضافته إلى المفضلة والرجوع إليه لاحقاً بكل سهولة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wishlistProducts.map(product => {
              const currentPrice = ((Number(product.salePrice) || 0) * (1 - (product.discount || 0) / 100) * (currency?.exchangeRate || 1)).toFixed(2);
              const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';

              return (
                <div 
                  key={product.ProductID}
                  className="bg-theme-inner border border-theme-card rounded-2xl p-3 flex gap-3 items-center relative group hover:border-theme-primary transition-colors"
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 object-cover rounded-xl shrink-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      onQuickView(product);
                    }}
                  />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 
                      className="text-xs font-bold text-theme-main truncate cursor-pointer hover:text-theme-primary"
                      onClick={() => {
                        onClose();
                        onQuickView(product);
                      }}
                    >
                      {product.name}
                    </h4>
                    <p className="text-xs font-black text-theme-primary font-mono">
                      {currentPrice} {currency.symbol}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(product);
                        }}
                        className="px-2.5 py-1 bg-theme-gradient text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow hover:opacity-90 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>إضافة للسلة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleWishlist(product.ProductID)}
                        className="p-1.5 bg-theme-card hover:bg-rose-500/20 text-rose-500 rounded-lg border border-theme-card transition-colors cursor-pointer"
                        title="إزالة من المفضلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-theme-card">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-theme-inner hover:bg-theme-card border border-theme-card text-theme-main font-bold rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
