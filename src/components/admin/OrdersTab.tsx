import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  Check, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle,
  QrCode,
  Filter,
  Calendar,
  RotateCcw,
  X,
  ExternalLink,
  Edit3,
  FileText,
  Download,
  Building,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { Order, Invoice, AppSettings, AbandonedCart } from '../../types';
import { exportOrdersExcel } from '../../lib/excelHelper';
import { getLocalAbandonedCarts } from '../../lib/offlineStorage';
import { AbandonedCartsTab } from './AbandonedCartsTab';
import { IdBadge } from './SimpleTabs';

// Order SLA Processing Countdown Component
interface OrderCountdownTimerProps {
  orderDateStr: string;
  maxProcessingHours?: number;
}

export const OrderCountdownTimer: React.FC<OrderCountdownTimerProps> = ({
  orderDateStr,
  maxProcessingHours = 2
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const parseDate = (dStr: string): Date | null => {
    if (!dStr) return null;
    let dt = new Date(dStr);
    if (!isNaN(dt.getTime())) return dt;

    dt = new Date(dStr.replace(' ', 'T'));
    if (!isNaN(dt.getTime())) return dt;

    const parts = dStr.split(/[-/ :]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const hours = parts[3] ? parseInt(parts[3]) : 9;
      const mins = parts[4] ? parseInt(parts[4]) : 0;
      const dateObj = new Date(year, month, day, hours, mins);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }
    return null;
  };

  const orderDate = parseDate(orderDateStr);
  if (!orderDate) return null;

  const targetDeadline = orderDate.getTime() + maxProcessingHours * 60 * 60 * 1000;
  const remainingMs = targetDeadline - now;

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const overdueMins = Math.floor(overdueMs / (1000 * 60));
    const hours = Math.floor(overdueMins / 60);
    const mins = overdueMins % 60;
    const timeText = hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;

    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-black animate-pulse shadow-xs shrink-0" title="تجاوز هذا الطلب الحد الأقصى المسموح لمعالجة الطلبات">
        <Clock className="w-3 h-3 text-rose-400 shrink-0" />
        <span>🚨 متأخر بـ {timeText}</span>
      </div>
    );
  }

  const remainingMins = Math.floor(remainingMs / (1000 * 60));
  const remainingSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);
  const hours = Math.floor(remainingMins / 60);
  const mins = remainingMins % 60;

  const isNearDelay = remainingMins <= 30;

  const formattedTime = hours > 0 
    ? `${hours}س ${mins}د ${remainingSecs}ث` 
    : `${mins}د ${remainingSecs}ث`;

  if (isNearDelay) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold animate-pulse shadow-xs shrink-0" title="الطلب قريب من تجاوز مهلة التجهيز المسموحة">
        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
        <span>⚠️ اقتراب التأخير: {formattedTime}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold shadow-xs shrink-0" title="الوقت المتبقي لتجهيز الطلب">
      <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
      <span>⏳ متبقي {formattedTime}</span>
    </div>
  );
};

interface OrdersTabProps {
  orders: Order[];
  invoices: Invoice[];
  settings?: AppSettings;
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, trackingNumber: string, shippingCompany?: string) => void;
}

