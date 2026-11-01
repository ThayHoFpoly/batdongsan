require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Media = require('../src/models/Media');
const HomeSection = require('../src/models/HomeSection');
const { TestClient } = require('./test-helper');

test('Media Upload & Magic Bytes Inspection', async (t) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Create real binary image buffers with valid magic bytes
  // 1. Valid 1x1 PNG
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
  ]);

  // 2. Valid minimal JPEG
  const validJpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0xFF, 0xD9,
  ]);

  // 3. Fake JPG (Text script disguised as JPG)
  const fakeJpgBuffer = Buffer.from('<?php echo "evil shell"; ?>');

  // 4. SVG file (Disallowed in v1)
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

  let uploadedMediaId = null;
  let uploadedFilePath = null;

  t.after(async () => {
    if (uploadedMediaId) {
      await Media.deleteOne({ _id: uploadedMediaId });
    }
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try { fs.unlinkSync(uploadedFilePath); } catch (e) {}
    }
    await mongoose.disconnect();
  });

  await t.test('1. Valid PNG upload succeeds and generates random server filename', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/media');

    const formData = new FormData();
    formData.append('_csrf', csrfToken);
    formData.append('altText', 'Phối cảnh công viên bờ sông');
    formData.append('file', new Blob([validPngBuffer], { type: 'image/png' }), 'test-banner.png');

    const res = await client.request('/admin/media/upload', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: formData,
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.media);
    assert.match(data.media.filename, /^img-\d+-[a-f0-9]+\.png$/i, 'Server must generate random filename');

    uploadedMediaId = data.media._id;
    uploadedFilePath = path.join(__dirname, '../src/public/uploads', data.media.filename);
    assert.ok(fs.existsSync(uploadedFilePath), 'File must exist on disk');
  });

  await t.test('2. Fake image extension (script renamed to .jpg) is rejected by magic bytes', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/media');

    const formData = new FormData();
    formData.append('_csrf', csrfToken);
    formData.append('file', new Blob([fakeJpgBuffer], { type: 'image/jpeg' }), 'malicious.jpg');

    const res = await client.request('/admin/media/upload', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: formData,
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /giả mạo định dạng/);
  });

  await t.test('3. SVG upload is rejected by MIME and extension filters', async () => {
    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/media');

    const formData = new FormData();
    formData.append('_csrf', csrfToken);
    formData.append('file', new Blob([svgBuffer], { type: 'image/svg+xml' }), 'vector.svg');

    const res = await client.request('/admin/media/upload', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: formData,
    });

    // Multer filter error handler or controller error
    assert.ok([400, 500].includes(res.status));
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Chỉ chấp nhận các tệp hình ảnh định dạng JPEG, PNG hoặc WebP/);
  });

  await t.test('4. Deleting media currently in use by website is prevented', async () => {
    // Attach the uploaded media URL to a section
    const testSection = await HomeSection.findOne({ type: 'hero' });
    const originalHeroBg = testSection.heroContent.backgroundImage;

    const mediaRecord = await Media.findById(uploadedMediaId);
    testSection.heroContent.backgroundImage = mediaRecord.url;
    await testSection.save();

    const client = new TestClient();
    await client.login();
    const csrfToken = await client.getCsrfToken('/admin/media');

    const res = await client.request(`/admin/media/${uploadedMediaId}/delete`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Không thể xóa ảnh.*đang được sử dụng/);

    // Restore original section background
    testSection.heroContent.backgroundImage = originalHeroBg;
    await testSection.save();
  });
});
