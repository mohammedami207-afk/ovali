export const DEFAULT_PRODUCT_IMAGE = 'https://cdn.salla.sa/NGyPX/5037f064-b7f2-4368-b2f7-0bf1d937ba9a-500x500-s2LXAeZgLJzjKejSiGHeYNvn5OvryzifSllilKCQ.jpg';

/**
 * Normalizes an image URL: trims, resolves Google Drive / Dropbox direct links,
 * and handles protocol-relative or formatted URLs.
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim().replace(/^["']|["']$/g, '');
  if (!clean) return '';

  // Google Drive File View Link Conversion
  // e.g. https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
  // or https://drive.google.com/open?id=1a2b3c4d5e
  // or https://drive.google.com/uc?id=...
  if (clean.includes('drive.google.com')) {
    const fileIdMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }

  // Dropbox Direct Link Conversion
  if (clean.includes('dropbox.com')) {
    clean = clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
  }

  return clean;
}

/**
 * Converts a file from device into a Hexadecimal encoded string (data:image/hex;...)
 * with size-bounded canvas optimization to fit cleanly in Google Sheets cells.
 */
export async function convertFileToHex(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize dimensions so hex string fits nicely
        let width = img.width;
        let height = img.height;
        const maxDim = 320;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve((event.target?.result as string) || '');
              return;
            }
            const blobReader = new FileReader();
            blobReader.onload = (be) => {
              const buffer = be.target?.result as ArrayBuffer;
              if (!buffer) {
                resolve((event.target?.result as string) || '');
                return;
              }
              const byteArray = new Uint8Array(buffer);
              let hexString = '';
              for (let i = 0; i < byteArray.length; i++) {
                hexString += byteArray[i].toString(16).padStart(2, '0');
              }
              // Add hex prefix for detection
              resolve('data:image/hex;' + hexString);
            };
            blobReader.onerror = () => resolve((event.target?.result as string) || '');
            blobReader.readAsArrayBuffer(blob);
          }, 'image/jpeg', 0.6);
        } else {
          resolve((event.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((event.target?.result as string) || '');
      img.src = (event.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Hex image string (data:image/hex;...) into a viewable Image URL or Blob
 */
export function convertHexToImageUrl(hexData: string): string {
  if (!hexData || typeof hexData !== 'string') return '';
  const clean = hexData.trim();
  if (!clean.startsWith('data:image/hex;')) {
    return clean;
  }

  try {
    const rawHex = clean.replace('data:image/hex;', '');
    const matches = rawHex.match(/.{1,2}/g);
    if (!matches) return '';
    const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch (e) {
    return '';
  }
}

/**
 * Formats product images into a dual-cell structure (صورة_رئيسية & صورة_ثانية)
 * with smart auto-replacement (if primary image is missing/deleted, secondary takes its place).
 */
export function formatProductImagesForDualCells(images: string[] | undefined): { primary: string; secondary: string } {
  if (!Array.isArray(images)) {
    return { primary: '', secondary: '' };
  }

  const cleanList = images
    .map(img => (typeof img === 'string' ? img.trim() : ''))
    .filter(img => img.length > 0);

  let primary = cleanList[0] || '';
  let secondary = cleanList[1] || '';

  // Smart Auto-Replacement: If primary is empty, secondary becomes primary
  if (!primary && secondary) {
    primary = secondary;
    secondary = '';
  }

  return { primary, secondary };
}

/**
 * Resizes and compresses an image file using an HTML5 Canvas to keep Google Sheets cells small and fast (< 22,000 chars).
 */
export function compressAndResizeImage(
  file: File, 
  initialMaxDim = 400, 
  initialQuality = 0.60, 
  maxCharLength = 22000
): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let maxDim = initialMaxDim;
        let quality = initialQuality;
        let finalDataUrl = '';

        // Compress iteratively to strictly fit within Google Sheets 50,000 char cell limit
        for (let attempt = 0; attempt < 5; attempt++) {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL('image/jpeg', quality);

            if (finalDataUrl.length <= maxCharLength) {
              break;
            }
          }

          // Reduce dimensions and quality for next attempt
          maxDim = Math.round(maxDim * 0.75);
          quality = Math.max(quality - 0.15, 0.35);
        }

        resolve(finalDataUrl || (event.target?.result as string) || '');
      };
      img.onerror = () => resolve((event.target?.result as string) || '');
      img.src = (event.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to validate image URLs and Data URIs (rejects truncated or broken base64 strings)
 */
export function isValidImageString(imgStr: any): boolean {
  if (!imgStr || typeof imgStr !== 'string') return false;
  const s = imgStr.trim();
  if (!s) return false;

  // Direct HTTP / HTTPS or Blob
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
    return true;
  }

  // Hex encoded image
  if (s.startsWith('data:image/hex;')) {
    const raw = s.replace('data:image/hex;', '');
    return raw.length > 20 && /^[0-9a-fA-F]+$/.test(raw);
  }

  // Data URI
  if (s.startsWith('data:image/')) {
    if (!s.includes(',')) return false;
    const parts = s.split(',');
    if (!parts[1] || parts[1].length < 10) return false;
    // Google Sheets cuts cells off around 50,000 chars. If string was truncated mid-base64:
    if (s.length >= 49500) return false;
    return true;
  }

  // Raw base64
  if (s.length > 20 && !s.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(s.replace(/\s/g, ''))) {
    if (s.length >= 49500) return false;
    return true;
  }

  return false;
}

/**
 * Image Utilities for Decoding, Capping to 3 Images Max, and Smart Extraction
 */

export function decodeImageString(input: any): string {
  if (!input) return '';

  // Handle Javascript Array (e.g. byte array / char codes or array of strings)
  if (Array.isArray(input)) {
    if (input.length === 0) return '';
    
    // Check if it's an array of numbers (char codes / bytes)
    if (typeof input[0] === 'number') {
      try {
        let strFromBytes = '';
        for (let i = 0; i < input.length; i++) {
          strFromBytes += String.fromCharCode(input[i]);
        }
        strFromBytes = strFromBytes.trim();
        if (strFromBytes) return decodeImageString(strFromBytes);
      } catch (e) {
        // ignore
      }
    }

    // Check if it's an array of hex/byte values e.g. ["0x64", "0x61"] or ["64", "61"]
    if (typeof input[0] === 'string') {
      const firstStr = input[0].trim();
      if (firstStr.startsWith('http://') || firstStr.startsWith('https://') || firstStr.startsWith('data:image/')) {
        return decodeImageString(firstStr);
      }
      if (input.every(v => typeof v === 'string' && /^(0x)?[0-9a-fA-F]{1,2}$/.test(v.trim()))) {
        try {
          let strFromBytes = '';
          for (let i = 0; i < input.length; i++) {
            const num = parseInt(input[i].trim().replace(/^0x/i, ''), 16);
            if (!isNaN(num)) strFromBytes += String.fromCharCode(num);
          }
          if (strFromBytes) return decodeImageString(strFromBytes);
        } catch (e) {
          // ignore
        }
      }
      return decodeImageString(firstStr);
    }
  }

  let str = '';
  if (typeof input === 'string') {
    str = input.trim();
  } else {
    try {
      str = String(input).trim();
    } catch (e) {
      return '';
    }
  }

  if (!str) return '';

  // 1. Direct match for standard URL or Data URI or Blob
  if (
    str.startsWith('http://') || 
    str.startsWith('https://') || 
    str.startsWith('data:image/') || 
    str.startsWith('blob:')
  ) {
    if (!isValidImageString(str)) return '';
    return str;
  }

  // 2. HEX prefixed data URI e.g. HEX:data:image/jpeg;base64,...
  if (str.toLowerCase().startsWith('hex:data:image/')) {
    const res = str.substring(4);
    return isValidImageString(res) ? res : '';
  }

  // 3. String representation of JSON array e.g. "[100, 97, 116, 97, 58...]" or '["http..."]'
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return decodeImageString(parsed);
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. Raw Base64 string without data:image header
  const cleanBase64 = str.replace(/\s/g, '');
  if (cleanBase64.length > 20 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    let formatted = '';
    if (cleanBase64.startsWith('/9j/')) {
      formatted = `data:image/jpeg;base64,${cleanBase64}`;
    } else if (cleanBase64.startsWith('iVBORw0KGgo')) {
      formatted = `data:image/png;base64,${cleanBase64}`;
    } else if (cleanBase64.startsWith('R0lGOD')) {
      formatted = `data:image/gif;base64,${cleanBase64}`;
    } else if (cleanBase64.startsWith('UklGR')) {
      formatted = `data:image/webp;base64,${cleanBase64}`;
    }
    if (formatted && isValidImageString(formatted)) return formatted;
  }

  // 5. Hexadecimal string decoding (e.g. HEX:646174613a...)
  if (str.toLowerCase().startsWith('hex:')) {
    const cleanHex = str.substring(4).trim();
    try {
      const hexParts = cleanHex.includes(',') ? cleanHex.split(',') : cleanHex.match(/.{1,2}/g) || [];
      let decodedStr = '';
      for (const hp of hexParts) {
        const cleanHp = hp.trim().replace(/^0x/i, '');
        if (cleanHp) {
          decodedStr += String.fromCharCode(parseInt(cleanHp, 16));
        }
      }
      decodedStr = decodedStr.trim();
      if (decodedStr) return decodeImageString(decodedStr);
    } catch (e) {
      // ignore
    }
  }

  return isValidImageString(str) ? str : '';
}

/**
 * Splits combined image strings while preserving Data URIs containing commas
 */
function splitCombinedImageString(str: string): string[] {
  if (!str) return [];
  const s = str.trim();
  if (!s) return [];

  // If JSON array
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (e) {
      // ignore
    }
  }

  if (s.includes('###')) return s.split('###');
  if (s.includes('---')) return s.split('---');
  if (s.includes(' | ')) return s.split(' | ');
  if (s.includes('|')) return s.split('|');
  if (s.includes('\n')) return s.split('\n');

  // Do NOT split by comma if string is a single data URI or URL
  if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) {
    return [s];
  }

  if (s.includes(',')) return s.split(',');
  return [s];
}

/**
 * Extracts up to 3 images max from a Excel/Google Sheets row or data object.
 */
export function extractProductImages(row: any): string[] {
  if (!row) return [DEFAULT_PRODUCT_IMAGE];

  const images: string[] = [];

  // 0. Check if row already has a valid images array
  if (Array.isArray(row.images) && row.images.length > 0) {
    row.images.forEach((item: any) => {
      const decoded = decodeImageString(item);
      if (decoded && !images.includes(decoded) && images.length < 3) {
        images.push(decoded);
      }
    });
    if (images.length > 0) return images;
  }

  // 1. Check individual image columns (Up to 3 images max)
  const img1 = row['صورة 1'] || row['صورة_1'] || row['Image 1'] || row['Image_1'] || row['صورة1'] || row['Image1'];
  const img2 = row['صورة 2'] || row['صورة_2'] || row['Image 2'] || row['Image_2'] || row['صورة2'] || row['Image2'];
  const img3 = row['صورة 3'] || row['صورة_3'] || row['Image 3'] || row['Image_3'] || row['صورة3'] || row['Image3'];

  if (img1) {
    const d1 = decodeImageString(img1);
    if (d1) images.push(d1);
  }
  if (img2) {
    const d2 = decodeImageString(img2);
    if (d2) images.push(d2);
  }
  if (img3) {
    const d3 = decodeImageString(img3);
    if (d3) images.push(d3);
  }

  // 2. Check general combined image columns if specific columns didn't give full list
  if (images.length < 3) {
    const rawCombined = 
      row['الصور'] || 
      row['روابط الصور'] || 
      row['روابط'] || 
      row['روابط(القسم)'] || 
      row['صورة'] || 
      row['Images'] || 
      row['Image'] || 
      row['images'] || 
      row['image'] || 
      '';

    if (Array.isArray(rawCombined)) {
      rawCombined.forEach((item: any) => {
        const decoded = decodeImageString(item);
        if (decoded && !images.includes(decoded) && images.length < 3) {
          images.push(decoded);
        }
      });
    } else if (typeof rawCombined === 'string' && rawCombined.trim()) {
      const strTrim = rawCombined.trim();
      if (strTrim.startsWith('[') && strTrim.endsWith(']')) {
        try {
          const parsed = JSON.parse(strTrim);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              const decoded = decodeImageString(item);
              if (decoded && !images.includes(decoded) && images.length < 3) {
                images.push(decoded);
              }
            });
          }
        } catch (e) {
          // ignore JSON parse error
        }
      }

      if (images.length === 0) {
        const parts = splitCombinedImageString(strTrim);
        parts.forEach(p => {
          const decoded = decodeImageString(p);
          if (decoded && !images.includes(decoded) && images.length < 3) {
            images.push(decoded);
          }
        });
      }
    }
  }

  // Filter out empty entries
  const validImages = images.filter(Boolean);

  // Enforce Max 3 images limit
  const capped = validImages.slice(0, 3);

  if (capped.length === 0) {
    return [DEFAULT_PRODUCT_IMAGE];
  }

  return capped;
}
