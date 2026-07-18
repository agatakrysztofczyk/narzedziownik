# Testy automatyczne

Te testy uruchamiają się automatycznie na GitHubie przy każdym Pull Requeście
(zobaczysz zielony ✅ lub czerwony ❌ status na dole strony PR-a) — nie musisz
nic robić ręcznie.

## Co sprawdzają testy

- **`smoke.test.js`** — czy strona w ogóle się uruchamia bez błędów JavaScript,
  czy dane z `tools.csv` się importują i czy lista narzędzi się renderuje.
- **`narzedzieOdmiana.test.js`** — czy licznik wyników (Dzień 2) poprawnie
  odmienia słowo "narzędzie" w zależności od liczby wyników.

Każda kolejna funkcja dodawana w ramach harmonogramu będzie miała analogiczny
plik testowy w tym katalogu.

## Jak uruchomić samodzielnie (opcjonalnie)

Jeśli kiedyś będziesz chciała sama odpalić testy na swoim komputerze:

```bash
npm install
npm test
```

Wymaga zainstalowanego Node.js (https://nodejs.org).
