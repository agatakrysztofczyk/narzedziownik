// ==========================
// NARZĘDZIOWNIK – app.js (PWA + IndexedDB + modal + ukryty formularz)
// ==========================

// --- Elementy interfejsu ---
const form = document.getElementById("toolForm");
const list = document.getElementById("toolsList");
const searchInput = document.getElementById("searchInput");
const cancelEditBtn = document.getElementById("cancelEdit");
const offlineStatus = document.getElementById("offlineStatus");
const hashtagFilter = document.getElementById("hashtagFilter");
const categoryFilter = document.getElementById("categoryFilter");
const activeFiltersBox = document.getElementById("activeFilters");
const toggleHashtagsBtn = document.getElementById("toggleHashtagsBtn");
const formToggleBtn = document.getElementById("toggleFormBtn"); // nowy przycisk
const modal = document.getElementById("toolModal");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");
const resultsCount = document.getElementById("resultsCount");
const clearAllFiltersBtn = document.getElementById("clearAllFiltersBtn");

// --- Stan filtrów ---
let activeTags = new Set();   // zaznaczone hasztagi (przechowywane jako "#token")
let activeCategory = "";      // wybrana kategoria
let hashtagsExpanded = false; // czy "Na co pomaga" jest rozwinięte
const HASHTAGS_COLLAPSED_COUNT = 14;

// ==========================
// SŁOWNIK ETYKIET HASZTAGÓW
// W danych zostaje "#token" (do pozycjonowania), na ekranie pokazujemy
// czytelną etykietę ze spacjami i bez "#".
// ==========================
const TAG_LABELS = {
  "przeciążenie": "przeciążenie",
  "samokrytyka": "samokrytyka",
  "smutek": "smutek",
  "osamotnienie": "osamotnienie",
  "uspokojenieciała": "uspokojenie ciała",
  "panika": "panika",
  "lęk": "lęk",
  "nadmiernepobudzenie": "nadmierne pobudzenie",
  "trzęsiemnie": "trzęsie mnie",
  "kołatanieserca": "kołatanie serca",
  "płytkioddech": "płytki oddech",
  "niepokój": "niepokój",
  "uspokojenieoddechu": "uspokojenie oddechu",
  "drażliwość": "drażliwość",
  "pośpiechwmyślach": "pośpiech w myślach",
  "ściskwklatce": "ścisk w klatce",
  "chcemisiępłakać": "chce mi się płakać",
  "napięcie": "napięcie",
  "potrzebaukojenia": "potrzeba ukojenia",
  "odrealnienie": "odrealnienie",
  "dysocjacja": "dysocjacja",
  "gonitwamyśli": "gonitwa myśli",
  "tuiteraz": "tu i teraz",
  "napiętemięśnie": "napięte mięśnie",
  "stres": "stres",
  "bezsenność": "bezsenność",
  "bólnapięciowy": "ból napięciowy",
  "pocenie": "pocenie",
  "drżenie": "drżenie",
  "napadlęku": "napad lęku",
  "gorącowciele": "gorąco w ciele",
  "złość": "złość",
  "impulsywność": "impulsywność",
  "pobudzenie": "pobudzenie",
  "reset": "reset",
  "wyciszenie": "wyciszenie",
  "napięciemięśni": "napięcie mięśni",
  "relaksprzedsnem": "relaks przed snem",
  "zastój": "zastój",
  "apatia": "apatia",
  "odpoczynek": "odpoczynek",
  "regeneracja": "regeneracja",
  "resetciała": "reset ciała",
  "frustracja": "frustracja"
};

// Zamienia "#token" na czytelną etykietę. Brak w słowniku => zdejmuje samo "#".
function tagLabel(tag) {
  const token = (tag || "").replace(/^#/, "");
  return TAG_LABELS[token] || token;
}

// --- Obsługa trybu offline ---
window.addEventListener("online", () => offlineStatus.textContent = "🟢 online");
window.addEventListener("offline", () => offlineStatus.textContent = "🔴 offline");

// --- Rejestracja Service Workera ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/narzedziownik/service-worker.js");
}

