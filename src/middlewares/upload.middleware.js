const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../public/uploads');

// Đảm bảo thư mục uploads luôn tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Danh sách định dạng MIME và đuôi tệp được cho phép (Chỉ JPEG, PNG, WebP)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tên file do server hoàn toàn sinh ngẫu nhiên, không phụ thuộc vào user input
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `img-${Date.now()}-${randomHex}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Chỉ chấp nhận các tệp hình ảnh định dạng JPEG, PNG hoặc WebP. Không chấp nhận SVG hoặc tệp thực thi.'));
  }

  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Tối đa 5MB
    files: 1,
  },
});

/**
 * Middleware kiểm tra Magic Bytes (File Signature)
 * Đảm bảo nội dung thực tế của file khớp với định dạng ảnh, chống kỹ thuật đổi tên file giả mạo extension.
 */
const validateImageMagicBytes = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;

  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
                  buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
    const isWebp = buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      // Xóa tệp giả mạo ngay lập tức
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      const errorMsg = 'Nội dung tệp không phải là hình ảnh hợp lệ hoặc bị giả mạo định dạng.';
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      return res.redirect('/admin/media?error=' + encodeURIComponent(errorMsg));
    }

    next();
  } catch (err) {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    return next(err);
  }
};

module.exports = {
  multerUpload,
  validateImageMagicBytes,
};
