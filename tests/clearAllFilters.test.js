// ==========================
// Test: przycisk "Wyczyść wszystkie filtry" (Dzień 3)
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("Wyczyść wszystkie filtry", () => {
  let win;

  beforeEach(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterEach(() => {
    win.close();
  });

  test("przycisk jest ukryty, gdy nie ma żadnych aktywnych filtrów", () => {
    const btn = win.document.getElementById("clearAllFiltersBtn");
    expect(btn.classList.contains("hidden")).toBe(true);
  });

  test("przycisk pojawia się, gdy wpisano tekst w wyszukiwarce", async () => {
    const searchInput = win.document.getElementById("searchInput");
    searchInput.value = "oddech";
    searchInput.dispatchEvent(new win.Event("input"));

    await new Promise((resolve) => setTimeout(resolve, 200));

    const btn = win.document.getElementById("clearAllFiltersBtn");
    expect(btn.classList.contains("hidden")).toBe(false);
  });

  test("kliknięcie przycisku czyści wyszukiwanie, kategorię i hasztagi jednocześnie", async () => {
    const searchInput = win.document.getElementById("searchInput");

    // Ustawiamy wyszukiwanie i jeden hasztag jako aktywne filtry.
    searchInput.value = "lęk";
    searchInput.dispatchEvent(new win.Event("input"));
    win.toggleTag("#lęk");

    await new Promise((resolve) => setTimeout(resolve, 200));

    const btnBefore = win.document.getElementById("clearAllFiltersBtn");
    expect(btnBefore.classList.contains("hidden")).toBe(false);

    // Klik w przycisk czyszczący.
    btnBefore.dispatchEvent(new win.Event("click"));

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(searchInput.value).toBe("");
    expect(win.document.getElementById("activeFilters").children.length).toBe(0);

    const btnAfter = win.document.getElementById("clearAllFiltersBtn");
    expect(btnAfter.classList.contains("hidden")).toBe(true);
  });
});
