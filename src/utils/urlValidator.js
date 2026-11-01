/**
 * URL Validator and Sanitizer Utility
 * Enforces safe protocols and blocks dangerous schemes like javascript:, data:, vbscript:.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'tel:', 'mailto:']);

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;

  // Block inline data/script injection
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return false;
  }

  // Allow anchor links (#section)
  if (trimmed.startsWith('#')) {
    return true;
  }

  // Allow relative internal paths (/lien-he, /bai-viet/slug)
  // But reject protocol-relative URLs (//malicious.com) or Windows backslash patterns (/\\)
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || /^\/[/\\]/.test(trimmed)) {
      return false;
    }
    return true;
  }

  // Parse absolute URLs
  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch (err) {
    return false;
  }
}

function sanitizeUrl(url, fallback = '') {
  return isSafeUrl(url) ? url.trim() : fallback;
}

module.exports = {
  isSafeUrl,
  sanitizeUrl,
};

