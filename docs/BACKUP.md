# Panduan Backup & Restore

## Status jujur
Workflow backup **sudah ditulis tetapi belum dijalankan/diuji**. Jangan mengklaim
backup otomatis berjalan sebelum workflow di GitHub Actions berstatus success.

Database dan foto dicadangkan **terpisah**:

| Workflow | Isi | Jadwal | Retensi |
|---|---|---|---|
| `backup.yml` | `pg_dump` seluruh tabel | harian 09:00 WIB | 30 hari |
| `backup-storage.yml` | semua file bucket `product-images` | harian 09:30 WIB | 30 hari |

## GitHub Secrets yang harus diisi
**Settings → Secrets and variables → Actions → New repository secret**

- `SUPABASE_DB_URL` — connection string PostgreSQL Supabase (mengandung password)
- `SUPABASE_URL` — `https://arbtqypxaiqhdlnkkhma.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — service role key Supabase

Jangan pernah menaruh ketiganya di file repo atau di frontend.

## Cara uji manual
1. Buka tab **Actions** di GitHub.
2. Pilih workflow → **Run workflow**.
3. Cek harus berstatus hijau, lalu buka artifact yang dihasilkan.
4. Baru setelah itu aktifkan jadwal otomatis.

## Restore database
```bash
# Dari artifact yang sudah diunduh
psql "$SUPABASE_DB_URL" < database-2026-11-24.sql
```

## Restore foto
1. Unduh artifact `photos-*.zip`.
2. Ekstrak.
3. Upload lagi ke bucket `product-images` lewat Supabase Dashboard → Storage,
   atau pakai `supabase storage cp` / script upload serupa.

## Catatan paket Free
Supabase Free menyediakan backup bawaan dengan retensi terbatas. Karena itu workflow
`pg_dump` di atas tetap dipakai sebagai cadangan tambahan dengan retensi 30 hari.
