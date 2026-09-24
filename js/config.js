// Konfigurasi Utama Link Manager Visiyosindo
const CONFIG = {
  // Domain utama yang ditampilkan pada dashboard dan tautan
  domain: "visiyosindo.id",

  // Mode Penyimpanan Data:
  // - "supabase" : Menggunakan cloud Supabase (Link otomatis aktif global untuk semua pengunjung di seluruh dunia)
  // - "local"    : Menggunakan browser LocalStorage
  storageMode: "supabase",

  // Konfigurasi cloud Supabase
  supabase: {
    url: "https://ymvstkhajozkkqfslhqv.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdnN0a2hham96a2txZnNsaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzA5NzksImV4cCI6MjEwNTgwNjk3OX0.f6ckoIhF6lbnkEEitGwkjC3eN0qGmM89Oi9D2RuVsB4",
    tableName: "links"
  },

  // Konfigurasi redirect
  redirect: {
    autoRedirectDelayMs: 150, // pengalihan cepat
    defaultFallbackUrl: "https://visiyosindo.id"
  }
};