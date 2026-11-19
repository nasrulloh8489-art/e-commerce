(function () {
  hydrateIcons();

  let KEY = sessionStorage.getItem("adminKey") || "";
  let orders = [];
  let STATUSES = { new: "Новый", confirmed: "Подтверждён", shipping: "В доставке", done: "Выполнен", canceled: "Отменён" };
  let catalog = { products: [], categories: [], settings: {} };
  let statusFilter = "all";
  let lastNewIds = null;
  let currentOrderId = null;

  const cur = () => catalog.settings.currency || "$";
  const money = (n) => `${cur()}${Number(n || 0).toFixed(2)}`;
  const fmtDate = (iso) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const digits = (s) => String(s || "").replace(/\D/g, "");

  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { "content-type": "application/json", "x-admin-key": KEY, ...(opts.headers || {}) },
    });
    if (r.status === 404) throw new Error("API не найдено. Сайт должен работать на Netlify (или через «netlify dev»).");
    const data = await r.json().catch(() => ({}));
    if (r.status === 401) { logout(); throw new Error("Неверный пароль"); }
    if (!r.ok) throw new Error(data.error || "Ошибка " + r.status);
    return data;
  }

  /* ---------- Вход ---------- */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    KEY = $("#pass").value;
    const err = $("#loginErr");
    err.classList.remove("show");
    try {
      await api("/api/orders");
      sessionStorage.setItem("adminKey", KEY);
      start();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.add("show");
    }
  });
  function logout() {
    KEY = "";
    sessionStorage.removeItem("adminKey");
    $("#app").hidden = true;
    $("#login").hidden = false;
  }
  $("#logout").addEventListener("click", logout);

  async function start() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    await Promise.all([loadCatalog(), loadOrders()]);
    setInterval(() => { if ($("#autoRefresh").checked && !document.hidden) loadOrders(true); }, 30000);
  }

  /* ---------- Вкладки ---------- */
  $$(".tab[data-tab]").forEach((t) =>
    t.addEventListener("click", () => {
      $$(".tab[data-tab]").forEach((x) => x.classList.toggle("active", x === t));
      $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== t.dataset.tab));
    })
  );

  /* ---------- Заказы ---------- */
  async function loadOrders(silent) {
    try {
      const data = await api("/api/orders");
      orders = data.orders;
      STATUSES = data.statuses || STATUSES;
      const newIds = orders.filter((o) => o.status === "new").map((o) => o.id);
      if (lastNewIds && newIds.some((id) => !lastNewIds.includes(id))) {
        toast("Новый заказ!");
        beep();
      }
      lastNewIds = newIds;
      renderOrders();
    } catch (e) {
      if (!silent) toast(e.message);
    }
  }
  $("#reload").addEventListener("click", () => loadOrders());

  function beep() {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  function renderOrders() {
    const today = new Date().toDateString();
    const active = orders.filter((o) => o.status !== "canceled");
    const todayOrders = active.filter((o) => new Date(o.createdAt).toDateString() === today);
    const nNew = orders.filter((o) => o.status === "new").length;
    $("#newCount").textContent = nNew || "";
    $("#kpis").innerHTML = [
      ["Новые заказы", nNew],
      ["Заказов сегодня", todayOrders.length],
      ["Выручка сегодня", money(todayOrders.reduce((s, o) => s + o.total, 0))],
      ["Выполнено всего", money(orders.filter((o) => o.status === "done").reduce((s, o) => s + o.total, 0))],
    ].map(([l, v]) => `<div class="kpi"><small>${l}</small><b>${v}</b></div>`).join("");

    const counts = orders.reduce((m, o) => ((m[o.status] = (m[o.status] || 0) + 1), m), {});
    $("#statusChips").innerHTML = [["all", "Все", orders.length], ...Object.entries(STATUSES).map(([k, v]) => [k, v, counts[k] || 0])]
      .map(([k, v, n]) => `<button class="chip${statusFilter === k ? " active" : ""}" data-sf="${k}">${v} · ${n}</button>`).join("");

    const q = $("#orderSearch").value.trim().toLowerCase();
    let list = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
    if (q) list = list.filter((o) => [o.id, o.customer.name, o.customer.phone, o.customer.whatsapp, o.customer.address].join(" ").toLowerCase().includes(q));

    $("#orders").innerHTML = list.length
      ? list.map((o) => `<div class="order${o.status === "new" ? " is-new" : ""}" data-order="${esc(o.id)}">
          <div><div class="id">${esc(o.id)}</div><small>${fmtDate(o.createdAt)}</small></div>
          <div><div>${esc(o.customer.name)}</div><small>${esc(o.customer.phone || o.customer.whatsapp)} · ${esc(o.customer.contactLabel || "")}</small></div>
          <div><small>${o.delivery === "pickup" ? "Самовывоз" : esc([o.customer.city, o.customer.address].filter(Boolean).join(", ") || "По геолокации")}</small><small>${o.items.reduce((s, i) => s + i.qty, 0)} шт.</small></div>
          <div class="sum">${money(o.total)}</div>
          <div><select class="status-select" data-status-of="${esc(o.id)}">${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}"${k === o.status ? " selected" : ""}>${v}</option>`).join("")}</select></div>
        </div>`).join("")
      : `<div class="empty">${orders.length ? "Ничего не найдено" : "Заказов пока нет. Как только кто-то оформит заказ на сайте, он появится здесь."}</div>`;
  }

  $("#statusChips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-sf]");
    if (c) { statusFilter = c.dataset.sf; renderOrders(); }
  });
  $("#orderSearch").addEventListener("input", renderOrders);
  $("#orders").addEventListener("change", (e) => {
    const s = e.target.closest("[data-status-of]");
    if (s) setStatus(s.dataset.statusOf, s.value);
  });
  $("#orders").addEventListener("click", (e) => {
    if (e.target.closest("select")) return;
    const o = e.target.closest("[data-order]");
    if (o) openOrder(o.dataset.order);
  });

  async function setStatus(id, status) {
    try {
      const { order } = await api(`/api/orders?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      orders = orders.map((o) => (o.id === id ? order : o));
      renderOrders();
      if (currentOrderId === id) openOrder(id);
      toast(`Заказ ${id}: ${STATUSES[status]}`);
    } catch (e) { toast(e.message); }
  }

  function openOrder(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    currentOrderId = id;
    const c = o.customer;
    const wa = digits(c.whatsapp);
    const ph = String(c.phone || "").replace(/[^\d+]/g, "");
    const tgPhone = digits(c.phone || c.whatsapp);
    $("#odTitle").textContent = `Заказ ${o.id}`;
    $("#odBody").innerHTML = `
      <div class="od-section">
        <h4>Статус</h4>
        <div class="status-row">${Object.entries(STATUSES).map(([k, v]) => `<button class="btn btn-outline btn-sm${k === o.status ? " on" : ""}" data-set="${k}">${v}</button>`).join("")}</div>
      </div>
      <div class="od-section">
        <h4>Покупатель</h4>
        <div class="kv">
          <span>Имя</span><span>${esc(c.name)}</span>
          ${c.phone ? `<span>Телефон</span><span>${esc(c.phone)}</span>` : ""}
          ${c.whatsapp ? `<span>WhatsApp</span><span>${esc(c.whatsapp)}</span>` : ""}
          <span>Связь</span><span><b>${esc(c.contactLabel || c.contact)}</b></span>
          <span>Создан</span><span>${new Date(o.createdAt).toLocaleString("ru-RU")}</span>
        </div>
        <div class="contact-btns">
          ${ph ? `<a class="btn btn-outline btn-sm" href="tel:${esc(ph)}">${icon("phone")} Позвонить</a>` : ""}
          ${wa ? `<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(`Здравствуйте, ${c.name}! Ваш заказ ${o.id} в ${catalog.settings.storeName || "магазине"}.`)}">${icon("whatsapp")} WhatsApp</a>` : ""}
          ${tgPhone ? `<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="https://t.me/+${tgPhone}">${icon("send")} Telegram</a>` : ""}
        </div>
      </div>
      <div class="od-section">
        <h4>Доставка и оплата</h4>
        <div class="kv">
          <span>Способ</span><span>${o.delivery === "pickup" ? "Самовывоз" : "Курьер"}</span>
          ${o.delivery !== "pickup" ? `<span>Адрес</span><span>${esc([c.city, c.address].filter(Boolean).join(", ") || "—")}</span>` : ""}
          <span>Оплата</span><span>${o.payment === "card" ? "Картой при получении" : "Наличными"}</span>
          ${c.comment ? `<span>Комментарий</span><span>${esc(c.comment)}</span>` : ""}
        </div>
        ${c.lat && c.lng ? `
          <div class="contact-btns">
            <a class="btn btn-dark btn-sm" target="_blank" rel="noopener" href="https://maps.google.com/?q=${c.lat},${c.lng}">${icon("pin")} Google Maps</a>
            <a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="https://yandex.ru/maps/?pt=${c.lng},${c.lat}&z=17&l=map">Яндекс Карты</a>
          </div>
          <div class="od-map"><iframe loading="lazy" title="Карта" src="https://www.openstreetmap.org/export/embed.html?bbox=${c.lng - 0.004},${c.lat - 0.004},${c.lng + 0.004},${c.lat + 0.004}&layer=mapnik&marker=${c.lat},${c.lng}"></iframe></div>` : ""}
      </div>
      <div class="od-section">
        <h4>Товары</h4>
        ${o.items.map((i) => `<div class="line" style="grid-template-columns:56px 1fr auto">
          <img src="${esc(i.image)}" alt="" style="width:56px;height:56px">
          <div><div class="t">${esc(i.name)}</div><div class="s">Размер: ${esc(i.size)} · ${i.qty} × ${money(i.price)}</div></div>
          <div class="price">${money(i.price * i.qty)}</div></div>`).join("")}
        <div class="totals" style="margin-top:12px">
          <div><span>Товары</span><span>${money(o.subtotal)}</span></div>
          <div><span>Доставка</span><span>${o.shipping ? money(o.shipping) : "Бесплатно"}</span></div>
          <div class="grand"><span>Итого</span><span>${money(o.total)}</span></div>
        </div>
      </div>
      <div class="od-section">
        <h4>История</h4>
        <div class="history">${(o.history || []).map((h) => `<div>${new Date(h.at).toLocaleString("ru-RU")} — ${esc(STATUSES[h.status] || h.status)} <span class="hint">(${esc(h.by)})</span></div>`).join("")}</div>
      </div>
      <div style="padding-top:16px"><button class="btn btn-outline btn-sm danger" data-del-order>Удалить заказ</button></div>`;
    $("#orderDrawer").classList.add("open");
    $("#overlay").classList.add("show");
  }
  $("#odBody").addEventListener("click", async (e) => {
    const s = e.target.closest("[data-set]");
    if (s) return setStatus(currentOrderId, s.dataset.set);
    if (e.target.closest("[data-del-order]")) {
      if (!confirm(`Удалить заказ ${currentOrderId}? Это нельзя отменить.`)) return;
      try {
        await api(`/api/orders?id=${encodeURIComponent(currentOrderId)}`, { method: "DELETE" });
        orders = orders.filter((o) => o.id !== currentOrderId);
        closeDrawers();
        renderOrders();
        toast("Заказ удалён");
      } catch (ex) { toast(ex.message); }
    }
  });
  function closeDrawers() {
    currentOrderId = null;
    $("#orderDrawer").classList.remove("open");
    $("#productEditor").classList.remove("open");
    $("#overlay").classList.remove("show");
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-drawer]") || e.target.closest("[data-close-editor]") || e.target.id === "overlay" || e.target.id === "productEditor") closeDrawers();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawers(); });

  /* ---------- Товары ---------- */
  async function loadCatalog() {
    try {
      catalog = await api("/api/products");
      renderProducts();
      fillSettings();
    } catch (e) { toast(e.message); }
  }
  const catName = (id) => catalog.categories.find((c) => c.id === id)?.name || id || "—";

  function renderProducts() {
    $("#productsTable tbody").innerHTML = catalog.products.map((p) => `
      <tr class="${p.active === false ? "off" : ""}">
        <td><img src="${esc(p.image)}" alt=""></td>
        <td><b>${esc(p.name)}</b><br><small class="hint">${esc(p.sizes.join(", "))}</small></td>
        <td>${esc(catName(p.category))}</td>
        <td><b>${money(p.price)}</b>${p.oldPrice ? `<br><s class="hint">${money(p.oldPrice)}</s>` : ""}</td>
        <td>${p.badge === "new" ? "Новинка" : p.badge === "hit" ? "Хит" : "—"}</td>
        <td><input type="checkbox" class="switch" data-toggle="${p.id}" ${p.active !== false ? "checked" : ""} aria-label="Показывать"></td>
        <td><button class="btn btn-outline btn-sm" data-edit="${p.id}">Изменить</button></td>
      </tr>`).join("");
  }
  async function saveProducts(msg = "Сохранено") {
    try {
      const r = await api("/api/products", { method: "PUT", body: JSON.stringify({ products: catalog.products }) });
      catalog = r.catalog;
      renderProducts();
      toast(msg);
      return true;
    } catch (e) { toast(e.message); return false; }
  }
  $("#productsTable").addEventListener("change", (e) => {
    const t = e.target.closest("[data-toggle]");
    if (!t) return;
    const p = catalog.products.find((x) => x.id === t.dataset.toggle);
    p.active = t.checked;
    saveProducts(t.checked ? "Товар показан на сайте" : "Товар скрыт");
  });
  $("#productsTable").addEventListener("click", (e) => {
    const b = e.target.closest("[data-edit]");
    if (b) openEditor(b.dataset.edit);
  });
  $("#addProduct").addEventListener("click", () => openEditor(null));

  let editingId = null;
  const PF = $("#productForm");
  function openEditor(id) {
    editingId = id;
    const p = catalog.products.find((x) => x.id === id) || {
      name: "", price: "", oldPrice: "", category: catalog.categories[0]?.id, badge: "new",
      image: "", sizes: ["S", "M", "L", "XL"], description: "", rating: 5, reviews: 0, active: true,
    };
    $("#peCategory").innerHTML = catalog.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    const F = PF.elements;
    F.name.value = p.name; F.price.value = p.price; F.oldPrice.value = p.oldPrice || "";
    F.category.value = p.category; F.badge.value = p.badge || ""; F.image.value = p.image;
    F.sizes.value = p.sizes.join(", "); F.description.value = p.description;
    F.rating.value = p.rating; F.reviews.value = p.reviews; F.active.checked = p.active !== false;
    $("#pePreview").src = p.image || "/favicon.svg";
    $("#peTitle").textContent = id ? "Редактировать товар" : "Новый товар";
    $("#peDelete").hidden = !id;
    $("#productEditor").classList.add("open");
    $("#overlay").classList.add("show");
  }
  PF.elements.image.addEventListener("input", (e) => { $("#pePreview").src = e.target.value || "/favicon.svg"; });

  /* ---------- AI-описание ---------- */
  $("#peAi").addEventListener("click", async () => {
    const F = PF.elements;
    const btn = $("#peAi");
    if (!F.name.value.trim()) return toast("Сначала укажите название товара");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Генерирую…";
    try {
      const { description } = await api("/api/ai-describe", {
        method: "POST",
        body: JSON.stringify({
          name: F.name.value,
          category: catName(F.category.value),
          price: F.price.value ? money(F.price.value) : "",
          sizes: F.sizes.value,
          notes: F.description.value, // то, что уже написано в поле, — факты для AI
        }),
      });
      F.description.value = description;
      toast("Описание готово — проверьте и сохраните");
    } catch (e) {
      toast(e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
  PF.addEventListener("submit", async (e) => {
    e.preventDefault();
    const F = PF.elements;
    const data = {
      name: F.name.value.trim(), price: F.price.value, oldPrice: F.oldPrice.value, category: F.category.value,
      badge: F.badge.value || null, image: F.image.value.trim(), sizes: F.sizes.value, description: F.description.value.trim(),
      rating: F.rating.value, reviews: F.reviews.value, active: F.active.checked,
    };
    const backup = JSON.parse(JSON.stringify(catalog.products));
    if (editingId) {
      catalog.products = catalog.products.map((p) => (p.id === editingId ? { ...p, ...data } : p));
    } else {
      catalog.products.unshift({ id: "p" + Date.now().toString(36), ...data });
    }
    if (await saveProducts(editingId ? "Товар обновлён" : "Товар добавлен")) closeDrawers();
    else catalog.products = backup;
  });
  $("#peDelete").addEventListener("click", async () => {
    if (!editingId || !confirm("Удалить товар из каталога?")) return;
    catalog.products = catalog.products.filter((p) => p.id !== editingId);
    if (await saveProducts("Товар удалён")) closeDrawers();
  });

  /* ---------- Настройки ---------- */
  function fillSettings() {
    const F = $("#settingsForm").elements;
    const s = catalog.settings;
    ["storeName", "currency", "courierPrice", "freeShippingFrom", "pickupAddress", "storePhone", "storeWhatsapp"].forEach((k) => (F[k].value = s[k] ?? ""));
    F.flashSaleEnds.value = s.flashSaleEnds ? s.flashSaleEnds.slice(0, 16) : "";
  }
  $("#settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const F = e.target.elements;
    const settings = {};
    ["storeName", "currency", "courierPrice", "freeShippingFrom", "pickupAddress", "storePhone", "storeWhatsapp", "flashSaleEnds"].forEach((k) => (settings[k] = F[k].value));
    try {
      const r = await api("/api/products", { method: "PUT", body: JSON.stringify({ settings }) });
      catalog = r.catalog;
      fillSettings();
      toast("Настройки сохранены");
    } catch (ex) { toast(ex.message); }
  });


  if (KEY) start().catch(logout);
})();
