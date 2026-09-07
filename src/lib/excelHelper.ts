import * as XLSX from 'xlsx';
import { Product, Order, Customer, Invoice, InventoryMovement, Supplier, Employee, Offer, Coupon, AppSettings, CurrencyRate, Category } from '../types';
import { extractProductImages } from './imageUtils';

// Import Products from Excel file (.xlsx or .csv)
export const parseProductsExcel = async (file: File): Promise<{
  products: Product[];
  newCategories: string[];
  errors: string[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const products: Product[] = [];
        const newCategoriesSet = new Set<string>();
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2;
          // Look for flexible column header names in Arabic or English
          const name = 
            row['اسم المنتج'] || 
            row['اسم_المنتج'] || 
            row['اسم'] || 
            row['Product Name'] || 
            row['Product_Name'] || 
            row['Product'] || 
            row['Name'] || 
            row['العنوان'];

          const category = 
            row['القسم_الفئة'] ||
            row['القسم'] || 
            row['الفئة'] || 
            row['التصنيف'] || 
            row['قسم'] || 
            row['Category'] || 
            row['Cat'] || 
            'عام';

          const group = 
            row['المجموعة'] || 
            row['المجموعه'] || 
            row['Group'] || 
            row['مجموعة'] || 
            'عام';

          const salePrice = parseFloat(
            row['سعر البيع'] || 
            row['سعر_البيع'] || 
            row['السعر'] || 
            row['Price'] || 
            row['Sale Price'] || 
            0
          );

          const costPrice = parseFloat(
            row['سعر الشراء_التكلفة'] ||
            row['سعر الشراء'] || 
            row['سعر_الشراء'] || 
            row['التكلفة'] || 
            row['Cost Price'] || 
            row['Cost'] || 
            salePrice * 0.6
          );

          const quantity = parseInt(
            row['الكمية المتاحة'] ||
            row['الكمية_المتاحة'] ||
            row['الكمية'] || 
            row['المخزون'] || 
            row['الرصيد'] || 
            row['Stock'] || 
            row['Quantity'] || 
            row['Qty'] || 
            10, 
            10
          );

          const sku = String(
            row['SKU'] || 
            row['رمز المنتج (SKU)'] ||
            row['رمز_المنتج (SKU)'] ||
            row['رمز المنتج'] || 
            row['رمز_المنتج'] || 
            row['شفرة'] || 
            row['Code'] || 
            row['Item Code'] || 
            `SKU-${Date.now().toString().slice(-4)}-${index}`
          ).trim();

          const barcode = String(
            row['Barcode'] || 
            row['الباركود'] || 
            row['باركود'] || 
            row['UPC'] || 
            `6291100${Math.floor(100000 + Math.random() * 900000)}`
          ).trim();

          const discount = parseFloat(row['الخصم'] || row['الخصم (%)'] || row['Discount'] || 0);
          const description = row['الوصف'] || row['Description'] || '';

          if (!name) {
            errors.push(`السطر ${rowNum}: تم تجاهل السطر لعدم وجود اسم المنتج`);
            return;
          }

          // Extract up to 3 images max with HEX/Base64 decoding support
          const imagesList = extractProductImages(row);

          newCategoriesSet.add(category);

          const randSuffix = Math.random().toString(36).substring(2, 6);
          const productId = String(row.ProductID || row['الرمز_المميز (ID)'] || row['الرمز المميز'] || row.id || `PRD_${Date.now()}_${index}_${randSuffix}`).trim();

          // Determine product status and availability
          const rawStatus = String(
            row['حالة_المنتج_والتوفر'] || 
            row['حالة_المنتج'] || 
            row['حالة المنتج'] || 
            row['الحالة'] || 
            row['Status'] || 
            ''
          ).trim().toLowerCase();

          let productStatus: 'active' | 'inactive' | 'out_of_stock' = 'active';
          if (rawStatus.includes('غير متوفر') || rawStatus.includes('out_of_stock') || rawStatus.includes('نفد') || quantity <= 0) {
            productStatus = 'out_of_stock';
          } else if (rawStatus.includes('معطل') || rawStatus.includes('مخفي') || rawStatus.includes('غير نشط') || rawStatus.includes('inactive')) {
            productStatus = 'inactive';
          } else {
            productStatus = 'active';
          }

          // Determine visibility
          const rawVis = String(
            row['حالة_الظهور_بالمتجر'] || 
            row['حالة_الظهور'] || 
            row['حالة الظهور'] || 
            row['الظهور'] || 
            row['isVisible'] || 
            '1'
          ).trim();
          const isVisible = !(rawVis === '0' || rawVis === 'مخفي' || rawVis === 'معطل' || rawVis.toLowerCase() === 'false');

          products.push({
            ProductID: productId,
            name: String(name).trim(),
            SKU: sku,
            Barcode: barcode,
            group: String(group).trim() || 'عام',
            category: String(category).trim() || 'عام',
            costPrice: isNaN(costPrice) ? 0 : costPrice,
            salePrice: isNaN(salePrice) ? 0 : salePrice,
            wholesalePrice: Math.round((isNaN(salePrice) ? 0 : salePrice) * 0.8),
            discount: isNaN(discount) ? 0 : discount,
            quantity: isNaN(quantity) ? 0 : quantity,
            minStock: parseInt(row['الحد الأدنى'] || row['الحد_الأدنى'] || 5, 10),
            images: imagesList, // Max 3 images
            description: String(description).trim(),
            status: productStatus,
            isVisible: isVisible,
            rating: parseFloat(row['متوسط_التقييم'] || row['التقييم'] || row['rating'] || 5),
            ratingCount: parseInt(row['عدد_التقييمات'] || row['عدد التقييمات'] || row['ratingCount'] || (row['متوسط_التقييم'] ? 1 : 0), 10),
            createdAt: row['تاريخ_الرفع'] || row['تاريخ الرفع'] || row['تاريخ الإنشاء'] || row['تاريخ_الإنشاء'] || row['تاريخ_التحديث'] || new Date().toISOString(),
            updatedAt: row['تاريخ_التحديث'] || row['تاريخ التحديث'] || new Date().toISOString(),
            size: ['S', 'M', 'L', 'XL'],
            color: ['ألوان متعددة']
          });
        });

        resolve({
          products,
          newCategories: Array.from(newCategoriesSet),
          errors
        });
      } catch (err: any) {
        reject(new Error('فشل قراءة ملف الإكسل. يرجى التأكد من أن صيغة الملف .xlsx أو .csv'));
      }
    };

    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
};

// Export List to Excel File Download
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export interface RawExcelData {
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rawRows: any[];
}

export interface ColumnMappingConfig {
  name: string;
  category: string;
  salePrice: string;
  costPrice: string;
  quantity: string;
  sku: string;
  barcode: string;
  image1: string;
  image2: string;
  description: string;
}

export const detectColumnMappings = (headers: string[]): ColumnMappingConfig => {
  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const match = headers.find(h => {
        const cleanH = h.trim().toLowerCase().replace(/[_\-\s]+/g, '');
        const cleanC = cand.trim().toLowerCase().replace(/[_\-\s]+/g, '');
        return cleanH === cleanC || cleanH.includes(cleanC) || cleanC.includes(cleanH);
      });
      if (match) return match;
    }
    return '';
  };

  return {
    name: findMatch(['اسم المنتج', 'اسم_المنتج', 'الاسم', 'اسم', 'product name', 'product', 'title', 'العنوان']),
    category: findMatch(['القسم', 'التصنيف', 'قسم', 'تصنيف', 'category', 'cat', 'group']),
    salePrice: findMatch(['سعر البيع', 'سعر_البيع', 'السعر', 'سعر', 'price', 'sale price', 'selling price']),
    costPrice: findMatch(['سعر الشراء', 'سعر_الشراء', 'سعر التكلفة', 'التكلفة', 'cost', 'cost price', 'buy price']),
    quantity: findMatch(['الكمية', 'المخزون', 'الرصيد', 'كمية', 'stock', 'qty', 'quantity', 'count']),
    sku: findMatch(['sku', 'رمز المنتج', 'رمز_المنتج', 'رمز', 'كود', 'code', 'item code']),
    barcode: findMatch(['الباركود', 'باركود', 'barcode', 'upc', 'ean']),
    image1: findMatch(['صورة رئيسية', 'صورة_رئيسية', 'صورة 1', 'صورة_1', 'صورة1', 'image 1', 'image1', 'image', 'الصور', 'رابط الصورة']),
    image2: findMatch(['صورة ثانية', 'صورة_ثانية', 'صورة 2', 'صورة_2', 'صورة2', 'image 2', 'image2', 'صورة اضافية']),
    description: findMatch(['الوصف', 'تفاصيل', 'وصف', 'description', 'details', 'notes', 'ملاحظات'])
  };
};

