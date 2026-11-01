const test = require('node:test');
const assert = require('node:assert/strict');
const { TestClient } = require('./test-helper');

test('Authentication & Access Control', async (t) => {
  await t.test('1. Unauthenticated access to /admin redirects to /admin/login', async () => {
    const client = new TestClient();
    const res = await client.request('/admin');
    assert.equal(res.status, 302, 'Should return 302 redirect');
    assert.equal(res.headers.get('location'), '/admin/login', 'Should redirect to /admin/login');
  });

  await t.test('2. Unauthenticated access to protected submodules redirects to login', async () => {
    const client = new TestClient();
    for (const path of ['/admin/settings', '/admin/articles', '/admin/leads', '/admin/media']) {
      const res = await client.request(path);
      assert.equal(res.status, 302, `${path} should require authentication`);
      assert.equal(res.headers.get('location'), '/admin/login');
    }
  });

  await t.test('3. Login with invalid password fails and returns error', async () => {
    const client = new TestClient();
    const res = await client.login('admin@grandriverfront.vn', 'WrongPassword123');
    assert.equal(res.status, 200, 'Should render login page with 200 status');
    const html = await res.text();
    assert.match(html, /Email hoặc mật khẩu không chính xác/, 'Should show invalid credentials error');
  });

  await t.test('4. Login with non-existent email fails', async () => {
    const client = new TestClient();
    const res = await client.login('ghost@grandriverfront.vn', 'AnyPassword123');
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Email hoặc mật khẩu không chính xác/);
  });

  await t.test('5. Login with correct credentials succeeds and redirects to /admin', async () => {
    const client = new TestClient();
    const res = await client.login('admin@grandriverfront.vn', 'Admin@123456');
    assert.equal(res.status, 302, 'Should redirect after login');
    assert.equal(res.headers.get('location'), '/admin', 'Should redirect to /admin');

    // Access /admin with authenticated session
    const dashRes = await client.request('/admin');
    assert.equal(dashRes.status, 200, 'Authenticated admin can view dashboard');
    const dashHtml = await dashRes.text();
    assert.match(dashHtml, /Bảng điều khiển/);
    assert.match(dashHtml, /name="robots"\s+content="noindex,\s*nofollow"/, 'Admin must have noindex tag');
  });

  await t.test('6. Authenticated admin can access all 8 admin submodules', async () => {
    const client = new TestClient();
    await client.login('admin@grandriverfront.vn', 'Admin@123456');

    const modules = [
      '/admin',
      '/admin/settings',
      '/admin/contact',
      '/admin/sections',
      '/admin/articles',
      '/admin/media',
      '/admin/leads',
      '/admin/change-password',
    ];

    for (const modPath of modules) {
      const res = await client.request(modPath);
      assert.equal(res.status, 200, `${modPath} should return 200 for authenticated admin`);
      const html = await res.text();
      assert.match(html, /HORIZON CMS/, `${modPath} should render admin layout`);
      assert.match(html, /noindex,\s*nofollow/, `${modPath} should contain noindex`);
    }
  });

  await t.test('7. Logout destroys session and redirects to /admin/login', async () => {
    const client = new TestClient();
    await client.login('admin@grandriverfront.vn', 'Admin@123456');

    // Perform logout
    const logoutRes = await client.logout();
    assert.equal(logoutRes.status, 302, 'Logout should redirect');
    assert.equal(logoutRes.headers.get('location'), '/admin/login');

    // Verify subsequent access is revoked
    const afterRes = await client.request('/admin');
    assert.equal(afterRes.status, 302, 'Access after logout must be revoked');
    assert.equal(afterRes.headers.get('location'), '/admin/login');
  });
});
