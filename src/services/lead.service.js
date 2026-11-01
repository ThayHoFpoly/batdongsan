const Lead = require('../models/Lead');

const createLead = async ({ fullName, phone, interest, note, source, consentGiven, ipAddress }) => {
  // 1. Kiểm tra họ và tên
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    throw new Error('Vui lòng nhập họ và tên của Quý khách (ít nhất 2 ký tự).');
  }
  if (fullName.trim().length > 100) {
    throw new Error('Họ và tên không được dài quá 100 ký tự.');
  }

  // 2. Kiểm tra số điện thoại (10 chữ số di động Việt Nam)
  const cleanPhone = (phone || '').toString().replace(/\s+/g, '');
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    throw new Error('Số điện thoại không đúng định dạng (Vui lòng nhập 10 chữ số di động).');
  }

  // 3. Kiểm tra checkbox đồng ý liên hệ
  const isConsent = consentGiven === true || consentGiven === 'true' || consentGiven === 'on' || consentGiven === '1';
  if (!isConsent) {
    throw new Error('Quý khách vui lòng xác nhận đồng ý nhận tư vấn từ chuyên viên dự án.');
  }

  // 4. Lọc trường cho phép và giới hạn độ dài
  const sanitizedInterest = typeof interest === 'string' ? interest.trim().slice(0, 150) : 'Tư vấn thông tin tổng thể';
  const sanitizedNote = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  const sanitizedSource = typeof source === 'string' ? source.trim().slice(0, 100) : 'landing_page';

  // 5. Lưu vào MongoDB Atlas
  const newLead = await Lead.create({
    fullName: fullName.trim(),
    phone: cleanPhone,
    interest: sanitizedInterest,
    note: sanitizedNote,
    source: sanitizedSource,
    status: 'new',
    consentGiven: true,
    consentAt: new Date(),
    ipAddress: ipAddress ? ipAddress.toString().slice(0, 50) : '',
  });

  return newLead;
};

module.exports = {
  createLead,
};
