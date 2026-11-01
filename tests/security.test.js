require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizeHtml = require('sanitize-html');
const { isSafeUrl } = require('../src/utils/urlValidator');
const Article = require('../src/models/Article');
const { TestClient } = require('./test-helper');

test('Security & Vulnerability Defenses', async (t) => {
  await t.test('1. CSRF Protection blocks requests without CSRF token (403 Forbidden)', async () => {
    const client = new TestClient();

    // POST /lien-he without token
    const res = await client.request('/lien-he', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Hacker CSRF',
        phone: '0901234567',
        consentGiven: true,
      }),
    });

    assert.equal(res.status, 403, 'Must reject mutation without valid CSRF token');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /CSRF/i);
  });

  await t.test('2. Dangerous URL schemes (javascript:, data:, vbscript:) are strictly rejected', () => {
    assert.equal(isSafeUrl('javascript:alert(document.cookie)'), false);
    assert.equal(isSafeUrl('JavaScript:void(0)'), false);
    assert.equal(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
    assert.equal(isSafeUrl('vbscript:msgbox("xss")'), false);
    assert.equal(isSafeUrl('//evil-phishing-site.com'), false);
    assert.equal(isSafeUrl('/\\evil.com'), false);

    // Safe URLs must pass
    assert.equal(isSafeUrl('https://zalo.me/0901234567'), true);
    assert.equal(isSafeUrl('https://m.me/horizonriverside'), true);
    assert.equal(isSafeUrl('tel:0901234567'), true);
    assert.equal(isSafeUrl('mailto:tuvan@horizon.vn'), true);
    assert.equal(isSafeUrl('#tien-ich'), true);
    assert.equal(isSafeUrl('/bai-viet/tien-do-thi-cong'), true);
  });

  await t.test('3. Rich text sanitizer strips scripts, event handlers, and data URIs', () => {
    const dirtyHtml = `
      <h2>Tiêu đề bài viết</h2>
      <p>Nội dung hợp lệ</p>
      <script>alert("XSS Payload")</script>
      <img src="https://images.unsplash.com/photo-1" onerror="alert(1)" onload="evil()">
      <a href="javascript:alert(1)">Bấm vào đây để nhận quà</a>
      <iframe src="https://evil.com"></iframe>
    `;

    // Article pre-save uses sanitize-html with strict whitelist
    const cleanHtml = sanitizeHtml(dirtyHtml, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption'
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        '*': ['class', 'style'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    });

    assert.doesNotMatch(cleanHtml, /<script/, 'Scripts must be removed');
    assert.doesNotMatch(cleanHtml, /onerror/, 'Event handlers must be removed');
    assert.doesNotMatch(cleanHtml, /onload/, 'Event handlers must be removed');
    assert.doesNotMatch(cleanHtml, /javascript:/, 'Javascript URIs must be removed');
    assert.doesNotMatch(cleanHtml, /<iframe/, 'Iframes must be removed');
    assert.match(cleanHtml, /<h2>Tiêu đề bài viết<\/h2>/);
    assert.match(cleanHtml, /<p>Nội dung hợp lệ<\/p>/);
  });

  await t.test('4. Security headers (Helmet) are present on responses', async () => {
    const client = new TestClient();
    const res = await client.request('/');

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-security-policy'), 'CSP header must be present');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN', 'Clickjacking defense');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff', 'MIME sniffing defense');
  });
});
