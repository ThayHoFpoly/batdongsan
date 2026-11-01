require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const SiteSettings = require('../src/models/SiteSettings');
const SalesContact = require('../src/models/SalesContact');
const HomeSection = require('../src/models/HomeSection');
const { TestClient } = require('./test-helper');

test('Project Settings, Sales Contact & Sections Real-Time Sync', async (t) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  let originalSettings = null;
  let originalContact = null;

  t.before(async () => {
    const s = await SiteSettings.getSettings();
    originalSettings = s.toObject();

    const c = await SalesContact.getMainContact();
    originalContact = c ? c.toObject() : null;
  });

  t.after(async () => {
    // Restore initial DB state cleanly
    if (originalSettings) {
      await SiteSettings.updateOne({ _id: originalSettings._id }, originalSettings);
    }
    if (originalContact) {
      await SalesContact.updateOne({ _id: originalContact._id }, originalContact);
    }
    // Ensure all default sections are enabled
    await HomeSection.updateMany({}, { enabled: true });
    await mongoose.disconnect();
  });

  await t.test('1. Edit project information in Admin reflects immediately on Landing Page', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/settings');

    const updateTagline = 'Khu Đô Thị Sinh Thái Đẳng Cấp 2026 - Kiểm Thử';
    const params = new URLSearchParams();
    params.set('_csrf', csrfToken);
    params.set('siteName', originalSettings.siteName || 'The Horizon Riverside');
    params.set('projectName', originalSettings.projectName || 'The Horizon Riverside');
    params.set('tagline', updateTagline);
    params.set('shortDescription', originalSettings.shortDescription || 'Mô tả ngắn');
    params.set('fullDescription', originalSettings.fullDescription || 'Mô tả chi tiết');
    params.set('address', originalSettings.address || 'Đường Ven Sông');

    const res = await client.request('/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    assert.equal(res.status, 302, 'Should redirect after saving settings');

    // Public visitor requests Landing Page
    const publicClient = new TestClient();
    const homeRes = await publicClient.request('/');
    assert.equal(homeRes.status, 200);
    const homeHtml = await homeRes.text();
    assert.match(homeHtml, new RegExp(updateTagline), 'Landing page must reflect new tagline immediately');
  });

  await t.test('2. Edit contact info reflects on both Landing Page and Article Detail', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/contact');

    const newPhone = '0909112233';
    const newZalo = 'https://zalo.me/0909112233';
    const newMessenger = 'https://m.me/horizonriverside.official';

    const params = new URLSearchParams();
    params.set('_csrf', csrfToken);
    params.set('fullName', 'Chuyên Viên Cao Cấp Nguyễn Hoàng');
    params.set('phone', newPhone);
    params.set('zaloUrl', newZalo);
    params.set('messengerUrl', newMessenger);
    params.set('isEnabled', 'on');

    const res = await client.request('/admin/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    assert.equal(res.status, 302);

    // 1. Verify Landing page contains new phone, Zalo, and Messenger
    const publicClient = new TestClient();
    const homeRes = await publicClient.request('/');
    const homeHtml = await homeRes.text();
    assert.match(homeHtml, /0909112233/);
    assert.match(homeHtml, /https:\/\/zalo\.me\/0909112233/);
    assert.match(homeHtml, /https:\/\/m\.me\/horizonriverside\.official/);

    // 2. Verify Article page contains updated hotline
    const articleRes = await publicClient.request('/bai-viet/xu-huong-khong-gian-song-sinh-thai-ven-song');
    assert.equal(articleRes.status, 200);
    const articleHtml = await articleRes.text();
    assert.match(articleHtml, /0909112233/);
  });

  await t.test('3. Remove Messenger channel; mobile sticky bar dynamically adapts', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/contact');

    // Remove Messenger link (leave empty)
    const params = new URLSearchParams();
    params.set('_csrf', csrfToken);
    params.set('fullName', 'Chuyên Viên Cao Cấp Nguyễn Hoàng');
    params.set('phone', '0909112233');
    params.set('zaloUrl', 'https://zalo.me/0909112233');
    params.set('messengerUrl', ''); // EMPTY
    params.set('isEnabled', 'on');

    const res = await client.request('/admin/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    assert.equal(res.status, 302);

    const publicClient = new TestClient();
    const homeRes = await publicClient.request('/');
    const homeHtml = await homeRes.text();

    // Verify Call & Zalo exist, but Messenger is removed
    assert.match(homeHtml, /tel:0909112233/);
    assert.match(homeHtml, /https:\/\/zalo\.me\/0909112233/);
    assert.doesNotMatch(homeHtml, /m\.me/);
  });

  await t.test('4. Toggle section off removes section and navigation anchor link', async () => {
    const client = new TestClient();
    await client.login();

    const amenitiesSec = await HomeSection.findOne({ type: 'amenities' });
    assert.ok(amenitiesSec);

    // 1. Toggle OFF
    const csrfToken = await client.getCsrfToken('/admin/sections');
    const toggleRes = await client.request(`/admin/sections/${amenitiesSec._id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `_csrf=${csrfToken}`,
    });
    assert.equal(toggleRes.status, 302);

    const publicClient = new TestClient();
    const homeRes = await publicClient.request('/');
    const homeHtml = await homeRes.text();

    // Header nav anchor href="#tien-ich" should NOT be present when disabled
    assert.doesNotMatch(homeHtml, /href="#tien-ich"/, 'Nav menu should omit disabled section');

    // 2. Toggle back ON
    const toggleBackCsrf = await client.getCsrfToken('/admin/sections');
    await client.request(`/admin/sections/${amenitiesSec._id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `_csrf=${toggleBackCsrf}`,
    });

    const homeResAfter = await publicClient.request('/');
    const homeHtmlAfter = await homeResAfter.text();
    assert.match(homeHtmlAfter, /href="#tien-ich"/, 'Nav menu should restore enabled section');
  });

  await t.test('5. Section order move (Up/Down) reorders display', async () => {
    const client = new TestClient();
    await client.login();

    const sections = await HomeSection.find().sort({ order: 1 });
    const sec1 = sections[0];
    const sec2 = sections[1];
    const originalOrder1 = sec1.order;
    const originalOrder2 = sec2.order;

    // Move sec1 down
    const csrfToken = await client.getCsrfToken('/admin/sections');
    const moveRes = await client.request(`/admin/sections/${sec1._id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `_csrf=${csrfToken}&direction=down`,
    });
    assert.equal(moveRes.status, 302);

    const reloadedSec1 = await HomeSection.findById(sec1._id);
    assert.equal(reloadedSec1.order, originalOrder2, 'First section order should swap with second');

    // Move it back up
    const csrfToken2 = await client.getCsrfToken('/admin/sections');
    await client.request(`/admin/sections/${sec1._id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `_csrf=${csrfToken2}&direction=up`,
    });

    const restoredSec1 = await HomeSection.findById(sec1._id);
    assert.equal(restoredSec1.order, originalOrder1, 'Order should be restored');
  });
});

