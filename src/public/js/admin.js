/**
 * ADMIN CMS JAVASCRIPT
 * Handles mobile sidebar, modals, delete confirmations, unsaved form warnings,
 * link testers, and media picker modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCsrfAutoAttach();
  initMobileSidebar();
  initUnsavedChangesWarning();
  initDeleteModal();
  initLinkTester();
  initMediaPicker();
});

/* 0. CSRF Auto-Attacher */
function initCsrfAutoAttach() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) return;
  const token = meta.getAttribute('content');
  if (!token) return;

  document.querySelectorAll('form').forEach(form => {
    if (!form.querySelector('input[name="_csrf"]')) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      input.value = token;
      form.appendChild(input);
    }
  });
}

/* 1. Mobile Sidebar Drawer */
function initMobileSidebar() {
  const toggleBtn = document.querySelector('.sidebar-toggle-btn');
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.querySelector('.sidebar-backdrop');

  if (!toggleBtn || !sidebar) return;

  function toggle() {
    sidebar.classList.toggle('is-open');
    if (overlay) overlay.classList.toggle('is-open');
  }

  toggleBtn.addEventListener('click', toggle);
  if (overlay) overlay.addEventListener('click', toggle);
}

/* 2. Unsaved Form Changes Warning */
function initUnsavedChangesWarning() {
  const trackedForms = document.querySelectorAll('form[data-track-changes="true"]');
  if (trackedForms.length === 0) return;

  let isDirty = false;
  let isSubmitting = false;

  trackedForms.forEach(form => {
    form.addEventListener('input', () => { isDirty = true; });
    form.addEventListener('change', () => { isDirty = true; });
    form.addEventListener('submit', () => { isSubmitting = true; });
  });

  window.addEventListener('beforeunload', (e) => {
    if (isDirty && !isSubmitting) {
      e.preventDefault();
      e.returnValue = 'Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi?';
      return e.returnValue;
    }
  });
}

/* 3. Delete Confirmation Modal */
function initDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  if (!modal) return;

  const form = modal.querySelector('#deleteConfirmForm');
  const itemNameEl = modal.querySelector('#deleteItemName');
  const itemTypeEl = modal.querySelector('#deleteItemType');
  const closeBtns = modal.querySelectorAll('[data-close-modal]');

  function closeModal() {
    modal.classList.remove('is-open');
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.querySelectorAll('.btn-delete-confirm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      const name = btn.getAttribute('data-item-name') || 'mục này';
      const type = btn.getAttribute('data-item-type') || 'dữ liệu';

      if (form) form.action = action;
      if (itemNameEl) itemNameEl.textContent = `"${name}"`;
      if (itemTypeEl) itemTypeEl.textContent = type;

      modal.classList.add('is-open');
    });
  });
}

/* 4. Link Tester Button */
function initLinkTester() {
  document.querySelectorAll('.btn-test-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetInputId = btn.getAttribute('data-target-input');
      const input = document.querySelector(targetInputId);
      if (!input) return;

      const url = input.value.trim();
      if (!url) {
        alert('Vui lòng nhập đường dẫn trước khi kiểm tra.');
        input.focus();
        return;
      }

      if (url.startsWith('#')) {
        alert(`Liên kết cuộn nội bộ trang: ${url}`);
        return;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (url.startsWith('tel:') || url.startsWith('mailto:')) {
        window.location.href = url;
      } else if (url.startsWith('/')) {
        window.open(window.location.origin + url, '_blank');
      } else {
        alert('Đường dẫn không hợp lệ. Vui lòng bắt đầu bằng https://, http://, #, tel: hoặc mailto:');
        input.focus();
      }
    });
  });
}

/* 5. Media Picker Modal */
function initMediaPicker() {
  const modal = document.getElementById('mediaPickerModal');
  if (!modal) return;

  let activeTargetInput = null;
  let activeTargetPreview = null;

  const container = modal.querySelector('#mediaPickerGrid');
  const closeBtns = modal.querySelectorAll('[data-close-modal]');
  const uploadForm = modal.querySelector('#mediaPickerUploadForm');

  function closeModal() {
    modal.classList.remove('is-open');
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  async function loadMediaItems() {
    if (!container) return;
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748B;">Đang tải danh sách ảnh...</div>';

    try {
      const res = await fetch('/admin/media?format=json');
      const data = await res.json();

      if (data.success && data.media && data.media.length > 0) {
        container.innerHTML = '';
        data.media.forEach(item => {
          const card = document.createElement('div');
          card.className = 'media-card';
          card.style.cursor = 'pointer';
          card.innerHTML = `
            <div class="media-thumb">
              <img src="${item.url}" alt="${item.altText || item.originalName}" loading="lazy">
            </div>
            <div class="media-info">
              <div class="media-name" title="${item.originalName}">${item.originalName}</div>
              <div class="media-size">${(item.size / 1024).toFixed(0)} KB</div>
            </div>
          `;

          card.addEventListener('click', () => {
            if (activeTargetInput) {
              activeTargetInput.value = item.url;
              activeTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
              activeTargetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (activeTargetPreview) {
              activeTargetPreview.src = item.url;
              activeTargetPreview.style.display = 'block';
            }
            closeModal();
          });

          container.appendChild(card);
        });
      } else {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748B;">Thư viện chưa có hình ảnh nào. Bạn có thể tải lên ngay phía trên.</div>';
      }
    } catch (err) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #EF4444;">Không thể tải danh sách hình ảnh.</div>';
    }
  }

  // Open modal trigger
  document.querySelectorAll('.btn-open-media-picker').forEach(btn => {
    btn.addEventListener('click', () => {
      const inputSelector = btn.getAttribute('data-target-input');
      const previewSelector = btn.getAttribute('data-target-preview');

      activeTargetInput = document.querySelector(inputSelector);
      activeTargetPreview = document.querySelector(previewSelector);

      modal.classList.add('is-open');
      loadMediaItems();
    });
  });

  // Fast upload inside modal
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = uploadForm.querySelector('input[type="file"]');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Vui lòng chọn tệp ảnh để tải lên.');
        return;
      }

      const formData = new FormData(uploadForm);
      const submitBtn = uploadForm.querySelector('button[type="submit"]');
      const origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang tải lên...';

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      if (csrfToken && !formData.has('_csrf')) {
        formData.append('_csrf', csrfToken);
      }

      try {
        const res = await fetch('/admin/media/upload', {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: formData,
        });
        const result = await res.json();
        if (result.success && result.media) {
          uploadForm.reset();
          loadMediaItems();
        } else {
          alert(result.message || 'Lỗi khi tải ảnh lên.');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ khi tải ảnh.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    });
  }
}

