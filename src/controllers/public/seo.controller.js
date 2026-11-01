const Article = require('../../models/Article');

/**
 * Controller phục vụ SEO: robots.txt và sitemap.xml
 */

const getRobotsTxt = (req, res) => {
  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  const content = [
    '# Robots.txt for The Horizon Riverside Real Estate Portal',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /healthz',
    'Disallow: /db-status',
    'Disallow: /api/',
    '',
    `Sitemap: ${appUrl}/sitemap.xml`,
  ].join('\n');

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
};

const getSitemapXml = async (req, res, next) => {
  try {
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

    const publishedArticles = await Article.findPublished()
      .select('slug updatedAt publishedAt')
      .sort({ publishedAt: -1 })
      .lean();

    const todayStr = new Date().toISOString().split('T')[0];

    const xmlUrls = [
      `  <url>
    <loc>${appUrl}/</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ];

    publishedArticles.forEach((article) => {
      const lastModDate = (article.updatedAt || article.publishedAt || new Date())
        .toISOString()
        .split('T')[0];

      xmlUrls.push(`  <url>
    <loc>${appUrl}/bai-viet/${article.slug}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(sitemapXml);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRobotsTxt,
  getSitemapXml,
};

