// Konfigurasi Utama Link Manager Visiyosindo
const CONFIG = {
  // Domain utama yang ditampilkan pada dashboard dan tautan
  domain: "visiyosindo.id",

  // Mode Penyimpanan Data:
  // - "local"    : Menggunakan browser LocalStorage (Cocok untuk GitHub Pages & personal use)
  // - "supabase" : Menggunakan cloud Supabase (Rekomendasi jika link ingin diakses orang lain secara publik)
  // - "php"      : Menggunakan endpoint PHP (khusus hosting cPanel)
  storageMode: "local",

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
