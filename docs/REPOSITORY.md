# Mapa repozitáře

Rozcestník současných cest a aplikací. Podrobnosti nasazení udržuje [DEPLOYMENT.md](DEPLOYMENT.md).

| Část | Vstup a hlavní soubory | Konfigurace nasazení |
|---|---|---|
| Hlavní web | [`../index.html`](../index.html), `products/`, `instructions/`, `company/`, `edu/`, `aktuality/`; sdílené `assets/` | `wrangler.jsonc` |
| Editor Shieldio | [`../instructions/blokovy-editor.html`](../instructions/blokovy-editor.html), `assets/js/blockly-editor.js`, `assets/js/shieldio-blocks.js`, moduly `assets/js/arduino-*.mjs`, `assets/arduino/` | Součást hlavního webu |
| Projekty RED | [`../instructions/baseline/red/index.html`](../instructions/baseline/red/index.html), složky jednotlivých projektů, `assets/js/guide-engine.js` a `guide-data-*.js` | Součást hlavního webu |
| Learn | `learn/index.html`, `learn/maturita/`, `learn/pc-sestava/`, `learn/edupage/`, `learn/shop/`, `learn/worker.js`; redakční pravidla `learn/CONTENT.md` | `wrangler.learn.jsonc`, staging `wrangler.stage.jsonc` |
| Light | `light/index.html`, `light/app.js`, `light/styles.css`, `light/assets/` | `wrangler.light.jsonc` |
| Simulation | `experiments/simulation/index.html`, moduly `.mjs`, `experiments/simulation/tests/`, `workers/simulation.mjs`; vlastní `README.md` a `THIRD_PARTY.md` | `wrangler.simulation.jsonc` |
| Flight360 | `experiments/flight360/index.html`, `app.js`, `app.css`, `videos.json`, `workers/flight360.mjs`; vlastní `README.md` a `AGENTS.md` | `wrangler.flight360.jsonc` |
| Luxmaxing | `luxmaxing/index.html`, `styles.css`, `pruvodce.txt`, vlastní `README.md` | `wrangler.luxmaxing.jsonc` |

## Sdílené soubory

- `assets/data/i18n.json` a `assets/js/lang.js`: překlady hlavního webu za běhu; český fallback v HTML odpovídá slovníku.
- `assets/css/style.css`, další styly a `assets/js/`: vzhled, navigace, editor a společné ovládání.
- `tests/`: testy obsahu, hledání, průchodů návody, programování a dalších aplikací.
- `.github/workflows/`: automatické testy, GitHub Pages a vybraná nasazení Workers; přesné rozdělení popisuje [DEPLOYMENT.md](DEPLOYMENT.md).
- `docs/`: technické podklady a kontroly; `AGENTS.md` a `BRAND.md` v kořeni obsahují pravidla úprav.

Při práci v konkrétní aplikaci čti také její místní pokyny. Přesuny souborů mohou změnit relativní odkazy, veřejné URL a adresáře publikovaných assets; tato mapa žádné přesuny ani změny větví nevyžaduje.

[Zpět na README](../README.md) · [Jak přispívat](CONTRIBUTING.md)
