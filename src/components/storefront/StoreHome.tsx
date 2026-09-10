import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  Zap, 
  Clock, 
  Percent, 
  ArrowLeft, 
  Gift, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  Store,
  Phone,
  MessageCircle,
  Receipt,
  Info,
  Eye,
  EyeOff,
  Smartphone,
  Apple,
  Laptop,
  Download,
  ExternalLink,
  Layers,
  Folder,
  FolderPlus,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  ArrowUp,
  Bell,
  Share2,
  Check,
  Copy,
  Heart
} from 'lucide-react';
import { Product, Category, CurrencyRate, AppSettings, Offer } from '../../types';
import { ProductCard } from './ProductCard';
import { isCreatedToday, isCreatedThisWeek, isCreatedThisMonth, parseAnyDate } from '../../lib/dateUtils';
import { searchProductsFuzzy } from '../../lib/fuzzySearch';

interface StoreHomeProps {
  products: Product[];
  categories: Category[];
  offers?: Offer[];
  currency: CurrencyRate;
  searchQuery: string;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedGroup?: string;
  setSelectedGroup?: (grp: string) => void;
  onQuickView: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onShareProduct?: (p: Product) => void;
  settings?: AppSettings;
  wishlist?: string[];
  onToggleWishlist?: (productId: string) => void;
  onOpenTracking?: () => void;
  onOpenPolicies?: (tab?: any) => void;
  onRefreshStore?: () => void;
}

