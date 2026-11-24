-- ============================================================
-- Grant level tabel. RLS tetap pembatas utama; GRANT ini hanya
-- memberi izin dasar supaya role anon/authenticated bisa lewat
-- ke RLS (tanpa ini, semua request ditolak "permission denied").
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.user_roles to authenticated;

-- Fungsi RPC sudah di-grant di 0001, ini pengaman bila dijalankan ulang.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_checkout_summary(jsonb) to anon, authenticated;
