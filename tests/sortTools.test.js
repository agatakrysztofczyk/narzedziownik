// ==========================
// Test: sortowanie listy narzędzi (Dzień 7)
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("sortTools()", () => {
  let win;

  beforeAll(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterAll(() => {
    win.close();
  });

  const sample = [
    { nazwaPL: "Zimny prysznic", kategoria: "Regulacja pobudzenia" },
    { nazwaPL: "Motylek", kategoria: "Technika samoregulacji" },
    { nazwaPL: "Oddech 4-7-8", kategoria: "Techniki oddechowe" },
  ];

  test("'default' zachowuje oryginalną kolejność", () => {
    const result = win.sortTools(sample, "default");
    expect(result.map((t) => t.nazwaPL)).toEqual([
      "Zimny prysznic",
      "Motylek",
      "Oddech 4-7-8",
    ]);
  });

  test("'name-asc' sortuje alfabetycznie A-Z wg nazwy PL", () => {
    const result = win.sortTools(sample, "name-asc");
    expect(result.map((t) => t.nazwaPL)).toEqual([
      "Motylek",
      "Oddech 4-7-8",
      "Zimny prysznic",
    ]);
  });

  test("'name-desc' sortuje odwrotnie alfabetycznie Z-A", () => {
    const result = win.sortTools(sample, "name-desc");
    expect(result.map((t) => t.nazwaPL)).toEqual([
      "Zimny prysznic",
      "Oddech 4-7-8",
      "Motylek",
    ]);
  });

  test("'category-asc' sortuje wg kategorii A-Z", () => {
    const result = win.sortTools(sample, "category-asc");
    expect(result.map((t) => t.kategoria)).toEqual([
      "Regulacja pobudzenia",
      "Technika samoregulacji",
      "Techniki oddechowe",
    ]);
  });

  test("nie modyfikuje oryginalnej tablicy (zwraca nową)", () => {
    const original = [...sample];
    win.sortTools(sample, "name-asc");
    expect(sample).toEqual(original);
  });
});

describe("Sortowanie w panelu filtrów - integracja", () => {
  let win;

  beforeEach(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterEach(() => {
    win.close();
  });

  test("zmiana selecta 'sortOrder' wpływa na kolejność kart na liście", async () => {
    const sortSelect = win.document.getElementById("sortOrder");
    sortSelect.value = "name-asc";
    sortSelect.dispatchEvent(new win.Event("change"));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const names = [...win.document.querySelectorAll("#toolsList .card h3")].map(
      (el) => el.textContent
    );
    const sortedCopy = [...names].sort((a, b) => a.localeCompare(b, "pl"));
    expect(names).toEqual(sortedCopy);
  });
});
