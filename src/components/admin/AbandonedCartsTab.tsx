import React, { useState, useMemo } from 'react';
import { ShoppingCart, MessageCircle, Clock, AlertTriangle, CheckCircle2, Search, Trash2, ExternalLink, Send, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { AbandonedCart, AppSettings } from '../../types';
import { saveLocalAbandonedCarts } from '../../lib/offlineStorage';

interface AbandonedCartsTabProps {
  abandonedCarts: AbandonedCart[];
  setAbandonedCarts: React.Dispatch<React.SetStateAction<AbandonedCart[]>>;
  settings?: AppSettings;
}

export const AbandonedCartsTab: React.FC<AbandonedCartsTabProps> = ({
  abandonedCarts,
  setAbandonedCarts,
  settings
}) => {
  const [filter, setFilter] = useState<'all' | 'over24' | 'under24' | 'sent'>('over24');
  const [search, setSearch] = useState('');

  const now = Date.now();

  // Helper to calculate hours elapsed
  const getHoursElapsed = (createdAtStr: string): number => {
    const d = new Date(createdAtStr).getTime();
    if (isNaN(d)) return 0;
    return Math.floor((now - d) / (1000 * 60 * 60));
  };

  // Stats calculation
  const { over24Count, totalValueOver24, totalValueAll, sentCount } = useMemo(() => {
    let over24 = 0;
    let over24Val = 0;
    let totalVal = 0;
    let sentC = 0;

    abandonedCarts.forEach((cart) => {
      const hrs = getHoursElapsed(cart.createdAt);
      totalVal += cart.totalAmount || 0;
      if (cart.reminderSent) {
        sentC++;
      }
      if (hrs >= 24) {
        over24++;
        over24Val += cart.totalAmount || 0;
      }
    });

    return {
      over24Count: over24,
      totalValueOver24: over24Val,
      totalValueAll: totalVal,
      sentCount: sentC
    };
  }, [abandonedCarts, now]);

  // Filtered List
  const filtered = useMemo(() => {
    return abandonedCarts.filter((cart) => {
      const hrs = getHoursElapsed(cart.createdAt);

      // Search match
      const q = search.trim().toLowerCase();
      if (q) {
        const nameMatch = (cart.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (cart.phone || '').includes(q);
        const itemMatch = cart.items?.some((i) => (i.productName || '').toLowerCase().includes(q));
        if (!nameMatch && !phoneMatch && !itemMatch) return false;
      }

      if (filter === 'over24') return hrs >= 24 && !cart.reminderSent;
      if (filter === 'under24') return hrs < 24;
      if (filter === 'sent') return cart.reminderSent;
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [abandonedCarts, filter, search, now]);

  // Handle WhatsApp Reminder Action
  const sendWhatsAppReminder = (cart: AbandonedCart) => {
    const cleanPhone = (cart.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('05')) {
      formattedPhone = `966${cleanPhone.slice(1)}`;
    } else if (cleanPhone.startsWith('7')) {
      formattedPhone = `967${cleanPhone}`;
    }

    const storeTitle = settings?.storeName || 'متجرنا';
    const itemsCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 1;
    const itemsListStr = cart.items?.map((i) => `• ${i.productName} (الكمية: ${i.quantity})`).join('\n') || '';

    let msg = `مرحباً بك عزيزي/عزيزتي *${cart.customerName}* 👋🌸\n\nلاحظنا وجود منتجات أنيقة محفوطة في سلتك لدى *${storeTitle}* 🛍️✨\n\n*المنتجات في السلة:*\n${itemsListStr}\n\n*الإجمالي:* ${cart.totalAmount.toFixed(2)} ر.س\n\nنود تذكيرك بإكمال طلبك الآن للحصول على التوصيل السريع والعروض الحصرية المتاحة قبل نفاذ الكمية! 🎉\n\nللطلب أو الاستفسار المباشر، يسعدنا تواصلك معنا دائماً ❤️`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Mark as reminder sent
    setAbandonedCarts((prev) => {
      const updated = prev.map((item) =>
        item.id === cart.id
          ? { ...item, reminderSent: true, reminderSentAt: new Date().toISOString() }
          : item
      );
      saveLocalAbandonedCarts(updated);
      return updated;
    });
  };

  const handleDeleteCart = (id: string) => {
    setAbandonedCarts((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveLocalAbandonedCarts(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 p-5 md:p-6 rounded-3xl border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">إدارة السلات المتروكة وتنبيهات الواتساب (Abandoned Carts)</h2>
            </div>
            <p className="text-xs text-amber-200/80 max-w-2xl">
              نظام تتبع حث واسترجاع العملاء الذين أضافوا منتجات للسلة ولم يكملوا عملية الدفع بعد مرور 24 ساعة. أرسل رسائل تذكير مباشرة عبر الواتساب لمضاعفة المبيعات.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black animate-pulse flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{over24Count} سلات تجاوزت 24 ساعة</span>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
          <span className="text-[11px] font-bold text-slate-400 block">سلات تنتظر التنبيه (+24h)</span>
          <h3 className="text-2xl font-black text-rose-400">{over24Count} سلة</h3>
          <p className="text-[10px] text-slate-500 font-mono">قيمة: {totalValueOver24.toFixed(2)} ر.س</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي السلات المتروكة</span>
          <h3 className="text-2xl font-black text-white">{abandonedCarts.length} سلة</h3>
          <p className="text-[10px] text-slate-500 font-mono">قيمة: {totalValueAll.toFixed(2)} ر.س</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-slate-400 block">تنبيهات تم إرسالها بالواتساب</span>
          <h3 className="text-2xl font-black text-emerald-400">{sentCount} تنبيه</h3>
          <p className="text-[10px] text-emerald-500/80 font-bold">تم التواصل بنجاح ✨</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500" />
          <span className="text-[11px] font-bold text-slate-400 block">نسبة استرجاع السلات المتوقعة</span>
          <h3 className="text-2xl font-black text-indigo-400">28.5%</h3>
          <p className="text-[10px] text-indigo-300 font-bold">زيادة متوقعة في المبيعات</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setFilter('over24')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filter === 'over24'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>تجاوزت 24 ساعة ({over24Count})</span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>الجميع ({abandonedCarts.length})</span>
            </button>

            <button
              onClick={() => setFilter('sent')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filter === 'sent'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم التنبيه ({sentCount})</span>
            </button>

            <button
              onClick={() => setFilter('under24')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filter === 'under24'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>أقل من 24 ساعة</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الجوال أو المنتج..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pr-9 pl-3 py-2 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-right text-xs text-slate-300 whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-bold">العميل والجوال</th>
                <th className="p-3 font-bold">المنتجات في السلة</th>
                <th className="p-3 font-bold">الوقت المنقضي</th>
                <th className="p-3 font-bold">المبلغ الإجمالي</th>
                <th className="p-3 font-bold">حالة التنبيه</th>
                <th className="p-3 text-center font-bold">الإجراء وإرسال واتساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-bold text-slate-200 text-xs">لا توجد سلات متروكة تنطبق عليها الفلترة الحالية</p>
                      <p className="text-[11px] text-slate-500">ممتاز! جميع العملاء أكملوا طلباتهم أو تم تنبيههم بالفعل.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((cart) => {
                  const hrs = getHoursElapsed(cart.createdAt);
                  const isOver24 = hrs >= 24;

                  return (
                    <tr key={cart.id} className="hover:bg-slate-800/40 transition">
                      {/* Customer Info */}
                      <td className="p-3">
                        <p className="font-extrabold text-white text-xs">{cart.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{cart.phone}</p>
                        {cart.city && (
                          <span className="text-[9px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold inline-block mt-0.5">
                            {cart.city}
                          </span>
                        )}
                      </td>

                      {/* Items Summary with Thumbnails */}
                      <td className="p-3 max-w-xs">
                        <div className="space-y-1">
                          {cart.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                                alt={item.productName}
                                className="w-7 h-7 rounded-md object-cover border border-slate-800 shrink-0"
                              />
                              <div className="truncate min-w-0">
                                <p className="text-xs text-white font-bold truncate">{item.productName}</p>
                                <p className="text-[10px] text-slate-400">x{item.quantity} ({item.price} ر.س)</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Elapsed Time & Trigger Badge */}
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 ${
                            isOver24
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{isOver24 ? `🚨 مرت ${hrs} ساعة` : `⏳ منذ ${hrs} ساعات`}</span>
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            أنشئت: {new Date(cart.createdAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-3 font-extrabold text-emerald-400 font-mono text-sm">
                        {(cart.totalAmount || 0).toFixed(2)} ر.س
                      </td>

                      {/* Reminder Status */}
                      <td className="p-3">
                        {cart.reminderSent ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم التنبيه عبر الواتساب</span>
                            </span>
                            {cart.reminderSentAt && (
                              <p className="text-[9px] text-slate-500 font-mono">
                                {new Date(cart.reminderSentAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                            ❌ لم يُرسل بعد
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Trigger Button */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => sendWhatsAppReminder(cart)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                              cart.reminderSent
                                ? 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95'
                            }`}
                            title="إرسال رسالة تذكير مخصصة بالواتساب للعميل"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{cart.reminderSent ? 'إعادة التنبيه' : '📲 إرسال تنبيه واتساب'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCart(cart.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                            title="حذف من السلات المتروكة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
