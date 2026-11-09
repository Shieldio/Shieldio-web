# Markdown pro AI agenty

Hlavní web na Cloudflare Workers poskytuje dvě reprezentace stejné HTML stránky:

- Standardně HTML pro prohlížeče.
- Při výslovném `Accept: text/markdown` přehledný Markdown bez navigace, skriptů a formulářů.

Základem zůstávají české texty v HTML (stejné jako fallback v i18n). Worker v `workers/main-web.mjs` převádí odpověď jen při požadavku na Markdown. Změny obsahu nevyžadují ruční aktualizaci zvláštních `.md` souborů. Worker nevolá externí API, nepřidává placené balíčky a nezpracovává CSS, JS ani jiná než HTML data.

Pro Cloudflare nasazení musí konfigurace `wrangler.jsonc` mířit na Worker `shieldio-web`, který obsluhuje `shieldio.cz`. GitHub Pages workflow je nadále samostatné a samotné GitHub Pages neumí vyjednávat formát podle hlavičky `Accept`.

## Ověření

```sh
node --test tests/main-web-markdown.test.mjs
curl -sSI https://shieldio.cz/ | grep -Ei 'content-type|vary'
curl -sSI -H 'Accept: text/markdown' https://shieldio.cz/ | grep -Ei 'content-type|vary'
curl -sS -H 'Accept: text/markdown' https://shieldio.cz/ | head -40
```

Očekává se `text/html` u standardního požadavku, `text/markdown; charset=utf-8` po výslovné žádosti, `Vary: Accept` u obou. Obě verze sdílejí adresu a stejný veřejný obsah. 404 a ne-HTML soubory zůstávají nedotčené.

Překlad na serveru používá český HTML fallback. Přepínání jazyka pomocí JavaScriptu v prohlížeči toto vyjednávání neovlivňuje. Markdown je určený pro obsahové stránky, ne jako programové API pro interaktivní editor.

Alternativa: placená funkce Cloudflare *Markdown for Agents* v dashboardu převádí HTML přímo na síti. Tento Worker je nezávislé řešení bez tohoto přepínače.

## Veřejné projektové návody bez JavaScriptu

Pět vydaných návodů RED (sestavení V3, závora, parkovací asistent, časovač a theremin) má statickou textovou alternativu v samotném HTML, vygenerovanou z `assets/js/guide-data-*.js`.

Při nasazení Cloudflare Workers i GitHub Pages se spouští:

```sh
node scripts/generate-readable-guides.mjs
node --test tests/readable-guides.test.mjs
```

Zdrojové `index.html` v repozitáři obsahují interaktivní rám; generátor při sestavení doplní přístupný HTML návod pod něj. Návod je ve výchozím stavu otevřený pro návštěvníka bez JavaScriptu, po spuštění interaktivního průvodce se pouze sbalí, ale zůstává kdykoli rozbalitelný. Markdown Worker u těchto stránek přednostně exportuje statický úplný text.

Zdroj pravdy jsou původní data návodů; **neupravuj odděleně generované bloky**. Při úpravě projektu aktualizuj odpovídající `guide-data-*.js`. Případné revize hardwaru uváděj výslovně. Interní návrhy GREEN/YELLOW se automaticky nepublikují.
