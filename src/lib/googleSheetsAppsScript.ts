import { DEFAULT_PRODUCT_IMAGE, convertHexToImageUrl, formatProductImagesForDualCells } from './imageUtils';
import { Product, Category, CategoryGroup, Order, Customer, Supplier, Employee, Offer, Coupon, Invoice, AppSettings, CurrencyRate, AuditLog, ReferralPartner, Subscription } from '../types';
import { sanitizeAndDeduplicateSuppliers, sanitizeAndDeduplicateOffers, sanitizeAndDeduplicateCoupons, sanitizeAndDeduplicateCategories, sanitizeAndDeduplicateProducts } from './offlineStorage';
import { formatCleanDate } from './dateUtils';


/**
 * =========================================================================
 * 🚀 اوفالي (Rwnaq Store) - السكربت الذكي للمزامنة اللحظية والصور وإكسل المحلات
 * =========================================================================
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * 🚀 اوفالي (Rwnaq Store) - السكربت السحابي الشامل لمزامنة كافة بيانات المتجر (15 ورقة عمل)
 * =========================================================================
 * يدعم المزامنة الكاملة لـ:
 * 1. المنتجات والصور المزدوجة (صورتان حسب الإكسل الموحد 17 عمود)
 * 2. التصنيفات والأقسام (بدون صور إضافية)
 * 3. المجموعات
 * 4. الاشتراكات والخطط
 * 5. إعدادات المتجر والشعار وكلمة المرور PIN والضرائب
 * 6. الموظفين والصلاحيات
 * 7. العملات وأسعار الصرف (SAR, YER, USD)
 * 8. الطلبات والمبيعات
 * 9. العملاء ونقاط الولاء
 * 10. الموردين وحساباتهم
 * 11. الفواتير الضريبية ZATCA
 * 12. العروض الترويجية
 * 13. الكوبونات وقسائم الخصم
 * 14. سجل العمليات والتدقيق
 * 15. المسوقين وشركاء الأرباح
 */

const SHEETS_CONFIG = {
  "المنتجات": [
    "الرمز_المميز (ID)", "رمز_المنتج (SKU)", "اسم_المنتج", 
    "معرف_القسم", "اسم_القسم", "معرف_المجموعة", "اسم_المجموعة", 
    "سعر_البيع القديم", "سعر_البيع الجديد", "سعر_التكلفة", "الكمية_المتاحة", "حالة_المنتج", 
    "صورة_رئيسية", "صورة_ثانية", "الوصف", "ترتيب_الفرز", "تاريخ_التحديث", "تاريخ_الرفع"
  ],
  "التصنيفات": [
    "معرف_القسم", "اسم_القسم", "معرف_المجموعة", "اسم_المجموعة", "حالة_القسم", "الوصف", "ترتيب_الفرز", "الصورة"
  ],
  "المجموعات": [
    "معرف_المجموعة", "اسم_المجموعة", "حالة_المجموعة", "الوصف", "ترتيب_الفرز", "الصورة"
  ],
  "الاشتراكات": [
    "معرف_الاشتراك", "اسم_المشترك", "نوع_الاشتراك", "خطة_الاشتراك", "المبلغ", "دورية_السداد", 
    "تاريخ_البدء", "تاريخ_الانهاء", "حالة_الاشتراك", "طريقة_الدفع", "تاريخ_التحديث"
  ],
  "إعدادات_المتجر": [
    "خاصية_الإعداد", "القيمة", "الوصف", "تاريخ_التحديث"
  ],
  "الموظفين": [
    "معرف_الموظف", "اسم_الموظف", "اسم_المستخدم", "كلمة_المرور", "الدور_الوظيفي", "الصلاحيات", "آخر_تسجيل_دخول"
  ],
  "العملات": [
    "رمز_العملة", "اسم_العملة", "الرمز", "سعر_الصرف_مقابل_SAR", "تاريخ_التحديث"
  ],
  "الطلبات": [
    "معرف_الطلب", "رقم_الطلب", "اسم_العميل", "هاتف_العميل", "الدولة", "المدينة", "العنوان", 
    "المبلغ_الإجمالي", "طريقة_الدفع", "حالة_الطلب", "تفاصيل_المنتجات", "الموظف_المسؤول", "التاريخ",
    "شركة_الشحن", "رقم_التتبع"
  ],
  "العملاء": [
    "معرف_العميل", "اسم_العميل", "رقم_الهاتف", "البريد_الإلكتروني", "المدينة", "العنوان", "الرقم_الضريبي", "الرصيد", "نقاط_الولاء"
  ],
  "الموردين": [
    "معرف_المورد", "اسم_المورد", "الهاتف", "البريد_الإلكتروني", "الرصيد"
  ],
  "الفواتير": [
    "معرف_الفاتورة", "رقم_الفاتورة", "اسم_العميل", "الرقم_الضريبي", "ملخص_الأصناف", "مبلغ_الضريبة", "المبلغ_الإجمالي", "طريقة_الدفع", "الموظف_المسؤول", "التاريخ"
  ],
  "العروض": [
    "معرف_العرض", "عنوان_العرض", "نسبة_الخصم", "تاريخ_البدء", "تاريخ_الانتهاء", "الحالة"
  ],
  "الكوبونات": [
    "معرف_الكوبون", "كود_الخصم", "نوع_الخصم", "قيمة_الخصم", "الحد_الأدنى_للطلب", "تاريخ_الانتهاء", "مرات_الاستخدام", "الحالة"
  ],
  "سجل_العمليات": [
    "معرف_السجل", "المستخدم", "نوع_الإجراء", "التفاصيل", "التاريخ_والوقت"
  ],
  "المسوقين": [
    "معرف_المسوق", "اسم_المسوق", "رقم_الهاتف", "كود_الإحالة", "النقرات", "المسجلين", "الطلبات_المكتملة", "إجمالي_الأرباح", "الأرباح_المصروفة", "الرصيد_المتاح", "حالة_السحب", "بيانات_الحساب_البنكي", "تاريخ_التسجيل", "آخر_نشاط"
  ]
};

function setRangeSafe(sheet, startRow, startCol, data) {
  if (!data || data.length === 0 || !data[0] || data[0].length === 0) return;
  sheet.getRange(startRow, startCol, data.length, data[0].length).setValues(data);
}

/**
 * 📅 دالة تنسيق التواريخ والوقت بالصيغة الإنجليزية القياسية (yyyy-MM-dd HH:mm:ss) في Google Sheets
 */
function getFormattedEnglishDate(dateInput) {
  var d = dateInput;
  if (!d) {
    return Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss");
  }
  if (d instanceof Date) {
    return Utilities.formatDate(d, "GMT+3", "yyyy-MM-dd HH:mm:ss");
  }
  var parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "GMT+3", "yyyy-MM-dd HH:mm:ss");
  }
  
  try {
    var cleanStr = String(d);
    cleanStr = cleanStr.replace("،", " ");
    var isPM = cleanStr.indexOf("م") !== -1 || cleanStr.toLowerCase().indexOf("pm") !== -1;
    var isAM = cleanStr.indexOf("ص") !== -1 || cleanStr.toLowerCase().indexOf("am") !== -1;
    
    var cleanChars = [];
    for (var i = 0; i < cleanStr.length; i++) {
      var char = cleanStr.charAt(i);
      if ((char >= '0' && char <= '9') || char === '/' || char === '-' || char === ':' || char === ' ') {
        cleanChars.push(char);
      }
    }
    cleanStr = cleanChars.join("").trim();
    
    while (cleanStr.indexOf("  ") !== -1) {
      cleanStr = cleanStr.replace("  ", " ");
    }
    
    var parts = cleanStr.split(/[\s/:\-]/);
    if (parts.length >= 3) {
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1;
      var day = parseInt(parts[2], 10);
      var hour = parts[3] ? parseInt(parts[3], 10) : 0;
      var minute = parts[4] ? parseInt(parts[4], 10) : 0;
      var second = parts[5] ? parseInt(parts[5], 10) : 0;
      
      if (year < 100) {
        var temp = year;
        year = day;
        day = temp;
      }
      
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      
      var checkDate = new Date(year, month, day, hour, minute, second);
      if (!isNaN(checkDate.getTime())) {
        return Utilities.formatDate(checkDate, "GMT+3", "yyyy-MM-dd HH:mm:ss");
      }
    }
  } catch (e) {}
  
  return Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss");
}

