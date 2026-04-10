export {};

const API_PRIMARY = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
const API_FALLBACK = "https://latest.currency-api.pages.dev/v1/currencies";

const rateCache = new Map<string, { rate: number; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

async function fetchRate(fromCode: string, toCode: string): Promise<number> {
  if (fromCode === toCode) return 1;

  const cacheKey = `${fromCode}_${toCode}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rate;

  const endpoint = `/${fromCode}.min.json`;
  let data: Record<string, Record<string, number>> | null = null;

  try {
    const res = await fetch(API_PRIMARY + endpoint);
    if (res.ok) data = await res.json() as typeof data;
  } catch { /* fall through to fallback */ }

  if (!data) {
    const res = await fetch(API_FALLBACK + endpoint);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    data = await res.json() as typeof data;
  }

  const rate = data?.[fromCode]?.[toCode];
  if (typeof rate !== "number") throw new Error(`No ${toCode.toUpperCase()} rate for ${fromCode.toUpperCase()}`);

  rateCache.set(cacheKey, { rate, ts: Date.now() });
  return rate;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "fetchRate") {
    fetchRate(msg.from, msg.to)
      .then((rate) => sendResponse({ rate }))
      .catch((err) => sendResponse({ error: err instanceof Error ? err.message : "Conversion failed" }));
    return true; // keep channel open for async response
  }
});
