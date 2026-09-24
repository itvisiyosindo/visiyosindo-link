// Logika Interaktif Dashboard Admin Visiyosindo Link Manager
document.addEventListener("DOMContentLoaded", () => {
  // Elemen DOM
  const linksTableBody = document.getElementById("links-table-body");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  
  // Stat counters
  const totalLinksCount = document.getElementById("total-links-count");
  const totalClicksCount = document.getElementById("total-clicks-count");
  const topLinkSlug = document.getElementById("top-link-slug");

  // Domain labels in UI
  const domainBadges = document.querySelectorAll(".current-domain-text");
  domainBadges.forEach(el => el.textContent = CONFIG.domain);

  // Modal Buat / Edit Link
  const linkModal = document.getElementById("link-modal");
  const linkForm = document.getElementById("link-form");
  const modalTitle = document.getElementById("modal-title");
  const linkIdInput = document.getElementById("link-id");
  const linkTitleInput = document.getElementById("link-title");
  const linkSlugInput = document.getElementById("link-slug");
  const linkUrlInput = document.getElementById("link-url");
  const btnCreateLink = document.getElementById("btn-create-link");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelModal = document.getElementById("btn-cancel-modal");

  // Modal QR Code
  const qrModal = document.getElementById("qr-modal");
  const qrContainer = document.getElementById("qrcode-container");
  const qrLinkText = document.getElementById("qr-link-text");
  const btnDownloadQr = document.getElementById("btn-download-qr");
  const btnCloseQrModal = document.getElementById("btn-close-qr-modal");

  // Modal Konfirmasi Hapus
  const deleteModal = document.getElementById("delete-modal");
  const deleteSlugText = document.getElementById("delete-slug-text");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");

  // Toast
  const toast = document.getElementById("toast");

  let currentDeletingId = null;
  let allLinksCache = [];

  // Tampilkan Toast
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }

  // Muat dan Render Daftar Link
  async function loadLinks() {
    try {
      allLinksCache = await Storage.getAllLinks();
      renderStats(allLinksCache);
      renderTable(filterLinks(allLinksCache, searchInput.value));
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat link: " + err.message, "error");
    }
  }

  // Render Statistik
  function renderStats(links) {
    const total = links.length;
    const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    
    totalLinksCount.textContent = total;
    totalClicksCount.textContent = totalClicks.toLocaleString("id-ID");

    if (total > 0) {
      const top = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
      topLinkSlug.textContent = `/${top.slug} (${top.clicks || 0}x)`;
    } else {
      topLinkSlug.textContent = "-";
    }
  }

  // Filter Link dari Search
  function filterLinks(links, query) {
    if (!query) return links;
    const q = query.toLowerCase().trim();
    return links.filter(l => 
      l.slug.toLowerCase().includes(q) ||
      (l.title && l.title.toLowerCase().includes(q)) ||
      l.targetUrl.toLowerCase().includes(q)
    );
  }

  // Render Baris Tabel
  function renderTable(links) {
    linksTableBody.innerHTML = "";

    if (links.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    links.forEach(link => {
      const tr = document.createElement("tr");

      const fullShortUrl = `https://${CONFIG.domain}/${link.slug}`;
      // URL redirect aktual yang bisa dicoba langsung di lokal browser
      const localTestUrl = `redirect.html?go=${encodeURIComponent(link.slug)}`;

      tr.innerHTML = `
        <td>
          <div class="link-info">
            <span class="link-title">${escapeHtml(link.title || link.slug)}</span>
            <div style="display:flex; align-items:center; gap: 0.5rem; margin-top: 0.2rem;">
              <span class="short-link-badge">/${escapeHtml(link.slug)}</span>
              <button class="btn-icon btn-copy" title="Salin Link" data-url="${fullShortUrl}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <a href="${localTestUrl}" target="_blank" class="btn-icon" title="Tes Buka Link (Local Preview)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          </div>
        </td>
        <td>
          <a href="${escapeHtml(link.targetUrl)}" target="_blank" rel="noopener noreferrer" class="target-url" title="${escapeHtml(link.targetUrl)}">
            ${escapeHtml(link.targetUrl)}
          </a>
        </td>
        <td>
          <span class="clicks-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            ${(link.clicks || 0).toLocaleString("id-ID")}
          </span>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            ${formatDate(link.createdAt)}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-qr" title="Lihat QR Code" data-slug="${escapeHtml(link.slug)}" data-url="${fullShortUrl}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button class="btn-icon btn-edit" title="Edit Link Tujuan" data-id="${link.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon danger btn-delete" title="Hapus Link" data-id="${link.id}" data-slug="${escapeHtml(link.slug)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;

      linksTableBody.appendChild(tr);
    });

    // Pasang Event Listener Tombol Action
    attachActionListeners();
  }

  // Pasang Listener di Tabel
  function attachActionListeners() {
    // Copy
    document.querySelectorAll(".btn-copy").forEach(btn => {
      btn.onclick = () => {
        const url = btn.getAttribute("data-url");
        navigator.clipboard.writeText(url).then(() => {
          showToast(`Tersalin: ${url}`);
        });
      };
    });

    // Edit
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        openEditModal(id);
      };
    });

    // QR Code
    document.querySelectorAll(".btn-qr").forEach(btn => {
      btn.onclick = () => {
        const url = btn.getAttribute("data-url");
        const slug = btn.getAttribute("data-slug");
        openQrModal(url, slug);
      };
    });

    // Delete
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const slug = btn.getAttribute("data-slug");
        openDeleteModal(id, slug);
      };
    });
  }

  // Buka Modal Tambah Link
  function openCreateModal() {
    linkForm.reset();
    linkIdInput.value = "";
    delete linkSlugInput.dataset.manual;
    modalTitle.textContent = "Buat Link Baru";
    linkModal.classList.add("active");
    linkTitleInput.focus();
  }

  // Buka Modal Edit Link
  function openEditModal(id) {
    const link = allLinksCache.find(l => l.id === id);
    if (!link) return;

    linkIdInput.value = link.id;
    linkTitleInput.value = link.title || "";
    linkSlugInput.value = link.slug;
    linkUrlInput.value = link.targetUrl;

    modalTitle.textContent = "Edit Link & Tujuan";
    linkModal.classList.add("active");
    linkUrlInput.focus();
  }

  function closeLinkModal() {
    linkModal.classList.remove("active");
  }

  // Otomatis ubah spasi menjadi tanda strip (-) saat mengetik slug (mendukung huruf besar & kecil)
  linkSlugInput.addEventListener("input", () => {
    linkSlugInput.value = linkSlugInput.value
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "");
  });

  // Otomatis sarankan slug saat mengetik judul (jika slug masih kosong)
  linkTitleInput.addEventListener("input", () => {
    if (!linkIdInput.value && !linkSlugInput.dataset.manual) {
      linkSlugInput.value = linkTitleInput.value
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "");
    }
  });

  linkSlugInput.addEventListener("keydown", () => {
    linkSlugInput.dataset.manual = "true";
  });

  // Handle Submit Form Link (Buat / Edit)
  linkForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = linkIdInput.value;
    const title = linkTitleInput.value.trim();
    const slug = linkSlugInput.value.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    const targetUrl = linkUrlInput.value.trim();

    try {
      if (id) {
        // Mode Edit
        await Storage.updateLink(id, { title, slug, targetUrl });
        showToast("Link berhasil diperbarui!");
      } else {
        // Mode Buat Baru
        await Storage.createLink({ title, slug, targetUrl });
        showToast(`Berhasil dibuat: ${CONFIG.domain}/${slug}`);
      }
      closeLinkModal();
      await loadLinks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Buka Modal QR Code
  function openQrModal(url, slug) {
    qrContainer.innerHTML = "";
    qrLinkText.textContent = url;

    // Generate QR Code menggunakan qrcode.js
    if (typeof QRCode !== "undefined") {
      new QRCode(qrContainer, {
        text: url,
        width: 180,
        height: 180,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}" alt="QR Code" />`;
    }

    btnDownloadQr.onclick = () => {
      const img = qrContainer.querySelector("img");
      const canvas = qrContainer.querySelector("canvas");
      let dataUrl = "";
      if (canvas) {
        dataUrl = canvas.toDataURL("image/png");
      } else if (img) {
        dataUrl = img.src;
      }
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `qrcode-${slug}.png`;
        a.click();
      }
    };

    qrModal.classList.add("active");
  }

  // Buka Modal Konfirmasi Hapus
  function openDeleteModal(id, slug) {
    currentDeletingId = id;
    deleteSlugText.textContent = `/${slug}`;
    deleteModal.classList.add("active");
  }

  btnConfirmDelete.onclick = async () => {
    if (!currentDeletingId) return;
    try {
      await Storage.deleteLink(currentDeletingId);
      showToast("Link berhasil dihapus.");
      deleteModal.classList.remove("active");
      await loadLinks();
    } catch (err) {
      showToast("Gagal menghapus link: " + err.message, "error");
    }
  };

  btnCancelDelete.onclick = () => deleteModal.classList.remove("active");

  // Event Listeners Modal
  btnCreateLink.onclick = openCreateModal;
  btnCloseModal.onclick = closeLinkModal;
  btnCancelModal.onclick = closeLinkModal;
  btnCloseQrModal.onclick = () => qrModal.classList.remove("active");

  // Tutup modal jika klik overlay luar
  window.onclick = (e) => {
    if (e.target === linkModal) closeLinkModal();
    if (e.target === qrModal) qrModal.classList.remove("active");
    if (e.target === deleteModal) deleteModal.classList.remove("active");
  };

  // Search input live filter
  searchInput.oninput = () => {
    renderTable(filterLinks(allLinksCache, searchInput.value));
  };

  // Backup Data Button
  const btnExport = document.getElementById("btn-export");
  if (btnExport) {
    btnExport.onclick = () => Storage.exportData();
  }

  // Helper fungsi format tanggal
  function formatDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  // Helper escape HTML untuk keamanan XSS
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Mulai
  loadLinks();
});
