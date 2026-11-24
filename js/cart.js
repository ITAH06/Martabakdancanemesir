/* ============================================================
   Keranjang + checkout WhatsApp
   - Data produk dibaca otomatis dari kartu yang sudah ada,
     sehingga tidak perlu menduplikasi nama/harga/gambar.
   - Nomor toko: 089652518067 (6289652518067 untuk wa.me)
   ============================================================ */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '6289652518067';
  var STORAGE_KEY = 'martabak-cane-mesir-cart-v1';

  function rupiah(value) {
    return 'Rp' + Number(value).toLocaleString('id-ID');
  }

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
    } catch (e) {
      /* Penyimpanan bisa diblokir; keranjang tetap berjalan di memori. */
    }
  }

  var products = Array.prototype.map.call(
    document.querySelectorAll('.product-card'),
    function (card) {
      var name = textOf(card, 'h3');
      var priceText = textOf(card, '.price');
      var image = card.querySelector('.product-image');
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        price: Number(priceText.replace(/\D/g, '')),
        image: image ? image.getAttribute('src') : ''
      };
    }
  ).filter(function (p) {
    return p.name && p.price > 0;
  });

  function productById(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function entries() {
    return Object.keys(cart).map(function (id) {
      return { product: productById(id), qty: Number(cart[id]) };
    }).filter(function (item) {
      return item.product && item.qty > 0;
    });
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

    if (list.length === 0) {
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
    els.checkout.disabled = list.length === 0;
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

  Array.prototype.forEach.call(document.querySelectorAll('[data-add]'), function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.product-card');
      var name = textOf(card, 'h3');
      var id = name.toLowerCase().replace(/\s+/g, '-');
      if (!productById(id)) return;

      cart[id] = (Number(cart[id]) || 0) + 1;
      persist();
      render();
      setOpen(true);
    });
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

  els.checkout.addEventListener('click', function () {
    var list = entries();
    if (list.length === 0) return;

    var lines = list.map(function (item, index) {
      var p = item.product;
      return (index + 1) + '. ' + p.name + ' x' + item.qty +
        ' \u2014 ' + rupiah(p.price) + ' = ' + rupiah(p.price * item.qty);
    });

    var t = totals();
    var message = [
      'Halo, saya ingin memesan di Martabak & Cane Mesir:',
      '',
      lines.join('\n'),
      '',
      'Total: ' + rupiah(t.amount),
      '',
      'Terima kasih!'
    ].join('\n');

    window.open(
      'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message),
      '_blank',
      'noopener'
    );
  });

  render();
})();