// ==========================
// DARK MODE - przełącznik
// ==========================
const body = document.body;
const themeToggleBtn = document.getElementById("toggleThemeBtn");
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  themeToggleBtn.textContent = "☀️ Tryb jasny";
}
themeToggleBtn.addEventListener("click", () => {
  body.classList.toggle("dark");
  const isDark = body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggleBtn.textContent = isDark ? "☀️ Tryb jasny" : "🌙 Tryb ciemny";
});

// ==========================
// FORMULARZ – ukrywanie/pokazywanie
// ==========================
document.getElementById("formSection").style.display = "none";
formToggleBtn.addEventListener("click", () => {
  const formSection = document.getElementById("formSection");
  const visible = formSection.style.display === "block";
  formSection.style.display = visible ? "none" : "block";
  formToggleBtn.textContent = visible ? "➕ Dodaj nowe narzędzie" : "✖️ Ukryj formularz";
  if (!visible) {
    // Pokazujemy formularz do DODANIA nowego narzędzia - lista kategorii
    // ma być pusta/aktualna (bez wybranej wartości).
    populateFormCategorySelect("");
  }
  // Po pokazaniu formularza wyśrodkuj widok tak, by oba przyciski były widoczne
  if (!visible) {
    const top = formToggleBtn.getBoundingClientRect().top + window.scrollY;
    const bottom = formSection.getBoundingClientRect().bottom + window.scrollY;
    const region = bottom - top;
    const target = top - Math.max(0, (window.innerHeight - region) / 2);
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }
});

