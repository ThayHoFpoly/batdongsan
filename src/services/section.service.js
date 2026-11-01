const HomeSection = require('../models/HomeSection');

let cachedSections = null;
let lastFetch = 0;
const CACHE_TTL = 30000;

const getActiveSections = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedSections && (now - lastFetch < CACHE_TTL)) {
    return cachedSections;
  }

  const sections = await HomeSection.find({ enabled: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  cachedSections = sections;
  lastFetch = now;
  return sections;
};

const clearSectionsCache = () => {
  cachedSections = null;
  lastFetch = 0;
};

module.exports = {
  getActiveSections,
  clearSectionsCache,
};

