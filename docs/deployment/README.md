# Nasazení

Hlavní web publikuje GitHub Pages workflow. Cloudflare integrace nasazuje hlavní Worker, pokud je zapnutá v účtu. Learn, Light a ostatní aplikace mají vlastní konfigurace; příkazy níže spouštěj z kořene repozitáře.

## Konfigurace Workers

| Část | Konfigurace | Worker / vstup | Assets | Custom Domain v konfiguraci |
|---|---|---|---|---|
| Hlavní web | [wrangler.jsonc](../../wrangler.jsonc) | `shieldio-web`, statický | `.` | Není uvedena; napojení spravuje účet |
| Learn | [wrangler.learn.jsonc](../../wrangler.learn.jsonc) | `shieldio-learn`, `learn/worker.js` | `.`, binding `ASSETS`, Worker první | `learn.shieldio.cz` |
| Learn staging | [wrangler.stage.jsonc](../../wrangler.stage.jsonc) | `shieldio-learn-stage`, `learn/worker.js` | `.`, binding `ASSETS`, Worker první | `stage.learn.shieldio.cz` |
| Light | [wrangler.light.jsonc](../../wrangler.light.jsonc) | `shieldio-light`, statický | `light` | `light.shieldio.cz` |
| Simulation | [wrangler.simulation.jsonc](../../wrangler.simulation.jsonc) | `shieldio-simulation`, `workers/simulation.mjs` | `experiments/simulation`, binding `ASSETS`, Worker první | `simulation.shieldio.cz` |
| Flight360 | [wrangler.flight360.jsonc](../../wrangler.flight360.jsonc) | `shieldio-flight360`, `workers/flight360.mjs` | `experiments/flight360`, Worker první pro `/embed` a `/embed/*` | `flight360.shieldio.cz` |
| Luxmaxing | [wrangler.luxmaxing.jsonc](../../wrangler.luxmaxing.jsonc) | `luxmaxing`, statický | `luxmaxing` | `luxmaxing.shieldio.cz` |

Learn používá také Durable Object `NOTE_SUBMISSIONS` / `NoteSubmissionGuard`, migraci `notes-v1` a rate limiter. Staging má odlišné proměnné a rate limiter; používej jeho vlastní konfiguraci.

## Workflow a spouštěče

| Workflow | Automatické spuštění | Ruční spuštění / výsledek |
|---|---|---|
| [deploy.yml](../../.github/workflows/deploy.yml) | Každý push na `main` | `workflow_dispatch`; celý kořen → GitHub Pages |
| [deploy-simulation.yml](../../.github/workflows/deploy-simulation.yml) | Push na `main`, pokud změna odpovídá `experiments/simulation/**`, `workers/simulation.mjs`, `wrangler.simulation.jsonc`, `tests/simulation-worker.test.mjs` nebo `.github/workflows/deploy-simulation.yml` | `workflow_dispatch`; příprava ngspice, výpočetní a browser testy → Worker Simulation |
| [deploy-flight360.yml](../../.github/workflows/deploy-flight360.yml) | Push na `main`, pokud změna odpovídá `experiments/flight360/**`, `workers/flight360.mjs`, `wrangler.flight360.jsonc`, `tests/flight360-embed.test.mjs` nebo `.github/workflows/deploy-flight360.yml` | `workflow_dispatch`; test embed směrování a hlaviček → Worker Flight360 |
| [deploy-luxmaxing.yml](../../.github/workflows/deploy-luxmaxing.yml) | Push na `main`, pokud změna odpovídá `luxmaxing/**`, `wrangler.luxmaxing.jsonc` nebo `.github/workflows/deploy-luxmaxing.yml` | `workflow_dispatch`; Worker Luxmaxing |
| [test-arduino.yml](../../.github/workflows/test-arduino.yml) | Push na `main` či `codex/site-audit-fixes-20261103` a událost `pull_request`, vždy s filtry `paths` uvedenými ve workflow | Pouze testy obsahu, navigace, UI, Blockly a AVR; bez nasazení |

Při úpravě spouštěčů aktualizuj tuto tabulku. Úplný seznam cest testovacího workflow udržuj přímo v jeho `on.push.paths` a `on.pull_request.paths`.

Cloudflare workflow potřebují secret `CLOUDFLARE_API_TOKEN`. Luxmaxing čte také `CLOUDFLARE_ACCOUNT_ID` ze secrets; Simulation a Flight360 mají ID účtu ve workflow. Learn a Light nemají samostatné deploy workflow; použij příkazy níže.

## Learn a Light: lokální kontrola a nasazení

Před prvním nasazením přihlas Wrangler do příslušného Cloudflare účtu. Zóna `shieldio.cz` musí být aktivní ve stejném účtu. Redakční pravidla Learn jsou v [learn/CONTENT.md](../../learn/CONTENT.md).

Lokální kontrola Worker routingu:

```bash
npx wrangler dev --config wrangler.learn.jsonc
npx wrangler dev --config wrangler.light.jsonc
```

Spouštěj vždy jednu aplikaci a otevři adresu vypsanou Wranglerem. Samotné statické stránky lze prohlížet přes [lokální HTTP server](../development/contributing.md) na `/learn/` nebo `/light/`; ten neposkytuje Worker funkce.

Nasazení vybrané aplikace:

```bash
npx wrangler deploy --config wrangler.learn.jsonc
npx wrangler deploy --config wrangler.light.jsonc
```

Každý příkaz nasazuje jen příslušný Worker podle jeho konfigurace. Light nemá aplikační Worker skript; formuláře používají Web3Forms.

## Custom Domain a kontrola po nasazení

Cloudflare pro Worker Custom Domain spravuje DNS záznam i HTTPS certifikát; ruční CNAME cíl nezadávej. Pokud na zvoleném hostu existuje A, AAAA nebo CNAME, nejprve ověř jeho účel a před připojením vyřeš konflikt. Záznam patřící jiné službě nemaž bez zajištění přechodu.

Doménu lze připojit také v **Workers & Pages → příslušný Worker → Settings → Domains & Routes → Add → Custom Domain**. Pro Learn použij `learn.shieldio.cz`, pro Light `light.shieldio.cz`.

Po nasazení ověř stav 200 a platné HTTPS na [Learn](https://learn.shieldio.cz/), [maturitě](https://learn.shieldio.cz/maturita/), [ukázkové otázce](https://learn.shieldio.cz/maturita/otazka/demo-otazka-01/) nebo [Light](https://light.shieldio.cz/) podle nasazované aplikace. Zkontroluj také, že [hlavní web](https://shieldio.cz/) dál zobrazuje produktový web a že formuláře a odkazy fungují.

[Zpět na README](../../README.md) · [Mapa repozitáře](../development/repository-map.md)