// Prosta ucieczka znaków specjalnych, żeby nazwa pliku grafiki mogła
// być bezpiecznie osadzona w atrybucie HTML/wywołaniu JS w onerror.
function escapeForAttribute(str) {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

// Zamiast cichego ukrywania obrazka (jak wcześniej), pokazujemy czytelny
// placeholder z informacją, jaki plik się nie wczytał - pomocne przy
// dodawaniu narzędzia, gdy w polu "grafika" jest literówka w nazwie pliku.
function handleImageError(imgEl, filename) {
  const placeholder = document.createElement("div");
  placeholder.className = "image-error-placeholder";
  placeholder.textContent = `⚠️ Nie udało się wczytać grafiki: ${filename}`;
  imgEl.replaceWith(placeholder);
}


async function renderTools(tools = null) {
  const all = tools || await getAllTools();
  list.innerHTML = "";

  if (all.length === 0) {
    list.innerHTML = "<p>Brak narzędzi spełniających wybrane filtry.</p>";
    return;
  }

  all.forEach(tool => {
    const card = document.createElement("div");
    card.className = "card";
    card.addEventListener("click", () => openToolModal(tool)); // otwieranie modala

    const namePL = tool.nazwaPL ? `<h3>${tool.nazwaPL}</h3>` : "";
    const nameEN = tool.nazwaEN ? `<h4>${tool.nazwaEN}</h4>` : "";
    const grafika = tool.grafika
      ? `<img class="card-image" src="grafiki/${tool.grafika}" alt="" loading="lazy" onerror="handleImageError(this, '${escapeForAttribute(tool.grafika)}')">`
      : "";

    card.innerHTML = `
      ${grafika}
      ${namePL || nameEN || "<h3>Bez nazwy</h3>"}
      ${tool.kategoria ? `<p><strong>Kategoria:</strong> <span>${tool.kategoria}</span></p>` : ""}
      ${tool.potrzebne ? `<p><strong>Potrzebne:</strong> <span>${tool.potrzebne}</span></p>` : ""}
      ${tool.efekt ? `<p><strong>Efekt:</strong> <span>${tool.efekt}</span></p>` : ""}
      ${tool.czasEfektu ? `<p><strong>Czas efektu:</strong> <span>${tool.czasEfektu}</span></p>` : ""}
      ${tool.przeciwskazania ? `<p><strong>Przeciwwskazania:</strong> <span>${tool.przeciwskazania}</span></p>` : ""}
    `;
    list.appendChild(card);
  });
}

// ==========================
// MODAL – pełne szczegóły narzędzia
// ==========================
function openToolModal(tool) {
  modal.style.display = "block";
  const grafika = tool.grafika
    ? `<img class="modal-image" src="grafiki/${tool.grafika}" alt="" onerror="handleImageError(this, '${escapeForAttribute(tool.grafika)}')">`
    : "";
  modalContent.innerHTML = `
    ${grafika}
    <h2>${tool.nazwaPL || tool.nazwaEN || "Bez nazwy"}</h2>
    ${tool.nazwaEN ? `<p><strong>Nazwa (EN):</strong> ${tool.nazwaEN}</p>` : ""}
    ${tool.kategoria ? `<p><strong>Kategoria:</strong> ${tool.kategoria}</p>` : ""}
    ${tool.potrzebne ? `<p><strong>Co będzie potrzebne do wykonania?:</strong><br><span style="white-space: pre-line;">${tool.potrzebne}</span></p>` : ""}
    ${tool.efekt ? `<p><strong>Jaki daje efekt?:</strong><br><span style="white-space: pre-line;">${tool.efekt}</span></p>` : ""}
    ${tool.czasEfektu ? `<p><strong>Po jakim czasie można zauważyć efekt?:</strong><br><span style="white-space: pre-line;">${tool.czasEfektu}</span></p>` : ""}
    ${tool.przeciwskazania ? `<p><strong>Przeciwwskazania:</strong><br><span style="white-space: pre-line;">${tool.przeciwskazania}</span></p>` : ""}
    ${tool.instrukcja ? `<p><strong>Instrukcja:</strong><br><span style="white-space: pre-line;">${tool.instrukcja}</span></p>` : ""}
    ${tool.linkYoutube ? `<p><strong>🎥 Link do YouTube:</strong> <a href="${tool.linkYoutube}" target="_blank">${tool.linkYoutube}</a></p>` : ""}
    ${tool.linkWWW ? `<p><strong>🌐 Link do strony:</strong> <a href="${tool.linkWWW}" target="_blank">${tool.linkWWW}</a></p>` : ""}
    ${tool.nurt ? `<p><strong>W jakim nurcie psychoterapii jest wykorzystywane?:</strong> ${tool.nurt}</p>` : ""}
    ${tool.hasztagi?.length ? `<p><strong>Na co pomaga:</strong> ${(tool.hasztagi || []).map(h => `<span class="tag">${tagLabel(h)}</span>`).join(" ")}</p>` : ""}
    <button id="closeModalBtnInner" class="close-modal-btn" aria-label="Zamknij okno">×</button>
  `;

  document.getElementById("closeModalBtnInner").addEventListener("click", closeModal);
}

function closeModal() {
  modal.style.display = "none";
  modalContent.innerHTML = "";
}

// ==========================
// PANEL FILTRÓW (zintegrowany)
// ==========================

// Lista rozwijana z kategoriami – budowana z danych
async function buildCategoryOptions() {
  if (!categoryFilter) return;
  const tools = await getAllTools();
  const cats = [...new Set(tools.map(t => t.kategoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pl"));
  const current = activeCategory;
  categoryFilter.innerHTML = '<option value="">Wszystkie kategorie</option>';
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });
  categoryFilter.value = current;
}

// Lista rozwijana z kategoriami w formularzu dodawania/edycji narzędzia,
// z opcją "dodaj nową kategorię" na końcu. Wywoływana za każdym razem,
// gdy formularz się pokazuje, żeby lista była zawsze aktualna.
async function populateFormCategorySelect(selectedValue = "") {
  const kategoriaSelect = document.getElementById("kategoria");
  if (!kategoriaSelect) return;

  const tools = await getAllTools();
  const cats = [...new Set(tools.map(t => t.kategoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pl"));

  kategoriaSelect.innerHTML = '<option value="">— wybierz kategorię —</option>';
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    kategoriaSelect.appendChild(opt);
  });

  const nowaOpt = document.createElement("option");
  nowaOpt.value = "__new__";
  nowaOpt.textContent = "➕ Dodaj nową kategorię…";
  kategoriaSelect.appendChild(nowaOpt);

  // Jeśli edytowane narzędzie ma kategorię, której z jakiegoś powodu
  // nie ma jeszcze na liście, dodajemy ją, żeby się nie zgubiła.
  if (selectedValue && !cats.includes(selectedValue) && selectedValue !== "__new__") {
    const extraOpt = document.createElement("option");
    extraOpt.value = selectedValue;
    extraOpt.textContent = selectedValue;
    kategoriaSelect.insertBefore(extraOpt, kategoriaSelect.lastChild);
  }

  kategoriaSelect.value = selectedValue;
}

// Pokazuje/ukrywa pole do wpisania nazwy nowej kategorii, w zależności
// od tego, czy w liście wybrano "➕ Dodaj nową kategorię…".
function setupKategoriaSelectListener() {
  const kategoriaSelect = document.getElementById("kategoria");
  const kategoriaNowaInput = document.getElementById("kategoriaNowa");
  if (!kategoriaSelect || !kategoriaNowaInput) return;

  kategoriaSelect.addEventListener("change", () => {
    const isNew = kategoriaSelect.value === "__new__";
    kategoriaNowaInput.style.display = isNew ? "block" : "none";
    if (isNew) {
      kategoriaNowaInput.focus();
    } else {
      kategoriaNowaInput.value = "";
    }
  });
}
setupKategoriaSelectListener();

// Odczytuje faktyczną wartość kategorii z formularza - albo wybraną
// z listy, albo wpisaną ręcznie jako nowa kategoria.
function readKategoriaFromForm() {
  const kategoriaSelect = document.getElementById("kategoria");
  const kategoriaNowaInput = document.getElementById("kategoriaNowa");
  if (kategoriaSelect && kategoriaSelect.value === "__new__") {
    return (kategoriaNowaInput?.value || "").trim();
  }
  return kategoriaSelect ? kategoriaSelect.value : "";
}

// Kafelki-przyciski "Na co pomaga" (wielokrotny wybór + zwijanie)
async function renderHashtagTiles() {
  const tools = await getAllTools();
  const tags = [...new Set(tools.flatMap(t => t.hasztagi || []))]
    .sort((a, b) => tagLabel(a).localeCompare(tagLabel(b), "pl"));

  hashtagFilter.innerHTML = "";
  const visible = hashtagsExpanded ? tags : tags.slice(0, HASHTAGS_COLLAPSED_COUNT);

  visible.forEach(tag => {
    const span = document.createElement("span");
    span.textContent = tagLabel(tag);
    span.className = "hashtag" + (activeTags.has(tag) ? " active" : "");
    span.onclick = () => toggleTag(tag);
    hashtagFilter.appendChild(span);
  });

  if (toggleHashtagsBtn) {
    if (tags.length > HASHTAGS_COLLAPSED_COUNT) {
      toggleHashtagsBtn.style.display = "inline-block";
      toggleHashtagsBtn.textContent = hashtagsExpanded
        ? "pokaż mniej"
        : `pokaż wszystkie (${tags.length})`;
    } else {
      toggleHashtagsBtn.style.display = "none";
    }
  }
}

function toggleTag(tag) {
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
  } else {
    activeTags.add(tag);
  }
  renderHashtagTiles();
  applyFilters();
}

// Sprawdza, czy jakikolwiek filtr lub wyszukiwanie jest obecnie aktywne.
function hasActiveFilters() {
  const term = (searchInput.value || "").trim();
  return Boolean(term) || Boolean(activeCategory) || activeTags.size > 0;
}

// Czyści wyszukiwanie, kategorię i wszystkie zaznaczone hasztagi jednym kliknięciem.
function clearAllFilters() {
  searchInput.value = "";
  activeCategory = "";
  if (categoryFilter) categoryFilter.value = "";
  activeTags.clear();
  renderHashtagTiles();
  applyFilters();
}

if (clearAllFiltersBtn) {
  clearAllFiltersBtn.addEventListener("click", clearAllFilters);
}

// Aktywne filtry z możliwością zdjęcia (✕)
function renderActiveFilters() {
  if (!activeFiltersBox) return;
  activeFiltersBox.innerHTML = "";

  if (activeCategory) {
    activeFiltersBox.appendChild(makeChip(activeCategory, () => {
      activeCategory = "";
      if (categoryFilter) categoryFilter.value = "";
      applyFilters();
    }));
  }

  activeTags.forEach(tag => {
    activeFiltersBox.appendChild(makeChip(tagLabel(tag), () => {
      activeTags.delete(tag);
      renderHashtagTiles();
      applyFilters();
    }));
  });

  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.classList.toggle("hidden", !hasActiveFilters());
  }
}

function makeChip(label, onRemove) {
  const chip = document.createElement("span");
  chip.className = "active-chip";
  chip.textContent = label + " ";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Usuń filtr");
  btn.textContent = "×";
  btn.onclick = onRemove;
  chip.appendChild(btn);
  return chip;
}

// Poprawna polska odmiana słowa "narzędzie" w zależności od liczby.
// 1 -> narzędzie, 2-4 (poza 12-14) -> narzędzia, reszta -> narzędzi
function narzedzieOdmiana(n) {
  if (n === 1) return "narzędzie";
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return "narzędzia";
  }
  return "narzędzi";
}

