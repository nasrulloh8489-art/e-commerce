(async function () {
  hydrateIcons();
  await Shop.load();
  const S = Shop.settings;

  // Тексты из настроек
  $$("[data-free-from]").forEach((el) => (el.textContent = Shop.price(S.freeShippingFrom)));
  $("#year").textContent = new Date().getFullYear();
  const phone = $("#footPhone");
  phone.textContent = S.storePhone || "";
  phone.href = "tel:" + String(S.storePhone || "").replace(/[^\d+]/g, "");
  const wa = $("#footWa");
  if (S.storeWhatsapp) wa.href = "https://wa.me/" + S.storeWhatsapp;
  else wa.parentElement.remove();
  $("#footAddr").textContent = S.pickupAddress ? "Самовывоз: " + S.pickupAddress : "";

  const P = Shop.products;

  // Карточки вокруг модели в hero
  const floats = ["p14", "p8", "p17", "p11"].map((id) => Shop.byId.get(id)).filter(Boolean);
  const pool = floats.length >= 4 ? floats : P.slice(0, 4);
  $("#floatCards").innerHTML = pool
    .map((p, i) => `<div class="float-card c${i + 1}" data-open="${p.id}">
      <img src="${esc(Shop.img(p.image, 240))}" alt="">
      <div class="n">${esc(p.name)}</div><div class="p">${Shop.price(p.price)}</div></div>`)
    .join("");

  // Категории
  $("#cats").innerHTML = Shop.categories
    .map((c) => `<button class="cat" data-cat="${c.id}">
      <img src="${esc(Shop.img(c.image, 400))}" alt="${esc(c.name)}" loading="lazy">
      <div class="meta"><div><b>${esc(c.name)}</b><small>${P.filter((p) => p.category === c.id).length} товаров</small></div>${icon("arrow")}</div>
    </button>`)
    .join("");

  // Новинки
  const fresh = [...P.filter((p) => p.badge === "new"), ...P.filter((p) => p.badge !== "new")].slice(0, 10);
  $("#newTrack").innerHTML = fresh.map(productCard).join("");
  $$("[data-slide]").forEach((b) =>
    b.addEventListener("click", () => {
      const t = $("#newTrack");
      t.scrollBy({ left: +b.dataset.slide * (t.clientWidth * 0.8), behavior: "smooth" });
    })
  );

  // Хиты
  const hits = P.filter((p) => p.badge === "hit").sort((a, b) => b.reviews - a.reviews).slice(0, 3);
  $("#bestGrid").innerHTML = hits
    .map((p) => `<div class="best-card">
      <span class="tag hit">Хит</span>
      <div class="media" data-open="${p.id}"><img src="${esc(Shop.img(p.image, 400))}" alt="${esc(p.name)}" loading="lazy"></div>
      <div>
        <h3 data-open="${p.id}">${esc(p.name)}</h3>
        <div class="price">${Shop.price(p.price)}${p.oldPrice ? `<s>${Shop.price(p.oldPrice)}</s>` : ""}</div>
        <div class="stars" style="margin-top:4px"><i>${stars(p.rating)}</i>(${p.reviews})</div>
        <p class="desc">${esc(p.description)}</p>
        <div class="actions">
          <button class="btn btn-dark btn-sm" data-quick="${p.id}">Быстро добавить</button>
          <button class="square-btn" data-fav="${p.id}" aria-label="В избранное">${icon("heart")}</button>
        </div>
      </div>
    </div>`)
    .join("");

  // Каталог с фильтрами
  let filter = "all";
  let query = "";
  const chips = [
    { id: "all", name: "Все" },
    { id: "sale", name: "Со скидкой" },
    ...Shop.categories,
  ];
  $("#chips").innerHTML = chips.map((c) => `<button class="chip" data-chip="${c.id}">${esc(c.name)}</button>`).join("");

  function renderGrid() {
    let list = P.slice();
    if (filter === "sale") list = list.filter((p) => p.oldPrice);
    else if (filter === "new" || filter === "hit") list = list.filter((p) => p.badge === filter);
    else if (filter === "fav") list = list.filter((p) => Fav.ids.has(p.id));
    else if (filter !== "all") list = list.filter((p) => p.category === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => (p.name + " " + Shop.catName(p.category) + " " + p.description).toLowerCase().includes(q));
    }
    const sort = $("#sort").value;
    if (sort === "asc") list.sort((a, b) => a.price - b.price);
    if (sort === "desc") list.sort((a, b) => b.price - a.price);
    if (sort === "pop") list.sort((a, b) => b.reviews - a.reviews);
    if (sort === "new") list.sort((a, b) => (b.badge === "new") - (a.badge === "new"));
    $("#grid").innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty">Ничего не найдено</div>`;
    $$("[data-chip]").forEach((c) => c.classList.toggle("active", c.dataset.chip === filter));
    $("#catCount").textContent = `${list.length} ${plural(list.length, ["товар", "товара", "товаров"])}`;
    Fav.render();
  }
  function setFilter(f) {
    filter = f;
    renderGrid();
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  }
  $("#chips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-chip]");
    if (c) { filter = c.dataset.chip; renderGrid(); }
  });
  $("#sort").addEventListener("change", renderGrid);
  $("#cats").addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) setFilter(c.dataset.cat);
  });
  $$("[data-filter-link]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); setFilter(a.dataset.filterLink); })
  );
  $("#favBtn").addEventListener("click", () => {
    if (!Fav.ids.size) return toast("В избранном пока ничего нет");
    setFilter("fav");
  });

  // Поиск
  $("#searchToggle").addEventListener("click", () => {
    $("#searchBar").classList.toggle("open");
    $("#searchInput").focus();
  });
  let st;
  $("#searchInput").addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => {
      query = e.target.value.trim();
      filter = "all";
      renderGrid();
      if (query) $("#catalog").scrollIntoView({ behavior: "smooth" });
    }, 250);
  });

  // Активный пункт меню при прокрутке
  const links = $$("#nav a");
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => io.observe(s));
  links.forEach((a) => a.addEventListener("click", () => closeAll()));

  // Таймер распродажи: дата из админки или ближайшее воскресенье
  function saleEnd() {
    const fromSettings = S.flashSaleEnds && new Date(S.flashSaleEnds);
    if (fromSettings && fromSettings > new Date()) return fromSettings;
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    d.setHours(23, 59, 59, 0);
    return d;
  }
  const end = saleEnd();
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const ms = Math.max(0, end - new Date());
    const s = Math.floor(ms / 1000);
    $('[data-cd="d"]').textContent = pad(Math.floor(s / 86400));
    $('[data-cd="h"]').textContent = pad(Math.floor((s % 86400) / 3600));
    $('[data-cd="m"]').textContent = pad(Math.floor((s % 3600) / 60));
    $('[data-cd="s"]').textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  $("#subscribe").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    toast("Спасибо! Вы подписаны на новости");
  });

  renderGrid();
  Cart.render();
  Fav.render();
})();

function plural(n, f) {
  const m10 = n % 10, m100 = n % 100;
  return f[m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2];
}
