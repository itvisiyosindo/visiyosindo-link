// Konfigurasi Utama Link Manager Visiyosindo
const CONFIG = {
  // Domain utama yang ditampilkan pada dashboard dan tautan
  domain: "visiyosindo.id",

  // Mode Penyimpanan Data:
  // - "php"      : Menggunakan endpoint PHP & links.json di hosting cPanel (Rekomendasi untuk hosting Anda)
  // - "local"    : Menggunakan browser LocalStorage (offline)
  // - "supabase" : Menggunakan cloud Supabase
  storageMode: "php",

  // Konfigurasi jika menggunakan mode "supabase" (Opsional, buat di https://supabase.com)
  supabase: {
    url: "https://YOUR_SUPABASE_PROJECT.supabase.co",
    anonKey: "YOUR_SUPABASE_ANON_KEY",
    tableName: "links"
  },

  // Konfigurasi redirect
  redirect: {
    autoRedirectDelayMs: 600, // delay animasi pengalihan dalam milidetik (0 untuk instan)
    defaultFallbackUrl: "https://visiyosindo.id" // URL jika slug tidak ditemukan
  }
};
