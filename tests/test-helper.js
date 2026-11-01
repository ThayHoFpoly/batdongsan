/**
 * Test Helper for automated end-to-end and unit tests
 * Handles cookie persistence, CSRF extraction, and authenticated requests.
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class TestClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  setCookieFromHeaders(headers) {
    const setCookieHeaders = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean);

    for (const cookieStr of setCookieHeaders) {
      if (!cookieStr) continue;
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies.set(name, value);
      }
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set('X-Test-Bypass', 'true');

    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: options.redirect || 'manual', // Do not auto-follow so we can test 302 redirects
    });

    this.setCookieFromHeaders(response.headers);
    return response;
  }

  async getCsrfToken(path = '/') {
    const res = await this.request(path);
    const text = await res.text();
    const metaMatch = text.match(/name="csrf-token"\s+content="([^"]+)"/);
    if (metaMatch) return metaMatch[1];
    const inputMatch = text.match(/name="_csrf"\s+value="([^"]+)"/);
    if (inputMatch) return inputMatch[1];
    return null;
  }

  async login(email = 'admin@grandriverfront.vn', password = 'Admin@123456') {
    const csrfToken = await this.getCsrfToken('/admin/login');
    const params = new URLSearchParams();
    params.set('email', email);
    params.set('password', password);
    params.set('_csrf', csrfToken || '');

    const res = await this.request('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    return res;
  }

  async logout() {
    const csrfToken = await this.getCsrfToken('/admin');
    const params = new URLSearchParams();
    params.set('_csrf', csrfToken || '');

    return this.request('/admin/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  }
}

module.exports = {
  BASE_URL,
  TestClient,
};
