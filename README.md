# Shieldio-web

Web Shieldio a související výukové aplikace pro elektroniku a programování. Hlavní web je statické HTML, CSS a JavaScript s přepínáním češtiny a angličtiny.

## Kde začít

- [Hlavní web](https://shieldio.cz/) · [zdroj úvodní stránky](index.html)
- [Editor Shieldio](https://shieldio.cz/instructions/blokovy-editor.html) · [zdroj editoru](instructions/blokovy-editor.html)
- [Projekty RED](https://shieldio.cz/instructions/baseline/red/) · [zdroj rozcestníku](instructions/baseline/red/index.html)
- [Přehled návodů](instructions/index.html) · [produkty a jejich stav](products/index.html)

## Části repozitáře

| Část | Cesty ve zdrojích |
|---|---|
| Hlavní web a editor | `index.html`, `products/`, `instructions/`, `company/`, `edu/`, `aktuality/`, `assets/` |
| Learn | `learn/`, `learn/worker.js` |
| Light | `light/` |
| Simulation | `experiments/simulation/`, `workers/simulation.mjs` |
| Flight360 | `experiments/flight360/`, `workers/flight360.mjs` |
| Luxmaxing | `luxmaxing/` |

Podrobná mapa je v [REPOSITORY.md](docs/REPOSITORY.md). Každá část zůstává na své dosavadní cestě.

## Lokální náhled hlavního webu

Z kořene repozitáře spusť:

```bash
python3 -m http.server 8080
```

Otevři [http://127.0.0.1:8080/](http://127.0.0.1:8080/). Použij HTTP server: načítání překladů přes `file://` nefunguje. Tento server neposkytuje aplikační funkce Cloudflare Workers.

## Dokumentace pro přispěvatele

- [Přispívání, testy a překlady](docs/CONTRIBUTING.md)
- [Nasazení jednotlivých aplikací](docs/DEPLOYMENT.md)
- [Co ještě doložit před launchem](docs/BEFORE_LAUNCH.md)
- [Pravidla práce v repozitáři](AGENTS.md) a [značka a vzhled](BRAND.md)

RED V4 se testuje, V5 se připravuje; RED se zatím neprodává. Green, Yellow a PRO jsou koncepty, PowerAdd je prototyp ve vývoji. Texty i návody mají tento stav popisovat věcně.

Chybu nebo nápad založ přes [Issues](https://github.com/Shieldio/Shieldio-web/issues/new/choose). Formuláře pomohou uvést stránku, kroky a očekávaný výsledek.
