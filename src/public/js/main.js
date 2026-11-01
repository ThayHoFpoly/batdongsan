/**
 * THE HORIZON RIVERSIDE - MAIN JAVASCRIPT
 * Vanilla JS for interactions, mobile menu, lead capture, and article pagination.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initSmoothScroll();
  initLeadForm();
  initArticleLoadMore();
  initMobileKeyboardHandler();
});

/* ==========================================================================
   1. Mobile Drawer Navigation
   ========================================================================== */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');
  const closeBtn = document.querySelector('.mobile-drawer-close');
  const drawerLinks = document.querySelectorAll('.mobile-nav-links a');

  if (!toggleBtn || !drawer || !backdrop) return;

  function openDrawer() {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Return focus to toggle button
    toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    if (isOpen) closeDrawer();
    else openDrawer();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  backdrop.addEventListener('click', closeDrawer);

  // Close when clicking any nav anchor
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}

/* ==========================================================================
   2. Smooth Scrolling for CTA and Anchors
   ========================================================================== */
function initSmoothScroll() {
  const scrollLinks = document.querySelectorAll('a[href^="#"]');

  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Update URL hash without jumping
        history.pushState(null, '', targetId);
      }
    });
  });
}

/* ==========================================================================
   3. Lead Consultation Form Submission (AJAX)
   - Client & server validation
   - Consent checkbox check
   - Anti-double submit debouncing
   ========================================================================== */
function initLeadForm() {
  const form = document.getElementById('consultationForm');
  if (!form) return;

  const alertBox = form.querySelector('.form-alert');
  const submitBtn = form.querySelector('button[type="submit"]');
  let isSubmitting = false;

  function showAlert(message, type = 'success') {
    if (!alertBox) return;
    alertBox.className = `form-alert form-alert-${type} is-visible`;
    alertBox.textContent = message;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent double clicking / concurrent submission
    if (isSubmitting) return;

    // Client-side quick validation
    const fullNameInput = form.querySelector('#fullName');
    const phoneInput = form.querySelector('#phone');
    const consentInput = form.querySelector('#consentGiven');

    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

    if (!fullName || fullName.length < 2) {
      showAlert('Vui lòng nhập họ và tên của Quý khách (ít nhất 2 ký tự).', 'danger');
      if (fullNameInput) fullNameInput.focus();
      return;
    }

    if (!phone || !phoneRegex.test(phone)) {
      showAlert('Số điện thoại không hợp lệ (Vui lòng nhập đúng 10 số di động).', 'danger');
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!consentInput || !consentInput.checked) {
      showAlert('Quý khách vui lòng xác nhận đồng ý nhận tư vấn từ chuyên viên dự án.', 'danger');
      if (consentInput) consentInput.focus();
      return;
    }

    // Enter submitting state
    isSubmitting = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi thông tin...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.consentGiven = consentInput.checked;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    try {
      const response = await fetch('/lien-he', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert(result.message || 'Gửi yêu cầu tư vấn thành công!', 'success');
        form.reset();
      } else {
        showAlert(result.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.', 'danger');
      }
    } catch (err) {
      showAlert('Không thể kết nối máy chủ. Vui lòng thử lại sau hoặc gọi hotline trực tiếp.', 'danger');
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

/* ==========================================================================
   4. Article Load More Pagination
   ========================================================================== */
function initArticleLoadMore() {
  const btn = document.getElementById('btnLoadMoreArticles');
  const container = document.getElementById('articlesGrid');
  if (!btn || !container) return;

  let currentPage = 1;
  const limit = 6;

  btn.addEventListener('click', async () => {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang tải thêm...';

    try {
      currentPage += 1;
      const res = await fetch(`/api/articles?page=${currentPage}&limit=${limit}`);
      const data = await res.json();

      if (data.success && data.articles && data.articles.length > 0) {
        data.articles.forEach(article => {
          const dateStr = new Date(article.publishedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const card = document.createElement('article');
          card.className = 'article-card';
          card.innerHTML = `
            <div class="article-thumbnail">
              <img src="${article.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}" alt="${article.title}" loading="lazy">
            </div>
            <div class="article-card-body">
              <div>
                <div class="article-meta">
                  <span class="article-category">${article.category || 'Tin tức'}</span>
                  <span>&bull;</span>
                  <time datetime="${article.publishedAt}">${dateStr}</time>
                </div>
                <h3 class="article-card-title">
                  <a href="/bai-viet/${article.slug}">${article.title}</a>
                </h3>
                <p class="article-excerpt">${article.excerpt}</p>
              </div>
              <a href="/bai-viet/${article.slug}" class="article-read-more">
                Đọc bài viết &rarr;
              </a>
            </div>
          `;
          container.appendChild(card);
        });

        if (!data.pagination.hasMore) {
          btn.style.display = 'none';
        }
      } else {
        btn.style.display = 'none';
      }
    } catch (e) {
      console.error('Error loading more articles:', e);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

/* ==========================================================================
   5. Mobile Virtual Keyboard & Floating Bar Handler
   Hides sticky contact bar when virtual keyboard is active to prevent obscuring inputs.
   ========================================================================== */
function initMobileKeyboardHandler() {
  const stickyBar = document.querySelector('.mobile-sticky-bar');
  if (!stickyBar) return;

  if (window.visualViewport) {
    const initialHeight = window.innerHeight;

    window.visualViewport.addEventListener('resize', () => {
      const isKeyboardOpen = window.visualViewport.height < initialHeight * 0.75;
      if (isKeyboardOpen) {
        stickyBar.style.display = 'none';
      } else {
        stickyBar.style.display = '';
      }
    });
  }

  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('focus', () => {
      if (window.innerWidth <= 768) {
        stickyBar.style.display = 'none';
      }
    });
    el.addEventListener('blur', () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          stickyBar.style.display = '';
        }, 300);
      }
    });
  });
}

