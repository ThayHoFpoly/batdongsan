const SiteSettings = require('../../models/SiteSettings');
const settingsService = require('../../services/settings.service');

const getSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();

    res.render('admin/settings', {
      title: 'Cài đặt Website & Thông tin Dự án',
      activeNav: 'settings',
      settings,
      successMsg: req.query.success ? 'Đã lưu cài đặt website thành công!' : null,
      errorMsg: null,
    });
  } catch (error) {
    next(error);
  }
};

const postSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();

    const {
      siteName,
      logoUrl,
      faviconUrl,
      projectName,
      tagline,
      shortDescription,
      fullDescription,
      address,
      developer,
      seoTitle,
      seoDescription,
      seoOgImage,
      copyrightText,
      disclaimerText,
      // Array of stats
      statLabels,
      statValues,
      statSubtexts,
    } = req.body;

    if (!siteName || !projectName) {
      return res.render('admin/settings', {
        title: 'Cài đặt Website & Thông tin Dự án',
        activeNav: 'settings',
        settings: { ...settings.toObject(), ...req.body },
        errorMsg: 'Tên website và tên dự án là thông tin bắt buộc.',
        successMsg: null,
      });
    }

    settings.siteName = siteName.trim();
    settings.logoUrl = (logoUrl || '').trim();
    settings.faviconUrl = (faviconUrl || '').trim();
    settings.projectName = projectName.trim();
    settings.tagline = (tagline || '').trim();
    settings.shortDescription = (shortDescription || '').trim();
    settings.fullDescription = (fullDescription || '').trim();
    settings.address = (address || '').trim();
    settings.developer = (developer || '').trim();

    // SEO
    settings.seo = {
      title: (seoTitle || '').trim() || settings.projectName,
      description: (seoDescription || '').trim(),
      ogImage: (seoOgImage || '').trim(),
    };

    // Footer
    settings.footer = {
      copyrightText: (copyrightText || '').trim(),
      disclaimerText: (disclaimerText || '').trim(),
      links: settings.footer?.links || [],
    };

    // Process projectStats
    const parsedStats = [];
    if (statLabels) {
      const labels = Array.isArray(statLabels) ? statLabels : [statLabels];
      const values = Array.isArray(statValues) ? statValues : [statValues];
      const subtexts = Array.isArray(statSubtexts) ? statSubtexts : [statSubtexts];

      for (let i = 0; i < labels.length; i++) {
        const lbl = (labels[i] || '').trim();
        const val = (values[i] || '').trim();
        const sub = (subtexts[i] || '').trim();

        if (lbl && val) {
          parsedStats.push({ label: lbl, value: val, subtext: sub });
        }
      }
    }
    settings.projectStats = parsedStats;

    await settings.save();
    settingsService.clearSettingsCache();

    return res.redirect('/admin/settings?success=1');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  postSettings,
};

