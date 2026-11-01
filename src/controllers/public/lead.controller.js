const leadService = require('../../services/lead.service');

const submitLead = async (req, res, next) => {
  try {
    // 1. Honeypot check (nếu bot điền trường ẩn thì phản hồi giả lập, không lưu database)
    if (req.body.website_url_hp) {
      console.warn('[Anti-Spam] Bot triggered honeypot field');
      return res.json({
        success: true,
        message: 'Đăng ký tư vấn thành công.',
      });
    }

    // 2. Chỉ nhận các trường được cho phép (whitelisting)
    const { fullName, phone, interest, note, source, consentGiven } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

    // 3. Gọi lead service để validate và lưu vào MongoDB
    await leadService.createLead({
      fullName,
      phone,
      interest,
      note,
      source: source || 'landing_page',
      consentGiven,
      ipAddress,
    });

    const successMessage = 'Cảm ơn Quý khách! Yêu cầu tư vấn đã được ghi nhận thành công. Chuyên viên dự án sẽ liên hệ với Quý khách trong thời gian sớm nhất.';

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    return res.redirect('/?status=success#lien-he');
  } catch (error) {
    console.error('[Lead Controller Error]', error.message);

    const isDbError = error.name === 'MongooseServerSelectionError' ||
                      error.name === 'MongoNetworkError' ||
                      error.name === 'MongoTimeoutError' ||
                      error.message?.includes('buffering timed out');

    const friendlyMsg = isDbError
      ? 'Hệ thống đang bảo trì kết nối dữ liệu. Quý khách vui lòng gọi trực tiếp hotline để được hỗ trợ tức thì.'
      : (error.message || 'Đã có lỗi xảy ra khi gửi thông tin.');

    const statusCode = isDbError ? 503 : 400;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(statusCode).json({
        success: false,
        message: friendlyMsg,
      });
    }

    return res.redirect(`/?status=error&msg=${encodeURIComponent(friendlyMsg)}#lien-he`);
  }
};

module.exports = {
  submitLead,
};
