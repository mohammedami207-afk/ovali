import * as XLSX from 'xlsx';
import { AppSettings } from '../types';

export interface MainStoreControlData {
  storeName: string;
  storeNumber: string;
  startDate: string;
  endDate: string;
  subscriptionType: string;
  noticeTitle: string;
  nearExpiryNotice: string;
  expiredNotice: string;
  status: 'فعال' | 'غير فعال' | 'active' | 'inactive';
  ordersCount?: number;
  staffCount?: number;
  customersCount?: number;
  suppliersCount?: number;
  visitorsCount?: number;
  productsCount?: number;
  rawRowData?: Record<string, any>;
  lastSyncedAt: string;
}

/**
 * Normalizes Google Sheets URLs to direct CSV export format
 */
export function convertToDirectCsvUrl(url: string): string {
  if (!url || !url.trim()) return '';
  let clean = url.trim();

  // Handle published Google Sheet HTML link
  if (clean.includes('/pubhtml')) {
    clean = clean.replace('/pubhtml', '/pub?output=csv');
  } else if (clean.includes('/edit') && clean.includes('docs.google.com/spreadsheets')) {
    // Convert edit link to export?format=csv
    clean = clean.replace(/\/edit.*$/, '/export?format=csv');
  }
  return clean;
}

/**
 * Fetches and parses the main store control sheet (mainmtger)
 */
export async function fetchMainStoreControlData(
  sheetUrl: string,
  targetStoreIdentifier: string // Store Number or Store Name
): Promise<MainStoreControlData | null> {
  const csvUrl = convertToDirectCsvUrl(sheetUrl);
  if (!csvUrl) return null;

  try {
    const response = await fetch(csvUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} when fetching control sheet`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse as JSON objects with headers
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    if (!rows || rows.length === 0) return null;

    // Search for matching store row by 'رقم المتجر' or 'اسم المتجر'
    const targetQuery = targetStoreIdentifier.trim().toLowerCase();
    
    let matchedRow = rows.find(r => {
      const storeNo = String(r['رقم المتجر'] || r['رقم_المتجر'] || r['Store ID'] || '').trim().toLowerCase();
      const storeName = String(r['اسم المتجر'] || r['اسم_المتجر'] || r['Store Name'] || '').trim().toLowerCase();
      
      if (!targetQuery) return true; // If no target specified, pick first row
      return storeNo === targetQuery || storeName.includes(targetQuery) || targetQuery.includes(storeName);
    });

    if (!matchedRow && rows.length > 0) {
      // Fallback to first row if specific match not found
      matchedRow = rows[0];
    }

    if (!matchedRow) return null;

    const rawStatus = String(
      matchedRow['حالة المتجر فعال او غير فعال'] || 
      matchedRow['حالة المتجر'] || 
      matchedRow['الحالة'] || 
      matchedRow['Status'] || 
      'فعال'
    ).trim();

    const isInactive = rawStatus.includes('غير') || rawStatus.toLowerCase().includes('inact') || rawStatus === '0';

    return {
      storeName: String(matchedRow['اسم المتجر'] || matchedRow['اسم_المتجر'] || '').trim(),
      storeNumber: String(matchedRow['رقم المتجر'] || matchedRow['رقم_المتجر'] || '').trim(),
      startDate: String(matchedRow['تاريخ البدا'] || matchedRow['تاريخ البدء'] || '').trim(),
      endDate: String(matchedRow['تاريخ الانتهاء'] || '').trim(),
      subscriptionType: String(matchedRow['نوع الاشتراك'] || matchedRow['نوع_الاشتراك'] || '').trim(),
      noticeTitle: String(matchedRow['عنوان'] || '').trim(),
      nearExpiryNotice: String(matchedRow['الملاحظه الي يتم ارسالها في حال بقي القليل لانهاء الباقه'] || matchedRow['تنبيه اقتراب الانتهاء'] || '').trim(),
      expiredNotice: String(matchedRow['الملاحظه التي يتم ارسالها في حال انتهت الباقة'] || matchedRow['تنبيه انتهاء الباقة'] || '').trim(),
      status: isInactive ? 'غير فعال' : 'فعال',
      ordersCount: Number(matchedRow['كم عدد الطلبات'] || 0),
      staffCount: Number(matchedRow['كم عدد الموظفين'] || 0),
      customersCount: Number(matchedRow['كم عدد العملاء'] || 0),
      suppliersCount: Number(matchedRow['كم عدد الموردين'] || 0),
      visitorsCount: Number(matchedRow['كم عدد الزوار'] || 0),
      productsCount: Number(matchedRow['كم عدد المنتجات'] || 0),
      rawRowData: matchedRow,
      lastSyncedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.error('Error fetching main store control sheet:', err);
    throw err;
  }
}
