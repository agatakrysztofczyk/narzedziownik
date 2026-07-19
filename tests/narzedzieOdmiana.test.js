// ==========================
// Test jednostkowy: narzedzieOdmiana() z Dnia 2 (licznik wyników)
// Sprawdza poprawną polską odmianę słowa "narzędzie" dla różnych liczb.
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("narzedzieOdmiana()", () => {
  let win;

  beforeAll(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterAll(() => {
    win.close();
  });

  test("liczba 1 -> 'narzędzie'", () => {
    expect(win.narzedzieOdmiana(1)).toBe("narzędzie");
  });

  test("liczba 0 -> 'narzędzi'", () => {
    expect(win.narzedzieOdmiana(0)).toBe("narzędzi");
  });

  test.each([2, 3, 4, 22, 23, 24])("liczba %i -> 'narzędzia'", (n) => {
    expect(win.narzedzieOdmiana(n)).toBe("narzędzia");
  });

  test.each([5, 9, 10, 11, 12, 13, 14, 15, 20, 21, 25])("liczba %i -> 'narzędzi'", (n) => {
    expect(win.narzedzieOdmiana(n)).toBe("narzędzi");
  });
});

describe("updateResultsCount()", () => {
  let win;

  beforeAll(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterAll(() => {
    win.close();
  });

  test("wyświetla poprawny tekst dla 12 wyników", () => {
    win.updateResultsCount(12);
    expect(win.document.getElementById("resultsCount").textContent).toBe(
      "Znaleziono 12 narzędzi"
    );
  });

  test("wyświetla poprawny tekst dla 1 wyniku", () => {
    win.updateResultsCount(1);
    expect(win.document.getElementById("resultsCount").textContent).toBe(
      "Znaleziono 1 narzędzie"
    );
  });

  test("wyświetla poprawny tekst dla 3 wyników", () => {
    win.updateResultsCount(3);
    expect(win.document.getElementById("resultsCount").textContent).toBe(
      "Znaleziono 3 narzędzia"
    );
  });
});
