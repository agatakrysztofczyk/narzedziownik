// ==========================
// Test "smoke" - sprawdza, czy strona w ogóle się uruchamia bez błędów.
// To jest test, o który prosiłaś: "czy strona uruchomi się bez błędu".
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("Uruchomienie strony", () => {
  test("strona ładuje się bez błędów JavaScript", async () => {
    const { dom, errors } = await loadPage();

    expect(errors).toEqual([]);

    dom.window.close();
  }, 15000);

  test("po uruchomieniu lista narzędzi jest wyrenderowana (dane z tools.csv się zaimportowały)", async () => {
    const { dom } = await loadPage();

    const cards = dom.window.document.querySelectorAll("#toolsList .card");
    expect(cards.length).toBeGreaterThan(0);

    dom.window.close();
  }, 15000);

  test("licznik wyników nad listą pokazuje poprawną liczbę (Dzień 2)", async () => {
    const { dom } = await loadPage();

    const resultsCount = dom.window.document.getElementById("resultsCount");
    expect(resultsCount).not.toBeNull();
    expect(resultsCount.textContent).toMatch(/^Znaleziono \d+ narzędzi(e|a)?$/);

    dom.window.close();
  }, 15000);
});