// Helper to generate direct tracking URLs for major shipping companies
export const getTrackingUrl = (company?: string, trackingNum?: string): string => {
  if (!trackingNum) return '';
  const num = trackingNum.trim();
  if (num.startsWith('http://') || num.startsWith('https://')) return num;

  const co = (company || '').toLowerCase().trim();

  if (co.includes('aramex') || co.includes('أرامكس')) {
    return `https://www.aramex.com/express-corporate/track-results?ShipmentNumber=${num}`;
  }
  if (co.includes('smsa') || co.includes('سمسا')) {
    return `https://www.smsaexpress.com/track/${num}`;
  }
  if (co.includes('spl') || co.includes('سبل') || co.includes('البريد')) {
    return `https://splonline.com.sa/ar/tracking/?trackingNumber=${num}`;
  }
  if (co.includes('dhl')) {
    return `https://www.dhl.com/sa-en/home/tracking/tracking-express.html?submit=1&tracking-id=${num}`;
  }
  if (co.includes('zajil') || co.includes('زاجل')) {
    return `https://zajil-express.com/track/${num}`;
  }
  if (co.includes('redbox') || co.includes('ريد بوكس') || co.includes('ريدبوكس')) {
    return `https://redboxsa.com/track/${num}`;
  }
  if (co.includes('fedex') || co.includes('فيديكس')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (co.includes('j&t') || co.includes('جيت')) {
    return `https://www.jtexpress.sa/index/query/gzquery.html?bills=${num}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent('تتبع شحنة ' + (company || '') + ' ' + num)}`;
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  invoices,
  settings,
  onUpdateOrderStatus,
  onUpdateOrderTracking
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateQuickFilter, setDateQuickFilter] = useState<string>('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  // Expandable Row State
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // View Mode: 'orders' or 'abandoned'
  const [subTab, setSubTab] = useState<'orders' | 'abandoned'>('orders');

  // Abandoned Carts State
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(getLocalAbandonedCarts);

  // Tracking Edit Modal State
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<Order | null>(null);
  const [trackingCompanyInput, setTrackingCompanyInput] = useState<string>('أرامكس');
  const [trackingNumberInput, setTrackingNumberInput] = useState<string>('');

  // PDF Export Modal State
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // WhatsApp Notification State
  const [whatsappNotifyOrder, setWhatsappNotifyOrder] = useState<Order | null>(null);

  const sendWhatsAppNotification = (order: Order) => {
    const statusNames: Record<string, string> = {
      pending: '⏳ قيد الانتظار والمعالجة',
      processing: '📦 جاري التجهيز والتغليف 🎁',
      shipped: '🚚 تم الشحن وتسليم الشحنة لشركة النقل',
      delivered: '✅ تم توصيل الطلب بنجاح 🎉',
      cancelled: '❌ تم إلغاء الطلب'
    };

    const statusText = statusNames[order.orderStatus] || order.orderStatus;
    const storeTitle = settings?.storeName || 'متجرنا';

    let msg = `مرحباً بك عزيزي العميل *${order.customerName}* 🌸\n\nتحديث جديد بشأن طلبك رقم: *${order.orderNumber}* لدى *${storeTitle}*\n\nالحالة الحالية للطلب: *${statusText}*`;

    if (order.trackingNumber) {
      const trackingUrl = getTrackingUrl(order.shippingCompany, order.trackingNumber);
      msg += `\n\nشركة الشحن: *${order.shippingCompany || 'شركة الشحن'}*\nرقم التتبع: *${order.trackingNumber}*\nرابط التتبع المباشر: ${trackingUrl}`;
    }

    msg += `\n\nإجمالي المبلغ: *${(order.totalAmount || 0).toFixed(2)} ر.س*\n\nنشكرك لتسوقك معنا وسعداء بخدمتك دائماً! ❤️`;

    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('05')) {
      formattedPhone = `966${cleanPhone.slice(1)}`;
    } else if (cleanPhone.startsWith('7')) {
      formattedPhone = `967${cleanPhone}`;
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleStatusChangeWithNotificationPrompt = (order: Order, newStatus: Order['orderStatus']) => {
    onUpdateOrderStatus(order.OrderID, newStatus);
    const updatedOrder = { ...order, orderStatus: newStatus };
    setWhatsappNotifyOrder(updatedOrder);
  };

  // Status counts for quick filter tabs
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
  const processingCount = orders.filter(o => o.orderStatus === 'processing').length;
  const shippedCount = orders.filter(o => o.orderStatus === 'shipped').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;

  // Filter logic
  const filtered = orders.filter(o => {
    // 1. Text Search (order number, customer name, phone, item name, tracking number)
    const matchesSearch = !search.trim() || (
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search.toLowerCase())) ||
      (o.shippingCompany && o.shippingCompany.toLowerCase().includes(search.toLowerCase())) ||
      (o.items && o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase())))
    );

    // 2. Status Filter
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;

    // 3. Date Filter
    let matchesDate = true;
    const orderDateStr = o.date ? o.date.slice(0, 10) : '';

    if (dateQuickFilter === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      matchesDate = orderDateStr === todayStr;
    } else if (dateQuickFilter === 'week') {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const orderDateObj = new Date(o.date);
      matchesDate = !isNaN(orderDateObj.getTime()) && orderDateObj >= oneWeekAgo;
    } else if (dateQuickFilter === 'month') {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const orderDateObj = new Date(o.date);
      matchesDate = !isNaN(orderDateObj.getTime()) && orderDateObj >= oneMonthAgo;
    } else if (dateQuickFilter === 'custom' || startDate || endDate) {
      if (startDate) {
        matchesDate = matchesDate && orderDateStr >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && orderDateStr <= endDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort orders newest first so employees see the latest orders at the top
  const parseOrderDateMs = (dStr: string): number => {
    if (!dStr) return 0;
    let dt = new Date(dStr);
    if (!isNaN(dt.getTime())) return dt.getTime();

    dt = new Date(dStr.replace(' ', 'T'));
    if (!isNaN(dt.getTime())) return dt.getTime();

    const parts = dStr.split(/[-/ :]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const hours = parts[3] ? parseInt(parts[3]) : 0;
      const mins = parts[4] ? parseInt(parts[4]) : 0;
      const dateObj = new Date(year, month, day, hours, mins);
      if (!isNaN(dateObj.getTime())) return dateObj.getTime();
    }
    return 0;
  };

  const sortedFiltered = [...filtered].sort((a, b) => {
    const timeA = parseOrderDateMs(a.date);
    const timeB = parseOrderDateMs(b.date);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending: Newest orders first at the top
    }
    return (b.orderNumber || b.OrderID || '').localeCompare(a.orderNumber || a.OrderID || '');
  });

  const isFiltered = Boolean(search || statusFilter !== 'all' || dateQuickFilter !== 'all' || startDate || endDate);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateQuickFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const storeName = settings?.storeName || 'المتجر الإلكتروني';
  const storePhone = settings?.storePhoneSaudi || '966599539659';
  const taxNumber = settings?.taxNumber || '310123456700003';

  const handlePrint = (order: Order) => {
    const inv = invoices.find(i => i.invoiceNumber.includes(order.OrderID) || i.invoiceNumber.includes(order.orderNumber)) || {
      InvoiceID: `INV_${order.OrderID}`,
      invoiceNumber: `INV-${order.orderNumber}`,
      customerName: order.customerName,
      taxNumber: taxNumber,
      itemsSummary: order.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
      taxAmount: order.tax,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'الدفع عند الاستلام',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.OrderID}`,
      employeeName: order.employeeName || 'النظام الإلكتروني',
      date: order.date
    };
    setSelectedOrder(order);
    setSelectedInvoice(inv);
  };

  const handleExportPdf = async () => {
    if (!invoicePrintRef.current || !selectedInvoice) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(invoicePrintRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`Invoice_${selectedInvoice.invoiceNumber || selectedInvoice.InvoiceID}.pdf`);
    } catch (err) {
      console.error('Error generating PDF with jsPDF/html2canvas:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenTrackingModal = (o: Order) => {
    setEditingTrackingOrder(o);
    setTrackingCompanyInput(o.shippingCompany || 'أرامكس');
    setTrackingNumberInput(o.trackingNumber || '');
  };

  const handleSaveTracking = () => {
    if (!editingTrackingOrder) return;
    const cleanNum = trackingNumberInput.trim();
    const cleanCo = trackingCompanyInput.trim();

    if (onUpdateOrderTracking) {
      onUpdateOrderTracking(editingTrackingOrder.OrderID, cleanNum, cleanCo);
    } else {
      editingTrackingOrder.trackingNumber = cleanNum;
      editingTrackingOrder.shippingCompany = cleanCo;
    }
    setEditingTrackingOrder(null);
  };

  const totalFilteredAmount = filtered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Sub-Tab Navigation Toggle (Orders vs Abandoned Carts) */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full sm:w-auto self-start">
        <button
          onClick={() => setSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'orders'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBasket className="w-4 h-4" />
          <span>جدول طلبات المتجر</span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-white/20 text-white font-mono">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('abandoned')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer relative ${
            subTab === 'abandoned'
              ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>السلات المتروكة (تنبيهات الواتساب 24h)</span>
          {abandonedCarts.filter(c => !c.reminderSent).length > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] bg-rose-500 text-white font-mono font-black animate-pulse">
              {abandonedCarts.filter(c => !c.reminderSent).length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'abandoned' ? (
        <AbandonedCartsTab
          abandonedCarts={abandonedCarts}
          setAbandonedCarts={setAbandonedCarts}
          settings={settings}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">إدارة طلبات العملاء والتوصيل</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  إجمالي المعروض: {filtered.length} طلب
                </span>
              </div>
              <p className="text-xs text-slate-400">تابع حركة الطلبات، اضغط على زر "توسيع 🔽" لعرض تفاصيل المنتجات داخل كل طلب دون مغادرة الصفحة.</p>
            </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export PDF Button */}
          <button
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>تصدير كـ PDF</span>
          </button>

          {/* Export Excel XLSX Button */}
          <button
            onClick={() => exportOrdersExcel(filtered)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير XLSX</span>
          </button>
        </div>
      </div>

      {/* Quick Status Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <span>الكل</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 text-white">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>قيد الانتظار</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('processing')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'processing'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800'
          }`}
        >
          <ShoppingBasket className="w-3.5 h-3.5" />
          <span>جاري التجهيز</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {processingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('shipped')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'shipped'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>تم الشحن</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {shippedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('delivered')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>تم التوصيل</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {deliveredCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>ملغي</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search || ""}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الطلب، العميل، الهاتف، رقم التتبع..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pr-9 pl-8 py-2.5 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pr-9 pl-3 py-2.5 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="processing">جاري التجهيز</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التوصيل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Date Filter Quick Options */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={dateQuickFilter || ""}
              onChange={(e) => {
                setDateQuickFilter(e.target.value);
                if (e.target.value !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pr-9 pl-3 py-2.5 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع التواريخ</option>
              <option value="today">طلبات اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوم</option>
              <option value="custom">نطاق تاريخ مخصص</option>
            </select>
          </div>

          {/* Filter Stats / Clear Filters */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">إجمالي القيمة:</span>
              <span className="font-bold text-emerald-400 font-mono text-xs">
                {totalFilteredAmount.toFixed(2)} ر.س
              </span>
            </div>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Inputs Range */}
        {(dateQuickFilter === 'custom' || startDate || endDate) && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">من تاريخ:</span>
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateQuickFilter('custom');
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">إلى تاريخ:</span>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateQuickFilter('custom');
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl w-full max-w-full">
        <div className="overflow-x-auto overflow-y-hidden w-full touch-pan-x scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-right text-xs text-slate-300 min-w-[850px] border-collapse">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10 text-center font-bold">توسيع</th>
                <th className="p-3 font-bold">رقم الطلب والتاريخ</th>
                <th className="p-3 font-bold">العميل والهاتف</th>
                <th className="p-3 font-bold">المنتجات</th>
                <th className="p-3 font-bold">تتبع الشحنة</th>
                <th className="p-3 font-bold">الإجمالي</th>
                <th className="p-3 font-bold">حالة الطلب</th>
                <th className="p-3 text-center font-bold">الفاتورة والطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBasket className="w-8 h-8 text-slate-600" />
                      <p className="font-bold text-slate-300 text-xs">لا توجد طلبات مطابقة لمعايير البحث أو التصفية الحالية</p>
                      {isFiltered && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          إعادة تصفية الطلبات
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((o, oIdx) => {
                  const isExpanded = expandedOrderId === o.OrderID;
                  return (
                    <React.Fragment key={`${o.OrderID || 'ord'}_${oIdx}`}>
                      <tr className={`hover:bg-slate-800/40 transition-colors ${isExpanded ? 'bg-slate-850 border-indigo-500/30' : ''}`}>
                        {/* Expand Button Column */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : o.OrderID)}
                            className={`p-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                              isExpanded
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title={isExpanded ? "إغلاق التفاصيل" : "توسيع وعرض تفاصيل المنتجات داخل الطلب"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Order Number & Date */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1 items-start">
                            <IdBadge id={o.orderNumber || o.OrderID} color="pink" tooltip="رقم الطلب (Order ID) - انقر للنسخ والبحث في شيت الطلبات" />
                            <p className="text-[10px] text-slate-500 font-mono">{o.date}</p>
                            {(o.orderStatus === 'pending' || o.orderStatus === 'processing') && (
                              <div className="mt-1">
                                <OrderCountdownTimer orderDateStr={o.date} maxProcessingHours={settings?.orderMaxProcessingHours || 2} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Customer Info */}
                        <td className="p-3">
                          <p className="font-bold text-white">{o.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{o.phone}</p>
                        </td>

                        {/* Items Preview */}
                        <td className="p-3">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : o.OrderID)}
                            className="text-right max-w-xs truncate text-[11px] text-indigo-300 hover:text-indigo-200 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span className="truncate">{o.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}</span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-[9px] font-bold shrink-0">+{o.items.length}</span>
                          </button>
                        </td>

                        {/* Tracking Number & Direct Link */}
                        <td className="p-3">
                          {o.trackingNumber ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                                  {o.shippingCompany || 'شركة شحن'}
                                </span>
                                <span className="font-mono text-white font-bold text-[11px]">{o.trackingNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <a
                                  href={getTrackingUrl(o.shippingCompany, o.trackingNumber)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>تتبع مباشر</span>
                                </a>
                                <button
                                  onClick={() => handleOpenTrackingModal(o)}
                                  className="text-slate-400 hover:text-white flex items-center gap-0.5"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>تعديل</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenTrackingModal(o)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3 text-indigo-400" />
                              <span>+ إضافة رقم التتبع</span>
                            </button>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="p-3 font-extrabold text-white font-mono">{(o.totalAmount || 0).toFixed(2)} ر.س</td>

                        {/* Order Status Selector & WhatsApp Notification */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={o.orderStatus}
                              onChange={(e) => handleStatusChangeWithNotificationPrompt(o, e.target.value as Order['orderStatus'])}
                              className={`bg-slate-950 border rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none cursor-pointer ${
                                o.orderStatus === 'pending' ? 'text-amber-400 border-amber-500/40' :
                                o.orderStatus === 'processing' ? 'text-blue-400 border-blue-500/40' :
                                o.orderStatus === 'shipped' ? 'text-purple-400 border-purple-500/40' :
                                o.orderStatus === 'delivered' ? 'text-emerald-400 border-emerald-500/40' :
                                'text-rose-400 border-rose-500/40'
                              }`}
                            >
                              <option value="pending">⏳ قيد الانتظار</option>
                              <option value="processing">📦 جاري التجهيز</option>
                              <option value="shipped">🚚 تم الشحن</option>
                              <option value="delivered">✅ تم التوصيل</option>
                              <option value="cancelled">❌ ملغي</option>
                            </select>

                            <button
                              onClick={() => sendWhatsAppNotification(o)}
                              title="إرسال إشعار فوري للعميل عبر الواتساب"
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">واتساب</span>
                            </button>
                          </div>
                        </td>

                        {/* Print / PDF Action */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePrint(o)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>معاينة PDF</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Inline Product Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/95 border-b border-indigo-500/30">
                          <td colSpan={8} className="p-4 sm:p-5">
                            <div className="space-y-4 animate-in fade-in duration-200">
                              {/* Product Details Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-extrabold text-xs text-white">
                                    منتجات وتفاصيل الطلب #{o.orderNumber || o.OrderID}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                    {o.items.length} منتجات
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                                  <span>طريقة الدفع: <strong className="text-emerald-400 font-mono">{o.paymentMethod || 'الدفع عند الاستلام'}</strong></span>
                                  <span>عنوان الشحن: <strong className="text-white">{o.shippingAddress || o.city || 'المنطقة الرئيسية'}</strong></span>
                                </div>
                              </div>

                              {/* Items Grid Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {o.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                                    <img
                                      src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                                      alt={item.productName}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <p className="font-bold text-white text-xs truncate">{item.productName}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        الكمية: <strong className="text-indigo-400">{item.quantity}</strong> × {item.price.toFixed(2)} ر.س
                                      </p>
                                      {(item.selectedColor || item.selectedSize) && (
                                        <p className="text-[9px] text-slate-400 flex items-center gap-1">
                                          {item.selectedColor && <span>اللون: <strong className="text-slate-200">{item.selectedColor}</strong></span>}
                                          {item.selectedSize && <span>المقاس: <strong className="text-slate-200">{item.selectedSize}</strong></span>}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-left font-extrabold text-emerald-400 text-xs font-mono shrink-0">
                                      {(item.price * item.quantity).toFixed(2)} ر.س
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Summary & Notes Footer */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs">
                                <div className="text-slate-300">
                                  {o.notes ? (
                                    <p className="text-[11px] text-amber-300 font-medium">📝 ملاحظات العملاء: {o.notes}</p>
                                  ) : (
                                    <p className="text-[11px] text-slate-500">لا توجد ملاحظات إضافية مرفقة مع الطلب.</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 font-mono font-bold self-end sm:self-auto">
                                  <span className="text-slate-400 text-[11px]">رسوم الشحن: {(o.shippingFee || 0).toFixed(2)} ر.س</span>
                                  <span className="text-emerald-400 font-black text-sm bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                                    الإجمالي النهائي: {(o.totalAmount || 0).toFixed(2)} ر.س
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Edit Modal Overlay */}
      {editingTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setEditingTrackingOrder(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-sm text-white">تحديث بيانات تتبع الشحن</h3>
                <p className="text-xs text-slate-400 font-mono">للطلب رقم: {editingTrackingOrder.orderNumber}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اختر شركة الشحن:</label>
                <select
                  value={trackingCompanyInput || ""}
                  onChange={(e) => setTrackingCompanyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="أرامكس">أرامكس (Aramex)</option>
                  <option value="سمسا">سمسا إكسبريس (SMSA Express)</option>
                  <option value="سبل البريد السعودي">سبل / البريد السعودي (SPL)</option>
                  <option value="زاجل">زاجل (Zajil)</option>
                  <option value="ريد بوكس">ريد بوكس (RedBox)</option>
                  <option value="DHL">DHL Express</option>
                  <option value="FedEx">FedEx</option>
                  <option value="جي آند تي">J&T Express</option>
                  <option value="شركة أخرى">شركة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم تتبع الشحنة (Tracking Number):</label>
                <input
                  type="text"
                  value={trackingNumberInput || ""}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="مثال: 123456789 أو SHP-98765"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {trackingNumberInput && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-1 text-[11px]">
                  <span className="text-slate-400 block font-bold">معاينة رابط التتبع المباشر:</span>
                  <a
                    href={getTrackingUrl(trackingCompanyInput, trackingNumberInput)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-mono hover:underline flex items-center gap-1 break-all"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span>{getTrackingUrl(trackingCompanyInput, trackingNumberInput)}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveTracking}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30"
              >
                حفظ رقم التتبع
              </button>
              <button
                onClick={() => setEditingTrackingOrder(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Orders List PDF Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-orders-pdf-area, #printable-orders-pdf-area * {
                visibility: visible !important;
              }
              #printable-orders-pdf-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 15px !important;
                box-shadow: none !important;
              }
              .no-print-btn {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 space-y-5 text-slate-100 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print-btn">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">معاينة تقرير الطلبات المفلترة قبل التصدير كـ PDF</h3>
                  <p className="text-xs text-slate-400">عدد الطلبات: {filtered.length} طلب | الإجمالي: {totalFilteredAmount.toFixed(2)} ر.س</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / تنزيل PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area (White PDF Sheet) */}
            <div id="printable-orders-pdf-area" className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 dir-rtl">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{storeName}</h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">كشف وتقرير حركة طلبات العملاء الشامل</p>
                  <p className="text-[11px] text-slate-500 mt-1">تاريخ الاستخراج: {new Date().toLocaleString('ar-SA')}</p>
                </div>
                <div className="text-left text-xs text-slate-600 space-y-1">
                  <p><span className="font-bold">رقم التواصل:</span> {storePhone}</p>
                  <p><span className="font-bold font-mono">الرقم الضريبي:</span> {taxNumber}</p>
                </div>
              </div>

              {/* Filter Statistics Summary */}
              <div className="grid grid-cols-3 gap-4 text-center bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-bold">إجمالي الطلبات</span>
                  <span className="text-base font-extrabold text-indigo-700 font-mono">{filtered.length} طلب</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold">إجمالي المبالغ</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">{totalFilteredAmount.toFixed(2)} ر.س</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold">حالة الفلترة</span>
                  <span className="text-xs font-bold text-slate-800">
                    {statusFilter === 'all' ? 'جميع الحالات' : statusFilter}
                  </span>
                </div>
              </div>

              {/* Orders Table */}
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-300">
                    <th className="p-2 font-bold">#</th>
                    <th className="p-2 font-bold">رقم الطلب والتاريخ</th>
                    <th className="p-2 font-bold">العميل والهاتف</th>
                    <th className="p-2 font-bold">المنتجات</th>
                    <th className="p-2 font-bold">تتبع الشحنة</th>
                    <th className="p-2 font-bold">الحالة</th>
                    <th className="p-2 font-bold text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 font-bold">
                        لا توجد طلبات مطابقة للتقرير
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o, idx) => (
                      <tr key={o.OrderID} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-mono">
                          <p className="font-bold text-indigo-900">{o.orderNumber}</p>
                          <p className="text-[10px] text-slate-500">{o.date}</p>
                        </td>
                        <td className="p-2">
                          <p className="font-bold text-slate-800">{o.customerName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{o.phone}</p>
                        </td>
                        <td className="p-2 max-w-[180px] truncate text-[11px] text-slate-700">
                          {o.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-2">
                          {o.trackingNumber ? (
                            <div>
                              <p className="font-mono text-[11px] font-bold text-slate-900">
                                {o.shippingCompany ? `${o.shippingCompany}: ` : ''}{o.trackingNumber}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">غير محدد</span>
                          )}
                        </td>
                        <td className="p-2 font-bold text-[11px]">
                          {o.orderStatus === 'pending' && '⏳ قيد الانتظار'}
                          {o.orderStatus === 'processing' && '📦 جاري التجهيز'}
                          {o.orderStatus === 'shipped' && '🚚 تم الشحن'}
                          {o.orderStatus === 'delivered' && '✅ تم التوصيل'}
                          {o.orderStatus === 'cancelled' && '❌ ملغي'}
                        </td>
                        <td className="p-2 text-left font-bold font-mono text-slate-900">
                          {(o.totalAmount || 0).toFixed(2)} ر.س
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Report Footer */}
              <div className="pt-6 border-t-2 border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <p>تم استخراج هذا التقرير مخصصاً للطباعة من {storeName}</p>
                <div className="text-left font-bold text-slate-700">
                  <p>توقيع المسؤول / الموظف: ...............................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Invoice Modal Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedInvoice(null);
                setSelectedOrder(null);
              }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{storeName}</h3>
              <p className="text-[11px] text-slate-400">فاتورة ضريبية مبسطة (مطبقة لأحكام ZATCA)</p>
            </div>

            <div ref={invoicePrintRef} className="printable-invoice space-y-3 bg-white text-slate-900 p-5 rounded-2xl text-xs font-sans shadow-inner">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-2">
                <div className="flex items-center gap-2">
                  {settings?.storeLogoUrl ? (
                    <img src={settings.storeLogoUrl} alt="logo" className="w-10 h-10 object-contain rounded-lg border bg-slate-50" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border flex items-center justify-center font-bold text-indigo-900 text-xs">M</div>
                  )}
                  <div>
                    <p className="font-extrabold text-sm text-indigo-900">{storeName}</p>
                    <p className="text-[10px] text-slate-500">رقم الهاتف: {storePhone}</p>
                    <p className="text-[10px] text-slate-500">الرقم الضريبي: {selectedInvoice.taxNumber}</p>
                  </div>
                </div>
                <div className="text-left font-mono text-[10px]">
                  <p className="font-bold text-indigo-600">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-slate-500">{selectedInvoice.date}</p>
                </div>
              </div>

              {/* Customer */}
              <div className="border-b pb-2 text-[11px]">
                <p><span className="font-bold text-slate-600">اسم العميل:</span> {selectedInvoice.customerName}</p>
                <p><span className="font-bold text-slate-600">طريقة الدفع:</span> {selectedInvoice.paymentMethod}</p>
                {selectedOrder?.trackingNumber && (
                  <p><span className="font-bold text-slate-600">رقم التتبع:</span> {selectedOrder.shippingCompany || ''} - {selectedOrder.trackingNumber}</p>
                )}
              </div>

              {/* Items Table */}
              <div className="border-b pb-2">
                <table className="w-full text-right text-[11px]">
                  <thead>
                    <tr className="border-b text-slate-600 bg-slate-50">
                      <th className="p-1">المنتج</th>
                      <th className="p-1 text-center">الكمية</th>
                      <th className="p-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2 font-bold">{item.productName}</td>
                          <td className="p-2 text-center font-mono">{item.quantity}</td>
                          <td className="p-2 text-left font-mono">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} ر.س</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 font-bold">{selectedInvoice.itemsSummary}</td>
                        <td className="p-2 text-center font-mono">1</td>
                        <td className="p-2 text-left font-mono">{(selectedInvoice.totalAmount || 0).toFixed(2)} ر.س</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="border-t pt-3 space-y-1.5 font-bold">
                <div className="flex justify-between text-slate-600">
                  <span>الضريبة (15%):</span>
                  <span className="font-mono">{(selectedInvoice.taxAmount || 0).toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-sm text-slate-950 font-black bg-slate-100 p-2 rounded-lg border">
                  <span>الإجمالي الشامل:</span>
                  <span className="font-mono text-indigo-700">{(selectedInvoice.totalAmount || 0).toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* QR Code */}
              {selectedInvoice.qrCodeUrl && selectedInvoice.qrCodeUrl.trim() ? (
                <div className="flex items-center justify-center gap-3 pt-1 border-t">
                  <img src={selectedInvoice.qrCodeUrl} alt="QR" className="w-16 h-16 border p-1 rounded-lg" />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-800">رمز التحقق الضريبي المعتمد (ZATCA)</p>
                    <p>{storeName}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-70 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 select-none"
              >
                {isExportingPdf ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري توليد ملف PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تنزيل الفاتورة كملف PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Quick Notification Prompt Modal */}
      {whatsappNotifyOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-100 dir-rtl relative">
            <button
              onClick={() => setWhatsappNotifyOrder(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">إرسال إشعار للعميل عبر الواتساب</h3>
                <p className="text-xs text-slate-400">
                  تم تحديث حالة الطلب #{whatsappNotifyOrder.orderNumber}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>اسم العميل:</span>
                <span className="font-bold text-white">{whatsappNotifyOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>رقم الهاتف:</span>
                <span className="font-mono text-emerald-400 font-bold">{whatsappNotifyOrder.phone}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>الحالة الجديدة:</span>
                <span className="px-2 py-0.5 rounded-md font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                  {whatsappNotifyOrder.orderStatus === 'pending' && '⏳ قيد الانتظار'}
                  {whatsappNotifyOrder.orderStatus === 'processing' && '📦 جاري التجهيز'}
                  {whatsappNotifyOrder.orderStatus === 'shipped' && '🚚 تم الشحن'}
                  {whatsappNotifyOrder.orderStatus === 'delivered' && '✅ تم التوصيل'}
                  {whatsappNotifyOrder.orderStatus === 'cancelled' && '❌ ملغي'}
                </span>
              </div>
              {whatsappNotifyOrder.trackingNumber && (
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span>رقم التتبع:</span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {whatsappNotifyOrder.shippingCompany || ''} - {whatsappNotifyOrder.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              سيتم فتح الواتساب بفي الموعد برسالة موجهة ومصممة تشمل رقم الطلب، الحالة الحالية، ورابط التتبع المباشر.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  sendWhatsAppNotification(whatsappNotifyOrder);
                  setWhatsappNotifyOrder(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الإشعار الآن عبر الواتساب</span>
              </button>

              <button
                onClick={() => setWhatsappNotifyOrder(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