// Aktualizacja licznika wyników nad listą narzędzi.
function updateResultsCount(count) {
  if (!resultsCount) return;
  resultsCount.textContent = `Znaleziono ${count} ${narzedzieOdmiana(count)}`;
}

// Złożenie wszystkich filtrów: różne pola łączą się przez "i" (zawężanie),
// a w obrębie "Na co pomaga" wystarczy dowolny z zaznaczonych hasztagów.
async function applyFilters() {
  const term = (searchInput.value || "").trim().toLowerCase();
  const all = await getAllTools();

  const filtered = all.filter(t => {
    const haystack = [
      t.nazwaPL, t.nazwaEN, t.kategoria, t.efekt, t.potrzebne, t.instrukcja, t.nurt
    ].map(v => (v || "").toLowerCase()).join(" ");

    const matchesText = !term || haystack.includes(term);
    const matchesCat = !activeCategory || t.kategoria === activeCategory;

    const tags = t.hasztagi || [];
    const matchesTags = activeTags.size === 0 || [...activeTags].some(tag => tags.includes(tag));

    return matchesText && matchesCat && matchesTags;
  });

  renderTools(filtered);
  renderActiveFilters();
  updateResultsCount(filtered.length);
}

// Odświeżenie kontrolek filtrów (po dodaniu/edycji/usunięciu narzędzia)
async function initFilters() {
  await buildCategoryOptions();
  await renderHashtagTiles();
  renderActiveFilters();
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    activeCategory = categoryFilter.value;
    applyFilters();
  });
}

