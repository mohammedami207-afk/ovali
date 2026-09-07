/**
 * Utilities for Date handling, formatting, and Arabic relative time calculations.
 */

/**
 * Utilities for Date handling, formatting, and Arabic relative time calculations.
 */

// Helper to convert Eastern Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to standard ASCII digits (0123456789)
export const normalizeArabicNumbers = (input: string): string => {
  if (!input) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(input);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(arabicDigits[i], String(i));
  }
  return res;
};

// Parse diverse date string formats (ISO, Arabic locale string, timestamps, Google Sheets dates) into a valid Date object
export const parseAnyDate = (dateInput: string | number | Date | undefined | null): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  if (typeof dateInput === 'number') {
    // If it's an Excel/Google Sheets serial number (e.g. 46257)
    if (dateInput > 20000 && dateInput < 60000) {
      return new Date((dateInput - 25569) * 86400 * 1000);
    }
    return new Date(dateInput);
  }

  let str = String(dateInput).trim();
  if (!str) return new Date();

  // Normalize Eastern Arabic digits to standard 0-9 and clean punctuation
  str = normalizeArabicNumbers(str);

  // Check if standard Date constructor can parse it directly (e.g., ISO formats "2026-08-23T01:54:22.000Z")
  const standardDate = new Date(str);
  if (!isNaN(standardDate.getTime()) && !str.includes('ص') && !str.includes('م') && !str.includes('/')) {
    return standardDate;
  }

  // Detect AM / PM in Arabic or English
  const isPM = str.includes('م') || str.toLowerCase().includes('pm');
  const isAM = str.includes('ص') || str.toLowerCase().includes('am');

  // Extract time parts if present (hours, minutes, seconds)
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  const timeMatch = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  // Extract date parts e.g. "2026/8/23" or "23/8/2026" or "2026-08-23"
  const dateMatch = str.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
  if (dateMatch) {
    const p1 = parseInt(dateMatch[1], 10);
    const p2 = parseInt(dateMatch[2], 10);
    const p3 = parseInt(dateMatch[3], 10);

    let year = 2026;
    let month = 0;
    let day = 1;

    // Case 1: YYYY/M/D (e.g. 2026/8/23)
    if (p1 > 1000) {
      year = p1;
      month = p2 - 1;
      day = p3;
    }
    // Case 2: D/M/YYYY or M/D/YYYY (e.g. 23/8/2026 or 8/23/2026)
    else if (p3 > 1000) {
      year = p3;
      // If p1 > 12, p1 is day, p2 is month
      if (p1 > 12) {
        day = p1;
        month = p2 - 1;
      } else {
        // Default Arab locale day/month/year
        day = p1;
        month = p2 - 1;
      }
    }
    // Case 3: 2-digit year (e.g. 26/8/23 or 23/8/26)
    else {
      if (p1 <= 31 && p2 <= 12) {
        day = p1;
        month = p2 - 1;
        year = 2000 + p3;
      } else {
        year = 2000 + p1;
        month = p2 - 1;
        day = p3;
      }
    }

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Final fallback to standard Date
  if (!isNaN(standardDate.getTime())) return standardDate;

  return new Date();
};

/**
 * Converts a date input to human-readable Arabic relative time:
 * "منذ لحظات", "منذ دقيقة", "منذ 5 دقائق", "أمس", "منذ أسبوع", "منذ شهر", "منذ سنة"
 */
