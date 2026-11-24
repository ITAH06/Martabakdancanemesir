import { supabase, getSession, isAdmin } from '../js/supabase-client.js';
import { IMAGE_BUCKET } from '../js/config.js';

const $ = (id) => document.getElementById(id);
const rupiah = (v) => 'Rp' + Number(v).toLocaleString('id-ID');

const pesan = (teks, ok = false) => {
  const el = $('pesan');
  el.textContent = teks;
  el.className = 'pesan' + (ok ? ' ok' : '');
};

let daftarProduk = [];

/* Proteksi: tanpa session atau bukan admin → tendang ke login. */
const session = await getSession();
if (!session) {
  window.location.replace('login.html');
} else if (!(await isAdmin())) {
  await supabase.auth.signOut();
  window.location.replace('login.html');
}

function imageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function tombol(teks, kelas, handler) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn ' + kelas + ' btn-sm';
  b.textContent = teks;
  b.addEventListener('click', handler);
  return b;
}

function renderTabel() {
  const tbody = $('productRows');
  tbody.innerHTML = '';

  $('statTotal').textContent = daftarProduk.length;
  $('statAvailable').textContent = daftarProduk.filter((p) => p.is_available).length;
  $('statOff').textContent = daftarProduk.filter((p) => !p.is_available || p.stock <= 0).length;

  daftarProduk.forEach((p) => {
    const tr = document.createElement('tr');

    const tdFoto = document.createElement('td');
    if (p.image_url) {
      const img = document.createElement('img');
      img.src = imageUrl(p.image_url);
      img.alt = p.name;
      tdFoto.appendChild(img);
    }

    const isi = (teks) => {
      const td = document.createElement('td');
      td.textContent = teks;
      return td;
    };

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + (p.is_available ? 'on' : 'off');
    badge.textContent = p.is_available ? 'Aktif' : 'Nonaktif';
    tdStatus.appendChild(badge);

    const tdAksi = document.createElement('td');
    const aksi = document.createElement('div');
    aksi.className = 'aksi';
    aksi.appendChild(tombol('Edit', 'btn-ghost', () => isiForm(p)));
    aksi.appendChild(tombol(p.is_available ? 'Nonaktifkan' : 'Aktifkan', 'btn-ghost', () => ubahStatus(p)));
    aksi.appendChild(tombol('Hapus', 'btn-danger', () => hapusProduk(p)));
    tdAksi.appendChild(aksi);

    tr.appendChild(tdFoto);
    tr.appendChild(isi(p.name));
    tr.appendChild(isi(p.category || '-'));
    tr.appendChild(isi(rupiah(p.price)));
    tr.appendChild(isi(String(p.stock)));
    tr.appendChild(tdStatus);
    tr.appendChild(tdAksi);
    tbody.appendChild(tr);
  });
}

async function muatProduk() {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) {
    pesan('Gagal memuat produk: ' + error.message);
    return;
  }
  daftarProduk = data || [];
  renderTabel();
}

function isiForm(p) {
  $('productId').value = p.id;
  $('imageUrlHidden').value = p.image_url || '';
  $('nama').value = p.name;
  $('kategori').value = p.category || '';
  $('harga').value = p.price;
  $('stok').value = p.stock;
  $('deskripsi').value = p.description || '';
  $('tersedia').checked = !!p.is_available;
  $('formTitle').textContent = 'Edit produk';
  $('simpanBtn').textContent = 'Update Produk';
  $('batalBtn').hidden = false;
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function resetForm() {
  $('productForm').reset();
  $('productId').value = '';
  $('imageUrlHidden').value = '';
  $('tersedia').checked = true;
  $('formTitle').textContent = 'Tambah produk';
  $('simpanBtn').textContent = 'Simpan Produk';
  $('batalBtn').hidden = true;
  $('foto').value = '';
}

async function hapusProduk(p) {
  if (!window.confirm('Yakin ingin menghapus "' + p.name + '"?')) return;
  const { error } = await supabase.from('products').delete().eq('id', p.id);
  if (error) {
    pesan('Gagal menghapus: ' + error.message);
    return;
  }
  pesan('Produk dihapus.', true);
  await muatProduk();
}

async function ubahStatus(p) {
  const { error } = await supabase
    .from('products')
    .update({ is_available: !p.is_available, updated_at: new Date().toISOString() })
    .eq('id', p.id);
  if (error) {
    pesan('Gagal mengubah status: ' + error.message);
    return;
  }
  await muatProduk();
}

$('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  pesan('Menyimpan...');

  const file = $('foto').files[0];
  let imageUrlValue = $('imageUrlHidden').value;

  if (file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      pesan('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      pesan('Ukuran foto maksimal 5 MB.');
      return;
    }
    const aman = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = Date.now() + '-' + aman;
    const upload = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) {
      pesan('Gagal upload foto: ' + upload.error.message);
      return;
    }
    imageUrlValue = path;
  }

  const payload = {
    name: $('nama').value.trim(),
    description: $('deskripsi').value.trim(),
    price: Number($('harga').value),
    category: $('kategori').value.trim() || 'Umum',
    stock: Number($('stok').value),
    image_url: imageUrlValue,
    is_available: $('tersedia').checked,
    updated_at: new Date().toISOString()
  };
  const id = $('productId').value;
  if (id) payload.id = id;

  const { error } = await supabase.from('products').upsert(payload);
  if (error) {
    pesan('Gagal menyimpan: ' + error.message);
    return;
  }

  pesan(id ? 'Produk diperbarui.' : 'Produk ditambahkan.', true);
  resetForm();
  await muatProduk();
});

$('batalBtn').addEventListener('click', resetForm);

$('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('login.html');
});

if (session) await muatProduk();
