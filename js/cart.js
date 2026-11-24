/* Keranjang + checkout WhatsApp.
   Harga diambil dari DOM (yang diisi dari DB bila CATALOG_FROM_DB = true).
   Saat checkout, harga_divalidasi ulang lewat RPC Postgres bila tersedia. */
import { supabase } from './supabase-client.js';
import { CATALOG_FROM_DB, WHATSAPP_NUMBER } from './config.js';

(function () {
  'use strict';

  var STORAGE_KEY = 'martabak-cane-mesir-cart-v1';
  var rupiah = function (value) {
    return 'Rp' + Number(value).toLocaleString('id-ID');
  };

  function textOf(root, selector) {
    var el = root ? root.querySelector(selector) : null;
    return el ? (el.textContent || '').trim() : '';
  }

  var els = {
    toggle: document.getElementById('cartToggle'),
    badge: document.getElementById('cartBadge'),
    drawer: document.getElementById('cartDrawer'),
    overlay: document.getElementById('cartOverlay'),
    close: document.getElementById('cartClose'),
    items: document.getElementById('cartItems'),
    total: document.getElementById('cartTotal'),
    checkout: document.getElementById('cartCheckout')
  };

  if (!els.toggle || !els.drawer || !els.items) return;

  function readCart() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  var cart = readCart();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function readProducts() {
    return Array.prototype.map.call(document.querySelectorAll('.product-card'), function (card) {
      var name = textOf(card, 'h3');
      var image = card.querySelector('.product-image');
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        dbId: card.getAttribute('data-product-id') || '',
        name: name,
        price: Number(textOf(card, '.price').replace(/\D/g, '')),
        image: image ? image.getAttribute('src') : ''
      };
    }).filter(function (p) { return p.name && p.price > 0; });
  }

  var products = readProducts();

  function productById(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function entries() {
    return Object.keys(cart).map(function (id) {
      return { product: productById(id), qty: Number(cart[id]) };
    }).filter(function (item) { return item.product && item.qty > 0; });
  }

  function totals() {
    return entries().reduce(function (acc, item) {
      acc.count += item.qty;
      acc.amount += item.product.price * item.qty;
      return acc;
    }, { count: 0, amount: 0 });
  }

  function setOpen(open) {
    els.drawer.classList.toggle('is-open', open);
    els.drawer.setAttribute('aria-hidden', String(!open));
    els.overlay.hidden = !open;
    els.toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('cart-open', open);
    if (open && els.close) els.close.focus();
  }

  function makeButton(label, className, action, id) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = label;
    b.setAttribute('data-action', action);
    b.setAttribute('data-id', id);
    return b;
  }

  function render() {
    var list = entries();
    var t = totals();
    els.items.innerHTML = '';

    if (!list.length) {
      var empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.textContent = 'Keranjang masih kosong. Tambahkan menu favoritmu, ya!';
      els.items.appendChild(empty);
    } else {
      list.forEach(function (item) {
        var p = item.product;
        var row = document.createElement('div');
        row.className = 'cart-item';

        if (p.image) {
          var img = document.createElement('img');
          img.className = 'cart-item-image';
          img.src = p.image;
          img.alt = p.name;
          row.appendChild(img);
        }

        var info = document.createElement('div');
        info.className = 'cart-item-info';
        var name = document.createElement('strong');
        name.textContent = p.name;
        var price = document.createElement('span');
        price.className = 'cart-item-price';
        price.textContent = rupiah(p.price) + ' / porsi';

        var qty = document.createElement('div');
        qty.className = 'cart-qty';
        var value = document.createElement('span');
        value.className = 'qty-value';
        value.textContent = String(item.qty);
        qty.appendChild(makeButton('\u2212', 'qty-btn', 'dec', p.id));
        qty.appendChild(value);
        qty.appendChild(makeButton('+', 'qty-btn', 'inc', p.id));
        qty.appendChild(makeButton('Hapus', 'qty-remove', 'remove', p.id));

        info.appendChild(name);
        info.appendChild(price);
        info.appendChild(qty);
        row.appendChild(info);
        els.items.appendChild(row);
      });
    }

    els.total.textContent = rupiah(t.amount);
    els.badge.textContent = String(t.count);
    els.badge.hidden = t.count === 0;
    if (!list.length) {
      els.checkout.setAttribute('aria-disabled', 'true');
      els.checkout.setAttribute('tabindex', '-1');
    } else {
      els.checkout.setAttribute('aria-disabled', 'false');
      els.checkout.setAttribute('tabindex', '0');
    }

    /* Validasi harga lebih awal. Setelah sukses, href diisi dan
       tombol menjadi tautan WhatsApp alami (tidak diblokir popup blocker). */
    validateCheckout();
  }

  function change(id, action) {
    if (!productById(id)) return;
    var current = Number(cart[id]) || 0;
    if (action === 'inc') cart[id] = current + 1;
    else if (action === 'dec') cart[id] = current - 1;
    else if (action === 'remove') delete cart[id];
    if (cart[id] !== undefined && cart[id] <= 0) delete cart[id];
    persist();
    render();
  }

  /* Event delegation: kartu bisa diganti katalog DB kapan saja,
     jadi listener tidak dipasang per tombol. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var card = btn.closest('.product-card');
    if (!card) return;

    products = readProducts();
    var name = textOf(card, 'h3');
    var id = name.toLowerCase().replace(/\s+/g, '-');
    if (!productById(id)) return;
    cart[id] = (Number(cart[id]) || 0) + 1;
    persist();
    render();
    setOpen(true);
  });

  els.toggle.addEventListener('click', function () {
    setOpen(!els.drawer.classList.contains('is-open'));
  });
  if (els.close) els.close.addEventListener('click', function () { setOpen(false); });
  if (els.overlay) els.overlay.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  els.items.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (btn) change(btn.getAttribute('data-id'), btn.getAttribute('data-action'));
  });

  window.addEventListener('products:updated', function () {
    products = readProducts();
    render();
  });

  function susunPesan(lines, total) {
    return [
      'Halo, saya ingin memesan di Martabak & Cane Mesir:',
      '',
      lines.join('\n'),
      '',
      'Total: ' + rupiah(total),
      '',
      'Terima kasih!'
    ].join('\n');
  }

  async function pesanCheckout(list) {
    /* Saat katalog berbasis DB, harga WAJIB berasal dari database.
       Jika RPC gagal, checkout dibatalkan — harga browser tidak dipercaya. */
    if (CATALOG_FROM_DB && list.length && list.every(function (i) { return i.product.dbId; })) {
      try {
        var res = await supabase.rpc('get_checkout_summary', {
          p_items: list.map(function (i) { return { id: i.product.dbId, qty: i.qty }; })
        });
        if (!res.error && res.data && res.data.length === list.length) {
          var lines = res.data.map(function (r, i) {
            return (i + 1) + '. ' + r.name + ' x' + r.qty +
              ' \u2014 ' + rupiah(r.unit_price) + ' = ' + rupiah(r.line_total);
          });
          var total = res.data.reduce(function (s, r) { return s + Number(r.line_total); }, 0);
          return susunPesan(lines, total);
        }
      } catch (e) {}
      return null;
    }

    /* Fallback lokal hanya untuk katalog statis (CATALOG_FROM_DB = false). */
    var localLines = list.map(function (item, i) {
      var p = item.product;
      return (i + 1) + '. ' + p.name + ' x' + item.qty +
        ' \u2014 ' + rupiah(p.price) + ' = ' + rupiah(p.price * item.qty);
    });
    return susunPesan(localLines, totals().amount);
  }

  var checkoutCache = { key: '', pesan: '' };

  function cartSignature() {
    return JSON.stringify({
      cart: cart,
      ids: products.map(function (p) { return p.id + ':' + p.dbId; })
    });
  }

  async function validateCheckout() {
    var key = cartSignature();
    var list = entries();

    if (!list.length || checkoutCache.key !== key) {
      els.checkout.removeAttribute('href');
      els.checkout.title = 'Memvalidasi harga...';
    }

    if (!list.length) {
      checkoutCache = { key: key, pesan: '' };
      els.checkout.title = '';
      return '';
    }

    try {
      var pesan = await pesanCheckout(list);
      checkoutCache = { key: cartSignature(), pesan: pesan || '' };
      if (checkoutCache.pesan) {
        els.checkout.href = 'https://wa.me/' + WHATSAPP_NUMBER +
          '?text=' + encodeURIComponent(checkoutCache.pesan);
        els.checkout.title = '';
      } else {
        els.checkout.removeAttribute('href');
        els.checkout.title = 'Harga gagal divalidasi. Coba lagi.';
      }
      return checkoutCache.pesan;
    } catch (e) {
      checkoutCache = { key: key, pesan: '' };
      els.checkout.removeAttribute('href');
      els.checkout.title = 'Harga gagal divalidasi. Coba lagi.';
      return '';
    }
  }

  render();
})();
