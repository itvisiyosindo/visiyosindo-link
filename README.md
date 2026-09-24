# Visiyosindo Link Manager (HTML, CSS & JS)

Aplikasi pemendek dan pemodifikasi link kustom untuk domain **`visiyosindo.id`** (alternatif mandiri pengganti Bitly).

Dibuat murni menggunakan **HTML, CSS, dan JavaScript**, sehingga tidak memerlukan instalasi Node.js, Python, atau database rumit di laptop Anda.

---

## 🚀 Fitur Utama

1. **Custom Domain Branding**: Format tautan langsung menggunakan domain Anda: `visiyosindo.id/Judulyangakumau`.
2. **Ubah Link Kapan Saja**: Jika link Google Drive, Zoom, Shopee, atau WhatsApp berganti, Anda tinggal klik tombol **Edit** dan ubah URL tujuannya tanpa perlu membuat atau membagikan link baru.
3. **Statistik Pengunjung**: Mencatat berapa kali link tersebut telah diklik secara real-time.
4. **QR Code Otomatis**: Setiap link memiliki tombol QR code yang bisa langsung diunduh dalam bentuk gambar PNG siap cetak.
5. **Salin Cepat (1-Click Copy)**: Salin link ke clipboard dengan sekali tekan.
6. **Cadangan Data (Backup JSON)**: Fitur ekspor data agar semua daftar link Anda aman.

---

## 📂 Struktur File

```text
visiyosindo-links/
├── index.html        # Dashboard Admin (Kelola, Tambah, Edit, Hapus link & QR Code)
├── redirect.html     # Mesin pengalihan link ke URL asli
├── 404.html          # Fallback pengalihan untuk hosting statis (Vercel / Netlify / Cloudflare Pages)
├── .htaccess         # Konfigurasi rewrite otomatis untuk hosting cPanel / Apache
├── css/
│   └── style.css     # Tampilan modern, bersih, dan responsif (HP & Laptop)
├── js/
│   ├── config.js     # Pengaturan domain dan mode penyimpanan
│   ├── storage.js    # Modul database (LocalStorage / Supabase / PHP)
│   └── app.js        # Logika dashboard, modal, dan event
├── api/
│   └── index.php     # API ringan jika di-upload ke cPanel / hosting biasa
└── README.md
```

---

## 💻 1. Cara Coba Langsung di Laptop (Offline / Lokal)

1. Buka folder `visiyosindo-links`.
2. Klik ganda (double-click) file **`index.html`** untuk membukanya di browser (Chrome, Edge, dll).
3. Anda akan langsung melihat Dashboard Admin.
4. Coba klik tombol **"Buat Link Baru"**:
   - Slug: `promo-spesial`
   - URL Tujuan: `https://google.com` (atau link apa pun)
5. Klik ikon **"Tes Buka Link"** untuk menguji sistem pengalihannya!

---

## 🌐 2. Cara Pasang di Domain `visiyosindo.id`

Pilih salah satu cara di bawah sesuai jenis hosting Anda:

### Opsi A: Jika Menggunakan Hosting Biasa / cPanel (Niagahoster, Hostinger, DomaiNesia, dll)
1. Buka **cPanel** > masuk ke **File Manager**.
2. Masuk ke folder `public_html` (atau folder subdomain Anda, misal `go.visiyosindo.id`).
3. Upload seluruh isi folder `visiyosindo-links` ini ke dalam folder tersebut.
4. Di file `js/config.js`, ubah:
   ```javascript
   storageMode: "php"
   ```
5. Selesai! Kini ketika pengunjung membuka `https://visiyosindo.id/katalog`, mereka akan langsung dialihkan ke URL tujuan.

---

### Opsi B: Jika Menggunakan Cloudflare Pages / Vercel / Netlify (100% Gratis & Sangat Cepat)
1. Hubungkan repo atau drag-and-drop folder ini ke Cloudflare Pages atau Vercel.
2. Pasang Custom Domain `visiyosindo.id`.
3. Agar data tersimpan online di cloud (bukan cuma di laptop):
   - Buat akun gratis di [Supabase.com](https://supabase.com).
   - Buat tabel bernama `links` dengan kolom: `id (text)`, `title (text)`, `slug (text)`, `target_url (text)`, `clicks (int4)`.
   - Buka file `js/config.js` dan isi:
     ```javascript
     storageMode: "supabase",
     supabase: {
       url: "https://PROJEK_ANDA.supabase.co",
       anonKey: "KEY_PUBLIC_ANDA",
       tableName: "links"
     }
     ```
4. Tambahkan script Supabase di bagian `<head>` pada `index.html` & `redirect.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

---

## 🔒 Tips Keamanan
- Untuk melindungi halaman admin (`index.html`) agar tidak dibuka oleh publik sembarangan, Anda bisa mengaktifkan fitur **"Directory Privacy" / "Password Protect Directories"** di cPanel Anda, atau mengganti nama `index.html` menjadi nama unik seperti `admin-visiyosindo.html`.
