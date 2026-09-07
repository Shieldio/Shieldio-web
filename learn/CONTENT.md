# Shieldio Learn — redakční kontrakt

## Zdroj a stav

- Seznam 50 okruhů vychází z podkladu SPŠ Zlín pro obor 26-41-M/01 Elektrotechnika, školní rok 2025/26.
- Zdrojový katalog je v `assets/data/learn-questions.json`.
- `status: "outline"` znamená pouze založenou osnovu. Takový okruh nesmí působit jako dokončený a nelze ho označit jako hotový.
- Stav se změní až po odborné kontrole všech textů, vzorců, jednotek, grafů a kontrolních odpovědí.

## Povinná struktura hotového okruhu

1. Co musí student umět říct u maturity.
2. Intuitivní vysvětlení principu.
3. Schéma nebo animace fyzikálního jevu.
4. Interaktivní graf či simulace s popsanými osami a jednotkami.
5. Vzorce včetně významu symbolů, jednotek a podmínek platnosti.
6. Nejméně jeden řešený příklad a jedna úloha k samostatnému řešení.
7. Nejčastější chyby a kontrolní otázky.
8. Krátká osnova ústní odpovědi.

## Technická pravidla

- Veřejná URL má tvar `/maturita/otazka/{slug}/`; slug po zveřejnění neměnit.
- Titulek, shrnutí a číslo okruhu musí být pravdivé i bez JavaScriptu díky transformaci v `learn/worker.js`.
- Každý interaktivní prvek musí fungovat klávesnicí, mít textový popis a respektovat `prefers-reduced-motion`.
- Grafy musí být čitelné ve světlém i tmavém režimu.
- Před změnou stavu na hotovo vždy spustit validace z `AGENTS.md`, lokální HTTP test a kontrolu produkčních metadata.

## Doporučené pořadí

První referenční lekce: **01 Lineární součástky R, L, C**. Na ní se ustálí komponenty pro animace, grafy, vzorce a testy; další okruhy je potom znovu použijí.
