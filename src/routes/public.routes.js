const express = require('express');
const router = express.Router();

const homeController = require('../controllers/public/home.controller');
const articleController = require('../controllers/public/article.controller');
const leadController = require('../controllers/public/lead.controller');
const healthController = require('../controllers/public/health.controller');
const seoController = require('../controllers/public/seo.controller');
const { consultationRateLimiter } = require('../middlewares/rateLimiter.middleware');

// Standard health check for operational monitors
router.get('/healthz', healthController.getHealthz);

// Database detailed health check page
router.get('/db-status', healthController.getDbStatus);

// SEO: robots.txt & sitemap.xml
router.get('/robots.txt', seoController.getRobotsTxt);
router.get('/sitemap.xml', seoController.getSitemapXml);

// Public landing page
router.get('/', homeController.getHomePage);

// Article detail page
router.get('/bai-viet/:slug', articleController.getArticleDetail);

// Public articles pagination API
router.get('/api/articles', articleController.getArticlesApi);

// Consultation Lead Form submission (with rate limiting and honeypot)
router.post('/lien-he', consultationRateLimiter, leadController.submitLead);

module.exports = router;