export const readRawExcelFile = async (file: File): Promise<RawExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          throw new Error('الملف لا يحتوي على أوراق عمل (Sheets)');
        }
        const activeSheet = sheetNames[0];
        const worksheet = workbook.Sheets[activeSheet];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Extract header row keys
        let headers: string[] = [];
        if (rawRows.length > 0) {
          const keysSet = new Set<string>();
          rawRows.forEach(r => Object.keys(r).forEach(k => keysSet.add(k)));
          headers = Array.from(keysSet);
        }

        resolve({
          sheetNames,
          activeSheet,
          headers,
          rawRows
        });
      } catch (err: any) {
        reject(new Error(err.message || 'فشل قراءة ملف الإكسل'));
      }
    };
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
};

export const mapRawRowsToProducts = (
  rawRows: any[],
  mapping: ColumnMappingConfig,
  activeFields: Record<string, boolean> = {}
): { products: Product[]; newCategories: string[]; errors: string[] } => {
  const products: Product[] = [];
  const newCategoriesSet = new Set<string>();
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const name = mapping.name ? String(row[mapping.name] || '').trim() : '';

    if (!name) {
      errors.push(`السطر ${rowNum}: تم تجاهله لعدم وجود اسم المنتج`);
      return;
    }

    const category = mapping.category && row[mapping.category] 
      ? String(row[mapping.category]).trim() 
      : 'عام';

    let salePrice = 0;
    if (mapping.salePrice && row[mapping.salePrice] !== undefined && row[mapping.salePrice] !== '') {
      const parsed = parseFloat(row[mapping.salePrice]);
      if (!isNaN(parsed)) salePrice = parsed;
    }

    let costPrice = salePrice * 0.6;
    if (mapping.costPrice && row[mapping.costPrice] !== undefined && row[mapping.costPrice] !== '') {
      const parsed = parseFloat(row[mapping.costPrice]);
      if (!isNaN(parsed)) costPrice = parsed;
    }

    let quantity = 10;
    if (mapping.quantity && row[mapping.quantity] !== undefined && row[mapping.quantity] !== '') {
      const parsed = parseInt(row[mapping.quantity], 10);
      if (!isNaN(parsed)) quantity = parsed;
    }

    const sku = mapping.sku && row[mapping.sku] 
      ? String(row[mapping.sku]).trim() 
      : `SKU-${Date.now().toString().slice(-4)}-${index}`;

    const barcode = mapping.barcode && row[mapping.barcode] 
      ? String(row[mapping.barcode]).trim() 
      : `6291100${Math.floor(100000 + Math.random() * 900000)}`;

    const description = mapping.description && row[mapping.description] 
      ? String(row[mapping.description]).trim() 
      : '';

    // Handle Dual Images with smart auto-replacement:
    let img1 = mapping.image1 && row[mapping.image1] ? String(row[mapping.image1]).trim() : '';
    let img2 = mapping.image2 && row[mapping.image2] ? String(row[mapping.image2]).trim() : '';

    // If image 1 is empty but image 2 has value, image 2 replaces image 1:
    if (!img1 && img2) {
      img1 = img2;
      img2 = '';
    }

    let imagesList: string[] = [];
    if (img1) imagesList.push(img1);
    if (img2) imagesList.push(img2);

    if (imagesList.length === 0) {
      // Fallback extraction from the whole row
      imagesList = extractProductImages(row).slice(0, 2);
    }

    newCategoriesSet.add(category);

    const randSuffix = Math.random().toString(36).substring(2, 6);
    products.push({
      ProductID: String(row.ProductID || row.id || `PRD_${Date.now()}_${index}_${randSuffix}`).trim(),
      name: name,
      SKU: sku,
      Barcode: barcode,
      category: category,
      costPrice: isNaN(costPrice) ? 0 : costPrice,
      salePrice: isNaN(salePrice) ? 0 : salePrice,
      wholesalePrice: Math.round((isNaN(salePrice) ? 0 : salePrice) * 0.8),
      discount: 0,
      quantity: isNaN(quantity) ? 0 : quantity,
      minStock: 5,
      images: imagesList.length > 0 ? imagesList.slice(0, 2) : ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
      description: description,
      status: quantity > 0 ? 'active' : 'out_of_stock',
      createdAt: new Date().toISOString(),
      size: ['S', 'M', 'L', 'XL'],
      color: ['ألوان متعددة']
    });
  });

  return {
    products,
    newCategories: Array.from(newCategoriesSet),
    errors
  };
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch (e) {
    return dateStr;
  }
};

// Export Unified Products, Categories, and Groups Excel
export const exportProductsExcel = (products: Product[], categories?: Category[], storeName?: string) => {
  const catMap = new Map<string, Category>();
  if (categories) {
    categories.forEach(c => catMap.set(c.name.trim().toLowerCase(), c));
  }

  const formatted = products.map(p => {
    const imgs = p.images || [];
    const matchedCat = catMap.get(p.category.trim().toLowerCase());
    const groupName = p.group || matchedCat?.group || 'عام';
    const groupStatus = matchedCat?.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
    const categoryStatus = matchedCat?.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
    const productAvailability = p.quantity > 0 && p.status === 'active' ? 'متوفر' : (p.status === 'inactive' ? 'معطل' : 'غير متوفر');
    const productVisibility = p.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';

    return {
      'الرمز_المميز (ID)': p.ProductID,
      'اسم_المنتج': p.name,
      'رمز_المنتج (SKU)': p.SKU,
      'الباركود': p.Barcode,
      'المجموعة': groupName,
      'حالة_المجموعة': groupStatus,
      'القسم_الفئة': p.category,
      'حالة_القسم': categoryStatus,
      'سعر_البيع': p.salePrice,
      'سعر_الشراء_التكلفة': p.costPrice,
      'سعر_الجملة': p.wholesalePrice || Math.round(p.salePrice * 0.8),
      'الخصم (%)': p.discount || 0,
      'الكمية_المتاحة': p.quantity,
      'الحد_الأدنى': p.minStock || 5,
      'حالة_المنتج_والتوفر': productAvailability,
      'حالة_الظهور_بالمتجر': productVisibility,
      'متوسط_التقييم': p.rating || (p.ratings && p.ratings.length > 0 ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) : 5),
      'عدد_التقييمات': p.ratingCount || (p.ratings ? p.ratings.length : 1),
      'صورة_1': imgs[0] || '',
      'صورة_2': imgs[1] || '',
      'صورة_3': imgs[2] || '',
      'الوصف': p.description || '',
      'تاريخ_التحديث': formatDateTime(p.updatedAt || p.createdAt),
      'تاريخ_الرفع': formatDateTime(p.createdAt)
    };
  });

  exportToExcel(formatted, storeName ? `منتجات_${storeName}` : 'منتجات_وفئات_المتجر', 'المنتجات_والفئات_والمجموعات');
};

// Export Orders
export const exportOrdersExcel = (orders: Order[]) => {
  const formatted = orders.map(o => ({
    'رقم الطلب': o.orderNumber,
    'اسم العميل': o.customerName,
    'رقم الهاتف': o.phone,
    'المدينة': o.city || 'غير محدد',
    'إجمالي الكمية': o.totalQuantity,
    'الضريبة': o.tax,
    'الخصم': o.discount,
    'الشحن': o.shippingFee,
    'المبلغ الإجمالي': o.totalAmount,
    'حالة الطلب': o.orderStatus,
    'حالة الدفع': o.paymentStatus,
    'طريقة الدفع': o.paymentMethod,
    'شركة الشحن': o.shippingCompany || '',
    'رقم التتبع': o.trackingNumber || '',
    'حالة التسعير': o.pricesFinished ? 'تم إنهاء السعر' : 'قيد التسعير',
    'التاريخ': o.date
  }));
  exportToExcel(formatted, 'طلبات_المتجر', 'الطلبات');
};

