import React, { useState, useRef } from 'react';
import { Receipt, Search, Printer, FileSpreadsheet, QrCode, X, Check, ShieldCheck, Download, Store, Phone, MapPin, Loader2 } from 'lucide-react';
import { Invoice, AppSettings } from '../../types';
import { exportInvoicesExcel } from '../../lib/excelHelper';
import { IdBadge } from './SimpleTabs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoicesTabProps {
  invoices: Invoice[];
  settings?: AppSettings;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ invoices, settings }) => {
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const filtered = invoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const parseInvoiceDateMs = (dStr: string): number => {
    if (!dStr) return 0;
    let dt = new Date(dStr);
    if (!isNaN(dt.getTime())) return dt.getTime();
    dt = new Date(dStr.replace(' ', 'T'));
    if (!isNaN(dt.getTime())) return dt.getTime();
    return 0;
  };

  const sortedInvoices = [...filtered].sort((a, b) => {
    const timeA = parseInvoiceDateMs(a.date);
    const timeB = parseInvoiceDateMs(b.date);
    if (timeA !== timeB) return timeB - timeA;
    return (b.invoiceNumber || b.InvoiceID || '').localeCompare(a.invoiceNumber || a.InvoiceID || '');
  });

  const storeName = settings?.storeName || 'المتجر الإلكتروني';
  const storeLogo = settings?.storeLogoUrl || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=80';
  const taxNum = settings?.taxNumber || '310123456700003';
  const storeAddress = settings?.storeAddress || 'الرياض / صنعاء - المملكة العربية السعودية واليمن';
  const saudiPhone = settings?.storePhoneSaudi || '966599539659';
  const yemenPhone = settings?.storePhoneYemen || '967715989357';

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="space-y-6 text-slate-100 dir-rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">إدارة الفواتير الضريبية ZATCA وطباعة PDF</h2>
          <p className="text-xs text-slate-400">سجل الفواتير الصادرة مع احتساب ضريبة القيمة المضافة 15% وإمكانية الطباعة المنسقة أو الحفظ كملف PDF</p>
        </div>

        <button
          onClick={() => exportInvoicesExcel(invoices)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>تصدير الفواتير XLSX</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم العميل..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs text-white pr-10 pl-4 py-2.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">رقم الفاتورة والتاريخ</th>
                <th className="p-3">اسم العميل والرقم الضريبي</th>
                <th className="p-3">تفاصيل المبيعات</th>
                <th className="p-3">مبلغ الضريبة (15%)</th>
                <th className="p-3">الإجمالي الشامل</th>
                <th className="p-3 text-center">QR Code</th>
                <th className="p-3 text-center">طباعة / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedInvoices.map(inv => (
                <tr key={inv.InvoiceID} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <IdBadge id={inv.invoiceNumber || inv.InvoiceID} color="indigo" tooltip="رقم الفاتورة (Invoice No/ID) - انقر للنسخ والبحث في شيت الفواتير" />
                      <p className="text-[10px] text-slate-500 font-mono">{inv.date}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-white">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">الضريبي: {inv.taxNumber || 'غير مسجل'}</p>
                  </td>
                  <td className="p-3">
                    <p className="max-w-xs truncate text-[11px] text-slate-300">{inv.itemsSummary}</p>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{inv.taxAmount.toFixed(2)} ر.س</td>
                  <td className="p-3 font-mono font-extrabold text-white">{inv.totalAmount.toFixed(2)} ر.س</td>
                  <td className="p-3 text-center">
                    {inv.qrCodeUrl && inv.qrCodeUrl.trim() ? (
                      <img src={inv.qrCodeUrl} alt="QR" className="w-8 h-8 rounded border border-slate-700 mx-auto" />
                    ) : (
                      <div className="w-8 h-8 rounded border border-slate-700 mx-auto flex items-center justify-center text-[9px] text-slate-500 font-mono">QR</div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-all flex items-center gap-1 mx-auto text-[11px]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZATCA Compliant PDF Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Receipt className="w-5 h-5" />
                <span>معاينة الفاتورة الضريبية ZATCA (تصدير وطباعة PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  title="تصدير الفاتورة كملف PDF عالي الدقة"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري تصدير PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تحميل فاتورة PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formatted Printable Invoice Document Box */}
            <div ref={invoicePrintRef} className="printable-invoice bg-white text-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 text-right space-y-6 font-sans">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {storeLogo && storeLogo.trim() ? (
                      <img src={storeLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-sm" />
                    ) : null}
                    <div>
                      <h1 className="text-xl font-black text-slate-900">{storeName}</h1>
                      <p className="text-xs text-slate-600 font-bold">Rwnaq Elegance Store</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 pt-2">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 inline" />
                      <span>{storeAddress}</span>
                    </p>
                    <p className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500 inline" />
                      <span>السعودية: +{saudiPhone} | اليمن: +{yemenPhone}</span>
                    </p>
                    <p className="font-bold text-slate-800 font-mono pt-1">
                      الرقم الضريبي للمتجر (VAT ID): {taxNum}
                    </p>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                    فاتورة ضريبية مبسطة
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Simplified Tax Invoice</p>
                  <p className="text-sm font-black text-indigo-700 font-mono pt-2">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-600 font-mono">{selectedInvoice.date}</p>
                </div>
              </div>

              {/* Customer & Transaction Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-bold">اسم العميل:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedInvoice.customerName}</p>
                  {selectedInvoice.taxNumber && (
                    <p className="text-[11px] text-slate-600 font-mono mt-1">
                      الرقم الضريبي للعميل: {selectedInvoice.taxNumber}
                    </p>
                  )}
                </div>

                <div className="text-left">
                  <span className="text-slate-500 block mb-0.5 font-bold">طريقة الدفع والموظف:</span>
                  <p className="font-bold text-slate-800">{selectedInvoice.paymentMethod || 'نقداً / Mada'}</p>
                  <p className="text-[11px] text-slate-600 mt-1">البائع: {selectedInvoice.employeeName}</p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="overflow-hidden border border-slate-300 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-3">البيان / المنتج</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">مبلغ الضريبة (15%)</th>
                      <th className="p-3 text-left">الإجمالي الشامل (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    <tr>
                      <td className="p-3 font-bold">{selectedInvoice.itemsSummary}</td>
                      <td className="p-3 text-center font-mono font-bold">1</td>
                      <td className="p-3 text-left font-mono">{selectedInvoice.taxAmount.toFixed(2)} ر.س</td>
                      <td className="p-3 text-left font-mono font-extrabold text-slate-900">{selectedInvoice.totalAmount.toFixed(2)} ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & ZATCA QR Footer */}
              <div className="flex items-end justify-between pt-2 gap-6">
                <div className="flex items-center gap-3 border border-slate-200 p-3 rounded-xl bg-slate-50">
                  {selectedInvoice.qrCodeUrl && selectedInvoice.qrCodeUrl.trim() ? (
                    <img src={selectedInvoice.qrCodeUrl} alt="ZATCA QR" className="w-20 h-20 rounded border border-slate-300 bg-white p-1" />
                  ) : null}
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      رمز التحقق الضريبي المعتمد (ZATCA QR)
                    </p>
                    <p>مفرّغ إلكترونياً وهيئة الزكاة والضريبة والجمارك</p>
                    <p className="font-mono text-slate-500">{selectedInvoice.InvoiceID}</p>
                  </div>
                </div>

                <div className="w-64 space-y-2 text-xs font-bold text-slate-800">
                  {selectedInvoice.taxAmount > 0 ? (
                    <>
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-600">المجموع غير شامل الضريبة:</span>
                        <span className="font-mono">{(selectedInvoice.totalAmount - selectedInvoice.taxAmount).toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-600">ضريبة القيمة المضافة:</span>
                        <span className="font-mono text-indigo-700">+{selectedInvoice.taxAmount.toFixed(2)} ر.س</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-emerald-700">
                      <span>حالة السعر:</span>
                      <span>سعر نهائي شامل وبدون ضريبة إضافية</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono text-slate-900">{selectedInvoice.totalAmount.toFixed(2)} ر.س</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="text-center text-[10px] text-slate-500 border-t border-slate-200 pt-4 space-y-1">
                <p className="font-bold">شكراً لتسوقكم من {storeName} - نسعد بفرصة خدمتكم دائماً</p>
                <p>البضاعة المباعة ترجع وتستبدل خلال 14 يوماً من تاريخ الفاتورة مع إحضار الفاتورة الأصلية</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

