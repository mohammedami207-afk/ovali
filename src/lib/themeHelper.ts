import { AppSettings } from '../types';

export interface ThemePreset {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'colored';
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  icon: string;
  mode: 'dark' | 'light';
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  // 🌙 Dark Themes (الوضع الداكن الفاخر)
  {
    id: 'pink-royale',
    name: 'الوردي الملكي (Pink Royale)',
    category: 'dark',
    primary: '#ec4899',
    secondary: '#a855f7',
    accent: '#f43f5e',
    bg: '#090d16',
    text: '#f8fafc',
    icon: '#f8fafc',
    mode: 'dark',
    description: 'النمط الرسمي الأنيق بتدرجات الوردي والبنفسجي على خلفية ليلية فاخرة'
  },
  {
    id: 'sapphire-glow',
    name: 'الأزرق الياقوتي (Sapphire Glow)',
    category: 'dark',
    primary: '#2563eb',
    secondary: '#06b6d4',
    accent: '#3b82f6',
    bg: '#030712',
    text: '#f8fafc',
    icon: '#f8fafc',
    mode: 'dark',
    description: 'أزرق تقني واثق مع إضاءات سماوية خافتة وخلفية ليلية عميقة'
  },
  {
    id: 'emerald-gold',
    name: 'الزمرد والذهب (Emerald Gold)',
    category: 'dark',
    primary: '#059669',
    secondary: '#d97706',
    accent: '#10b981',
    bg: '#022c22',
    text: '#f8fafc',
    icon: '#f8fafc',
    mode: 'dark',
    description: 'فخامة خضراء زمردية ولمسات ذهبية راقية تناسب العطور والمجوهرات'
  },
  {
    id: 'sunset-coral',
    name: 'الغروب المرجاني (Sunset Coral)',
    category: 'dark',
    primary: '#f97316',
    secondary: '#ec4899',
    accent: '#e11d48',
    bg: '#0f0a0a',
    text: '#f8fafc',
    icon: '#f8fafc',
    mode: 'dark',
    description: 'ألوان دافئة حيوية مستوحاة من ألوان شفق الغروب'
  },
  {
    id: 'cyber-neon',
    name: 'النيون السيبراني (Cyberpunk Purple)',
    category: 'dark',
    primary: '#8b5cf6',
    secondary: '#d946ef',
    accent: '#06b6d4',
    bg: '#0b0f19',
    text: '#f8fafc',
    icon: '#38bdf8',
    mode: 'dark',
    description: 'ألوان نيون كهربائية عصرية وجريئة للمنتجات التقنية والشبابية'
  },

  // ☀️ Light Themes (الوضع الفاتح النقي)
  {
    id: 'pure-white',
    name: 'الأبيض النقي المشرق (Pure Clean Light)',
    category: 'light',
    primary: '#ec4899',
    secondary: '#8b5cf6',
    accent: '#f43f5e',
    bg: '#ffffff',
    text: '#0f172a',
    icon: '#0f172a',
    mode: 'light',
    description: 'خلفية بيضاء نقية وتدرجات زهرية هادئة تعطي وضوحاً فائقاً للقراءة'
  },
  {
    id: 'luxury-gold-light',
    name: 'الذهبي الفاخر المضيء (Luxury Gold Light)',
    category: 'light',
    primary: '#d97706',
    secondary: '#b45309',
    accent: '#f59e0b',
    bg: '#fafaf9',
    text: '#1c1917',
    icon: '#1c1917',
    mode: 'light',
    description: 'طابع ذهبي كلاسيكي فاخر على خلفية حجرية فاتحة ومريحة للعين'
  },
  {
    id: 'ocean-breeze-light',
    name: 'النسيم البحري الفاتح (Ocean Breeze)',
    category: 'light',
    primary: '#0284c7',
    secondary: '#0d9488',
    accent: '#2563eb',
    bg: '#f8fafc',
    text: '#0f172a',
    icon: '#0369a1',
    mode: 'light',
    description: 'أزرق محيطي مشرق ومنعش مناسب للملابس والمستلزمات العصرية'
  },
  {
    id: 'rose-petal-light',
    name: 'بتلات الورد الفاتحة (Rose Petal)',
    category: 'light',
    primary: '#f43f5e',
    secondary: '#fb7185',
    accent: '#e11d48',
    bg: '#fff1f2',
    text: '#4c0519',
    icon: '#881337',
    mode: 'light',
    description: 'تدرجات وردية ناعمة وأنثوية تناسب متاجر المكياج والعناية'
  },

