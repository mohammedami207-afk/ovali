import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FolderPlus, 
  Package, 
  RefreshCw, 
  FileSpreadsheet, 
  Printer, 
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Category, Product, CategoryGroup, AppSettings } from '../../types';
import * as XLSX from 'xlsx';

interface CategoryManagementTabProps {
  categories: Category[];
  products: Product[];
  settings?: AppSettings;
  onAddCategory?: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onToggleCategoryVisibility?: (categoryId: string, isVisible: boolean) => void;
  onToggleGroupVisibility?: (groupName: string, isVisible: boolean) => void;
  isSyncing?: boolean;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  products,
  settings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryVisibility,
  onToggleGroupVisibility,
  isSyncing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formGroupName, setFormGroupName] = useState('');
  const [formNewGroupInput, setFormNewGroupInput] = useState('');
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsVisible, setFormIsVisible] = useState(true);

  // Derive unique groups from categories with counts and visibility
  const groupSummaries = useMemo(() => {
    const map = new Map<string, {
      name: string;
      categories: Category[];
      totalProducts: number;
      visibleCategoriesCount: number;
      hiddenCategoriesCount: number;
      image?: string;
    }>();

    categories.forEach(cat => {
      const gName = (cat.group && cat.group.trim()) ? cat.group.trim() : 'عام';
      const existing = map.get(gName) || {
        name: gName,
        categories: [],
        totalProducts: 0,
        visibleCategoriesCount: 0,
        hiddenCategoriesCount: 0,
        image: cat.image
      };

      existing.categories.push(cat);
      if (cat.isVisible !== false) {
        existing.visibleCategoriesCount += 1;
      } else {
        existing.hiddenCategoriesCount += 1;
      }

      // Count products
      const prodCount = products.filter(p => p.category === cat.name || (p.group && p.group === gName)).length;
      existing.totalProducts += prodCount;

      if (!existing.image && cat.image) {
        existing.image = cat.image;
      }

      map.set(gName, existing);
    });

    return Array.from(map.values());
  }, [categories, products]);

  // Unique group names list
  const uniqueGroupNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (c.group && c.group.trim()) set.add(c.group.trim());
      else set.add('عام');
    });
    if (set.size === 0) set.add('عام');
    return Array.from(set);
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter(c => {
      const gName = (c.group && c.group.trim()) ? c.group.trim() : 'عام';
      const matchesGroup = selectedGroupFilter === 'all' || gName === selectedGroupFilter;
      const isVis = c.isVisible !== false;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'visible' && isVis) || (statusFilter === 'hidden' && !isVis);
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) || 
        gName.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.CategoryID.toLowerCase().includes(q);

      return matchesGroup && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
      const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
      return orderA - orderB;
    });
  }, [categories, searchQuery, selectedGroupFilter, statusFilter]);

  // Calculate stats
  const totalCategoriesCount = categories.length;
  const visibleCategoriesCount = categories.filter(c => c.isVisible !== false).length;
  const hiddenCategoriesCount = categories.filter(c => c.isVisible === false).length;
  const totalGroupsCount = groupSummaries.length;

  const handleOpenAdd = (defaultGroup?: string) => {
    setEditingCategory(null);
    setFormGroupName(defaultGroup || uniqueGroupNames[0] || 'عام');
    setFormNewGroupInput('');
    setFormName('');
    setFormImage('');
    setFormDescription('');
    setFormIsVisible(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormGroupName(cat.group || 'عام');
    setFormNewGroupInput('');
    setFormName(cat.name);
    setFormImage(cat.image || '');
    setFormDescription(cat.description || '');
    setFormIsVisible(cat.isVisible !== false);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const finalGroup = (formNewGroupInput.trim() || formGroupName.trim() || 'عام');

    if (editingCategory) {
      const updated: Category = {
        ...editingCategory,
        name: formName.trim(),
        group: finalGroup,
        image: formImage.trim(),
        description: formDescription.trim(),
        isVisible: formIsVisible
      };
      if (onUpdateCategory) {
        onUpdateCategory(updated);
      }
    } else {
      const newCat: Category = {
        CategoryID: 'CAT_' + Date.now(),
        name: formName.trim(),
        group: finalGroup,
        image: formImage.trim() || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
        description: formDescription.trim(),
        isVisible: formIsVisible
      };
      if (onAddCategory) {
        onAddCategory(newCat);
      }
    }

    setIsFormOpen(false);
  };

  // Export categories to Excel
  const handleExportCategoriesExcel = () => {
    const rows = categories.map((cat, idx) => {
      const prodCount = products.filter(p => p.category === cat.name).length;
      return {
        'م': idx + 1,
        'معرف_القسم (ID)': cat.CategoryID,
        'المجموعه': cat.group || 'عام',
        'الحاله اما إخفاء او اظهار': cat.isVisible !== false ? '1 (مفعل بالمتجر)' : '0 (مخفي)',
        'اسم_القسم': cat.name,
        'عدد_الأصناف_المرتبطة': prodCount,
        'رابط_الصورة': cat.image || '',
        'الوصف': cat.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التصنيفات_والمجموعات');
    XLSX.writeFile(wb, `Categories_Groups_${settings?.storeName || 'Store'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in" id="category-management-tab">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/40 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/30 rounded-2xl text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                  <span>إدارة هيكلية المجموعات والأقسام</span>
                  {isSyncing && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      جاري المزامنة مع الأكسل...
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  تحكم كامل في ظهور المجموعات والأقسام في المتجر مع حفظ ومزامنة فورية مع Google Sheets
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportCategoriesExcel}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="تصدير جدول المجموعات والأقسام إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم جديد</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">المجموعات (بدون تكرار)</span>
              <span className="text-base font-black text-white">{totalGroupsCount} مجموعة</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">إجمالي الأقسام</span>
              <span className="text-base font-black text-white">{totalCategoriesCount} قسم</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">مفعل وظاهر بالمتجر (1)</span>
              <span className="text-base font-black text-emerald-400">{visibleCategoriesCount} قسم</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">مخفي من المتجر (0)</span>
              <span className="text-base font-black text-rose-400">{hiddenCategoriesCount} قسم</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Distinct Groups Showcase & Master Toggles (جدول المجموعات بدون تكرار) */}
      <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-theme-card">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-theme-main">
              جدول المجموعات الرئيسية ({groupSummaries.length} مجموعة)
            </h3>
          </div>
          <span className="text-xs text-theme-subtext">
            التحكم الشامل في ظهور المجموعة بأكملها مع كافة أقسامها ومنتجاتها في المتجر
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {groupSummaries.map((grp) => {
            const isGroupFullyVisible = grp.hiddenCategoriesCount === 0;
            const isGroupPartiallyVisible = grp.visibleCategoriesCount > 0 && grp.hiddenCategoriesCount > 0;
            const isGroupHidden = grp.visibleCategoriesCount === 0;
            const isSelected = selectedGroupFilter === grp.name;

            return (
              <div 
                key={grp.name}
                className={`p-4 rounded-2xl border transition-all relative ${
                  isSelected 
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
                    : 'bg-theme-inner border-theme-card hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {grp.image ? (
                      <img 
                        src={grp.image} 
                        alt={grp.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-theme-card shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-500/30 shrink-0">
                        {grp.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-theme-main truncate">{grp.name}</h4>
                      <p className="text-[11px] text-theme-subtext">
                        {grp.categories.length} أقسام • {grp.totalProducts} منتج
                      </p>
                    </div>
                  </div>

                  {/* Group Master Visibility Toggle Switch */}
                  {onToggleGroupVisibility && (
                    <button
                      type="button"
                      onClick={() => onToggleGroupVisibility(grp.name, isGroupHidden)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 border ${
                        !isGroupHidden
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                      title={!isGroupHidden ? 'المجموعة ظاهرة بالمتجر (انقر لإخفاء المجموعة)' : 'المجموعة مخفية بالكامل (انقر لتفعيل الظهور)'}
                    >
                      {!isGroupHidden ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>ظاهرة (1)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-rose-400" />
                          <span>مخفية (0)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-theme-card flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupFilter(isSelected ? 'all' : grp.name)}
                    className={`font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                      isSelected ? 'text-indigo-400' : 'text-theme-subtext hover:text-theme-main'
                    }`}
                  >
                    <span>{isSelected ? 'إلغاء فلترة المجموعة' : 'عرض أقسام المجموعة في الجدول'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAdd(grp.name)}
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    title={`إضافة قسم جديد إلى "${grp.name}"`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Detailed Categories Table & Search Toolbar */}
      <div className="bg-theme-card border border-theme-card rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-theme-card">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-theme-main">
                جدول الأقسام والتصنيفات التفصيلي ({filteredCategories.length} قسم)
              </h3>
              <p className="text-[11px] text-theme-subtext">
                تحكم بحالة الظهور (1 = إظهار بالمتجر، 0 = إخفاء) لكل قسم على حدة
              </p>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-theme-subtext absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم القسم أو المجموعة..."
                className="w-full bg-theme-inner border border-theme-card rounded-xl pr-8 pl-3 py-2 text-xs text-theme-main focus:outline-none focus:border-indigo-500 font-bold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-subtext hover:text-theme-main"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Group Filter Dropdown */}
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="all">كافة المجموعات ({uniqueGroupNames.length})</option>
              {uniqueGroupNames.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="all">كافة الحالات</option>
              <option value="visible">الظاهرة فقط (1)</option>
              <option value="hidden">المخفية فقط (0)</option>
            </select>
          </div>
        </div>

        {/* Categories Table View */}
        <div className="overflow-x-auto rounded-2xl border border-theme-card">
          <table className="w-full text-right text-xs">
            <thead className="bg-theme-inner text-theme-subtext border-b border-theme-card font-bold">
              <tr>
                <th className="p-3 w-20">الترتيب</th>
                <th className="p-3">الصورة</th>
                <th className="p-3">اسم القسم</th>
                <th className="p-3">المجموعة التابع لها</th>
                <th className="p-3">الأصناف المرتبطة</th>
                <th className="p-3 text-center">حالة الظهور بالمتجر</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-card text-theme-main font-semibold">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-theme-subtext">
                    لا توجد أقسام تطابق الفلترة المحددة
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const prodCount = products.filter(p => p.category === cat.name).length;
                  const isVisible = cat.isVisible !== false;

                  return (
                    <tr key={cat.CategoryID} className="hover:bg-theme-inner/60 transition-colors">
                      <td className="p-3">
                        <input
                          type="number"
                          className="w-14 bg-theme-inner border border-theme-card rounded text-center px-1 py-1 text-xs text-theme-main focus:outline-none focus:border-indigo-500"
                          value={cat.sortOrder ?? idx + 1}
                          onChange={(e) => {
                            if (onUpdateCategory) {
                              onUpdateCategory({ ...cat, sortOrder: parseInt(e.target.value) || 0 });
                            }
                          }}
                        />
                      </td>
                      
                      <td className="p-3">
                        {cat.image && cat.image.trim() ? (
                          <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-theme-card"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-theme-inner flex items-center justify-center text-indigo-400 font-bold border border-theme-card">
                            {cat.name.slice(0, 1)}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-theme-main text-xs">{cat.name}</div>
                        <div className="text-[10px] text-theme-subtext font-mono">{cat.CategoryID}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[11px]">
                          {cat.group || 'عام'}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-theme-main">{prodCount}</span>
                        <span className="text-theme-subtext text-[10px] mr-1">صنف</span>
                      </td>

                      <td className="p-3 text-center">
                        {onToggleCategoryVisibility ? (
                          <button
                            type="button"
                            onClick={() => onToggleCategoryVisibility(cat.CategoryID, !isVisible)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                              isVisible
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                            }`}
                            title={isVisible ? 'القسم ظاهر بالمتجر - انقر للإخفاء (0)' : 'القسم مخفي من المتجر - انقر للإظهار (1)'}
                          >
                            {isVisible ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>مفعل بالمتجر (1)</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>مخفي (0)</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isVisible ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isVisible ? 'ظاهر (1)' : 'مخفي (0)'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات القسم"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteCategory && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من رغبتك في حذف القسم "${cat.name}"؟`)) {
                                  onDeleteCategory(cat.CategoryID);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="حذف القسم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  {editingCategory ? `تعديل القسم: ${editingCategory.name}` : 'إضافة قسم ومنتجات جديد'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              {/* Group Selector / Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">المجموعة الرئيسية (Group):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formGroupName}
                    onChange={(e) => setFormGroupName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {uniqueGroupNames.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={formNewGroupInput}
                    onChange={(e) => setFormNewGroupInput(e.target.value)}
                    placeholder="أو اكتب اسم مجموعة جديدة..."
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">اسم القسم (Category Name):</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: فساتين سهرة، عبايات، حقائب جلدية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Image URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">رابط صورة القسم (Image URL):</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                {formImage && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <img 
                      src={formImage} 
                      alt="معاينة" 
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'; }}
                    />
                    <span className="text-[11px] text-emerald-400 font-bold">معاينة صورة القسم</span>
                  </div>
                )}
              </div>

              {/* Category Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">الوصف (اختياري):</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للقسم يظهر للعملاء..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Visibility Switch */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">حالة الظهور بالمتجر:</span>
                  <span className="text-[11px] text-slate-400">
                    {formIsVisible ? 'مفعل ويظهر لكافة العملاء بالمتجر (1)' : 'مخفي من المتجر ولن يظهر للعملاء (0)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsVisible(!formIsVisible)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    formIsVisible 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {formIsVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{formIsVisible ? 'ظاهر (1)' : 'مخفي (0)'}</span>
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
