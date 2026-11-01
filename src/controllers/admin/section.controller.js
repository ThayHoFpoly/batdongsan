const mongoose = require('mongoose');
const HomeSection = require('../../models/HomeSection');
const { SUPPORTED_SECTION_TYPES } = require('../../models/HomeSection');
const sectionService = require('../../services/section.service');
const { isSafeUrl } = require('../../utils/urlValidator');

// Helper validate CTA link protocol
const isValidLink = (url) => {
  if (!url || url.trim() === '') return true;
  return isSafeUrl(url);
};

const getSectionsList = async (req, res, next) => {
  try {
    const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 }).lean();

    res.render('admin/sections/index', {
      title: 'Quản lý Section Trang Chủ',
      activeNav: 'sections',
      sections,
      supportedTypes: SUPPORTED_SECTION_TYPES,
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (error) {
    next(error);
  }
};

const postToggleSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID section không hợp lệ.' });
    }

    const section = await HomeSection.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy section.' });
    }

    section.enabled = !section.enabled;
    await section.save();
    sectionService.clearSectionsCache();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, enabled: section.enabled });
    }

    return res.redirect('/admin/sections?success=' + encodeURIComponent(`Đã ${section.enabled ? 'bật' : 'tắt'} hiển thị section.`));
  } catch (error) {
    next(error);
  }
};

const postMoveSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 });
    const index = sections.findIndex(s => s._id.toString() === id);

    if (index === -1) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('Không tìm thấy section.'));
    }

    if (direction === 'up' && index > 0) {
      const prev = sections[index - 1];
      const current = sections[index];
      const tempOrder = prev.order;
      prev.order = current.order === prev.order ? current.order + 1 : current.order;
      current.order = tempOrder;
      await Promise.all([prev.save(), current.save()]);
    } else if (direction === 'down' && index < sections.length - 1) {
      const nextSec = sections[index + 1];
      const current = sections[index];
      const tempOrder = nextSec.order;
      nextSec.order = current.order === nextSec.order ? current.order - 1 : current.order;
      current.order = tempOrder;
      await Promise.all([nextSec.save(), current.save()]);
    }

    sectionService.clearSectionsCache();
    return res.redirect('/admin/sections?success=' + encodeURIComponent('Đã cập nhật thứ tự section thành công!'));
  } catch (error) {
    next(error);
  }
};

const getEditSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const section = await HomeSection.findById(id);
    if (!section) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('Không tìm thấy section.'));
    }

    res.render('admin/sections/edit', {
      title: `Chỉnh sửa Section: ${section.title}`,
      activeNav: 'sections',
      section,
      supportedTypes: SUPPORTED_SECTION_TYPES,
      successMsg: req.query.success ? 'Đã lưu thay đổi section thành công!' : null,
      errorMsg: null,
    });
  } catch (error) {
    next(error);
  }
};

const postEditSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('ID không hợp lệ.'));
    }

    const section = await HomeSection.findById(id);
    if (!section) {
      return res.redirect('/admin/sections?error=' + encodeURIComponent('Không tìm thấy section.'));
    }

    const { title, subtitle, enabled } = req.body;
    if (!title || title.trim().length === 0) {
      return res.render('admin/sections/edit', {
        title: `Chỉnh sửa Section: ${section.title}`,
        activeNav: 'sections',
        section,
        supportedTypes: SUPPORTED_SECTION_TYPES,
        errorMsg: 'Tiêu đề section là bắt buộc.',
        successMsg: null,
      });
    }

    section.title = title.trim();
    section.subtitle = (subtitle || '').trim();
    section.enabled = enabled === 'on' || enabled === true || enabled === 'true';

    // Parse and validate type-specific content
    switch (section.type) {
      case 'hero': {
        const { headline, subheadline, ctaText, ctaLink, secondaryBtnText, secondaryBtnLink, backgroundImage } = req.body;
        if (!headline || !backgroundImage) {
          throw new Error('Hero section yêu cầu tiêu đề chính (headline) và ảnh nền.');
        }
        if (!isValidLink(ctaLink) || !isValidLink(secondaryBtnLink)) {
          throw new Error('Đường dẫn CTA phải bắt đầu bằng #, /, http://, https://, tel: hoặc mailto:');
        }
        section.heroContent = {
          headline: headline.trim(),
          subheadline: (subheadline || '').trim(),
          ctaText: (ctaText || '').trim(),
          ctaLink: (ctaLink || '').trim(),
          secondaryBtnText: (secondaryBtnText || '').trim(),
          secondaryBtnLink: (secondaryBtnLink || '').trim(),
          backgroundImage: backgroundImage.trim(),
        };
        break;
      }
      case 'overview': {
        const { description, masterPlanImage, statLabels, statValues, statSubtexts } = req.body;
        if (!description) throw new Error('Vui lòng nhập mô tả tổng quan.');
        const stats = [];
        if (statLabels) {
          const l = Array.isArray(statLabels) ? statLabels : [statLabels];
          const v = Array.isArray(statValues) ? statValues : [statValues];
          const s = Array.isArray(statSubtexts) ? statSubtexts : [statSubtexts];
          for (let i = 0; i < l.length; i++) {
            if (l[i] && v[i]) {
              stats.push({ label: l[i].trim(), value: v[i].trim(), subtext: (s[i] || '').trim() });
            }
          }
        }
        section.overviewContent = {
          description: description.trim(),
          masterPlanImage: (masterPlanImage || '').trim(),
          stats,
        };
        break;
      }
      case 'location': {
        const { description, address, mapEmbedUrl, mapImageUrl, destTitles, destMinutes, destDistances, destNotes } = req.body;
        if (!description) throw new Error('Vui lòng nhập mô tả vị trí.');
        const highlights = [];
        if (destTitles) {
          const dt = Array.isArray(destTitles) ? destTitles : [destTitles];
          const dm = Array.isArray(destMinutes) ? destMinutes : [destMinutes];
          const dd = Array.isArray(destDistances) ? destDistances : [destDistances];
          const dn = Array.isArray(destNotes) ? destNotes : [destNotes];
          for (let i = 0; i < dt.length; i++) {
            if (dt[i] && dm[i]) {
              highlights.push({
                destination: dt[i].trim(),
                minutes: dm[i].trim(),
                distanceKm: (dd[i] || '').trim(),
                note: (dn[i] || '').trim(),
              });
            }
          }
        }
        section.locationContent = {
          description: description.trim(),
          address: (address || '').trim(),
          mapEmbedUrl: (mapEmbedUrl || '').trim(),
          mapImageUrl: (mapImageUrl || '').trim(),
          highlights,
        };
        break;
      }
      case 'amenities': {
        const { description, amenityTitles, amenityDescs, amenityImages, amenityCategories } = req.body;
        const items = [];
        if (amenityTitles) {
          const at = Array.isArray(amenityTitles) ? amenityTitles : [amenityTitles];
          const ad = Array.isArray(amenityDescs) ? amenityDescs : [amenityDescs];
          const ai = Array.isArray(amenityImages) ? amenityImages : [amenityImages];
          const ac = Array.isArray(amenityCategories) ? amenityCategories : [amenityCategories];
          for (let i = 0; i < at.length; i++) {
            if (at[i] && ad[i]) {
              items.push({
                title: at[i].trim(),
                description: ad[i].trim(),
                imageUrl: (ai[i] || '').trim(),
                category: (ac[i] || 'Tiện ích').trim(),
              });
            }
          }
        }
        section.amenitiesContent = {
          description: (description || '').trim(),
          items,
        };
        break;
      }
      case 'floorPlans': {
        const { description, planNames, planCodes, planBeds, planBaths, planAreas, planImages, planDescriptions, planFeatures } = req.body;
        const items = [];
        if (planNames) {
          const pn = Array.isArray(planNames) ? planNames : [planNames];
          const pc = Array.isArray(planCodes) ? planCodes : [planCodes];
          const pbd = Array.isArray(planBeds) ? planBeds : [planBeds];
          const pba = Array.isArray(planBaths) ? planBaths : [planBaths];
          const pa = Array.isArray(planAreas) ? planAreas : [planAreas];
          const pi = Array.isArray(planImages) ? planImages : [planImages];
          const pd = Array.isArray(planDescriptions) ? planDescriptions : [planDescriptions];
          const pf = Array.isArray(planFeatures) ? planFeatures : [planFeatures];
          for (let i = 0; i < pn.length; i++) {
            if (pn[i] && pi[i]) {
              const features = (pf[i] || '').split('\n').map(f => f.trim()).filter(Boolean);
              items.push({
                name: pn[i].trim(),
                code: (pc[i] || '').trim(),
                bedrooms: (pbd[i] || '1 PN').trim(),
                bathrooms: (pba[i] || '1 WC').trim(),
                area: (pa[i] || '50 m²').trim(),
                imageUrl: pi[i].trim(),
                description: (pd[i] || '').trim(),
                features,
              });
            }
          }
        }
        section.floorPlansContent = {
          description: (description || '').trim(),
          items,
        };
        break;
      }
      case 'gallery': {
        const { description, galleryTitles, galleryImages, galleryCategories } = req.body;
        const items = [];
        if (galleryTitles) {
          const gt = Array.isArray(galleryTitles) ? galleryTitles : [galleryTitles];
          const gi = Array.isArray(galleryImages) ? galleryImages : [galleryImages];
          const gc = Array.isArray(galleryCategories) ? galleryCategories : [galleryCategories];
          for (let i = 0; i < gt.length; i++) {
            if (gt[i] && gi[i]) {
              items.push({
                title: gt[i].trim(),
                imageUrl: gi[i].trim(),
                category: (gc[i] || 'Kiến trúc').trim(),
              });
            }
          }
        }
        section.galleryContent = {
          description: (description || '').trim(),
          items,
        };
        break;
      }
      case 'news': {
        const { description, displayCount } = req.body;
        section.newsContent = {
          description: (description || '').trim(),
          displayCount: Math.min(24, Math.max(1, parseInt(displayCount, 10) || 6)),
        };
        break;
      }
      case 'contact': {
        const { description, note } = req.body;
        section.contactContent = {
          description: (description || '').trim(),
          note: (note || '').trim(),
        };
        break;
      }
    }

    await section.save();
    sectionService.clearSectionsCache();

    return res.redirect(`/admin/sections/${section._id}/edit?success=1`);
  } catch (error) {
    return res.render('admin/sections/edit', {
      title: 'Chỉnh sửa Section',
      activeNav: 'sections',
      section: req.body,
      supportedTypes: SUPPORTED_SECTION_TYPES,
      errorMsg: error.message || 'Lỗi khi cập nhật section.',
      successMsg: null,
    });
  }
};

module.exports = {
  getSectionsList,
  postToggleSection,
  postMoveSection,
  getEditSection,
  postEditSection,
};

