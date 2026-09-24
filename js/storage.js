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

  // Inisialisasi Supabase client
  function initSupabase() {
    if (typeof supabase !== "undefined" && CONFIG.supabase && CONFIG.supabase.url && CONFIG.supabase.anonKey) {
      if (!window.supabaseClient) {
        try {
          window.supabaseClient = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
        } catch (e) {
          console.warn("Gagal inisialisasi Supabase client:", e);
        }
      }
    }
  }
  initSupabase();

  function initLocalStorage() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultLinks));
      }
    } catch (e) {}
  }

  // Mengambil semua link (Cloud Supabase utama)
  async function getAllLinks() {
    initSupabase();

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Auto-sinkronisasi data lama dari browser lokal jika ada yang belum masuk ke database Supabase
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const localList = JSON.parse(stored);
            if (Array.isArray(localList) && localList.length > 0) {
              const existingSlugs = new Set((data || []).map(d => (d.slug || "").toLowerCase().trim()));
              for (const l of localList) {
                const lSlug = (l.slug || "").toLowerCase().trim();
                if (lSlug && !existingSlugs.has(lSlug)) {
                  await window.supabaseClient.from(CONFIG.supabase.tableName).insert([{
                    id: l.id || "link-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                    title: l.title || l.slug,
                    slug: l.slug,
                    target_url: l.targetUrl || l.target_url,
                    clicks: l.clicks || 0
                  }]);
                  existingSlugs.add(lSlug);
                }
              }
            }
          }
        } catch (syncErr) {}

        const mapped = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          targetUrl: item.target_url,
          clicks: item.clicks || 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        // Simpan salinan di LocalStorage sebagai backup offline
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        } catch (e) {}

        return mapped;
      } catch (e) {
        console.warn("Gagal membaca Supabase, beralih ke cache:", e);
      }
    }

    // Fallback LocalStorage
    initLocalStorage();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return defaultLinks;
  }

  // Mengambil 1 link spesifik berdasarkan slug (Sangat cepat dan case-insensitive)
  async function getLinkBySlug(slug) {
    const cleanSlug = (slug || "").toLowerCase().trim();
    initSupabase();

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .select("*")
          .ilike("slug", cleanSlug)
          .limit(1);

        if (!error && data && data.length > 0) {
          const item = data[0];
          return {
            id: item.id,
            title: item.title,
            slug: item.slug,
            targetUrl: item.target_url,
            clicks: item.clicks || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          };
        }
      } catch (e) {
        console.warn("Gagal query getLinkBySlug di Supabase:", e);
      }
    }

    const links = await getAllLinks();
    return links.find(l => (l.slug || "").toLowerCase().trim() === cleanSlug) || null;
  }

  // Menyimpan link baru ke cloud database Supabase
  async function createLink({ title, slug, targetUrl }) {
    const cleanSlug = slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    if (!cleanSlug) throw new Error("Slug / Alias tidak boleh kosong!");
    if (!targetUrl) throw new Error("URL Tujuan tidak boleh kosong!");

    const cleanUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

    // Cek duplikasi slug
    const existing = await getLinkBySlug(cleanSlug);
    if (existing) {
      throw new Error(`Slug "/${cleanSlug}" sudah dipakai! Silakan pilih nama lain.`);
    }

    const newLink = {
      id: "link-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      title: title || cleanSlug,
      slug: cleanSlug,
      targetUrl: cleanUrl,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      const { error } = await window.supabaseClient.from(CONFIG.supabase.tableName).insert([{
        id: newLink.id,
        title: newLink.title,
        slug: newLink.slug,
        target_url: newLink.targetUrl,
        clicks: 0
      }]);
      if (error) {
        throw new Error("Gagal menyimpan ke cloud: " + error.message);
      }
    }

    // Backup ke LocalStorage
    initLocalStorage();
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      stored.unshift(newLink);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {}

    return newLink;
  }

  // Mengubah link yang sudah ada
  async function updateLink(id, { title, slug, targetUrl }) {
    const cleanSlug = slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    const cleanUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

    const links = await getAllLinks();
    const existingWithSameSlug = links.find(l => (l.slug || "").toLowerCase().trim() === cleanSlug.toLowerCase() && l.id !== id);
    if (existingWithSameSlug) {
      throw new Error(`Slug "/${cleanSlug}" sudah digunakan oleh link lain.`);
    }

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      const { error } = await window.supabaseClient
        .from(CONFIG.supabase.tableName)
        .update({
          title,
          slug: cleanSlug,
          target_url: cleanUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) {
        throw new Error("Gagal update di cloud: " + error.message);
      }
    }

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
      }
    } catch (e) {}

    return { id, title, slug: cleanSlug, targetUrl: cleanUrl };
  }

  // Menghapus link dari database cloud
  async function deleteLink(id) {
    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      const { error } = await window.supabaseClient
        .from(CONFIG.supabase.tableName)
        .delete()
        .eq("id", id);
      if (error) console.warn("Gagal hapus di Supabase:", error);
    }

    initLocalStorage();
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      const filtered = stored.filter(l => l.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // Menambah counter klik di cloud
  async function incrementClicks(slug) {
    const cleanSlug = (slug || "").toLowerCase().trim();
    initSupabase();

    if (CONFIG.storageMode === "supabase" && window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient
          .from(CONFIG.supabase.tableName)
          .select("id, clicks")
          .ilike("slug", cleanSlug)
          .limit(1);

        if (data && data.length > 0) {
          const newClicks = (data[0].clicks || 0) + 1;
          await window.supabaseClient
            .from(CONFIG.supabase.tableName)
            .update({ clicks: newClicks })
            .eq("id", data[0].id);
        }
      } catch (e) {}
    }
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