const settingsService = require('../../services/settings.service');
const contactService = require('../../services/contact.service');
const sectionService = require('../../services/section.service');
const articleService = require('../../services/article.service');

const getHomePage = async (req, res, next) => {
  try {
    const [siteSettings, salesContact, rawSections] = await Promise.all([
      settingsService.getSiteSettings(),
      contactService.getMainSalesContact(),
      sectionService.getActiveSections(),
    ]);

    // Build map for quick section lookup by type
    const sectionMap = {};
    rawSections.forEach(sec => {
      sectionMap[sec.type] = sec;
    });

    const newsLimit = sectionMap.news?.newsContent?.displayCount || 6;
    const { articles, total: totalArticles } = await articleService.getPublishedArticles({ limit: newsLimit });

    // Determine availability of each section
    const isAvailable = {
      hero: Boolean(sectionMap.hero && sectionMap.hero.heroContent?.headline),
      overview: Boolean(sectionMap.overview && (sectionMap.overview.overviewContent?.description || (sectionMap.overview.overviewContent?.stats && sectionMap.overview.overviewContent.stats.length > 0))),
      location: Boolean(sectionMap.location && (sectionMap.location.locationContent?.description || (sectionMap.location.locationContent?.highlights && sectionMap.location.locationContent.highlights.length > 0))),
      amenities: Boolean(sectionMap.amenities && sectionMap.amenities.amenitiesContent?.items && sectionMap.amenities.amenitiesContent.items.length > 0),
      floorPlans: Boolean(sectionMap.floorPlans && sectionMap.floorPlans.floorPlansContent?.items && sectionMap.floorPlans.floorPlansContent.items.length > 0),
      gallery: Boolean(sectionMap.gallery && sectionMap.gallery.galleryContent?.items && sectionMap.gallery.galleryContent.items.length > 0),
      news: Boolean(sectionMap.news && articles && articles.length > 0),
      contact: Boolean(sectionMap.contact),
    };

    // Build navigation items strictly for active and available sections
    const navItems = [];
    if (isAvailable.overview) navItems.push({ href: '#tong-quan', label: sectionMap.overview.subtitle || 'Tổng quan' });
    if (isAvailable.location) navItems.push({ href: '#vi-tri', label: sectionMap.location.subtitle || 'Vị trí' });
    if (isAvailable.amenities) navItems.push({ href: '#tien-ich', label: sectionMap.amenities.subtitle || 'Tiện ích' });
    if (isAvailable.floorPlans) navItems.push({ href: '#mat-bang', label: sectionMap.floorPlans.subtitle || 'Mặt bằng' });
    if (isAvailable.gallery) navItems.push({ href: '#thu-vien', label: sectionMap.gallery.subtitle || 'Thư viện' });
    if (isAvailable.news) navItems.push({ href: '#tin-tuc', label: sectionMap.news.subtitle || 'Tin tức' });
    if (isAvailable.contact) navItems.push({ href: '#lien-he', label: sectionMap.contact.subtitle || 'Liên hệ' });

    res.render('public/home', {
      title: siteSettings.seo?.title || `${siteSettings.projectName} - ${siteSettings.tagline}`,
      siteSettings,
      salesContact,
      sectionMap,
      isAvailable,
      navItems,
      articles,
      totalArticles,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomePage,
};
