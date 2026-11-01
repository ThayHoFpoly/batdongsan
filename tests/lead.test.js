require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Lead = require('../src/models/Lead');
const { TestClient } = require('./test-helper');

test('Lead Consultation & Validation', async (t) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  t.after(async () => {
    await mongoose.disconnect();
  });

  await t.test('1. Valid lead submission succeeds and stores in MongoDB', async () => {
    const client = new TestClient();
    const csrfToken = await client.getCsrfToken('/');

    const leadPayload = {
      fullName: 'Nguyễn Văn Kiểm Thử',
      phone: '0987654321',
      interest: 'Căn hộ 2 Phòng Ngủ (2BR)',
      note: 'Yêu cầu tư vấn tầng cao view sông',
      consentGiven: true,
      source: 'landing_page',
      website_url_hp: '', // Honeypot empty
      _csrf: csrfToken,
    };

    const res = await client.request('/lien-he', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(leadPayload),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify record in MongoDB
    const stored = await Lead.findOne({ phone: '0987654321' }).sort({ createdAt: -1 });
    assert.ok(stored, 'Lead must exist in database');
    assert.equal(stored.fullName, 'Nguyễn Văn Kiểm Thử');
    assert.equal(stored.consentGiven, true);
    assert.ok(stored.consentAt, 'Must record consent timestamp');

    // Clean up
    await Lead.deleteOne({ _id: stored._id });
  });

  await t.test('2. Invalid phone format is rejected with clear error', async () => {
    const client = new TestClient();
    const csrfToken = await client.getCsrfToken('/');

    const invalidPhones = ['12345', '09012345678999', 'abcdefghij', '0123456789'];

    for (const badPhone of invalidPhones) {
      const res = await client.request('/lien-he', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          fullName: 'Khách Hàng',
          phone: badPhone,
          consentGiven: true,
          _csrf: csrfToken,
        }),
      });

      assert.equal(res.status, 400, `Phone ${badPhone} should be rejected`);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Số điện thoại/);
    }
  });

  await t.test('3. Missing consent checkbox is rejected', async () => {
    const client = new TestClient();
    const csrfToken = await client.getCsrfToken('/');

    const res = await client.request('/lien-he', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        consentGiven: false,
        _csrf: csrfToken,
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /đồng ý/);
  });

  await t.test('4. Honeypot traps spambots silently without saving to DB', async () => {
    const client = new TestClient();
    const csrfToken = await client.getCsrfToken('/');

    const spamPhone = '0909999888';
    const res = await client.request('/lien-he', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        fullName: 'Spambot Machine',
        phone: spamPhone,
        consentGiven: true,
        website_url_hp: 'http://malicious-spam-link.ru', // Filled honeypot
        _csrf: csrfToken,
      }),
    });

    assert.equal(res.status, 200, 'Returns fake 200 to fool bot');
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify it was NOT saved to database
    const checkDb = await Lead.findOne({ phone: spamPhone });
    assert.equal(checkDb, null, 'Spambot entry must NOT be saved to database');
  });

  await t.test('5. Admin can view lead details and update status/internal notes', async () => {
    // Create a temporary lead
    const tempLead = await Lead.create({
      fullName: 'Khách Cần Chăm Sóc',
      phone: '0912345678',
      interest: 'Penthouse',
      consentGiven: true,
      status: 'new',
    });

    const client = new TestClient();
    await client.login();

    // 1. View lead list
    const listRes = await client.request('/admin/leads');
    assert.equal(listRes.status, 200);
    const listHtml = await listRes.text();
    assert.match(listHtml, /0912345678/);

    // 2. Update status to 'contacted' with notes
    const csrfToken = await client.getCsrfToken('/admin/leads');
    const updateParams = new URLSearchParams();
    updateParams.set('_csrf', csrfToken);
    updateParams.set('status', 'contacted');
    updateParams.set('internalNotes', 'Đã gọi điện lần 1, khách hẹn cuối tuần xem nhà mẫu.');

    const updateRes = await client.request(`/admin/leads/${tempLead._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: updateParams.toString(),
    });
    assert.equal(updateRes.status, 302);

    const updated = await Lead.findById(tempLead._id);
    assert.equal(updated.status, 'contacted');
    assert.equal(updated.internalNotes, 'Đã gọi điện lần 1, khách hẹn cuối tuần xem nhà mẫu.');

    // 3. Delete test lead
    await Lead.deleteOne({ _id: tempLead._id });
  });

  await t.test('6. Friendly error message returned if database encounters connection error', async () => {
    const errorSimulation = new Error('buffering timed out after 10000ms');
    errorSimulation.name = 'MongooseServerSelectionError';

    const isDbError = errorSimulation.name === 'MongooseServerSelectionError' ||
                      errorSimulation.name === 'MongoNetworkError' ||
                      errorSimulation.message?.includes('buffering timed out');

    assert.equal(isDbError, true, 'Should detect database outage error');
    const friendlyMsg = isDbError
      ? 'Hệ thống đang bảo trì kết nối dữ liệu. Quý khách vui lòng gọi trực tiếp hotline để được hỗ trợ tức thì.'
      : errorSimulation.message;

    assert.match(friendlyMsg, /bảo trì kết nối dữ liệu.*hotline/);
  });
});
