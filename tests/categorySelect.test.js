// ==========================
// Test: pole "Kategoria" jako lista wyboru (Dzień 5)
// ==========================

const { loadPage } = require("./helpers/loadPage");

describe("Kategoria jako lista wyboru", () => {
  let win;

  beforeEach(async () => {
    const { dom } = await loadPage();
    win = dom.window;
  }, 15000);

  afterEach(() => {
    win.close();
  });

  test("lista kategorii w formularzu zawiera istniejące kategorie z bazy oraz opcję dodania nowej", async () => {
    await win.populateFormCategorySelect("");
    const select = win.document.getElementById("kategoria");
    const values = [...select.options].map((o) => o.value);

    expect(values).toContain("");
    expect(values).toContain("__new__");
    // Kategorie z tools.csv, np. "Techniki oddechowe", powinny się pojawić.
    expect(values.some((v) => v.length > 0 && v !== "__new__")).toBe(true);
  });

  test("wybranie '➕ Dodaj nową kategorię…' pokazuje pole do wpisania nazwy", async () => {
    await win.populateFormCategorySelect("");
    const select = win.document.getElementById("kategoria");
    const kategoriaNowaInput = win.document.getElementById("kategoriaNowa");

    expect(kategoriaNowaInput.style.display).toBe("none");

    select.value = "__new__";
    select.dispatchEvent(new win.Event("change"));

    expect(kategoriaNowaInput.style.display).toBe("block");
  });

  test("readKategoriaFromForm() zwraca wpisaną nową kategorię, gdy wybrano '__new__'", async () => {
    await win.populateFormCategorySelect("");
    const select = win.document.getElementById("kategoria");
    const kategoriaNowaInput = win.document.getElementById("kategoriaNowa");

    select.value = "__new__";
    select.dispatchEvent(new win.Event("change"));
    kategoriaNowaInput.value = "Nowa niestandardowa kategoria";

    expect(win.readKategoriaFromForm()).toBe("Nowa niestandardowa kategoria");
  });

  test("readKategoriaFromForm() zwraca wybraną istniejącą kategorię", async () => {
    await win.populateFormCategorySelect("");
    const select = win.document.getElementById("kategoria");
    const existing = [...select.options].find((o) => o.value && o.value !== "__new__");

    select.value = existing.value;
    expect(win.readKategoriaFromForm()).toBe(existing.value);
  });

  test("edycja narzędzia ustawia w liście jego aktualną kategorię", async () => {
    const tools = await win.getAllTools();
    const toolWithCategory = tools.find((t) => t.kategoria);
    expect(toolWithCategory).toBeDefined();

    await win.editTool(toolWithCategory.id);

    const select = win.document.getElementById("kategoria");
    expect(select.value).toBe(toolWithCategory.kategoria);
  });
});