/**
 * ⚙️ دالة التثبيت الأولي وإنشاء الصفوف والجداول بكافة الأوراق مع التهيئة التلقائية (Default Seeds)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try { ss.setSpreadsheetDirection(SpreadsheetApp.TextDirection.RIGHT_TO_LEFT); } catch(e) {}

  const now = getFormattedEnglishDate();

  for (let sheetName in SHEETS_CONFIG) {
    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const headers = SHEETS_CONFIG[sheetName];
    
    // وضع الهيدر
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e1b4b")
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setFontSize(10)
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
               
    sheet.setRowHeight(1, 36);
    sheet.setFrozenRows(1);

    // إذا كانت الورقة فارغة، زراعة البيانات الافتراضية الأولية فوراً
    if (sheet.getLastRow() <= 1) {
      let seedData = [];
      if (sheetName === "العملات") {
        seedData = [
          ["SAR", "ريال سعودي", "ر.س", 1.0, now],
          ["YER", "ريال يمني", "ر.ي", 535.0, now],
          ["USD", "دولار أمريكي", "$", 0.2667, now]
        ];
      } else if (sheetName === "العروض") {
        seedData = [
          ["OFF_01", "عروض الصيف الفاخرة", 20, "2026-01-01", "2026-12-31", "active"],
          ["OFF_02", "تخفيضات العيد للأزياء", 15, "2026-01-01", "2026-12-31", "active"]
        ];
      } else if (sheetName === "الكوبونات") {
        seedData = [
          ["CPN_01", "RWNAQ20", "percentage", 20, 100, "2026-12-31", 0, "active"],
          ["CPN_02", "WELCOME10", "fixed", 10, 50, "2026-12-31", 0, "active"]
        ];
      } else if (sheetName === "الموظفين") {
        seedData = [
          ["EMP_01", "المدير العام (Super Admin)", "admin", "123456", "SuperAdmin", "all", now]
        ];
      } else if (sheetName === "التصنيفات") {
        seedData = [
          ["CAT_01", "فساتين سهرة", "GRP_01", "أزياء نسائية", "ظاهر (1)", "فساتين سهرة ومناسبات راقية"],
          ["CAT_02", "حقائب فاخرة", "GRP_02", "حقائب وإكسسوارات", "ظاهر (1)", "حقائب يد ومحافظ أنيقة"],
          ["CAT_03", "أطقم وملابس", "GRP_01", "أزياء نسائية", "ظاهر (1)", "أحدث تشكيلات الأزياء اليومية"],
          ["CAT_04", "إكسسوارات", "GRP_02", "حقائب وإكسسوارات", "ظاهر (1)", "إكسسوارات ومجوهرات نسائية"]
        ];
      } else if (sheetName === "المجموعات") {
        seedData = [
          ["GRP_01", "أزياء نسائية", "ظاهر (1)", "تشكيلة الأزياء والفساتين"],
          ["GRP_02", "حقائب وإكسسوارات", "ظاهر (1)", "أرقى الحقائب والإكسسوارات"],
          ["GRP_03", "عام", "ظاهر (1)", "مجموعة عامة"]
        ];
      } else if (sheetName === "الاشتراكات") {
        seedData = [
          ["SUB_001", "متجر اوفيلي الفاخر", "متجر إلكتروني", "الباقة الاحترافية Pro", 299, "سنوي", "2026-01-01", "2026-12-31", "نشط", "تحويل بنكي / بطاقة", now]
        ];
      } else if (sheetName === "إعدادات_المتجر") {
        seedData = [
          ["اسم_المتجر", "اوفالي الفاخر", "اسم المتجر التجاري المعتمد", now],
          ["شعار_المتجر", "", "رابط أو صورة شعار المتجر (Logo)", now],
          ["كلمة_مرور_المدير_PIN", "123456", "الرمز السري للوحة تحكم الإدارة", now],
          ["هاتف_المتجر", "966599539659", "رقم الاتصال المباشر الأساسي", now],
          ["واتساب_المتجر", "966599539659", "رقم محادثات واتساب لخدمة العملاء", now],
          ["هاتف_فرع_السعودية", "966599539659", "رقم الاتصال الخاص بفرع السعودية", now],
          ["هاتف_فرع_اليمن", "967715989357", "رقم الاتصال الخاص بفرع اليمن", now],
          ["عنوان_المتجر", "المملكة العربية السعودية / الجمهورية اليمنية", "العنوان الرئيسي وموقع الإدارة", now],
          ["فروع_المتجر", "فرع الرياض: حي العليا | فرع صنعاء: شارع حدة", "قائمة الفروع المعتمدة", now],
          ["معلومات_التوصيل", "توصيل سريع لكافة المدن والمناطق خلال 24-48 ساعة", "سياسة الشحن ومواعيد التوصيل", now],
          ["الرقم_الضريبي", "300000000000003", "الرقم الضريبي الرسمي للمنشأة", now],
          ["العملة_الافتراضية", "SAR", "العملة الأساسية (SAR / YER / USD)", now],
          ["سعر_صرف_الريال_اليمني", "535", "سعر صرف الريال اليمني مقابل 1 ريال سعودي", now],
          ["لون_المتجر_الأساسي_Primary", "#ec4899", "اللون الأساسي للأزرار والعناصر والشريط والأيقونات", now],
          ["لون_المتجر_الثانوي_Secondary", "#9333ea", "اللون الثانوي للتدرجات والبطاقات", now],
          ["لون_التمييز_Accent", "#f43f5e", "لون التمييز والعروض وأوسمة الخصم", now],
          ["لون_الخلفية_Background", "#090d16", "لون الخلفية العامة للمتجر", now],
          ["نمط_الثيم_المحدد", "وردي وأسود وبنفسجي (الافتراضي)", "اسم النمط المختار", now]
        ];
      } else if (sheetName === "الموردين") {
        seedData = [
          ["SUP_01", "مجموعة الأزياء العالمية", "966500000001", "supplier@store.com", 0]
        ];
      } else if (sheetName === "المسوقين") {
        seedData = [
          ["REF_101", "محمد العماري (VIP)", "966599539659", "mohammed_vip", 142, 38, 14, 350, 150, 200, "none", "مصرف الراجحي - SA4580000123456789012345", "2026-08-01", now],
          ["REF_102", "سارة القحطاني", "0559876543", "sara_style", 89, 22, 8, 180, 0, 180, "requested", "بنك الأهلي السعودي - SA9210000098765432109876", "2026-08-05", now]
        ];
      }
      setRangeSafe(sheet, 2, 1, seedData);
    }
    
    try { sheet.autoResizeColumns(1, headers.length); } catch(e) {}
  }

  const defaultSheet = ss.getSheetByName("ورقة1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  try {
    SpreadsheetApp.getUi().alert("✅ تم إعداد وتنسيق كافة جداول وقواعد بيانات اوفالي (13 ورقة عمل كاملة تشمل المسوقين والروابط) وتعبئة البيانات بنجاح!");
  } catch (e) {
    // UI not available in standalone execution context
  }
}

/**
 * 🌐 استقبال طلبات GET (الجلب الفوري واللحظي لكافة البيانات)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'read_all';
  
  if (action === 'ping' || action === 'check_connection') {
    return createJsonResponse({ status: "success", connected: true, timestamp: new Date().toISOString() });
  }

  return readAllSheetsData();
}

/**
 * 📥 استقبال طلبات POST (المزامنة الشاملة، حفظ الإعدادات، الموظفين، المنتجات، والطلبات)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const postContent = e && e.postData && e.postData.contents ? e.postData.contents : null;
    if (!postContent) return createJsonResponse({ success: false, message: "لا توجد بيانات مستلمة" });

    const payload = JSON.parse(postContent);
    const action = payload.action || 'sync_all';

    // 1. فحص الاتصال
    if (action === 'ping') {
      return createJsonResponse({ success: true, connected: true });
    }

    // 2. مزامنة شاملة لكافة أوراق العمل والبيانات
    if (action === 'sync_all' || action === 'sync_everything' || action === 'import_excel_data') {
      return handleFullSync(payload);
    }

    // 3. حفظ وتحديث إعدادات المتجر
    if (action === 'save_settings' && payload.settings) {
      handleSyncSettings(payload.settings);
      return createJsonResponse({ success: true, message: "تم تحديث إعدادات المتجر والشعار في Google Sheets بنجاح!" });
    }

    // 4. الموظفين: تعديل/إضافة منفرد أو حذف أو جماعي
    if (action === 'save_employee' && payload.employee) {
      return handleUpsertEmployeeRow(payload.employee);
    }
    if (action === 'delete_employee') {
      return handleDeleteEmployeeRow(payload.EmployeeID || payload.id);
    }
    if (action === 'save_employees' && payload.employees) {
      handleSyncEmployees(payload.employees);
      return createJsonResponse({ success: true, message: "تم تحديث بيانات الموظفين في Google Sheets بنجاح!" });
    }

    // 5. حفظ / تعديل العملات
    if (action === 'save_currencies' && payload.currencies) {
      handleSyncCurrencies(payload.currencies);
      return createJsonResponse({ success: true, message: "تم تحديث العملات في Google Sheets بنجاح!" });
    }

    // 6. العروض الترويجية: تعديل/إضافة منفرد أو حذف أو جماعي
    if (action === 'save_offer' && payload.offer) {
      return handleUpsertOfferRow(payload.offer);
    }
    if (action === 'delete_offer') {
      return handleDeleteOfferRow(payload.OfferID || payload.id);
    }
    if (action === 'save_offers' && payload.offers) {
      handleSyncOffers(payload.offers);
      return createJsonResponse({ success: true, message: "تم تحديث العروض في Google Sheets بنجاح!" });
    }

    // 7. الكوبونات: تعديل/إضافة منفرد أو حذف أو جماعي
    if (action === 'save_coupon' && payload.coupon) {
      return handleUpsertCouponRow(payload.coupon);
    }
    if (action === 'delete_coupon') {
      return handleDeleteCouponRow(payload.CouponCode || payload.code || payload.id);
    }
    if (action === 'save_coupons' && payload.coupons) {
      handleSyncCoupons(payload.coupons);
      return createJsonResponse({ success: true, message: "تم تحديث الكوبونات في Google Sheets بنجاح!" });
    }

    // 8. الموردين: تعديل/إضافة منفرد أو حذف أو جماعي
    if (action === 'save_supplier' && payload.supplier) {
      return handleUpsertSupplierRow(payload.supplier);
    }
    if (action === 'delete_supplier') {
      return handleDeleteSupplierRow(payload.SupplierID || payload.id);
    }
    if (action === 'save_suppliers' && payload.suppliers) {
      handleSyncSuppliers(payload.suppliers);
      return createJsonResponse({ success: true, message: "تم تحديث وحفظ بيانات الموردين في Google Sheets بنجاح!" });
    }

    // 9. العملاء: تعديل/إضافة منفرد أو حذف أو جماعي
    if (action === 'save_customer' && payload.customer) {
      return handleUpsertCustomerRow(payload.customer);
    }
    if (action === 'delete_customer') {
      return handleDeleteCustomerRow(payload.CustomerID || payload.id);
    }
    if (action === 'save_customers' && payload.customers) {
      handleSyncCustomers(payload.customers);
      return createJsonResponse({ success: true, message: "تم تحديث بيانات العملاء في Google Sheets بنجاح!" });
    }

    // 10. الأقسام والتصنيفات
    if (action === 'save_category' && payload.category) {
      return handleUpsertCategoryRow(payload.category);
    }
    if (action === 'delete_category') {
      return handleDeleteCategoryRow(payload.CategoryID || payload.name || payload.id);
    }
    if (action === 'save_all_categories' && payload.categories) {
      if (Array.isArray(payload.categories)) {
        payload.categories.forEach(cat => handleUpsertCategoryRow(cat));
      }
      return createJsonResponse({ success: true, message: "تم تحديث الأقسام بنجاح" });
    }

    // 11. إضافة سجل إلى سجل العمليات
    if (action === 'save_audit_log' && payload.log) {
      handleAppendAuditLog(payload.log);
      return createJsonResponse({ success: true, message: "تم تسجيل العملية في Google Sheets بنجاح!" });
    }
    if (action === 'save_audit_logs' && payload.auditLogs) {
      handleSyncAuditLogs(payload.auditLogs);
      return createJsonResponse({ success: true, message: "تم حفظ سجل العمليات في Google Sheets بنجاح!" });
    }
    if (action === 'clear_audit_logs') {
      handleClearAuditLogs();
      return createJsonResponse({ success: true, message: "تم تفريغ وتهيئة سجل العمليات في Google Sheets بنجاح!" });
    }

    // 12. حفظ / تعديل منتج منفرد (صف محدد فقط + ترتيب صورتين)
    if (action === 'save_product' && payload.product) {
      return handleUpsertProductRow(payload.product, payload.imageSlots);
    }

    // 13. حذف صنف وتفريغ صفه فوراً بالـ ID / SKU
    if (action === 'delete_product') {
      const sku = payload.sku || payload.ProductID || payload.productId || (payload.product && payload.product.SKU);
      return handleDeleteProductRow(sku);
    }

    // 14. حذف وتفريغ رابط صورة محددة من خلية الأكسل بالـ ID
    if (action === 'delete_product_image') {
      return handleDeleteProductImage(payload);
    }

    // 15. حفظ طلب جديد
    if (action === 'save_order' && payload.order) {
      handleUpsertOrder(payload.order);
      return createJsonResponse({ success: true, message: "تم حفظ الطلب في Google Sheets بنجاح!" });
    }

    // 16. تحديث حالة وتتبع طلب منفرد بالـ OrderID
    if (action === 'save_order_status') {
      return handleUpdateOrderStatus(payload);
    }

    // 17. نظام المسوقين وشركاء الأرباح (Affiliates & Referrals)
    if (action === 'save_affiliate' && (payload.partner || payload.affiliate)) {
      return handleUpsertAffiliateRow(payload.partner || payload.affiliate);
    }
    if (action === 'delete_affiliate') {
      const id = payload.id || payload.partnerId || payload.code || payload.AffiliateID;
      return handleDeleteAffiliateRow(id);
    }
    if (action === 'payout_affiliate') {
      return handlePayoutAffiliate(payload);
    }
    if (action === 'request_affiliate_withdrawal') {
      return handleRequestAffiliateWithdrawal(payload);
    }
    if (action === 'save_affiliates' && (payload.partners || payload.affiliates)) {
      handleSyncAffiliates(payload.partners || payload.affiliates);
      return createJsonResponse({ success: true, message: "تم تحديث بيانات المسوقين في Google Sheets بنجاح!" });
    }

    // 18. المجموعات
    if (action === 'save_group' && payload.group) {
      return handleUpsertGroupRow(payload.group);
    }
    if (action === 'delete_group') {
      return handleDeleteGroupRow(payload.groupId || payload.id || payload.name);
    }
    if (action === 'save_groups' && payload.groups) {
      if (Array.isArray(payload.groups)) {
        payload.groups.forEach(grp => handleUpsertGroupRow(grp));
      }
      return createJsonResponse({ success: true, message: "تم تحديث المجموعات في Google Sheets بنجاح!" });
    }

    // 19. الاشتراكات
    if (action === 'save_subscription' && payload.subscription) {
      return handleUpsertSubscriptionRow(payload.subscription);
    }
    if (action === 'delete_subscription') {
      return handleDeleteSubscriptionRow(payload.SubscriptionID || payload.id);
    }
    if (action === 'save_subscriptions' && payload.subscriptions) {
      handleSyncSubscriptions(payload.subscriptions);
      return createJsonResponse({ success: true, message: "تم تحديث بيانات الاشتراكات في Google Sheets بنجاح!" });
    }

    // معالجة عامة للحفظ الشامل
    return handleFullSync(payload);

  } catch (error) {
    return createJsonResponse({ success: false, message: "خطأ بالسكربت: " + error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🔄 المزامنة الشاملة لكافة أوراق العمل
 */
function handleFullSync(payload) {
  let counts = {};

  if (Array.isArray(payload.products)) {
    counts.products = handleSyncProducts(payload.products, payload.categories);
  }
  if (payload.settings) {
    counts.settings = handleSyncSettings(payload.settings);
  }
  if (Array.isArray(payload.employees)) {
    counts.employees = handleSyncEmployees(payload.employees);
  }
  if (Array.isArray(payload.currencies)) {
    counts.currencies = handleSyncCurrencies(payload.currencies);
  }
  if (Array.isArray(payload.categories)) {
    counts.categories = handleSyncCategories(payload.categories);
  }
  if (Array.isArray(payload.groups)) {
    counts.groups = handleSyncGroups(payload.groups);
  }
  if (Array.isArray(payload.subscriptions)) {
    counts.subscriptions = handleSyncSubscriptions(payload.subscriptions);
  }
  if (Array.isArray(payload.orders)) {
    counts.orders = handleSyncOrders(payload.orders);
  }
  if (Array.isArray(payload.customers)) {
    counts.customers = handleSyncCustomers(payload.customers);
  }
  if (Array.isArray(payload.suppliers)) {
    counts.suppliers = handleSyncSuppliers(payload.suppliers);
  }
  if (Array.isArray(payload.invoices)) {
    counts.invoices = handleSyncInvoices(payload.invoices);
  }
  if (Array.isArray(payload.offers)) {
    counts.offers = handleSyncOffers(payload.offers);
  }
  if (Array.isArray(payload.coupons)) {
    counts.coupons = handleSyncCoupons(payload.coupons);
  }
  if (Array.isArray(payload.auditLogs)) {
    counts.auditLogs = handleSyncAuditLogs(payload.auditLogs);
  }
  if (Array.isArray(payload.affiliates) || Array.isArray(payload.partners)) {
    counts.affiliates = handleSyncAffiliates(payload.affiliates || payload.partners);
  }

  return createJsonResponse({
    success: true,
    message: "تمت المزامنة الشاملة لجميع أوراق عمل Google Sheets بنجاح!",
    counts: counts
  });
}

/**
 * ⚙️ مزامنة إعدادات المتجر والشعار وكلمة المرور
 */
