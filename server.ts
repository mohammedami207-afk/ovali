import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // AI Shopping Assistant Chatbot Endpoint
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { prompt, currency, storeName, storePhone, storePhoneSaudi, storePhoneYemen, deliveryInfo, productsSummary } = req.body;

      const systemInstruction = `
أنت مرشد التسوق والذكاء الاصطناعي لـ "${storeName || 'المتجر'}".
${storeName || 'المتجر'} هو متجر إلكتروني فاخر.
تفاصيل التوصيل: ${deliveryInfo || 'توصيل متاح لكافة المدن.'}
أرقام التواصل: 
الرقم العام: ${storePhone || ''}
السعودية: ${storePhoneSaudi || ''}
اليمن: ${storePhoneYemen || ''}

الدفع متاح بالريال السعودي (SAR)، الريال اليمني (YER)، والدولار الأمريكي ($).
جاوب العملاء بلغة عربية راقية، مشجعة، وودودة بأسلوب إرشاد تسوق محترف مع إجابات موجزة ومفيدة جداً ومختصرة.
إذا سأل العميل عن توفر منتج أو اقترحت له منتج، استخدم قائمة المنتجات التالية (ابحث ضمنها لتعطي إجابات دقيقة):
${productsSummary}

العملة المختارة حالياً: ${currency || 'SAR'}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt || 'مرحباً، ما هي أحدث المنتجات والعروض متوفرة بالمتجر؟',
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error('Gemini AI Chat Error:', error);
      res.status(500).json({
        reply: 'مرحباً بك في متجر رونق! يمكنك الاستفسار عن الشحن للسعودية واليمن أو تصفح تشكيلاتنا الراقية عبر القائمة المباشرة.'
      });
    }
  });

  // Robots.txt for Googlebot & search engine crawlers
  app.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robots);
  });

  // Sitemap.xml for Google SEO Indexing
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?catalog=true</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?admin=true</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(sitemap);
  });

  // Cache for store settings, loaded from file if exists, otherwise defaults to requested values
  let cachedSettings = {
    storeName: 'متجر Ovali الإلكتروني',
    storeTagline: 'تسوق أحدث الفساتين والملابس والمنتجات الفاخرة بعروض وخصومات مميزة! توصيل سريع للسعودية واليمن. اضغط للتسوق الآن!',
    heroTitle: 'أحدث صيحات الموضة والأزياء بين يديك',
    storeLogoUrl: 'https://cdn.salla.sa/NGyPX/5037f064-b7f2-4368-b2f7-0bf1d937ba9a-500x500-s2LXAeZgLJzjKejSiGHeYNvn5OvryzifSllilKCQ.jpg',
    heroSubtitle: '',
  };

  const SETTINGS_CACHE_PATH = path.join(process.cwd(), 'settings_cache.json');
  if (fs.existsSync(SETTINGS_CACHE_PATH)) {
    try {
      cachedSettings = JSON.parse(fs.readFileSync(SETTINGS_CACHE_PATH, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse cached settings file:', e);
    }
  }

  // API to save settings on the server side for dynamic sharing preview metadata
  app.post('/api/store-settings', (req, res) => {
    try {
      const { storeName, storeTagline, heroTitle, storeLogoUrl, heroSubtitle } = req.body;
      if (storeName) {
        cachedSettings = {
          storeName: storeName || cachedSettings.storeName,
          storeTagline: storeTagline || cachedSettings.storeTagline,
          heroTitle: heroTitle || cachedSettings.heroTitle,
          storeLogoUrl: storeLogoUrl || cachedSettings.storeLogoUrl,
          heroSubtitle: heroSubtitle || cachedSettings.heroSubtitle,
        };
        fs.writeFileSync(SETTINGS_CACHE_PATH, JSON.stringify(cachedSettings), 'utf-8');
      }
      res.json({ success: true, settings: cachedSettings });
    } catch (error) {
      console.error('Error saving store settings cache:', error);
      res.status(500).json({ success: false });
    }
  });

  // Helper to inject Dynamic OpenGraph tags and Product Schema (JSON-LD) for SEO & Social Sharing
  const injectStoreMetaTags = (html: string, req: express.Request): string => {
    const hasProductQuery = !!(req.query.product || req.query.p);
    let title = '';
    let description = '';
    let imageUrl = '';

    const defaultImg = 'https://cdn.salla.sa/NGyPX/5037f064-b7f2-4368-b2f7-0bf1d937ba9a-500x500-s2LXAeZgLJzjKejSiGHeYNvn5OvryzifSllilKCQ.jpg';

    if (hasProductQuery) {
      // Product Sharing Meta Tags
      const productTitle = (req.query.t || req.query.title || 'منتج حصري') as string;
      const price = (req.query.price || req.query.p_val || (req.query.product ? req.query.p : '') || '') as string;
      const time = (req.query.time || req.query.t_ago || 'الآن') as string;
      const imgParam = (req.query.img || '') as string;

      imageUrl = imgParam && !imgParam.startsWith('data:') ? imgParam : defaultImg;
      title = `👑 ${cachedSettings.storeName} | ${productTitle}${price ? ` - ${price} ر.س` : ''}`;
      description = `💰 السعر: ${price ? `${price} ر.س` : 'مميز'} | ⏰ وقت العرض: ${time} | اضغط هنا لمعاينة المنتج والطلب المباشر من ${cachedSettings.storeName}`;
    } else {
      // General Homepage Sharing Meta Tags
      title = `👑 ${cachedSettings.storeName} 👑`;
      description = cachedSettings.storeTagline || cachedSettings.heroTitle || 'تسوق أحدث الفساتين والملابس والمنتجات الفاخرة بعروض وخصومات مميزة! توصيل سريع للسعودية واليمن. اضغط للتسوق الآن!';
      imageUrl = cachedSettings.storeLogoUrl || defaultImg;
    }

    const canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    let updated = html;

    // Replace Title
    updated = updated.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);

    // Replace or add OG tags & Product Schema (JSON-LD)
    const metaBlock = `
    <!-- Dynamic Store Social Preview & SEO Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${hasProductQuery ? 'product' : 'website'}" />
    <meta property="og:site_name" content="${cachedSettings.storeName}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
