const Article = require('../models/Article');

const getPublishedArticles = async ({ limit = 6, skip = 0 } = {}) => {
  const query = {
    status: 'published',
    publishedAt: { $ne: null, $lte: new Date() },
  };

  const [articles, total] = await Promise.all([
    Article.find(query)
      .select('title slug excerpt coverImage category author publishedAt views')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(query),
  ]);

  return { articles, total };
};

const getArticleBySlug = async (slug) => {
  if (!slug || typeof slug !== 'string') return null;
  
  return Article.findOne({
    slug: slug.trim().toLowerCase(),
    status: 'published',
    publishedAt: { $ne: null, $lte: new Date() },
  }).lean();
};

const getRelatedArticles = async (currentSlug, limit = 3) => {
  if (!currentSlug) return [];

  return Article.find({
    slug: { $ne: currentSlug },
    status: 'published',
    publishedAt: { $ne: null, $lte: new Date() },
  })
    .select('title slug excerpt coverImage category author publishedAt')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
};

const incrementViews = async (id) => {
  try {
    if (!id) return;
    await Article.findByIdAndUpdate(id, { $inc: { views: 1 } });
  } catch (err) {
    console.warn('[Article] Error incrementing views:', err.message);
  }
};

module.exports = {
  getPublishedArticles,
  getArticleBySlug,
  getRelatedArticles,
  incrementViews,
};
