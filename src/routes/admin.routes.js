const express = require('express');
const router = express.Router();

const { requireAdminAuth, redirectIfAuthenticated } = require('../middlewares/auth.middleware');
const { multerUpload, validateImageMagicBytes } = require('../middlewares/upload.middleware');
const { loginRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyMultipartCsrf } = require('../middlewares/csrf.middleware');

const authController = require('../controllers/admin/auth.controller');
const dashboardController = require('../controllers/admin/dashboard.controller');
const settingsController = require('../controllers/admin/settings.controller');
const contactController = require('../controllers/admin/contact.controller');
const sectionController = require('../controllers/admin/section.controller');
const articleController = require('../controllers/admin/article.controller');
const mediaController = require('../controllers/admin/media.controller');
const leadController = require('../controllers/admin/lead.controller');

// 1. Phân hệ Xác thực & Tài khoản
router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', redirectIfAuthenticated, loginRateLimiter, authController.postLogin);
router.post('/logout', authController.postLogout);
router.get('/change-password', requireAdminAuth, authController.getChangePassword);
router.post('/change-password', requireAdminAuth, authController.postChangePassword);

// 2. Phân hệ Bảng điều khiển Tổng quan
router.get('/', requireAdminAuth, dashboardController.getDashboard);

// 3. Phân hệ Cài đặt Website & Thông tin Dự án
router.get('/settings', requireAdminAuth, settingsController.getSettings);
router.post('/settings', requireAdminAuth, settingsController.postSettings);

// 4. Phân hệ Thông tin Nhân viên tư vấn
router.get('/contact', requireAdminAuth, contactController.getContact);
router.post('/contact', requireAdminAuth, contactController.postContact);

// 5. Phân hệ Quản lý Section Trang chủ
router.get('/sections', requireAdminAuth, sectionController.getSectionsList);
router.post('/sections/:id/toggle', requireAdminAuth, sectionController.postToggleSection);
router.post('/sections/:id/move', requireAdminAuth, sectionController.postMoveSection);
router.get('/sections/:id/edit', requireAdminAuth, sectionController.getEditSection);
router.post('/sections/:id', requireAdminAuth, sectionController.postEditSection);

// 6. Phân hệ Quản lý Bài viết
router.get('/articles', requireAdminAuth, articleController.getArticlesList);
router.get('/articles/create', requireAdminAuth, articleController.getCreateArticle);
router.post('/articles', requireAdminAuth, articleController.postCreateArticle);
router.get('/articles/:id/edit', requireAdminAuth, articleController.getEditArticle);
router.post('/articles/:id', requireAdminAuth, articleController.postEditArticle);
router.post('/articles/:id/delete', requireAdminAuth, articleController.postDeleteArticle);
router.get('/articles/:id/preview', requireAdminAuth, articleController.getPreviewArticle);

// 7. Phân hệ Thư viện ảnh & Media
router.get('/media', requireAdminAuth, mediaController.getMediaList);
router.post(
  '/media/upload',
  requireAdminAuth,
  multerUpload.single('file'),
  verifyMultipartCsrf,
  validateImageMagicBytes,
  mediaController.postUploadMedia
);
router.post('/media/:id/alt', requireAdminAuth, mediaController.postUpdateAltText);
router.post('/media/:id/delete', requireAdminAuth, mediaController.postDeleteMedia);

// 8. Phân hệ Yêu cầu tư vấn (Leads)
router.get('/leads', requireAdminAuth, leadController.getLeadsList);
router.post('/leads/:id', requireAdminAuth, leadController.postUpdateLead);
router.post('/leads/:id/delete', requireAdminAuth, leadController.postDeleteLead);

module.exports = router;
