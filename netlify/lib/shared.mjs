import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

export const STATUSES = {
  new: "Новый",
  confirmed: "Подтверждён",
  shipping: "В доставке",
  done: "Выполнен",
  canceled: "Отменён",
};

export const shopStore = () => getStore({ name: "shop", consistency: "strong" });
export const ordersStore = () => getStore({ name: "orders", consistency: "strong" });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const given = req.headers.get("x-admin-key") || "";
  if (!expected || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Каталог из базы. При первом запуске заполняется из /data/products.json */
export async function loadCatalog(req) {
  const store = shopStore();
  let catalog = await store.get("catalog", { type: "json" });
  if (!catalog) {
    const res = await fetch(new URL("/data/products.json", req.url));
    catalog = await res.json();
    await store.setJSON("catalog", catalog);
  }
  return catalog;
}

export const saveCatalog = (catalog) => shopStore().setJSON("catalog", catalog);

export const money = (n, cur = "$") => `${cur}${Number(n).toFixed(2)}`;

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

