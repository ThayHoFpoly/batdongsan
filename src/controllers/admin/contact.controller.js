const SalesContact = require('../../models/SalesContact');
const contactService = require('../../services/contact.service');
const { isSafeUrl } = require('../../utils/urlValidator');

const getContact = async (req, res, next) => {
  try {
    let contact = await SalesContact.getMainContact();
    if (!contact) {
      contact = await SalesContact.create({
        fullName: 'Chuyên Viên Tư Vấn Dự Án',
        phone: '0901234567',
      });
    }

    res.render('admin/contact', {
      title: 'Quản lý Thông tin Tư vấn viên',
      activeNav: 'contact',
      contact,
      successMsg: req.query.success ? 'Đã cập nhật thông tin tư vấn viên thành công!' : null,
      errorMsg: null,
    });
  } catch (error) {
    next(error);
  }
};

const postContact = async (req, res, next) => {
  try {
    let contact = await SalesContact.getMainContact();
    if (!contact) {
      contact = new SalesContact();
    }

    const {
      fullName,
      title,
      phone,
      email,
      avatarUrl,
      messengerUrl,
      zaloUrl,
      ctaText,
      isEnabled,
    } = req.body;

    const cleanPhone = (phone || '').replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

    if (!fullName || fullName.trim().length < 2) {
      return res.render('admin/contact', {
        title: 'Quản lý Thông tin Tư vấn viên',
        activeNav: 'contact',
        contact: { ...contact.toObject(), ...req.body },
        errorMsg: 'Họ và tên nhân viên tư vấn phải có ít nhất 2 ký tự.',
        successMsg: null,
      });
    }

    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return res.render('admin/contact', {
        title: 'Quản lý Thông tin Tư vấn viên',
        activeNav: 'contact',
        contact: { ...contact.toObject(), ...req.body },
        errorMsg: 'Số điện thoại không đúng định dạng di động Việt Nam (10 số).',
        successMsg: null,
      });
    }

    if (messengerUrl && !isSafeUrl(messengerUrl)) {
      return res.render('admin/contact', {
        title: 'Quản lý Thông tin Tư vấn viên',
        activeNav: 'contact',
        contact: { ...contact.toObject(), ...req.body },
        errorMsg: 'Đường dẫn Messenger không hợp lệ. Chỉ chấp nhận liên kết https://',
        successMsg: null,
      });
    }

    if (zaloUrl && !isSafeUrl(zaloUrl)) {
      return res.render('admin/contact', {
        title: 'Quản lý Thông tin Tư vấn viên',
        activeNav: 'contact',
        contact: { ...contact.toObject(), ...req.body },
        errorMsg: 'Đường dẫn Zalo không hợp lệ. Chỉ chấp nhận liên kết https://',
        successMsg: null,
      });
    }

    contact.fullName = fullName.trim();
    contact.title = (title || '').trim();
    contact.phone = cleanPhone;
    contact.email = (email || '').trim().toLowerCase();
    contact.avatarUrl = (avatarUrl || '').trim();
    contact.messengerUrl = (messengerUrl || '').trim();
    contact.zaloUrl = (zaloUrl || '').trim();
    contact.ctaText = (ctaText || '').trim() || 'Liên hệ tư vấn';
    contact.isEnabled = isEnabled === 'on' || isEnabled === true || isEnabled === 'true';

    await contact.save();
    contactService.clearContactCache();

    return res.redirect('/admin/contact?success=1');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContact,
  postContact,
};

