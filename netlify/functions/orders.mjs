import {
  json, isAdmin, loadCatalog, ordersStore, STATUSES,
} from "../lib/shared.mjs";

const CONTACTS = { call: "Звонок", whatsapp: "WhatsApp", telegram: "Telegram" };
const round = (n) => Math.round(n * 100) / 100;
const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);

function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NT-${ymd}-${rnd}`;
}

async function createOrder(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Неверные данные" }, 400);
  }

  // Ловушка для ботов: скрытое поле должно остаться пустым
  if (body.website) return json({ ok: true, id: "NT-000000-0000" });

  const c = body.customer || {};
  const customer = {
    name: str(c.name, 80),
    phone: str(c.phone, 30),
    whatsapp: str(c.whatsapp, 30),
    contact: CONTACTS[c.contact] ? c.contact : "call",
    city: str(c.city, 80),
    address: str(c.address, 300),
    comment: str(c.comment, 1000),
    lat: Number.isFinite(+c.lat) && c.lat !== "" && c.lat !== null ? +(+c.lat).toFixed(6) : null,
    lng: Number.isFinite(+c.lng) && c.lng !== "" && c.lng !== null ? +(+c.lng).toFixed(6) : null,
  };
  customer.contactLabel = CONTACTS[customer.contact];
  const delivery = body.delivery === "pickup" ? "pickup" : "courier";
  const payment = body.payment === "card" ? "card" : "cash";

  const digits = (s) => s.replace(/\D/g, "");
  if (customer.name.length < 2) return json({ error: "Укажите имя" }, 400);
  if (digits(customer.phone).length < 7 && digits(customer.whatsapp).length < 7)
    return json({ error: "Укажите номер телефона или WhatsApp" }, 400);
  if (delivery === "courier" && !customer.address && !(customer.lat && customer.lng))
    return json({ error: "Укажите адрес или отправьте местоположение" }, 400);

  const catalog = await loadCatalog(req);
  const byId = new Map(catalog.products.filter((p) => p.active !== false).map((p) => [p.id, p]));
  const items = [];
  for (const it of Array.isArray(body.items) ? body.items.slice(0, 50) : []) {
    const p = byId.get(String(it.id));
    const qty = Math.min(99, Math.max(1, parseInt(it.qty, 10) || 1));
    if (!p) continue;
    const size = p.sizes.includes(it.size) ? it.size : p.sizes[0] || "—";
    items.push({ id: p.id, name: p.name, image: p.image, size, qty, price: p.price });
  }
  if (!items.length) return json({ error: "Корзина пуста или товары больше недоступны" }, 400);

  const s = catalog.settings;
  // Цены всегда пересчитываются на сервере — клиенту не доверяем
  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shipping =
    delivery === "pickup" || (s.freeShippingFrom > 0 && subtotal >= s.freeShippingFrom) ? 0 : round(s.courierPrice);

  const order = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: "new",
    customer,
    delivery,
    payment,
    items,
    subtotal,
    shipping,
    total: round(subtotal + shipping),
    currency: s.currency,
    history: [{ status: "new", at: new Date().toISOString(), by: "site" }],
  };

  await ordersStore().setJSON(order.id, order);

  return json({ ok: true, id: order.id, total: order.total });
}

async function listOrders() {
  const store = ordersStore();
  const { blobs } = await store.list();
  const orders = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ orders, statuses: STATUSES });
}

async function updateOrder(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const { status } = await req.json().catch(() => ({}));
  if (!id || !STATUSES[status]) return json({ error: "Неверный запрос" }, 400);
  const store = ordersStore();
  const order = await store.get(id, { type: "json" });
  if (!order) return json({ error: "Заказ не найден" }, 404);
  order.status = status;
  order.history = [...(order.history || []), { status, at: new Date().toISOString(), by: "admin" }];
  await store.setJSON(id, order);
  return json({ ok: true, order });
}

async function deleteOrder(req) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ error: "Нет id" }, 400);
  await ordersStore().delete(id);
  return json({ ok: true });
}

export default async (req) => {
  if (req.method === "POST") return createOrder(req);
  if (!isAdmin(req)) return json({ error: "Нет доступа" }, 401);
  if (req.method === "GET") return listOrders();
  if (req.method === "PATCH") return updateOrder(req);
  if (req.method === "DELETE") return deleteOrder(req);
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/orders" };
