/* Общий код витрины: иконки, каталог, корзина, избранное, модалка товара */

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  heart: '<path d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 7.5 6.6Z"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  truck: '<path d="M2 6h12v10H2zM14 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.9L3 9.5"/><path d="M3 4v5.5h5.5"/><path d="M4 13a8 8 0 0 0 14.9 3.9L21 14.5"/><path d="M21 20v-5.5h-5.5"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M20 19a3 3 0 0 1-3 3h-3"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  whatsapp: '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3l-4.5 1.5Z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 1.8.8c-.2 1-1 1.6-2 1.6A6 6 0 0 1 8.4 9.3c0-1 .6-1.8 1.6-2l.8 1.8L9.6 10"/>',
  send: '<path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z"/><path d="m10 13 4-4"/>',
  store: '<path d="M3 9 5 4h14l2 5"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z"/><path d="M5 13v8h14v-8"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8" r="1.5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
};

function icon(name, cls = "icon") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon, el.dataset.iconClass || "icon"));
    el.removeAttribute("data-icon");
  });
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- Каталог ---------- */
const Shop = {
  products: [],
  categories: [],
  settings: { currency: "$", courierPrice: 5, freeShippingFrom: 50 },
  byId: new Map(),

  async load() {
    let data;
    try {
      const r = await fetch("/api/products", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      data = await r.json();
    } catch {
      // Локальный просмотр без функций Netlify — берём стартовый каталог
      const r = await fetch("/data/products.json");
      data = await r.json();
      data.products = data.products.filter((p) => p.active !== false);
    }
    this.products = data.products;
    this.categories = data.categories;
    this.settings = { ...this.settings, ...data.settings };
    this.byId = new Map(this.products.map((p) => [p.id, p]));
    document.querySelectorAll("[data-store-name]").forEach((el) => (el.textContent = this.settings.storeName || "NovaTrend"));
    return this;
  },
  price(n) {
    const v = Number(n);
    return `${this.settings.currency}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
  },
  catName(id) {
    return this.categories.find((c) => c.id === id)?.name || "";
  },
  img(url, w = 600) {
    return url && url.includes("images.unsplash.com") ? url.replace(/w=\d+/, "w=" + w) : url;
  },
  shippingFor(subtotal, delivery = "courier") {
    const s = this.settings;
    if (delivery === "pickup") return 0;
    if (s.freeShippingFrom > 0 && subtotal >= s.freeShippingFrom) return 0;
    return Number(s.courierPrice) || 0;
  },
};

/* ---------- Корзина ---------- */
const Cart = {
  items: LS.get("cart", []),
  save() { LS.set("cart", this.items); this.render(); },
  key: (id, size) => `${id}__${size}`,
  add(id, size, qty = 1) {
    const p = Shop.byId.get(id);
    if (!p) return;
    size = size || p.sizes[0] || "—";
    const ex = this.items.find((i) => i.id === id && i.size === size);
    if (ex) ex.qty = Math.min(99, ex.qty + qty);
    else this.items.push({ id, size, qty });
    this.save();
    toast(`«${p.name}» добавлен в корзину`);
  },
  setQty(id, size, qty) {
    const it = this.items.find((i) => i.id === id && i.size === size);
    if (!it) return;
    it.qty = Math.max(1, Math.min(99, qty));
    this.save();
  },
  remove(id, size) {
    this.items = this.items.filter((i) => !(i.id === id && i.size === size));
    this.save();
  },
  clear() { this.items = []; this.save(); },
  lines() {
    return this.items
      .map((i) => ({ ...i, product: Shop.byId.get(i.id) }))
      .filter((i) => i.product);
  },
  count() { return this.lines().reduce((s, i) => s + i.qty, 0); },
  subtotal() { return Math.round(this.lines().reduce((s, i) => s + i.product.price * i.qty, 0) * 100) / 100; },

  render() {
    $$("[data-cart-count]").forEach((el) => { const n = this.count(); el.textContent = n || ""; el.dataset.n = n; });
    const body = $("#cartBody");
    if (!body) return;
    const lines = this.lines();
    const foot = $("#cartFoot");
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty">${icon("bag")}<p>В корзине пока пусто</p><button class="btn btn-dark btn-sm" data-close-cart>Перейти к покупкам</button></div>`;
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = lines.map((l) => lineHTML(l, true)).join("");
    const sub = this.subtotal();
    const free = Number(Shop.settings.freeShippingFrom) || 0;
    const left = Math.max(0, free - sub);
    $("#shipProgress").innerHTML = free
      ? `${left > 0 ? `До бесплатной доставки осталось <b>${Shop.price(left)}</b>` : "<b>Доставка бесплатная</b>"}<div class="bar"><i style="width:${Math.min(100, (sub / free) * 100)}%"></i></div>`
      : "";
    $("#cartSubtotal").textContent = Shop.price(sub);
  },
};

function lineHTML(l, editable) {
  const p = l.product;
  return `<div class="line">
    <img src="${esc(Shop.img(p.image, 200))}" alt="" loading="lazy">
    <div>
      <div class="t">${esc(p.name)}</div>
      <div class="s">Размер: ${esc(l.size)}${editable ? "" : ` · ${l.qty} шт.`}</div>
      ${editable ? `<div class="qty">
        <button data-qty="-1" data-id="${p.id}" data-size="${esc(l.size)}" aria-label="Меньше">${icon("minus")}</button>
        <span>${l.qty}</span>
        <button data-qty="1" data-id="${p.id}" data-size="${esc(l.size)}" aria-label="Больше">${icon("plus")}</button>
      </div>` : ""}
    </div>
    <div class="r">
      <span class="price">${Shop.price(p.price * l.qty)}</span>
      ${editable ? `<button class="remove" data-remove data-id="${p.id}" data-size="${esc(l.size)}" aria-label="Удалить">${icon("trash")}</button>` : ""}
    </div>
  </div>`;
}

/* ---------- Избранное ---------- */
const Fav = {
  ids: new Set(LS.get("fav", [])),
  toggle(id) {
    this.ids.has(id) ? this.ids.delete(id) : this.ids.add(id);
    LS.set("fav", [...this.ids]);
    this.render();
  },
  render() {
    $$("[data-fav-count]").forEach((el) => { el.textContent = this.ids.size || ""; el.dataset.n = this.ids.size; });
    $$("[data-fav]").forEach((b) => b.classList.toggle("on", this.ids.has(b.dataset.fav)));
  },
};

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(text) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = icon("checkCircle") + `<span>${esc(text)}</span>`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

function openCart() {
  $("#cartDrawer")?.classList.add("open");
  $("#overlay")?.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeAll() {
  $("#cartDrawer")?.classList.remove("open");
  $("#productModal")?.classList.remove("open");
  $("#nav")?.classList.remove("open");
  $("#overlay")?.classList.remove("show");
  document.body.style.overflow = "";
}

function stars(r) {
  const full = Math.round(r);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

function productCard(p) {
  const sale = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const tag = sale ? `<span class="tag sale">-${sale}%</span>` : p.badge === "new" ? `<span class="tag">New</span>` : p.badge === "hit" ? `<span class="tag hit">Хит</span>` : "";
  return `<article class="card">
    <div class="card-media" data-open="${p.id}">
      ${tag}
      <img src="${esc(Shop.img(p.image, 500))}" alt="${esc(p.name)}" loading="lazy">
    </div>
    <button class="fav" data-fav="${p.id}" aria-label="В избранное">${icon("heart")}</button>
    <div class="card-body">
      <div class="card-title" data-open="${p.id}">${esc(p.name)}</div>
      <div class="card-foot">
        <div>
          <div class="price">${Shop.price(p.price)}${p.oldPrice ? `<s>${Shop.price(p.oldPrice)}</s>` : ""}</div>
          <div class="stars"><i>${stars(p.rating)}</i>(${p.reviews})</div>
        </div>
        <button class="add-round" data-quick="${p.id}" aria-label="В корзину">${icon("cart")}</button>
      </div>
    </div>
  </article>`;
}

/* ---------- Модалка товара ---------- */
function openProduct(id) {
  const p = Shop.byId.get(id);
  const m = $("#productModal");
  if (!p || !m) return;
  let size = p.sizes.length === 1 ? p.sizes[0] : null;
  let qty = 1;
  m.querySelector(".modal-box").innerHTML = `
    <button class="modal-close" data-close aria-label="Закрыть">${icon("close")}</button>
    <div class="pic"><img src="${esc(Shop.img(p.image, 900))}" alt="${esc(p.name)}"></div>
    <div class="info">
      <span class="eyebrow">${esc(Shop.catName(p.category))}</span>
      <h2>${esc(p.name)}</h2>
      <div class="stars"><i>${stars(p.rating)}</i>${p.rating} · ${p.reviews} отзывов</div>
      <div class="price">${Shop.price(p.price)}${p.oldPrice ? `<s>${Shop.price(p.oldPrice)}</s>` : ""}</div>
      <p class="desc">${esc(p.description)}</p>
      <div class="label">Размер</div>
      <div class="sizes">${p.sizes.map((s) => `<button class="size${s === size ? " active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <div class="label">Количество</div>
      <div class="qty" style="align-self:flex-start;height:40px">
        <button data-mq="-1" aria-label="Меньше">${icon("minus")}</button><span id="mQty">1</span><button data-mq="1" aria-label="Больше">${icon("plus")}</button>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="mAdd">${icon("cart")} В корзину</button>
        <button class="btn btn-outline" id="mBuy">Купить сейчас</button>
      </div>
      <div class="perks">
        <span>${icon("truck")} Бесплатная доставка от ${Shop.price(Shop.settings.freeShippingFrom)}</span>
        <span>${icon("refresh")} Обмен и возврат в течение 14 дней</span>
        <span>${icon("shield")} Оплата при получении</span>
      </div>
    </div>`;
  const box = m.querySelector(".modal-box");
  box.onclick = (e) => {
    const s = e.target.closest("[data-size]");
    if (s) {
      size = s.dataset.size;
      box.querySelectorAll(".size").forEach((b) => b.classList.toggle("active", b === s));
    }
    const q = e.target.closest("[data-mq]");
    if (q) { qty = Math.max(1, Math.min(99, qty + +q.dataset.mq)); $("#mQty").textContent = qty; }
    const add = e.target.closest("#mAdd, #mBuy");
    if (add) {
      if (!size) {
        const sz = box.querySelector(".sizes");
        sz.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 });
        toast("Выберите размер");
        return;
      }
      Cart.add(p.id, size, qty);
      if (add.id === "mBuy") { location.href = "/checkout.html"; return; }
      closeAll();
      openCart();
    }
  };
  m.classList.add("open");
  $("#overlay")?.classList.add("show");
  document.body.style.overflow = "hidden";
}

/* ---------- Глобальные обработчики ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
  if (t.closest("[data-close-cart]") || t.closest("[data-close]") || t.id === "overlay" || t.id === "productModal") { closeAll(); return; }
  const open = t.closest("[data-open]");
  if (open) { openProduct(open.dataset.open); return; }
  const fav = t.closest("[data-fav]");
  if (fav) { Fav.toggle(fav.dataset.fav); return; }
  const quick = t.closest("[data-quick]");
  if (quick) {
    const p = Shop.byId.get(quick.dataset.quick);
    if (p && p.sizes.length > 1) openProduct(p.id);
    else if (p) Cart.add(p.id, p.sizes[0]);
    return;
  }
  const q = t.closest("[data-qty]");
  if (q) {
    const it = Cart.items.find((i) => i.id === q.dataset.id && i.size === q.dataset.size);
    if (it) Cart.setQty(it.id, it.size, it.qty + +q.dataset.qty);
    return;
  }
  const rm = t.closest("[data-remove]");
  if (rm) { Cart.remove(rm.dataset.id, rm.dataset.size); return; }
  if (t.closest("#burger")) {
    $("#nav").classList.add("open");
    $("#overlay").classList.add("show");
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
window.addEventListener("storage", (e) => { if (e.key === "cart") { Cart.items = LS.get("cart", []); Cart.render(); } });
