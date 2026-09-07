import React, { useState, useMemo } from 'react';
import { 
  X, 
  Home, 
  Layers, 
  Truck, 
  Sparkles, 
  Heart, 
  Gift, 
  ShieldCheck, 
  Phone, 
  Shield, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Package,
  ShoppingBag,
  Eye,
  Check
} from 'lucide-react';
import { Category, Product, AppSettings, CurrencyRate } from '../../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  categories: Category[];
  selectedGroup?: string;
  onSelectGroup?: (groupName: string) => void;
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onQuickView?: (product: Product) => void;
  onOpenTracking: () => void;
  onOpenCatalog?: () => void;
  onOpenReferral?: () => void;
  onOpenWishlist?: () => void;
  onOpenAdmin: () => void;
  settings?: AppSettings;
  wishlistCount?: number;
  cartCount?: number;
  onOpenCart?: () => void;
  currency?: CurrencyRate;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  products = [],
  categories = [],
  selectedGroup = 'all',
  onSelectGroup,
  selectedCategory,
  onSelectCategory,
  onQuickView,
  onOpenTracking,
  onOpenCatalog,
  onOpenReferral,
  onOpenWishlist,
  onOpenAdmin,
  settings,
  wishlistCount = 0,
  cartCount = 0,
  onOpenCart,
  currency
}) => {
  // Tree Nodes Expanded States
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Compute available groups list with group image, categories and total product count
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { name: string; image?: string; categories: Category[]; count: number }>();

    // 1. Map groups from categories
    categories.forEach((cat) => {
      if (cat.isVisible === false) return;
      const gName = (cat.group && cat.group.trim()) ? cat.group.trim() : (cat.name || 'عام');

      if (!groupMap.has(gName)) {
        groupMap.set(gName, {
          name: gName,
          image: cat.image,
          categories: [cat],
          count: 0
        });
      } else {
        const existing = groupMap.get(gName)!;
        if (!existing.categories.some(c => c.CategoryID === cat.CategoryID || c.name === cat.name)) {
          existing.categories.push(cat);
        }
        if (!existing.image && cat.image) {
          existing.image = cat.image;
        }
      }
    });

    // 2. Also map groups from products if missing in categories
    products.forEach((prod) => {
      if (prod.isVisible === false || prod.status === 'draft') return;
      if (prod.group && prod.group.trim()) {
        const gName = prod.group.trim();
        if (!groupMap.has(gName)) {
          groupMap.set(gName, {
            name: gName,
            image: prod.images?.[0],
            categories: [],
            count: 0
          });
        }
      }
    });

    // 3. Accurately compute count for each group
    return Array.from(groupMap.values()).map(g => {
      const catNames = new Set(g.categories.map(c => c.name.toLowerCase().trim()));
      const catIds = new Set(g.categories.map(c => c.CategoryID.toLowerCase().trim()));
      const gNameLower = g.name.toLowerCase().trim();

      const count = products.filter(p => {
        if (p.isVisible === false || p.status === 'draft') return false;

        const pGroupLower = (p.group || '').toLowerCase().trim();
        const pCatLower = (p.category || '').toLowerCase().trim();

        const matchesGroupDirectly = pGroupLower === gNameLower;
        const matchesCategoryAsGroupName = pCatLower === gNameLower;
        const matchesCategoryName = catNames.has(pCatLower);
        const matchesCategoryId = catIds.has(pCatLower);

        return matchesGroupDirectly || matchesCategoryAsGroupName || matchesCategoryName || matchesCategoryId;
      }).length;

      return {
        ...g,
        count
      };
    });
  }, [categories, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Simplified Groups Sidebar) */}
      <div className="relative w-80 sm:w-96 max-w-full bg-theme-card border-r border-theme-card text-theme-main h-full flex flex-col shadow-2xl z-10 overflow-y-auto hide-scrollbar">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-theme-card flex items-center justify-between bg-theme-inner">
          <div className="flex items-center gap-3">
            {settings?.storeLogoUrl ? (
              <img src={settings.storeLogoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-theme-card border border-theme-card p-0.5" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-theme-gradient flex items-center justify-center text-white font-black text-sm shadow-md">
                {settings?.storeName ? settings.storeName[0] : 'م'}
              </div>
            )}
            <div>
              <h2 className="text-sm font-black text-theme-main leading-tight">
                {settings?.storeName || 'متجرنا الإلكتروني'}
              </h2>
              <p className="text-[10px] text-theme-subtext font-bold">مجموعات وأقسام المتجر</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-theme-subtext hover:text-theme-main rounded-xl hover:bg-theme-card transition-colors cursor-pointer"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar Links */}
        <div className="p-3 border-b border-theme-card bg-theme-inner/50 grid grid-cols-4 gap-2 text-center text-xs">
          <button
            onClick={() => {
              if (onSelectGroup) onSelectGroup('all');
              onSelectCategory('all');
              onClose();
            }}
            className="p-2 rounded-xl bg-theme-card hover:bg-theme-primary/10 hover:text-theme-primary transition-all flex flex-col items-center gap-1 cursor-pointer border border-theme-card"
          >
            <Home className="w-4 h-4 text-theme-primary" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenTracking();
            }}
            className="p-2 rounded-xl bg-theme-card hover:bg-sky-500/10 hover:text-sky-500 transition-all flex flex-col items-center gap-1 cursor-pointer border border-theme-card"
          >
            <Truck className="w-4 h-4 text-sky-500" />
            <span className="text-[10px] font-bold">تتبع طلبي</span>
          </button>

          {onOpenCart && (
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="p-2 rounded-xl bg-theme-card hover:bg-rose-500/10 hover:text-rose-500 transition-all flex flex-col items-center gap-1 cursor-pointer border border-theme-card relative"
            >
              <ShoppingBag className="w-4 h-4 text-rose-500" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono flex items-center justify-center font-black shadow">
                  {cartCount}
                </span>
              )}
              <span className="text-[10px] font-bold">السلة</span>
            </button>
          )}

          {onOpenWishlist && (
            <button
              onClick={() => {
                onClose();
                onOpenWishlist();
              }}
              className="p-2 rounded-xl bg-theme-card hover:bg-pink-500/10 hover:text-pink-500 transition-all flex flex-col items-center gap-1 cursor-pointer border border-theme-card relative"
            >
              <Heart className="w-4 h-4 text-pink-500" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-pink-600 text-white text-[9px] font-mono flex items-center justify-center font-black shadow">
                  {wishlistCount}
                </span>
              )}
              <span className="text-[10px] font-bold">المفضلة</span>
            </button>
          )}
        </div>

        {/* 🏷️ SIMPLIFIED GROUPS LIST SECTION */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-bold text-theme-subtext pb-2 border-b border-theme-card">
            <span className="flex items-center gap-1.5 text-theme-main font-black">
              <Layers className="w-4 h-4 text-theme-primary" />
              <span>مجموعات المتجر:</span>
            </span>
            <span className="text-[10px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full font-bold">
              {availableGroups.length} مجموعة
            </span>
          </div>

          {/* Root Node: كافة المجموعات */}
          <button
            onClick={() => {
              if (onSelectGroup) onSelectGroup('all');
              onSelectCategory('all');
              onClose();
            }}
            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold cursor-pointer ${
              selectedGroup === 'all' && selectedCategory === 'all'
                ? 'bg-theme-gradient text-white border-transparent shadow-md font-black scale-[1.01]'
                : 'bg-theme-inner border-theme-card text-theme-main hover:bg-theme-card'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs">عرض كافة المجموعات والمنتجات</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-white/20">
              الكل
            </span>
          </button>

          {/* Simplified Groups List */}
          <div className="space-y-2 pt-1">
            {availableGroups.map((grp, idx) => {
              const isGroupSelected = selectedGroup === grp.name;

              // Derive subcategories list belonging to this group
              const grpCatsMap = new Map<string, { name: string; id?: string; image?: string; count: number }>();

              grp.categories.forEach(c => {
                const cName = c.name.trim();
                const catCount = products.filter(p => 
                  p.isVisible !== false && 
                  p.status !== 'draft' && 
                  (p.category === c.name || p.category === c.CategoryID)
                ).length;

                grpCatsMap.set(cName.toLowerCase(), {
                  name: c.name,
                  id: c.CategoryID,
                  image: c.image,
                  count: catCount
                });
              });

              // Also check products belonging to this group for subcategories
              const gNameLower = grp.name.toLowerCase().trim();
              products.forEach(p => {
                if (p.isVisible === false || p.status === 'draft') return;
                const pGroupLower = (p.group || '').toLowerCase().trim();
                if (pGroupLower === gNameLower && p.category && p.category.trim()) {
                  const cName = p.category.trim();
                  if (!grpCatsMap.has(cName.toLowerCase())) {
                    const catCount = products.filter(prod => 
                      prod.isVisible !== false && 
                      prod.status !== 'draft' && 
                      (prod.group || '').toLowerCase().trim() === gNameLower &&
                      (prod.category || '').toLowerCase().trim() === cName.toLowerCase()
                    ).length;

                    grpCatsMap.set(cName.toLowerCase(), {
                      name: cName,
                      image: p.images?.[0],
                      count: catCount
                    });
                  }
                }
              });

              const subCategoriesList = Array.from(grpCatsMap.values());

              return (
                <div key={`drawer-grp-${grp.name}-${idx}`} className="space-y-1">
                  {/* Group Card */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectGroup) onSelectGroup(grp.name);
                      onSelectCategory('all');
                    }}
                    className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isGroupSelected
                        ? 'bg-theme-primary/15 text-theme-primary border-theme-primary font-black shadow-sm ring-1 ring-theme-primary/30'
                        : 'bg-theme-inner/80 border-theme-card hover:bg-theme-card text-theme-main hover:border-theme-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Circular Avatar with Group Image & Luxury Heart Badge */}
                      <div className={`relative w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center transition-all ${
                        isGroupSelected
                          ? 'ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg shadow-md'
                          : 'border border-theme-card/80'
                      }`}>
                        {grp.image ? (
                          <img
                            src={grp.image}
                            alt={grp.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-rose-400/20 to-pink-500/20 flex items-center justify-center text-theme-primary">
                            <Folder className="w-5 h-5" />
                          </div>
                        )}

                        {/* Small luxury heart badge */}
                        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-rose-200 dark:border-rose-900">
                          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                        </div>
                      </div>

                      <div className="text-right min-w-0">
                        <span className="text-xs font-black block truncate text-theme-main">{grp.name}</span>
                        <span className="text-[10px] text-theme-subtext font-bold block">
                          {grp.count} صنف متوفر
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupSelected ? 'text-theme-primary rotate-180' : 'text-theme-subtext'}`} />
                    </div>
                  </button>

                  {/* Horizontal Sub-Bar for Categories ONLY under the Selected Group */}
                  {isGroupSelected && (
                    <div className="mt-1.5 mr-1 ml-1 p-2.5 bg-theme-primary/10 rounded-2xl border border-theme-primary/25 space-y-2 animate-fadeIn text-right">
                      <div className="flex items-center justify-between text-[11px] font-bold text-theme-primary px-1">
                        <span className="flex items-center gap-1 font-black">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>فئات {grp.name}:</span>
                        </span>
                        <span className="text-[10px] text-theme-subtext">
                          اسحب أفقياً 👈
                        </span>
                      </div>

                      {/* Scrollable Horizontal Bar of Sub-Categories */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 hide-scrollbar scroll-smooth">
                        {/* "عرض كافة فئات هذه المجموعة" button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory('all');
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                            selectedCategory === 'all'
                              ? 'bg-theme-gradient text-white shadow-md font-black'
                              : 'bg-theme-card text-theme-main hover:bg-theme-inner border border-theme-card'
                          }`}
                        >
                          <span>عرض الكل</span>
                        </button>

                        {/* Sub-category pills */}
                        {subCategoriesList.map((subCat, cIdx) => {
                          const isCatActive = selectedCategory === subCat.name || selectedCategory === subCat.id;
                          return (
                            <button
                              key={`subcat-${subCat.name}-${cIdx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCategory(subCat.name);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                                isCatActive
                                  ? 'bg-theme-primary text-white shadow-md font-black ring-2 ring-theme-primary/30'
                                  : 'bg-theme-card text-theme-main hover:bg-theme-inner border border-theme-card/80 hover:border-theme-primary/40'
                              }`}
                            >
                              {subCat.image && (
                                <img src={subCat.image} alt={subCat.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                              )}
                              <span>{subCat.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                                isCatActive ? 'bg-white/30 text-white font-bold' : 'bg-theme-inner text-theme-subtext font-medium'
                              }`}>
                                {subCat.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info actions */}
        <div className="mt-auto border-t border-theme-card p-3 flex items-center justify-between gap-2 bg-theme-inner">
          {settings?.storePhoneSaudi && (
            <a
              href={`https://wa.me/${settings.storePhoneSaudi.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>الدعم الفني والواتساب</span>
            </a>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="p-2 bg-theme-card hover:bg-theme-inner text-theme-primary rounded-xl flex items-center justify-center border border-theme-card hover:border-theme-primary transition-all cursor-pointer"
            title="لوحة الإدارة"
          >
            <Shield className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
