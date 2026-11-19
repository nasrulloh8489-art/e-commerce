(async function () {
  hydrateIcons();
  await Shop.load();
  const S = Shop.settings;
  const form = $("#orderForm");
  const F = form.elements;
  const geo = { lat: null, lng: null };

  // Подставляем сохранённые данные покупателя
  const saved = LS.get("customer", {});
  ["name", "phone", "whatsapp", "city", "address"].forEach((k) => { if (saved[k]) F[k].value = saved[k]; });
  if (saved.contact) { const r = form.querySelector(`[name=contact][value="${saved.contact}"]`); if (r) r.checked = true; }

  $("#pickupAddr").textContent = S.pickupAddress || "";
  $("#courierNote").textContent = S.freeShippingFrom
    ? `${Shop.price(S.courierPrice)}, бесплатно от ${Shop.price(S.freeShippingFrom)}`
    : Shop.price(S.courierPrice);

  const delivery = () => form.querySelector("[name=delivery]:checked").value;

  function renderSummary() {
    const lines = Cart.lines();
    if (!lines.length) {
      $("#checkoutRoot").innerHTML = `<div class="success">
        <div class="ok-icon" style="background:var(--soft);color:#999">${icon("bag")}</div>
        <h1>Корзина пуста</h1><p>Добавьте товары из каталога, чтобы оформить заказ.</p>
        <a href="/#catalog" class="btn btn-dark" style="margin-top:16px">Перейти в каталог</a></div>`;
      return false;
    }
    $("#sumLines").innerHTML = lines.map((l) => lineHTML(l, true)).join("");
    const sub = Cart.subtotal();
    const ship = Shop.shippingFor(sub, delivery());
    $("#sumSub").textContent = Shop.price(sub);
    $("#sumShip").textContent = ship ? Shop.price(ship) : "Бесплатно";
    $("#sumTotal").textContent = Shop.price(sub + ship);
    return true;
  }
  // перерисовываем итог при изменении количества
  const origRender = Cart.render.bind(Cart);
  Cart.render = () => { origRender(); renderSummary(); };
  if (!renderSummary()) return;

  form.addEventListener("change", (e) => {
    if (e.target.name === "delivery") {
      const pickup = delivery() === "pickup";
      $("#addressBlock").hidden = pickup;
      $("#pickupBlock").hidden = !pickup;
      renderSummary();
    }
  });

  // WhatsApp = телефон
  const sameWa = $("#sameWa");
  sameWa.addEventListener("change", () => {
    if (sameWa.checked) F.whatsapp.value = F.phone.value;
    F.whatsapp.readOnly = sameWa.checked;
  });
  F.phone.addEventListener("input", () => { if (sameWa.checked) F.whatsapp.value = F.phone.value; });

  // Телефон: только цифры, пробелы и +
  ["phone", "whatsapp"].forEach((n) =>
    F[n].addEventListener("input", (e) => { e.target.value = e.target.value.replace(/[^\d+\s()-]/g, ""); })
  );

  // Геолокация
  const geoStatus = $("#geoStatus");
  $("#geoBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      geoStatus.textContent = "Браузер не поддерживает геолокацию — укажите адрес вручную";
      geoStatus.className = "geo-status bad";
      return;
    }
    geoStatus.textContent = "Определяем местоположение…";
    geoStatus.className = "geo-status";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geo.lat = +pos.coords.latitude.toFixed(6);
        geo.lng = +pos.coords.longitude.toFixed(6);
        geoStatus.innerHTML = `Местоположение получено (точность ~${Math.round(pos.coords.accuracy)} м). <a href="https://maps.google.com/?q=${geo.lat},${geo.lng}" target="_blank" rel="noopener" style="text-decoration:underline">Проверить на карте</a>`;
        geoStatus.className = "geo-status ok";
        const d = 0.004;
        $("#map").innerHTML = `<iframe loading="lazy" title="Карта" src="https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng - d},${geo.lat - d},${geo.lng + d},${geo.lat + d}&layer=mapnik&marker=${geo.lat},${geo.lng}"></iframe>`;
        $("#map").classList.add("show");
        $("#address").classList.remove("err");
      },
      (err) => {
        geoStatus.textContent = err.code === 1
          ? "Доступ к геолокации запрещён — разрешите его в браузере или укажите адрес"
          : "Не удалось определить местоположение — укажите адрес вручную";
        geoStatus.className = "geo-status bad";
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });

  // Отправка
  const errBox = $("#formError");
  const showErr = (msg, field) => {
    errBox.textContent = msg;
    errBox.classList.add("show");
    if (field) { field.classList.add("err"); field.focus(); }
  };
  form.addEventListener("input", (e) => e.target.classList?.remove("err"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.classList.remove("show");
    const digits = (s) => s.replace(/\D/g, "");
    const name = F.name.value.trim();
    const phone = F.phone.value.trim();
    const whatsapp = F.whatsapp.value.trim();
    if (name.length < 2) return showErr("Укажите ваше имя", F.name);
    if (digits(phone).length < 7 && digits(whatsapp).length < 7) return showErr("Укажите номер телефона или WhatsApp", F.phone);
    const contact = form.querySelector("[name=contact]:checked").value;
    if (contact === "whatsapp" && digits(whatsapp).length < 7) return showErr("Вы выбрали связь через WhatsApp — укажите номер WhatsApp", F.whatsapp);
    if (delivery() === "courier" && !F.address.value.trim() && !geo.lat)
      return showErr("Укажите адрес доставки или отправьте своё местоположение", F.address);

    const payload = {
      customer: {
        name, phone, whatsapp, contact,
        city: F.city.value.trim(),
        address: F.address.value.trim(),
        comment: F.comment.value.trim(),
        lat: geo.lat, lng: geo.lng,
      },
      delivery: delivery(),
      payment: form.querySelector("[name=payment]:checked").value,
      items: Cart.items,
      website: F.website.value,
    };
    LS.set("customer", { name, phone, whatsapp, contact, city: payload.customer.city, address: payload.customer.address });

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Отправляем заказ…";
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "Не удалось оформить заказ. Попробуйте ещё раз.");
      Cart.clear();
      const how = { call: "позвоним вам", whatsapp: "напишем вам в WhatsApp", telegram: "напишем вам в Telegram" }[contact];
      const waShop = S.storeWhatsapp
        ? `<a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/${S.storeWhatsapp}?text=${encodeURIComponent("Здравствуйте! Мой заказ " + data.id)}">${icon("whatsapp")} Написать нам</a>`
        : "";
      $("#checkoutRoot").innerHTML = `<div class="success">
        <div class="ok-icon">${icon("check")}</div>
        <h1>Спасибо за заказ!</h1>
        <p>Номер вашего заказа:</p>
        <div class="order-no">${esc(data.id)}</div>
        <p>Мы скоро ${how}, чтобы подтвердить заказ и согласовать время доставки.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px">
          <a href="/" class="btn btn-dark">На главную</a>${waShop}
        </div></div>`;
      window.scrollTo({ top: 0 });
    } catch (err) {
      showErr(err.message === "Failed to fetch" ? "Нет соединения с сервером. Проверьте интернет." : err.message);
      btn.disabled = false;
      btn.textContent = "Подтвердить заказ";
    }
  });
})();
