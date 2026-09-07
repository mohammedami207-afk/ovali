const headers = ["الرمز_المميز (ID)", "رمز_المنتج (SKU)", "اسم_المنتج", "القسم", "سعر_البيع", "سعر_التكلفة", "الكمية_المتاحة", "صورة_رئيسية", "صورة_ثانية", "الوصف", "الحالة"];

const detectColumnMappings = (headers: string[]) => {
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
  };
};

console.log(detectColumnMappings(headers));
