const mongoose = require('mongoose');
const Lead = require('../../models/Lead');

const getLeadsList = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const status = req.query.status || 'all';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { interest: { $regex: q, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [leads, total, newCount, contactedCount, closedCount] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'contacted' }),
      Lead.countDocuments({ status: 'closed' }),
    ]);

    let detailLead = null;
    if (req.query.detail && mongoose.Types.ObjectId.isValid(req.query.detail)) {
      detailLead = await Lead.findById(req.query.detail).lean();
    }

    res.render('admin/leads/index', {
      title: 'Quản lý Yêu cầu Tư vấn',
      activeNav: 'leads',
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        new: newCount,
        contacted: contactedCount,
        closed: closedCount,
        all: newCount + contactedCount + closedCount,
      },
      filters: { q, status },
      detailLead,
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (error) {
    next(error);
  }
};

const postUpdateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/leads?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const validStatuses = ['new', 'contacted', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.redirect('/admin/leads?error=' + encodeURIComponent('Trạng thái không hợp lệ.'));
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.redirect('/admin/leads?error=' + encodeURIComponent('Không tìm thấy yêu cầu tư vấn.'));
    }

    if (status) lead.status = status;
    if (typeof internalNotes === 'string') lead.internalNotes = internalNotes.trim();

    await lead.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Đã cập nhật yêu cầu tư vấn thành công!', lead });
    }

    return res.redirect(`/admin/leads?detail=${lead._id}&success=` + encodeURIComponent(`Đã cập nhật yêu cầu của ${lead.fullName} thành công!`));
  } catch (error) {
    next(error);
  }
};

const postDeleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/leads?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return res.redirect('/admin/leads?error=' + encodeURIComponent('Không tìm thấy khách hàng cần xóa.'));
    }

    return res.redirect('/admin/leads?success=' + encodeURIComponent(`Đã xóa yêu cầu tư vấn của khách hàng "${lead.fullName}" (${lead.phone}) thành công.`));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeadsList,
  postUpdateLead,
  postDeleteLead,
};

