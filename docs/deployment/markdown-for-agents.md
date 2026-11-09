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
