-- Data awal sesuai katalog lama. Aman dijalankan berulang.
insert into public.products (name, description, price, category, image_url, stock, is_available)
select 'Martabak', 'Martabak lezat untuk menemani waktu makan dan santaimu.', 18000, 'Makanan', '/assets/martabak.png', 100, true
where not exists (select 1 from public.products where name = 'Martabak');

insert into public.products (name, description, price, category, image_url, stock, is_available)
select 'Cane Mesir', 'Cane Mesir yang nikmat, cocok untuk camilan kapan saja.', 10000, 'Camilan', '/assets/cane-mesir.png', 100, true
where not exists (select 1 from public.products where name = 'Cane Mesir');
