const SalesContact = require('../models/SalesContact');

let cachedContact = null;
let lastFetch = 0;
const CACHE_TTL = 30000;

const getMainSalesContact = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedContact && (now - lastFetch < CACHE_TTL)) {
    return cachedContact;
  }

  let contact = await SalesContact.findOne({ isEnabled: true }).sort({ createdAt: 1 }).lean();
  if (!contact) {
    contact = await SalesContact.findOne().sort({ createdAt: 1 }).lean();
  }

  cachedContact = contact;
  lastFetch = now;
  return contact;
};

const clearContactCache = () => {
  cachedContact = null;
  lastFetch = 0;
};

module.exports = {
  getMainSalesContact,
  clearContactCache,
};

