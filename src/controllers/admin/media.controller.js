const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Media = require('../../models/Media');

const getMediaList = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 24;
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      filter.$or = [
        { originalName: { $regex: q, $options: 'i' } },
        { altText: { $regex: q, $options: 'i' } },
        { filename: { $regex: q, $options: 'i' } },
      ];
    }

    const [mediaItems, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments(filter),
    ]);

    // Support JSON response for modal image picker
    if (req.query.format === 'json' || req.xhr) {
      return res.json({
        success: true,
        media: mediaItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    res.render('admin/media/index', {
      title: 'Thư viện Hình ảnh & Media',
      activeNav: 'media',
      mediaItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      q,
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (error) {
    next(error);
  }
};

const postUploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp hình ảnh để tải lên.' });
      }
      return res.redirect('/admin/media?error=' + encodeURIComponent('Vui lòng chọn tệp hình ảnh để tải lên.'));
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const altText = (req.body.altText || path.basename(req.file.originalname, path.extname(req.file.originalname))).trim();

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      altText,
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Tải tệp lên thành công!',
        media,
      });
    }

    return res.redirect('/admin/media?success=' + encodeURIComponent('Tải lên hình ảnh thành công!'));
  } catch (error) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: error.message || 'Lỗi tải tệp lên.' });
    }
    return res.redirect('/admin/media?error=' + encodeURIComponent(error.message));
  }
};

const postUpdateAltText = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { altText } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const media = await Media.findByIdAndUpdate(id, { altText: (altText || '').trim() }, { new: true });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hình ảnh.' });
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Cập nhật Alt text thành công!', media });
    }

    return res.redirect('/admin/media?success=' + encodeURIComponent('Cập nhật Alt text thành công!'));
  } catch (error) {
    next(error);
  }
};

const postDeleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/media?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const media = await Media.findById(id);
    if (!media) {
      return res.redirect('/admin/media?error=' + encodeURIComponent('Không tìm thấy hình ảnh cần xóa.'));
    }

    // Kiểm tra xem ảnh có đang được nội dung website sử dụng không
    const usages = await Media.findUsageLocations(media.url);
    if (usages && usages.length > 0) {
      const usageListStr = usages.map(u => u.label).join(', ');
      const errorMsg = `Không thể xóa ảnh "${media.originalName}" vì đang được sử dụng tại: ${usageListStr}. Vui lòng thay thế ảnh ở các vị trí này trước khi xóa.`;

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: errorMsg, usages });
      }

      return res.redirect('/admin/media?error=' + encodeURIComponent(errorMsg));
    }

    // Xóa file vật lý khỏi đĩa nếu tồn tại
    const filePath = path.join(__dirname, '../../public/uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.findByIdAndDelete(id);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: `Đã xóa ảnh "${media.originalName}" thành công.` });
    }

    return res.redirect('/admin/media?success=' + encodeURIComponent(`Đã xóa ảnh "${media.originalName}" thành công.`));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMediaList,
  postUploadMedia,
  postUpdateAltText,
  postDeleteMedia,
};

