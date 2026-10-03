import { Product, AppSettings } from '../types';

export interface PriceDetails {
  baseSalePrice: number;
  originalPrice: number | null;
  finalPrice: number;
  discountPercentage: number;
  discountAmount: number;
}

/**
 * Calculates adjusted product prices considering global store price markups and discounts.
 */
export const getAdjustedProductPrices = (
  product: Product,
  settings?: AppSettings
): PriceDetails => {
  let baseSalePrice = Number(product.salePrice) || 0;
  let originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  let discountPercentage = Number(product.discount) || 0;

  // 1. Apply global pricing markup if specified in settings
  if (settings) {
    const markupType = settings.priceMarkupType;
    const markupValue = Number(settings.priceMarkupValue) || 0;

    if (markupType === 'percentage' && markupValue > 0) {
      baseSalePrice = baseSalePrice * (1 + markupValue / 100);
      if (originalPrice) {
        originalPrice = originalPrice * (1 + markupValue / 100);
      }
    } else if (markupType === 'fixed' && markupValue > 0) {
      baseSalePrice = baseSalePrice + markupValue;
      if (originalPrice) {
        originalPrice = originalPrice + markupValue;
      }
    }
  }

  // 2. Calculate discount on top of markup price
  let finalPrice = baseSalePrice;
  let discountAmount = 0;

  if (originalPrice && originalPrice > baseSalePrice) {
    // If originalPrice exists and is higher, baseSalePrice is the discounted price
    finalPrice = baseSalePrice;
    discountAmount = originalPrice - finalPrice;
    discountPercentage = Math.round((discountAmount / originalPrice) * 100);
  } else if (discountPercentage > 0) {
    // If there is a percentage discount on the salePrice
    const previousPrice = baseSalePrice;
    finalPrice = baseSalePrice * (1 - discountPercentage / 100);
    discountAmount = previousPrice - finalPrice;
    originalPrice = previousPrice;
  }

  return {
    baseSalePrice,
    originalPrice: originalPrice && originalPrice > finalPrice ? originalPrice : null,
    finalPrice,
    discountPercentage,
    discountAmount
  };
};