export const formatRelativeTime = (dateInput: string | number | Date | undefined | null): string => {
  if (!dateInput) return 'منذ لحظات';

  const date = parseAnyDate(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If created just now (within 90 seconds in past or slight clock skew up to 60s future)
  if (diffInSeconds >= -60 && diffInSeconds <= 90) {
    return 'منذ لحظات';
  }

  // Future dates (if clock differs significantly)
  if (diffInSeconds < -60) {
    return 'حديث';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return 'منذ دقيقة';
    if (diffInMinutes === 2) return 'منذ دقيقتين';
    if (diffInMinutes >= 3 && diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
    return `منذ ${diffInMinutes} دقيقة`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return 'منذ ساعة';
    if (diffInHours === 2) return 'منذ ساعتين';
    if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
    return `منذ ${diffInHours} ساعة`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) return 'أمس';
    if (diffInDays === 2) return 'منذ يومين';
    if (diffInDays >= 3 && diffInDays <= 10) return `منذ ${diffInDays} أيام`;
    return `منذ ${diffInDays} يوماً`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) return 'منذ أسبوع';
    if (diffInWeeks === 2) return 'منذ أسبوعين';
    return `منذ ${diffInWeeks} أسابيع`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return 'منذ شهر';
    if (diffInMonths === 2) return 'منذ شهرين';
    if (diffInMonths >= 3 && diffInMonths <= 10) return `منذ ${diffInMonths} أشهر`;
    return `منذ ${diffInMonths} شهراً`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears === 1) return 'منذ سنة';
  if (diffInYears === 2) return 'منذ سنتين';
  if (diffInYears >= 3 && diffInYears <= 10) return `منذ ${diffInYears} سنوات`;
  return `منذ ${diffInYears} سنة`;
};

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export const formatDateToISO = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Adds days to a Date and returns formatted YYYY-MM-DD
 */
export const addDaysToDate = (days: number, baseDate: Date = new Date()): string => {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + days);
  return formatDateToISO(target);
};

/**
 * Formats a date input into a clean string e.g. "2026-08-15" or formatted date
 */
export const formatCleanDate = (dateInput: string | number | Date | undefined | null): string => {
  if (!dateInput) return '';
  const d = parseAnyDate(dateInput);
  return formatDateToISO(d);
};

/**
 * Formats a date input clearly as Day/Month/Year (DD/MM/YYYY)
 * e.g. "25/08/2026"
 */
export const formatDMYDate = (dateInput: string | number | Date | undefined | null): string => {
  if (!dateInput) return '';
  const d = parseAnyDate(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Checks if a date string falls on today
 */
export const isCreatedToday = (dateInput: string | number | Date | undefined | null): boolean => {
  if (!dateInput) return false;
  const d = parseAnyDate(dateInput);
  const now = new Date();
  return d.getDate() === now.getDate() &&
         d.getMonth() === now.getMonth() &&
         d.getFullYear() === now.getFullYear();
};

/**
 * Checks if a date string is within the last 7 days
 */
export const isCreatedThisWeek = (dateInput: string | number | Date | undefined | null): boolean => {
  if (!dateInput) return false;
  const d = parseAnyDate(dateInput);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

/**
 * Checks if a date string is within the last 30 days
 */
export const isCreatedThisMonth = (dateInput: string | number | Date | undefined | null): boolean => {
  if (!dateInput) return false;
  const d = parseAnyDate(dateInput);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 30;
};

/**
 * Calculates days remaining between today and an end date string
 */
export const getDaysRemaining = (endDateStr: string): number => {
  if (!endDateStr) return 0;
  const end = new Date(endDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Generates direct carrier shipment tracking links
 */
export const getTrackingUrl = (company?: string, trackingNumber?: string): string => {
  if (!trackingNumber) return '#';
  const co = (company || '').toLowerCase();
  const num = encodeURIComponent(trackingNumber.trim());

  if (co.includes('aramex') || co.includes('ارامكس') || co.includes('أرامكس')) {
    return `https://www.aramex.com/express/track-results-multiple?TrackingNumbers=${num}`;
  }
  if (co.includes('smsa') || co.includes('سمسا')) {
    return `https://www.smsaexpress.com/ar/trackingdetails?tracknumbers=${num}`;
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

  return `https://www.google.com/search?q=${encodeURIComponent('تتبع شحنة ' + (company || '') + ' ' + trackingNumber)}`;
};

