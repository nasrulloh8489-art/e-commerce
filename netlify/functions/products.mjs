import { json, isAdmin, loadCatalog, saveCatalog } from "../lib/shared.mjs";

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

function cleanProduct(p, i) {
  const price = num(p.price);
  if (!p.name || !(price > 0)) throw new Error(`Товар №${i + 1}: укажите название и цену`);
  return {
    id: String(p.id || "p" + Date.now().toString(36) + i),
    name: String(p.name).slice(0, 120),
    category: String(p.category || ""),
    price,
    oldPrice: num(p.oldPrice) > price ? num(p.oldPrice) : null,
    badge: ["new", "hit"].includes(p.badge) ? p.badge : null,
    rating: Math.min(5, Math.max(0, num(p.rating) ?? 5)),
    reviews: Math.max(0, Math.round(num(p.reviews) ?? 0)),
    sizes: (Array.isArray(p.sizes) ? p.sizes : String(p.sizes || "").split(","))
      .map((s) => String(s).trim())
      .filter(Boolean),
    image: String(p.image || ""),
    description: String(p.description || "").slice(0, 2000),
    active: p.active !== false,
  };
}

export default async (req) => {
  const catalog = await loadCatalog(req);

  if (req.method === "GET") {
    const admin = isAdmin(req);
    return json({
      categories: catalog.categories,
      settings: catalog.settings,
      products: admin ? catalog.products : catalog.products.filter((p) => p.active !== false),
    });
  }

  if (req.method === "PUT") {
    if (!isAdmin(req)) return json({ error: "Нет доступа" }, 401);
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Неверный JSON" }, 400);
    }
    try {
      if (body.products) catalog.products = body.products.map(cleanProduct);
      if (body.settings) {
        const s = body.settings;
        catalog.settings = {
          ...catalog.settings,
          storeName: String(s.storeName ?? catalog.settings.storeName),
          currency: String(s.currency ?? catalog.settings.currency).slice(0, 4),
          courierPrice: Math.max(0, Number(s.courierPrice ?? catalog.settings.courierPrice) || 0),
          freeShippingFrom: Math.max(0, Number(s.freeShippingFrom ?? catalog.settings.freeShippingFrom) || 0),
          pickupAddress: String(s.pickupAddress ?? catalog.settings.pickupAddress),
          storePhone: String(s.storePhone ?? catalog.settings.storePhone),
          storeWhatsapp: String(s.storeWhatsapp ?? catalog.settings.storeWhatsapp).replace(/\D/g, ""),
          flashSaleEnds: String(s.flashSaleEnds ?? catalog.settings.flashSaleEnds ?? ""),
        };
      }
    } catch (e) {
      return json({ error: e.message }, 400);
    }
    await saveCatalog(catalog);
    return json({ ok: true, catalog });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/products" };