if (toggleHashtagsBtn) {
  toggleHashtagsBtn.addEventListener("click", () => {
    hashtagsExpanded = !hashtagsExpanded;
    renderHashtagTiles();
  });
}

// ==========================
// OBSŁUGA FORMULARZA (dodawanie / edycja / usuwanie)
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("toolId").value;

  const nazwaPL = document.getElementById("nazwaPL").value.trim();
  const nazwaEN = document.getElementById("nazwaEN").value.trim();
  const kategoria = readKategoriaFromForm();
  const potrzebne = document.getElementById("potrzebne").value.trim();
  const efekt = document.getElementById("efekt").value.trim();
  const czasEfektu = document.getElementById("czasEfektu").value.trim();
  const przeciwskazania = document.getElementById("przeciwskazania").value.trim();
  const instrukcja = document.getElementById("instrukcja").value.trim();
  const linkYoutube = document.getElementById("linkYoutube").value.trim();
  const linkWWW = document.getElementById("linkWWW").value.trim();
  const grafika = document.getElementById("grafika").value.trim();
  const hasztagi = document.getElementById("hasztagi").value
    .split(" ")
    .filter(h => h.startsWith("#") && h.length > 1);
  const nurt = document.getElementById("nurt").value.trim();

  if (!nazwaPL && !nazwaEN) {
    alert("Musisz podać co najmniej nazwę po polsku lub angielsku.");
    return;
  }

  const tool = {
    nazwaPL, nazwaEN, kategoria, potrzebne, efekt, czasEfektu,
    przeciwskazania, instrukcja, linkYoutube, linkWWW, grafika, hasztagi, nurt
  };

  if (id) {
    await updateTool(Number(id), tool);
  } else {
    await addTool(tool);
  }

  form.reset();
  document.getElementById("kategoriaNowa").style.display = "none";
  cancelEditBtn.classList.add("hidden");
  document.getElementById("formSection").style.display = "none";
  formToggleBtn.textContent = "➕ Dodaj nowe narzędzie";
  await initFilters();
  applyFilters();
});

