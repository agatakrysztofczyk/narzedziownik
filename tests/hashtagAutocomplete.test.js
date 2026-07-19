// ==========================
// Test: podpowiedzi (autouzupełnianie) hasztagów w formularzu (Dzień 6)
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("Podpowiedzi hasztagów", () => {
  let win;

  beforeEach(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterEach(() => {
    win.close();
  });

  test("getCurrentHashtagToken() wyciąga aktualnie wpisywany fragment po '#'", () => {
    const input = win.document.createElement("input");
    input.value = "#stres #re";
    input.setSelectionRange(input.value.length, input.value.length);
    expect(win.getCurrentHashtagToken(input)).toBe("#re");
  });

  test("getCurrentHashtagToken() zwraca pusty string, gdy kursor nie jest w trakcie wpisywania hasztagu", () => {
    const input = win.document.createElement("input");
    input.value = "#stres ";
    input.setSelectionRange(input.value.length, input.value.length);
    expect(win.getCurrentHashtagToken(input)).toBe("");
  });

  test("insertHashtagSuggestion() podmienia wpisywany fragment na wybrany hasztag", () => {
    const input = win.document.createElement("input");
    input.value = "#stres #re";
    input.setSelectionRange(input.value.length, input.value.length);

    win.insertHashtagSuggestion(input, "#relaks");

    expect(input.value).toBe("#stres #relaks ");
  });

  test("wpisanie co najmniej 2 znaków po '#' pokazuje pasujące podpowiedzi", async () => {
    const hasztagiInput = win.document.getElementById("hasztagi");
    hasztagiInput.value = "#lę";
    hasztagiInput.setSelectionRange(hasztagiInput.value.length, hasztagiInput.value.length);
    hasztagiInput.dispatchEvent(new win.Event("input"));

    await new Promise((resolve) => setTimeout(resolve, 200));

    const box = win.document.getElementById("hasztagiSuggestions");
    expect(box.classList.contains("hidden")).toBe(false);
    expect(box.children.length).toBeGreaterThan(0);
  });

  test("wpisanie mniej niż 2 znaków po '#' chowa podpowiedzi", async () => {
    const hasztagiInput = win.document.getElementById("hasztagi");
    hasztagiInput.value = "#l";
    hasztagiInput.setSelectionRange(hasztagiInput.value.length, hasztagiInput.value.length);
    hasztagiInput.dispatchEvent(new win.Event("input"));

    await new Promise((resolve) => setTimeout(resolve, 200));

    const box = win.document.getElementById("hasztagiSuggestions");
    expect(box.classList.contains("hidden")).toBe(true);
  });

  test("kliknięcie podpowiedzi wstawia hasztag do pola i chowa listę", async () => {
    const hasztagiInput = win.document.getElementById("hasztagi");
    hasztagiInput.value = "#lę";
    hasztagiInput.setSelectionRange(hasztagiInput.value.length, hasztagiInput.value.length);
    hasztagiInput.dispatchEvent(new win.Event("input"));

    await new Promise((resolve) => setTimeout(resolve, 200));

    const box = win.document.getElementById("hasztagiSuggestions");
    const firstSuggestion = box.children[0];
    firstSuggestion.dispatchEvent(new win.Event("mousedown"));

    expect(hasztagiInput.value).toContain("#lęk");
    expect(box.classList.contains("hidden")).toBe(true);
  });
});
