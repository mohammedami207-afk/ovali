import React, { useState } from 'react';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Printer, 
  MessageCircle, 
  X, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Order, AppSettings, CurrencyRate } from '../../types';
import { getTrackingUrl } from '../../lib/dateUtils';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  settings?: AppSettings;
  currency?: CurrencyRate;
  initialOrderNumber?: string;
  onUpdateOrderStatus?: (orderId: string, status: Order['orderStatus']) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  settings,
  currency,
  initialOrderNumber = '',
  onUpdateOrderStatus
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const [savedOrders, setSavedOrders] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState(initialOrderNumber);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (initialOrderNumber) {
      return orders.find(o => 
        o.orderNumber.toLowerCase().includes(initialOrderNumber.toLowerCase()) || 
        o.OrderID.toLowerCase().includes(initialOrderNumber.toLowerCase())
      ) || null;
    }
    return null;
  });
  const [hasSearched, setHasSearched] = useState(Boolean(initialOrderNumber));

  // Sync state and load saved orders from localStorage when modal opens or initialOrderNumber changes
  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
        setSavedOrders(saved);
      } catch (e) {}

      if (initialOrderNumber) {
        setSearchQuery(initialOrderNumber);
        const found = orders.find(o => 
          o.orderNumber.toLowerCase().includes(initialOrderNumber.toLowerCase()) || 
          o.OrderID.toLowerCase().includes(initialOrderNumber.toLowerCase())
        );
        if (found) {
          setSelectedOrder(found);
          setHasSearched(true);
        }
      }
    }
  }, [isOpen, initialOrderNumber, orders]);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (!q) {
      setSelectedOrder(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const found = orders.filter(o => {
      const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '');
      const cleanOrderNum = (o.orderNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanId = (o.OrderID || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanTracking = (o.trackingNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

      return cleanPhone.includes(q) || 
             cleanOrderNum.includes(q) || 
             cleanId.includes(q) || 
             cleanTracking.includes(q);
    });

    if (found.length > 0) {
      setSelectedOrder(found[0]);
      // Save matched order to localStorage so user can easily track it later
      try {
        const saved = JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
        const target = found[0];
        const newEntry = {
          orderNumber: target.orderNumber,
          id: target.OrderID,
          date: target.date,
          total: target.totalAmount,
          customerName: target.customerName,
          phone: target.phone,
          orderType: target.orderType,
          city: target.city
        };
        const filtered = saved.filter((item: any) => item.orderNumber !== target.orderNumber);
        const updated = [newEntry, ...filtered].slice(0, 20);
        localStorage.setItem('my_customer_orders', JSON.stringify(updated));
        setSavedOrders(updated);
      } catch (e) {}
    } else {
      setSelectedOrder(null);
    }
  };

  const handleConfirmOrderReceived = (targetOrder: Order) => {
    if (!window.confirm(`هل تؤكد استلام الطلب رقم #${targetOrder.orderNumber} بالفعل؟`)) return;

    // 1. Update in system & admin state (synced to Excel)
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(targetOrder.OrderID, 'delivered');
    }

    // 2. Update local selectedOrder if viewed
    if (selectedOrder && (selectedOrder.OrderID === targetOrder.OrderID || selectedOrder.orderNumber === targetOrder.orderNumber)) {
      setSelectedOrder({ ...selectedOrder, orderStatus: 'delivered' });
    }

    // 3. Mark in localStorage so it disappears from active list on customer device
    try {
      const saved = JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
      const updated = saved.map((item: any) => {
        if (
          (item.orderNumber && item.orderNumber.toLowerCase() === targetOrder.orderNumber.toLowerCase()) ||
          (item.id && item.id.toLowerCase() === targetOrder.OrderID.toLowerCase())
        ) {
          return { ...item, status: 'delivered', received: true, hidden: true };
        }
        return item;
      });
      localStorage.setItem('my_customer_orders', JSON.stringify(updated));
      setSavedOrders(updated);
    } catch (e) {
      console.error('Error updating saved orders:', e);
    }

    alert(`🎉 تم تأكيد استلام الطلب رقم #${targetOrder.orderNumber} بنجاح!\n\nتم تحديث حالة الطلب في نظام المتجر والإكسل لـ (تم التوصيل/الاستلام)، وإخفاؤه من طلباتك النشطة.`);
  };

  const handleRemoveSavedOrder = (orderNumOrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
      const updated = saved.filter((item: any) => 
        item.orderNumber?.toLowerCase() !== orderNumOrId.toLowerCase() &&
        item.id?.toLowerCase() !== orderNumOrId.toLowerCase()
      );
      localStorage.setItem('my_customer_orders', JSON.stringify(updated));
      setSavedOrders(updated);
    } catch (err) {}
  };

  const getMatchedOrders = () => {
    const q = searchQuery.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (!q) return [];
    return orders.filter(o => {
      const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '');
      const cleanOrderNum = (o.orderNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanId = (o.OrderID || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const cleanTracking = (o.trackingNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

      return cleanPhone.includes(q) || 
             cleanOrderNum.includes(q) || 
             cleanId.includes(q) || 
             cleanTracking.includes(q);
    });
  };

  const matchedList = hasSearched ? getMatchedOrders() : [];

  const getStatusStepIndex = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const printOrderReceipt = () => {
    window.print();
  };

  const openWhatsAppInquiry = (order: Order) => {
    const phone = settings?.storeWhatsApp || settings?.storePhoneSaudi || settings?.storePhone || '966599539659';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`مرحباً ${settings?.storeName || 'المتجر'}، أود الاستفسار عن حالة طلبي رقم #${order.orderNumber} باسم ${order.customerName}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Print Styles for Order Receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-customer-receipt, #printable-customer-receipt * {
            visibility: visible !important;
          }
          #printable-customer-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 480px !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            font-family: monospace, sans-serif !important;
          }
          .no-print-area {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-theme-card border border-theme-card rounded-3xl w-full max-w-2xl text-theme-main shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-theme-card flex items-center justify-between sticky top-0 bg-theme-card/95 backdrop-blur-md z-10 no-print-area">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-theme-gradient flex items-center justify-center text-white shadow-theme-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <span>تتبع حالة طلبك وشحنتك</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">مباشر</span>
              </h2>
              <p className="text-xs text-theme-subtext">أدخل رقم الطلب أو رقم الجوال لمتابعة المسار خطوة بخطوة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-theme-subtext hover:text-theme-main rounded-xl hover:bg-theme-inner transition-colors cursor-pointer border border-theme-card"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-theme-card bg-theme-inner no-print-area">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-theme-subtext absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="أدخل رقم الطلب (مثال: ORD-1001) أو رقم الجوال..."
                className="w-full bg-theme-card border border-theme-card rounded-2xl text-xs text-theme-main placeholder-theme-subtext focus:outline-none focus:border-theme-primary pr-10 pl-4 py-3 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-theme-gradient hover:opacity-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-theme-primary transition-all shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>بحث عن الطلب</span>
            </button>
          </form>

          {/* If multiple orders matched for the same phone */}
          {matchedList.length > 1 && (
            <div className="mt-3 pt-3 border-t border-theme-card">
              <p className="text-xs font-bold text-theme-main mb-2">الطلبات المرتبطة ببحثك ({matchedList.length} طلبات):</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {matchedList.map((ord) => (
                  <button
                    key={ord.OrderID}
                    onClick={() => setSelectedOrder(ord)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                      selectedOrder?.OrderID === ord.OrderID
                        ? 'bg-theme-gradient text-white border-transparent shadow'
                        : 'bg-theme-card text-theme-main border-theme-card hover:border-theme-primary'
                    }`}
                  >
                    <span>#{ord.orderNumber}</span>
                    <span className="text-[10px] opacity-75">({ord.date})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="bg-theme-inner border border-theme-card rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-card pb-3">
                  <div>
                    <div className="text-[11px] text-theme-subtext">رقم الطلب</div>
                    <div className="font-mono text-base font-extrabold text-theme-primary">#{selectedOrder.orderNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-theme-subtext">تاريخ الطلب</div>
                    <div className="font-mono text-xs text-theme-main flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-theme-subtext" />
                      <span>{selectedOrder.date}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedOrder.orderStatus === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : selectedOrder.orderStatus === 'shipped'
                        ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30 animate-pulse'
                        : selectedOrder.orderStatus === 'processing'
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : selectedOrder.orderStatus === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                    }`}>
                      {selectedOrder.orderStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      {selectedOrder.orderStatus === 'processing' && <Package className="w-3.5 h-3.5" />}
                      {selectedOrder.orderStatus === 'shipped' && <Truck className="w-3.5 h-3.5" />}
                      {selectedOrder.orderStatus === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {selectedOrder.orderStatus === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                      
                      <span>
                        {selectedOrder.orderStatus === 'pending' && 'قيد الانتظار والمراجعة'}
                        {selectedOrder.orderStatus === 'processing' && 'جاري التجهيز والتغليف'}
                        {selectedOrder.orderStatus === 'shipped' && 'تم الشحن وهو في الطريق إليك'}
                        {selectedOrder.orderStatus === 'delivered' && 'تم التوصيل بنجاح'}
                        {selectedOrder.orderStatus === 'cancelled' && 'الطلب ملغي'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                {selectedOrder.orderStatus !== 'cancelled' ? (
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-2 relative">
                      {/* Line connector */}
                      <div className="absolute top-4 left-6 right-6 h-1 bg-theme-card -z-0">
                        <div 
                          className="h-full bg-theme-gradient transition-all duration-500"
                          style={{
                            width: `${(getStatusStepIndex(selectedOrder.orderStatus) / 3) * 100}%`
                          }}
                        ></div>
                      </div>

                      {/* Steps */}
                      {[
                        { title: 'استلام الطلب', icon: Clock, desc: 'تم الاستلام بنجاح' },
                        { title: 'التجهيز والتغليف', icon: Package, desc: 'إعداد المنتجات' },
                        { title: 'الشحن المباشر', icon: Truck, desc: 'مع مندوب التوصيل' },
                        { title: 'تم الاستلام', icon: CheckCircle2, desc: 'اكتمل التوصيل' }
                      ].map((step, idx) => {
                        const isDone = idx <= getStatusStepIndex(selectedOrder.orderStatus);
                        const isCurrent = idx === getStatusStepIndex(selectedOrder.orderStatus);
                        const StepIcon = step.icon;

                        return (
                          <div key={idx} className="flex flex-col items-center text-center space-y-1.5 z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-theme-gradient text-white shadow-md shadow-theme-primary/30 ring-2 ring-theme-card'
                                : 'bg-theme-card text-theme-subtext'
                            } ${isCurrent ? 'scale-110 ring-4 ring-theme-primary/30 animate-pulse' : ''}`}>
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-[11px] font-bold ${isDone ? 'text-theme-main' : 'text-theme-subtext'}`}>
                              {step.title}
                            </span>
                            <span className="text-[9px] text-theme-subtext hidden sm:block">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>تم إلغاء هذا الطلب. إذا كان لديك أي استفسار يرجى التواصل مع خدمة العملاء.</span>
                  </div>
                )}
              </div>

              {/* Shipping & Live Tracking Info */}
              {selectedOrder.trackingNumber ? (
                <div className="bg-theme-inner border border-theme-primary/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-theme-primary font-bold text-xs">
                      <Truck className="w-4 h-4" />
                      <span>بيانات تتبع الشحنة مع الناقل</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                      شحنة نشطة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-theme-card rounded-xl border border-theme-card">
                      <span className="text-theme-subtext block text-[10px]">شركة الشحن المعتمدة:</span>
                      <span className="text-theme-main font-bold">{selectedOrder.shippingCompany || 'البريد السريع'}</span>
                    </div>
                    <div className="p-3 bg-theme-card rounded-xl border border-theme-card">
                      <span className="text-theme-subtext block text-[10px]">رقم بوليصة / تتبع الشحنة:</span>
                      <span className="text-theme-primary font-mono font-bold">{selectedOrder.trackingNumber}</span>
                    </div>
                  </div>

                  <a
                    href={getTrackingUrl(selectedOrder.shippingCompany, selectedOrder.trackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-theme-gradient hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-theme-primary transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>تتبع الشحنة المباشر في موقع شركة الشحن</span>
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-theme-inner border border-theme-card rounded-2xl text-xs text-theme-subtext flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-theme-card text-theme-subtext">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-theme-main block">رقم التتبع قيد التوليد:</span>
                    <span>سيتم تزويدك برقم بوليصة الشحن ورابط التتبع فور تسليم الشحنة لشركة النقل.</span>
                  </div>
                </div>
              )}

              {/* Order Products List */}
              <div className="bg-theme-inner border border-theme-card rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold text-theme-main border-b border-theme-card pb-2 flex items-center justify-between">
                  <span>المنتجات المطلوبة ({selectedOrder.items?.length || 0})</span>
                  <span className="text-theme-subtext text-[11px]">طريقة الدفع: {selectedOrder.paymentMethod}</span>
                </h4>

                <div className="divide-y divide-theme-card">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-11 h-11 object-cover rounded-xl border border-theme-card bg-theme-card" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-theme-card flex items-center justify-center text-theme-subtext">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-theme-main line-clamp-1">{item.productName}</p>
                            <p className="text-[10px] text-theme-subtext">
                              الكمية: <span className="font-mono text-theme-main">{item.quantity}</span>
                              {item.size ? ` | المقاس: ${item.size}` : ''}
                              {item.color ? ` | اللون: ${item.color}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-left font-mono text-xs font-bold text-theme-primary">
                          {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} ر.س
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-xs text-theme-subtext">تفاصيل المنتجات المسجلة في الطلب</div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t border-theme-card space-y-1.5 text-xs">
                  {selectedOrder.discount && selectedOrder.discount > 0 ? (
                    <div className="flex justify-between text-rose-500">
                      <span>الخصم المطبق:</span>
                      <span className="font-mono">-{Number(selectedOrder.discount).toFixed(2)} ر.س</span>
                    </div>
                  ) : null}
                  {selectedOrder.shippingFee && selectedOrder.shippingFee > 0 ? (
                    <div className="flex justify-between text-theme-subtext">
                      <span>رسوم الشحن والتوصيل:</span>
                      <span className="font-mono">+{Number(selectedOrder.shippingFee).toFixed(2)} ر.س</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center text-sm font-black text-theme-main pt-2 border-t border-theme-card bg-theme-card p-2 rounded-xl">
                    <span>المبلغ الإجمالي الشامل:</span>
                    <span className="font-mono text-theme-primary text-base font-extrabold">{Number(selectedOrder.totalAmount || 0).toFixed(2)} ر.س</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Customer Data */}
              <div className="bg-theme-inner border border-theme-card rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-theme-main font-bold border-b border-theme-card pb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                  <span>عنوان التوصيل المسجل</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-theme-subtext">
                  <p><span className="text-theme-main font-bold">المستلم:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-theme-main font-bold">الهاتف:</span> <span className="font-mono">{selectedOrder.phone}</span></p>
                  <p><span className="text-theme-main font-bold">نوع الطلب والتوصيل:</span> <span className="font-bold text-theme-primary">{selectedOrder.orderType === 'local' ? '🏠 طلب محلي (توصيل/استلام محلي)' : `🚚 شحن لجميع المناطق (${selectedOrder.city || 'غير محدد'})`}</span></p>
                  <p><span className="text-theme-main font-bold">المدينة والعنوان:</span> {selectedOrder.city || 'غير محدد'} - {selectedOrder.address || 'حسب التنسيق'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 no-print-area">
                {selectedOrder.orderStatus !== 'delivered' && selectedOrder.orderStatus !== 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmOrderReceived(selectedOrder)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer border border-emerald-400/30 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✅ تم الاستلام (تأكيد وصول واستلام الطلب)</span>
                  </button>
                ) : selectedOrder.orderStatus === 'delivered' ? (
                  <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>تم تأكيد استلام هذا الطلب وتوثيقه بنجاح ✅</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={printOrderReceipt}
                    className="flex-1 py-3 bg-theme-inner hover:bg-theme-card text-theme-main font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-theme-card transition-all cursor-pointer shadow"
                  >
                    <Printer className="w-4 h-4 text-theme-primary" />
                    <span>طباعة إيصال الطلب المختصر</span>
                  </button>

                  <button
                    onClick={() => openWhatsAppInquiry(selectedOrder)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>استفسار عبر واتساب المتجر</span>
                  </button>
                </div>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-theme-inner border border-theme-card flex items-center justify-center mx-auto text-theme-subtext">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-theme-main">لم يتم العثور على أي طلب برقم "{searchQuery}"</h3>
                <p className="text-xs text-theme-subtext max-w-sm mx-auto">
                  تأكد من كتابة رقم الطلب بصيغة صحيحة (مثال: ORD-1001) أو كتابة نفس رقم الجوال المستخدم وقت الطلب.
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-theme-inner text-theme-main rounded-xl text-xs font-bold hover:bg-theme-card border border-theme-card transition-colors cursor-pointer"
              >
                مسح البحث وتجربة رقم آخر
              </button>
            </div>
          ) : (
            <div className="space-y-5 text-theme-subtext">
              {/* Saved Orders Section (Auto-saved on device) */}
              {savedOrders.length > 0 && (() => {
                const activeSaved = savedOrders.filter(savedItem => {
                  const fullOrder = orders.find(o => 
                    o.orderNumber.toLowerCase() === (savedItem.orderNumber || '').toLowerCase() ||
                    o.OrderID.toLowerCase() === (savedItem.id || '').toLowerCase()
                  );
                  const displayStatus = fullOrder ? fullOrder.orderStatus : (savedItem.status || 'pending');
                  return displayStatus !== 'delivered' && !savedItem.received && !savedItem.hidden;
                });

                const archivedSaved = savedOrders.filter(savedItem => {
                  const fullOrder = orders.find(o => 
                    o.orderNumber.toLowerCase() === (savedItem.orderNumber || '').toLowerCase() ||
                    o.OrderID.toLowerCase() === (savedItem.id || '').toLowerCase()
                  );
                  const displayStatus = fullOrder ? fullOrder.orderStatus : (savedItem.status || 'pending');
                  return displayStatus === 'delivered' || savedItem.received || savedItem.hidden;
                });

                return (
                  <div className="bg-theme-inner border border-theme-primary/30 rounded-2xl p-4 space-y-3 shadow-md text-right">
                    <div className="flex items-center justify-between border-b border-theme-card pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-theme-primary/20 text-theme-primary flex items-center justify-center font-bold text-sm">
                          📌
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-theme-main">طلباتك القائمة على هذا الجهاز ({activeSaved.length})</h3>
                          <p className="text-[10px] text-theme-subtext">تتبع شحنتك بضغطة زر أو أكد استلامك للطلب عند وصوله</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-theme-card px-2.5 py-0.5 rounded-full text-theme-subtext border border-theme-card font-mono font-bold">
                        {activeSaved.length} {activeSaved.length === 1 ? 'طلب نشط' : 'طلبات نشطة'}
                      </span>
                    </div>

                    {activeSaved.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {activeSaved.map((savedItem) => {
                          const fullOrder = orders.find(o => 
                            o.orderNumber.toLowerCase() === (savedItem.orderNumber || '').toLowerCase() ||
                            o.OrderID.toLowerCase() === (savedItem.id || '').toLowerCase()
                          );

                          const displayOrderNum = fullOrder ? fullOrder.orderNumber : savedItem.orderNumber;
                          const displayStatus = fullOrder ? fullOrder.orderStatus : 'pending';
                          const displayType = fullOrder?.orderType || savedItem.orderType || 'local';
                          const displayCity = fullOrder?.city || savedItem.city || '';

                          const targetOrderForConfirm: Order = fullOrder || {
                            OrderID: savedItem.id || `ORD-${savedItem.orderNumber}`,
                            orderNumber: savedItem.orderNumber,
                            customerName: savedItem.customerName || 'عميل المتجر',
                            phone: savedItem.phone || '0500000000',
                            country: 'SA',
                            city: displayCity || 'الرياض',
                            address: 'العنوان المسجل',
                            orderType: displayType,
                            items: [],
                            totalQuantity: 1,
                            tax: 0,
                            discount: 0,
                            shippingFee: 0,
                            totalAmount: savedItem.total || 0,
                            orderStatus: displayStatus as any,
                            paymentStatus: 'paid',
                            paymentMethod: 'مدى (Mada)',
                            date: savedItem.date || new Date().toLocaleString('ar-SA')
                          };

                          return (
                            <div 
                              key={savedItem.orderNumber || savedItem.id}
                              className="p-3 bg-theme-card border border-theme-card hover:border-theme-primary/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-black text-theme-primary">#{displayOrderNum}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    displayStatus === 'shipped' ? 'bg-sky-500/20 text-sky-500 animate-pulse' :
                                    displayStatus === 'processing' ? 'bg-amber-500/20 text-amber-500' :
                                    'bg-indigo-500/20 text-indigo-500'
                                  }`}>
                                    {displayStatus === 'pending' && 'قيد الانتظار والمراجعة'}
                                    {displayStatus === 'processing' && 'جاري التجهيز والتغليف'}
                                    {displayStatus === 'shipped' && 'تم الشحن وهو في الطريق'}
                                  </span>
                                  <span className="text-[10px] text-theme-subtext bg-theme-inner px-1.5 py-0.5 rounded border border-theme-card font-medium">
                                    {displayType === 'local' ? '🏠 طلب محلي' : `🚚 شحن ${displayCity ? `(${displayCity})` : ''}`}
                                  </span>
                                </div>
                                <div className="text-[10px] text-theme-subtext flex items-center gap-2 font-mono">
                                  <span>📅 {fullOrder?.date || savedItem.date}</span>
                                  <span>•</span>
                                  <span className="font-bold text-theme-main">{Number(fullOrder?.totalAmount || savedItem.total || 0).toFixed(2)} ر.س</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmOrderReceived(targetOrderForConfirm)}
                                  className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="تأكيد استلامك لهذا الطلب وإخفائه من القائمة النشطة"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>تم الاستلام</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (fullOrder) {
                                      setSelectedOrder(fullOrder);
                                    } else {
                                      setSearchQuery(displayOrderNum);
                                      setHasSearched(true);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-theme-gradient hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                >
                                  <span>تتبع الآن</span>
                                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-theme-card border border-theme-card rounded-xl text-center text-xs text-theme-subtext">
                        لا توجد طلبات نشطة حالياً. جميع الطلبات السابقة تم استلامها بنجاح! 🎉
                      </div>
                    )}

                    {/* Archived / Received Orders Toggle */}
                    {archivedSaved.length > 0 && (
                      <div className="pt-2 border-t border-theme-card">
                        <button
                          type="button"
                          onClick={() => setShowArchived(!showArchived)}
                          className="text-[11px] text-theme-subtext hover:text-theme-primary font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{showArchived ? '📂 إخفاء الأرشيف' : `📜 عرض الطلبات السابقة المستلمة (${archivedSaved.length})`}</span>
                        </button>

                        {showArchived && (
                          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                            {archivedSaved.map((savedItem) => {
                              const fullOrder = orders.find(o => 
                                o.orderNumber.toLowerCase() === (savedItem.orderNumber || '').toLowerCase() ||
                                o.OrderID.toLowerCase() === (savedItem.id || '').toLowerCase()
                              );
                              const displayOrderNum = fullOrder ? fullOrder.orderNumber : savedItem.orderNumber;
                              return (
                                <div key={savedItem.orderNumber || savedItem.id} className="p-2.5 bg-theme-card/60 border border-theme-card rounded-xl flex items-center justify-between text-xs opacity-80">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-500">#{displayOrderNum}</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full">
                                      ✅ تم الاستلام
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveSavedOrder(displayOrderNum, e)}
                                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                  >
                                    حذف
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="text-center py-6 space-y-4 text-theme-subtext">
                <div className="w-16 h-16 rounded-3xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center mx-auto text-theme-primary">
                <Truck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-theme-main">تتبع فوري وموثوق لشحنتك</h3>
                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  اكتب رقم هاتفك أو رقم طلبك في خانة البحث بالأعلى لعرض موقع شحنتك، مرحلة التجهيز، ورابط التتبع المباشر لشركة الشحن.
                </p>
              </div>

              {/* Saudi Trust Badge in Modal */}
              <div className="inline-flex items-center gap-2 p-2.5 bg-theme-inner border border-theme-card rounded-2xl text-[11px] text-theme-subtext">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>جميع الشحنات مضمونة وموثقة برقم تتبع رسمي</span>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Printable Customer Receipt (Thermal / Compact POS Format) */}
        {selectedOrder && (
          <div id="printable-customer-receipt" className="hidden">
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{settings?.storeName || 'المتجر'}</h2>
              <p style={{ fontSize: '11px', margin: '0' }}>{settings?.storeTagline || 'شريكك الأول للتسوق الموثوق'}</p>
              <p style={{ fontSize: '10px', margin: '3px 0' }}>السجل التجاري: {settings?.commercialRegisterNumber || '7033543294'}</p>
              <p style={{ fontSize: '10px', margin: '0' }}>هاتف المتجر: {settings?.storePhoneSaudi || settings?.storePhone || ''}</p>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '8px 0 0 0' }}>إيصال استلام طلب العميل</h3>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.6', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px' }}>
              <div><strong>رقم الطلب:</strong> #{selectedOrder.orderNumber}</div>
              <div><strong>التاريخ:</strong> {selectedOrder.date}</div>
              <div><strong>اسم العميل:</strong> {selectedOrder.customerName}</div>
              <div><strong>رقم الجوال:</strong> {selectedOrder.phone}</div>
              <div><strong>المدينة / العنوان:</strong> {selectedOrder.city} - {selectedOrder.address}</div>
              <div><strong>حالة الطلب:</strong> {selectedOrder.orderStatus}</div>
              {selectedOrder.trackingNumber && (
                <div><strong>رقم التتبع ({selectedOrder.shippingCompany || 'الناقل'}):</strong> {selectedOrder.trackingNumber}</div>
              )}
            </div>

            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'right', marginBottom: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '4px 0' }}>المنتج</th>
                  <th style={{ textAlign: 'center' }}>الكمية</th>
                  <th style={{ textAlign: 'left' }}>المجموع</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                    <td style={{ padding: '4px 0' }}>{it.productName}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'left' }}>{(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontSize: '11px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>طريقة الدفع:</span>
                <span>{selectedOrder.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px', borderTop: '2px solid #000', paddingTop: '4px' }}>
                <span>الإجمالي النهائي:</span>
                <span>{Number(selectedOrder.totalAmount || 0).toFixed(2)} ر.س</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '8px', borderTop: '1px dashed #aaa', fontSize: '9px' }}>
              <p style={{ margin: '0' }}>شكراً لتسوقكم معنا! تسعدنا خدمتكم دائماً</p>
              <p style={{ margin: '3px 0 0 0' }}>{settings?.storeName || 'المتجر'} - موثق في منصة الأعمال السعودية</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
