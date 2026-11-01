require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Article = require('../src/models/Article');
const { TestClient } = require('./test-helper');

test('Article Visibility & Publishing Rules', async (t) => {
  // Connect to DB directly for model-level checks and fixture management
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  let testDraftArticle = null;
  let testFutureArticle = null;
  let testPublishedArticle = null;

  t.before(async () => {
    // 1. Fixture: Draft article
    testDraftArticle = await Article.create({
      title: 'Bài Viết Bản Nháp Kiểm Thử Tự Động',
      slug: 'bai-viet-ban-nhap-kiem-thu-tu-dong',
      excerpt: 'Trích đoạn bài viết nháp nội bộ',
      contentHtml: '<p>Nội dung bài viết nháp chỉ dành cho ban quản trị</p>',
      status: 'draft',
      publishedAt: null,
    });

    // 2. Fixture: Scheduled article with future publication date (+7 days)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    testFutureArticle = await Article.create({
      title: 'Bài Viết Lên Lịch Tương Lai Kiểm Thử',
      slug: 'bai-viet-len-lich-tuong-lai-kiem-thu',
      excerpt: 'Bài viết chưa đến thời điểm công bố',
      contentHtml: '<p>Bài viết chưa được phép xuất hiện ra ngoài công chúng</p>',
      status: 'published',
      publishedAt: futureDate,
    });

    // 3. Fixture: Published article (past publication date)
    testPublishedArticle = await Article.create({
      title: 'Bài Viết Công Khai Hợp Lệ Đã Xuất Bản',
      slug: 'bai-viet-cong-khai-hop-le-da-xuat-ban',
      excerpt: 'Bài viết có thể đọc tự do ngoài trang chủ',
      contentHtml: '<p>Nội dung tin tức dự án hoàn toàn công khai</p>',
      status: 'published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    });
  });

  t.after(async () => {
    // Clean up test fixtures
    await Article.deleteMany({
      _id: { $in: [testDraftArticle._id, testFutureArticle._id, testPublishedArticle._id] },
    });
    await mongoose.disconnect();
  });

  await t.test('1. Published article with past publishedAt is accessible publicly (200 OK)', async () => {
    const client = new TestClient();
    const res = await client.request(`/bai-viet/${testPublishedArticle.slug}`);
    assert.equal(res.status, 200, 'Published article must be publicly readable');
    const html = await res.text();
    assert.match(html, /Bài Viết Công Khai Hợp Lệ Đã Xuất Bản/);
    assert.match(html, /<link rel="canonical"/, 'Must contain canonical tag');
    assert.match(html, /og:title/, 'Must contain OpenGraph tags');
    assert.doesNotMatch(html, /noindex/, 'Public article should not have noindex');
  });

  await t.test('2. Draft article cannot be accessed publicly (returns 404)', async () => {
    const client = new TestClient();
    const res = await client.request(`/bai-viet/${testDraftArticle.slug}`);
    assert.equal(res.status, 404, 'Draft article must return 404 for visitors');
    const html = await res.text();
    assert.match(html, /404/, 'Should render 404 page');
  });

  await t.test('3. Scheduled article with future publishedAt cannot be accessed publicly (returns 404)', async () => {
    const client = new TestClient();
    const res = await client.request(`/bai-viet/${testFutureArticle.slug}`);
    assert.equal(res.status, 404, 'Future dated article must return 404 for visitors');
  });

  await t.test('4. Non-existent article slug returns 404', async () => {
    const client = new TestClient();
    const res = await client.request('/bai-viet/slug-hoan-toan-khong-ton-tai-trong-db-123');
    assert.equal(res.status, 404);
  });

  await t.test('5. Admin can preview draft article (/admin/articles/:id/preview) with noindex', async () => {
    const client = new TestClient();
    await client.login();

    const res = await client.request(`/admin/articles/${testDraftArticle._id}/preview`);
    assert.equal(res.status, 200, 'Admin can preview draft article');
    const html = await res.text();
    assert.match(html, /XEM TRƯỚC ADMIN/, 'Should indicate admin preview mode');
    assert.match(html, /noindex,\s*nofollow/, 'Preview page must have noindex tag to protect SEO');
  });

  await t.test('6. Vietnamese slug generation and duplicate slug handling', async () => {
    const slug1 = await Article.generateUniqueSlug('Đẳng Cấp Không Gian Sống Ven Sông');
    assert.equal(slug1, 'dang-cap-khong-gian-song-ven-song', 'Should slugify Vietnamese diacritics');

    // Create a temporary article with this slug
    const tempArt = await Article.create({
      title: 'Đẳng Cấp Không Gian Sống Ven Sông',
      slug: slug1,
      excerpt: 'Tóm tắt bài viết',
      contentHtml: '<p>Nội dung</p>',
    });

    // Try generating slug for identical title
    const slug2 = await Article.generateUniqueSlug('Đẳng Cấp Không Gian Sống Ven Sông');
    assert.equal(slug2, 'dang-cap-khong-gian-song-ven-song-1', 'Should append -1 for duplicate slug');

    await Article.deleteOne({ _id: tempArt._id });
  });

  await t.test('7. Full article CRUD lifecycle via Admin CMS', async () => {
    const client = new TestClient();
    await client.login();

    // 1. Create Article via Admin
    const createCsrf = await client.getCsrfToken('/admin/articles/create');
    const createParams = new URLSearchParams();
    createParams.set('_csrf', createCsrf);
    createParams.set('title', 'Căn Hộ Mẫu Thiết Kế Mới 2026');
    createParams.set('slug', 'can-ho-mau-thiet-ke-moi-2026');
    createParams.set('excerpt', 'Trải nghiệm không gian thực tế căn hộ mẫu');
    createParams.set('contentHtml', '<p>Chi tiết căn hộ mẫu 3 phòng ngủ</p>');
    createParams.set('category', 'Tin tức dự án');
    createParams.set('status', 'draft');

    const createRes = await client.request('/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString(),
    });
    assert.equal(createRes.status, 302, 'Creating article should redirect to articles list');

    const createdArticle = await Article.findOne({ slug: 'can-ho-mau-thiet-ke-moi-2026' });
    assert.ok(createdArticle, 'Article must exist in DB');
    assert.equal(createdArticle.status, 'draft');

    // 2. Publish the article
    const editCsrf = await client.getCsrfToken(`/admin/articles/${createdArticle._id}/edit`);
    const publishParams = new URLSearchParams();
    publishParams.set('_csrf', editCsrf);
    publishParams.set('title', 'Căn Hộ Mẫu Thiết Kế Mới 2026 - Đã Xuất Bản');
    publishParams.set('slug', 'can-ho-mau-thiet-ke-moi-2026');
    publishParams.set('excerpt', 'Trải nghiệm không gian thực tế căn hộ mẫu');
    publishParams.set('contentHtml', '<p>Chi tiết căn hộ mẫu 3 phòng ngủ đã mở cửa</p>');
    publishParams.set('category', 'Tin tức dự án');
    publishParams.set('status', 'published');

    const publishRes = await client.request(`/admin/articles/${createdArticle._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    });
    assert.equal(publishRes.status, 302);

    const updatedArticle = await Article.findById(createdArticle._id);
    assert.equal(updatedArticle.status, 'published');
    assert.ok(updatedArticle.publishedAt, 'Published date must be set');

    // 3. Delete article
    const deleteCsrf = await client.getCsrfToken('/admin/articles');
    const deleteParams = new URLSearchParams();
    deleteParams.set('_csrf', deleteCsrf);

    const deleteRes = await client.request(`/admin/articles/${createdArticle._id}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: deleteParams.toString(),
    });
    assert.equal(deleteRes.status, 302);

    const deletedCheck = await Article.findById(createdArticle._id);
    assert.equal(deletedCheck, null, 'Article must be deleted');
  });
});