async function removeTool(id) {
  await deleteTool(id);
  await initFilters();
  applyFilters();
}

async function editTool(id) {
  const tool = await db.tools.get(id);
  document.getElementById("toolId").value = tool.id;
  document.getElementById("nazwaPL").value = tool.nazwaPL || "";
  document.getElementById("nazwaEN").value = tool.nazwaEN || "";
  await populateFormCategorySelect(tool.kategoria || "");
  document.getElementById("potrzebne").value = tool.potrzebne || "";
  document.getElementById("efekt").value = tool.efekt || "";
  document.getElementById("czasEfektu").value = tool.czasEfektu || "";
  document.getElementById("przeciwskazania").value = tool.przeciwskazania || "";
  document.getElementById("instrukcja").value = tool.instrukcja || "";
  document.getElementById("linkYoutube").value = tool.linkYoutube || "";
  document.getElementById("linkWWW").value = tool.linkWWW || "";
  document.getElementById("grafika").value = tool.grafika || "";
  document.getElementById("hasztagi").value = (tool.hasztagi || []).join(" ");
  document.getElementById("nurt").value = tool.nurt || "";
  cancelEditBtn.classList.remove("hidden");
  document.getElementById("formSection").style.display = "block";
  formToggleBtn.textContent = "✖️ Ukryj formularz";
}

cancelEditBtn.addEventListener("click", () => {
  form.reset();
  document.getElementById("kategoriaNowa").style.display = "none";
  cancelEditBtn.classList.add("hidden");
  document.getElementById("formSection").style.display = "none";
  formToggleBtn.textContent = "➕ Dodaj nowe narzędzie";
});

// ==========================
// WYSZUKIWANIE (lupka) – wpięte we wspólne filtrowanie
// ==========================
searchInput.addEventListener("input", () => applyFilters());

// ==========================
// IMPORT CSV (separator | + <EOL> + enter)
// ==========================
async function importToolsFromCSV() {
  try {
    const response = await fetch("tools.csv");
    if (!response.ok) return;

    const text = await response.text();
    const rawRecords = text.split(/<EOL>\r?\n/).filter(r => r.trim().length > 0);
    const headerLine = rawRecords.shift();
    const headers = headerLine.split("|").map(h => h.trim());

    for (const record of rawRecords) {
      const values = record.split("|");
      const item = {};
      headers.forEach((h, i) => item[h] = values[i] !== undefined ? values[i] : "");

      const hasztagi = (item["Na co pomaga (hashtagi)"] || "")
        .split(" ")
        .filter(h => h.startsWith("#"));

      await addTool({
        nazwaPL: item["Nazwa narzędzia (PL)"],
        nazwaEN: item["Nazwa narzędzia (EN)"],
        kategoria: item["Kategoria"],
        potrzebne: item["Co będzie potrzebne do wykonania?"],
        efekt: item["Jaki daje efekt?"],
        czasEfektu: item["Po jakim czasie można zauważyć efekt?"],
        przeciwskazania: item["Przeciwskazania"],
        instrukcja: item["Instrukcja"],
        linkYoutube: item["Link do instruktażu na youtube"],
        linkWWW: item["Link do strony www z opisem"],
        grafika: item["Grafika"] || "",
        hasztagi,
        nurt: item["W jakim nurcie psychoterapii jest wykorzystywane?"]
      });
    }

    console.log(`✅ Zaimportowano ${rawRecords.length} rekordów z tools.csv`);
  } catch (err) {
    console.error("❌ Błąd importu CSV:", err);
  }
}

// ==========================
// INICJALIZACJA
// ==========================
window.addEventListener("load", async () => {
  const tools = await getAllTools();
  if (!tools.length) {
    await importToolsFromCSV();
  }
  await initFilters();
  applyFilters();
});
