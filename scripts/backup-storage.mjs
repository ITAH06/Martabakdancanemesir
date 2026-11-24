/* Unduh seluruh objek pada bucket product-images.
   Memakai service_role HANYA di GitHub Actions, tidak pernah di frontend. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.IMAGE_BUCKET || 'product-images';
const out = process.env.OUT_DIR || 'backups/photos';

if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json'
};

await mkdir(out, { recursive: true });

const listRes = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ prefix: '', limit: 1000, offset: 0 })
});

if (!listRes.ok) {
  console.error('Gagal list bucket:', listRes.status, await listRes.text());
  process.exit(1);
}

const objects = await listRes.json();
let berhasil = 0;

for (const obj of objects) {
  if (!obj.name) continue; // lewati folder
  const fileRes = await fetch(
    `${url}/storage/v1/object/${bucket}/${encodeURIComponent(obj.name)}`,
    { headers }
  );
  if (!fileRes.ok) {
    console.error('Gagal unduh:', obj.name, fileRes.status);
    continue;
  }
  const isi = Buffer.from(await fileRes.arrayBuffer());
  const namaAman = basename(obj.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  await writeFile(join(out, namaAman), isi);
  berhasil++;
}

console.log(`Selesai: ${berhasil} file tersimpan di ${out}`);
