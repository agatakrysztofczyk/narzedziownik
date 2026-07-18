// ==========================
// Helper testowy: wczytuje realną stronę (index.html + db.js + app.js)
// w środowisku jsdom, tak jak zrobiłaby to prawdziwa przeglądarka —
// ale bez dostępu do sieci (Dexie i IndexedDB brane z lokalnych paczek
// npm zamiast z CDN/prawdziwej przeglądarki, tools.csv czytany z dysku).
//
// Skrypty uruchamiamy RĘCZNIE (a nie automatycznie przez jsdom), żeby
// zdążyć podstawić fake-indexeddb na "window" zanim Dexie spróbuje
// go użyć.
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
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf-8");
  const errors = [];

  // "outside-only" = jsdom NIE wykonuje automatycznie <script> - zrobimy to
  // sami, ręcznie, w kontrolowanej kolejności.
  const dom = new JSDOM(html, {
    url: "https://agatakrysztofczyk.github.io/narzedziownik/index.html",
    runScripts: "outside-only",
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

  // Uruchamiamy skrypty w tej samej kolejności co w index.html.
  try {
    window.eval(dexieSrc);
    window.eval(dbSrc);
    window.eval(appSrc);
  } catch (err) {
    errors.push(err.message);
  }

  // app.js nasłuchuje na zdarzenie "load" strony, żeby zaimportować dane
  // i wyrenderować listę - odpalamy je ręcznie, bo skrypty nie zostały
  // uruchomione automatycznie przy parsowaniu HTML.
  window.dispatchEvent(new window.Event("load"));

  // Czekamy, aż operacje asynchroniczne (import CSV, budowa filtrów, render)
  // zdążą się zakończyć.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return { dom, errors };
}

module.exports = { loadPage };
