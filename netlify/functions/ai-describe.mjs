/**
 * AI-генератор описаний товаров.
 * POST /api/ai-describe  (только для админа)
 * body: { name, category, price, sizes, notes }
 * ответ: { description }
 *
 * Поток данных: админка → эта функция → Claude API → описание → админка.
 * API-ключ живёт только здесь, на сервере (переменная ANTHROPIC_API_KEY).
 */
import Anthropic from "@anthropic-ai/sdk";
import { json, isAdmin, loadCatalog } from "../lib/shared.mjs";

// 1. System prompt — «роль» модели и правила. Он одинаковый для всех запросов.
const SYSTEM = `Ты — копирайтер интернет-магазина одежды и обуви NovaTrend.
Пиши описания товаров для карточки на сайте.

Правила:
- Язык: русский. Длина: 1–3 коротких предложения (до 300 символов).
- Тон: живой, уверенный, без канцелярита и восклицательных знаков.
- Опирайся ТОЛЬКО на факты из запроса. Не выдумывай состав, плотность ткани, страну производства и другие характеристики, которых нет в данных.
- Ответ — только текст описания: без кавычек, заголовков, markdown и пояснений.`;

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAdmin(req)) return json({ error: "Нет доступа" }, 401);
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY не задан (добавьте его в .env и в настройки Netlify)" }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Неверный JSON" }, 400);
  }
  const name = clip(body.name, 120);
  if (!name) return json({ error: "Сначала укажите название товара" }, 400);

  // 2. Few-shot: даём модели 3 реальных описания из каталога как образец стиля.
  const catalog = await loadCatalog(req);
  const examples = catalog.products
    .filter((p) => p.description && p.name !== name)
    .slice(0, 3)
    .map((p) => `«${p.name}» → ${p.description}`)
    .join("\n");

  // 3. Пользовательское сообщение — данные конкретного товара.
  const prompt = `Примеры описаний в стиле магазина:
${examples}

Товар:
- Название: ${name}
- Категория: ${clip(body.category, 60) || "—"}
- Цена: ${clip(body.price, 20) || "—"}
- Размеры: ${clip(body.sizes, 120) || "—"}
- Заметки продавца (факты о товаре): ${clip(body.notes, 1000) || "нет"}

Напиши описание для этого товара.`;

  const client = new Anthropic(); // сам читает ANTHROPIC_API_KEY из окружения

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" }, // простая задача — меньше «размышлений», быстрее и дешевле
      // Если модель откажет по соображениям безопасности, API сам повторит запрос на запасной модели
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "Модель отказалась генерировать описание для этого товара" }, 422);
    }

    // Ответ — массив блоков; берём только текстовые.
    const description = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .slice(0, 2000);

    return json({ description, usage: response.usage });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "Неверный ANTHROPIC_API_KEY" }, 500);
    if (e instanceof Anthropic.RateLimitError) return json({ error: "Слишком много запросов, попробуйте через минуту" }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: `Ошибка Claude API (${e.status}): ${e.message}` }, 502);
    return json({ error: "Не удалось связаться с Claude API" }, 502);
  }
};

export const config = { path: "/api/ai-describe" };