// Export Invoices
export const exportInvoicesExcel = (invoices: Invoice[]) => {
  const formatted = invoices.map(i => ({
    'رقم الفاتورة': i.invoiceNumber,
    'العميل': i.customerName,
    'الرقم الضريبي': i.taxNumber,
    'تفاصيل المنتجات': i.itemsSummary,
    'مبلغ الضريبة (15%)': i.taxAmount,
    'المبلغ الإجمالي': i.totalAmount,
    'طريقة الدفع': i.paymentMethod,
    'الموظف': i.employeeName,
    'التاريخ': i.date
  }));
  exportToExcel(formatted, 'فواتير_المتجر', 'الفواتير');
};

export interface FullSystemData {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  offers: Offer[];
  coupons: Coupon[];
  invoices: Invoice[];
  settings: AppSettings;
  currencies: CurrencyRate[];
  categories?: Category[];
}

// Helper to prevent SheetJS 32767 character limit crash
const safeExcelStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.length > 32000 ? str.slice(0, 32000) : str;
};

// Export Complete System Backup (Multi-sheet Excel Workbook)
export const exportFullSystemBackup = (data: FullSystemData) => {
  const workbook = XLSX.utils.book_new();

  // Create Category lookup for Groups and Status
  const catMap = new Map<string, Category>();
  if (data.categories) {
    data.categories.forEach(c => catMap.set(c.name.trim().toLowerCase(), c));
  }

  // 1. Unified Products, Categories, and Groups Sheet
  const productsSheet = XLSX.utils.json_to_sheet(data.products.map(p => {
    const imgs = p.images || [];
    const matchedCat = catMap.get(p.category.trim().toLowerCase());
    const groupName = p.group || matchedCat?.group || 'عام';
    const groupStatus = matchedCat?.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
    const categoryStatus = matchedCat?.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
    const productAvailability = p.quantity > 0 && p.status === 'active' ? 'متوفر' : (p.status === 'inactive' ? 'معطل' : 'غير متوفر');
    const productVisibility = p.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';

    return {
      'الرمز_المميز (ID)': safeExcelStr(p.ProductID),
      'اسم_المنتج': safeExcelStr(p.name),
      'رمز_المنتج (SKU)': safeExcelStr(p.SKU),
      'الباركود': safeExcelStr(p.Barcode),
      'المجموعة': safeExcelStr(groupName),
      'حالة_المجموعة': safeExcelStr(groupStatus),
      'القسم_الفئة': safeExcelStr(p.category),
      'حالة_القسم': safeExcelStr(categoryStatus),
      'سعر_البيع': p.salePrice,
      'سعر_الشراء_التكلفة': p.costPrice,
      'سعر_الجملة': p.wholesalePrice || Math.round(p.salePrice * 0.8),
      'الخصم (%)': p.discount || 0,
      'الكمية_المتاحة': p.quantity,
      'الحد_الأدنى': p.minStock || 5,
      'حالة_المنتج_والتوفر': safeExcelStr(productAvailability),
      'حالة_الظهور_بالمتجر': safeExcelStr(productVisibility),
      'صورة_1': safeExcelStr(imgs[0] || ''),
      'صورة_2': safeExcelStr(imgs[1] || ''),
      'صورة_3': safeExcelStr(imgs[2] || ''),
      'الوصف': safeExcelStr(p.description),
      'تاريخ_التحديث': safeExcelStr(formatDateTime(p.updatedAt || p.createdAt)),
      'تاريخ_الرفع': safeExcelStr(formatDateTime(p.createdAt))
    };
  }));
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'المنتجات_والفئات_والمجموعات');

  // 2. Orders Sheet
  const ordersSheet = XLSX.utils.json_to_sheet(data.orders.map(o => ({
    'OrderID': safeExcelStr(o.OrderID),
    'رقم الطلب': safeExcelStr(o.orderNumber),
    'اسم العميل': safeExcelStr(o.customerName),
    'الهاتف': safeExcelStr(o.phone),
    'الدولة': safeExcelStr(o.country || 'SA'),
    'المدينة': safeExcelStr(o.city || ''),
    'العنوان': safeExcelStr(o.address || ''),
    'عدد المنتجات': o.totalQuantity,
    'الضريبة': o.tax,
    'الخصم': o.discount,
    'مصاريف الشحن': o.shippingFee,
    'المبلغ الإجمالي': o.totalAmount,
    'حالة الطلب': safeExcelStr(o.orderStatus),
    'حالة الدفع': safeExcelStr(o.paymentStatus),
    'طريقة الدفع': safeExcelStr(o.paymentMethod),
    'شركة الشحن': safeExcelStr(o.shippingCompany || ''),
    'رقم التتبع': safeExcelStr(o.trackingNumber || ''),
    'حالة التسعير': safeExcelStr(o.pricesFinished ? 'تم إنهاء السعر' : 'قيد التسعير'),
    'الموظف': safeExcelStr(o.employeeName),
    'التاريخ': safeExcelStr(o.date)
  })));
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'الطلبات');

  // 3. Customers Sheet
  const customersSheet = XLSX.utils.json_to_sheet(data.customers.map(c => ({
    'CustomerID': safeExcelStr(c.CustomerID),
    'الاسم': safeExcelStr(c.name),
    'الهاتف': safeExcelStr(c.phone),
    'البريد': safeExcelStr(c.email),
    'المدينة': safeExcelStr(c.city),
    'العنوان': safeExcelStr(c.address),
    'الرقم الضريبي': safeExcelStr(c.taxNumber),
    'الرصيد': c.balance,
    'نقاط الولاء': c.loyaltyPoints
  })));
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'العملاء');

  // 4. Suppliers Sheet
  const suppliersSheet = XLSX.utils.json_to_sheet(data.suppliers.map(s => ({
    'SupplierID': safeExcelStr(s.SupplierID),
    'الاسم': safeExcelStr(s.name),
    'الهاتف': safeExcelStr(s.phone),
    'البريد': safeExcelStr(s.email),
    'الرصيد': s.balance
  })));
  XLSX.utils.book_append_sheet(workbook, suppliersSheet, 'الموردون');

  // 5. Employees Sheet
  const employeesSheet = XLSX.utils.json_to_sheet(data.employees.map(e => ({
    'EmployeeID': safeExcelStr(e.EmployeeID),
    'الاسم': safeExcelStr(e.name),
    'اسم المستخدم': safeExcelStr(e.username),
    'كلمة المرور': safeExcelStr(e.passwordHash),
    'الدور الوظيفي': safeExcelStr(e.role),
    'آخر دخول': safeExcelStr(e.lastLogin)
  })));
  XLSX.utils.book_append_sheet(workbook, employeesSheet, 'الموظفون');

  // 6. Offers Sheet
  const offersSheet = XLSX.utils.json_to_sheet(data.offers.map(off => ({
    'OfferID': safeExcelStr(off.OfferID),
    'العنوان': safeExcelStr(off.title),
    'نسبة الخصم': off.discountPercentage,
    'تاريخ البداية': safeExcelStr(off.startDate),
    'تاريخ النهاية': safeExcelStr(off.endDate),
    'الحالة': safeExcelStr(off.status)
  })));
  XLSX.utils.book_append_sheet(workbook, offersSheet, 'العروض');

  // 7. Coupons Sheet
  const couponsSheet = XLSX.utils.json_to_sheet(data.coupons.map(c => ({
    'CouponCode': safeExcelStr(c.CouponCode),
    'قيمة الخصم': c.discountValue,
    'نوع الخصم': safeExcelStr(c.discountType),
    'الحد الأدنى للطلب': c.minOrderAmount,
    'تاريخ الانتهاء': safeExcelStr(c.expiryDate),
    'مرات الاستخدام': c.usageCount
  })));
  XLSX.utils.book_append_sheet(workbook, couponsSheet, 'الكوبونات');

  // 8. Invoices Sheet
  const invoicesSheet = XLSX.utils.json_to_sheet((data.invoices || []).map(i => ({
    'InvoiceID': safeExcelStr(i.InvoiceID),
    'رقم الفاتورة': safeExcelStr(i.invoiceNumber),
    'العميل': safeExcelStr(i.customerName),
    'الرقم الضريبي': safeExcelStr(i.taxNumber),
    'ملخص المنتجات': safeExcelStr(i.itemsSummary),
    'المبلغ الإجمالي': i.totalAmount,
    'طريقة الدفع': safeExcelStr(i.paymentMethod),
    'التاريخ': safeExcelStr(i.date)
  })));
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'الفواتير');

  // 9. Settings Sheet
  const settingsSheet = XLSX.utils.json_to_sheet([{
    'اسم المتجر': safeExcelStr(data.settings.storeName),
    'الشعار': safeExcelStr(data.settings.storeLogoUrl || ''),
    'رقم الهاتف': safeExcelStr(data.settings.storePhone),
    'الواتساب': safeExcelStr(data.settings.storeWhatsApp || ''),
    'هاتف فرع السعودية': safeExcelStr(data.settings.storePhoneSaudi || ''),
    'هاتف فرع اليمن': safeExcelStr(data.settings.storePhoneYemen || ''),
    'العنوان': safeExcelStr(data.settings.storeAddress),
    'الفروع': safeExcelStr(data.settings.storeBranches || ''),
    'معلومات التوصيل': safeExcelStr(data.settings.deliveryInfo || ''),
    'نبذة عن المتجر': safeExcelStr(data.settings.footerAbout || ''),
    'الرقم الضريبي': safeExcelStr(data.settings.taxNumber),
    'نسبة الضريبة': data.settings.vatPercentage,
    'العملة الافتراضية': safeExcelStr(data.settings.defaultCurrency),
    'SpreadsheetID': safeExcelStr(data.settings.spreadsheetId),
    'GoogleAppsScriptURL': safeExcelStr(data.settings.googleAppsScriptUrl),
    'تيك توك': safeExcelStr(data.settings.socialLinks?.tiktok || ''),
    'إنستغرام': safeExcelStr(data.settings.socialLinks?.instagram || ''),
    'تلجرام': safeExcelStr(data.settings.socialLinks?.telegram || ''),
    'فيسبوك': safeExcelStr(data.settings.socialLinks?.facebook || ''),
    'سناب شات': safeExcelStr(data.settings.socialLinks?.snapchat || ''),
    'تويتر': safeExcelStr(data.settings.socialLinks?.twitter || ''),
    'رابط تطبيق أندرويد': safeExcelStr(data.settings.appDownloadAndroid || ''),
    'رابط تطبيق آيفون': safeExcelStr(data.settings.appDownloadiOS || ''),
    'رابط تطبيق هواوي': safeExcelStr(data.settings.appDownloadHuawei || ''),
    'رابط تطبيق الكمبيوتر': safeExcelStr(data.settings.appDownloadDesktop || ''),
    'عنوان بانر التطبيق': safeExcelStr(data.settings.appDownloadTitle || ''),
    'وصف بانر التطبيق': safeExcelStr(data.settings.appDownloadDescription || ''),
    'تفعيل عرض بانر التطبيق': data.settings.showAppDownloadBanner !== false ? 'مفعل' : 'غير مفعل',
    'صورة البانر 1': safeExcelStr(data.settings.banner1_image || ''),
    'نص البانر 1': safeExcelStr(data.settings.banner1_title || ''),
    'رابط البانر 1': safeExcelStr(data.settings.banner1_link || ''),
    'صورة البانر 2': safeExcelStr(data.settings.banner2_image || ''),
    'نص البانر 2': safeExcelStr(data.settings.banner2_title || ''),
    'رابط البانر 2': safeExcelStr(data.settings.banner2_link || ''),
    'صورة البانر 3': safeExcelStr(data.settings.banner3_image || ''),
    'نص البانر 3': safeExcelStr(data.settings.banner3_title || ''),
    'رابط البانر 3': safeExcelStr(data.settings.banner3_link || ''),
    'اللون الأساسي (Primary)': safeExcelStr(data.settings.themePrimaryColor || '#ec4899'),
    'اللون الثانوي (Secondary)': safeExcelStr(data.settings.themeSecondaryColor || '#9333ea'),
    'لون التمييز (Accent)': safeExcelStr(data.settings.themeAccentColor || '#f43f5e'),
    'لون الخلفية (Background)': safeExcelStr(data.settings.themeBgColor || '#090d16'),
    'لون النص (Text)': safeExcelStr(data.settings.themeTextColor || '#f8fafc'),
    'لون الأيقونات (Icons)': safeExcelStr(data.settings.themeIconColor || '#f8fafc'),
    'نمط الثيم': safeExcelStr(data.settings.themePreset || ''),
    'وضع المظهر (Theme Mode)': safeExcelStr(data.settings.themeMode || 'dark'),
    'رابط المتجر NFC': safeExcelStr(data.settings.defaultStoreUrl || '')
  }]);
  XLSX.utils.book_append_sheet(workbook, settingsSheet, 'الإعدادات');

  // 10. Currencies Sheet
  const currenciesSheet = XLSX.utils.json_to_sheet((data.currencies || []).map(curr => ({
    'رمز العملة': safeExcelStr(curr.currencyCode),
    'اسم العملة': safeExcelStr(curr.currencyName),
    'سعر الصرف': curr.exchangeRate,
    'الرمز': safeExcelStr(curr.symbol)
  })));
  XLSX.utils.book_append_sheet(workbook, currenciesSheet, 'أسعار_العملات');

  const cleanStoreName = (data.settings.storeName || 'المتجر').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `نسخة_احتياطية_${cleanStoreName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

// Export Store Settings Sheet to Excel
export const exportStoreSettingsExcel = (settings: AppSettings) => {
  const now = new Date().toLocaleString('ar-SA');
  const social = settings.socialLinks || {};

  const rows = [
    { 'خاصية_الإعداد': 'اسم_المتجر', 'القيمة': safeExcelStr(settings.storeName || 'اوفالي'), 'الوصف': 'اسم المتجر التجاري المعتمد', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'شعار_المتجر', 'القيمة': safeExcelStr(settings.storeLogoUrl || ''), 'الوصف': 'رابط أو صورة شعار المتجر (Logo)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'كلمة_مرور_المدير_PIN', 'القيمة': safeExcelStr(settings.adminPasswordHash || '123456'), 'الوصف': 'الرمز السري للدخول إلى لوحة التحكم', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'هاتف_المتجر', 'القيمة': safeExcelStr(settings.storePhone || ''), 'الوصف': 'رقم الاتصال المباشر الأساسي', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'واتساب_المتجر', 'القيمة': safeExcelStr(settings.storeWhatsApp || social.whatsapp || ''), 'الوصف': 'رقم محادثات واتساب لخدمة العملاء', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'هاتف_فرع_السعودية', 'القيمة': safeExcelStr(settings.storePhoneSaudi || ''), 'الوصف': 'رقم الاتصال الخاص بفرع السعودية', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'هاتف_فرع_اليمن', 'القيمة': safeExcelStr(settings.storePhoneYemen || ''), 'الوصف': 'رقم الاتصال الخاص بفرع اليمن', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'عنوان_المتجر', 'القيمة': safeExcelStr(settings.storeAddress || ''), 'الوصف': 'العنوان الرئيسي وموقع الإدارة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'فروع_المتجر', 'القيمة': safeExcelStr(settings.storeBranches || ''), 'الوصف': 'قائمة الفروع المعتمدة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'معلومات_التوصيل', 'القيمة': safeExcelStr(settings.deliveryInfo || ''), 'الوصف': 'سياسة الشحن ومواعيد التوصيل', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نبذة_عن_المتجر', 'القيمة': safeExcelStr(settings.footerAbout || ''), 'الوصف': 'النص التعريفي الظاهر بأسفل المتجر', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'الرقم_الضريبي', 'القيمة': safeExcelStr(settings.taxNumber || ''), 'الوصف': 'الرقم الضريبي الرسمي للمنشأة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'تفعيل_الضريبة', 'القيمة': settings.enableVat ? 'مفعل' : 'غير مفعل', 'الوصف': 'حالة تفعيل ضريبة القيمة المضافة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نسبة_الضريبة', 'القيمة': `${settings.vatPercentage || 15}%`, 'الوصف': 'نسبة الضريبة المطبقة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'العملة_الافتراضية', 'القيمة': safeExcelStr(settings.defaultCurrency || 'SAR'), 'الوصف': 'العملة الأساسية (SAR / YER / USD)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'الدولة_المستهدفة', 'القيمة': safeExcelStr(settings.targetCountry || 'BOTH'), 'الوصف': 'نطاق البيع والتوصيل (SA / YE / BOTH)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'سعر_صرف_الريال_اليمني', 'القيمة': String(settings.yerExchangeRate || 535), 'الوصف': 'سعر صرف الريال اليمني مقابل 1 ريال سعودي', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'سعر_صرف_الدولار', 'القيمة': String(settings.usdExchangeRate || 3.75), 'الوصف': 'سعر صرف الدولار مقابل الريال السعودي', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تيك_توك', 'القيمة': safeExcelStr(social.tiktok || ''), 'الوصف': 'رابط حساب تيك توك الرسمي', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_انستقرام', 'القيمة': safeExcelStr(social.instagram || ''), 'الوصف': 'رابط حساب انستقرام', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_فيسبوك', 'القيمة': safeExcelStr(social.facebook || ''), 'الوصف': 'رابط صفحة فيسبوك', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_سناب_شات', 'القيمة': safeExcelStr(social.snapchat || ''), 'الوصف': 'رابط حساب سناب شات', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تيليجرام', 'القيمة': safeExcelStr(social.telegram || ''), 'الوصف': 'رابط قناة تيليجرام', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تويتر_إكس', 'القيمة': safeExcelStr(social.twitter || ''), 'الوصف': 'رابط حساب تويتر إكس', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_المتجر_الأساسي_Primary', 'القيمة': safeExcelStr(settings.themePrimaryColor || '#ec4899'), 'الوصف': 'اللون الأساسي للأزرار والعناصر والشريط والأيقونات', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_المتجر_الثانوي_Secondary', 'القيمة': safeExcelStr(settings.themeSecondaryColor || '#9333ea'), 'الوصف': 'اللون الثانوي للتدرجات والبطاقات', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_التمييز_Accent', 'القيمة': safeExcelStr(settings.themeAccentColor || '#f43f5e'), 'الوصف': 'لون التمييز والعروض وأوسمة الخصم', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_الخلفية_Background', 'القيمة': safeExcelStr(settings.themeBgColor || '#090d16'), 'الوصف': 'لون الخلفية العامة للمتجر', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_النص_Text', 'القيمة': safeExcelStr(settings.themeTextColor || '#f8fafc'), 'الوصف': 'لون النصوص والعناوين', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'لون_الأيقونات_Icons', 'القيمة': safeExcelStr(settings.themeIconColor || '#f8fafc'), 'الوصف': 'لون الأيقونات في المتجر', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نمط_الثيم_المحدد', 'القيمة': safeExcelStr(settings.themePreset || ''), 'الوصف': 'اسم نمط الثيم المختار', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'وضع_الثيم_ThemeMode', 'القيمة': safeExcelStr(settings.themeMode || 'dark'), 'الوصف': 'وضع مظهر المتجر (dark / light)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_المتجر_NFC', 'القيمة': safeExcelStr(settings.defaultStoreUrl || ''), 'الوصف': 'الرابط المعتمد لبرمجة بطاقات NFC ومشاركة المتجر', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تطبيق_أندرويد_APK', 'القيمة': safeExcelStr(settings.appDownloadAndroid || ''), 'الوصف': 'رابط تحميل تطبيق الأندرويد (Google Play / APK)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تطبيق_آيفون_iOS', 'القيمة': safeExcelStr(settings.appDownloadiOS || ''), 'الوصف': 'رابط تحميل تطبيق الآيفون (App Store / TestFlight)', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تطبيق_هواوي', 'القيمة': safeExcelStr(settings.appDownloadHuawei || ''), 'الوصف': 'رابط تحميل تطبيق هواوي AppGallery', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_تطبيق_الكمبيوتر', 'القيمة': safeExcelStr(settings.appDownloadDesktop || ''), 'الوصف': 'رابط تطبيق الديسكتوب والويندوز', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'عنوان_بانر_التطبيق', 'القيمة': safeExcelStr(settings.appDownloadTitle || 'حمّل تطبيق اوفالي الآن'), 'الوصف': 'عنوان بانر تحميل التطبيق في الواجهة', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'وصف_بانر_التطبيق', 'القيمة': safeExcelStr(settings.appDownloadDescription || 'تسوق أسرع واحصل على خصومات حصرية وإشعارات فورية.'), 'الوصف': 'وصف بانر تحميل التطبيق في المتجر', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'تفعيل_عرض_بانر_التطبيق', 'القيمة': settings.showAppDownloadBanner !== false ? 'مفعل' : 'غير مفعل', 'الوصف': 'إظهار أو إخفاء روابط التطبيق بالمتجر', 'تاريخ_التحديث': now },
    
    // Banners
    { 'خاصية_الإعداد': 'صورة_البانر_1', 'القيمة': safeExcelStr(settings.banner1_image || ''), 'الوصف': 'رابط صورة الإعلان الأول في الصفحة الرئيسية', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نص_البانر_1', 'القيمة': safeExcelStr(settings.banner1_title || ''), 'الوصف': 'النص المكتوب على الإعلان الأول', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_البانر_1', 'القيمة': safeExcelStr(settings.banner1_link || ''), 'الوصف': 'الرابط عند الضغط على الإعلان الأول', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'صورة_البانر_2', 'القيمة': safeExcelStr(settings.banner2_image || ''), 'الوصف': 'رابط صورة الإعلان الثاني في الصفحة الرئيسية', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نص_البانر_2', 'القيمة': safeExcelStr(settings.banner2_title || ''), 'الوصف': 'النص المكتوب على الإعلان الثاني', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_البانر_2', 'القيمة': safeExcelStr(settings.banner2_link || ''), 'الوصف': 'الرابط عند الضغط على الإعلان الثاني', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'صورة_البانر_3', 'القيمة': safeExcelStr(settings.banner3_image || ''), 'الوصف': 'رابط صورة الإعلان الثالث في الصفحة الرئيسية', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'نص_البانر_3', 'القيمة': safeExcelStr(settings.banner3_title || ''), 'الوصف': 'النص المكتوب على الإعلان الثالث', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'رابط_البانر_3', 'القيمة': safeExcelStr(settings.banner3_link || ''), 'الوصف': 'الرابط عند الضغط على الإعلان الثالث', 'تاريخ_التحديث': now },
    { 'خاصية_الإعداد': 'تاريخ_آخر_تحديث', 'القيمة': now, 'الوصف': 'توقيت آخر مزامنة تم حفظها في الإعدادات', 'تاريخ_التحديث': now }
  ];

  exportToExcel(rows, 'إعدادات_المتجر', 'إعدادات_المتجر');
};

// Export individual Suppliers list
export const exportSuppliersToExcel = (suppliers: Supplier[]) => {
  const ws = XLSX.utils.json_to_sheet(suppliers.map(s => ({
    'معرف_المورد (SupplierID)': safeExcelStr(s.SupplierID),
    'اسم_المورد': safeExcelStr(s.name),
    'رقم_الهاتف': safeExcelStr(s.phone),
    'البريد_الإلكتروني': safeExcelStr(s.email),
    'الرصيد': Number(s.balance) || 0
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الموردون');
  XLSX.writeFile(wb, `قائمة_الموردين_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Parse individual Suppliers list from Excel