`;

    // Remove static og/twitter tags to prevent duplication
    updated = updated.replace(/<meta property="og:title"[\s\S]*?\/>/gi, '');
    updated = updated.replace(/<meta property="og:description"[\s\S]*?\/>/gi, '');
    updated = updated.replace(/<meta property="og:image"[\s\S]*?\/>/gi, '');
    updated = updated.replace(/<meta name="twitter:image"[\s\S]*?\/>/gi, '');
    updated = updated.replace(/<meta name="twitter:title"[\s\S]*?\/>/gi, '');
    updated = updated.replace(/<meta name="twitter:description"[\s\S]*?\/>/gi, '');

    // Inject before </head>
    updated = updated.replace('</head>', `${metaBlock}\n  </head>`);

    return updated;
  };

  // Check if request comes from WhatsApp or Social Media Bot
  const isSocialCrawler = (userAgent: string = ''): boolean => {
    return /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|SkypeUriPreview|Googlebot|bingbot|crawler|meta-externalagent/i.test(userAgent);
  };

  // WhatsApp Crawler & Shared Product Preview Interceptor
  app.use(async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    if (isSocialCrawler(userAgent)) {
      try {
        const indexPath = process.env.NODE_ENV !== 'production'
          ? path.join(process.cwd(), 'index.html')
          : path.join(process.cwd(), 'dist', 'index.html');

        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf-8');
          html = injectStoreMetaTags(html, req);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(200).send(html);
        }
      } catch (err) {
        console.error('Error serving crawler meta HTML:', err);
      }
    }
    next();
  });

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = injectStoreMetaTags(html, req);
        return res.send(html);
      } catch (e) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rwnaq Store Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

