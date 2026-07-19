// ==========================
// Test: informacja o niewczytanym obrazku (Dzień 4)
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("handleImageError()", () => {
  let win;

  beforeAll(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterAll(() => {
    win.close();
  });

  test("zamienia niewczytany obrazek na czytelny placeholder z nazwą pliku", () => {
    const img = win.document.createElement("img");
    img.className = "card-image";
    win.document.body.appendChild(img);

    win.handleImageError(img, "motylek.png");

    // Obrazek powinien zniknąć z drzewa DOM...
    expect(win.document.body.contains(img)).toBe(false);

    // ...a w jego miejsce pojawić się widoczny placeholder z nazwą pliku.
    const placeholder = win.document.querySelector(".image-error-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder.textContent).toContain("motylek.png");
    expect(placeholder.textContent).toMatch(/nie udało się wczytać/i);
  });

  test("karty narzędzi w wygenerowanej liście używają handleImageError w onerror", () => {
    expect(win.renderTools.toString()).toContain("handleImageError");
    expect(win.renderTools.toString()).not.toContain("this.style.display='none'");
  });
});
