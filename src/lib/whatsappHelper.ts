import { AppSettings, Product, CurrencyRate } from '../types';
import { formatRelativeTime } from './dateUtils';

/**
 * Returns the appropriate WhatsApp phone number based on current selected currency or country
 * Saudi Number default: 966599539659
 * Yemen Number default: 967715989357
 */
export const getStoreWhatsAppNumber = (
  settings?: AppSettings,
  currencyCode?: string
): string => {
  const saudiNumber = (settings?.storePhoneSaudi || '966599539659').replace(/[^0-9]/g, '');
  const yemenNumber = (settings?.storePhoneYemen || '967715989357').replace(/[^0-9]/g, '');

  if (currencyCode === 'YER') {
    return yemenNumber;
  }
  if (currencyCode === 'SAR') {
    return saudiNumber;
  }

  if (settings?.storeWhatsApp) {
    const clean = settings.storeWhatsApp.replace(/[^0-9]/g, '');
    if (clean.length >= 8) return clean;
  }

  if (settings?.storePhone) {
    const clean = settings.storePhone.replace(/[^0-9]/g, '');
    if (clean.length >= 8) return clean;
  }

  return saudiNumber;
};

/**
 * Formats a rich, professional WhatsApp message text for a product
 * including Product Name, Price, Discount, Relative Time ("الآن", "قبل دقيقة", "قبل ساعة"),
 * Direct Preview Link, Direct Image URL, and Instant Order Link.
 */
export const formatProductWhatsAppShareText = (
  product: Product,
  currency: CurrencyRate,
  settings?: AppSettings,
  directUrlOverride?: string,
  options?: { forMediaCaption?: boolean }
): { shareText: string; directProductUrl: string; timeAgo: string; convertedPrice: string } => {
  const convertedPrice = ((Number(product.salePrice) || 0) * (1 - (product.discount || 0) / 100) * (currency?.exchangeRate || 1)).toFixed(2);
  const originalPrice = ((Number(product.salePrice) || 0) * (currency?.exchangeRate || 1)).toFixed(2);
  const timeAgo = formatRelativeTime(product.createdAt || product.updatedAt);
  const storeName = settings?.storeName || 'اوفالي للأناقة';
  const cleanPhone = getStoreWhatsAppNumber(settings, currency.currencyCode);

  const baseUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : '';
  const directProductUrl = directUrlOverride || `${baseUrl}?product=${product.ProductID}&t=${encodeURIComponent(product.name)}&p=${convertedPrice}&time=${encodeURIComponent(timeAgo)}`;

  const mainImageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
  const isDataUrl = mainImageUrl.startsWith('data:');

  // Build sizes & colors summary
  const sizesText = product.size && product.size.length > 0 ? product.size.join(' - ') : '';
  const colorsText = product.color && product.color.length > 0 ? product.color.join(' - ') : '';

  const shareText = `👑 *${storeName}* | ${product.name}
💰 *السعر:* ${convertedPrice} ${currency.symbol}${product.discount > 0 ? ` (🔥 خصم ${product.discount}% بدلاً من ${originalPrice})` : ''}
⏰ *وقت العرض:* ${timeAgo}
${product.category ? `📦 *القسم:* ${product.category}\n` : ''}${sizesText ? `📏 *المقاسات المتاحة:* ${sizesText}\n` : ''}${colorsText ? `🎨 *الألوان:* ${colorsText}\n` : ''}${!isDataUrl && mainImageUrl ? `🖼️ *صورة المنتج:* ${mainImageUrl}\n` : ''}🔗 *رابط المعاينة والطلب المباشر:*
${directProductUrl}`;

  return {
    shareText,
    directProductUrl,
    timeAgo,
    convertedPrice
  };
};

/**
 * Converts a remote or data URL into a standard File object for Web Share API Level 2
 */
export const urlToFile = async (url: string, filename: string = 'product_image.jpg'): Promise<File | null> => {
  try {
    if (url.startsWith('data:')) {
      const arr = url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }

    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch (error) {
    console.warn('Could not convert image URL to File for sharing:', error);
    return null;
  }
};

/**
 * Native Web Share with image file and text (Direct into WhatsApp chat as photo + caption)
 */
export const shareProductWithNativeMedia = async (
  product: Product,
  currency: CurrencyRate,
  settings?: AppSettings
): Promise<{ sharedWithFile: boolean; success: boolean }> => {
  const { shareText, directProductUrl } = formatProductWhatsAppShareText(product, currency, settings);
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (imageUrl) {
        const file = await urlToFile(imageUrl, `rwnaq_${product.ProductID}.jpg`);
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `👑 ${settings?.storeName || 'اوفالي'} | ${product.name}`,
            text: shareText
          });
          return { sharedWithFile: true, success: true };
        }
      }

      // Fallback: Share text & link
      await navigator.share({
        title: `👑 ${settings?.storeName || 'اوفالي'} | ${product.name}`,
        text: shareText,
        url: directProductUrl
      });
      return { sharedWithFile: false, success: true };
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        return { sharedWithFile: false, success: false };
      }
      console.warn('Native share failed, falling back', err);
    }
  }

  // Fallback to opening WhatsApp link
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(waUrl, '_blank');
  return { sharedWithFile: false, success: true };
};

