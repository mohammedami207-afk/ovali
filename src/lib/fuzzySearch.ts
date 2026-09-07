import Fuse from 'fuse.js';
import { Product } from '../types';

/**
 * Normalizes Arabic characters to ensure flexible matching regardless of typos or spelling variations.
 * Examples: أ / إ / آ -> ا, ى -> ي, ة -> ه, removing tashkeel.
 */
export function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/diacritics
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}

/**
 * Performs intelligent fuzzy search on products, supporting Arabic typo tolerance,
 * SKU matching, category/group matching, and fallback Fuse.js matching.
 */
export function searchProductsFuzzy(products: Product[], query: string): Product[] {
  const trimmed = query ? query.trim() : '';
  if (!trimmed) return products;

  const normalizedQuery = normalizeArabicText(trimmed);

  // 1. Direct normalized substring match (fast & precise)
  const exactMatches = products.filter(p => {
    if (p.isVisible === false || p.status === 'inactive') return false;
    const nameNorm = normalizeArabicText(p.name || '');
    const catNorm = normalizeArabicText(p.category || '');
    const grpNorm = normalizeArabicText(p.group || '');
    const skuNorm = normalizeArabicText(p.SKU || p.Barcode || '');
    const descNorm = normalizeArabicText(p.description || '');

    return (
      nameNorm.includes(normalizedQuery) ||
      catNorm.includes(normalizedQuery) ||
      grpNorm.includes(normalizedQuery) ||
      skuNorm.includes(normalizedQuery) ||
      descNorm.includes(normalizedQuery)
    );
  });

  // If we have high-confidence exact/substring matches, return them
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // 2. Perform Fuse.js typo-tolerant fuzzy search
  const preparedProducts = products
    .filter(p => p.isVisible !== false && p.status !== 'inactive')
    .map(p => ({
      original: p,
      normalizedName: normalizeArabicText(p.name || ''),
      normalizedCategory: normalizeArabicText(p.category || ''),
      normalizedGroup: normalizeArabicText(p.group || ''),
      normalizedSKU: normalizeArabicText(p.SKU || p.Barcode || ''),
      normalizedDescription: normalizeArabicText(p.description || '')
    }));

  const fuse = new Fuse(preparedProducts, {
    keys: [
      { name: 'normalizedName', weight: 0.5 },
      { name: 'normalizedCategory', weight: 0.2 },
      { name: 'normalizedGroup', weight: 0.15 },
      { name: 'normalizedSKU', weight: 0.1 },
      { name: 'normalizedDescription', weight: 0.05 }
    ],
    threshold: 0.45, // Typo tolerance threshold
    ignoreLocation: true,
    distance: 100,
    minMatchCharLength: 2
  });

  const results = fuse.search(normalizedQuery);
  return results.map(res => res.item.original);
}
