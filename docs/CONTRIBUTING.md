# Jak přispívat

Nejdřív přečti [AGENTS.md](../AGENTS.md), [BRAND.md](../BRAND.md) a případné pokyny uvnitř upravované aplikace. Změny drž u konkrétního problému; před commitem zkontroluj diff i stav pracovní kopie. Commit zprávy piš česky a vysvětli důvod změny.

## Lokální kontrola

Příkazy spouštěj z kořene repozitáře. Pro hlavní statický web není potřeba build:

```bash
python3 -m http.server 8080
```

Otevři [http://127.0.0.1:8080/](http://127.0.0.1:8080/). Zkontroluj mobilní šířku, světlý i tmavý režim, klávesnici a oba jazyky. Server nenahrazuje Worker ani test nahrávání do skutečné desky.

Základní kontroly používané také v CI (JavaScript vyžaduje Node.js 22):

```bash
python3 tests/site-content.test.py
node tests/site-search.test.mjs
node --test tests/arduino-flasher.test.mjs
```

Pro test průchodů návody nainstaluj jsdom mimo repozitář a předej cestu testu:

```bash
npm install --prefix /tmp/shieldio-test-deps --ignore-scripts --no-audit --no-fund --no-save jsdom@27.4.0
JSDOM_TEST_PACKAGE=/tmp/shieldio-test-deps/node_modules/jsdom node tests/site-journeys.test.mjs
```

Úplnou přípravu Blockly a skutečného AVR překladače uvádí [test-arduino.yml](../.github/workflows/test-arduino.yml); simulační aplikace má vlastní testy. V částečné pracovní kopii nejprve zajisti soubory potřebné pro příslušný test. Tyto příkazy samy nic nenasazují.

## Překlady hlavního webu

`assets/data/i18n.json` je plochá mapa `klíč → {cs, en}`. Český text v HTML musí odpovídat hodnotě `cs`. Přidej klíče pro text, titul stránky, placeholder, alt nebo aria-label přes příslušné atributy `data-i18n*`; stránka musí načítat `assets/js/lang.js`.

Před změnou sdíleného klíče najdi jeho použití:

```bash
rg -n 'data-i18n="nav.home"' --glob '*.html' .
python3 -c "import json; json.load(open('assets/data/i18n.json', encoding='utf-8')); print('JSON OK')"
python3 tests/site-content.test.py
```

`data-i18n` nastavuje `innerHTML`: odkazy a významové značky musí být také v překladu. Překlady ověř přes HTTP včetně přechodu na další stránku. Dekorativní obrázek s `alt=""` ponech dekorativní; funkční ovládání musí mít srozumitelný název v obou jazycích.

## Návody srozumitelné žákům

V návodech tykej, použij konkrétní kroky a vysvětli nový pojem při prvním použití. U kroku napiš, co má žák udělat, jaký výsledek očekávat a co zkontrolovat při potížích. Rozlišuj součástku, fotografii prototypu a hotový projekt; chybějící fotku nenahrazuj vymyšleným výsledkem. Stav produktu a revizi PCB uváděj podle ověřených podkladů. Ověř také názvy tlačítek, pořadí kroků a bezpečnost zapojení.

K hlášení chyby přidej URL návodu, revizi desky, použitý program a očekávaný i skutečný výsledek. Pro změny nasazení nejdřív čti [DEPLOYMENT.md](DEPLOYMENT.md).
