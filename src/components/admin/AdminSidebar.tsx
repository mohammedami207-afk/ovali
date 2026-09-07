import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileSpreadsheet, 
  ShoppingBasket, 
  Receipt, 
  Users, 
  Boxes, 
  Truck, 
  UserCheck, 
  Flame, 
  Ticket, 
  Gift,
  Database, 
  Settings,
  History,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { AdminTab } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingSyncCount: number;
  currentRole?: string;
  counts?: {
    products?: number;
    orders?: number;
    invoices?: number;
    customers?: number;
    suppliers?: number;
    employees?: number;
    offers?: number;
    coupons?: number;
    affiliates?: number;
    auditLogs?: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingSyncCount,
  currentRole = 'SuperAdmin',
  counts
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollMobileMenu = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'right' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const allMenuItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'لوحة التحكم والتحليلات', icon: LayoutDashboard },
    { id: 'products', label: 'إدارة المنتجات والتصنيفات', icon: ShoppingBag, badge: counts?.products, badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { id: 'excel', label: 'استيراد وتصدير إكسل', icon: FileSpreadsheet },
    { id: 'orders', label: 'إدارة الطلبات والشحن', icon: ShoppingBasket, badge: counts?.orders, badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'invoices', label: 'الفواتير المبسطة ZATCA', icon: Receipt, badge: counts?.invoices, badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'customers', label: 'العملاء ونقاط الولاء', icon: Users, badge: counts?.customers, badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { id: 'suppliers', label: 'الموردون والحسابات', icon: Truck, badge: counts?.suppliers, badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'employees', label: 'الموظفون والصلاحيات', icon: UserCheck, badge: counts?.employees, badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    { id: 'affiliates', label: 'المسوقين ونظام كويتا', icon: Gift, badge: counts?.affiliates, badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    { id: 'offers', label: 'العروض والتخفيضات', icon: Flame, badge: counts?.offers, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { id: 'coupons', label: 'كوبونات الخصم', icon: Ticket, badge: counts?.coupons, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'settings', label: 'إعدادات المتجر العامة', icon: Settings },
    { id: 'sheets-sync', label: 'قاعدة بيانات Supabase', icon: Database, badge: pendingSyncCount, badgeColor: 'bg-amber-500 text-slate-950 font-black' },
    { id: 'audit-log', label: 'سجل العمليات والنظام', icon: History, badge: counts?.auditLogs, badgeColor: 'bg-slate-700 text-slate-300 border-slate-600' }
  ];

  // Filter tabs based on role permissions
  const menuItems = allMenuItems.filter(item => {
    if (currentRole === 'Supplier') {
      return item.id === 'products';
    }
    if (currentRole === 'Manager') {
      return item.id !== 'settings' && item.id !== 'sheets-sync' && item.id !== 'employees' && item.id !== 'audit-log';
    }
    return true; // SuperAdmin / Admin sees everything
  });

  return (
    <>
      {/* Mobile Horizontal Navigation Bar (shows on screens smaller than lg) */}
      <div className="lg:hidden bg-theme-card border-b border-theme-card p-2 shrink-0 z-20 shadow-md relative">
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => scrollMobileMenu('right')} 
            className="p-1.5 bg-theme-inner hover:bg-theme-primary/20 text-theme-main rounded-lg shrink-0 border border-theme-card shadow-xs transition-all cursor-pointer"
            title="تمرير لليمين"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-0.5 scroll-smooth touch-pan-x"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-theme-gradient text-white border-transparent shadow-md shadow-theme-primary/30'
                      : 'bg-theme-inner border-theme-card text-theme-subtext hover:text-theme-main hover:border-theme-primary/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${item.badgeColor || 'bg-theme-card text-theme-subtext'}`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <button 
            type="button"
            onClick={() => scrollMobileMenu('left')} 
            className="p-1.5 bg-theme-inner hover:bg-theme-primary/20 text-theme-main rounded-lg shrink-0 border border-theme-card shadow-xs transition-all cursor-pointer"
            title="تمرير لليسار"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Vertical Sidebar (shows on lg screens and up) - Fixed & Scrollable */}
      <aside className="hidden lg:flex w-64 bg-theme-card border-l border-theme-card flex-col justify-between p-3.5 shrink-0 h-full overflow-y-auto text-theme-subtext scrollbar-thin">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-theme-subtext uppercase tracking-widest px-3 py-1.5 opacity-70">
            قوائم النظام الرئيسية
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-white shadow-lg shadow-theme-primary/25'
                      : 'text-theme-subtext hover:text-theme-main hover:bg-theme-inner/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-theme-gradient rounded-xl -z-10 shadow-lg shadow-theme-primary/30"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 z-10">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] z-10 border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : (item.badgeColor || 'bg-theme-inner text-theme-subtext border-theme-card')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 p-3 bg-theme-inner rounded-2xl border border-theme-card text-[11px] text-theme-subtext space-y-1 shrink-0">
          <p className="font-bold text-theme-main">النسخة الاحترافية 2026</p>
          <p>مزامنة أوفلاين وسحابية أوتوماتيكية مع Supabase DB.</p>
        </div>
      </aside>
    </>
  );
};
