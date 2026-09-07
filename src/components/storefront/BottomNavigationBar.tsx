import React from 'react';
import { 
  Home, 
  Layers, 
  Truck, 
  Search, 
  ShoppingCart, 
  Heart,
  Gift
} from 'lucide-react';
import { CurrencyRate } from '../../types';

interface BottomNavigationBarProps {
  cartCount: number;
  cartTotal?: number;
  currency?: CurrencyRate;
  onOpenCart: () => void;
  onOpenCategories: () => void;
  onOpenTracking: () => void;
  onOpenSearch: () => void;
  onGoHome: () => void;
  activeTab?: 'home' | 'categories' | 'tracking' | 'search' | 'cart';
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  cartCount,
  cartTotal = 0,
  currency,
  onOpenCart,
  onOpenCategories,
  onOpenTracking,
  onOpenSearch,
  onGoHome,
  activeTab = 'home'
}) => {
  return (
    <nav 
      id="mobile-bottom-navbar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-theme-card/95 backdrop-blur-xl border-t border-theme-card text-theme-main sm:hidden pb-safe shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)] transition-colors"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center text-center">
        {/* 1. Home */}
        <button
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-theme-primary font-bold' : 'text-theme-subtext hover:text-theme-main'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] leading-none">الرئيسية</span>
        </button>

        {/* 2. Categories Drawer */}
        <button
          onClick={onOpenCategories}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors cursor-pointer ${
            activeTab === 'categories' ? 'text-theme-primary font-bold' : 'text-theme-subtext hover:text-theme-main'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] leading-none">الأقسام</span>
        </button>

        {/* 3. Track Order */}
        <button
          onClick={onOpenTracking}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors cursor-pointer relative ${
            activeTab === 'tracking' ? 'text-theme-primary font-bold' : 'text-theme-subtext hover:text-theme-main'
          }`}
        >
          <div className="relative">
            <Truck className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <span className="text-[10px] leading-none">تتبع الطلب</span>
        </button>

        {/* 4. Search */}
        <button
          onClick={onOpenSearch}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors cursor-pointer ${
            activeTab === 'search' ? 'text-theme-primary font-bold' : 'text-theme-subtext hover:text-theme-main'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] leading-none">بحث</span>
        </button>

        {/* 5. Cart */}
        <button
          onClick={onOpenCart}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors cursor-pointer relative ${
            activeTab === 'cart' ? 'text-theme-primary font-bold' : 'text-theme-subtext hover:text-theme-main'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-theme-primary" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-theme-primary text-white text-[9px] font-mono font-bold flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none">السلة</span>
        </button>
      </div>
    </nav>
  );
};