export const parseSuppliersExcel = async (file: File): Promise<Supplier[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const suppliers: Supplier[] = rows.map((r, idx) => ({
          SupplierID: String(r['معرف_المورد (SupplierID)'] || r['SupplierID'] || r['معرف المورد'] || r['ID'] || `SUP_${Date.now()}_${idx}`).trim(),
          name: String(r['اسم_المورد'] || r['اسم المورد'] || r['الاسم'] || r['Name'] || `مورد ${idx + 1}`).trim(),
          phone: String(r['رقم_الهاتف'] || r['الهاتف'] || r['الجوال'] || r['Phone'] || '').trim(),
          email: String(r['البريد_الإلكتروني'] || r['البريد'] || r['Email'] || '').trim(),
          balance: Number(r['الرصيد'] || r['Balance'] || 0)
        })).filter(s => s.name.length > 0);
        resolve(suppliers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة ملف الإكسل'));
    reader.readAsArrayBuffer(file);
  });
};

// Parse Full System Backup File (.xlsx)
export const parseFullSystemBackup = async (file: File): Promise<{
  products?: Product[];
  orders?: Order[];
  customers?: Customer[];
  suppliers?: Supplier[];
  employees?: Employee[];
  offers?: Offer[];
  coupons?: Coupon[];
  invoices?: Invoice[];
  settings?: Partial<AppSettings>;
  currencies?: CurrencyRate[];
  importedCounts: { [key: string]: number };
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result: {
          products?: Product[];
          orders?: Order[];
          customers?: Customer[];
          suppliers?: Supplier[];
          employees?: Employee[];
          offers?: Offer[];
          coupons?: Coupon[];
          invoices?: Invoice[];
          settings?: Partial<AppSettings>;
          currencies?: CurrencyRate[];
          importedCounts: { [key: string]: number };
        } = {
          importedCounts: {}
        };

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (!rows || rows.length === 0) return;

          const sName = sheetName.trim();

          // Products & Categories & Groups
          if (sName.includes('المنتجات') || sName.includes('فئات') || sName.includes('مجموعات') || sName.toLowerCase().includes('product')) {
            const products: Product[] = rows.map((r, idx) => {
              const qty = parseInt(r['الكمية_المتاحة'] || r['الكمية المتاحة'] || r['الكمية'] || r['Quantity'] || 10, 10);
              const rawStatus = String(r['حالة_المنتج_والتوفر'] || r['حالة المنتج'] || r['الحالة'] || r['Status'] || '').trim().toLowerCase();
              let productStatus: 'active' | 'inactive' | 'out_of_stock' = 'active';
              if (rawStatus.includes('غير متوفر') || rawStatus.includes('out_of_stock') || rawStatus.includes('نفد') || qty <= 0) {
                productStatus = 'out_of_stock';
              } else if (rawStatus.includes('معطل') || rawStatus.includes('مخفي') || rawStatus.includes('inactive')) {
                productStatus = 'inactive';
              }

              const rawVis = String(r['حالة_الظهور_بالمتجر'] || r['حالة_الظهور'] || r['حالة الظهور'] || r['الظهور'] || r['isVisible'] || '1').trim();
              const isVisible = !(rawVis === '0' || rawVis === 'مخفي' || rawVis === 'معطل' || rawVis.toLowerCase() === 'false');

              return {
                ProductID: r.ProductID || r['الرمز_المميز (ID)'] || r['الرمز المميز'] || `PRD_IMP_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                name: r['اسم_المنتج'] || r['اسم المنتج'] || r['Product Name'] || r['Name'] || 'منتج مستورد',
                SKU: r['رمز_المنتج (SKU)'] || r['رمز المنتج'] || r['SKU'] || `SKU-${Date.now()}-${idx}`,
                Barcode: r['الباركود'] || r['Barcode'] || `62911${Math.floor(10000 + Math.random() * 90000)}`,
                group: r['المجموعة'] || r['المجموعه'] || r['Group'] || 'عام',
                category: r['القسم_الفئة'] || r['القسم'] || r['الفئة'] || r['التصنيف'] || r['Category'] || 'عام',
                costPrice: parseFloat(r['سعر_الشراء_التكلفة'] || r['سعر الشراء'] || r['Cost Price'] || 0),
                salePrice: parseFloat(r['سعر_البيع'] || r['سعر البيع'] || r['Sale Price'] || 0),
                wholesalePrice: parseFloat(r['سعر_الجملة'] || r['سعر الجملة'] || r['Wholesale Price'] || 0),
                discount: parseFloat(r['الخصم (%)'] || r['الخصم'] || 0),
                quantity: isNaN(qty) ? 0 : qty,
                minStock: parseInt(r['الحد_الأدنى'] || r['الحد الأدنى'] || 5, 10),
                images: [
                  r['صورة_1'] || r['صورة 1'] || (typeof r['الصور'] === 'string' && r['الصور'].includes('|') ? r['الصور'].split('|')[0]?.trim() : '') || (typeof r['الصور'] === 'string' && r['الصور'].includes(',') ? r['الصور'].split(',')[0]?.trim() : '') || (typeof r['الصور'] === 'string' ? r['الصور'].trim() : '') || '',
                  r['صورة_2'] || r['صورة 2'] || (typeof r['الصور'] === 'string' && r['الصور'].includes('|') ? r['الصور'].split('|')[1]?.trim() : '') || (typeof r['الصور'] === 'string' && r['الصور'].includes(',') ? r['الصور'].split(',')[1]?.trim() : '') || '',
                  r['صورة_3'] || r['صورة 3'] || (typeof r['الصور'] === 'string' && r['الصور'].includes('|') ? r['الصور'].split('|')[2]?.trim() : '') || (typeof r['الصور'] === 'string' && r['الصور'].includes(',') ? r['الصور'].split(',')[2]?.trim() : '') || ''
                ].filter(Boolean),
                description: r['الوصف'] || '',
                status: productStatus,
                isVisible: isVisible,
                createdAt: r['تاريخ_الرفع'] || r['تاريخ الرفع'] || r['تاريخ الإنشاء'] || r['تاريخ_الإنشاء'] || new Date().toISOString(),
                updatedAt: r['تاريخ_التحديث'] || r['تاريخ التحديث'] || new Date().toISOString()
              };
            });
            result.products = products;
            result.importedCounts['منتجات'] = products.length;
          }

          // Customers
          else if (sName.includes('العملاء') || sName.toLowerCase().includes('customer')) {
            const customers: Customer[] = rows.map((r, idx) => ({
              CustomerID: r.CustomerID || `CUST_IMP_${Date.now()}_${idx}`,
              name: r['الاسم'] || r['اسم العميل'] || r['Name'] || 'عميل',
              phone: String(r['الهاتف'] || r['الجوال'] || r['Phone'] || ''),
              email: r['البريد'] || r['Email'] || '',
              city: r['المدينة'] || r['City'] || 'الرياض',
              address: r['العنوان'] || r['Address'] || '',
              taxNumber: String(r['الرقم الضريبي'] || ''),
              balance: parseFloat(r['الرصيد'] || 0),
              loyaltyPoints: parseInt(r['نقاط الولاء'] || 0, 10)
            }));
            result.customers = customers;
            result.importedCounts['عملاء'] = customers.length;
          }

          // Suppliers
          else if (sName.includes('المورد') || sName.toLowerCase().includes('supplier')) {
            const suppliers: Supplier[] = rows.map((r, idx) => ({
              SupplierID: r.SupplierID || `SUP_IMP_${Date.now()}_${idx}`,
              name: r['الاسم'] || r['اسم المورد'] || 'مورد',
              phone: String(r['الهاتف'] || r['الجوال'] || ''),
              email: r['البريد'] || '',
              balance: parseFloat(r['الرصيد'] || 0)
            }));
            result.suppliers = suppliers;
            result.importedCounts['موردون'] = suppliers.length;
          }

          // Employees
          else if (sName.includes('الموظف') || sName.toLowerCase().includes('employee')) {
            const employees: Employee[] = rows.map((r, idx) => ({
              EmployeeID: r.EmployeeID || `EMP_IMP_${Date.now()}_${idx}`,
              name: r['الاسم'] || 'موظف',
              username: r['اسم المستخدم'] || `user_${idx}`,
              passwordHash: String(r['كلمة المرور'] || '123456'),
              role: r['الدور الوظيفي'] || r['الدور'] || 'Cashier',
              permissions: ['all'],
              lastLogin: r['آخر دخول'] || new Date().toISOString().split('T')[0]
            }));
            result.employees = employees;
            result.importedCounts['موظفون'] = employees.length;
          }

          // Offers
          else if (sName.includes('العروض') || sName.toLowerCase().includes('offer')) {
            const offers: Offer[] = rows.map((r, idx) => ({
              OfferID: r.OfferID || `OFF_IMP_${Date.now()}_${idx}`,
              title: r['العنوان'] || r['اسم العرض'] || 'عرض',
              discountPercentage: parseFloat(r['نسبة الخصم'] || 20),
              startDate: r['تاريخ البداية'] || '2026-08-01',
              endDate: r['تاريخ النهاية'] || '2026-12-31',
              status: r['الحالة'] || 'active'
            }));
            result.offers = offers;
            result.importedCounts['عروض'] = offers.length;
          }

          // Coupons
          else if (sName.includes('الكوبونات') || sName.toLowerCase().includes('coupon')) {
            const coupons: Coupon[] = rows.map((r, idx) => ({
              CouponCode: String(r['CouponCode'] || r['كود الكوبون'] || r['الرمز'] || `CPN_${idx}`).toUpperCase(),
              discountValue: parseFloat(r['قيمة الخصم'] || r['الخصم'] || 10),
              discountType: r['نوع الخصم'] === 'fixed' ? 'fixed' : 'percentage',
              minOrderAmount: parseFloat(r['الحد الأدنى للطلب'] || r['الحد الأدنى'] || 0),
              expiryDate: r['تاريخ الانتهاء'] || '2026-12-31',
              usageCount: parseInt(r['مرات الاستخدام'] || 0, 10)
            }));
            result.coupons = coupons;
            result.importedCounts['كوبونات'] = coupons.length;
          }

          // Orders
          else if (sName.includes('الطلبات') || sName.toLowerCase().includes('order')) {
            const orders: Order[] = rows.map((r, idx) => ({
              OrderID: r.OrderID || `ORD_IMP_${Date.now()}_${idx}`,
              orderNumber: String(r['رقم الطلب'] || `ORD-${Date.now()}-${idx}`),
              customerName: r['اسم العميل'] || r['العميل'] || 'عميل',
              phone: String(r['الهاتف'] || ''),
              country: r['الدولة'] || 'SA',
              city: r['المدينة'] || 'الرياض',
              address: r['العنوان'] || '',
              items: [],
              totalQuantity: parseInt(r['عدد المنتجات'] || 1, 10),
              tax: parseFloat(r['الضريبة'] || 0),
              discount: parseFloat(r['الخصم'] || 0),
              shippingFee: parseFloat(r['مصاريف الشحن'] || 0),
              totalAmount: parseFloat(r['المبلغ الإجمالي'] || r['الإجمالي'] || 0),
              orderStatus: r['حالة الطلب'] || 'completed',
              paymentStatus: r['حالة الدفع'] || 'paid',
              paymentMethod: r['طريقة الدفع'] || 'كاش',
              employeeName: r['الموظف'] || 'المدير المسؤول',
              date: r['التاريخ'] || new Date().toISOString().split('T')[0],
              shippingCompany: r['شركة الشحن'] || r['الناقل'] || '',
              trackingNumber: String(r['رقم التتبع'] || r['رقم_التتبع'] || ''),
              pricesFinished: r['حالة التسعير'] === 'تم إنهاء السعر' || r['حالة_التسعير'] === 'تم إنهاء السعر'
            }));
            result.orders = orders;
            result.importedCounts['طلبات'] = orders.length;
          }

          // Settings
          else if (sName.includes('الإعدادات') || sName.includes('الاعدادات') || sName.toLowerCase().includes('setting')) {
            const settingsUpdate: Partial<AppSettings> = {};

            // Check if rows are Key-Value structure (e.g. خاصية_الإعداد / القيمة)
            let isKeyValue = false;
            rows.forEach(r => {
              const keyCol = r['خاصية_الإعداد'] || r['خاصية الإعداد'] || r['الخاصية'] || r['الإعداد'] || r['المفتاح'] || r['Key'] || r['Property'] || r['Setting'];
              const valCol = r['القيمة'] || r['قيمة_الإعداد'] || r['Value'] || r['Val'];
              
              if (keyCol !== undefined && valCol !== undefined) {
                isKeyValue = true;
                const k = String(keyCol).trim();
                const v = String(valCol).trim();

                if (k.includes('اسم_المتجر') || k.includes('اسم المتجر') || k === 'storeName') settingsUpdate.storeName = v;
                if (k.includes('شعار') || k === 'storeLogoUrl') settingsUpdate.storeLogoUrl = v;
                if (k.includes('سلوجن') || k.includes('شعار_لفظي') || k.includes('storeTagline')) settingsUpdate.storeTagline = v;
                if (k.includes('كلمة_مرور') || k.includes('PIN') || k === 'adminPasswordHash') settingsUpdate.adminPasswordHash = v;
                if (k.includes('هاتف_المتجر') || k.includes('الهاتف') || k === 'storePhone') settingsUpdate.storePhone = v;
                if (k.includes('واتساب') || k === 'storeWhatsApp') settingsUpdate.storeWhatsApp = v;
                if (k.includes('السعودية') || k === 'storePhoneSaudi') settingsUpdate.storePhoneSaudi = v;
                if (k.includes('اليمن') || k === 'storePhoneYemen') settingsUpdate.storePhoneYemen = v;
                if (k.includes('عنوان') || k === 'storeAddress') settingsUpdate.storeAddress = v;
                if (k.includes('فروع') || k === 'storeBranches') settingsUpdate.storeBranches = v;
                if (k.includes('توصيل') || k === 'deliveryInfo') settingsUpdate.deliveryInfo = v;
                if (k.includes('نبذة') || k === 'footerAbout') settingsUpdate.footerAbout = v;
                if (k.includes('ضريبي') || k === 'taxNumber') settingsUpdate.taxNumber = v;
                if (k.includes('تفعيل_الضريبة') || k === 'enableVat') settingsUpdate.enableVat = (v === 'مفعل' || v === 'true' || v === 'نعم' || v === '1');
                if (k.includes('نسبة_الضريبة') || k === 'vatPercentage') settingsUpdate.vatPercentage = parseFloat(v.replace('%', '')) || 15;
                if (k.includes('العملة') || k === 'defaultCurrency') settingsUpdate.defaultCurrency = v;
                if (k.includes('الدولة') || k === 'targetCountry') settingsUpdate.targetCountry = v as any;
                if (k.includes('اليمني') || k === 'yerExchangeRate') settingsUpdate.yerExchangeRate = Number(v) || 535;
                if (k.includes('الدولار') || k === 'usdExchangeRate') settingsUpdate.usdExchangeRate = Number(v) || 3.75;
                
                if (!settingsUpdate.socialLinks) settingsUpdate.socialLinks = {};
                if (k.includes('تيك_توك') || k.includes('تيك توك') || k === 'tiktok') settingsUpdate.socialLinks.tiktok = v;
                if (k.includes('انستقرام') || k.includes('إنستغرام') || k === 'instagram') settingsUpdate.socialLinks.instagram = v;
                if (k.includes('فيسبوك') || k === 'facebook') settingsUpdate.socialLinks.facebook = v;
                if (k.includes('سناب') || k === 'snapchat') settingsUpdate.socialLinks.snapchat = v;
                if (k.includes('تيليجرام') || k.includes('تلجرام') || k === 'telegram') settingsUpdate.socialLinks.telegram = v;
                if (k.includes('تويتر') || k.includes('إكس') || k === 'twitter') settingsUpdate.socialLinks.twitter = v;

                if (k.includes('الأساسي') || k.includes('Primary') || k === 'themePrimaryColor') settingsUpdate.themePrimaryColor = v;
                if (k.includes('الثانوي') || k.includes('Secondary') || k === 'themeSecondaryColor') settingsUpdate.themeSecondaryColor = v;
                if (k.includes('التمييز') || k.includes('Accent') || k === 'themeAccentColor') settingsUpdate.themeAccentColor = v;
                if (k.includes('الخلفية') || k.includes('Background') || k === 'themeBgColor') settingsUpdate.themeBgColor = v;
                if (k.includes('النص') || k.includes('Text') || k === 'themeTextColor') settingsUpdate.themeTextColor = v;
                if (k.includes('الأيقونات') || k.includes('Icons') || k === 'themeIconColor') settingsUpdate.themeIconColor = v;
                if (k.includes('نمط') || k === 'themePreset') settingsUpdate.themePreset = v;
                if (k.includes('وضع') || k === 'themeMode') settingsUpdate.themeMode = v === 'light' ? 'light' : 'dark';
                if (k.includes('NFC') || k === 'defaultStoreUrl') settingsUpdate.defaultStoreUrl = v;

                if (k.includes('أندرويد') || k === 'appDownloadAndroid') settingsUpdate.appDownloadAndroid = v;
                if (k.includes('آيفون') || k === 'appDownloadiOS') settingsUpdate.appDownloadiOS = v;
                if (k.includes('هواوي') || k === 'appDownloadHuawei') settingsUpdate.appDownloadHuawei = v;
                if (k.includes('الكمبيوتر') || k === 'appDownloadDesktop') settingsUpdate.appDownloadDesktop = v;
                if (k.includes('عنوان_بانر') || k === 'appDownloadTitle') settingsUpdate.appDownloadTitle = v;
                if (k.includes('وصف_بانر') || k === 'appDownloadDescription') settingsUpdate.appDownloadDescription = v;
                if (k.includes('تفعيل_عرض_بانر') || k === 'showAppDownloadBanner') settingsUpdate.showAppDownloadBanner = (v === 'مفعل' || v === 'true' || v === 'نعم');
              }
            });

            // If not key-value, treat row 0 as column headers
            if (!isKeyValue && rows[0]) {
              const row = rows[0];
              if (row['اسم المتجر'] || row['اسم_المتجر'] || row['storeName']) settingsUpdate.storeName = row['اسم المتجر'] || row['اسم_المتجر'] || row['storeName'];
              if (row['الشعار'] || row['شعار_المتجر'] || row['storeLogoUrl']) settingsUpdate.storeLogoUrl = row['الشعار'] || row['شعار_المتجر'] || row['storeLogoUrl'];
              if (row['شعار لفظي'] || row['storeTagline']) settingsUpdate.storeTagline = row['شعار لفظي'] || row['storeTagline'];
              if (row['رقم الهاتف'] || row['هاتف_المتجر'] || row['storePhone']) settingsUpdate.storePhone = String(row['رقم الهاتف'] || row['هاتف_المتجر'] || row['storePhone']);
              if (row['الواتساب'] || row['واتساب_المتجر'] || row['storeWhatsApp']) settingsUpdate.storeWhatsApp = String(row['الواتساب'] || row['واتساب_المتجر'] || row['storeWhatsApp']);
              if (row['هاتف فرع السعودية'] || row['هاتف_فرع_السعودية'] || row['storePhoneSaudi']) settingsUpdate.storePhoneSaudi = String(row['هاتف فرع السعودية'] || row['هاتف_فرع_السعودية'] || row['storePhoneSaudi']);
              if (row['هاتف فرع اليمن'] || row['هاتف_فرع_اليمن'] || row['storePhoneYemen']) settingsUpdate.storePhoneYemen = String(row['هاتف فرع اليمن'] || row['هاتف_فرع_اليمن'] || row['storePhoneYemen']);
              if (row['العنوان'] || row['عنوان_المتجر'] || row['storeAddress']) settingsUpdate.storeAddress = row['العنوان'] || row['عنوان_المتجر'] || row['storeAddress'];
              if (row['الفروع'] || row['فروع_المتجر'] || row['storeBranches']) settingsUpdate.storeBranches = row['الفروع'] || row['فروع_المتجر'] || row['storeBranches'];
              if (row['معلومات التوصيل'] || row['معلومات_التوصيل'] || row['deliveryInfo']) settingsUpdate.deliveryInfo = row['معلومات التوصيل'] || row['معلومات_التوصيل'] || row['deliveryInfo'];
              if (row['نبذة عن المتجر'] || row['نبذة_عن_المتجر'] || row['footerAbout']) settingsUpdate.footerAbout = row['نبذة عن المتجر'] || row['نبذة_عن_المتجر'] || row['footerAbout'];
              if (row['الرقم الضريبي'] || row['الرقم_الضريبي'] || row['taxNumber']) settingsUpdate.taxNumber = String(row['الرقم الضريبي'] || row['الرقم_الضريبي'] || row['taxNumber']);
              if (row['نسبة الضريبة'] || row['نسبة_الضريبة'] || row['vatPercentage']) settingsUpdate.vatPercentage = Number(row['نسبة الضريبة'] || row['نسبة_الضريبة'] || row['vatPercentage']);
              if (row['العملة الافتراضية'] || row['العملة_الافتراضية'] || row['defaultCurrency']) settingsUpdate.defaultCurrency = row['العملة الافتراضية'] || row['العملة_الافتراضية'] || row['defaultCurrency'];
              if (row['SpreadsheetID'] || row['spreadsheetId']) settingsUpdate.spreadsheetId = row['SpreadsheetID'] || row['spreadsheetId'];
              if (row['GoogleAppsScriptURL'] || row['googleAppsScriptUrl']) settingsUpdate.googleAppsScriptUrl = row['GoogleAppsScriptURL'] || row['googleAppsScriptUrl'];
              
              const social: any = {};
              if (row['تيك توك'] || row['tiktok']) social.tiktok = row['تيك توك'] || row['tiktok'];
              if (row['إنستغرام'] || row['انستقرام'] || row['instagram']) social.instagram = row['إنستغرام'] || row['انستقرام'] || row['instagram'];
              if (row['تلجرام'] || row['تيليجرام'] || row['telegram']) social.telegram = row['تلجرام'] || row['تيليجرام'] || row['telegram'];
              if (row['فيسبوك'] || row['facebook']) social.facebook = row['فيسبوك'] || row['facebook'];
              if (row['سناب شات'] || row['snapchat']) social.snapchat = row['سناب شات'] || row['snapchat'];
              if (row['تويتر'] || row['twitter']) social.twitter = row['تويتر'] || row['twitter'];
              if (Object.keys(social).length > 0) {
                settingsUpdate.socialLinks = social;
              }

              if (row['اللون الأساسي (Primary)'] || row['themePrimaryColor']) settingsUpdate.themePrimaryColor = row['اللون الأساسي (Primary)'] || row['themePrimaryColor'];
              if (row['اللون الثانوي (Secondary)'] || row['themeSecondaryColor']) settingsUpdate.themeSecondaryColor = row['اللون الثانوي (Secondary)'] || row['themeSecondaryColor'];
              if (row['لون التمييز (Accent)'] || row['themeAccentColor']) settingsUpdate.themeAccentColor = row['لون التمييز (Accent)'] || row['themeAccentColor'];
              if (row['لون الخلفية (Background)'] || row['themeBgColor']) settingsUpdate.themeBgColor = row['لون الخلفية (Background)'] || row['themeBgColor'];
              if (row['لون النص (Text)'] || row['themeTextColor']) settingsUpdate.themeTextColor = row['لون النص (Text)'] || row['themeTextColor'];
              if (row['لون الأيقونات (Icons)'] || row['themeIconColor']) settingsUpdate.themeIconColor = row['لون الأيقونات (Icons)'] || row['themeIconColor'];
              if (row['نمط الثيم'] || row['themePreset']) settingsUpdate.themePreset = row['نمط الثيم'] || row['themePreset'];
              if (row['وضع المظهر (Theme Mode)'] || row['themeMode'] || row['وضع_الثيم']) settingsUpdate.themeMode = (row['وضع المظهر (Theme Mode)'] || row['themeMode'] || row['وضع_الثيم']) === 'light' ? 'light' : 'dark';
              if (row['رابط المتجر NFC'] || row['رابط_المتجر_NFC'] || row['defaultStoreUrl']) settingsUpdate.defaultStoreUrl = String(row['رابط المتجر NFC'] || row['رابط_المتجر_NFC'] || row['defaultStoreUrl']);
            }

            if (Object.keys(settingsUpdate).length > 0) {
              result.settings = settingsUpdate;
              result.importedCounts['إعدادات'] = 1;
            }
          }
        });

        resolve(result);
      } catch (err) {
        reject(new Error('فشل قراءة ملف النسخة الاحتياطية. يرجى التأكد من اختيار ملف إكسل صحيح (.xlsx)'));
      }
    };
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الإكسل'));
    reader.readAsArrayBuffer(file);
  });
};
