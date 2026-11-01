const SiteSettings = require('../models/SiteSettings');

let cachedSettings = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30s in-memory cache

const getSiteSettings = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && (now - lastFetch < CACHE_TTL)) {
    return cachedSettings;
  }

  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    settings = await SiteSettings.create({});
    settings = settings.toObject();
  }

  cachedSettings = settings;
  lastFetch = now;
  return settings;
};

const clearSettingsCache = () => {
  cachedSettings = null;
  lastFetch = 0;
};

module.exports = {
  getSiteSettings,
  clearSettingsCache,
};

