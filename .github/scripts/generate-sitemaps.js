const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createGunzip } = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// ===== الإعدادات =====
const SITEMAP_LIMIT = 40000; // أقل من حد جوجل 50,000
const BASE_URL = 'https://files.tmdb.org/p/exports';

// ===== إعدادات المواقع (عدلها حسب مواقعك) =====
const SITES = [
  {
    domain: 'example1.com',
    baseUrl: 'https://example1.com',
    routes: {
      movie: '/movie/{id}',
      tv: '/tv/{id}',
      person: '/person/{id}',
      company: '/company/{id}'
    }
  },
  {
    domain: 'example2.com',
    baseUrl: 'https://example2.com',
    routes: {
      movie: '/film/{id}',
      tv: '/series/{id}',
      person: '/actor/{id}',
      company: '/studio/{id}'
    }
  }
];

// ===== الأدوات المساعدة =====
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
  
  // كل سطر هو JSON
  return data.split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function generateSiteMapXML(items, baseUrl, routePattern) {
  const urls = items.map(item => {
    const url = baseUrl + routePattern.replace('{id}', item.id);
    const priority = item.popularity ? 0.8 : 0.5;
    return `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateSitemapIndex(sitemapFiles, domain, baseUrl) {
  const urls = sitemapFiles.map(file => {
    const filePath = file.replace(domain + '/', '');
    return `  <sitemap>
    <loc>${baseUrl}/sitemaps/${filePath}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</sitemapindex>`;
}

// ===== الوظيفة الرئيسية =====
async function main() {
  const today = getToday();
  console.log(`📅 تاريخ اليوم: ${today}`);
  
  // 1. تحميل البيانات من TMDB
  console.log('📥 تحميل ملفات TMDB...');
  
  const files = {
    movie: `movie_ids_${today}.json.gz`,
    tv: `tv_series_ids_${today}.json.gz`,
    person: `person_ids_${today}.json.gz`,
    company: `production_company_ids_${today}.json.gz`
  };
  
  let data = {};
  for (const [key, fileName] of Object.entries(files)) {
    try {
      console.log(`  - تحميل ${key}...`);
      data[key] = await downloadAndParse(fileName);
      console.log(`    ✅ تم تحميل ${data[key].length} عنصر`);
    } catch (error) {
      console.error(`  ❌ فشل تحميل ${key}:`, error.message);
      data[key] = [];
    }
  }
  
  // 2. إنشاء المجلدات
  const sitemapsDir = path.join(process.cwd(), 'sitemaps');
  if (!fs.existsSync(sitemapsDir)) {
    fs.mkdirSync(sitemapsDir);
  }
  
  // 3. معالجة كل موقع
  for (const site of SITES) {
    console.log(`\n🏗️ معالجة الموقع: ${site.domain}`);
    
    const siteDir = path.join(sitemapsDir, site.domain);
    if (!fs.existsSync(siteDir)) {
      fs.mkdirSync(siteDir);
    }
    
    const allSitemapFiles = [];
    const config = {
      domain: site.domain,
      baseUrl: site.baseUrl,
      routes: site.routes,
      generatedAt: new Date().toISOString(),
      sitemaps: {}
    };
    
    // معالجة كل فئة (أفلام، مسلسلات، إلخ)
    for (const [category, items] of Object.entries(data)) {
      if (items.length === 0) continue;
      
      console.log(`  📂 فئة ${category}: ${items.length} عنصر`);
      
      const categoryDir = path.join(siteDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir);
      }
      
      // تقسيم إلى مجموعات 40,000
      const chunks = [];
      for (let i = 0; i < items.length; i += SITEMAP_LIMIT) {
        chunks.push(items.slice(i, i + SITEMAP_LIMIT));
      }
      
      console.log(`    📄 سيتم إنشاء ${chunks.length} ملف Sitemap`);
      
      const sitemapFiles = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const fileName = `sitemap-${category}-${i + 1}.xml`;
        const filePath = path.join(categoryDir, fileName);
        
        // توليد XML
        const xml = generateSiteMapXML(
          chunk,
          site.baseUrl,
          site.routes[category] || `/${category}/{id}`
        );
        
        fs.writeFileSync(filePath, xml, 'utf8');
        console.log(`      ✅ ${fileName} (${chunk.length} رابط)`);
        
        sitemapFiles.push(`${site.domain}/${category}/${fileName}`);
        allSitemapFiles.push(`${site.domain}/${category}/${fileName}`);
      }
      
      config.sitemaps[category] = sitemapFiles;
    }
    
    // 4. إنشاء Sitemap Index
    const indexXml = generateSitemapIndex(allSitemapFiles, site.domain, site.baseUrl);
    const indexFilePath = path.join(siteDir, 'sitemap.xml');
    fs.writeFileSync(indexFilePath, indexXml, 'utf8');
    console.log(`  ✅ sitemap.xml تم إنشاؤه (يحتوي على ${allSitemapFiles.length} ملف)`);
    
    // 5. إنشاء ملف config.json
    const configPath = path.join(siteDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`  ✅ config.json تم إنشاؤه`);
  }
  
  console.log('\n🎉 تم الانتهاء بنجاح!');
}

main().catch(console.error);
