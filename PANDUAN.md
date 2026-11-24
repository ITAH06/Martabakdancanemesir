# Panduan Project — Martabak & Cane Mesir

## Struktur folder

```
Default Project/
├── index.html              Website pembeli (desain asli dipertahankan)
├── assets/                 Foto hasil ekstraksi dari base64 (hero, martabak, cane)
├── css/cart.css            Gaya keranjang
├── js/
│   ├── config.js           URL Supabase + publishable key + flag katalog
│   ├── supabase-client.js  Inisialisasi client + helper session/role
│   ├── catalog.js          Ambil produk dari Supabase → kartu dengan class lama
│   └── cart.js             Keranjang, qty, hapus, checkout WA + RPC harga
├── admin/
│   ├── login.html / login.js       Login, logout, lupa password
│   ├── dashboard.html / dashboard.js  CRUD produk + upload foto
│   └── admin.css                   Tema cokelat/krem/emas yang sama
├── supabase/
│   ├── migrations/0001_schema_rls.sql
│   ├── migrations/0002_storage.sql
│   └── seed.sql
├── docs/SETUP.md           Cara pasang migrasi & role admin
├── docs/BACKUP.md          Cara backup/restore (belum diuji)
├── .github/workflows/      Backup database & foto terpisah
└── scripts/backup-storage.mjs
```

## Alur kerja

- Branch aktif untuk pengerjaan: **`development`**.
- `main` tidak disentuh sampai ada persetujuan commit/push.
- Website produksi di Vercel belum berubah selama pengerjaan ini.

## Fitur pembeli

- Katalog fallback memakai HTML lama sampai `CATALOG_FROM_DB = true`.
- Saat aktif, produk diambil dari tabel `products` yang `is_available = true`.
- Tombol **Pesan ↗** tetap membuka WhatsApp `6289652518067`.
- Keranjang: tambah, kurang, hapus, tersimpan di `localStorage`.
- Checkout: harga divalidasi ulang lewat RPC `get_checkout_summary`
  sebelum pesan WhatsApp disusun.

## Fitur admin

- Login email/password via Supabase Auth, lalu dicek role `admin` dari database.
- Tanpa session → redirect ke login. Bukan admin → logout + redirect.
- Tambah/edit/hapus produk, atur kategori, harga, stok, status, dan foto.
- Foto diupload ke bucket `product-images` (maks 5 MB, JPG/PNG/WebP).

## Keamanan

- RLS aktif di `products` dan `user_roles`.
- Pembeli hanya bisa `SELECT` produk aktif.
- Semua tulis produk & storage hanya untuk `is_admin()`.
- `service_role` tidak pernah dipakai di frontend.
- Role admin hanya bisa diberikan lewat SQL Editor.

## Catatan

- Setup awal: ikuti `docs/SETUP.md`.
- Backup: ikuti `docs/BACKUP.md` (workflow belum dijalankan).
- Belum ada commit/push/deploy tanpa persetujuan.
