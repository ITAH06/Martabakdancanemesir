import { supabase } from './supabase-client.js';
import { CATALOG_FROM_DB, WHATSAPP_NUMBER, IMAGE_BUCKET } from './config.js';

const rupiah = (value) => 'Rp' + Number(value).toLocaleString('id-ID');

function imageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function buatKartu(p) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('data-product-id', p.id);

  const img = document.createElement('img');
  img.className = 'product-image';
  img.src = imageUrl(p.image_url);
  img.alt = p.name;
  card.appendChild(img);

  const info = document.createElement('div');
  info.className = 'product-info';

  const h3 = document.createElement('h3');
  h3.textContent = p.name;

  const desc = document.createElement('p');
  desc.textContent = p.description || '';

  const bottom = document.createElement('div');
  bottom.className = 'product-bottom';

  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = rupiah(p.price);

  const actions = document.createElement('div');
  actions.className = 'product-actions';

  const add = document.createElement('button');
  add.className = 'btn cart-add';
  add.type = 'button';
  add.setAttribute('data-add', '');
  add.textContent = '+ Keranjang';

  const pesan = encodeURIComponent(
    'Halo, saya ingin memesan ' + p.name + ' seharga ' + rupiah(p.price) + '.'
  );
  const order = document.createElement('a');
  order.className = 'btn order-btn';
  order.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + pesan;
  order.target = '_blank';
  order.rel = 'noopener';
  order.textContent = 'Pesan ↗';

  actions.appendChild(add);
  actions.appendChild(order);
  bottom.appendChild(price);
  bottom.appendChild(actions);

  info.appendChild(h3);
  info.appendChild(desc);
  info.appendChild(bottom);
  card.appendChild(info);

  return card;
}

const target = document.querySelector('#menu .products');

/* Jika DB belum siap / error, kartu statis lama dibiarkan sebagai fallback. */
if (target && CATALOG_FROM_DB) {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,description,price,category,image_url,stock,is_available')
        .eq('is_available', true)
        .order('name');

      if (error || !data || !data.length) return;

      target.innerHTML = '';
      data.forEach((p) => target.appendChild(buatKartu(p)));
      window.dispatchEvent(new CustomEvent('products:updated', { detail: data }));
    } catch (e) {
      /* Fallback diam-diam: katalog statis tetap tampil. */
    }
  })();
}
