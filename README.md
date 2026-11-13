# Shieldio

Web, programovací editor a návody k desce RED. V tomto repozitáři jsou také zdroje Learn, Simulation a Flight360.

**[shieldio.cz](https://shieldio.cz/)** · **[Editor](https://shieldio.cz/instructions/blokovy-editor.html)** · **[Projekty RED](https://shieldio.cz/instructions/baseline/red/)** · **[Dokumentace](docs/README.md)**

Jednoduchý editor RED má moduly v samostatných kategoriích a časování v sekundách. Pokročilý režim přidává klasické Uno/Nano, Arduino C++, knihovny a sériový monitor, plotter i odesílání. [Aktuální přehled pro uživatele](https://shieldio.cz/instructions/programovani/#rezimy).

## Orientace ve zdrojích

| Úprava | Kde začít |
| --- | --- |
| Úvodní stránka | [index.html](index.html) · [home.css](assets/css/home.css) |
| Editor, kompilace a USB | [Stránka editoru](instructions/blokovy-editor.html) · [technický popis](docs/editor/README.md) |
| Projekty a návody | [Přehled RED](instructions/baseline/red/index.html) · [vykreslování návodů](assets/js/guide-engine.js) |
| Texty a překlady | [i18n.json](assets/data/i18n.json) · [pravidla překladů](docs/development/contributing.md#překlady-hlavního-webu) |
| Vzhled a značka | [Sdílené styly](assets/css/style.css) · [pravidla značky](docs/development/brand.md) |

## Další aplikace

| Aplikace | Zdroj | Adresa |
| --- | --- | --- |
| Learn | [learn/](learn/) | [learn.shieldio.cz](https://learn.shieldio.cz/) |
| Simulation | [experiments/simulation/](experiments/simulation/) | [simulation.shieldio.cz](https://simulation.shieldio.cz/) |
| Flight360 | [experiments/flight360/](experiments/flight360/) | [flight360.shieldio.cz](https://flight360.shieldio.cz/) |
| Light | [light/](light/) | [light.shieldio.cz](https://light.shieldio.cz/) |
| Luxmaxing | [luxmaxing/](luxmaxing/) | [luxmaxing.shieldio.cz](https://luxmaxing.shieldio.cz/) |

[Úplná mapa repozitáře](docs/development/repository-map.md) · [Nasazení](docs/deployment/README.md) · [Testy a přispívání](docs/development/contributing.md)

<details>
<summary>Lokální spuštění</summary>

Hlavní web je statické HTML, CSS a JavaScript. Z kořene repozitáře spusť:

```bash
python3 -m http.server 8080
```

Otevři **http://127.0.0.1:8080/**. Překlady vyžadují HTTP; přes `file://` nefungují. Tento server nenahrazuje Cloudflare Worker. Testy a jejich závislosti popisuje [příručka pro přispěvatele](docs/development/contributing.md).

</details>

## Stav projektu

RED V4 se testuje, V5 se připravuje. RED se zatím neprodává; formulář zjišťuje nezávazný zájem. Další podklady jsou v [přehledu před launchem](docs/launch/README.md).

**[Nahlásit chybu nebo nápad](https://github.com/Shieldio/Shieldio-web/issues/new/choose)** · [Pokyny pro úpravy](AGENTS.md) · [Knihovna ShieldioDisplay](https://github.com/Shieldio/ShieldioDisplay)
