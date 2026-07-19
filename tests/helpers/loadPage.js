// ==========================
// Helper testowy: wczytuje realną stronę (index.html + db.js + app.js)
// w środowisku jsdom, tak jak zrobiłaby to prawdziwa przeglądarka —
// ale bez dostępu do sieci (Dexie i IndexedDB brane z lokalnych paczek
// npm zamiast z CDN/prawdziwej przeglądarki, tools.csv czytany z dysku).
//
// Skrypty dodajemy jako prawdziwe elementy <script> (tak jak przeglądarka),
// a NIE przez eval() - to ważne, bo `const`/`let` zadeklarowane na
// najwyższym poziomie w eval() znika po zakończeniu eval(), podczas gdy
// w prawdziwych <script> tagach (i tak jak w index.html) zostaje
// widoczne dla kolejnych skryptów na stronie (np. `db.js` deklaruje
// `const db`, z którego korzysta późniejszy `app.js`).
// ==========================

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { indexedDB, IDBKeyRange } = require("fake-indexeddb");

const repoRoot = path.resolve(__dirname, "..", "..");

/**
 * Wczytuje stronę i czeka, aż się w pełni zainicjuje (import CSV,
 * zbudowanie filtrów, pierwsze wyrenderowanie listy).
 * Zwraca { dom, errors } - errors to lista błędów JS złapanych w trakcie ładowania.
 */
async function loadPage() {
  let html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf-8");

  // Usuwamy oryginalne <script> - dodamy je ręcznie, PO podstawieniu
  // fake-indexeddb, żeby Dexie (w db.js) na pewno je zastało.
  html = html.replace(/<script[^>]*><\/script>/g, "");

  const errors = [];

  const dom = new JSDOM(html, {
    url: "https://agatakrysztofczyk.github.io/narzedziownik/index.html",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });

  const { window } = dom;

  window.addEventListener("error", (e) => {
    errors.push(e.error ? e.error.message : e.message);
  });
  window.addEventListener("unhandledrejection", (e) => {
    errors.push(e.reason ? (e.reason.message || String(e.reason)) : "unhandled rejection");
  });

  // Podstawiamy IndexedDB (fake-indexeddb), zanim jakikolwiek skrypt się wykona.
  window.indexedDB = indexedDB;
  window.IDBKeyRange = IDBKeyRange;

  // Podstawiony fetch() - czyta tools.csv bezpośrednio z dysku zamiast przez sieć.
  window.fetch = async (url) => {
    const localPath = path.join(repoRoot, url);
    if (fs.existsSync(localPath)) {
      const text = fs.readFileSync(localPath, "utf-8");
      return { ok: true, text: async () => text };
    }
    return { ok: false, text: async () => "" };
  };

  const dexieSrc = fs.readFileSync(
    path.join(repoRoot, "node_modules", "dexie", "dist", "dexie.js"),
    "utf-8"
  );
  const dbSrc = fs.readFileSync(path.join(repoRoot, "db.js"), "utf-8");
  const appSrc = fs.readFileSync(path.join(repoRoot, "app.js"), "utf-8");

  // Dodajemy skrypty jako prawdziwe elementy <script>, w tej samej
  // kolejności co w index.html - top-level `const`/`let` z jednego
  // skryptu zostają widoczne dla kolejnych (dokładnie jak w przeglądarce).
  for (const src of [dexieSrc, dbSrc, appSrc]) {
    const scriptEl = window.document.createElement("script");
    scriptEl.textContent = src;
    window.document.body.appendChild(scriptEl);
  }

  // app.js nasłuchuje na zdarzenie "load" strony, żeby zaimportować dane
  // i wyrenderować listę - odpalamy je ręcznie, bo doszliśmy tu już po
  // naturalnym "load" (skrypty zostały dodane już po sparsowaniu HTML).
  window.dispatchEvent(new window.Event("load"));

  // Czekamy, aż operacje asynchroniczne (import CSV, budowa filtrów, render)
  // zdążą się zakończyć.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return { dom, errors };
}

module.exports = { loadPage };