  // 🎨 Colored & Vibrant Themes (الأنماط الملونة والحيوية)
  {
    id: 'electric-violet',
    name: 'البنفسجي الإشعاعي (Electric Violet)',
    category: 'colored',
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
    bg: '#1e1035',
    text: '#faf5ff',
    icon: '#f472b6',
    mode: 'dark',
    description: 'طيف بنفسجي ساطع وغني بالطاقة مع تباين لوني قوي للمتجر'
  },
  {
    id: 'aquamarine-cyan',
    name: 'الفيروزي والأكوامارين (Aquamarine Glow)',
    category: 'colored',
    primary: '#0891b2',
    secondary: '#059669',
    accent: '#06b6d4',
    bg: '#082f49',
    text: '#f0fdfa',
    icon: '#67e8f9',
    mode: 'dark',
    description: 'أجواء بحرية فيروزية غنية بالحيوية واللمعان'
  },
  {
    id: 'amber-blaze',
    name: 'الكهرمان الناري (Amber Blaze)',
    category: 'colored',
    primary: '#ea580c',
    secondary: '#ca8a04',
    accent: '#e11d48',
    bg: '#1c1008',
    text: '#fffbeb',
    icon: '#fbbf24',
    mode: 'dark',
    description: 'برتقالي كهرماني متوهج يحفز سرعة الشراء وإبراز العروض'
  }
];

export function isColorLight(hex: string): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '').trim();
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) || 0;
    g = parseInt(clean.substring(2, 4), 16) || 0;
    b = parseInt(clean.substring(4, 6), 16) || 0;
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 140;
}

export function hexToRgb(hex: string): string {
  if (!hex) return '236, 72, 153';
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return '236, 72, 153';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function getCurrentThemeMode(settings?: Partial<AppSettings>): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('store_theme_mode') as 'dark' | 'light' | null;
  if (stored === 'dark' || stored === 'light') return stored;
  if (settings?.themeMode === 'light' || settings?.themeMode === 'dark') return settings.themeMode;
  return 'dark';
}

export function toggleThemeMode(settings: AppSettings, onSettingsUpdated?: (newSettings: AppSettings) => void): 'dark' | 'light' {
  const current = getCurrentThemeMode(settings);
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('store_theme_mode', next);
  applyThemeGlobal(settings);
  if (onSettingsUpdated) {
    onSettingsUpdated({ ...settings, themeMode: next });
  }
  return next;
}

export function applyThemeGlobal(theme: Partial<AppSettings>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  const storedMode = typeof window !== 'undefined' ? localStorage.getItem('store_theme_mode') as 'dark' | 'light' | null : null;
  const effectiveMode = storedMode || theme.themeMode || 'dark';
  const isLight = effectiveMode === 'light';

  const bg = isLight ? '#f8fafc' : (theme.themeBgColor && theme.themeBgColor !== '#ffffff' && theme.themeBgColor !== '#f8fafc' ? theme.themeBgColor : '#090d16');
  const primary = theme.themePrimaryColor || '#ec4899';
  const secondary = theme.themeSecondaryColor || (isLight ? '#8b5cf6' : '#a855f7');
  const accent = theme.themeAccentColor || '#f43f5e';
  const text = isLight ? '#0f172a' : (theme.themeTextColor && theme.themeTextColor !== '#0f172a' ? theme.themeTextColor : '#f8fafc');
  const icon = isLight ? '#0f172a' : (theme.themeIconColor || '#f8fafc');

  // Set CSS Root variables and color-scheme
  root.style.colorScheme = isLight ? 'light' : 'dark';
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-primary-rgb', hexToRgb(primary));
  root.style.setProperty('--theme-secondary', secondary);
  root.style.setProperty('--theme-secondary-rgb', hexToRgb(secondary));
  root.style.setProperty('--theme-accent', accent);
  root.style.setProperty('--theme-accent-rgb', hexToRgb(accent));
  root.style.setProperty('--theme-bg', bg);
  root.style.setProperty('--theme-text', text);
  root.style.setProperty('--theme-icon', icon);

  if (isLight) {
    root.classList.add('light', 'light-theme');
    root.classList.remove('dark', 'dark-theme');
    document.body.classList.add('light', 'light-theme');
    document.body.classList.remove('dark', 'dark-theme');
    
    root.style.setProperty('--theme-card-bg', '#ffffff');
    root.style.setProperty('--theme-card-border', '#e2e8f0');
    root.style.setProperty('--theme-inner-bg', '#f1f5f9');
    root.style.setProperty('--theme-subtext', '#64748b');
  } else {
    root.classList.add('dark', 'dark-theme');
    root.classList.remove('light', 'light-theme');
    document.body.classList.add('dark', 'dark-theme');
    document.body.classList.remove('light', 'light-theme');
    
    root.style.setProperty('--theme-card-bg', 'rgba(15, 23, 42, 0.95)');
    root.style.setProperty('--theme-card-border', 'rgba(51, 65, 85, 0.6)');
    root.style.setProperty('--theme-inner-bg', '#020617');
    root.style.setProperty('--theme-subtext', '#94a3b8');
  }

  root.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
  document.body.style.color = text;
}
