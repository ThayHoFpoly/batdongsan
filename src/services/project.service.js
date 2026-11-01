const ProjectSetting = require('../models/ProjectSetting');

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds memory cache for high performance

const getProjectSettings = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && (now - lastFetchTime < CACHE_TTL)) {
    return cachedSettings;
  }

  let settings = await ProjectSetting.findOne();
  if (!settings) {
    settings = await ProjectSetting.create({});
  }

  cachedSettings = settings;
  lastFetchTime = now;
  return settings;
};

const clearProjectCache = () => {
  cachedSettings = null;
  lastFetchTime = 0;
};

module.exports = {
  getProjectSettings,
  clearProjectCache,
};

