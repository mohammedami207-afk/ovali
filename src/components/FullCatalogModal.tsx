import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  ShoppingCart, 
  Eye, 
  Flame, 
  Share2, 
  LayoutGrid, 
  List, 
  Grid, 
  Filter, 
  Check, 
  RotateCcw,
  Tag,
  ArrowUpDown,
  Plus,
  Layers,
  Folder,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, Category, CurrencyRate } from '../types';
import { parseAnyDate } from '../lib/dateUtils';
import { searchProductsFuzzy } from '../lib/fuzzySearch';

interface FullCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  currency: CurrencyRate;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onShareProduct?: (product: Product) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const FullCatalogModal: React.FC<FullCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  currency,
  onQuickView,
  onAddToCart,
  onShareProduct,
  cartCount = 0,
  onOpenCart
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'date-newest' | 'popularity' | 'discount'>('featured');
  
  // UI state for filter drawer & layout mode & tree view
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isTreeFilterOpen, setIsTreeFilterOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal' | 'compact'>('grid');

  // Derive distinct, non-duplicated groups with their categories & product counts
  const availableGroups = useMemo(() => {
    const map = new Map<string, { name: string; image?: string; categories: Category[]; count: number }>();
    categories.forEach(cat => {
      if (cat.isVisible === false) return;
      const gName = (cat.group && cat.group.trim()) ? cat.group.trim() : 'عام';
      const existing = map.get(gName) || {
        name: gName,
        image: cat.image,
        categories: [],
        count: 0
      };
      existing.categories.push(cat);
      if (!existing.image && cat.image) existing.image = cat.image;
      map.set(gName, existing);
    });

    return Array.from(map.values()).map(g => {
      const groupCatNames = new Set(g.categories.map(c => c.name));
      const prodCount = products.filter(p => {
        if (p.isVisible === false || p.status === 'inactive') return false;
        return groupCatNames.has(p.category) || p.group === g.name;
      }).length;
      return { ...g, count: prodCount };
    });
  }, [categories, products]);

  // Categories belonging to the currently selected group
  const activeGroupCategories = useMemo(() => {
    if (selectedGroup === 'all') {
      return categories.filter(c => c.isVisible !== false);
    }
    return categories.filter(c => {
      if (c.isVisible === false) return false;
      const gName = (c.group && c.group.trim()) ? c.group.trim() : 'عام';
      return gName === selectedGroup;
    });
  }, [categories, selectedGroup]);

  if (!isOpen) return null;

  const resetFilters = () => {
    setSearch('');
    setSelectedGroup('all');
    setSelectedCategory('all');
    setOnlyOffers(false);
    setSortBy('featured');
  };

  const activeFiltersCount = (search ? 1 : 0) + (selectedGroup !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (onlyOffers ? 1 : 0) + (sortBy !== 'featured' ? 1 : 0);

  // Search using Arabic Fuzzy Search + Group + Category + Offers Filter
  const searchPool = search.trim() ? searchProductsFuzzy(products, search) : products;

  let filtered = searchPool.filter(p => {
    if (p.isVisible === false || p.status === 'draft') return false;

    // Group filter check
    let matchesGroup = true;
    if (selectedGroup !== 'all') {
      const grp = availableGroups.find(g => g.name === selectedGroup);
      const grpCatNames = grp ? new Set(grp.categories.map(c => c.name)) : new Set();
      matchesGroup = (p.group === selectedGroup) || (p.category && grpCatNames.has(p.category));
    }

    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesOffers = !onlyOffers || p.discount > 0;
    return matchesGroup && matchesCat && matchesOffers;
  });

  // Sort products
  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.salePrice - b.salePrice);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.salePrice - a.salePrice);
  } else if (sortBy === 'date-newest') {
    filtered.sort((a, b) => parseAnyDate(b.createdAt || b.updatedAt).getTime() - parseAnyDate(a.createdAt || a.updatedAt).getTime());
  } else if (sortBy === 'popularity') {
    filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0) || (b.discount || 0) - (a.discount || 0));
  } else if (sortBy === 'discount') {
    filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-[96vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden relative text-right text-theme-main"
      >
        
        {/* Luxury Top Header Bar */}
        <div className="px-3 py-3 sm:px-6 sm:py-4 bg-theme-gradient text-white border-b border-theme-card flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Title & Brand Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl shadow-lg shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-theme-contrast tracking-wide leading-tight">
                معرض المنتجات<br className="hidden sm:block" /> الشامل
              </h2>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex flex-col items-center justify-center shadow-lg mr-2 shrink-0">
              <span className="text-[11px] sm:text-xs font-black leading-none text-white">{filtered.length}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/90">منتج</span>
            </div>
          </div>

          {/* Quick Toolbar: Search, Filter Toggle, Layout Toggle, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Search Input */}
            <div className="relative hidden md:block w-48 lg:w-56">
              <input
                type="text"
                value={search || ""}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-8 pl-3 py-1.5 bg-slate-950/50 border border-white/10 rounded-xl text-xs text-white focus:border-white/30 focus:bg-slate-900 outline-none transition-all placeholder:text-white/40"
              />
              <Search className="w-3.5 h-3.5 text-white/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Drawer Toggle Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center justify-center p-2 rounded-xl text-xs font-bold border transition-all relative ${
                showFilterPanel || activeFiltersCount > 0
                  ? 'bg-white/20 text-white border-white/30 shadow-lg'
                  : 'bg-slate-900/40 text-white/70 border-white/10 hover:bg-slate-800/60 hover:text-white'
              }`}
              title="الفلاتر والتصفية"
            >
              <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-rose-600 text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Layout Display Mode Switcher (Vertical Grid vs Horizontal Row vs Compact Bento) */}
            <div className="flex items-center bg-slate-900/60 border border-white/10 p-0.5 rounded-xl gap-0.5">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title="عرض بطاقات عمودية (شبكة)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('horizontal')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  layoutMode === 'horizontal'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title="عرض أفقياً (قائمة واسعة)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('compact')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  layoutMode === 'compact'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title="عرض مصغر مدمج"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Button */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="p-2 sm:p-2.5 rounded-xl text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all relative flex items-center justify-center shadow-sm"
                title="سلة التسوق"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-white text-rose-600 text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 text-white/70 hover:text-white bg-slate-900/60 hover:bg-rose-600/50 border border-white/10 rounded-xl transition-all shadow-sm"
              title="إغلاق المعرض"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible / Floating Filter Drawer Panel */}
        {showFilterPanel && (
          <div className="bg-slate-900/95 border-b border-slate-800 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              
              {/* Mobile Search Input */}
              <div className="md:hidden col-span-12 relative">
                <input
                  type="text"
                  value={search || ""}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن اسم، صنف، أو باركود..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-pink-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Sort Selector */}
              <div className="md:col-span-5 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 shrink-0">الترتيب:</span>
                <select
                  value={sortBy || ""}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-pink-500 outline-none font-bold"
                >
                  <option value="featured">✨ الأكثر تميزاً</option>
                  <option value="price-low">💰 السعر: من الأقل للأعلى</option>
                  <option value="price-high">💎 السعر: من الأعلى للأقل</option>
                  <option value="date-newest">📅 التاريخ: الأحدث أولاً</option>
                  <option value="popularity">🔥 الأكثر طلباً وشعبية</option>
                  <option value="discount">🏷️ أعلى نسبة خصم</option>
                </select>
              </div>

              {/* Offers Filter Toggle */}
              <div className="md:col-span-4 flex items-center">
                <button
                  onClick={() => setOnlyOffers(!onlyOffers)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    onlyOffers
                      ? 'bg-pink-600 text-white border-pink-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${onlyOffers ? 'text-amber-300' : 'text-pink-400'}`} />
                  العروض والخصومات فقط 🔥
                </button>
              </div>

              {/* Reset Filters */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  إعادة ضبط الفلاتر
                </button>
              </div>
            </div>

            {/* Groups & Sub-Categories Filter Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              
              {/* LEVEL 1: GROUPS SCROLL BAR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-pink-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>المجموعات الرئيسية:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTreeFilterOpen(!isTreeFilterOpen)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800"
                    >
                      <span>{isTreeFilterOpen ? 'إخفاء الشجرة' : 'عرض الشجرة'}</span>
                      {isTreeFilterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {selectedGroup !== 'all' && (
                      <span className="text-pink-400 text-[11px]">محدد: {selectedGroup}</span>
                    )}
                  </div>
                </div>

                {/* Horizontal Scroll Bar for Groups */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {/* All Groups Pill */}
                  <label
                    onClick={() => {
                      setSelectedGroup('all');
                      setSelectedCategory('all');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border shrink-0 ${
                      selectedGroup === 'all'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroup === 'all'}
                      onChange={() => {
                        setSelectedGroup('all');
                        setSelectedCategory('all');
                      }}
                      className="w-3.5 h-3.5 rounded text-pink-500 accent-pink-500 cursor-pointer shrink-0"
                    />
                    <span>كافة المجموعات</span>
                  </label>

                  {/* Group Items */}
                  {availableGroups.map((grp, idx) => {
                    const isSelected = selectedGroup === grp.name;
                    return (
                      <label
                        key={`modal-grp-${grp.name}-${idx}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border shrink-0 ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-md ring-2 ring-pink-500/30'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected && selectedCategory === 'all') {
                              setSelectedGroup('all');
                            } else {
                              setSelectedGroup(grp.name);
                              setSelectedCategory('all');
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-pink-500 accent-pink-500 cursor-pointer shrink-0"
                        />
                        {grp.image ? (
                          <img
                            src={grp.image}
                            alt={grp.name}
                            className="w-4 h-4 rounded-md object-cover shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">{grp.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {grp.count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* LEVEL 2: SUB-CATEGORIES SCROLL BAR */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span>الفئات الفرعية</span>
                    {selectedGroup !== 'all' ? (
                      <span className="text-pink-400">({selectedGroup})</span>
                    ) : (
                      <span className="opacity-75">(كافة الفئات)</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      selectedCategory === 'all'
                        ? 'bg-purple-600 text-white border-transparent shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    الكل ✨
                  </button>

                  {activeGroupCategories.map((cat, cIdx) => {
                    const isCatSelected = selectedCategory === cat.name;
                    const catProdCount = products.filter(p => p.category === cat.name && p.isVisible !== false && p.status !== 'draft').length;

                    return (
                      <button
                        key={`modal-cat-${cat.CategoryID || cat.name}-${cIdx}`}
                        type="button"
                        onClick={() => setSelectedCategory(isCatSelected ? 'all' : cat.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                          isCatSelected
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-md'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="whitespace-nowrap">{cat.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                          isCatSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {catProdCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tree View Structure if Open */}
              {isTreeFilterOpen && (
                <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <Folder className="w-4 h-4 text-pink-400" />
                    <span>شجرة الهيكل التنظيمي للمتجر:</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableGroups.map((grp) => (
                      <div key={`tree-modal-${grp.name}`} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGroup(selectedGroup === grp.name ? 'all' : grp.name);
                            setSelectedCategory('all');
                          }}
                          className={`w-full text-right font-bold py-1 px-2 rounded-lg flex items-center justify-between border ${
                            selectedGroup === grp.name
                              ? 'bg-pink-950/60 text-pink-300 border-pink-500/50'
                              : 'bg-slate-900/50 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-pink-400" />
                            {grp.name}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                            {grp.count} منتج
                          </span>
                        </button>

                        <div className="mr-4 space-y-0.5 border-r-2 border-slate-800 pr-2">
                          {grp.categories.map((c) => {
                            const isCatActive = selectedCategory === c.name;
                            const cCount = products.filter(p => p.category === c.name && p.isVisible !== false && p.status !== 'draft').length;
                            return (
                              <button
                                key={`tree-cat-modal-${c.CategoryID || c.name}`}
                                type="button"
                                onClick={() => {
                                  setSelectedGroup(grp.name);
                                  setSelectedCategory(isCatActive ? 'all' : c.name);
                                }}
                                className={`w-full text-right text-xs py-0.5 px-2 rounded-md flex items-center justify-between ${
                                  isCatActive
                                    ? 'bg-purple-900/60 text-purple-300 font-bold'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                                }`}
                              >
                                <span>• {c.name}</span>
                                <span className="text-[9px] opacity-75">{cCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Product Display Canvas */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-theme-bg">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-theme-subtext space-y-4">
              <div className="p-4 bg-theme-card border border-theme-card rounded-3xl">
                <ShoppingCart className="w-12 h-12 text-theme-subtext" />
              </div>
              <p className="text-base font-bold text-theme-main">لم يتم العثور على منتجات تطابق شروط البحث</p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-theme-gradient text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-90 transition-all"
              >
                إعادة عرض جميع المنتجات
              </button>
            </div>
          ) : (
            <>
              {/* LAYOUT MODE 1: Standard Vertical Grid Card Layout */}
              {layoutMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
                  {filtered.map((product, idx) => {
                    const convertedPrice = ((Number(product.salePrice) || 0) * (currency?.exchangeRate || 1)).toFixed(2);
                    const discount = product.discount || 0;
                    const imgs = product.images || [];

                    return (
                      <div
                        key={`${product.ProductID || 'prd'}_${idx}`}
                        className="group bg-theme-card border border-theme-card rounded-2xl overflow-hidden hover:border-theme-primary/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="relative aspect-[3/4] overflow-hidden bg-theme-inner">
                            <img
                              src={(imgs[0] && imgs[0].trim()) ? imgs[0] : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'; }}
                            />

                            {/* Discount Tag */}
                            {discount > 0 && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-600 text-white text-[10px] font-black rounded-lg shadow-md">
                                خصم {discount}%
                              </span>
                            )}

                            {/* Images Counter Badge */}
                            {imgs.length > 1 && (
                              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold rounded-md border border-slate-800">
                                {imgs.length} صور
                              </span>
                            )}

                            {/* Quick Actions Overlay */}
                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <button
                                onClick={() => { onClose(); onQuickView(product); }}
                                className="p-2.5 bg-slate-900/90 text-white rounded-xl hover:bg-pink-600 transition-colors shadow-lg"
                                title="معاينة سريعة"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {onShareProduct && (
                                <button
                                  onClick={() => { onClose(); onShareProduct(product); }}
                                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors shadow-lg"
                                  title="مشاركة المنتج للواتساب"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Info Body */}
                          <div className="p-3 space-y-1">
                            <span className="text-[10px] text-theme-primary font-bold px-2 py-0.5 rounded-md bg-theme-primary/10 inline-block truncate max-w-full">
                              {product.category || 'عام'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-extrabold text-theme-main line-clamp-2 leading-snug group-hover:text-theme-primary transition-colors min-h-[2rem]">
                              {product.name}
                            </h3>
                          </div>
                        </div>

                        {/* Card Footer Price & Add Button */}
                        <div className="p-3 pt-0 flex items-center justify-between border-t border-theme-card/60 mt-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {convertedPrice}
                            </span>
                            <span className="text-[10px] text-theme-subtext font-bold">
                              {currency.symbol}
                            </span>
                          </div>

                          <button
                            onClick={() => onAddToCart(product)}
                            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                            title="إضافة إلى السلة"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT MODE 2: Horizontal Row / Wide Cards Layout */}
              {layoutMode === 'horizontal' && (
                <div className="space-y-3 max-w-5xl mx-auto">
                  {filtered.map((product, idx) => {
                    const convertedPrice = ((Number(product.salePrice) || 0) * (currency?.exchangeRate || 1)).toFixed(2);
                    const discount = product.discount || 0;
                    const imgs = product.images || [];

                    return (
                      <div
                        key={`${product.ProductID || 'prd'}_${idx}`}
                        className="group bg-theme-card border border-theme-card rounded-2xl overflow-hidden hover:border-theme-primary/50 transition-all p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs"
                      >
                        {/* Horizontal Thumbnail */}
                        <div className="relative w-full sm:w-36 h-36 shrink-0 rounded-xl overflow-hidden bg-theme-inner">
                          <img
                            src={(imgs[0] && imgs[0].trim()) ? imgs[0] : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'; }}
                          />
                          {discount > 0 && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-pink-600 text-white text-[10px] font-black rounded-lg">
                              خصم {discount}%
                            </span>
                          )}
                        </div>

                        {/* Horizontal Content */}
                        <div className="flex-1 w-full space-y-2 text-right">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-theme-primary font-bold px-2 py-0.5 bg-theme-primary/10 rounded-lg">
                              {product.category}
                            </span>
                            {product.SKU && (
                              <span className="text-[10px] text-theme-subtext font-mono">
                                SKU: {product.SKU}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-black text-theme-main group-hover:text-theme-primary transition-colors">
                            {product.name}
                          </h3>

                          <p className="text-xs text-theme-subtext line-clamp-2">
                            {product.description || 'منتج عالي الجودة بتصميم أنيق ومميز مناسب لجميع المناسبات.'}
                          </p>

                          {/* Extra Thumbnails row if multiple images exist */}
                          {imgs.length > 1 && (
                            <div className="flex items-center gap-1.5 pt-1">
                              {imgs.slice(0, 3).map((img, idx) => (
                                img && img.trim() ? (
                                  <img
                                    key={idx}
                                    src={img.trim()}
                                    alt=""
                                    className="w-8 h-8 rounded-lg object-cover border border-theme-card"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : null
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Horizontal Price & Action */}
                        <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-theme-card">
                          <div className="text-right">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {convertedPrice}
                              </span>
                              <span className="text-xs text-theme-subtext font-bold">
                                {currency.symbol}
                              </span>
                            </div>
                            {discount > 0 && (
                              <span className="text-[10px] text-theme-subtext line-through block">
                                {product.costPrice} {currency.symbol}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { onClose(); onQuickView(product); }}
                              className="p-2 bg-theme-inner hover:bg-theme-card text-theme-main rounded-xl border border-theme-card transition-all cursor-pointer"
                              title="معاينة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onAddToCart(product)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                              title="إضافة للسلة"
                            >
                              <Plus className="w-4 h-4" />
                              <span>إضافة</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT MODE 3: Compact Bento Grid */}
              {layoutMode === 'compact' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {filtered.map((product, idx) => {
                    const convertedPrice = ((Number(product.salePrice) || 0) * (currency?.exchangeRate || 1)).toFixed(2);
                    const imgs = product.images || [];

                    return (
                      <div
                        key={`${product.ProductID || 'prd'}_${idx}`}
                        className="group bg-theme-card border border-theme-card rounded-xl p-2 hover:border-theme-primary/50 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-theme-inner">
                          <img
                            src={(imgs[0] && imgs[0].trim()) ? imgs[0] : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'; }}
                          />
                        </div>

                        <div>
                          <h4 className="text-[11px] font-extrabold text-theme-main truncate mb-1">{product.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-400 font-mono block">
                              {convertedPrice} {currency.symbol}
                            </span>
                            <button
                              onClick={() => onAddToCart(product)}
                              className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                              title="إضافة"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
};