function handleSyncSettings(settings) {
  if (!settings) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("إعدادات_المتجر") || ss.insertSheet("إعدادات_المتجر");
  
  sheet.getRange(1, 1, 1, 4).setValues([SHEETS_CONFIG["إعدادات_المتجر"]]);
  const headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  const now = getFormattedEnglishDate();
  const social = settings.socialLinks || {};

  const rows = [
    ["اسم_المتجر", String(settings.storeName || 'اوفالي'), "اسم المتجر التجاري المعتمد", now],
    ["شعار_المتجر", String(settings.storeLogoUrl || ''), "رابط أو صورة شعار المتجر (Logo)", now],
    ["كلمة_مرور_المدير_PIN", String(settings.adminPasswordHash || '123456'), "الرمز السري للدخول إلى لوحة التحكم", now],
    ["هاتف_المتجر", String(settings.storePhone || ''), "رقم الاتصال المباشر الأساسي", now],
    ["واتساب_المتجر", String(settings.storeWhatsApp || social.whatsapp || ''), "رقم محادثات واتساب لخدمة العملاء", now],
    ["هاتف_فرع_السعودية", String(settings.storePhoneSaudi || ''), "رقم الاتصال الخاص بفرع السعودية", now],
    ["هاتف_فرع_اليمن", String(settings.storePhoneYemen || ''), "رقم الاتصال الخاص بفرع اليمن", now],
    ["عنوان_المتجر", String(settings.storeAddress || ''), "العنوان الرئيسي وموقع الإدارة", now],
    ["فروع_المتجر", String(settings.storeBranches || ''), "قائمة الفروع المعتمدة", now],
    ["معلومات_التوصيل", String(settings.deliveryInfo || ''), "سياسة الشحن ومواعيد التوصيل", now],
    ["عنوان_البانر_الرئيسي", String(settings.heroTitle || ''), "عنوان البانر الرئيسي", now],
    ["وصف_البانر_الرئيسي", String(settings.heroSubtitle || ''), "وصف البانر الرئيسي", now],
    ["اسم_الباقة_الحالية", String(settings.subscriptionPlanName || ''), "اسم باقة المتجر الحالية", now],
    ["الحد_الأقصى_للمنتجات", String(settings.planMaxProducts || 0), "الحد الأقصى للمنتجات المسموحة في الباقة", now],
    ["الحد_الأقصى_للطلبات", String(settings.planMaxOrders || 0), "الحد الأقصى للطلبات المسموحة في الباقة", now],
    ["الحد_الأقصى_للموظفين", String(settings.planMaxEmployees || 0), "الحد الأقصى للموظفين المسموح بهم", now],
    ["نبذة_عن_المتجر", String(settings.footerAbout || ''), "النص التعريفي الظاهر بأسفل المتجر", now],
    ["الرقم_الضريبي", String(settings.taxNumber || ''), "الرقم الضريبي الرسمي للمنشأة", now],
    ["تفعيل_الضريبة", settings.enableVat ? "مفعل" : "غير مفعل", "حالة تفعيل ضريبة القيمة المضافة", now],
    ["نسبة_الضريبة", String(settings.vatPercentage || 15) + "%", "نسبة الضريبة المطبقة", now],
    ["العملة_الافتراضية", String(settings.defaultCurrency || 'SAR'), "العملة الأساسية (SAR / YER / USD)", now],
    ["الدولة_المستهدفة", String(settings.targetCountry || 'BOTH'), "نطاق البيع والتوصيل (SA / YE / BOTH)", now],
    ["سعر_صرف_الريال_اليمني", String(settings.yerExchangeRate || 535), "سعر صرف الريال اليمني مقابل 1 ريال سعودي", now],
    ["سعر_صرف_الدولار", String(settings.usdExchangeRate || 3.75), "سعر صرف الدولار مقابل الريال السعودي", now],
    ["رابط_تيك_توك", String(social.tiktok || ''), "رابط حساب تيك توك الرسمي", now],
    ["رابط_انستقرام", String(social.instagram || ''), "رابط حساب انستقرام", now],
    ["رابط_فيسبوك", String(social.facebook || ''), "رابط صفحة فيسبوك", now],
    ["رابط_سناب_شات", String(social.snapchat || ''), "رابط حساب سناب شات", now],
    ["رابط_تيليجرام", String(social.telegram || ''), "رابط قناة تيليجرام", now],
    ["رابط_تويتر_إكس", String(social.twitter || ''), "رابط حساب تويتر إكس", now],
    ["لون_المتجر_الأساسي_Primary", String(settings.themePrimaryColor || '#ec4899'), "اللون الأساسي للأزرار والعناصر والشريط والأيقونات", now],
    ["لون_المتجر_الثانوي_Secondary", String(settings.themeSecondaryColor || '#9333ea'), "اللون الثانوي للتدرجات والبطاقات", now],
    ["لون_التمييز_Accent", String(settings.themeAccentColor || '#f43f5e'), "لون التمييز والعروض وأوسمة الخصم", now],
    ["لون_الخلفية_Background", String(settings.themeBgColor || '#090d16'), "لون الخلفية العامة للمتجر", now],
    ["لون_النص_Text", String(settings.themeTextColor || '#f8fafc'), "لون النصوص والعناوين", now],
    ["لون_الأيقونات_Icons", String(settings.themeIconColor || '#f8fafc'), "لون الأيقونات في المتجر", now],
    ["نمط_الثيم_المحدد", String(settings.themePreset || ''), "اسم نمط الثيم المختار", now],
    ["وضع_الثيم_ThemeMode", String(settings.themeMode || 'dark'), "وضع مظهر المتجر (dark / light)", now],
    ["رابط_المتجر_NFC", String(settings.defaultStoreUrl || ''), "الرابط المعتمد لبرمجة بطاقات NFC ومشاركة المتجر", now],
    ["رابط_تطبيق_أندرويد_APK", String(settings.appDownloadAndroid || ''), "رابط تحميل تطبيق الأندرويد (Google Play / APK)", now],
    ["رابط_تطبيق_آيفون_iOS", String(settings.appDownloadiOS || ''), "رابط تحميل تطبيق الآيفون (App Store / TestFlight)", now],
    ["رابط_تطبيق_هواوي", String(settings.appDownloadHuawei || ''), "رابط تحميل تطبيق هواوي AppGallery", now],
    ["رابط_تطبيق_الكمبيوتر", String(settings.appDownloadDesktop || ''), "رابط تطبيق الديسكتوب والويندوز", now],
    ["عنوان_بانر_التطبيق", String(settings.appDownloadTitle || 'حمّل تطبيق اوفالي الآن'), "عنوان بانر تحميل التطبيق في الواجهة", now],
    ["وصف_بانر_التطبيق", String(settings.appDownloadDescription || 'تسوق أسرع واحصل على خصومات حصرية وإشعارات فورية.'), "وصف بانر تحميل التطبيق في المتجر", now],
    ["تفعيل_عرض_بانر_التطبيق", settings.showAppDownloadBanner !== false ? "مفعل" : "غير مفعل", "إظهار أو إخفاء روابط التطبيق بالمتجر", now],
    
    // Banners
    ["صورة_البانر_1", String(settings.banner1_image || ''), "رابط صورة الإعلان الأول في الصفحة الرئيسية", now],
    ["نص_البانر_1", String(settings.banner1_title || ''), "النص المكتوب على الإعلان الأول", now],
    ["رابط_البانر_1", String(settings.banner1_link || ''), "الرابط عند الضغط على الإعلان الأول", now],
    ["صورة_البانر_2", String(settings.banner2_image || ''), "رابط صورة الإعلان الثاني في الصفحة الرئيسية", now],
    ["نص_البانر_2", String(settings.banner2_title || ''), "النص المكتوب على الإعلان الثاني", now],
    ["رابط_البانر_2", String(settings.banner2_link || ''), "الرابط عند الضغط على الإعلان الثاني", now],
    ["صورة_البانر_3", String(settings.banner3_image || ''), "رابط صورة الإعلان الثالث في الصفحة الرئيسية", now],
    ["نص_البانر_3", String(settings.banner3_title || ''), "النص المكتوب على الإعلان الثالث", now],
    ["رابط_البانر_3", String(settings.banner3_link || ''), "الرابط عند الضغط على الإعلان الثالث", now],

    ["تاريخ_آخر_تحديث", now, "توقيت آخر مزامنة تم حفظها في السكربت", now]
  ];

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  }

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  return rows.length;
}

/**
 * 💱 مزامنة العملات
 */
function handleSyncCurrencies(currencies) {
  if (!Array.isArray(currencies) || currencies.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العملات") || ss.insertSheet("العملات");

  sheet.getRange(1, 1, 1, 5).setValues([SHEETS_CONFIG["العملات"]]);
  const headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }

  const now = getFormattedEnglishDate();
  const rows = currencies.map(c => [
    String(c.currencyCode || 'SAR'),
    String(c.currencyName || 'ريال سعودي'),
    String(c.symbol || 'ر.س'),
    Number(c.exchangeRate) || 1.0,
    now
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return rows.length;
}

/**
 * 👥 مزامنة الموظفين
 */
function handleSyncEmployees(employees) {
  if (!Array.isArray(employees) || employees.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموظفين") || ss.insertSheet("الموظفين");

  sheet.getRange(1, 1, 1, 7).setValues([SHEETS_CONFIG["الموظفين"]]);
  const headerRange = sheet.getRange(1, 1, 1, 7);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).clearContent();
  }

  const rows = employees.map(emp => [
    String(emp.EmployeeID || ''),
    String(emp.name || ''),
    String(emp.username || ''),
    String(emp.passwordHash || '123456'),
    String(emp.role || 'Manager'),
    Array.isArray(emp.permissions) ? emp.permissions.join(', ') : 'all',
    getFormattedEnglishDate(emp.lastLogin)
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  return rows.length;
}

/**
 * 📦 مزامنة المنتجات والصور المزدوجة مع تثبيت تاريخ الرفع (تاريخ_الرفع)
 */
function handleSyncProducts(products, categories) {
  if (!Array.isArray(products) || products.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المنتجات") || ss.insertSheet("المنتجات");

  const numCols = SHEETS_CONFIG["المنتجات"].length;

  // حفظ تاريخ الرفع الحالي لكل منتج في الشيت قبل المزامنة لتجنب تحديثه أو فقده
  const sheetCreatedAtMap = {};
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 18)).getValues();
      for (let i = 0; i < existingData.length; i++) {
        const prodId = String(existingData[i][0] || '').trim();
        const sku = String(existingData[i][1] || '').trim();
        const createdVal = String(existingData[i][17] || existingData[i][16] || existingData[i][12] || '').trim();
        if (createdVal) {
          if (prodId) sheetCreatedAtMap[prodId] = createdVal;
          if (sku) sheetCreatedAtMap[sku] = createdVal;
        }
      }
    }
  } catch (e) {
    console.log("Error reading existing creation dates: " + e);
  }

  sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["المنتجات"]]);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).clearContent();
  }

  // Create category to group lookup map
  const catGroupMap = {};
  const catIdMap = {};
  if (Array.isArray(categories)) {
    categories.forEach(c => {
      if (c.name) {
        catGroupMap[c.name] = c.group || 'عام';
        catIdMap[c.name] = c.CategoryID || c.id || '';
      }
    });
  }

  const now = getFormattedEnglishDate();
  const rows = products.map((p, idx) => {
    let imagesArr = Array.isArray(p.images) ? p.images : [];
    let img1 = String(imagesArr[0] || '').trim();
    let img2 = String(imagesArr[1] || '').trim();

    const pId = String(p.ProductID || '').trim();
    const pSku = String(p.SKU || '').trim();
    const existingInSheet = (pId && sheetCreatedAtMap[pId]) || (pSku && sheetCreatedAtMap[pSku]);

    const createdDate = existingInSheet || getFormattedEnglishDate(p.createdAt || p['تاريخ_الرفع'] || p['تاريخ_الإنشاء'] || now);
    const updatedDate = getFormattedEnglishDate(p.updatedAt || p['تاريخ_التحديث'] || now);

    const catName = String(p.category || 'عام');
    const catId = String(p.categoryId || catIdMap[catName] || ('CAT_' + (idx + 1)));
    const grpName = String(p.group || catGroupMap[catName] || 'عام');
    const grpId = String(p.groupId || ('GRP_' + grpName));
    const qty = Number(p.quantity) || 0;
    const isAvail = (qty > 0 && p.status !== 'inactive' && p.status !== 'out_of_stock') ? 'متوفر' : (p.status === 'inactive' ? 'معطل' : 'غير متوفر');

    return [
      pId || ('PRD_' + (idx + 100)),
      pSku || pId || ('SKU-' + (idx + 100)),
      String(p.name || 'منتج'),
      catId,
      catName,
      grpId,
      grpName,
      Number(p.originalPrice) || 0,
      Number(p.salePrice) || 0,
      Number(p.costPrice) || 0,
      qty,
      isAvail,
      img1,
      img2,
      String(p.description || ''),
      Number(p.sortOrder) || 999,
      updatedDate,
      createdDate
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
  }
  return rows.length;
}

/**
 * 📁 مزامنة التصنيفات (6 أعمدة بدون روابط صور)
 */
function handleSyncCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("التصنيفات") || ss.insertSheet("التصنيفات");

  const numCols = SHEETS_CONFIG["التصنيفات"].length;
  sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["التصنيفات"]]);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).clearContent();
  }

  const rows = categories.map((cat, idx) => {
    const grpName = String(cat.group || 'عام');
    const grpId = String(cat.groupId || ('GRP_' + (idx + 1)));
    const statusStr = cat.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
    const sortOrder = Number(cat.sortOrder) || (idx + 1);
    const image = String(cat.image || '');
    return [
      String(cat.CategoryID || ('CAT_' + (idx + 1))),
      String(cat.name || ''),
      grpId,
      grpName,
      statusStr,
      String(cat.description || ''),
      sortOrder,
      image
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
  }
  return rows.length;
}

/**
 * 🗂️ مزامنة المجموعات (4 أعمدة)
 */
function handleSyncGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المجموعات") || ss.insertSheet("المجموعات");

  const numCols = SHEETS_CONFIG["المجموعات"].length;
  sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["المجموعات"]]);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).clearContent();
  }

  const rows = groups.map((grp, idx) => [
    String(grp.id || ('GRP_' + (idx + 1))),
    String(grp.name || ''),
    grp.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)',
    String(grp.description || ''),
    Number(grp.sortOrder) || (idx + 1),
    String(grp.image || '')
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
  }
  return rows.length;
}

/**
 * 💳 مزامنة الاشتراكات (11 عمود)
 */
