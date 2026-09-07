import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Barcode, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Layers,
  CheckCircle2,
  Database,
  Clock,
  BookOpen,
  Printer,
  Star
} from 'lucide-react';
import { Product, Category } from '../../types';
import { exportProductsExcel, parseProductsExcel, exportToExcel } from '../../lib/excelHelper';
import { compressAndResizeImage, DEFAULT_PRODUCT_IMAGE, normalizeImageUrl } from '../../lib/imageUtils';
import { parseAnyDate, formatRelativeTime, formatCleanDate, formatDMYDate } from '../../lib/dateUtils';
import { IdBadge } from './SimpleTabs';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  settings?: any; // AppSettings
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory?: (c: Category) => void;
  onBatchImport?: (products: Product[]) => void;
  onSeedProductsToSupabase?: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  categories,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onBatchImport,
  onSeedProductsToSupabase
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Excel Sync Engine Modal States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelSuccess, setExcelSuccess] = useState(false);

  // Supplier Catalog PDF State
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [isExportingCatalog, setIsExportingCatalog] = useState(false);
  const catalogPrintRef = useRef<HTMLDivElement>(null);

  const handleExportCatalogPdf = async () => {
    if (!catalogPrintRef.current) return;
    setIsExportingCatalog(true);
    try {
      const canvas = await html2canvas(catalogPrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      const storeNameStr = settings?.storeName || 'اوفالي';
      pdf.save(`Catalog_${storeNameStr}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating Catalog PDF:', err);
    } finally {
      setIsExportingCatalog(false);
    }
  };

  const handlePrintCatalogDirectly = () => {
    const storeNameStr = settings?.storeName || 'اوفالي';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الكتالوج');
      return;
    }
    
    let itemsHtml = '';
    products.forEach((p) => {
      const imgUrl = p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=150';
      itemsHtml += `
        <div class="product-card">
          <img src="${imgUrl}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=150'" />
          <div class="product-info">
            <div class="product-name">${p.name}</div>
            <div class="product-category">${p.category || 'عام'}</div>
            <div class="product-sku">الباركود: ${p.SKU || 'N/A'}</div>
            <div class="product-prices">
              <span class="cost">التكلفة: ${p.costPrice || 0} ر.س</span>
              <span class="sale">البيع: ${p.salePrice || 0} ر.س</span>
            </div>
            <div class="product-stock">المخزن: ${p.quantity || 0} قطعة</div>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>كتالوج المنتجات - ${storeNameStr}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #fff;
            color: #000;
            padding: 20px;
            margin: 0;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
          }
          .header p {
            margin: 0;
            color: #555;
            font-size: 14px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .product-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            background: #fff;
            page-break-inside: avoid;
          }
          .product-card img {
            width: 100%;
            height: 150px;
            object-fit: contain;
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
            background: #fafafa;
          }
          .product-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
            height: 36px;
            overflow: hidden;
          }
          .product-category {
            font-size: 11px;
            color: #666;
            margin-bottom: 6px;
          }
          .product-sku {
            font-size: 11px;
            font-family: monospace;
            color: #444;
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .product-prices {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-top: auto;
            border-top: 1px dashed #eee;
            padding-top: 8px;
          }
          .product-prices .cost {
            color: #c00;
            font-weight: bold;
          }
          .product-prices .sale {
            color: #080;
            font-weight: bold;
          }
          .product-stock {
            font-size: 11px;
            color: #555;
            margin-top: 4px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>كتالوج المنتجات الرسمي للموردين</h1>
          <p>المتجر: ${storeNameStr} | تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
          <p>إجمالي المنتجات المكتنزة: ${products.length} منتج</p>
        </div>
        <div class="grid">
          ${itemsHtml}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Quick category inline creation state
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // New product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'فساتين أنيقة');
  const [costPrice, setCostPrice] = useState<number | string>(50);
  const [originalPrice, setOriginalPrice] = useState<number | string>(0);
  const [salePrice, setSalePrice] = useState<number | string>(120);
  const [discount, setDiscount] = useState<number | string>(0);
  const [quantity, setQuantity] = useState<number | string>(30);
  const [minStock, setMinStock] = useState<number | string>(5);
  const [imagesList, setImagesList] = useState<string[]>([
    '',
    ''
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const compressed = await compressAndResizeImage(file as File, 450, 0.65, 35000);
      if (compressed) {
        setImagesList((prev) => {
          const next = [prev[0] || '', prev[1] || ''];

          if (!next[0] || next[0].includes('unsplash.com')) {
            next[0] = compressed;
          } else {
            next[1] = compressed;
          }
          return next;
        });
      }
    }
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl || !newImageUrl.trim()) return;
    const raw = newImageUrl.trim();
    const splitUrls = raw.includes('|')
      ? raw.split('|').map(s => normalizeImageUrl(s.trim())).filter(Boolean)
      : [normalizeImageUrl(raw)];

    setImagesList((prev) => {
      const next = [prev[0] || '', prev[1] || ''];

      splitUrls.forEach(url => {
        if (!url) return;
        if (!next[0] || next[0].includes('unsplash.com')) {
          next[0] = url;
        } else if (!next[1] || next[1].includes('unsplash.com')) {
          next[1] = url;
        } else {
          next[1] = url;
        }
      });
      return next;
    });
    setNewImageUrl('');
  };

  const handleSlotFileUpload = async (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressAndResizeImage(file, 450, 0.65, 35000);
    if (compressed) {
      setImagesList((prev) => {
        const next = [prev[0] || '', prev[1] || ''];
        next[slotIdx] = compressed;
        return next;
      });
    }
    e.target.value = '';
  };

  // Direct Product List Row Image Controls (Upload, Delete, Replace 2 Images with Excel/Sheets Auto-Sync)
  const handleRowImageUpload = async (product: Product, slotIdx: number, file: File) => {
    const compressed = await compressAndResizeImage(file, 450, 0.65, 35000);
    if (!compressed) return;

    const currentImgs = Array.isArray(product.images) ? [...product.images] : [];
    while (currentImgs.length < 2) currentImgs.push('');
    currentImgs[slotIdx] = compressed;

    onUpdateProduct({
      ...product,
      images: [currentImgs[0] || '', currentImgs[1] || '']
    });
  };

  const handleRowImageDelete = (product: Product, slotIdx: number) => {
    const currentImgs = Array.isArray(product.images) ? [...product.images] : [];
    while (currentImgs.length < 2) currentImgs.push('');
    currentImgs[slotIdx] = '';

    onUpdateProduct({
      ...product,
      images: [currentImgs[0] || '', currentImgs[1] || '']
    });
  };

  const handleRowImageUrl = (product: Product, slotIdx: number) => {
    const currentImgs = Array.isArray(product.images) ? [...product.images] : [];
    while (currentImgs.length < 2) currentImgs.push('');
    const url = prompt(`أدخل رابط صورة ${slotIdx + 1} (الرئيسية/الثانوية):`, currentImgs[slotIdx] || '');
    if (url !== null) {
      const normalized = normalizeImageUrl(url.trim());
      currentImgs[slotIdx] = normalized;
      onUpdateProduct({
        ...product,
        images: [currentImgs[0] || '', currentImgs[1] || '']
      });
    }
  };

  const handleSlotUrlPrompt = (slotIdx: number) => {
    const currentUrl = imagesList[slotIdx] || '';
    const url = prompt(`أدخل رابط صورة ${slotIdx + 1} (الرئيسية/الثانوية):`, currentUrl);
    if (url !== null) {
      const normalized = normalizeImageUrl(url.trim());
      setImagesList((prev) => {
        const next = [prev[0] || '', prev[1] || ''];
        next[slotIdx] = normalized;
        return next;
      });
    }
  };

  const handleSlotDelete = (slotIdx: number) => {
    setImagesList((prev) => {
      const next = [prev[0] || '', prev[1] || ''];
      next[slotIdx] = '';
      return next;
    });
  };

  const filtered = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const timeA = (a.createdAt || a.updatedAt) ? parseAnyDate(a.createdAt || a.updatedAt).getTime() : 0;
        const timeB = (b.createdAt || b.updatedAt) ? parseAnyDate(b.createdAt || b.updatedAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return (b.ProductID || '').localeCompare(a.ProductID || '');
      })
      .filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.SKU.toLowerCase().includes(search.toLowerCase())
      );
  }, [products, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (!editingProduct && settings?.planMaxProducts && settings.planMaxProducts > 0 && products.length >= settings.planMaxProducts) {
      alert(`ممنوع الإضافة! لقد وصلت للحد الأقصى المسموح به للمنتجات (${settings.planMaxProducts} منتج). يرجى التواصل مع إدارة المتجر للتخزين والترقية.`);
      return;
    }

    const finalImages = [
      imagesList[0] || '',
      imagesList[1] || ''
    ];

    const newProd: Product = {
      ProductID: editingProduct ? editingProduct.ProductID : `PRD_${Date.now()}`,
      name,
      SKU: editingProduct ? editingProduct.SKU : `SHN-${Math.floor(100 + Math.random() * 900)}`,
      Barcode: editingProduct ? editingProduct.Barcode : `6291100${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      costPrice: Number(costPrice),
      originalPrice: Number(originalPrice) || undefined,
      salePrice: Number(salePrice),
      wholesalePrice: Number(salePrice) * 0.8,
      discount: Number(discount),
      quantity: Number(quantity),
      minStock: Number(minStock),
      images: finalImages,
      description: description || name,
      status: Number(quantity) > 0 ? 'active' : 'out_of_stock',
      createdAt: editingProduct ? (editingProduct.createdAt || new Date().toISOString()) : new Date().toISOString(),
      size: ['S', 'M', 'L', 'XL'],
      color: ['ألوان متعددة']
    };

    if (editingProduct) {
      onUpdateProduct(newProd);
    } else {
      onAddProduct(newProd);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setName('');
    setCostPrice(50);
    setSalePrice(120);
    setDiscount(0);
    setQuantity(30);
    setMinStock(5);
    setImagesList(['', '']);
    setNewImageUrl('');
    setDescription('');
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setOriginalPrice(p.originalPrice || 0);
    setSalePrice(p.salePrice);
    setDiscount(p.discount);
    setQuantity(p.quantity);
    setMinStock(p.minStock);
    const pImages = p.images || [];
    setImagesList([
      pImages[0] || '',
      pImages[1] || ''
    ]);
    setDescription(p.description);
    setShowAddModal(true);
  };

  // Excel File Upload & Parser Engine
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelLoading(true);
    setExcelSuccess(false);
    setExcelErrors([]);

    try {
      const result = await parseProductsExcel(file);
      setParsedProducts(result.products);
      if (result.errors && result.errors.length > 0) {
        setExcelErrors(result.errors);
      }
    } catch (err: any) {
      setExcelErrors([err.message || 'حدث خطأ أثناء معالجة ملف الإكسل']);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleConfirmExcelImport = () => {
    if (parsedProducts.length === 0) return;
    
    if (settings?.planMaxProducts && settings.planMaxProducts > 0) {
      if ((products.length + parsedProducts.length) > settings.planMaxProducts) {
        alert(`عذراً، باقتك الحالية تسمح بإضافة ${settings.planMaxProducts} منتج كحد أقصى. أنت تحاول استيراد ${parsedProducts.length} منتج ولديك ${products.length} منتج سابق. الرجاء تقليل عدد المنتجات في الملف أو ترقية الباقة.`);
        return;
      }
    }

    if (onBatchImport) {
      onBatchImport(parsedProducts);
    }
    setExcelSuccess(true);
    setParsedProducts([]);
    setTimeout(() => {
      setShowExcelModal(false);
      setExcelSuccess(false);
    }, 1800);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'الرمز_المميز (ID)': 'PRD_SAMPLE_001',
        'اسم_المنتج': 'فستان سهرة دانتيل أنيق',
        'رمز_المنتج (SKU)': 'SHN-DRS-099',
        'الباركود': '629110009999',
        'المجموعة': 'مجموعة الأزياء والفساتين',
        'حالة_المجموعة': 'ظاهر (1)',
        'القسم_الفئة': 'فساتين سهرة',
        'حالة_القسم': 'ظاهر (1)',
        'سعر_البيع': 180,
        'سعر_الشراء_التكلفة': 60,
        'سعر_الجملة': 140,
        'الخصم (%)': 10,
        'الكمية_المتاحة': 50,
        'الحد_الأدنى': 5,
        'حالة_المنتج_والتوفر': 'متوفر',
        'حالة_الظهور_بالمتجر': 'ظاهر (1)',
        'صورة_1': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
        'صورة_2': '',
        'صورة_3': '',
        'الوصف': 'فستان دانتيل ناعم بتصميم حصري فاخر',
        'تاريخ_الرفع': new Date().toISOString().split('T')[0]
      },
      {
        'الرمز_المميز (ID)': 'PRD_SAMPLE_002',
        'اسم_المنتج': 'عطر مخلط ملكي فاخر',
        'رمز_المنتج (SKU)': 'SHN-PRF-008',
        'الباركود': '629110008888',
        'المجموعة': 'مجموعة العطور والبخور',
        'حالة_المجموعة': 'ظاهر (1)',
        'القسم_الفئة': 'عطور شرقية',
        'حالة_القسم': 'ظاهر (1)',
        'سعر_البيع': 250,
        'سعر_الشراء_التكلفة': 90,
        'سعر_الجملة': 190,
        'الخصم (%)': 15,
        'الكمية_المتاحة': 30,
        'الحد_الأدنى': 5,
        'حالة_المنتج_والتوفر': 'متوفر',
        'حالة_الظهور_بالمتجر': 'ظاهر (1)',
        'صورة_1': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
        'صورة_2': '',
        'صورة_3': '',
        'الوصف': 'عطر شرقي فاخر بتركيز عالي وثبات ممتد',
        'تاريخ_الرفع': new Date().toISOString().split('T')[0]
      }
    ];
    exportToExcel(sampleData, 'قالب_المنتجات_والفئات_والمجموعات_الموحد', 'المنتجات_والفئات_والمجموعات');
  };

  const existingCategoryNames = new Set(categories.map(c => c.name.trim().toLowerCase()));
  const existingSKUs = new Set(products.map(p => (p.SKU || '').trim().toLowerCase()));

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">إدارة المنتجات والمخزون</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              إجمالي: {products.length} منتج
            </span>
          </div>
          <p className="text-xs text-slate-400">إضافة وتعديل المنتجات والمخزون مع المزامنة التلقائية عبر Excel و Google Sheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Product Catalog as PDF for Suppliers */}
          <button
            onClick={() => setShowCatalogModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            title="تصدير قائمة المنتجات الحالية ككتالوج PDF منسق للطباعة والموردين"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span>كتالوج المنتجات PDF</span>
          </button>

          {/* Export Products to Excel */}
          <button
            onClick={() => exportProductsExcel(products, categories, settings?.storeName)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="تصدير جدول المنتجات والفئات والمجموعات الموحد إلى ملف Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير إلى Excel</span>
          </button>

          {/* Import & Upsert Products from Excel Engine */}
          <button
            onClick={() => {
              setParsedProducts([]);
              setExcelErrors([]);
              setExcelSuccess(false);
              setShowExcelModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
            title="استيراد وتحديث المنتجات عبر Excel مع إنشاء الفئات والمزامنة (Upsert)"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>استيراد وتحديث Excel</span>
          </button>

          {/* Add Product Manually */}
          <button
            onClick={() => {
              if (settings?.planMaxProducts && settings.planMaxProducts > 0 && products.length >= settings.planMaxProducts) {
                alert(`ممنوع الإضافة! لقد وصلت للحد الأقصى المسموح به للمنتجات (${settings.planMaxProducts} منتج). يرجى التواصل مع إدارة المتجر للتخزين والترقية.`);
                return;
              }
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، التصنيف أو الباركود..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs text-white pr-10 pl-4 py-2.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Products Table Container with Horizontal Scroll */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl w-full max-w-full">
        <div className="overflow-x-auto overflow-y-hidden w-full touch-pan-x scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-right text-xs text-slate-300 min-w-[850px] border-collapse">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 whitespace-nowrap sticky top-0 z-10">
              <tr>
                <th className="p-3 font-bold">الصور (صورتان حسب الإكسل)</th>
                <th className="p-3 font-bold">اسم المنتج والتصنيف</th>
                <th className="p-3 font-bold">SKU / الباركود</th>
                <th className="p-3 font-bold">التكلفة</th>
                <th className="p-3 font-bold">سعر البيع</th>
                <th className="p-3 font-bold">الخصم</th>
                <th className="p-3 font-bold">التقييمات</th>
                <th className="p-3 font-bold">المخزون المتاح</th>
                <th className="p-3 font-bold">تاريخ الرفع ومدة العرض</th>
                <th className="p-3 text-center font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 whitespace-nowrap">
              {filtered.map((p, pIdx) => (
                <tr key={`${p.ProductID || 'prd'}_${pIdx}`} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1].map((slotIdx) => {
                        const rawUrl = p.images && p.images[slotIdx];
                        const imgUrl = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : '';
                        return (
                          <div key={slotIdx} className="relative group/slot w-10 h-12 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden shrink-0">
                            {imgUrl ? (
                              <>
                                <img 
                                  src={imgUrl} 
                                  alt={`${p.name} - ${slotIdx === 0 ? 'رئيسية' : 'ثانوية'}`} 
                                  onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                                  className="w-full h-full object-cover" 
                                />
                                <span className="absolute top-0.5 right-0.5 bg-slate-950/80 text-amber-300 text-[8px] font-bold px-1 rounded backdrop-blur-xs z-10">
                                  {slotIdx === 0 ? '1⭐' : '2'}
                                </span>
                                <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover/slot:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 p-0.5 z-20">
                                  <button
                                    type="button"
                                    onClick={() => handleRowImageUrl(p, slotIdx)}
                                    className="text-[7.5px] text-indigo-200 hover:text-white font-bold bg-indigo-600/80 hover:bg-indigo-600 w-full text-center py-0.5 rounded transition-all"
                                    title="تعديل الرابط"
                                  >
                                    رابط
                                  </button>
                                  <label className="cursor-pointer text-[7.5px] text-pink-200 hover:text-white font-bold bg-pink-600/80 hover:bg-pink-600 w-full text-center py-0.5 rounded transition-all">
                                    رفع
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleRowImageUpload(p, slotIdx, file);
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRowImageDelete(p, slotIdx)}
                                    className="text-[7.5px] text-rose-300 hover:text-white font-bold bg-rose-600/80 hover:bg-rose-600 w-full text-center py-0.5 rounded transition-all"
                                    title="حذف الصورة"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center relative group/empty">
                                <label className="w-full h-full flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/40 cursor-pointer transition-all">
                                  <span className="text-[10px] font-bold">+</span>
                                  <span className="text-[7px] text-slate-400 font-bold">{slotIdx === 0 ? 'صورة 1' : 'صورة 2'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleRowImageUpload(p, slotIdx, file);
                                      e.target.value = '';
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRowImageUrl(p, slotIdx)}
                                  className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-indigo-400 hover:text-white hover:bg-indigo-600 text-[7px] font-bold py-0.5 opacity-0 group-hover/empty:opacity-100 transition-opacity text-center"
                                  title="إضافة رابط"
                                >
                                  🔗
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-white max-w-xs truncate">{p.name}</p>
                    <span className="text-[10px] text-pink-400 font-semibold">{p.category}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <IdBadge id={p.SKU || p.ProductID} color="indigo" tooltip="رمز المنتج (SKU/ID) - انقر للنسخ والبحث في شيت المنتجات" />
                      {p.Barcode && <span className="text-[10px] text-slate-500 font-mono">باركود: {p.Barcode}</span>}
                    </div>
                  </td>
                  <td className="p-3 font-mono">{(Number(p.costPrice) || 0).toFixed(2)} ر.س</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    <div className="flex flex-col">
                      <span>{(Number(p.salePrice) || 0).toFixed(2)} ر.س</span>
                      {Number(p.originalPrice) > Number(p.salePrice) ? (
                        <span className="text-[10px] text-slate-500 line-through">{(Number(p.originalPrice) || 0).toFixed(2)} ر.س</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3">
                    {p.discount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold text-[10px]">
                        {p.discount}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 w-fit text-[11px]" title={`عدد التقييمات: ${p.ratingCount || (p.ratings ? p.ratings.length : 1)}`}>
                      <Star className="w-3 h-3 fill-current shrink-0" />
                      <span>{(p.rating || (p.ratings && p.ratings.length > 0 ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) : 5)).toFixed(1)}</span>
                      <span className="text-[9.5px] text-slate-400 font-mono">({p.ratingCount || (p.ratings ? p.ratings.length : 1)})</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.quantity <= p.minStock
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {p.quantity} قطعة
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1" title={`تاريخ النشر الفعلي: ${formatDMYDate(p.createdAt || p.updatedAt)} (تاريخ ثابت)`}>
                      <span className="text-[11px] text-white font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 w-fit">
                        {formatDMYDate(p.createdAt || p.updatedAt)}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
                        <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        <span>{formatRelativeTime(p.createdAt || p.updatedAt)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.ProductID)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg my-8 p-6 space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={resetForm}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-white">
              {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">اسم المنتج:</label>
                <input
                  type="text"
                  required
                  value={name || ""}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فستان سهرة مخمل أنيق"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category & Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-bold">التصنيف (القسم):</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة قسم جديد</span>
                  </button>
                </div>

                {showQuickAddCat ? (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCatName || ""}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="اسم القسم الجديد..."
                      className="flex-1 bg-slate-950 border border-indigo-500 rounded-xl p-2 text-white focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCatName.trim()) return;
                        const createdCat: Category = {
                          CategoryID: `CAT_${Date.now()}`,
                          name: newCatName.trim(),
                          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
                          description: 'قسم جديد'
                        };
                        if (onAddCategory) onAddCategory(createdCat);
                        setCategory(createdCat.name);
                        setNewCatName('');
                        setShowQuickAddCat(false);
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <select
                    value={category || ""}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.CategoryID} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product Images (Full Width - 2 Dedicated Excel/Sheets Image Columns) */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold text-xs">
                    صور المنتج (صورتين كحد أقصى - رفع من الجهاز أو رابط مباشر):
                  </label>
                  <span className="text-[11px] font-bold text-pink-400 bg-pink-950/60 px-2.5 py-0.5 rounded-full border border-pink-800/50">
                    {[imagesList[0], imagesList[1]].filter(s => s && s.trim().length > 0).length} / 2 صورة
                  </span>
                </div>
                
                {/* Upload controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={newImageUrl || ""}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="ضع رابط الصورة هنا (مثل رابط Google Drive أو مباشر)... ثم اضغط إضافة"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-pink-500 text-xs font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!newImageUrl || !newImageUrl.trim()}
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/70 disabled:text-slate-500 disabled:border-slate-800 text-white border border-indigo-500/40 rounded-xl font-bold transition-all text-xs whitespace-nowrap cursor-pointer shadow-md flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة رابط</span>
                    </button>
                    <label className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white cursor-pointer rounded-xl font-bold transition-all text-xs text-center whitespace-nowrap flex items-center justify-center gap-1 shadow-md">
                      <span>📁 رفع من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 2 Dedicated Image Slots Grid (matching Excel Dual Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[0, 1].map((slotIdx) => {
                    const rawUrl = imagesList[slotIdx];
                    const imgUrl = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : '';
                    return (
                      <div 
                        key={slotIdx} 
                        className={`relative rounded-2xl border p-2.5 flex flex-col items-center justify-between transition-all ${
                          imgUrl ? 'border-pink-500/50 bg-slate-950/90 shadow-lg' : 'border-slate-800/80 bg-slate-950/40'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between mb-1.5 px-1">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                            {slotIdx === 0 ? 'صورة 1 ⭐ (الرئيسية بالأكسل)' : 'صورة 2 (الثانوية بالأكسل)'}
                          </span>
                          {imgUrl && (
                            <button
                              type="button"
                              onClick={() => handleSlotDelete(slotIdx)}
                              className="p-1 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors"
                              title="حذف هذه الصورة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Image Preview or Placeholder Container */}
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative group">
                          {imgUrl ? (
                            <>
                              <img 
                                src={imgUrl} 
                                alt={`صورة ${slotIdx + 1}`} 
                                onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                                <label className="p-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-md">
                                  تغيير
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSlotFileUpload(slotIdx, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleSlotDelete(slotIdx)}
                                  className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md"
                                >
                                  حذف
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-slate-500 text-center space-y-1.5">
                              <ImageIcon className="w-7 h-7 opacity-40 text-slate-400" />
                              <span className="text-[10px] text-slate-400 font-bold">
                                {slotIdx === 0 ? 'صورة 1 فارغة (الرئيسية)' : 'صورة 2 فارغة (الثانوية)'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons for each slot */}
                        <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
                          <label className="w-full py-1.5 px-1 bg-slate-900 hover:bg-pink-600 text-slate-200 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all text-center flex items-center justify-center gap-1 border border-slate-800 shadow-xs">
                            <span>📁 رفع</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSlotFileUpload(slotIdx, e)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleSlotUrlPrompt(slotIdx)}
                            className="w-full py-1.5 px-1 bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-[10px] font-bold transition-all text-center border border-slate-800 shadow-xs"
                          >
                            🔗 رابط
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">سعر التكلفة:</label>
                  <input
                    type="number"
                    value={costPrice ?? ""}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سعر البيع القديم:</label>
                  <input
                    type="number"
                    value={originalPrice ?? ""}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="اختياري"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سعر البيع:</label>
                  <input
                    type="number"
                    value={salePrice ?? ""}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">نسبة الخصم (%):</label>
                  <input
                    type="number"
                    value={discount ?? ""}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">الكمية بالمخزون:</label>
                  <input
                    type="number"
                    value={quantity ?? ""}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الحد الأدنى للتنبيه:</label>
                  <input
                    type="number"
                    value={minStock ?? ""}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">وصف المنتج:</label>
                <textarea
                  rows={2}
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Sync Engine Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl dir-rtl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>استيراد وتحديث المنتجات من Excel</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                      Excel Sync Engine v2.5
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    دعم صيغ .xlsx و .csv مع الإنشاء التلقائي للفئات غير الموجودة والمزامنة بواسطة رمز SKU
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions & Template Download */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-emerald-400">💡 تعليمات المزامنة الذكية:</p>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                  <li>المجالات المدعومة: (SKU, Name, Category, Price, Cost, Stock, Image_URL, Description, Status)</li>
                  <li>إذا كانت الفئة غير موجودة بالنظام، سيتم إنشاؤها تلقائياً وتعيين ID خاص بها.</li>
                  <li>يتم استخدام رمز الـ SKU كمعرف فريد لمنع التكرار وتحديث المنتج السابق أو إضافة الجديد.</li>
                </ul>
              </div>
              <button
                onClick={downloadSampleTemplate}
                className="whitespace-nowrap px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>تحميل قالب Excel نموذجي</span>
              </button>
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center transition-all bg-slate-950/40 relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    اضغط هنا لاختيار ملف الإكسل أو اسحبه وإسقطه هنا
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    صيغ الملفات المقبولة: XLSX, XLS, CSV (حجم أقصى 15 ميجابايت)
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {excelLoading && (
              <div className="flex items-center justify-center gap-3 p-6 text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">جاري تحليل ملف الإكسل ومطابقة المنتجات والفئات...</span>
              </div>
            )}

            {/* Success Banner */}
            {excelSuccess && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-bold animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>تمت المزامنة وحفظ المنتجات والفئات بنجاح في قاعدة البيانات ومتجر النظام!</span>
              </div>
            )}

            {/* Error Messages */}
            {excelErrors.length > 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  تنبيهات أثناء القراءة:
                </p>
                {excelErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            {/* Parsed Products Summary & Preview Table */}
            {parsedProducts.length > 0 && !excelLoading && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                
                {/* Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">إجمالي المنتجات بالملف</span>
                    <span className="text-lg font-bold text-white">{parsedProducts.length}</span>
                  </div>

                  <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block font-semibold">منتجات سيتم تحديثها (Upsert)</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {parsedProducts.filter(p => p.SKU && existingSKUs.has(p.SKU.trim().toLowerCase())).length}
                    </span>
                  </div>

                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <span className="text-[10px] text-indigo-400 block font-semibold">منتجات جديدة ستم إضافتها</span>
                    <span className="text-lg font-bold text-indigo-300">
                      {parsedProducts.filter(p => !p.SKU || !existingSKUs.has(p.SKU.trim().toLowerCase())).length}
                    </span>
                  </div>

                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block font-semibold">فئات سيتم إنشاؤها تلقائياً</span>
                    <span className="text-lg font-bold text-amber-300">
                      {Array.from(new Set(parsedProducts.map(p => p.category?.trim().toLowerCase()).filter(Boolean)))
                        .filter(cat => !existingCategoryNames.has(cat)).length}
                    </span>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">اسم المنتج</th>
                        <th className="p-2.5">الفئة</th>
                        <th className="p-2.5">سعر البيع</th>
                        <th className="p-2.5">المخزون</th>
                        <th className="p-2.5">نوع العملية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {parsedProducts.slice(0, 15).map((p, idx) => {
                        const isUpdate = p.SKU && existingSKUs.has(p.SKU.trim().toLowerCase());
                        const isNewCategory = p.category && !existingCategoryNames.has(p.category.trim().toLowerCase());

                        return (
                          <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2.5 font-mono text-indigo-300">{p.SKU || 'تلقائي'}</td>
                            <td className="p-2.5 font-bold">{p.name}</td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isNewCategory 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {isNewCategory && <Sparkles className="w-3 h-3 text-amber-400" />}
                                {p.category || 'عام'}
                                {isNewCategory && ' (جديد)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-emerald-400 font-bold">{p.salePrice} ر.س</td>
                            <td className="p-2.5">{p.quantity} قطعة</td>
                            <td className="p-2.5">
                              {isUpdate ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  🔄 تحديث بيانات
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  ✨ منتج جديد
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    سيتم حفظ البيانات ومزامنتها فورياً مع Google Sheets وتحديث المتجر.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setParsedProducts([])}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      إلغاء والمعاودة
                    </button>
                    <button
                      onClick={handleConfirmExcelImport}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>اعتماد المزامنة واستيراد {parsedProducts.length} منتج</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Supplier Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 space-y-4 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white">معاينة كتالوج المنتجات قبل الطباعة والتحميل</h3>
                  <p className="text-[10px] text-slate-400">تصدير {products.length} منتج ككتالوج مرتب للموردين</p>
                </div>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print and Download Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-xs text-slate-400 leading-relaxed">
                💡 تم توفير طريقتين للتصدير: تنزيل ملف PDF مباشر أو الطباعة المستقلة بدقة متناهية لتجاوز مشاكل حجب المتصفحات.
              </span>
              <div className="flex gap-2">
                {/* Download PDF via canvas */}
                <button
                  onClick={handleExportCatalogPdf}
                  disabled={isExportingCatalog}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  {isExportingCatalog ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تنزيل كملف PDF</span>
                    </>
                  )}
                </button>

                {/* Direct Standalone Print Window */}
                <button
                  onClick={handlePrintCatalogDirectly}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكتالوج</span>
                </button>
              </div>
            </div>

            {/* Scrollable Live Printable Preview Area */}
            <div className="border border-slate-800 rounded-2xl bg-white text-slate-950 p-6 overflow-y-auto max-h-[50vh] scrollbar-thin">
              <div ref={catalogPrintRef} className="space-y-6 bg-white p-4">
                {/* Catalog Header */}
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <h2 className="text-xl font-extrabold tracking-tight">{settings?.storeName || 'اوفالي'}</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">كتالوج المنتجات الرسمي والمخزون الحالي للموردين</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">تاريخ التصدير: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div key={p.OrderID || p.id} className="border border-slate-200 rounded-xl p-3 flex flex-col bg-white">
                      <div className="w-full h-32 bg-slate-50 rounded-lg overflow-hidden border mb-2 flex items-center justify-center">
                        <img 
                          src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=150'} 
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=150';
                          }}
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 h-8 leading-tight">{p.name}</h4>
                        <span className="inline-block text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {p.category || 'عام'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          الباركود: {p.SKU || 'N/A'}
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold border-t border-dashed pt-2 mt-2">
                          <span className="text-rose-600">التكلفة: {p.costPrice} ر.س</span>
                          <span className="text-emerald-600">البيع: {p.salePrice} ر.س</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          الكمية المتوفرة: {p.quantity} قطعة
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
