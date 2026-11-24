# Panduan Project — Martabak & Cane Mesir

## Struktur folder

```
Default Project/
├── index.html      Kode utama + desain asli (cream / brown / gold)
├── css/
│   └── cart.css    Hanya gaya untuk fitur keranjang
├── js/
│   └── cart.js     Logika keranjang, qty, hapus, dan checkout WhatsApp
└── PANDUAN.md      Dokumen ini
```

Gambar produk masih **tersemat (base64)** di dalam `index.html`, sehingga website
tetap bisa dibuka tanpa folder aset tambahan.

## Fitur yang tersedia

- Desain, warna, layout, dan fitur lama **tidak diubah** (header, hero, menu,
  tentang, kontak, footer, tombol "Pesan ↗", WA mengambang).
- Setiap produk memiliki foto, nama, deskripsi, dan harga.
- Tombol **Pesan ↗** tetap membuka WhatsApp dengan pesan otomatis per menu.
- Tombol **+ Keranjang** menambah produk ke keranjang.
- Keranjang bisa **menambah (+)**, **mengurangi (−)**, dan **menghapus** produk.
- Keranjang tersimpan di `localStorage` (tetap ada saat halaman di-refresh).
- **Checkout via WhatsApp** mengirim daftar pesanan + total harga ke
  `089652518067`.
- Tampilan responsif untuk HP dan laptop.

## Cara menambah produk baru

1. Duplikasi blok `<article class="product-card">` di dalam `.products`
   pada `index.html`.
2. Ganti gambar (`src` base64), `<h3>`, `<p>`, `.price`, dan tautan WA-nya.
3. Tombol `+ Keranjang` cukup memakai atribut `data-add`; nama dan harga
   dibaca otomatis oleh `js/cart.js`, jadi tidak perlu mengubah JavaScript.

## Catatan pengembangan

- Semua warna memakai CSS variable yang sudah didefinisikan di `index.html`
  (`--cream`, `--brown`, `--gold`, dan lain-lain).
- Belum ada commit/push ke GitHub. Setelah Git terpasang, hubungkan folder ini
  ke `ITAH06/Martabakdancanemesir` dan periksa dulu daftar perubahan sebelum
  commit pertama.
- Deploy ke Vercel belum dilakukan — fokus ke GitHub terlebih dahulu.
