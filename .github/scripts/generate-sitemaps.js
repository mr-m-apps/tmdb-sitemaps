const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createGunzip } = require('zlib');

const SITEMAP_LIMIT = 10000;
const BASE_URL = 'https://files.tmdb.org/p/exports';

const SITES = [
  {
    domain: 'aflampro.pp.ua',
    baseUrl: 'https://aflampro.pp.ua',
    routes: {
      movie: '/titles/movie/{id}',
      tv: '/titles/tv/{id}',
      person: '/titles/person/{id}',
    },
    staticPages: [
      { url: '/', priority: '0.9', changefreq: 'daily' },
      { url: '/browse', priority: '0.8', changefreq: 'daily' },
      { url: '/search', priority: '0.8', changefreq: 'daily' },
      { url: '/favorite', priority: '0.7', changefreq: 'weekly' },
      { url: '/legal', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/privacy', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/terms', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/dmca', priority: '0.4', changefreq: 'monthly' },
      { url: '/titles/category/movies/-1', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/movies/-2', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/movies/28', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/12', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/16', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/35', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/80', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/18', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10751', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/14', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/36', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/27', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/9648', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10749', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/878', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/53', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10752', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/37', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/-1', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/tv/-2', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/tv/10759', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/16', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/35', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/80', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/18', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10751', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/9648', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10765', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10768', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/37', priority: '0.7', changefreq: 'weekly' },
    ],
  },
  {
    domain: 'shahidnow.site',
    baseUrl: 'https://shahidnow.site',
    routes: {
      movie: '/titles/movie/{id}',
      tv: '/titles/tv/{id}',
      person: '/titles/person/{id}',
    },
    staticPages: [
      { url: '/', priority: '0.9', changefreq: 'daily' },
      { url: '/browse', priority: '0.8', changefreq: 'daily' },
      { url: '/search', priority: '0.8', changefreq: 'daily' },
      { url: '/favorite', priority: '0.7', changefreq: 'weekly' },
      { url: '/legal', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/privacy', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/terms', priority: '0.4', changefreq: 'monthly' },
      { url: '/legal/dmca', priority: '0.4', changefreq: 'monthly' },
      { url: '/titles/category/movies/-1', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/movies/-2', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/movies/28', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/12', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/16', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/35', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/80', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/18', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10751', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/14', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/36', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/27', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/9648', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10749', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/878', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/53', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/10752', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/movies/37', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/-1', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/tv/-2', priority: '0.8', changefreq: 'daily' },
      { url: '/titles/category/tv/10759', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/16', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/35', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/80', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/18', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10751', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/9648', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10765', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/10768', priority: '0.7', changefreq: 'weekly' },
      { url: '/titles/category/tv/37', priority: '0.7', changefreq: 'weekly' },
    ],
  },
];

function getToday() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}_${dd}_${yyyy}`;
}

async function downloadAndParse(fileName) {
  const url = `${BASE_URL}/${fileName}`;
  const response = await axios.get(url, { responseType: 'stream' });
  const gunzip = createGunzip();
  const stream = response.data.pipe(gunzip);

  let data = '';
  for await (const chunk of stream) {
    data += chunk.toString('utf8');
  }

  return data
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function getPriority(popularity) {
  if (popularity >= 50)  return '0.9';
  if (popularity >= 10)  return '0.8';
  if (popularity >= 1)   return '0.7';
  if (popularity >= 0.1) return '0.6';
  return '0.7';
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemapXML(items, baseUrl, routePattern) {
  const now = new Date().toISOString();
  const urls = items
    .map((item) => {
      const loc = escapeXml(baseUrl + routePattern.replace('{id}', item.id));
      const priority = getPriority(item.popularity || 0);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function generateStaticSitemap(staticPages, baseUrl) {
  const now = new Date().toISOString();
  const urls = staticPages
    .map((page) => {
      const loc = escapeXml(baseUrl + page.url);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq || 'weekly'}</changefreq>\n    <priority>${page.priority || '0.5'}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function generateSitemapIndex(sitemapFiles, baseUrl) {
  const now = new Date().toISOString();
  const sitemaps = sitemapFiles
    .map((file) => {
      const loc = escapeXml(`${baseUrl}/api/sitemap/${file}`);
      return `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function main() {
  const today = getToday();

  const files = {
    movie: `movie_ids_${today}.json.gz`,
    tv: `tv_series_ids_${today}.json.gz`,
    person: `person_ids_${today}.json.gz`,
  };

  const data = {};
  for (const [key, fileName] of Object.entries(files)) {
    try {
      console.log(`تحميل ${key}...`);
      data[key] = await downloadAndParse(fileName);
      console.log(`✓ ${key}: ${data[key].length} عنصر`);
    } catch (error) {
      console.error(`✗ فشل تحميل ${key}: ${error.message}`);
      data[key] = [];
    }
  }

  const sitemapsDir = path.join(process.cwd(), 'sitemaps');
  ensureDir(sitemapsDir);

  for (const site of SITES) {
    console.log(`\nمعالجة: ${site.domain}`);

    const siteDir = path.join(sitemapsDir, site.domain);
    ensureDir(siteDir);

    const allSitemapFiles = [];
    const config = {
      domain: site.domain,
      baseUrl: site.baseUrl,
      generatedAt: new Date().toISOString(),
      sitemaps: {},
    };

    if (site.staticPages && site.staticPages.length > 0) {
      const xml = generateStaticSitemap(site.staticPages, site.baseUrl);
      fs.writeFileSync(path.join(siteDir, 'sitemap-static.xml'), xml, 'utf8');
      console.log(`✓ sitemap-static.xml (${site.staticPages.length} رابط)`);
      allSitemapFiles.push('sitemap-static.xml');
      config.sitemaps.static = ['sitemap-static.xml'];
    }

    for (const [category, items] of Object.entries(data)) {
      const route = site.routes[category];
      if (!route || items.length === 0) continue;

      const categoryDir = path.join(siteDir, category);
      ensureDir(categoryDir);

      const chunks = [];
      for (let i = 0; i < items.length; i += SITEMAP_LIMIT) {
        chunks.push(items.slice(i, i + SITEMAP_LIMIT));
      }

      const categoryFiles = [];
      for (let i = 0; i < chunks.length; i++) {
        const fileName = `sitemap-${category}-${i + 1}.xml`;
        const xml = generateSitemapXML(chunks[i], site.baseUrl, route);
        fs.writeFileSync(path.join(categoryDir, fileName), xml, 'utf8');
        console.log(`✓ ${category}/${fileName} (${chunks[i].length} رابط)`);
        categoryFiles.push(`${category}/${fileName}`);
        allSitemapFiles.push(`${category}/${fileName}`);
      }

      config.sitemaps[category] = categoryFiles;
    }

    const indexXml = generateSitemapIndex(allSitemapFiles, site.baseUrl);
    fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), indexXml, 'utf8');
    console.log(`✓ sitemap.xml (${allSitemapFiles.length} ملف)`);

    fs.writeFileSync(
      path.join(siteDir, 'config.json'),
      JSON.stringify(config, null, 2),
      'utf8'
    );
    console.log(`✓ config.json`);
  }

  console.log('\nتم الانتهاء بنجاح!');
}

main().catch(console.error);