function handleSyncSubscriptions(subscriptions) {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الاشتراكات") || ss.insertSheet("الاشتراكات");

  const numCols = SHEETS_CONFIG["الاشتراكات"].length;
  sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["الاشتراكات"]]);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).clearContent();
  }

  const now = getFormattedEnglishDate();
  const rows = subscriptions.map((sub, idx) => [
    String(sub.SubscriptionID || ('SUB_' + (idx + 1))),
    String(sub.subscriberName || ''),
    String(sub.subscriptionType || 'متجر إلكتروني'),
    String(sub.planName || 'الباقة الاحترافية'),
    Number(sub.amount) || 0,
    String(sub.billingCycle || 'شهري'),
    String(sub.startDate || now),
    String(sub.endDate || ''),
    String(sub.status || 'نشط'),
    String(sub.paymentMethod || 'تحويل بنكي / بطاقة'),
    getFormattedEnglishDate(sub.updatedAt || now)
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
  }
  return rows.length;
}

/**
 * 🛒 مزامنة الطلبات
 */
function handleSyncOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الطلبات") || ss.insertSheet("الطلبات");

  const numCols = SHEETS_CONFIG["الطلبات"].length;
  sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["الطلبات"]]);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).clearContent();
  }

  const rows = orders.map(ord => {
    let itemsSummary = '';
    if (Array.isArray(ord.items)) {
      itemsSummary = ord.items.map(it => it.productName + ' (×' + it.quantity + ')').join(' ، ');
    }
    return [
      String(ord.OrderID || ''),
      String(ord.orderNumber || ''),
      String(ord.customerName || ''),
      String(ord.phone || ''),
      String(ord.country || 'SA'),
      String(ord.city || ''),
      String(ord.address || ''),
      Number(ord.totalAmount) || 0,
      String(ord.paymentMethod || 'الدفع عند الاستلام'),
      String(ord.orderStatus || 'pending'),
      itemsSummary,
      String(ord.employeeName || 'المتجر الإلكتروني'),
      getFormattedEnglishDate(ord.date),
      String(ord.shippingCompany || ''),
      String(ord.trackingNumber || '')
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
  }
  return rows.length;
}

/**
 * 👥 مزامنة العملاء
 */
function handleSyncCustomers(customers) {
  if (!Array.isArray(customers) || customers.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العملاء") || ss.insertSheet("العملاء");

  sheet.getRange(1, 1, 1, 9).setValues([SHEETS_CONFIG["العملاء"]]);
  const headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
  }

  const rows = customers.map(c => [
    String(c.CustomerID || ''),
    String(c.name || ''),
    String(c.phone || ''),
    String(c.email || ''),
    String(c.city || ''),
    String(c.address || ''),
    String(c.taxNumber || ''),
    Number(c.balance) || 0,
    Number(c.loyaltyPoints) || 0
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
  return rows.length;
}

/**
 * 🚚 مزامنة الموردين
 */
function handleSyncSuppliers(suppliers) {
  if (!Array.isArray(suppliers) || suppliers.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموردين") || ss.insertSheet("الموردين");

  sheet.getRange(1, 1, 1, 5).setValues([SHEETS_CONFIG["الموردين"]]);
  const headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }

  const rows = suppliers.map(s => [
    String(s.SupplierID || ''),
    String(s.name || ''),
    String(s.phone || ''),
    String(s.email || ''),
    Number(s.balance) || 0
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return rows.length;
}

/**
 * 🧾 مزامنة الفواتير
 */
function handleSyncInvoices(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الفواتير") || ss.insertSheet("الفواتير");

  sheet.getRange(1, 1, 1, 10).setValues([SHEETS_CONFIG["الفواتير"]]);
  const headerRange = sheet.getRange(1, 1, 1, 10);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).clearContent();
  }

  const rows = invoices.map(inv => [
    String(inv.InvoiceID || ''),
    String(inv.invoiceNumber || ''),
    String(inv.customerName || ''),
    String(inv.taxNumber || ''),
    String(inv.itemsSummary || ''),
    Number(inv.taxAmount) || 0,
    Number(inv.totalAmount) || 0,
    String(inv.paymentMethod || ''),
    String(inv.employeeName || ''),
    getFormattedEnglishDate(inv.date)
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }
  return rows.length;
}

/**
 * 🏷️ مزامنة العروض
 */
function handleSyncOffers(offers) {
  if (!Array.isArray(offers) || offers.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العروض") || ss.insertSheet("العروض");

  sheet.getRange(1, 1, 1, 6).setValues([SHEETS_CONFIG["العروض"]]);
  const headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).clearContent();
  }

  const rows = offers.map((off, idx) => [
    String(off.OfferID || ('OFF_' + idx)),
    String(off.title || 'عرض خاص'),
    Number(off.discountPercentage) || 0,
    String(off.startDate || '2026-01-01'),
    String(off.endDate || '2026-12-31'),
    String(off.status || 'active')
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  return rows.length;
}

/**
 * 🎟️ مزامنة الكوبونات
 */
function handleSyncCoupons(coupons) {
  if (!Array.isArray(coupons) || coupons.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الكوبونات") || ss.insertSheet("الكوبونات");

  sheet.getRange(1, 1, 1, 8).setValues([SHEETS_CONFIG["الكوبونات"]]);
  const headerRange = sheet.getRange(1, 1, 1, 8);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).clearContent();
  }

  const rows = coupons.map((c, idx) => [
    String('CPN_' + idx),
    String(c.CouponCode || ''),
    String(c.discountType || 'percentage'),
    Number(c.discountValue) || 0,
    Number(c.minOrderAmount) || 0,
    String(c.expiryDate || '2026-12-31'),
    Number(c.usageCount) || 0,
    "active"
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  return rows.length;
}

/**
 * 🤝 مزامنة المسوقين وشركاء الأرباح
 */
function handleSyncAffiliates(partners) {
  if (!Array.isArray(partners) || partners.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المسوقين") || ss.insertSheet("المسوقين");

  sheet.getRange(1, 1, 1, 14).setValues([SHEETS_CONFIG["المسوقين"]]);
  const headerRange = sheet.getRange(1, 1, 1, 14);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).clearContent();
  }

  const rows = partners.map((p, idx) => [
    String(p.id || ('REF_' + (idx + 101))),
    String(p.name || ''),
    String(p.phone || ''),
    String(p.code || '').toLowerCase(),
    Number(p.totalClicks) || 0,
    Number(p.registeredCount) || 0,
    Number(p.ordersCount) || 0,
    Number(p.totalEarnings) || 0,
    Number(p.paidEarnings) || 0,
    Number(p.availableBalance) || 0,
    String(p.withdrawalStatus || 'none'),
    String(p.bankDetails || ''),
    String(p.createdAt || new Date().toISOString().slice(0, 10)),
    String(p.lastActive || new Date().toISOString().slice(0, 10))
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 14).setValues(rows);
  }
  return rows.length;
}

/**
 * 📋 مزامنة سجل العمليات والتدقيق
 */
function handleSyncAuditLogs(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("سجل_العمليات") || ss.insertSheet("سجل_العمليات");

  sheet.getRange(1, 1, 1, 5).setValues([SHEETS_CONFIG["سجل_العمليات"]]);
  const headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }

  const rows = logs.slice(0, 150).map(l => [
    String(l.AuditID || ''),
    String(l.employeeName || 'المدير'),
    String(l.action || ''),
    String(l.details || ''),
    getFormattedEnglishDate(l.timestamp)
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return rows.length;
}

/**
 * 📝 إضافة سجل لحظي منفرد لسجل العمليات
 */
function handleAppendAuditLog(log) {
  if (!log) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("سجل_العمليات") || ss.insertSheet("سجل_العمليات");
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([SHEETS_CONFIG["سجل_العمليات"]]);
  }

  const row = [
    String(log.AuditID || ('LOG_' + Date.now())),
    String(log.employeeName || 'المدير'),
    String(log.action || 'إجراء عام'),
    String(log.details || ''),
    getFormattedEnglishDate(log.timestamp)
  ];

  sheet.appendRow(row);
}

/**
 * 🧹 تفريغ وتهيئة ورقة سجل العمليات
 */
function handleClearAuditLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("سجل_العمليات");
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }
}


/**
 * ✏️ تعديل / إضافة صنف مع معالجة الخلايا وتثبيت تاريخ الرفع (تاريخ_الرفع) دون تغيير عند التعديل
 */
function handleUpsertProductRow(product, imageSlots) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName("المنتجات") || ss.insertSheet("المنتجات");
  const prodIdTarget = String(product.ProductID || '').trim();
  const skuTarget = String(product.SKU || product.ProductID || '').trim();

  if (!skuTarget && !prodIdTarget) {
    return createJsonResponse({ success: false, message: "معرف المنتج ProductID أو رمز SKU مطلوب" });
  }

  const numCols = SHEETS_CONFIG["المنتجات"].length;

  // التأكد من العناوين
  if (prodSheet.getLastRow() === 0) {
    prodSheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["المنتجات"]]);
    const headerRange = prodSheet.getRange(1, 1, 1, numCols);
    headerRange.setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
    prodSheet.setRowHeight(1, 35);
    prodSheet.setFrozenRows(1);
  }

  // 1. البحث الدقيق عن السطر المطابق بالـ ProductID أولاً ثم SKU
  let foundIndex = -1;
  let existingRowData = null;
  if (prodSheet.getLastRow() > 1) {
    const ids = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 1).getValues();
    const skus = prodSheet.getRange(2, 2, prodSheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      const curId = String(ids[i][0]).trim();
      const curSku = String(skus[i][0]).trim();
      if ((prodIdTarget && curId === prodIdTarget) || (skuTarget && (curSku === skuTarget || curId === skuTarget))) {
        foundIndex = i + 2;
        existingRowData = prodSheet.getRange(foundIndex, 1, 1, Math.min(prodSheet.getLastColumn(), numCols)).getValues()[0];
        break;
      }
    }
  }

  // 2. معالجة وحفظ الصورتين بمعرفات فريدة للخانات (العمود L للصورة الأولى، والعمود M للصورة الثانية)
  let img1 = existingRowData ? String(existingRowData[12] || existingRowData[11] || existingRowData[7] || '').trim() : '';
  let img2 = existingRowData ? String(existingRowData[13] || existingRowData[12] || existingRowData[8] || '').trim() : '';

  if (imageSlots && typeof imageSlots === 'object') {
    if (imageSlots.slot0 && imageSlots.slot0.url !== undefined) {
      img1 = String(imageSlots.slot0.url || '').trim();
    }
    if (imageSlots.slot1 && imageSlots.slot1.url !== undefined) {
      img2 = String(imageSlots.slot1.url || '').trim();
    }
  } else if (Array.isArray(product.images)) {
    if (product.images.length > 0 && product.images[0] !== undefined) {
      img1 = String(product.images[0] || '').trim();
    }
    if (product.images.length > 1 && product.images[1] !== undefined) {
      img2 = String(product.images[1] || '').trim();
    }
  }

  const finalId = prodIdTarget || (existingRowData ? String(existingRowData[0]) : ('PRD_' + skuTarget));
  const finalSku = skuTarget || (existingRowData ? String(existingRowData[1]) : finalId);

  const now = getFormattedEnglishDate();

  // الاحتفاظ بتاريخ الرفع الثابت (createdAt) وعدم تغييره عند التعديل
  let fixedCreatedDate = now;
  if (existingRowData) {
    if (existingRowData[17] && String(existingRowData[17]).trim()) {
      fixedCreatedDate = getFormattedEnglishDate(String(existingRowData[17]).trim());
    } else if (existingRowData[16] && String(existingRowData[16]).trim()) {
      fixedCreatedDate = getFormattedEnglishDate(String(existingRowData[16]).trim());
    } else if (existingRowData[12] && String(existingRowData[12]).trim()) {
      fixedCreatedDate = getFormattedEnglishDate(String(existingRowData[12]).trim());
    }
  } else if (product.createdAt) {
    fixedCreatedDate = getFormattedEnglishDate(product.createdAt);
  }

  const catName = product.category || (existingRowData ? existingRowData[4] || existingRowData[3] : 'عام');
  const catId = product.categoryId || (existingRowData ? existingRowData[3] : '') || ('CAT_' + finalId);
  const grpName = product.group || (existingRowData ? existingRowData[6] : '') || 'عام';
  const grpId = product.groupId || (existingRowData ? existingRowData[5] : '') || ('GRP_' + grpName);

  const qty = Number(product.quantity !== undefined ? product.quantity : (existingRowData ? (existingRowData[10] !== undefined ? existingRowData[10] : existingRowData[9] !== undefined ? existingRowData[9] : existingRowData[6]) : 0));
  const statusVal = product.status || (existingRowData ? (existingRowData[15] || existingRowData[14] || existingRowData[10]) : 'active') || 'active';
  const isAvail = (qty > 0 && statusVal !== 'inactive' && statusVal !== 'out_of_stock') ? 'متوفر' : (statusVal === 'inactive' ? 'معطل' : 'غير متوفر');

  const rowData = [
    finalId,
    finalSku,
    product.name || (existingRowData ? existingRowData[2] : 'منتج جديد'),
    catId,
    catName,
    grpId,
    grpName,
    Number(product.originalPrice !== undefined ? product.originalPrice : (existingRowData ? (existingRowData[7] || 0) : 0)),
    Number(product.salePrice !== undefined ? product.salePrice : (existingRowData ? (existingRowData[8] || existingRowData[7] || existingRowData[4]) : 0)),
    Number(product.costPrice !== undefined ? product.costPrice : (existingRowData ? (existingRowData[9] || existingRowData[8] || existingRowData[5]) : 0)),
    qty,
    isAvail,
    img1,
    img2,
    product.description !== undefined ? String(product.description) : (existingRowData ? (existingRowData[14] || existingRowData[13] || existingRowData[9]) : ''),
    Number(product.sortOrder !== undefined ? product.sortOrder : (existingRowData ? (existingRowData[15] !== undefined ? existingRowData[15] : 999) : 999)),
    now, // تاريخ_التحديث يتجدد دائماً
    fixedCreatedDate // تاريخ_الرفع يظل ثابتاً للأبد
  ];

  if (foundIndex > 0) {
    prodSheet.getRange(foundIndex, 1, 1, numCols).setValues([rowData]);
  } else {
    prodSheet.appendRow(rowData);
  }

  return createJsonResponse({ 
    success: true, 
    message: "تم تحديث صف المنتج في Google Sheets مع تثبيت تاريخ الرفع بنجاح!",
    productId: finalId,
    sku: finalSku,
    createdAt: fixedCreatedDate,
    updatedAt: now
  });
}

