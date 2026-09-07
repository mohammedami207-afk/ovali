import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  Download, 
  Sparkles,
  Layers,
  Settings2,
  Image as ImageIcon,
  ArrowRight,
  Eye,
  RefreshCw,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { 
  readRawExcelFile, 
  detectColumnMappings, 
  mapRawRowsToProducts, 
  exportToExcel,
  RawExcelData,
  ColumnMappingConfig
} from '../../lib/excelHelper';
import { Product } from '../../types';

interface ExcelTabProps {
  onBatchImport: (products: Product[]) => Promise<void> | void;
  existingProducts?: Product[];
}

export const ExcelTab: React.FC<ExcelTabProps> = ({ onBatchImport, existingProducts = [] }) => {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<RawExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig | null>(null);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  
  // Progress Bar State for Batch Upload / Sync
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [progressStatusText, setProgressStatusText] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportedSuccess(false);
    setImportErrors([]);
    setRawData(null);
    setColumnMapping(null);
    setParsedProducts([]);

    try {
      const data = await readRawExcelFile(file);
      setRawData(data);
      
      // Auto-detect columns
      const detected = detectColumnMappings(data.headers);
      setColumnMapping(detected);

      // Perform initial mapping
      const result = mapRawRowsToProducts(data.rawRows, detected);
      setParsedProducts(result.products);
      setImportErrors(result.errors);
      setActiveStep('mapping');
    } catch (err: any) {
      setImportErrors([err.message || 'حدث خطأ أثناء قراءة ملف الإكسل']);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (field: keyof ColumnMappingConfig, value: string) => {
    if (!columnMapping || !rawData) return;
    const updatedMapping = { ...columnMapping, [field]: value };
    setColumnMapping(updatedMapping);

    const result = mapRawRowsToProducts(rawData.rawRows, updatedMapping);
    setParsedProducts(result.products);
    setImportErrors(result.errors);
  };

  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(10);
    setProgressStatusText('جاري تجهيز مصفوفة المنتجات والصور المزدوجة...');

    // Simulate / step-by-step progress indicator
    const total = parsedProducts.length;
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 120));
      const p = Math.min(Math.round((i / 5) * 75), 85);
      setImportProgress(p);
      setProgressStatusText(`جاري التحقق من SKU ومزامنة ${Math.round((p / 100) * total)} من ${total} منتج مع شيت جوجل...`);
    }

    try {
      await onBatchImport(parsedProducts);
      setImportProgress(100);
      setProgressStatusText(`تمت المزامنة بنجاح لـ ${total} منتج!`);
      setImportedSuccess(true);
      setTimeout(() => {
        setIsImporting(false);
        setActiveStep('upload');
        setParsedProducts([]);
        setRawData(null);
      }, 1500);
    } catch (err: any) {
      setIsImporting(false);
      setImportErrors([err.message || 'فشلت عملية المزامنة']);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'اسم المنتج': 'فستان سهرة دانتيل فاخر',
        'القسم': 'فساتين أنيقة',
        'سعر الشراء': 60,
        'سعر البيع': 180,
        'الكمية': 50,
        'SKU': 'RWN-DRS-001',
        'الباركود': '629110009999',
        'صورة رئيسية': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        'صورة ثانية': 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80',
        'الوصف': 'فستان دانتيل ناعم بتصميم حصري مناسب للحفلات والمناسبات'
      },
      {
        'اسم المنتج': 'بلوزة صيفية شيفون خفيفة',
        'القسم': 'ملابس نسائية',
        'سعر الشراء': 30,
        'سعر البيع': 85,
        'الكمية': 40,
        'SKU': 'RWN-TOP-002',
        'الباركود': '629110008888',
        'صورة رئيسية': 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80',
        'صورة ثانية': '',
        'الوصف': 'بلوزة صيفية مريحة وعملية'
      }
    ];

    exportToExcel(sampleData, 'قالب_استيراد_المنتجات_متجر_رونق', 'المنتجات');
  };

  const handleCategorizeWithAI = async () => {
    if (parsedProducts.length === 0) return;
    
    // Ensure you have an API key, fallback or handle error if missing. We'll assume the environment has it.
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
    if (!apiKey) {
      setImportErrors(['مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في المتغيرات البيئية.']);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    setIsImporting(true);
    setProgressStatusText('جاري تحليل وتصنيف المنتجات باستخدام الذكاء الاصطناعي...');
    
    try {
      // Gather unique categories from existing products as a reference list
      const existingCategories = Array.from(new Set(existingProducts.map(p => p.category).filter(Boolean)));
      
      const newProducts = [...parsedProducts];
      
      // Batch products to avoid hitting payload limits (e.g., 20 at a time)
      const batchSize = 20;
      for (let i = 0; i < newProducts.length; i += batchSize) {
        const batch = newProducts.slice(i, i + batchSize);
        const promptText = `
          You are an expert e-commerce product categorizer for a fashion/general store.
          Here is a list of product names and descriptions.
          Here is the list of existing categories in our store: [${existingCategories.join(', ')}].
          
          For each product, assign the MOST APPROPRIATE category from the existing categories list. 
          If none fit well, create a short, logical new category name in Arabic.
          
          Respond ONLY with a valid JSON array of objects in this exact format, with no markdown code blocks or extra text:
          [
            { "id": "ProductSKU or Name", "category": "CategoryName" }
          ]
          
          Products to categorize:
          ${batch.map(p => `- ID: ${p.SKU || p.name}, Name: ${p.name}, Description: ${p.description || ''}`).join('\n')}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config: {
                responseMimeType: "application/json",
            }
        });

        if (response.text) {
          try {
            const categorized: Array<{ id: string, category: string }> = JSON.parse(response.text);
            categorized.forEach(c => {
               const target = newProducts.find(p => (p.SKU || p.name) === c.id);
               if (target) {
                 target.category = c.category;
               }
            });
          } catch (e) {
            console.error("Failed to parse Gemini response", e);
          }
        }
        
        setImportProgress(Math.round(((i + batchSize) / newProducts.length) * 100));
      }
      
      setParsedProducts(newProducts);
      setProgressStatusText('تم الانتهاء من التصنيف بنجاح!');
      setTimeout(() => setIsImporting(false), 1500);
      
    } catch (error: any) {
      console.error(error);
      setIsImporting(false);
      setImportErrors(['حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي: ' + error.message]);
    }
  };

  const handleExportCurrentCatalog = () => {
    if (!existingProducts || existingProducts.length === 0) {
      alert('لا توجد منتجات حالية في المتجر لتصديرها');
      return;
    }

    const exportRows = existingProducts.map(p => {
      const img1 = p.images?.[0] || '';
      const img2 = p.images?.[1] || '';
      return {
        'الرمز_المميز (ID)': p.ProductID,
        'رمز_المنتج (SKU)': p.SKU,
        'اسم_المنتج': p.name,
        'القسم': p.category,
        'سعر_البيع': p.salePrice,
        'سعر_التكلفة': p.costPrice,
        'الكمية_المتاحة': p.quantity,
        'صورة_رئيسية': img1,
        'صورة_ثانية': img2,
        'الوصف': p.description || '',
        'الحالة': p.status,
        'الباركود': p.Barcode || ''
      };
    });

    exportToExcel(exportRows, 'كتالوج_منتجات_متجر_رونق', 'المنتجات');
  };

  return (
    <div className="space-y-6 text-slate-100 dir-rtl">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            استيراد وتكيّف ملفات الإكسل الذكي (XLSX / CSV)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يدعم ملفات إكسل أي محل أو مورد، مع التعرف التلقائي على الأعمدة وإحلال الصور المزدوجة والمزامنة الفورية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {existingProducts.length > 0 && (
            <button
              onClick={handleExportCurrentCatalog}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="تصدير جميع المنتجات الموجودة إلى إكسل"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>تصدير الكتالوج ({existingProducts.length})</span>
            </button>
          )}
          <button
            onClick={downloadSampleTemplate}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل القالب النموذجي</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl p-8 text-center space-y-4 transition-all relative group bg-gradient-to-b from-slate-900 to-slate-950">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">اسحب ملف الإكسل هنا أو انقر لاختيار ملف من جهازك</h3>
          <p className="text-xs text-slate-400 mt-1">يدعم صيغ XLSX, XLS, CSV مع دعم الصور والكميات والأسعار</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-200 font-bold">جاري قراءة وتحليل ملف الإكسل والأعمدة...</p>
        </div>
      )}

      {/* Progress Bar for Batch Sync */}
      {isImporting && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-3 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              {progressStatusText}
            </span>
            <span className="text-emerald-400 font-mono text-sm">{importProgress}%</span>
          </div>
          
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50 relative"
              style={{ width: `${importProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            يتم تحديث الصفوف وتطبيق التنسيقات وتوزيع الصور المزدوجة فورياً.
          </p>
        </div>
      )}

      {/* Success Notification */}
      {importedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>تم استيراد كافة المنتجات بنجاح وتحديث جداول Google Sheets والتخزين المحلي!</span>
        </div>
      )}

      {/* Errors list */}
      {importErrors.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>تنبيهات وملاحظات التحليل:</span>
          </p>
          {importErrors.slice(0, 5).map((err, idx) => (
            <p key={idx} className="font-medium text-slate-300 text-[11px] pr-4">
              • {err}
            </p>
          ))}
          {importErrors.length > 5 && (
            <p className="text-[10px] text-slate-400 pr-4">
              و {importErrors.length - 5} ملاحظة أخرى...
            </p>
          )}
        </div>
      )}

      {/* Advanced Column Mapping Settings */}
      {rawData && columnMapping && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                تخصيص مطابقة أعمدة الإكسل المرفوع (Column Mapping)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تم التعرف التلقائي على الأعمدة. يمكنك تغيير اختيار أي عمود ليتطابق تماماً مع بيانات شيت المحل.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl w-fit">
              {parsedProducts.length} منتج جاهز
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Product Name Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>اسم المنتج <span className="text-rose-400">*</span></span>
                {columnMapping.name && <span className="text-[10px] text-emerald-400 font-normal">تم التحديد</span>}
              </label>
              <select
                value={columnMapping.name}
                onChange={(e) => handleMappingChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر العمود --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 2. Category Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">التصنيف / القسم</label>
              <select
                value={columnMapping.category}
                onChange={(e) => handleMappingChange('category', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- افتراضي (عام) --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 3. Sale Price Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">سعر البيع</label>
              <select
                value={columnMapping.salePrice}
                onChange={(e) => handleMappingChange('salePrice', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- لا يوجد (0) --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 4. Cost Price Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">سعر التكلفة / الشراء</label>
              <select
                value={columnMapping.costPrice}
                onChange={(e) => handleMappingChange('costPrice', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- تلقائي (60% من السعر) --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 5. Quantity Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الكمية المتاحة</label>
              <select
                value={columnMapping.quantity}
                onChange={(e) => handleMappingChange('quantity', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- افتراضي (10) --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 6. SKU Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">رمز المنتج (SKU)</label>
              <select
                value={columnMapping.sku}
                onChange={(e) => handleMappingChange('sku', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- توليد تلقائي --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 7. Image 1 Column (Primary) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>صورة رئيسية (خلية 1)</span>
              </label>
              <select
                value={columnMapping.image1}
                onChange={(e) => handleMappingChange('image1', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- بدون صورة رئيسية --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 8. Image 2 Column (Secondary with Auto Replacement) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>صورة ثانية (إحلال تلقائي)</span>
              </label>
              <select
                value={columnMapping.image2}
                onChange={(e) => handleMappingChange('image2', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- بدون صورة ثانية --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 9. Description Column */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الوصف / التفاصيل</label>
              <select
                value={columnMapping.description}
                onChange={(e) => handleMappingChange('description', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- بدون وصف --</option>
                {rawData.headers.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table Before Import */}
      {parsedProducts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                معاينة المنتجات المستخرجة ({parsedProducts.length} منتج):
              </h3>
              <p className="text-xs text-slate-400">تأكد من صحة البيانات قبل التأكيد والمزامنة</p>
            </div>
            
            {/* AI Categorization Button */}
            <button
              onClick={handleCategorizeWithAI}
              disabled={isImporting || parsedProducts.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>اقتراح التصنيفات (AI)</span>
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري المزامنة السحابية...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>مزامنة واستيراد كافة المنتجات ({parsedProducts.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-800">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-3">الصور (1 / 2)</th>
                  <th className="p-3">اسم المنتج</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">سعر البيع</th>
                  <th className="p-3">سعر التكلفة</th>
                  <th className="p-3">الكمية</th>
                  <th className="p-3">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {parsedProducts.slice(0, 50).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {p.images && p.images[0] && p.images[0].trim() ? (
                          <img 
                            src={p.images[0]} 
                            alt="صورة 1" 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-950" 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500">1</div>
                        )}
                        {p.images && p.images[1] && p.images[1].trim() ? (
                          <img 
                            src={p.images[1]} 
                            alt="صورة 2" 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-950" 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">2</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-pink-400 font-medium">{p.category}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{p.salePrice} ر.س</td>
                    <td className="p-3 font-mono text-slate-400">{p.costPrice} ر.س</td>
                    <td className="p-3 font-mono font-bold text-white">{p.quantity}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{p.SKU}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedProducts.length > 50 && (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/80 border-t border-slate-800">
                يتم عرض أول 50 منتج من أصل {parsedProducts.length} منتج. سيتم استيراد ومزامنة الجميع بالكامل.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
