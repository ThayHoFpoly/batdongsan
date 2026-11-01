const Article = require('../../models/Article');
const Lead = require('../../models/Lead');
const HomeSection = require('../../models/HomeSection');
const Media = require('../../models/Media');

const getDashboard = async (req, res, next) => {
  try {
    const [
      publishedArticlesCount,
      draftArticlesCount,
      newLeadsCount,
      totalLeadsCount,
      activeSectionsCount,
      mediaCount,
      recentLeads,
    ] = await Promise.all([
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'draft' }),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({}),
      HomeSection.countDocuments({ enabled: true }),
      Media.countDocuments({}),
      Lead.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.render('admin/dashboard', {
      title: 'Bảng điều khiển quản trị',
      activeNav: 'dashboard',
      stats: {
        publishedArticlesCount,
        draftArticlesCount,
        newLeadsCount,
        totalLeadsCount,
        activeSectionsCount,
        mediaCount,
      },
      recentLeads,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

