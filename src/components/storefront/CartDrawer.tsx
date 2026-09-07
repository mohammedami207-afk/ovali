import React, { useState, useRef } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  Ticket, 
  Check, 
  Printer, 
  Sparkles, 
  CreditCard, 
  ShieldCheck,
  Building2,
  FileText,
  QrCode,
  Download,
  Loader2,
  Gift,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderItem, Coupon, CurrencyRate, AppSettings, Order, Invoice, Offer } from '../../types';
import { DEFAULT_PRODUCT_IMAGE } from '../../lib/imageUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  setCart: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  coupons: Coupon[];
  offers?: Offer[];
  currency: CurrencyRate;
  settings: AppSettings;
  ordersCount?: number;
  onPlaceOrder: (orderData: Partial<Order>) => { order: Order; invoice: Invoice };
  onOpenTracking?: (orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  coupons,
  offers = [],
  currency,
  settings,
  ordersCount,
  onPlaceOrder,
  onOpenTracking
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Customer checkout form state
  const [customerCountry, setCustomerCountry] = useState<'SA' | 'YE'>('SA');
  const [orderType, setOrderType] = useState<'local' | 'shipping'>('local');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('الرياض');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('مدى (Mada)');

  // Completed order details state
  interface CompletedOrderDetails {
    invoice: Invoice;
    items: OrderItem[];
    customerName: string;
    phone: string;
    customerCountry: 'SA' | 'YE';
    city: string;
    address: string;
    orderType: 'local' | 'shipping';
    paymentMethod: string;
    totalAmount: number;
    shippingFee: number;
  }
  const [completedOrderDetails, setCompletedOrderDetails] = useState<CompletedOrderDetails | null>(null);

  // Completed order modal / print invoice state
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const invoiceElementRef = useRef<HTMLDivElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate Coupon Discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Calculate Shipping Fee based on Order Type and Subtotal
  const shippingFee = orderType === 'local' ? 0 : (subtotal > 150 ? 0 : 25);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = 0;
  const grandTotal = taxableAmount + shippingFee;

  const handleApplyCoupon = () => {
    setCouponError('');
    const found = coupons.find(c => c.CouponCode.toUpperCase() === couponCode.trim().toUpperCase());
    if (!found) {
      setCouponError('رمز الكوبون غير صحيح');
      return;
    }
    if (subtotal < found.minOrderAmount) {
      setCouponError(`الحد الأدنى لاستخدام الكوبون هو ${found.minOrderAmount} ر.س`);
      return;
    }
    setAppliedCoupon(found);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productID === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : null;
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.productID !== id));
  };

  const sendOrderToWhatsApp = (invoiceObj: Invoice) => {
    const details = completedOrderDetails;
    const itemsToRender = details?.items || cart;
    const phoneToUse = details?.phone || phone;
    const countryToUse = details?.customerCountry || customerCountry;
    const cityToUse = details?.city || city;
    const addressToUse = details?.address || address;
    const orderTypeToUse = details?.orderType || orderType;
    const paymentMethodToUse = details?.paymentMethod || invoiceObj.paymentMethod || paymentMethod;
    const countryLabel = countryToUse === 'SA' ? 'السعودية' : 'اليمن';

    const storeWhatsAppNumber = countryToUse === 'YE' || (currency?.currencyCode || 'SAR') === 'YER'
      ? (settings.storePhoneYemen || '967715989357').replace(/[^0-9]/g, '')
      : (settings.storePhoneSaudi || '966599539659').replace(/[^0-9]/g, '');

    const isLocalOrder = orderTypeToUse === 'local';
    const orderNoClean = details?.orderNumber || invoiceObj.invoiceNumber.replace('INV-', '');
    const orderHeaderTitle = isLocalOrder
      ? `📦 *طلب محلي جديد رقم #${orderNoClean}*`
      : `📦 *طلب شحن جديد رقم #${orderNoClean}*`;
    const orderTypeLabel = isLocalOrder ? '🏠 طلب محلي (استلام من الفرع / توصيل محلي)' : `🚚 شحن لجميع المناطق - ${cityToUse} (${countryLabel})`;

    const lines = [
      orderHeaderTitle,
      `------------------------------`,
      `👤 *العميل:* ${invoiceObj.customerName}`,
      `📱 *الهاتف:* ${phoneToUse}`,
      `📍 *العنوان والمدينة:* ${countryLabel} - ${cityToUse} (${addressToUse})`,
      `🚚 *نوع الطلب والتوصيل:* *${orderTypeLabel}*`,
      `💳 *طريقة الدفع:* ${paymentMethodToUse}`,
      `------------------------------`,
      `🛒 *المنتجات المطلوبة:*`,
      ...itemsToRender.map((item, idx) => {
        const itemPrice = (item.price * (currency?.exchangeRate || 1)).toFixed(2);
        const itemTotal = (item.price * item.quantity * (currency?.exchangeRate || 1)).toFixed(2);
        const sym = currency?.symbol || 'ر.س';
        return `${idx + 1}. ${item.productName} (x${item.quantity}) - ${itemTotal} ${sym}`;
      }),
      `------------------------------`,
      `💰 *الإجمالي النهائي:* *${(invoiceObj.totalAmount * (currency?.exchangeRate || 1)).toFixed(2)} ${currency?.symbol || 'ر.س'}*`,
      `------------------------------`,
      `🌐 *موقع المتجر:* ${window.location.origin}`
    ];

    const message = encodeURIComponent(lines.join('\n'));
    const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportPdf = async () => {
    if (!invoiceElementRef.current || !completedInvoice) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(invoiceElementRef.current, {
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
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`Invoice_${completedInvoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF from cart drawer:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Check for dynamic offer messages (e.g., 4+1)
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOffer = offers?.find(o => o.status === 'active' && (o.title.includes('4+1') || o.title.includes('اشتري 4')));
  let offerMessage = '';
  if (activeOffer) {
    // Assuming "buy 4 get 1" means every 4 items trigger a free one.
    // If they have 3, they need 1 more. If they have 4, they qualify.
    const remainder = totalCartQty % 5; 
    if (remainder > 0 && remainder < 4) {
      const needed = 4 - remainder;
      offerMessage = `أضف ${needed} منتج إضافي لتحصل على منتج مجاني! (ضمن العرض الخاص)`;
    } else if (remainder === 4 || (totalCartQty > 0 && totalCartQty % 5 === 0)) {
      offerMessage = `تهانينا! 🎉 لقد تأهلت للحصول على منتج مجاني بناءً على العرض.`;
    }
  }

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (settings?.planMaxOrders && settings.planMaxOrders > 0 && ordersCount !== undefined) {
      if (ordersCount >= settings.planMaxOrders) {
        alert(`ممنوع الإضافة! لقد وصلت للحد الأقصى المسموح به للطلبات (${settings.planMaxOrders} طلب). يرجى التواصل مع إدارة المتجر للتخزين والترقية.`);
        return;
      }
    }

    const { invoice } = onPlaceOrder({
      customerName: customerName || 'عميل المتجر',
      phone: phone || '0500000000',
      country: customerCountry,
      city: city,
      address: address || 'العنوان الرئيسي',
      orderType: orderType,
      items: cart,
      totalQuantity: cart.reduce((acc, i) => acc + i.quantity, 0),
      tax,
      discount: discountAmount,
      shippingFee,
      totalAmount: grandTotal,
      paymentMethod,
      orderStatus: 'pending',
      paymentStatus: 'paid'
    });

    setCompletedOrderDetails({
      invoice,
      items: [...cart],
      customerName: customerName || 'عميل المتجر',
      phone: phone || '0500000000',
      customerCountry,
      city,
      address: address || 'العنوان الرئيسي',
      orderType,
      paymentMethod,
      totalAmount: grandTotal,
      shippingFee
    });

    setCompletedInvoice(invoice);
    setCart([]);

    // Auto save placed order details into localStorage for instant customer tracking
    try {
      const cleanNum = invoice.invoiceNumber.replace('INV-', '');
      const existingSaved = JSON.parse(localStorage.getItem('my_customer_orders') || '[]');
      const newEntry = {
        orderNumber: cleanNum,
        id: invoice.InvoiceID,
        date: invoice.date,
        total: grandTotal,
        customerName: customerName || 'عميل المتجر',
        phone: phone || '0500000000',
        orderType: orderType,
        city: city
      };
      const filtered = existingSaved.filter((item: any) => item.orderNumber !== cleanNum);
      localStorage.setItem('my_customer_orders', JSON.stringify([newEntry, ...filtered].slice(0, 20)));
    } catch (e) {
      console.error('Failed saving order to localStorage:', e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="cart-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            key="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="bg-theme-card border-r border-theme-card w-full max-w-lg h-full flex flex-col justify-between shadow-2xl text-theme-main relative"
          >
            {/* Header */}
            <div className="p-5 border-b border-theme-card flex items-center justify-between bg-theme-inner">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-theme-primary" />
                <h2 className="font-bold text-base text-theme-main">سلة التسوق ({cart.length})</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-theme-subtext hover:text-theme-main hover:bg-theme-inner transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Created Printable View Modal Overlay */}
            {completedInvoice ? (
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {/* Screenshot & Save Notification Notice */}
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-300 flex items-start gap-2.5">
                  <span className="text-lg">📸</span>
                  <div>
                    <p className="font-extrabold text-theme-main">يرجى التقاط لقطة شاشة (Screenshot) للفاتورة لحفظها لديك!</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-0.5">ثم اضغط على زر "تأكيد وإرسال للواتساب" أدناه لإرسال بيانات طلبك للمتجر.</p>
                  </div>
                </div>

                <div ref={invoiceElementRef} className="bg-white text-slate-950 rounded-2xl p-5 space-y-3 shadow-xl font-sans" id="printable-invoice">
                  <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{settings.storeName}</h3>
                      <p className="text-[11px] text-slate-500 font-bold">طلب شراء مبسط</p>
                      <p className="text-[10px] text-slate-500 font-mono">الرقم الضريبي: {settings.taxNumber}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold font-mono text-pink-600">{completedInvoice.invoiceNumber}</span>
                      <p className="text-[10px] text-slate-400">{completedInvoice.date}</p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p><b>العميل:</b> {completedInvoice.customerName}</p>
                    <p><b>طريقة الدفع:</b> {completedInvoice.paymentMethod}</p>
                  </div>

                  <div className="text-xs border-t border-b border-slate-200 py-2.5 space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>المنتجات والتفاصيل</span>
                      <span>المبلغ</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{completedInvoice.itemsSummary}</p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700 font-semibold pt-1">
                    <div className="flex justify-between text-base font-black text-slate-950 pt-1.5 border-t border-slate-200">
                      <span>الإجمالي النهائي:</span>
                      <span>{(Number(completedInvoice.totalAmount) || 0).toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  {/* ZATCA QR CODE */}
                  {completedInvoice.qrCodeUrl && completedInvoice.qrCodeUrl.trim() ? (
                    <div className="flex items-center justify-center pt-2 border-t border-slate-100">
                      <img src={completedInvoice.qrCodeUrl} alt="ZATCA QR Code" className="w-20 h-20 border p-1 rounded-lg" />
                    </div>
                  ) : null}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => sendOrderToWhatsApp(completedInvoice)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 cursor-pointer"
                  >
                    <span>💬 تأكيد وإرسال الطلب عبر الواتساب</span>
                  </button>

                  {onOpenTracking && (
                    <button
                      onClick={() => {
                        const orderNo = completedInvoice.invoiceNumber.replace('INV-', 'ORD-');
                        setCompletedInvoice(null);
                        onClose();
                        onOpenTracking(orderNo);
                      }}
                      className="w-full py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-sky-500" />
                      <span>تتبع حالة ومسار الشحنة لهذا الطلب 🚚</span>
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="flex-1 py-2.5 bg-theme-primary hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>تصدير PDF</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="py-2.5 px-3 bg-theme-inner hover:bg-theme-card border border-theme-card text-theme-main font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                    <button
                      onClick={() => {
                        setCompletedInvoice(null);
                        onClose();
                      }}
                      className="py-2.5 px-4 bg-theme-inner hover:bg-theme-card border border-theme-card text-theme-main font-bold rounded-xl text-xs cursor-pointer"
                    >
                      متابعة التسوق
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Cart List & Checkout Form */
              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-theme-subtext mx-auto opacity-50" />
                    <p className="text-xs text-theme-subtext">سلة التسوق فارغة حالياً</p>
                  </div>
                ) : (
                  <>
                    {offerMessage && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                        <Gift className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-bold leading-relaxed">{offerMessage}</span>
                      </div>
                    )}

                    {/* Animated Cart Items List */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {cart.map(item => (
                          <motion.div 
                            key={item.productID}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.2 }}
                            className="bg-theme-inner p-3 rounded-2xl border border-theme-card flex gap-3 items-center group relative overflow-hidden"
                          >
                            <img 
                              src={item.image && item.image.trim() ? item.image : DEFAULT_PRODUCT_IMAGE} 
                              alt={item.productName} 
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                              className="w-16 h-16 rounded-xl object-cover shrink-0" 
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-theme-main truncate">{item.productName}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-theme-subtext">
                                {item.size && <span className="bg-theme-card px-1.5 py-0.5 rounded border border-theme-card">{item.size}</span>}
                                {item.color && <span className="bg-theme-card px-1.5 py-0.5 rounded border border-theme-card">{item.color}</span>}
                              </div>
                              <p className="text-xs font-extrabold text-theme-primary">
                                {(item.price * (currency?.exchangeRate || 1)).toFixed(2)} {currency?.symbol || 'ر.س'}
                              </p>
                            </div>

                            {/* Quantity Controls & Quick Delete Button */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center bg-theme-card border border-theme-card rounded-lg">
                                <button 
                                  onClick={() => updateQty(item.productID, -1)} 
                                  className="px-2 py-1 text-theme-main hover:text-theme-primary font-bold cursor-pointer transition-colors"
                                >
                                  -
                                </button>
                                <span className="px-2 text-xs font-bold text-theme-main">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQty(item.productID, 1)} 
                                  className="px-2 py-1 text-theme-main hover:text-theme-primary font-bold cursor-pointer transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              {/* Quick Delete Button with Smooth Transition */}
                              <button 
                                type="button"
                                onClick={() => removeItem(item.productID)}
                                title="حذف سريع للمنتج من السلة"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-500 rounded-lg transition-all cursor-pointer border border-rose-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Coupon Code Input */}
                    <div className="space-y-2 pt-2 border-t border-theme-card">
                      <label className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-theme-primary" />
                        <span>كوبون الخصم:</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode || ""}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="مثل: SHEIN20"
                          className="flex-1 bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main uppercase focus:outline-none focus:border-theme-primary font-mono"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 bg-theme-card hover:bg-theme-primary hover:text-white border border-theme-card text-theme-main font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          تطبيق
                        </button>
                      </div>
                      {appliedCoupon && (
                        <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          تم تطبيق الكوبون {appliedCoupon.CouponCode} بنجاح!
                        </p>
                      )}
                      {couponError && <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>}
                    </div>

                    {/* Customer Checkout Form */}
                    <form onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-theme-card">
                      {/* Order Type Toggle: Local vs Shipping */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-main block">اختر نوع الطلب والتوصيل:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderType('local')}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              orderType === 'local'
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-theme-inner border-theme-card text-theme-subtext hover:border-theme-primary/50'
                            }`}
                          >
                            <span className="text-sm">🏠</span>
                            <span>طلب محلي (مجاني)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderType('shipping')}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              orderType === 'shipping'
                                ? 'bg-sky-600/20 border-sky-500 text-sky-600 dark:text-sky-300 shadow-md ring-2 ring-sky-500/30'
                                : 'bg-theme-inner border-theme-card text-theme-subtext hover:border-theme-primary/50'
                            }`}
                          >
                            <span className="text-sm">🚚</span>
                            <span>شحن لجميع المناطق</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-main block">اختر دولة التوصيل:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setCustomerCountry('SA'); setCity('الرياض'); }}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              customerCountry === 'SA'
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-md'
                                : 'bg-theme-inner border-theme-card text-theme-subtext hover:border-theme-primary/50'
                            }`}
                          >
                            <span className="text-base">🇸🇦</span>
                            <span>السعودية</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setCustomerCountry('YE'); setCity('صنعاء'); }}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              customerCountry === 'YE'
                                ? 'bg-theme-primary/20 border-theme-primary text-theme-primary shadow-md'
                                : 'bg-theme-inner border-theme-card text-theme-subtext hover:border-theme-primary/50'
                            }`}
                          >
                            <span className="text-base">🇾🇪</span>
                            <span>اليمن</span>
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        value={customerName || ""}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="اسم العميل الكامل"
                        className="w-full bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          required
                          value={phone || ""}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="رقم الواتساب للتأكيد"
                          className="w-full bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                        />
                        <select
                          value={city || ""}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary cursor-pointer"
                        >
                          {customerCountry === 'SA' ? (
                            <>
                              <option value="الرياض" className="bg-theme-card text-theme-main">الرياض</option>
                              <option value="جدة" className="bg-theme-card text-theme-main">جدة</option>
                              <option value="الدمام" className="bg-theme-card text-theme-main">الدمام</option>
                              <option value="مكة المكرمة" className="bg-theme-card text-theme-main">مكة المكرمة</option>
                              <option value="المدينة المنورة" className="bg-theme-card text-theme-main">المدينة المنورة</option>
                            </>
                          ) : (
                            <>
                              <option value="صنعاء" className="bg-theme-card text-theme-main">صنعاء</option>
                              <option value="عدن" className="bg-theme-card text-theme-main">عدن</option>
                              <option value="تعز" className="bg-theme-card text-theme-main">تعز</option>
                              <option value="المكلا" className="bg-theme-card text-theme-main">المكلا</option>
                              <option value="إب" className="bg-theme-card text-theme-main">إب</option>
                            </>
                          )}
                        </select>
                      </div>

                      <input
                        type="text"
                        required
                        value={address || ""}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="عنوان التوصيل والحي"
                        className="w-full bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                      />

                      <select
                        value={paymentMethod || ""}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-theme-inner border border-theme-card rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary cursor-pointer"
                      >
                        <option value="مدى (Mada)" className="bg-theme-card text-theme-main">بطاقة مدى / ابل باي</option>
                        <option value="تحويل بنكي / النجم" className="bg-theme-card text-theme-main">تحويل بنكي / صرافة النجم</option>
                        <option value="الدفع عند الاستلام (COD)" className="bg-theme-card text-theme-main">الدفع عند الاستلام</option>
                      </select>

                      {/* Pricing Summary Table */}
                      <div className="bg-theme-inner p-3.5 rounded-2xl border border-theme-card space-y-1.5 text-xs text-theme-subtext">
                        <div className="flex justify-between">
                          <span>مجموع المنتجات:</span>
                          <span className="text-theme-main font-bold">{((subtotal || 0) * (currency?.exchangeRate || 1)).toFixed(2)} {currency?.symbol || 'ر.س'}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-theme-primary font-bold">
                            <span>الخصم المطبق:</span>
                            <span>-{((discountAmount || 0) * (currency?.exchangeRate || 1)).toFixed(2)} {currency?.symbol || 'ر.س'}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>رسوم الشحن:</span>
                          <span className="text-theme-main font-bold">
                            {orderType === 'local' ? (
                              'مجاني 🎉 (طلب محلي)'
                            ) : shippingFee === 0 ? (
                              'مجاني 🎉 (شحن)'
                            ) : (
                              `${((shippingFee || 0) * (currency?.exchangeRate || 1)).toFixed(2)} ${currency?.symbol || 'ر.س'}`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-black text-theme-main pt-2 border-t border-theme-card">
                          <span>الإجمالي النهائي:</span>
                          <span className="text-theme-primary">{((grandTotal || 0) * (currency?.exchangeRate || 1)).toFixed(2)} {currency?.symbol || 'ر.س'}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-theme-gradient hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-theme-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>تأكيد الطلب وإصدار الفاتورة</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