/**
 * 🗑️ حذف صنف بالكامل وتفريغ صفه بالـ ID أو SKU
 */
function handleDeleteProductRow(identifier) {
  if (!identifier) return createJsonResponse({ success: false, message: "معرف المنتج أو رمز SKU مفقود" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName("المنتجات");
  if (!prodSheet || prodSheet.getLastRow() <= 1) return createJsonResponse({ success: false, message: "الشيت فارغ" });

  const target = String(identifier).trim();
  const ids = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 1).getValues();
  const skus = prodSheet.getRange(2, 2, prodSheet.getLastRow() - 1, 1).getValues();

  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === target || String(skus[i][0]).trim() === target) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    prodSheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف المنتج من الشيت بنجاح بالـ ID" });
  } else {
    return createJsonResponse({ success: false, message: "المنتج غير موجود بجدول الشيت" });
  }
}

/**
 * 🖼️ حذف رابط صورة محددة من خلية الأكسل المرتبطة بالـ ID وإعادة ترتيب الخلايا
 */
function handleDeleteProductImage(payload) {
  const target = String(payload.productId || payload.ProductID || payload.sku || payload.SKU || '').trim();
  const slotIdx = Number(payload.slotIdx !== undefined ? payload.slotIdx : 0);

  if (!target) return createJsonResponse({ success: false, message: "معرف المنتج مطلوب لحذف الصورة" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName("المنتجات");
  if (!prodSheet || prodSheet.getLastRow() <= 1) return createJsonResponse({ success: false, message: "ورقة المنتجات فارغة" });

  const ids = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 1).getValues();
  const skus = prodSheet.getRange(2, 2, prodSheet.getLastRow() - 1, 1).getValues();

  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === target || String(skus[i][0]).trim() === target) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow <= 0) {
    return createJsonResponse({ success: false, message: "المنتج غير موجود في شيت المنتجات" });
  }

  // قراءة خلايا الصورتين الحالية
  const currentImages = prodSheet.getRange(targetRow, 8, 1, 2).getValues()[0];
  let img1 = String(currentImages[0] || '').trim();
  let img2 = String(currentImages[1] || '').trim();

  if (slotIdx === 0 || slotIdx === 1) {
    // إذا تم حذف الصورة الأولى، تصبح الصورة الثانية هي الأولى ويتم تفريغ الثانية
    img1 = img2;
    img2 = '';
  } else {
    // حذف الصورة الثانية فقط
    img2 = '';
  }

  prodSheet.getRange(targetRow, 8, 1, 2).setValues([[img1, img2]]);

  return createJsonResponse({
    success: true,
    message: "تم حذف رابط الصورة من خلية الأكسل بنجاح وتحديث ترتيب الصور لجميع العملاء!",
    remainingImages: [img1, img2].filter(Boolean)
  });
}

/**
 * 📦 تحديث حالة طلب وتتبع الشحنة منفرد في سطر الطلبات بالـ OrderID
 */
function handleUpdateOrderStatus(payload) {
  const targetId = String(payload.orderId || payload.OrderID || '').trim();
  const targetNum = String(payload.orderNumber || '').trim();
  const trackingNumber = String(payload.trackingNumber || '').trim();
  const shippingCompany = String(payload.shippingCompany || '').trim();

  if (!targetId && !targetNum) {
    return createJsonResponse({ success: false, message: "رقم الطلب OrderID أو orderNumber مطلوب للتحديث" });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الطلبات");
  if (!sheet || sheet.getLastRow() <= 1) {
    return createJsonResponse({ success: false, message: "ورقة الطلبات فارغة" });
  }

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const nums = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();

  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if ((targetId && String(ids[i][0]).trim() === targetId) || (targetNum && String(nums[i][0]).trim() === targetNum)) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    // تحديث عمود حالة الطلب (العمود 10) إذا كانت مرسلة في الحمولة
    if (payload.orderStatus || payload.status) {
      const newStatus = String(payload.orderStatus || payload.status).trim();
      sheet.getRange(targetRow, 10).setValue(newStatus);
    }
    
    // تحديث عمود شركة الشحن (العمود 14) ورقم التتبع (العمود 15)
    if (shippingCompany !== undefined && shippingCompany !== "") {
      sheet.getRange(targetRow, 14).setValue(shippingCompany);
    }
    if (trackingNumber !== undefined && trackingNumber !== "") {
      sheet.getRange(targetRow, 15).setValue(trackingNumber);
    }
    
    return createJsonResponse({ 
      success: true, 
      message: "تم تحديث حالة سطر الطلب ورقم التتبع في ورقة الطلبات بنجاح فوري." 
    });
  }

  return createJsonResponse({ success: false, message: "لم يتم العثور على سطر الطلب في Google Sheets" });
}

/**
 * 🛒 حفظ طلب منفرد
 */
function handleUpsertOrder(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الطلبات") || ss.insertSheet("الطلبات");

  let itemsSummary = '';
  if (Array.isArray(order.items)) {
    itemsSummary = order.items.map(it => it.productName + ' (×' + it.quantity + ')').join(' ، ');
  }

  const rowData = [
    String(order.OrderID || ('ORD_' + Date.now())),
    String(order.orderNumber || ''),
    String(order.customerName || ''),
    String(order.phone || ''),
    String(order.country || 'SA'),
    String(order.city || ''),
    String(order.address || ''),
    Number(order.totalAmount) || 0,
    String(order.paymentMethod || 'الدفع عند الاستلام'),
    String(order.orderStatus || 'pending'),
    itemsSummary,
    String(order.employeeName || 'المتجر الإلكتروني'),
    getFormattedEnglishDate(order.date)
  ];

  sheet.appendRow(rowData);
}

/**
 * 🎁 حفظ / تعديل عرض ترويجي برقم المعرف OfferID في ورقة العروض
 */
function handleUpsertOfferRow(offer) {
  if (!offer) return createJsonResponse({ success: false, message: "بيانات العرض غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العروض") || ss.insertSheet("العروض");
  const offerId = String(offer.OfferID || offer.id || ('OFF_' + Date.now())).trim();

  const rowData = [
    offerId,
    String(offer.title || 'عرض خاص'),
    Number(offer.discountPercentage) || 0,
    String(offer.startDate || new Date().toISOString().split('T')[0]),
    String(offer.endDate || '2026-12-31'),
    String(offer.status || 'active')
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === offerId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 6).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف العرض في ورقة العروض بنجاح" });
}

/**
 * 🗑️ حذف عرض ترويجي من ورقة العروض برقم المعرف
 */
function handleDeleteOfferRow(offerId) {
  if (!offerId) return createJsonResponse({ success: false, message: "معرف العرض مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العروض");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(offerId).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف العرض من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "العرض غير موجود في Google Sheets" });
}

/**
 * 🏷️ حفظ / تعديل كوبون خصم بكود الكوبون في ورقة الكوبونات
 */
function handleUpsertCouponRow(coupon) {
  if (!coupon) return createJsonResponse({ success: false, message: "بيانات الكوبون غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الكوبونات") || ss.insertSheet("الكوبونات");
  const code = String(coupon.CouponCode || coupon.code || '').trim().toUpperCase();

  if (!code) return createJsonResponse({ success: false, message: "كود الكوبون مطلوب" });

  const rowData = [
    String(coupon.CouponID || ('CPN_' + Date.now())),
    code,
    Number(coupon.discountValue) || 0,
    String(coupon.discountType || 'percentage'),
    Number(coupon.minOrderAmount) || 0,
    String(coupon.expiryDate || '2026-12-31'),
    Number(coupon.usageCount) || 0
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const codes = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < codes.length; i++) {
      if (String(codes[i][0]).trim().toUpperCase() === code || String(ids[i][0]).trim() === code) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 7).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف الكوبون في Google Sheets بنجاح" });
}

/**
 * 🗑️ حذف كوبون من ورقة الكوبونات
 */
function handleDeleteCouponRow(code) {
  if (!code) return createJsonResponse({ success: false, message: "كود الكوبون مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الكوبونات");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const codes = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim().toUpperCase() === String(code).trim().toUpperCase() || String(ids[i][0]).trim() === String(code).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف الكوبون من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "الكوبون غير موجود في Google Sheets" });
}

/**
 * 👥 حفظ / تعديل عميل برقم CustomerID في ورقة العملاء
 */
