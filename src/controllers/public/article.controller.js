const settingsService = require('../../services/settings.service');
const contactService = require('../../services/contact.service');
const articleService = require('../../services/article.service');

const getArticleDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      return next();
    }

    const article = await articleService.getArticleBySlug(slug);
    if (!article) {
      // Trả về 404 nếu bài viết không tồn tại hoặc chưa xuất bản hoặc publishedAt trong tương lai
      return next();
    }

    // Tăng lượt xem bất đồng bộ
    articleService.incrementViews(article._id);

    const [siteSettings, salesContact, relatedArticles] = await Promise.all([
      settingsService.getSiteSettings(),
      contactService.getMainSalesContact(),
      articleService.getRelatedArticles(article.slug, 3),
    ]);

    res.render('public/article-detail', {
      title: article.seoTitle || `${article.title} - ${siteSettings.projectName}`,
      siteSettings,
      salesContact,
      article,
      relatedArticles,
    });
  } catch (error) {
    next(error);
  }
};

const getArticlesApi = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit, 10) || 6));
    const skip = (page - 1) * limit;

    const { articles, total } = await articleService.getPublishedArticles({ limit, skip });

    res.json({
      success: true,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + articles.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArticleDetail,
  getArticlesApi,
};
