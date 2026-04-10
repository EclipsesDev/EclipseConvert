export {};

const host = document.createElement("eclipse-convert");
host.style.cssText = "position:absolute;top:0;left:0;z-index:2147483647;pointer-events:none;";
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: "closed" });

const style = document.createElement("style");
style.textContent = `
  :host { all: initial; }
  .ec-btn {
    position: absolute;
    pointer-events: auto;
    padding: 10px 18px;
    background: #1a1a2e;
    color: #fff;
    border: 1px solid #444;
    border-radius: 8px;
    cursor: pointer;
    font: 15px system-ui, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .ec-btn:hover { background: #2a2a4e; }
  .ec-btn img {
    width: 50px; 
    height: 50px;
    vertical-align: middle;
    margin-right: 4px;
  }
  .ec-popup {
    position: absolute;
    pointer-events: auto;
    padding: 20px 24px;
    background: #1a1a2e;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 10px;
    font: 15px system-ui, sans-serif;
    max-width: 400px;
    word-wrap: break-word;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .ec-popup .ec-label { color: #888; font-size: 13px; margin-bottom: 8px; white-space: nowrap; }
  .ec-popup .ec-value { font-size: 24px; font-weight: 600; color: #4fc3f7; white-space: nowrap; }
  .ec-popup .ec-error { color: #ef5350; }
`;
shadow.appendChild(style);

const ICON_URL = chrome.runtime.getURL("icons/icon.png");

const SYMBOL_TO_CODE: Record<string, string> = {
  "€": "eur", "£": "gbp", "¥": "jpy", "₹": "inr", "₩": "krw",
  "₽": "rub", "₺": "try", "₿": "btc", "R$": "brl", "kr": "sek",
  "zł": "pln", "₫": "vnd", "฿": "thb", "₴": "uah", "₦": "ngn",
  "RM": "myr", "₱": "php", "₸": "kzt", "лв": "bgn", "Kč": "czk", 
  "CA$": "cad", "C$": "cad", "$": "usd"
};

const ISO_CODES = new Set([
  "usd","eur","gbp","jpy","cny","inr","aud","cad","chf","hkd",
  "sgd","sek","nok","dkk","nzd","krw","mxn","brl","zar","rub",
  "try","pln","thb","idr","myr","php","czk","huf","ils","clp",
  "ars","cop","pen","uah","vnd","egp","ngn","kes","aed","sar",
  "qar","kwd","bhd","omr","pkr","bdt","lkr","mmk","kzt","uzs",
  "gel","ron","bgn","hrk","btc","eth","ltc","xrp","doge",
]);

interface ParsedCurrency {
  amount: number;
  code: string;
  original: string;
}

function parseCurrency(text: string): ParsedCurrency | null {
  const cleaned = text.trim();

  for (const [symbol, code] of Object.entries(SYMBOL_TO_CODE)) {
    if (cleaned.startsWith(symbol)) {
      const numStr = cleaned.slice(symbol.length).trim().replace(/,/g, "");
      const amount = parseFloat(numStr);
      if (!isNaN(amount) && amount > 0) return { amount, code, original: cleaned };
    }
  }

  for (const [symbol, code] of Object.entries(SYMBOL_TO_CODE)) {
    if (cleaned.endsWith(symbol)) {
      const numStr = cleaned.slice(0, -symbol.length).trim().replace(/,/g, "");
      const amount = parseFloat(numStr);
      if (!isNaN(amount) && amount > 0) return { amount, code, original: cleaned };
    }
  }

  const codeFirst = cleaned.match(/^([a-zA-Z]{3})\s*([\d,]+\.?\d*)$/);
  if (codeFirst) {
    const code = codeFirst[1]!.toLowerCase();
    const amount = parseFloat(codeFirst[2]!.replace(/,/g, ""));
    if (ISO_CODES.has(code) && !isNaN(amount) && amount > 0) {
      return { amount, code, original: cleaned };
    }
  }

  const codeLast = cleaned.match(/^([\d,]+\.?\d*)\s*([a-zA-Z]{3})$/);
  if (codeLast) {
    const amount = parseFloat(codeLast[1]!.replace(/,/g, ""));
    const code = codeLast[2]!.toLowerCase();
    if (ISO_CODES.has(code) && !isNaN(amount) && amount > 0) {
      return { amount, code, original: cleaned };
    }
  }

  return null;
}

function getTargetCurrency(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("targetCurrency", (result) => {
      resolve((result["targetCurrency"] as string | undefined) ?? "usd");
    });
  });
}

function fetchRate(fromCode: string, toCode: string): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "fetchRate", from: fromCode, to: toCode }, (res) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (res?.error) {
        reject(new Error(res.error));
      } else {
        resolve(res.rate);
      }
    });
  });
}

let floatingBtn: HTMLButtonElement | null = null;
let popup: HTMLDivElement | null = null;

function removeFloatingBtn() {
  floatingBtn?.remove();
  floatingBtn = null;
}

function removePopup() {
  popup?.remove();
  popup = null;
}

async function createFloatingBtn(x: number, y: number, parsed: ParsedCurrency) {
  removeFloatingBtn();
  removePopup();

  const target = await getTargetCurrency();
  if (parsed.code === target) return;

  floatingBtn = document.createElement("button");
  floatingBtn.className = "ec-btn";
  const img = document.createElement("img");
  img.src = ICON_URL;
  img.alt = "";
  floatingBtn.appendChild(img);
  floatingBtn.appendChild(document.createTextNode(` ${target.toUpperCase()}`));
  floatingBtn.style.left = `${x}px`;
  floatingBtn.style.top = `${y}px`;

  floatingBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPopup(x, y + 36, parsed);
    removeFloatingBtn();
  });

  shadow.appendChild(floatingBtn);
}

async function showPopup(x: number, y: number, parsed: ParsedCurrency) {
  removePopup();

  const target = await getTargetCurrency();

  popup = document.createElement("div");
  popup.className = "ec-popup";
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;

  const label = document.createElement("div");
  label.className = "ec-label";
  label.textContent = `${parsed.code.toUpperCase()} \u2192 ${target.toUpperCase()}`;

  const valueEl = document.createElement("div");
  valueEl.className = "ec-value";
  valueEl.textContent = "Loading...";

  popup.appendChild(label);
  popup.appendChild(valueEl);
  shadow.appendChild(popup);

  try {
    const rate = await fetchRate(parsed.code, target);
    const converted = parsed.amount * rate;
    valueEl.textContent = `${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${target.toUpperCase()}`;
  } catch (err) {
    valueEl.className = "ec-value ec-error";
    valueEl.textContent = err instanceof Error ? err.message : "Conversion failed";
  }
}

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (!selectedText) {
    removeFloatingBtn();
    removePopup();
    return;
  }

  const parsed = parseCurrency(selectedText);
  if (!parsed) {
    removeFloatingBtn();
    removePopup();
    return;
  }

  const range = selection!.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const x = rect.left + window.scrollX;
  const y = rect.bottom + window.scrollY + 6;

  createFloatingBtn(x, y, parsed);
});

document.addEventListener("mousedown", (e) => {
  const path = e.composedPath();
  if (path.includes(host)) return;
  removeFloatingBtn();
  removePopup();
});