function handleUpsertCustomerRow(customer) {
  if (!customer) return createJsonResponse({ success: false, message: "بيانات العميل غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العملاء") || ss.insertSheet("العملاء");
  const custId = String(customer.CustomerID || customer.id || ('CUST_' + Date.now())).trim();

  const rowData = [
    custId,
    String(customer.name || 'عميل'),
    String(customer.phone || ''),
    String(customer.country || 'SA'),
    String(customer.city || ''),
    Number(customer.totalOrders) || 0,
    Number(customer.totalSpent) || 0,
    String(customer.registeredDate || new Date().toISOString().split('T')[0])
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === custId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 8).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف العميل في ورقة العملاء بنجاح" });
}

/**
 * 🗑️ حذف عميل من ورقة العملاء
 */
function handleDeleteCustomerRow(customerId) {
  if (!customerId) return createJsonResponse({ success: false, message: "معرف العميل مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("العملاء");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(customerId).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف العميل من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "العميل غير موجود في Google Sheets" });
}

/**
 * 🏭 حفظ / تعديل مورد برقم SupplierID في ورقة الموردين
 */
function handleUpsertSupplierRow(supplier) {
  if (!supplier) return createJsonResponse({ success: false, message: "بيانات المورد غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموردين") || ss.getSheetByName("الموردون") || ss.insertSheet("الموردين");
  const suppId = String(supplier.SupplierID || supplier.id || ('SUP_' + Date.now())).trim();

  const rowData = [
    suppId,
    String(supplier.name || 'مورد'),
    String(supplier.phone || ''),
    String(supplier.email || ''),
    Number(supplier.balance) || 0
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === suppId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 5).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف المورد في ورقة الموردين بنجاح" });
}

/**
 * 🗑️ حذف مورد من ورقة الموردين
 */
function handleDeleteSupplierRow(supplierId) {
  if (!supplierId) return createJsonResponse({ success: false, message: "معرف المورد مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموردين");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(supplierId).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف المورد من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "المورد غير موجود في Google Sheets" });
}

/**
 * 👤 حفظ / تعديل موظف برقم EmployeeID في ورقة الموظفين
 */
function handleUpsertEmployeeRow(employee) {
  if (!employee) return createJsonResponse({ success: false, message: "بيانات الموظف غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموظفين") || ss.insertSheet("الموظفين");
  const empId = String(employee.EmployeeID || employee.id || ('EMP_' + Date.now())).trim();

  const rowData = [
    empId,
    String(employee.name || 'موظف'),
    String(employee.role || 'employee'),
    String(employee.phone || ''),
    String(employee.salary || '0'),
    String(employee.status || 'active')
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === empId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 6).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف الموظف في ورقة الموظفين بنجاح" });
}

/**
 * 🗑️ حذف موظف من ورقة الموظفين
 */
function handleDeleteEmployeeRow(employeeId) {
  if (!employeeId) return createJsonResponse({ success: false, message: "معرف الموظف مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الموظفين");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(employeeId).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف الموظف من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "الموظف غير موجود في Google Sheets" });
}

/**
 * 📁 حفظ / تعديل تصنيف في ورقة التصنيفات (6 أعمدة)
 */
function handleUpsertCategoryRow(category) {
  if (!category) return createJsonResponse({ success: false, message: "بيانات القسم غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("التصنيفات") || ss.getSheetByName("الأقسام") || ss.insertSheet("التصنيفات");
  const numCols = SHEETS_CONFIG["التصنيفات"].length;

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["التصنيفات"]]);
  }

  const catId = String(category.CategoryID || category.id || ('CAT_' + Date.now())).trim();
  const catName = String(category.name || '').trim();
  const grpName = String(category.group || 'عام');
  const grpId = String(category.groupId || ('GRP_' + grpName));
  const statusStr = category.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
  const desc = String(category.description || '');
  const sortOrder = Number(category.sortOrder) || 999;
  const image = String(category.image || '');

  const rowData = [
    catId,
    catName,
    grpId,
    grpName,
    statusStr,
    desc,
    sortOrder,
    image
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === catId || String(rows[i][1]).trim().toLowerCase() === catName.toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف القسم في ورقة التصنيفات بنجاح" });
}

/**
 * 🗑️ حذف تصنيف من ورقة التصنيفات
 */
function handleDeleteCategoryRow(target) {
  if (!target) return createJsonResponse({ success: false, message: "معرف القسم مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("التصنيفات") || ss.getSheetByName("الأقسام");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(target).trim() || String(rows[i][1]).trim().toLowerCase() === String(target).trim().toLowerCase()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف القسم من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "القسم غير موجود في Google Sheets" });
}

/**
 * 🗂️ حفظ / تعديل مجموعة في ورقة المجموعات (4 أعمدة)
 */
function handleUpsertGroupRow(group) {
  if (!group) return createJsonResponse({ success: false, message: "بيانات المجموعة غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المجموعات") || ss.insertSheet("المجموعات");
  const numCols = SHEETS_CONFIG["المجموعات"].length;

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["المجموعات"]]);
  }

  const grpId = String(group.id || ('GRP_' + Date.now())).trim();
  const grpName = String(group.name || '').trim();
  const statusStr = group.isVisible !== false ? 'ظاهر (1)' : 'مخفي (0)';
  const desc = String(group.description || '');
  const sortOrder = Number(group.sortOrder) || 999;
  const image = String(group.image || '');

  const rowData = [
    grpId,
    grpName,
    statusStr,
    desc,
    sortOrder,
    image
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === grpId || String(rows[i][1]).trim().toLowerCase() === grpName.toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف المجموعة في ورقة المجموعات بنجاح" });
}

/**
 * 🗑️ حذف مجموعة من ورقة المجموعات
 */
function handleDeleteGroupRow(target) {
  if (!target) return createJsonResponse({ success: false, message: "معرف المجموعة مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المجموعات");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(target).trim() || String(rows[i][1]).trim().toLowerCase() === String(target).trim().toLowerCase()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف المجموعة من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "المجموعة غير موجودة في Google Sheets" });
}

/**
 * 💳 حفظ / تعديل اشتراك في ورقة الاشتراكات (11 عمود)
 */
function handleUpsertSubscriptionRow(subscription) {
  if (!subscription) return createJsonResponse({ success: false, message: "بيانات الاشتراك غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الاشتراكات") || ss.insertSheet("الاشتراكات");
  const numCols = SHEETS_CONFIG["الاشتراكات"].length;

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, numCols).setValues([SHEETS_CONFIG["الاشتراكات"]]);
  }

  const subId = String(subscription.SubscriptionID || subscription.id || ('SUB_' + Date.now())).trim();
  const now = getFormattedEnglishDate();

  const rowData = [
    subId,
    String(subscription.subscriberName || ''),
    String(subscription.subscriptionType || 'متجر إلكتروني'),
    String(subscription.planName || 'الباقة الاحترافية'),
    Number(subscription.amount) || 0,
    String(subscription.billingCycle || 'شهري'),
    String(subscription.startDate || now),
    String(subscription.endDate || ''),
    String(subscription.status || 'نشط'),
    String(subscription.paymentMethod || 'تحويل بنكي / بطاقة'),
    getFormattedEnglishDate(subscription.updatedAt || now)
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === subId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث صف الاشتراك في ورقة الاشتراكات بنجاح" });
}

/**
 * 🗑️ حذف اشتراك من ورقة الاشتراكات
 */
function handleDeleteSubscriptionRow(subscriptionId) {
  if (!subscriptionId) return createJsonResponse({ success: false, message: "معرف الاشتراك مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("الاشتراكات");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(subscriptionId).trim()) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف الاشتراك من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "الاشتراك غير موجود في Google Sheets" });
}

/**
 * 🤝 حفظ / تعديل مسوق إحالة في ورقة المسوقين
 */
function handleUpsertAffiliateRow(partner) {
  if (!partner) return createJsonResponse({ success: false, message: "بيانات المسوق غير صالحة" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المسوقين") || ss.insertSheet("المسوقين");
  const pId = String(partner.id || partner.AffiliateID || ('REF_' + Date.now())).trim();
  const code = String(partner.code || '').trim().toLowerCase();

  const rowData = [
    pId,
    String(partner.name || 'مسوق إحالة'),
    String(partner.phone || ''),
    code,
    Number(partner.totalClicks) || 0,
    Number(partner.registeredCount) || 0,
    Number(partner.ordersCount) || 0,
    Number(partner.totalEarnings) || 0,
    Number(partner.paidEarnings) || 0,
    Number(partner.availableBalance) || 0,
    String(partner.withdrawalStatus || 'none'),
    String(partner.bankDetails || ''),
    String(partner.createdAt || new Date().toISOString().slice(0, 10)),
    String(partner.lastActive || new Date().toISOString().slice(0, 10))
  ];

  let targetRow = -1;
  if (sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === pId || (code && String(rows[i][3]).trim().toLowerCase() === code)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 14).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: "تم تحديث بيانات المسوق في ورقة المسوقين بنجاح" });
}

/**
 * 🗑️ حذف مسوق من ورقة المسوقين
 */
function handleDeleteAffiliateRow(targetIdOrCode) {
  if (!targetIdOrCode) return createJsonResponse({ success: false, message: "معرف المسوق مطلوب" });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المسوقين");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: true, message: "الورقة فارغة" });

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  let targetRow = -1;
  const cleanTarget = String(targetIdOrCode).trim().toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === cleanTarget || String(rows[i][3]).trim().toLowerCase() === cleanTarget) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    return createJsonResponse({ success: true, message: "تم حذف صف المسوق من Google Sheets بنجاح" });
  }
  return createJsonResponse({ success: true, message: "المسوق غير موجود في Google Sheets" });
}

/**
 * 💸 صرف أرباح مسوق وتصفير رصيده
 */
function handlePayoutAffiliate(payload) {
  const target = String(payload.id || payload.code || '').trim().toLowerCase();
  if (!target) return createJsonResponse({ success: false, message: "معرف المسوق أو كوده مطلوب" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المسوقين");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: false, message: "ورقة المسوقين فارغة" });

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === target || String(rows[i][3]).trim().toLowerCase() === target) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    const currentRow = rows[targetRow - 2];
    const availBal = Number(currentRow[9]) || 0;
    const paidSoFar = Number(currentRow[8]) || 0;
    const newPaid = paidSoFar + availBal;
    
    // update columns: 9 (الأرباح المصروفة), 10 (الرصيد المتاح = 0), 11 (حالة السحب = 'paid')
    sheet.getRange(targetRow, 9).setValue(newPaid);
    sheet.getRange(targetRow, 10).setValue(0);
    sheet.getRange(targetRow, 11).setValue("paid");
    sheet.getRange(targetRow, 14).setValue(new Date().toISOString().slice(0, 10));

    return createJsonResponse({ 
      success: true, 
      message: "تم صرف أرباح المسوق بقيمة " + availBal + " ر.س وتحديث Google Sheets بنجاح!",
      amountPaid: availBal
    });
  }

  return createJsonResponse({ success: false, message: "المسوق غير موجود في Google Sheets" });
}

/**
 * 📥 طلب سحب أرباح من جانب العميل / المسوق
 */
function handleRequestAffiliateWithdrawal(payload) {
  const code = String(payload.code || '').trim().toLowerCase();
  const bankDetails = String(payload.bankDetails || '').trim();
  if (!code) return createJsonResponse({ success: false, message: "كود المسوق مطلوب" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("المسوقين");
  if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ success: false, message: "ورقة المسوقين فارغة" });

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][3]).trim().toLowerCase() === code || String(rows[i][0]).trim().toLowerCase() === code) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 11).setValue("requested");
    if (bankDetails) {
      sheet.getRange(targetRow, 12).setValue(bankDetails);
    }
    sheet.getRange(targetRow, 14).setValue(new Date().toISOString().slice(0, 10));

    return createJsonResponse({ success: true, message: "تم تسجيل طلب سحب الأرباح بنجاح!" });
  }

  return createJsonResponse({ success: false, message: "لم يتم العثور على حساب المسوق" });
}

/**
 * 📖 الجلب اللحظي السريع لكافة البيانات من كافة الأوراق الـ 13 بشكل آمن وفوري
 */
function getSheetRowsSafe(sheet, expectedCols) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];
  var colsToFetch = expectedCols ? Math.min(lastCol, expectedCols) : lastCol;
  return sheet.getRange(2, 1, lastRow - 1, colsToFetch).getValues();
}

function readAllSheetsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. المنتجات
  let products = [];
  const prodSheet = ss.getSheetByName("المنتجات") || ss.getSheetByName("المخزون") || ss.getSheetByName("Products");
  if (prodSheet) {
    const lastCol = prodSheet.getLastColumn();
    const colsToFetch = Math.max(13, Math.min(lastCol, 18));
    const rows = getSheetRowsSafe(prodSheet, colsToFetch);
    products = rows.map(r => {
      let imagesList = [];
      let img1 = '';
      let img2 = '';
      let catName = 'عام';
      let catId = '';
      let grpName = 'عام';
      let grpId = '';
      let originalPrice = 0;
      let salePrice = 0;
      let costPrice = 0;
      let qty = 0;
      let isAvailable = true;
      let desc = '';
      let statusStr = 'active';
      let updateDate = '';
      let createDate = '';

      let sortOrder = 999;

      if (r.length >= 18 || lastCol >= 18) {
        // Schema 18 columns
        catId = String(r[3] || '');
        catName = String(r[4] || 'عام');
        grpId = String(r[5] || '');
        grpName = String(r[6] || 'عام');
        originalPrice = Number(r[7]) || 0;
        salePrice = Number(r[8]) || 0;
        costPrice = Number(r[9]) || 0;
        qty = Number(r[10]) || 0;
        const availStr = String(r[11] || '').trim();
        isAvailable = availStr !== 'غير متوفر' && availStr !== 'معطل';
        statusStr = availStr === 'معطل' ? 'inactive' : (availStr === 'غير متوفر' ? 'out_of_stock' : 'active');
        img1 = String(r[12] || '').trim();
        img2 = String(r[13] || '').trim();
        desc = String(r[14] || '');
        sortOrder = Number(r[15]) || 999;
        updateDate = String(r[16] || '').trim();
        createDate = String(r[17] || r[16] || '').trim();
      } else if (r.length >= 17 || lastCol >= 17) {
        // Schema 17 columns
        catId = String(r[3] || '');
        catName = String(r[4] || 'عام');
        grpId = String(r[5] || '');
        grpName = String(r[6] || 'عام');
        salePrice = Number(r[7]) || 0;
        costPrice = Number(r[8]) || 0;
        qty = Number(r[9]) || 0;
        const availStr = String(r[10] || '').trim();
        isAvailable = availStr !== 'غير متوفر' && availStr !== 'معطل';
        img1 = String(r[11] || '').trim();
        img2 = String(r[12] || '').trim();
        desc = String(r[13] || '');
        statusStr = String(r[14] || 'active');
        updateDate = String(r[15] || '').trim();
        createDate = String(r[16] || r[15] || '').trim();
      } else {
        // Fallback schema 13 columns
        catName = String(r[3] || 'عام');
        salePrice = Number(r[4]) || 0;
        costPrice = Number(r[5]) || 0;
        qty = Number(r[6]) || 0;
        img1 = String(r[7] || '').trim();
        img2 = String(r[8] || '').trim();
        desc = String(r[9] || '');
        statusStr = String(r[10] || 'active');
        updateDate = String(r[11] || '').trim();
        createDate = String(r[12] || r[11] || '').trim();
        isAvailable = qty > 0 && statusStr !== 'inactive' && statusStr !== 'out_of_stock';
      }

      if (!img1 && img2) {
        img1 = img2;
        img2 = '';
      }

      if (img1) imagesList.push(img1);
      if (img2) imagesList.push(img2);

      return {
        ProductID: String(r[0] || ('PRD_' + (r[1] || Date.now()))),
        SKU: String(r[1] || r[0] || ('SKU_' + Date.now())),
        name: String(r[2] || ''),
        category: catName,
        categoryId: catId,
        group: grpName,
        groupId: grpId,
        originalPrice: originalPrice,
        salePrice: salePrice,
        costPrice: costPrice,
        quantity: qty,
        isAvailable: isAvailable,
        images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
        description: desc,
        status: statusStr,
        sortOrder: sortOrder,
        updatedAt: updateDate || createDate,
        createdAt: createDate || updateDate
      };
    }).filter(p => p.name.trim().length > 0);
  }

  // 2. إعدادات المتجر
  let settings = {};
  const settSheet = ss.getSheetByName("إعدادات_المتجر") || ss.getSheetByName("الإعدادات") || ss.getSheetByName("الاعدادات") || ss.getSheetByName("Settings");
  if (settSheet) {
    const rows = getSheetRowsSafe(settSheet, 2);
    rows.forEach(r => {
      const key = String(r[0] || '').trim();
      const val = String(r[1] || '').trim();
      if (!key) return;

      if (key === 'اسم_المتجر') settings.storeName = val;
      if (key === 'شعار_المتجر') settings.storeLogoUrl = val;
      if (key === 'كلمة_مرور_المدير_PIN') settings.adminPasswordHash = val;
      if (key === 'هاتف_المتجر') settings.storePhone = val;
      if (key === 'واتساب_المتجر') settings.storeWhatsApp = val;
      if (key === 'هاتف_فرع_السعودية') settings.storePhoneSaudi = val;
      if (key === 'هاتف_فرع_اليمن') settings.storePhoneYemen = val;
      if (key === 'عنوان_المتجر') settings.storeAddress = val;
      if (key === 'فروع_المتجر') settings.storeBranches = val;
      if (key === 'معلومات_التوصيل') settings.deliveryInfo = val;
      if (key === 'عنوان_البانر_الرئيسي' || key === 'heroTitle') settings.heroTitle = val;
      if (key === 'وصف_البانر_الرئيسي' || key === 'heroSubtitle') settings.heroSubtitle = val;
      if (key === 'اسم_الباقة_الحالية' || key === 'subscriptionPlanName') settings.subscriptionPlanName = val;
      if (key === 'الحد_الأقصى_للمنتجات' || key === 'planMaxProducts') settings.planMaxProducts = Number(val) || 0;
      if (key === 'الحد_الأقصى_للطلبات' || key === 'planMaxOrders') settings.planMaxOrders = Number(val) || 0;
      if (key === 'الحد_الأقصى_للموظفين' || key === 'planMaxEmployees') settings.planMaxEmployees = Number(val) || 0;
      if (key === 'نبذة_عن_المتجر') settings.footerAbout = val;
      if (key === 'الرقم_الضريبي') settings.taxNumber = val;
      if (key === 'تفعيل_الضريبة') settings.enableVat = (val === 'مفعل' || val === 'true' || val === 'نعم');
      if (key === 'نسبة_الضريبة') settings.vatPercentage = parseFloat(val.replace('%', '')) || 15;
      if (key === 'العملة_الافتراضية') settings.defaultCurrency = val;
      if (key === 'الدولة_المستهدفة') settings.targetCountry = val;
      if (key === 'سعر_صرف_الريال_اليمني') settings.yerExchangeRate = Number(val) || 535;
      if (key === 'سعر_صرف_الدولار') settings.usdExchangeRate = Number(val) || 3.75;
      
      if (!settings.socialLinks) settings.socialLinks = {};
      if (key === 'رابط_تيك_توك') settings.socialLinks.tiktok = val;
      if (key === 'رابط_انستقرام') settings.socialLinks.instagram = val;
      if (key === 'رابط_فيسبوك') settings.socialLinks.facebook = val;
      if (key === 'رابط_سناب_شات') settings.socialLinks.snapchat = val;
      if (key === 'رابط_تيليجرام') settings.socialLinks.telegram = val;
      if (key === 'رابط_تويتر_إكس') settings.socialLinks.twitter = val;

      if (key === 'لون_المتجر_الأساسي_Primary' || key === 'themePrimaryColor' || key === 'اللون_الأساسي') settings.themePrimaryColor = val;
      if (key === 'لون_المتجر_الثانوي_Secondary' || key === 'themeSecondaryColor' || key === 'اللون_الثانوي') settings.themeSecondaryColor = val;
      if (key === 'لون_التمييز_Accent' || key === 'themeAccentColor' || key === 'لون_التمييز') settings.themeAccentColor = val;
      if (key === 'لون_الخلفية_Background' || key === 'themeBgColor' || key === 'لون_الخلفية') settings.themeBgColor = val;
      if (key === 'لون_النص_Text' || key === 'themeTextColor') settings.themeTextColor = val;
      if (key === 'لون_الأيقونات_Icons' || key === 'themeIconColor') settings.themeIconColor = val;
      if (key === 'نمط_الثيم_المحدد' || key === 'themePreset') settings.themePreset = val;
      if (key === 'وضع_الثيم_ThemeMode' || key === 'themeMode') settings.themeMode = val;
      if (key === 'رابط_المتجر_NFC' || key === 'defaultStoreUrl') settings.defaultStoreUrl = val;
      if (key === 'رابط_تطبيق_أندرويد_APK' || key === 'appDownloadAndroid') settings.appDownloadAndroid = val;
      if (key === 'رابط_تطبيق_آيفون_iOS' || key === 'appDownloadiOS') settings.appDownloadiOS = val;
      if (key === 'رابط_تطبيق_هواوي' || key === 'appDownloadHuawei') settings.appDownloadHuawei = val;
      if (key === 'رابط_تطبيق_الكمبيوتر' || key === 'appDownloadDesktop') settings.appDownloadDesktop = val;
      if (key === 'عنوان_بانر_التطبيق' || key === 'appDownloadTitle') settings.appDownloadTitle = val;
      if (key === 'وصف_بانر_التطبيق' || key === 'appDownloadDescription') settings.appDownloadDescription = val;
      if (key === 'تفعيل_عرض_بانر_التطبيق' || key === 'showAppDownloadBanner') settings.showAppDownloadBanner = (val === 'مفعل' || val === 'true' || val === 'نعم');
      
      // Banners
      if (key === 'صورة_البانر_1' || key === 'banner1_image') settings.banner1_image = val;
      if (key === 'نص_البانر_1' || key === 'banner1_title') settings.banner1_title = val;
      if (key === 'رابط_البانر_1' || key === 'banner1_link') settings.banner1_link = val;
      if (key === 'صورة_البانر_2' || key === 'banner2_image') settings.banner2_image = val;
      if (key === 'نص_البانر_2' || key === 'banner2_title') settings.banner2_title = val;
      if (key === 'رابط_البانر_2' || key === 'banner2_link') settings.banner2_link = val;
      if (key === 'صورة_البانر_3' || key === 'banner3_image') settings.banner3_image = val;
      if (key === 'نص_البانر_3' || key === 'banner3_title') settings.banner3_title = val;
      if (key === 'رابط_البانر_3' || key === 'banner3_link') settings.banner3_link = val;
    });
  }

  // 3. العملات
  let currencies = [];
  const currSheet = ss.getSheetByName("العملات") || ss.getSheetByName("Currencies");
  if (currSheet) {
    const rows = getSheetRowsSafe(currSheet, 4);
    currencies = rows.map(r => ({
      currencyCode: String(r[0] || 'SAR'),
      currencyName: String(r[1] || 'ريال سعودي'),
      symbol: String(r[2] || 'ر.س'),
      exchangeRate: Number(r[3]) || 1.0
    })).filter(c => c.currencyCode.trim().length > 0);
  }

  // 4. الموظفين
  let employees = [];
  const empSheet = ss.getSheetByName("الموظفين") || ss.getSheetByName("Employees");
  if (empSheet) {
    const rows = getSheetRowsSafe(empSheet, 7);
    employees = rows.map(r => ({
      EmployeeID: String(r[0] || ''),
      name: String(r[1] || ''),
      username: String(r[2] || ''),
      passwordHash: String(r[3] || '123456'),
      role: String(r[4] || 'Manager'),
      permissions: String(r[5] || 'all').split(',').map(s => s.trim()),
      lastLogin: String(r[6] || '')
    })).filter(e => e.name.trim().length > 0);
  }

  // 5. التصنيفات
  let categories = [];
  const catSheet = ss.getSheetByName("التصنيفات") || ss.getSheetByName("الأقسام") || ss.getSheetByName("الاقسام") || ss.getSheetByName("Categories");
  if (catSheet) {
    const lastCol = catSheet.getLastColumn();
    const rows = getSheetRowsSafe(catSheet, Math.max(4, Math.min(lastCol, 8)));
    categories = rows.map((r, idx) => {
      let catId = String(r[0] || ('CAT_' + (idx + 1)));
      let name = String(r[1] || '');
      let groupId = 'GRP_01';
      let groupName = 'عام';
      let isVisible = true;
      let desc = '';
      let sortOrder = idx + 1;
      let image = '';

      if (r.length >= 8 || lastCol >= 8) {
        groupId = String(r[2] || '');
        groupName = String(r[3] || 'عام');
        const stat = String(r[4] || '').trim();
        isVisible = stat !== 'مخفي (0)' && stat !== '0' && stat !== 'hidden';
        desc = String(r[5] || '');
        sortOrder = Number(r[6]) || (idx + 1);
        image = String(r[7] || '');
      } else if (r.length >= 6 || lastCol >= 6) {
        groupId = String(r[2] || '');
        groupName = String(r[3] || 'عام');
        const stat = String(r[4] || '').trim();
        isVisible = stat !== 'مخفي (0)' && stat !== '0' && stat !== 'hidden';
        desc = String(r[5] || '');
      } else {
        desc = String(r[3] || '');
      }

      return {
        CategoryID: catId,
        id: catId,
        name: name,
        groupId: groupId,
        group: groupName,
        isVisible: isVisible,
        sortOrder: sortOrder,
        description: desc,
        image: image
      };
    }).filter(c => c.name.trim().length > 0);
  }

  // 5.1 المجموعات
  let groups = [];
  const grpSheet = ss.getSheetByName("المجموعات") || ss.getSheetByName("Groups");
  if (grpSheet) {
    const lastCol = grpSheet.getLastColumn();
    const rows = getSheetRowsSafe(grpSheet, Math.max(4, Math.min(lastCol, 6)));
    groups = rows.map((r, idx) => {
      const stat = String(r[2] || '').trim();
      let sortOrder = idx + 1;
      let image = '';
      
      if (r.length >= 6 || lastCol >= 6) {
        sortOrder = Number(r[4]) || (idx + 1);
        image = String(r[5] || '');
      }

      return {
        id: String(r[0] || ('GRP_' + (idx + 1))),
        name: String(r[1] || ''),
        isVisible: stat !== 'مخفي (0)' && stat !== '0' && stat !== 'hidden',
        sortOrder: sortOrder,
        description: String(r[3] || ''),
        image: image
      };
    }).filter(g => g.name.trim().length > 0);
  }

  // 5.2 الاشتراكات
  let subscriptions = [];
  const subSheet = ss.getSheetByName("الاشتراكات") || ss.getSheetByName("Subscriptions");
  if (subSheet) {
    const rows = getSheetRowsSafe(subSheet, 11);
    subscriptions = rows.map((r, idx) => ({
      SubscriptionID: String(r[0] || ('SUB_' + (idx + 1))),
      id: String(r[0] || ('SUB_' + (idx + 1))),
      subscriberName: String(r[1] || ''),
      subscriptionType: String(r[2] || 'متجر إلكتروني'),
      planName: String(r[3] || 'الباقة الاحترافية'),
      amount: Number(r[4]) || 0,
      billingCycle: String(r[5] || 'شهري'),
      startDate: formatSheetDate(r[6]),
      endDate: formatSheetDate(r[7]),
      status: String(r[8] || 'نشط'),
      paymentMethod: String(r[9] || 'تحويل بنكي / بطاقة'),
      updatedAt: formatSheetDate(r[10])
    })).filter(s => s.subscriberName.trim().length > 0 || s.SubscriptionID.trim().length > 0);
  }

  // 6. الطلبات
  let orders = [];
  const ordSheet = ss.getSheetByName("الطلبات") || ss.getSheetByName("Orders");
  if (ordSheet) {
    const rows = getSheetRowsSafe(ordSheet, 15);
    orders = rows.map(r => ({
      OrderID: String(r[0] || ''),
      orderNumber: String(r[1] || ''),
      customerName: String(r[2] || ''),
      phone: String(r[3] || ''),
      country: String(r[4] || 'SA'),
      city: String(r[5] || ''),
      address: String(r[6] || ''),
      totalAmount: Number(r[7]) || 0,
      paymentMethod: String(r[8] || ''),
      orderStatus: String(r[9] || 'pending'),
      employeeName: String(r[11] || ''),
      date: String(r[12] || ''),
      shippingCompany: r[13] !== undefined ? String(r[13]) : '',
      trackingNumber: r[14] !== undefined ? String(r[14]) : '',
      items: []
    })).filter(o => o.orderNumber.trim().length > 0 || o.OrderID.trim().length > 0);
  }

  // 7. العملاء
  let customers = [];
  const custSheet = ss.getSheetByName("العملاء") || ss.getSheetByName("Customers");
  if (custSheet) {
    const rows = getSheetRowsSafe(custSheet, 9);
    customers = rows.map(r => ({
      CustomerID: String(r[0] || ''),
      name: String(r[1] || ''),
      phone: String(r[2] || ''),
      email: String(r[3] || ''),
      city: String(r[4] || ''),
      address: String(r[5] || ''),
      taxNumber: String(r[6] || ''),
      balance: Number(r[7]) || 0,
      loyaltyPoints: Number(r[8]) || 0
    })).filter(c => c.name.trim().length > 0);
  }

  // 8. الموردين
  let suppliers = [];
  const supSheet = ss.getSheetByName("الموردين") || ss.getSheetByName("الموردون") || ss.getSheetByName("موردين") || ss.getSheetByName("Suppliers");
  if (supSheet) {
    const rows = getSheetRowsSafe(supSheet, 5);
    suppliers = rows.map((r, idx) => ({
      SupplierID: String(r[0] || ('SUP_' + (idx + 101))),
      name: String(r[1] || ''),
      phone: String(r[2] || ''),
      email: String(r[3] || ''),
      balance: Number(r[4]) || 0
    })).filter(s => s.name.trim().length > 0);
  }

  // 9. الفواتير
  let invoices = [];
  const invSheet = ss.getSheetByName("الفواتير") || ss.getSheetByName("Invoices");
  if (invSheet) {
    const rows = getSheetRowsSafe(invSheet, 10);
    invoices = rows.map(r => ({
      InvoiceID: String(r[0] || ''),
      invoiceNumber: String(r[1] || ''),
      customerName: String(r[2] || ''),
      taxNumber: String(r[3] || ''),
      itemsSummary: String(r[4] || ''),
      taxAmount: Number(r[5]) || 0,
      totalAmount: Number(r[6]) || 0,
      paymentMethod: String(r[7] || ''),
      employeeName: String(r[8] || ''),
      qrCodeUrl: '',
      date: String(r[9] || '')
    })).filter(i => i.invoiceNumber.trim().length > 0);
  }

  function formatSheetDate(val) {
    if (!val) return '';
    if (val instanceof Date) {
      var y = val.getFullYear();
      var m = ('0' + (val.getMonth() + 1)).slice(-2);
      var d = ('0' + val.getDate()).slice(-2);
      return y + '-' + m + '-' + d;
    }
    var str = String(val).trim();
    if (str.includes('GMT') || str.length > 15) {
      var dObj = new Date(str);
      if (!isNaN(dObj.getTime())) {
        var y2 = dObj.getFullYear();
        var m2 = ('0' + (dObj.getMonth() + 1)).slice(-2);
        var d2 = ('0' + dObj.getDate()).slice(-2);
        return y2 + '-' + m2 + '-' + d2;
      }
    }
    return str;
  }

  // 10. العروض
  let offers = [];
  const offSheet = ss.getSheetByName("العروض") || ss.getSheetByName("Offers");
  if (offSheet) {
    const rows = getSheetRowsSafe(offSheet, 6);
    offers = rows.map(r => ({
      OfferID: String(r[0] || ''),
      title: String(r[1] || ''),
      discountPercentage: Number(r[2]) || 0,
      startDate: formatSheetDate(r[3]),
      endDate: formatSheetDate(r[4]),
      status: String(r[5] || 'active')
    })).filter(o => o.title.trim().length > 0);
  }

  // 11. الكوبونات
  let coupons = [];
  const cpnSheet = ss.getSheetByName("الكوبونات") || ss.getSheetByName("Coupons");
  if (cpnSheet) {
    const rows = getSheetRowsSafe(cpnSheet, 8);
    coupons = rows.map(r => ({
      CouponCode: String(r[1] || ''),
      discountType: String(r[2] === 'fixed' ? 'fixed' : 'percentage'),
      discountValue: Number(r[3]) || 0,
      minOrderAmount: Number(r[4]) || 0,
      expiryDate: formatSheetDate(r[5]),
      usageCount: Number(r[6]) || 0
    })).filter(c => c.CouponCode.trim().length > 0);
  }

  // 12. سجل العمليات
  let auditLogs = [];
  const logSheet = ss.getSheetByName("سجل_العمليات") || ss.getSheetByName("AuditLogs");
  if (logSheet) {
    const rows = getSheetRowsSafe(logSheet, 5);
    auditLogs = rows.map(r => ({
      AuditID: String(r[0] || ''),
      employeeName: String(r[1] || ''),
      action: String(r[2] || ''),
      details: String(r[3] || ''),
      timestamp: String(r[4] || '')
    })).filter(l => l.action.trim().length > 0);
  }

  // 13. المسوقين وشركاء الأرباح
  let affiliates = [];
  const affSheet = ss.getSheetByName("المسوقين") || ss.getSheetByName("Affiliates") || ss.getSheetByName("Referrals");
  if (affSheet) {
    const rows = getSheetRowsSafe(affSheet, 14);
    affiliates = rows.map((r, idx) => ({
      id: String(r[0] || ('REF_' + (idx + 101))),
      name: String(r[1] || ''),
      phone: String(r[2] || ''),
      code: String(r[3] || '').toLowerCase(),
      totalClicks: Number(r[4]) || 0,
      registeredCount: Number(r[5]) || 0,
      ordersCount: Number(r[6]) || 0,
      totalEarnings: Number(r[7]) || 0,
      paidEarnings: Number(r[8]) || 0,
      availableBalance: Number(r[9]) || 0,
      withdrawalStatus: String(r[10] || 'none'),
      bankDetails: String(r[11] || ''),
      createdAt: formatSheetDate(r[12]),
      lastActive: formatSheetDate(r[13])
    })).filter(a => a.name.trim().length > 0 || a.code.trim().length > 0);
  }

  return createJsonResponse({
    success: true,
    data: {
      products: products,
      settings: settings,
      employees: employees,
      currencies: currencies,
      categories: categories,
      groups: groups,
      subscriptions: subscriptions,
      orders: orders,
      customers: customers,
      suppliers: suppliers,
      invoices: invoices,
      offers: offers,
      coupons: coupons,
      auditLogs: auditLogs,
      affiliates: affiliates,
      lastSync: new Date().toISOString()
    }
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Builds the complete system payload for Google Apps Script sync
 */
export function buildFullSyncPayload(data: {
  products?: Product[];
  settings?: AppSettings;
  employees?: Employee[];
  categories?: Category[];
  groups?: CategoryGroup[];
  subscriptions?: Subscription[];
  orders?: Order[];
  customers?: Customer[];
  suppliers?: Supplier[];
  invoices?: Invoice[];
  offers?: Offer[];
  coupons?: Coupon[];
  currencies?: CurrencyRate[];
  auditLogs?: AuditLog[];
  affiliates?: ReferralPartner[];
}): any {
  return {
    action: 'sync_all',
    products: data.products || [],
    settings: data.settings,
    employees: data.employees || [],
    categories: data.categories || [],
    groups: data.groups || [],
    subscriptions: data.subscriptions || [],
    orders: data.orders || [],
    customers: data.customers || [],
    suppliers: data.suppliers || [],
    invoices: data.invoices || [],
    offers: data.offers || [],
    coupons: data.coupons || [],
    currencies: data.currencies || [],
    auditLogs: data.auditLogs || [],
    affiliates: data.affiliates || []
  };
}

/**
 * Sanitizes payload before sending to Google Sheets to prevent cell overflow (> 35,000 chars)
 * and limits image arrays to maximum 2 images per product with automatic dual-cell replacement.
 */
function sanitizePayloadForGoogleSheets(payload: any): any {
  if (!payload) return payload;
  
  const sanitizeProduct = (p: any) => {
    if (!p) return p;
    const cleanP = { ...p };
    const { primary, secondary } = formatProductImagesForDualCells(cleanP.images);
    cleanP.images = [primary, secondary].filter(Boolean);
    if (cleanP.images.length === 0) {
      cleanP.images = [DEFAULT_PRODUCT_IMAGE];
    }
    return cleanP;
  };

  const copy = { ...payload };

  if (copy.product) {
    copy.product = sanitizeProduct(copy.product);
  }
  if (Array.isArray(copy.products)) {
    copy.products = copy.products.map(sanitizeProduct);
  }
  return copy;
}

/**
 * Ping check for Google Apps Script Web App URL
 */
export async function pingGoogleAppsScript(webAppUrl: string): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) return false;
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'ping');
    url.searchParams.set('_t', Date.now().toString());
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      return text.includes('success') || text.includes('connected') || text.includes('true') || text.includes('ok');
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Fetch All Products & Sheets Data directly from Google Sheets Web App (All 12 collections)
 */
