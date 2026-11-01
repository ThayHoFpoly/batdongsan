const mongoose = require('mongoose');
const Article = require('../../models/Article');
const SiteSettings = require('../../models/SiteSettings');
const SalesContact = require('../../models/SalesContact');

const getArticlesList = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const status = req.query.status || 'all';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('admin/articles/index', {
      title: 'Quản lý Bài viết',
      activeNav: 'articles',
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: { q, status },
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (error) {
    next(error);
  }
};

const getCreateArticle = (req, res) => {
  res.render('admin/articles/form', {
    title: 'Thêm Bài viết Mới',
    activeNav: 'articles',
    article: {
      title: '',
      slug: '',
      excerpt: '',
      coverImage: '',
      contentHtml: '',
      category: 'Tin tức dự án',
      author: 'Ban biên tập',
      status: 'draft',
      seoTitle: '',
      seoDescription: '',
      ogImage: '',
    },
    isEdit: false,
    errorMsg: null,
    successMsg: null,
  });
};

const postCreateArticle = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      excerpt,
      coverImage,
      contentHtml,
      category,
      author,
      status,
      seoTitle,
      seoDescription,
      ogImage,
    } = req.body;

    if (!title || !excerpt || !contentHtml) {
      return res.render('admin/articles/form', {
        title: 'Thêm Bài viết Mới',
        activeNav: 'articles',
        article: req.body,
        isEdit: false,
        errorMsg: 'Vui lòng nhập đầy đủ tiêu đề, trích đoạn tóm tắt và nội dung bài viết.',
        successMsg: null,
      });
    }

    // Generate unique slug
    const finalSlug = await Article.generateUniqueSlug(slug || title);

    const article = new Article({
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt.trim(),
      coverImage: (coverImage || '').trim(),
      contentHtml, // Will be sanitized by Article pre-save hook
      category: (category || 'Tin tức dự án').trim(),
      author: (author || 'Ban biên tập').trim(),
      status: status === 'published' ? 'published' : 'draft',
      publishedAt: status === 'published' ? new Date() : null,
      seoTitle: (seoTitle || '').trim(),
      seoDescription: (seoDescription || '').trim(),
      ogImage: (ogImage || '').trim(),
    });

    await article.save();

    return res.redirect('/admin/articles?success=' + encodeURIComponent('Đã tạo bài viết mới thành công!'));
  } catch (error) {
    return res.render('admin/articles/form', {
      title: 'Thêm Bài viết Mới',
      activeNav: 'articles',
      article: req.body,
      isEdit: false,
      errorMsg: error.message || 'Lỗi khi tạo bài viết.',
      successMsg: null,
    });
  }
};

const getEditArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('Không tìm thấy bài viết.'));
    }

    res.render('admin/articles/form', {
      title: `Chỉnh sửa: ${article.title}`,
      activeNav: 'articles',
      article,
      isEdit: true,
      errorMsg: null,
      successMsg: req.query.success ? 'Đã lưu thay đổi bài viết thành công!' : null,
    });
  } catch (error) {
    next(error);
  }
};

const postEditArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('Không tìm thấy bài viết.'));
    }

    const {
      title,
      slug,
      excerpt,
      coverImage,
      contentHtml,
      category,
      author,
      status,
      seoTitle,
      seoDescription,
      ogImage,
    } = req.body;

    if (!title || !excerpt || !contentHtml) {
      return res.render('admin/articles/form', {
        title: `Chỉnh sửa: ${article.title}`,
        activeNav: 'articles',
        article: { ...article.toObject(), ...req.body },
        isEdit: true,
        errorMsg: 'Vui lòng nhập đầy đủ tiêu đề, trích đoạn tóm tắt và nội dung bài viết.',
        successMsg: null,
      });
    }

    article.title = title.trim();
    article.excerpt = excerpt.trim();
    article.coverImage = (coverImage || '').trim();
    article.contentHtml = contentHtml; // Sanitized by pre-save
    article.category = (category || 'Tin tức dự án').trim();
    article.author = (author || 'Ban biên tập').trim();
    article.seoTitle = (seoTitle || '').trim();
    article.seoDescription = (seoDescription || '').trim();
    article.ogImage = (ogImage || '').trim();

    // Slug: Chỉ thay đổi khi admin chủ động sửa slug
    if (slug && slug.trim() !== article.slug) {
      article.slug = await Article.generateUniqueSlug(slug.trim(), article._id);
    }

    // Status: Handle status transition
    const newStatus = status === 'published' ? 'published' : 'draft';
    if (newStatus === 'published' && article.status !== 'published') {
      article.publishedAt = new Date();
    }
    article.status = newStatus;

    await article.save();

    return res.redirect(`/admin/articles/${article._id}/edit?success=1`);
  } catch (error) {
    return res.render('admin/articles/form', {
      title: 'Chỉnh sửa bài viết',
      activeNav: 'articles',
      article: req.body,
      isEdit: true,
      errorMsg: error.message || 'Lỗi khi cập nhật bài viết.',
      successMsg: null,
    });
  }
};

const postDeleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      return res.redirect('/admin/articles?error=' + encodeURIComponent('Không tìm thấy bài viết cần xóa.'));
    }

    return res.redirect('/admin/articles?success=' + encodeURIComponent(`Đã xóa bài viết "${article.title}" thành công!`));
  } catch (error) {
    next(error);
  }
};

// Preview draft or published article for logged in admin only
const getPreviewArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('errors/404');
    }

    const article = await Article.findById(id).lean();
    if (!article) {
      return res.status(404).render('errors/404');
    }

    const [siteSettings, salesContact, relatedArticles] = await Promise.all([
      SiteSettings.getSettings(),
      SalesContact.getMainContact(),
      Article.find({ _id: { $ne: article._id }, status: 'published' }).limit(3).lean(),
    ]);

    res.render('public/article-detail', {
      title: `[XEM TRƯỚC ADMIN] ${article.title} - ${siteSettings.projectName}`,
      siteSettings,
      salesContact,
      article,
      relatedArticles,
      isPreview: true,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArticlesList,
  getCreateArticle,
  postCreateArticle,
  getEditArticle,
  postEditArticle,
  postDeleteArticle,
  getPreviewArticle,
};

