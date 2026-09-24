// Modul Penyimpanan Data (Storage Adapter)
const Storage = (() => {
  const LOCAL_STORAGE_KEY = "visiyosindo_links_data";

  // Data contoh awal
  const defaultLinks = [
    {
      id: "link-1",
      title: "WhatsApp Customer Service",
      slug: "wa-admin",
      targetUrl: "https://wa.me/6281234567890?text=Halo%20Visiyosindo,%20saya%20tertarik%20dengan%20layanan%20Anda",
      clicks: 42,
      createdAt: "2026-09-23T10:00:00.000Z",
      updatedAt: "2026-09-23T10:00:00.000Z"
    },
    {
      id: "link-2",
      title: "Katalog Produk & Portofolio",
      slug: "katalog",
      targetUrl: "https://drive.google.com/file/d/1example-portfolio-visiyosindo/view",
      clicks: 128,
      createdAt: "2026-09-23T10:00:00.000Z",
      updatedAt: "2026-09-23T10:00:00.000Z"
    }
  ];

  // Inisialisasi data lokal sinkron & aman tanpa race condition
  function initLocalStorage() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultLinks));
      }
    } catch (e) {
      console.warn("LocalStorage tidak dapat diakses:", e);
    }
  }

  // URL API dinamis
  function getApiUrl(params = "") {
    let base = "/api/index.php";
    if (window.location.protocol === "file:") {
      base = "api/index.php";
    } else if (window.location.origin) {
      base = window.location.origin + "/api/index.php";
    }
    return params ? `${base}?${params}` : base;
  }

  // Inisialisasi Supabase client jika konfigurasi tersedia
  function initSupabase() {
    if (typeof supabase !== "undefined" && CONFIG.supabase && CONFIG.supabase.url && CONFIG.supabase.anonKey) {
      if (!CONFIG.supabase.url.includes("YOUR_SUPABASE") && !window.supabaseClient) {
        try {
          window.supabaseClient = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
        } catch (e) {
          console.warn("Gagal inisialisasi Supabase client:", e);
        }
      }
    }
  }
  initSupabase();

  // Mengambil semua link
  async function getAllLinks() {
    initSupabase();

    // 1. Jika mode Supabase aktif
    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data.map(item => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          targetUrl: item.target_url,
          clicks: item.clicks || 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));
      } catch (e) {
        console.warn("Gagal membaca Supabase:", e);
      }
    }

    // 2. Baca dari LocalStorage
    initLocalStorage();
    let localLinks = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localLinks = parsed;
      }
    } catch (e) {}

    // 3. Sinkronkan dengan file server statis (/api/links.json) jika ada link baru dari repo
    try {
      const res = await fetch("/api/links.json?t=" + Date.now());
      if (res.ok) {
        const serverLinks = await res.json();
        if (Array.isArray(serverLinks) && serverLinks.length > 0) {
          const existingSlugs = new Set(localLinks.map(l => (l.slug || "").toLowerCase().trim()));
          let hasNew = false;
          for (const sLink of serverLinks) {
            const sSlug = (sLink.slug || "").toLowerCase().trim();
            if (sSlug && !existingSlugs.has(sSlug)) {
              localLinks.push(sLink);
              hasNew = true;
            }
          }
          if (hasNew) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localLinks));
          }
        }
      }
    } catch (e) {}

    return localLinks.length > 0 ? localLinks : defaultLinks;
  }

  // Mengambil 1 link berdasarkan slug (case-insensitive)
  async function getLinkBySlug(slug) {
    const cleanSlug = (slug || "").toLowerCase().trim();
    const links = await getAllLinks();
    return links.find(l => (l.slug || "").toLowerCase().trim() === cleanSlug) || null;
  }

  // Menyimpan link baru
  async function createLink({ title, slug, targetUrl }) {
    // Mempertahankan huruf besar & kecil
    const cleanSlug = slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    if (!cleanSlug) throw new Error("Slug / Alias tidak boleh kosong!");
    if (!targetUrl) throw new Error("URL Tujuan tidak boleh kosong!");

    // Cek duplikasi slug (case-insensitive)
    const existing = await getLinkBySlug(cleanSlug);
    if (existing) {
      throw new Error(`Slug "/${cleanSlug}" sudah dipakai! Silakan pilih nama lain.`);
    }

    const newLink = {
      id: "link-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      title: title || cleanSlug,
      slug: cleanSlug,
      targetUrl: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Simpan ke Supabase jika aktif
    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        await window.supabaseClient.from(CONFIG.supabase.tableName).insert([{
          id: newLink.id,
          title: newLink.title,
          slug: newLink.slug,
          target_url: newLink.targetUrl,
          clicks: 0
        }]);
      } catch (err) {
        console.warn("Gagal menyimpan ke Supabase:", err);
      }
    }

    // Selalu simpan ke LocalStorage agar langsung aktif
    initLocalStorage();
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      stored.unshift(newLink);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error("Gagal simpan ke localStorage:", e);
    }

    return newLink;
  }

  // Mengubah link yang sudah ada
  async function updateLink(id, { title, slug, targetUrl }) {
    const cleanSlug = slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    const cleanUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

    // Cek duplikasi slug
    const links = await getAllLinks();
    const existingWithSameSlug = links.find(l => (l.slug || "").toLowerCase().trim() === cleanSlug.toLowerCase() && l.id !== id);
    if (existingWithSameSlug) {
      throw new Error(`Slug "/${cleanSlug}" sudah digunakan oleh link lain.`);
    }

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .update({
            title,
            slug: cleanSlug,
            target_url: cleanUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
      } catch (err) {
        console.warn("Gagal update Supabase:", err);
      }
    }

    // Update LocalStorage
    initLocalStorage();
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      const index = stored.findIndex(l => l.id === id);
      if (index !== -1) {
        stored[index] = {
          ...stored[index],
          title: title || cleanSlug,
          slug: cleanSlug,
          targetUrl: cleanUrl,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
        return stored[index];
      }
    } catch (e) {}

    return { id, title, slug: cleanSlug, targetUrl: cleanUrl };
  }

  // Menghapus link
  async function deleteLink(id) {
    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .delete()
          .eq("id", id);
      } catch (err) {
        console.warn("Gagal hapus di Supabase:", err);
      }
    }

    initLocalStorage();
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      const filtered = stored.filter(l => l.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // Menambah counter klik
  async function incrementClicks(slug) {
    const cleanSlug = (slug || "").toLowerCase().trim();
    const links = await getAllLinks();
    const link = links.find(l => (l.slug || "").toLowerCase().trim() === cleanSlug);
    if (!link) return null;

    link.clicks = (link.clicks || 0) + 1;

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      window.supabaseClient
        .from(CONFIG.supabase.tableName)
        .update({ clicks: link.clicks })
        .eq("id", link.id)
        .then();
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
    }

    return link;
  }

  // Ekspor / Impor JSON cadangan
  function exportData() {
    initLocalStorage();
    const data = localStorage.getItem(LOCAL_STORAGE_KEY) || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visiyosindo-links-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa daftar array.");
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      return true;
    } catch (e) {
      throw new Error("File JSON tidak valid: " + e.message);
    }
  }

  return {
    getAllLinks,
    getLinkBySlug,
    createLink,
    updateLink,
    deleteLink,
    incrementClicks,
    exportData,
    importData
  };
})();