export async function fetchDataFromGoogleSheets(webAppUrl: string): Promise<{
  success: boolean;
  products?: Product[];
  settings?: Partial<AppSettings>;
  employees?: Employee[];
  categories?: Category[];
  groups?: CategoryGroup[];
  subscriptions?: Subscription[];
  orders?: Order[];
  customers?: Customer[];
  suppliers?: Supplier[];
  invoices?: Invoice[];
  offers?: Offer[];
  coupons?: Coupon[];
  currencies?: CurrencyRate[];
  auditLogs?: AuditLog[];
  affiliates?: ReferralPartner[];
  message?: string;
}> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, message: 'رابط تطبيق الويب غير مدخل' };
  }

  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'read_all');
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (response.ok) {
      const resText = await response.text();
      const parsed = JSON.parse(resText);
      if (parsed && (parsed.data || parsed.products)) {
        const data = parsed.data || parsed;
        const rawProds: any[] = data.products || [];
        
        // Process images & format Hex images
        const processedProducts: Product[] = rawProds.map(p => {
          let imgs = Array.isArray(p.images) ? p.images : [];
          imgs = imgs.map((im: string) => {
            if (typeof im === 'string' && im.startsWith('data:image/hex;')) {
              return convertHexToImageUrl(im) || im;
            }
            return im;
          }).filter(Boolean);

          if (imgs.length === 0) imgs = [DEFAULT_PRODUCT_IMAGE];

          const createDate = p.createdAt || p['تاريخ_الرفع'] || p['تاريخ_الإنشاء'] || p.updatedAt || p['تاريخ_التحديث'] || '';
          const updateDate = p.updatedAt || p['تاريخ_التحديث'] || createDate;
          return {
            ...p,
            createdAt: createDate,
            updatedAt: updateDate,
            images: imgs.slice(0, 2)
          };
        });

        // Sanitize suppliers, offers, coupons, auditLogs, affiliates
        const rawSuppliers = Array.isArray(data.suppliers) ? data.suppliers : [];
        const cleanSuppliers = sanitizeAndDeduplicateSuppliers(rawSuppliers);

        const rawOffers = Array.isArray(data.offers) ? data.offers : [];
        const cleanOffers = sanitizeAndDeduplicateOffers(rawOffers.map((o: any) => ({
          ...o,
          startDate: formatCleanDate(o.startDate),
          endDate: formatCleanDate(o.endDate)
        })));

        const rawCoupons = Array.isArray(data.coupons) ? data.coupons : [];
        const cleanCoupons = sanitizeAndDeduplicateCoupons(rawCoupons.map((c: any) => ({
          ...c,
          expiryDate: formatCleanDate(c.expiryDate)
        })));

        const rawAuditLogs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
        const rawAffiliates = Array.isArray(data.affiliates) ? data.affiliates : [];

        const cleanProducts = sanitizeAndDeduplicateProducts(processedProducts);
        const rawCategories = Array.isArray(data.categories) ? data.categories : [];
        const cleanCategories = sanitizeAndDeduplicateCategories(rawCategories);

        return {
          success: true,
          products: cleanProducts,
          settings: data.settings && Object.keys(data.settings).length > 0 ? data.settings : undefined,
          employees: data.employees && data.employees.length > 0 ? data.employees : undefined,
          currencies: data.currencies && data.currencies.length > 0 ? data.currencies : undefined,
          categories: cleanCategories.length > 0 ? cleanCategories : undefined,
          groups: data.groups && data.groups.length > 0 ? data.groups : undefined,
          subscriptions: data.subscriptions && data.subscriptions.length > 0 ? data.subscriptions : undefined,
          orders: data.orders && data.orders.length > 0 ? data.orders : undefined,
          customers: data.customers && data.customers.length > 0 ? data.customers : undefined,
          suppliers: cleanSuppliers.length > 0 ? cleanSuppliers : undefined,
          invoices: data.invoices && data.invoices.length > 0 ? data.invoices : undefined,
          offers: cleanOffers.length > 0 ? cleanOffers : undefined,
          coupons: cleanCoupons.length > 0 ? cleanCoupons : undefined,
          auditLogs: rawAuditLogs.length > 0 ? rawAuditLogs : undefined,
          affiliates: rawAffiliates.length > 0 ? rawAffiliates : undefined
        };
      }
    }
    return { success: false, message: 'تعذر جلب البيانات من Google Sheets' };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطأ في الاتصال بشيت جوجل' };
  }
}

/**
 * Sync function to send POST payload to Google Apps Script Web App URL
 */
export async function sendToGoogleAppsScriptWebApp(webAppUrl: string, rawPayload: any): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, message: 'رابط تطبيق الويب (Google Web App URL) غير مدخل أو غير صحيح' };
  }

  const payload = sanitizePayloadForGoogleSheets(rawPayload);

  try {
    const response = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const resText = await response.text();
      try {
        const jsonRes = JSON.parse(resText);
        return {
          success: jsonRes.success !== false,
          message: jsonRes.message || 'تمت المزامنة بنجاح مع Google Sheets'
        };
      } catch {
        return { success: true, message: 'تم إرسال البيانات والمزامنة بنجاح' };
      }
    }

    return { success: false, message: `فشل الاتصال: رمز الاستجابة ${response.status}` };
  } catch (err: any) {
    try {
      await fetch(webAppUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return { success: true, message: 'تم إرسال المزامنة إلى Google Sheets بنجاح' };
    } catch {
      return { success: false, message: `خطأ أثناء الاتصال بالسكربت: ${err.message || 'خطأ شبكة'}` };
    }
  }
}

/**
 * Interface for unified Google Sheets operations across all tabs and modals
 */
export interface UnifiedSheetsOperationOptions {
  action: string;
  payload?: any;
  entityName: string;
  operationType: string;
  webAppUrl?: string;
  setLoadingState?: (isLoading: boolean) => void;
  showToast?: (title: string, message: string, type: 'order' | 'sync' | 'info' | 'warning') => void;
  onSuccess?: (res: { success: boolean; message: string }) => void;
  onError?: (err: any) => void;
}

/**
 * Unified execution handler for all Google Sheets sync operations:
 * - Manages loading/lock state across windows to prevent double submissions
 * - Provides clear Toast feedback on success or connection failures
 * - Safely fails over to offline/local storage
 */
export async function executeUnifiedSheetsOperation(
  options: UnifiedSheetsOperationOptions
): Promise<{ success: boolean; message: string }> {
  const {
    action,
    payload = {},
    entityName,
    operationType,
    webAppUrl,
    setLoadingState,
    showToast,
    onSuccess,
    onError
  } = options;

  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    if (showToast) {
      showToast('💾 حفظ محلي آمن', `تم ${operationType} ${entityName} محلياً بنجاح (رابط Google Sheets غير مهيأ).`, 'info');
    }
    return { success: true, message: 'تم الحفظ محلياً بنجاح' };
  }

  if (setLoadingState) setLoadingState(true);

  try {
    const res = await sendToGoogleAppsScriptWebApp(webAppUrl, {
      action,
      ...payload
    });

    if (res.success) {
      if (showToast) {
        showToast('📊 مزامنة Google Sheets', `تم ${operationType} ${entityName} في جدول Google Sheets بنجاح!`, 'sync');
      }
      if (onSuccess) onSuccess(res);
      return res;
    } else {
      const msg = res.message || `تعذر حفظ ${entityName} في Google Sheets (تم الحفظ محلياً بأمان).`;
      if (showToast) {
        showToast('⚠️ تنبيه Google Sheets', msg, 'warning');
      }
      if (onError) onError(new Error(msg));
      return { success: false, message: msg };
    }
  } catch (err: any) {
    const errMsg = err?.message || 'تعذر الاتصال بـ Google Sheets';
    if (showToast) {
      showToast('❌ خطأ اتصال Google Sheets', `فشل الاتصال أثناء ${operationType} ${entityName} (${errMsg}). البيانات محفوظة محلياً.`, 'warning');
    }
    if (onError) onError(err);
    return { success: false, message: errMsg };
  } finally {
    if (setLoadingState) setLoadingState(false);
  }
}