export const StoreHome: React.FC<StoreHomeProps & { onOpenCatalog?: () => void }> = ({
  products,
  categories,
  offers = [],
  currency,
  searchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedGroup: propsSelectedGroup,
  setSelectedGroup: propsSetSelectedGroup,
  onQuickView,
  onAddToCart,
  onShareProduct,
  onOpenCatalog,
  settings,
  wishlist = [],
  onToggleWishlist,
  onOpenTracking,
  onOpenPolicies,
  onRefreshStore
}) => {
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-low' | 'price-high' | 'discount'>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [isStoreInfoVisible, setIsStoreInfoVisible] = useState(false);
  
  const [localSelectedGroup, setLocalSelectedGroup] = useState<string>('all');
  const selectedGroup = propsSelectedGroup !== undefined ? propsSelectedGroup : localSelectedGroup;
  const setSelectedGroup = propsSetSelectedGroup || setLocalSelectedGroup;
  const [isTreeFilterOpen, setIsTreeFilterOpen] = useState(false);
  const [isCategoryFilterVisible, setIsCategoryFilterVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copiedGroupLink, setCopiedGroupLink] = useState(false);

  // Web Push Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted' && localStorage.getItem('store_push_notifications') === 'enabled';
    }
    return false;
  });

  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('متصفح جهازك الحالي لا يدعم خاصية التنبيهات المباشرة.');
      return;
    }

    if (Notification.permission === 'granted') {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem('store_push_notifications', newState ? 'enabled' : 'disabled');
      if (newState) {
        new Notification('🔔 تم تفعيل إشعارات الأصناف الجديدة!', {
          body: 'سوف يصلك تنبيه فوري على جوالك عند نزول منتجات أو أشكال جديدة في المتجر.',
          icon: settings?.logoUrl || '/icon.png'
        });
      }
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('store_push_notifications', 'enabled');
        new Notification('🔔 تم تفعيل إشعارات المتجر بنجاح!', {
          body: 'أهلاً بك! سيوصلك إشعار فوري عند إضافة أي أصناف أو منتجات جديدة في المتجر.',
          icon: settings?.logoUrl || '/icon.png'
        });
      } else {
        alert('تم رفض إذن الإشعارات من إعدادات المتصفح. يمكنك السماح بالإشعارات لإكمال التفعيل.');
      }
    }
  };

  const handleCopyGroupLink = (grpName: string, catName?: string) => {
    let url = `${window.location.origin}${window.location.pathname}`;
    const searchParams = new URLSearchParams();
    if (grpName && grpName !== 'all') {
      searchParams.set('group', grpName);
    }
    if (catName && catName !== 'all') {
      searchParams.set('category', catName);
    }
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedGroupLink(true);
    setTimeout(() => setCopiedGroupLink(false), 2500);
  };

  // Read URL query parameters on mount for direct group/category sharing links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGroup = params.get('group') || params.get('g');
    const urlCategory = params.get('category') || params.get('c');
    if (urlGroup) {
      setSelectedGroup(decodeURIComponent(urlGroup));
    }
    if (urlCategory) {
      setSelectedCategory(decodeURIComponent(urlCategory));
    }
  }, []);

  // Auto-request notification permission automatically on user interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('store_push_notifications', 'enabled');
      } else if (Notification.permission === 'default') {
        const autoEnable = () => {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('store_push_notifications', 'enabled');
            }
          }).catch(() => {});
          window.removeEventListener('click', autoEnable);
        };
        window.addEventListener('click', autoEnable, { once: true });
      }
    }
  }, []);

  // Monitor scroll position for Floating Scroll To Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive distinct, non-duplicated groups with their categories & product counts
  const availableGroups = useMemo(() => {
    const map = new Map<string, { name: string; image?: string; categories: Category[]; count: number }>();

    // 1. Map groups from categories
    categories.forEach(cat => {
      if (cat.isVisible === false) return;
      const gName = (cat.group && cat.group.trim()) ? cat.group.trim() : (cat.name || 'عام');
      const existing = map.get(gName) || {
        name: gName,
        image: cat.image,
        categories: [],
        count: 0
      };
      if (!existing.categories.some(c => c.CategoryID === cat.CategoryID || c.name === cat.name)) {
        existing.categories.push(cat);
      }
      if (!existing.image && cat.image) existing.image = cat.image;
      map.set(gName, existing);
    });

    // 2. Map groups from products
    products.forEach(prod => {
      if (prod.isVisible === false || prod.status === 'draft') return;
      if (prod.group && prod.group.trim()) {
        const gName = prod.group.trim();
        if (!map.has(gName)) {
          map.set(gName, {
            name: gName,
            image: prod.images?.[0],
            categories: [],
            count: 0
          });
        }
      }
    });

    // 3. Compute accurate product count
    return Array.from(map.values()).map(g => {
      const catNames = new Set(g.categories.map(c => c.name.toLowerCase().trim()));
      const catIds = new Set(g.categories.map(c => c.CategoryID.toLowerCase().trim()));
      const gNameLower = g.name.toLowerCase().trim();

      const prodCount = products.filter(p => {
        if (p.isVisible === false || p.status === 'draft') return false;
        const pGroupLower = (p.group || '').toLowerCase().trim();
        const pCatLower = (p.category || '').toLowerCase().trim();

        const matchesGroupDirectly = pGroupLower === gNameLower;
        const matchesCategoryAsGroupName = pCatLower === gNameLower;
        const matchesCategoryName = catNames.has(pCatLower);
        const matchesCategoryId = catIds.has(pCatLower);

        return matchesGroupDirectly || matchesCategoryAsGroupName || matchesCategoryName || matchesCategoryId;
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

  // Fast Memoized Search (Fuzzy with Arabic Typo Tolerance), Filter and Sorting Logic for 5,000+ items
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim();
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;

    // Apply Arabic-aware Fuzzy Search first if query exists
    const searchPool = query ? searchProductsFuzzy(products, query) : products;

    const list = searchPool.filter(p => {
      if (p.isVisible === false || p.status === 'draft') return false;

      // Group filter check
      let matchesGroup = true;
      if (selectedGroup !== 'all') {
        const grp = availableGroups.find(g => g.name === selectedGroup);
        const catNames = grp ? new Set(grp.categories.map(c => c.name.toLowerCase().trim())) : new Set();
        const catIds = grp ? new Set(grp.categories.map(c => c.CategoryID.toLowerCase().trim())) : new Set();
        const sGrpLower = selectedGroup.toLowerCase().trim();

        const pGrpLower = (p.group || '').toLowerCase().trim();
        const pCatLower = (p.category || '').toLowerCase().trim();

        const matchesGroupDirectly = pGrpLower === sGrpLower;
        const matchesCategoryAsGroupName = pCatLower === sGrpLower;
        const matchesCategoryName = catNames.has(pCatLower);
        const matchesCategoryId = catIds.has(pCatLower);

        matchesGroup = matchesGroupDirectly || matchesCategoryAsGroupName || matchesCategoryName || matchesCategoryId;
      }

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const matchesDiscount = !filterDiscountOnly || p.discount > 0;

      const prodDate = p.createdAt || p.updatedAt;
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = isCreatedToday(prodDate);
      } else if (dateFilter === 'week') {
        matchesDate = isCreatedThisWeek(prodDate);
      } else if (dateFilter === 'month') {
        matchesDate = isCreatedThisMonth(prodDate);
      }

      const finalPriceInCurrency = p.salePrice * (1 - (p.discount || 0) / 100) * currency.exchangeRate;
      const matchesMinPrice = minP === null || finalPriceInCurrency >= minP;
      const matchesMaxPrice = maxP === null || finalPriceInCurrency <= maxP;

      return matchesGroup && matchesCategory && matchesDiscount && matchesDate && matchesMinPrice && matchesMaxPrice;
    });

    return list.sort((a, b) => {
      const priceA = a.salePrice * (1 - (a.discount || 0) / 100);
      const priceB = b.salePrice * (1 - (b.discount || 0) / 100);

      const timeA = (a.createdAt || a.updatedAt) ? parseAnyDate(a.createdAt || a.updatedAt).getTime() : 0;
      const timeB = (b.createdAt || b.updatedAt) ? parseAnyDate(b.createdAt || b.updatedAt).getTime() : 0;

      if (sortBy === 'newest') {
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return (b.ProductID || '').localeCompare(a.ProductID || '');
      } else if (sortBy === 'price-low') {
        return priceA - priceB;
      } else if (sortBy === 'price-high') {
        return priceB - priceA;
      } else if (sortBy === 'discount') {
        return (b.discount || 0) - (a.discount || 0);
      } else {
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return (b.ProductID || '').localeCompare(a.ProductID || '');
      }
    });
  }, [products, selectedCategory, selectedGroup, availableGroups, searchQuery, filterDiscountOnly, dateFilter, minPrice, maxPrice, currency.exchangeRate, sortBy]);

  // Infinite Scroll state: load in batches of 24 smoothly
  const [visibleCount, setVisibleCount] = useState(24);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount when search, filters, category, or sorting changes
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, selectedGroup, searchQuery, filterDiscountOnly, dateFilter, minPrice, maxPrice, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  // Infinite Scroll IntersectionObserver with debounced smooth fetch
  useEffect(() => {
    if (!hasMore) return;
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoadingMore(true);
          const timer = setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 24, filteredProducts.length));
            setIsLoadingMore(false);
          }, 200);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, filteredProducts.length]);

  const activeOffers = useMemo(() => {
    return offers.filter(o => o.status === 'active' && (!o.endDate || new Date(o.endDate) >= new Date()));
  }, [offers]);

  const activeBanners = useMemo(() => {
    const banners = [];
    if (settings.banner1_image || settings.banner1_title) {
      banners.push({ image: settings.banner1_image, title: settings.banner1_title, link: settings.banner1_link });
    }
    if (settings.banner2_image || settings.banner2_title) {
      banners.push({ image: settings.banner2_image, title: settings.banner2_title, link: settings.banner2_link });
    }
    if (settings.banner3_image || settings.banner3_title) {
      banners.push({ image: settings.banner3_image, title: settings.banner3_title, link: settings.banner3_link });
    }
    return banners;
  }, [settings]);

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % activeBanners.length);
    }, 4000); // 4 seconds
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Active Offers Marquee Banner */}
      {activeOffers.length > 0 && (
        <div className="bg-theme-gradient text-white py-2 px-4 rounded-2xl shadow-lg flex items-center overflow-hidden relative border border-white/20">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/30 backdrop-blur-md rounded-xl shrink-0 z-10 text-white font-bold text-xs ml-3 shadow-sm border border-white/20">
            <Gift className="w-3.5 h-3.5 animate-bounce" />
            <span className="whitespace-nowrap">عروض خاصة:</span>
          </div>
          <div className="overflow-hidden w-full relative h-6">
            <div className="animate-marquee-rtl flex items-center gap-8 absolute top-0 bottom-0 pr-4">
              {activeOffers.map((offer, idx) => (
                <div key={offer.OfferID || idx} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs font-bold">{offer.title}</span>
                  {offer.discountPercentage > 0 && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      خصم {offer.discountPercentage}%
                    </span>
                  )}
                  <span className="text-white/50 px-2">•</span>
                </div>
              ))}
              {/* Duplicate for seamless infinite scrolling */}
              {activeOffers.map((offer, idx) => (
                <div key={`dup-${offer.OfferID || idx}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs font-bold">{offer.title}</span>
                  {offer.discountPercentage > 0 && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      خصم {offer.discountPercentage}%
                    </span>
                  )}
                  <span className="text-white/50 px-2">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ads/Banners Slider */}
      {activeBanners.length > 0 && (
        <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50 group">
          {activeBanners.map((banner, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${currentBanner === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              style={{
                backgroundImage: banner.image ? `url(${banner.image})` : undefined,
                backgroundColor: banner.image ? undefined : 'var(--theme-primary)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                {banner.title && (
                  <h2 className="text-white text-2xl sm:text-4xl font-black drop-shadow-lg mb-4 animate-fade-in-up">
                    {banner.title}
                  </h2>
                )}
                {banner.link && (
                  <a 
                    href={banner.link.startsWith('http') ? banner.link : `https://${banner.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform"
                  >
                    تسوق الآن
                  </a>
                )}
              </div>
            </div>
          ))}
          
          {/* Slider Dots */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${currentBanner === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* High Fashion Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-theme-card border border-theme-card p-6 sm:p-10 text-theme-main shadow-xl transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: 'var(--theme-primary, #ec4899)' }} />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-theme-primary/40 text-theme-primary text-xs font-bold bg-theme-primary/10">
            <Flame className="w-3.5 h-3.5 text-theme-primary" />
            <span>{settings?.storeName ? `تشكيلة ${settings.storeName} ${new Date().getFullYear()}` : `تشكيلة المتجر الفاخرة ${new Date().getFullYear()}`}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-theme-main">
            {settings?.heroTitle || 'أحدث صيحات الموضة والأزياء بين يديك'}
          </h1>

          <p className="text-theme-subtext text-xs sm:text-sm leading-relaxed max-w-lg">
            {settings?.heroSubtitle || 'اكتشفي الأناقة الاستثنائية للفساتين والملابس والحقائب في المملكة العربية السعودية واليمن، مع خيارات الدفع بالريال السعودي، اليمني والدولار.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenCatalog || (() => setSelectedCategory('فساتين أنيقة'))}
              className="px-6 py-3 rounded-2xl bg-theme-gradient hover:opacity-90 text-white text-xs font-extrabold shadow-theme-primary transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>تصفحي كافة المنتجات والخصومات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 text-xs text-theme-subtext border-r border-theme-card pr-3">
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-theme-primary" /> توصيل سريع</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> دفع آمن</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🏷️ UNIFIED CONSOLIDATED STORE FILTER SYSTEM */}
      {categories.length > 0 && (!isCategoryFilterVisible ? (
            /* COMPACT TRIGGER BAR (HIDDEN BY DEFAULT) */
            <div className="bg-theme-card/90 backdrop-blur-md border border-theme-card rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center justify-between gap-2.5 transition-all">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <div className="p-1.5 bg-theme-primary/10 text-theme-primary rounded-xl shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-theme-main whitespace-nowrap">
                  تصفية المجموعات والأقسام:
                </span>
                {(selectedGroup !== 'all' || selectedCategory !== 'all' || minPrice || maxPrice || filterDiscountOnly) ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-lg bg-theme-primary/10 text-theme-primary text-[11px] font-bold border border-theme-primary/20 flex items-center gap-1">
                      <span>{selectedGroup !== 'all' ? selectedGroup : 'كافة المجموعات'}</span>
                      {selectedCategory !== 'all' && <span className="opacity-75">› {selectedCategory}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedGroup('all'); setSelectedCategory('all'); setMinPrice(''); setMaxPrice(''); setFilterDiscountOnly(false); }}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                      title="مسح التصفية"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-theme-subtext font-normal shrink-0 hidden sm:inline">
                    (تصفح حسب المجموعات، الفئات والأسعار)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsCategoryFilterVisible(true)}
                className="px-3.5 py-1.5 rounded-xl bg-theme-gradient hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-theme-primary transition-all shrink-0 cursor-pointer active:scale-95"
                title="إظهار أشرطة الفلترة والمجموعات"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>إظهار الفلترة</span>
              </button>
            </div>
          ) : (
            /* FULL EXPANDED FILTER PANEL WITH HIDE BUTTON */
            <div className="bg-theme-card/90 backdrop-blur-md border border-theme-card rounded-2xl p-3 sm:p-4 shadow-md space-y-3 transition-all animate-in fade-in">
              
              {/* ROW 1: GROUPS CAROUSEL WITH CIRCULAR AVATARS & LUXURY HEARTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-theme-primary/10 text-theme-primary rounded-xl shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-theme-main">
                      المجموعات والأقسام
                    </span>
                    {selectedGroup !== 'all' && (
                      <span className="text-[10px] font-bold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-lg border border-theme-primary/20">
                        {selectedGroup} {selectedCategory !== 'all' ? `› ${selectedCategory}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedGroup !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleCopyGroupLink(selectedGroup, selectedCategory !== 'all' ? selectedCategory : undefined)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-2xs ${
                          copiedGroupLink
                            ? 'bg-emerald-500 text-white border-transparent'
                            : 'bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border-theme-primary/30'
                        }`}
                        title="نسخ رابط هذه المجموعة"
                      >
                        {copiedGroupLink ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        <span>{copiedGroupLink ? 'تم النسخ!' : 'مشاركة'}</span>
                      </button>
                    )}

                    {(selectedGroup !== 'all' || selectedCategory !== 'all') && (
                      <button
                        type="button"
                        onClick={() => { setSelectedGroup('all'); setSelectedCategory('all'); }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إعادة ضبط</span>
                      </button>
                    )}

                    {/* HIDE FILTER BUTTON */}
                    <button
                      type="button"
                      onClick={() => setIsCategoryFilterVisible(false)}
                      className="px-2.5 py-1 rounded-xl bg-theme-inner hover:bg-theme-card text-theme-subtext hover:text-theme-main border border-theme-card text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="إخفاء لوحة الفلترة"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-theme-primary" />
                      <span>إخفاء</span>
                    </button>
                  </div>
                </div>

            {/* CIRCULAR AVATARS HORIZONTAL SCROLL LIST */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1.5 px-1">
              {/* "الكل" Circle Tab */}
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('all');
                  setSelectedCategory('all');
                }}
                className="flex flex-col items-center gap-1.5 group shrink-0 cursor-pointer"
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  selectedGroup === 'all'
                    ? 'bg-theme-gradient text-white ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg shadow-md scale-105'
                    : 'bg-theme-inner border border-theme-card/80 text-theme-subtext group-hover:scale-105'
                }`}>
                  <Sparkles className="w-5 h-5" />
                  <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-rose-200 dark:border-rose-900">
                    <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                  </div>
                </div>
                <span className={`text-[11px] font-bold ${
                  selectedGroup === 'all' ? 'text-theme-primary font-black' : 'text-theme-subtext'
                }`}>
                  الكل
                </span>
              </button>

              {/* Group Circular Avatars with luxury heart icon */}
              {availableGroups.map((grp, grpIdx) => {
                const isSelected = selectedGroup === grp.name;
                return (
                  <button
                    key={`grp-avatar-${grp.name}-${grpIdx}`}
                    type="button"
                    onClick={() => {
                      if (isSelected && selectedCategory === 'all') {
                        setSelectedGroup('all');
                      } else {
                        setSelectedGroup(grp.name);
                        setSelectedCategory('all');
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group shrink-0 cursor-pointer"
                  >
                    <div className={`relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-bg shadow-md scale-105'
                        : 'border border-theme-card/80 group-hover:scale-105'
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

                    <span className={`text-[11px] font-bold max-w-[70px] truncate text-center ${
                      isSelected ? 'text-theme-primary font-black' : 'text-theme-subtext'
                    }`}>
                      {grp.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROW 2: SUB-CATEGORIES STRIP (IF ACTIVE GROUP HAS SUB-CATEGORIES) */}
          {activeGroupCategories.length > 0 && (
            <div className="pt-2 border-t border-theme-card/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-extrabold text-theme-subtext shrink-0">
                الفئات الفرعية:
              </span>

              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedCategory === 'all'
                    ? 'bg-theme-primary/15 text-theme-primary border-theme-primary/40 font-black'
                    : 'bg-theme-inner border-theme-card/80 text-theme-subtext hover:text-theme-main'
                }`}
              >
                كافة الفئات
              </button>

              {activeGroupCategories.map((cat, cIdx) => {
                const isCatSelected = selectedCategory === cat.name;
                const catProdCount = products.filter(p => p.category === cat.name && p.isVisible !== false && p.status !== 'draft').length;

                return (
                  <button
                    key={`cat-strip-${cat.CategoryID || cat.name}-${cIdx}`}
                    type="button"
                    onClick={() => setSelectedCategory(isCatSelected ? 'all' : cat.name)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                      isCatSelected
                        ? 'bg-theme-gradient text-white border-transparent shadow-2xs font-black'
                        : 'bg-theme-inner border-theme-card/80 text-theme-subtext hover:text-theme-main'
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
                    <span className={`text-[8.5px] px-1 rounded-full font-mono ${
                      isCatSelected ? 'bg-white/20 text-white' : 'bg-theme-card text-theme-subtext'
                    }`}>
                      {catProdCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ROW 3: UNIFIED PRICE QUICK CHIPS & SORTING CONTROLS */}
          <div className="pt-2 border-t border-theme-card/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 flex-wrap">
            {/* Quick Price Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-extrabold text-theme-subtext shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                السعر:
              </span>
              {[
                { label: 'الكل', min: '', max: '' },
                { label: 'أقل من 100', min: '', max: '100' },
                { label: '100 - 500', min: '100', max: '500' },
                { label: '500 - 1000', min: '500', max: '1000' },
                { label: 'أكثر من 1000', min: '1000', max: '' },
              ].map((range, idx) => {
                const isSelected = minPrice === range.min && maxPrice === range.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMinPrice(range.min);
                      setMaxPrice(range.max);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'border-theme-primary bg-theme-primary/15 text-theme-primary font-black'
                        : 'border-theme-card bg-theme-inner text-theme-subtext hover:border-theme-primary/40 hover:text-theme-main'
                    }`}
                  >
                    <span>{range.label} {range.label !== 'الكل' && currency.symbol}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort & Discounts */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Filter Selector */}
              <div className="flex items-center gap-1 bg-theme-inner border border-theme-card px-2.5 py-1 rounded-xl text-xs">
                <Clock className="w-3 h-3 text-theme-primary" />
                <select
                  value={dateFilter || ""}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-theme-main font-bold outline-none cursor-pointer text-[11px]"
                >
                  <option value="all" className="bg-theme-card text-theme-main">🕒 حسب الوقت: الكل</option>
                  <option value="today" className="bg-theme-card text-theme-main">⚡ اليوم</option>
                  <option value="week" className="bg-theme-card text-theme-main">📅 هذا الأسبوع</option>
                  <option value="month" className="bg-theme-card text-theme-main">🗓️ هذا الشهر</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 bg-theme-inner border border-theme-card px-2.5 py-1 rounded-xl text-xs">
                <ArrowUpDown className="w-3 h-3 text-theme-primary" />
                <select
                  value={sortBy || ""}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-theme-main font-bold outline-none cursor-pointer text-[11px]"
                >
                  <option value="popular" className="bg-theme-card text-theme-main">🔥 الأكثر طلباً وشعبية</option>
                  <option value="newest" className="bg-theme-card text-theme-main">✨ الأحدث أولاً</option>
                  <option value="price-low" className="bg-theme-card text-theme-main">💵 السعر: الأقل للأعلى</option>
                  <option value="price-high" className="bg-theme-card text-theme-main">💎 السعر: الأعلى للأقل</option>
                  <option value="discount" className="bg-theme-card text-theme-main">🏷️ الأعلى خصماً</option>
                </select>
              </div>

              {/* Discount Filter Button */}
              <button
                type="button"
                onClick={() => setFilterDiscountOnly(!filterDiscountOnly)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                  filterDiscountOnly
                    ? 'bg-theme-gradient border-transparent text-white shadow-xs'
                    : 'bg-theme-inner border-theme-card text-theme-main hover:border-theme-primary/50'
                }`}
              >
                <Percent className="w-3 h-3 text-amber-500" />
                <span>الخصومات فقط</span>
              </button>
            </div>
          </div>
        </div>
      )
    )}

      {/* Main Product Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-theme-subtext">
          <span>
            عرض {displayedProducts.length} من أصل {filteredProducts.length} منتج
          </span>
          {(selectedCategory !== 'all' || filterDiscountOnly || minPrice || maxPrice || searchQuery) && (
            <button 
              onClick={() => { 
                setSelectedCategory('all'); 
                setFilterDiscountOnly(false); 
                setMinPrice(''); 
                setMaxPrice('');
              }} 
              className="text-theme-primary hover:underline font-bold cursor-pointer"
            >
              إلغاء كافة الفلاتر ✕
            </button>
          )}
        </div>

        {displayedProducts.length === 0 ? (
          <div className="text-center py-20 bg-theme-card border border-theme-card rounded-3xl space-y-4 max-w-lg mx-auto p-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-3xl font-black">
              📦
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-black text-theme-main">
                {products.length === 0 ? 'لا توجد بيانات أو منتجات متاحة حالياً' : 'لا توجد منتجات تطابق البحث والفلترة الحالية'}
              </p>
              <p className="text-xs text-theme-subtext font-medium leading-relaxed">
                {products.length === 0 
                  ? 'يرجى التأكد من إضافة الأصناف والمنتجات في جدول Google Sheets والتأكد من الاتصال بقاعدة البيانات.' 
                  : 'جرب تغيير كلمة البحث أو إلغاء تصفية الفئات والأسعار.'}
              </p>
            </div>
            {products.length === 0 ? (
              <button
                type="button"
                onClick={() => onRefreshStore && onRefreshStore()}
                className="px-5 py-2.5 bg-theme-gradient text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>🔄 إعادة التحديث والمزامنة مع أكسل</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { 
                  setSelectedCategory('all'); 
                  setFilterDiscountOnly(false); 
                  setMinPrice(''); 
                  setMaxPrice('');
                }}
                className="px-4 py-2 bg-theme-inner hover:bg-theme-card border border-theme-card text-theme-main text-xs font-bold rounded-xl cursor-pointer"
              >
                عرض كافة المنتجات
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {displayedProducts.map((product, idx) => (
                <ProductCard
                  key={`${product.ProductID || 'prd'}_${idx}`}
                  product={product}
                  currency={currency}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  onShareProduct={onShareProduct}
                  isWishlisted={wishlist.includes(product.ProductID)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>

            {/* Infinite Scroll Sentinel & Loading Indicator */}
            {hasMore ? (
              <div ref={observerTarget} className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2 text-theme-primary font-bold text-xs bg-theme-inner px-4 py-2 rounded-2xl border border-theme-card shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-theme-primary" />
                  <span>{isLoadingMore ? 'جاري تحميل المزيد من المنتجات...' : 'مرر للأسفل لتحميل المزيد تلقائياً...'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => Math.min(prev + 24, filteredProducts.length))}
                  className="px-4 py-2 bg-theme-inner hover:bg-theme-card border border-theme-card text-theme-main text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  تحميل المزيد ({filteredProducts.length - displayedProducts.length} منتج متبقي)
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="py-6 text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-theme-inner border border-theme-card text-theme-subtext text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>تم استعراض كافة المنتجات بالكامل ({filteredProducts.length} منتج)</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Comprehensive Store Details & Footer Info Section */}
      {!isStoreInfoVisible ? (
        <div className="mt-12 bg-theme-card border border-theme-card rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-theme-primary/10 border border-theme-primary/30 text-theme-primary rounded-2xl">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-theme-main">معلومات وعناوين وفروع المتجر (عن المتجر والشحن)</h3>
              <p className="text-[10px] text-theme-subtext">انقر لعرض الهوية وفروع الرياض وصنعاء والتوصيل والواتساب</p>
            </div>
          </div>
          <button
            onClick={() => setIsStoreInfoVisible(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-theme-gradient hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-theme-primary active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>إظهار تفاصيل المتجر</span>
          </button>
        </div>
      ) : (
        <div className="mt-16 bg-theme-card border border-theme-card rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl relative overflow-hidden animate-in fade-in backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-theme-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* Store Brand Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-theme-card pb-6">
            <div className="flex items-center gap-4 text-right">
              {settings?.storeLogoUrl && settings.storeLogoUrl.trim() ? (
                <img
                  src={settings.storeLogoUrl}
                  alt={settings.storeName || 'Store Logo'}
                  className="w-14 h-14 object-contain rounded-2xl bg-theme-inner p-2 border border-theme-card shadow-sm"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center text-theme-primary font-bold">
                  <Store className="w-7 h-7" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-black text-theme-main">{settings?.storeName || 'متجرنا الإلكتروني'}</h2>
                <p className="text-xs text-theme-subtext">{settings?.storeAddress || 'الرياض / صنعاء - المملكة العربية السعودية واليمن'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>متجر موثوق %100</span>
              </span>
              <button
                onClick={() => setIsStoreInfoVisible(false)}
                className="px-3.5 py-1.5 bg-theme-inner border border-theme-card hover:border-theme-primary/50 text-theme-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="إخفاء تفاصيل المتجر"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>إخفاء التفاصيل</span>
              </button>
            </div>
          </div>

        {/* 3 Columns Store Features & Branches Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          {/* Column 1: Store About */}
          <div className="bg-theme-inner border border-theme-card p-5 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-theme-primary font-bold text-sm border-b border-theme-card pb-2">
              <Info className="w-4 h-4 text-theme-primary" />
              <span>عن المتجر والهوية</span>
            </div>
            <p className="text-theme-main leading-relaxed">
              {settings?.footerAbout || `متجر ${settings?.storeName || 'المتجر'} - وجهتكم الأولى للتسوق الإلكتروني المعتمد والموثوق في السعودية واليمن.`}
            </p>
          </div>

          {/* Column 2: Store Branches */}
          <div className="bg-theme-inner border border-theme-card p-5 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-theme-secondary font-bold text-sm border-b border-theme-card pb-2">
              <MapPin className="w-4 h-4 text-theme-secondary" />
              <span>فروع وعناوين المتجر</span>
            </div>
            <p className="text-theme-main leading-relaxed font-sans">
              {settings?.storeBranches || '🇸🇦 فرع الرياض: حي العليا - طريق الملك فهد | 🇾🇪 فرع صنعاء: شارع حدة - مركز العاصمة | 🇾🇪 فرع عدن: كريتر'}
            </p>
          </div>

          {/* Column 3: Shipping & Delivery Info */}
          <div className="bg-theme-inner border border-theme-card p-5 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm border-b border-theme-card pb-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              <span>الشحن والتوصيل المباشر</span>
            </div>
            <p className="text-theme-main leading-relaxed">
              {settings?.deliveryInfo || '🚀 توصيل سريع ومباشر لكافة مدن المملكة العربية السعودية والجمهورية اليمنية خلال 24 - 48 ساعة. شحن مجاني للطلبات بقيمة 150 ر.س أو أكثر.'}
            </p>
          </div>

        </div>

        {/* Customer Support WhatsApp Quick Links */}
        <div className="bg-theme-inner p-4 rounded-2xl border border-theme-card flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-theme-main block">خدمة العملاء والدعم المباشر:</span>
              <span className="text-theme-subtext">تواصل معنا مباشرة عبر الواتساب للاستفسار أو الطلب السريع</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {settings?.storePhoneSaudi && (
              <a
                href={`https://wa.me/${settings.storePhoneSaudi.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>🇸🇦 واتساب السعودية ({settings.storePhoneSaudi})</span>
              </a>
            )}

            {settings?.storePhoneYemen && (
              <a
                href={`https://wa.me/${settings.storePhoneYemen.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>🇾🇪 واتساب اليمن ({settings.storePhoneYemen})</span>
              </a>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Mobile App Download Promotion Banner (Synced with Google Sheets) */}
      {settings?.showAppDownloadBanner !== false && (settings?.appDownloadAndroid || settings?.appDownloadiOS || settings?.appDownloadHuawei || settings?.appDownloadDesktop) && (
        <div className="mt-10 p-6 md:p-8 rounded-3xl bg-theme-card border border-theme-card shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-theme-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-theme-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-theme-gradient flex items-center justify-center text-white shadow-xl shadow-theme-primary shrink-0">
                <Smartphone className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-theme-primary/10 border border-theme-primary/20 text-theme-primary text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>تطبيق المتجر للجوال</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-theme-main">
                  {settings?.appDownloadTitle || `حمّل تطبيق ${settings?.storeName || 'المتجر'} الآن`}
                </h3>
                <p className="text-xs text-theme-subtext max-w-xl leading-relaxed">
                  {settings?.appDownloadDescription || 'تسوق أسرع واحصل على خصومات حصرية وإشعارات فورية بالعروض الجديدة مباشرة على هاتفك.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              {settings?.appDownloadAndroid && (
                <a
                  href={settings.appDownloadAndroid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-theme-inner text-emerald-500 border border-emerald-500/40 hover:border-emerald-500 hover:scale-105 transition-all shadow-sm flex items-center justify-center relative group"
                  title="Google Play / Android"
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="absolute bottom-full mb-1 px-2 py-0.5 bg-slate-900 text-white font-bold text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                    Google Play
                  </span>
                </a>
              )}

              {settings?.appDownloadiOS && (
                <a
                  href={settings.appDownloadiOS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-theme-inner text-sky-500 border border-sky-500/40 hover:border-sky-500 hover:scale-105 transition-all shadow-sm flex items-center justify-center relative group"
                  title="App Store / iPhone"
                >
                  <Apple className="w-5 h-5" />
                  <span className="absolute bottom-full mb-1 px-2 py-0.5 bg-slate-900 text-white font-bold text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                    App Store
                  </span>
                </a>
              )}

              {settings?.appDownloadHuawei && (
                <a
                  href={settings.appDownloadHuawei}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-theme-inner text-rose-500 border border-rose-500/40 hover:border-rose-500 hover:scale-105 transition-all shadow-sm flex items-center justify-center relative group"
                  title="Huawei AppGallery"
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="absolute bottom-full mb-1 px-2 py-0.5 bg-slate-900 text-white font-bold text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                    AppGallery
                  </span>
                </a>
              )}

              {settings?.appDownloadDesktop && (
                <a
                  href={settings.appDownloadDesktop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-theme-inner text-purple-500 border border-purple-500/40 hover:border-purple-500 hover:scale-105 transition-all shadow-sm flex items-center justify-center relative group"
                  title="Windows / Desktop"
                >
                  <Laptop className="w-5 h-5" />
                  <span className="absolute bottom-full mb-1 px-2 py-0.5 bg-slate-900 text-white font-bold text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                    Desktop
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saudi Trust & Official Business Verification Section */}
      <div className="mt-12 p-6 rounded-3xl bg-theme-card border border-theme-card shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-theme-card pb-5">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-theme-main text-sm sm:text-base">متجر سعودي معتمد وموثق رسمياً</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ZATCA & منصة الأعمال
                </span>
              </div>
              <p className="text-xs text-theme-subtext">مسجل في المركز السعودي للأعمال وموثق برقم سجل تجاري ورقم ضريبي معتمد</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {settings?.saudiBusinessVerificationUrl && (
              <a
                href={settings.saudiBusinessVerificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>التحقق في منصة الأعمال</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {onOpenPolicies && (
              <button
                onClick={() => onOpenPolicies('verification')}
                className="px-4 py-2 bg-theme-inner text-theme-main border border-theme-card hover:border-theme-primary/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-theme-primary" />
                <span>عرض وثائق وسجل المتجر</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-theme-inner rounded-2xl border border-theme-card space-y-1">
            <span className="text-theme-subtext block text-[10px]">رقم السجل التجاري:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm block">
              {settings?.commercialRegisterNumber || '7033543294'}
            </span>
            <span className="text-[10px] text-theme-subtext">سجل تجاري نشط ومعتمد</span>
          </div>

          <div className="p-3.5 bg-theme-inner rounded-2xl border border-theme-card space-y-1">
            <span className="text-theme-subtext block text-[10px]">الرقم الضريبي (ZATCA):</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm block">
              {settings?.taxNumber || '310123456700003'}
            </span>
            <span className="text-[10px] text-theme-subtext">ضريبة القيمة المضافة 15%</span>
          </div>

          <div className="p-3.5 bg-theme-inner rounded-2xl border border-theme-card space-y-1">
            <span className="text-theme-subtext block text-[10px]">الضمان الذهبي والاسترجاع:</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs block">
              استبدال واسترجاع خلال 7 أيام
            </span>
            <span className="text-[10px] text-theme-subtext">ضمان جودة وأصالة المنتج %100</span>
          </div>

          <div className="p-3.5 bg-theme-inner rounded-2xl border border-theme-card space-y-1">
            <span className="text-theme-subtext block text-[10px]">تتبع ومسار الشحنات:</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold text-xs block">
              أرامكس • سمسا • سبل • ريدبوكس
            </span>
            <span className="text-[10px] text-theme-subtext">توصيل لكافة مدن المملكة واليمن</span>
          </div>
        </div>

        {/* Policy Quick Links */}
        {onOpenPolicies && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-theme-card text-xs">
            <button onClick={() => onOpenPolicies('about')} className="text-theme-subtext hover:text-theme-primary transition-colors cursor-pointer px-2 py-1">من نحن</button>
            <span className="text-theme-subtext opacity-50">•</span>
            <button onClick={() => onOpenPolicies('warranty')} className="text-theme-subtext hover:text-theme-primary transition-colors cursor-pointer px-2 py-1">سياسة الضمان</button>
            <span className="text-theme-subtext opacity-50">•</span>
            <button onClick={() => onOpenPolicies('return')} className="text-theme-subtext hover:text-theme-primary transition-colors cursor-pointer px-2 py-1">الاستبدال والاسترجاع</button>
            <span className="text-theme-subtext opacity-50">•</span>
            <button onClick={() => onOpenPolicies('shipping')} className="text-theme-subtext hover:text-theme-primary transition-colors cursor-pointer px-2 py-1">الشحن والتوصيل</button>
            <span className="text-theme-subtext opacity-50">•</span>
            {onOpenTracking && (
              <button onClick={onOpenTracking} className="text-sky-500 hover:underline font-bold px-2 py-1 cursor-pointer">
                تتبع حالة الطلب 🚚
              </button>
            )}
          </div>
        )}
      </div>

      {/* Developer Footer Section */}
      <footer className="mt-12 pt-8 border-t border-theme-card text-center space-y-4 text-theme-subtext text-xs">
        <div className="inline-flex flex-col sm:flex-row items-center gap-2.5 px-5 py-3 bg-theme-card border border-theme-card rounded-2xl shadow-md max-w-xl mx-auto backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <p className="font-bold text-theme-main">
              إذا كنت تبحث عن تصميم وتطوير متجر إلكتروني احترافي:
            </p>
          </div>
          <span className="text-theme-primary font-extrabold text-sm bg-theme-primary/10 px-3 py-1 rounded-xl border border-theme-primary/20">
            المهندس محمدامين العمري
          </span>
        </div>

        <div>
          <a
            href="https://wa.me/966531093972?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%8A%D9%83%D9%85%20%D9%85%D9%87%D9%86%D8%AF%D8%B3%20%D9%85%D8%AD%D9%85%D8%AF%D8%A7%D9%85%D9%8A%D9%86%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%B0%D9%88%D9%8A%D8%B1%20%D9%85%D8%AA%D8%AC%D8%B1%20%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:opacity-80 font-mono font-bold transition-all bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30 text-xs shadow-sm"
          >
            <span>💬 تواصل واتساب مع المهندس: 966531093972+</span>
          </a>
        </div>
        <p className="text-[10px] text-theme-subtext">
          جميع الحقوق محفوظة © {settings?.storeName || 'المتجر'} {new Date().getFullYear()}{settings?.storeTagline ? ` - ${settings.storeTagline}` : ''}
        </p>
      </footer>

      {/* Minimal Red Arrow Scroll-To-Top Button with Tactile Tap Animation */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            whileHover={{ scale: 1.25, y: -2 }}
            whileTap={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="fixed bottom-20 sm:bottom-8 right-5 sm:right-7 z-50 p-1 cursor-pointer flex items-center justify-center text-rose-600 dark:text-rose-500 hover:text-rose-500 active:text-rose-700 transition-colors drop-shadow-[0_2px_10px_rgba(225,29,72,0.65)]"
            title="العودة لأعلى المتجر"
            aria-label="العودة لأعلى المتجر"
          >
            <ArrowUp className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
