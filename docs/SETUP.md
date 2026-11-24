# Panduan Setup Supabase — MARTABAK DAN CANE MESIR

## Status saat ini (sudah dijalankan 24 Nov 2026)

| Item | Nilai / status |
|---|---|
| Project ref | `arbtqypxaiqhdlnkkhma` |
| Project URL | `https://arbtqypxaiqhdlnkkhma.supabase.co` |
| Paket | Free |
| Migrasi 0001 / 0002 / 0003 / seed | ✅ berhasil |
| Produk awal | ✅ 2 (Martabak Rp18.000, Cane Mesir Rp10.000) |
| Akun owner/admin | `siti_n23@mhs.usk.ac.id` (undangan terkirim) |
| Role `admin` | ✅ aktif & terverifikasi di `user_roles` |
| Site URL | `https://martabakdancanemesir.vercel.app` |
| Redirect URL | `https://martabakdancanemesir.vercel.app/admin/login.html` |
| `CATALOG_FROM_DB` | `true` |

## 1. Langkah terakhir untuk bisa login admin

Buka email **siti_n23@mhs.usk.ac.id**, cari email undangan Supabase, lalu klik
link-nya untuk **menetapkan password**. Setelah itu login di:

```
https://martabakdancanemesir.vercel.app/admin/login.html
```

Jika email tidak masuk, di Supabase Dashboard → **Authentication → Users** →
pilih user → **Send password recovery** (redirect sudah dikonfigurasi).

## 2. Daftar migrasi (untuk project baru / referensi)

Jalankan berurutan di **SQL Editor**:

1. `supabase/migrations/0001_schema_rls.sql` — tabel, RLS, `is_admin()`, RPC harga, grant
2. `supabase/migrations/0002_storage.sql` — bucket `product-images` + policy
3. `supabase/migrations/0003_grants.sql` — grant tabel (cadangan bila 0001 lama dipakai)
4. `supabase/seed.sql` — 2 produk lama

## 3. Memberi role admin ke akun lain

Role **tidak bisa** diberikan dari website. Hanya lewat SQL Editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'EMAIL_ANDA@gmail.com'
on conflict (user_id) do update set role = 'admin';
```

## 4. Verifikasi keamanan yang sudah diuji

- `GET /rest/v1/products` dengan publishable key → 2 produk aktif ✅
- `POST /rest/v1/products` sebagai anon → ditolak (401) ✅
- RPC `get_checkout_summary` → harga berasal dari DB, bukan browser ✅
- ID produk palsu / qty ekstrem → hasil kosong ✅
- Dashboard tanpa session → redirect ke login ✅

## 5. Environment variables

- Frontend **tidak butuh** `service_role`; yang dipakai hanya publishable key.
- `service_role` & database password hanya untuk GitHub Actions Secrets
  (lihat `docs/BACKUP.md`), tidak pernah di repo atau frontend.
- Jangan pernah commit keduanya ke repo.
