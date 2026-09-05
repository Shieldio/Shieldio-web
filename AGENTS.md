# Shieldio-web

Statický web pro Shieldio — výuková Arduino elektronika pro školy i domácí kutily.
Web je česky, s runtime přepínáním do angličtiny. Píše se česky, i commity.

## Základní fakta

- **42 HTML souborů**, žádný build proces, žádné node_modules, žádný package.json.
- Deploy: **`git push` na `main`** → Cloudflare Workers (static assets). Nic víc.
  Není tu žádný CI krok, který by chytil rozbitou cestu — co pushneš, to je živě.
- Struktura: `index.html`, `faq.html`, `404.html` v kořeni; složky `products/`,
  `instructions/`, `company/`, `aktuality/`, `edu/`, `assets/`.
- `assets/css/style.css` je jediný stylesheet pro celý web (~1700 řádků).
- `assets/js/*.js` — 25 samostatných IIFE skriptů, žádný bundler, žádné importy.
  Každá stránka si je linkuje ručně na konci `<body>`.

## i18n — nejdůležitější kontrakt v repu

`assets/js/lang.js` + `assets/data/i18n.json` (688 klíčů, plochá mapa `klíč → {cs, en}`).

Pět atributů, každý má vlastní handler v `applyLang()`:

| atribut | co dělá |
|---|---|
| `data-i18n` | nastavuje **`innerHTML`** |
| `data-i18n-title` | na `<body>`, nastavuje `document.title` |
| `data-i18n-placeholder` | atribut `placeholder` |
| `data-i18n-alt` | atribut `alt` |
| `data-i18n-aria-label` | atribut `aria-label` (pro inline SVG s `role="img"`) |

### Pravidla, která musíš dodržet

1. **Text v HTML musí být totožný s českou hodnotou v i18n.json.**
   HTML text je fallback, než doběhne fetch — a je to i to, co uvidí crawler bez JS.
   Když změníš jedno a druhé ne, stránka po načtení „poskočí" a Google čte staré znění.
   *Tohle je nejčastější chyba v tomhle repu.*

2. **`data-i18n` používá `innerHTML`, takže hodnoty smí obsahovat HTML** — a některé ho
   obsahují (odkazy, `<span class="preorder-badge">`, `<em>`). Když do textu v HTML
   přidáš odkaz, musíš ho přidat i do i18n hodnoty, jinak po přepnutí jazyka zmizí.

3. **Klíče jsou sdílené napříč stránkami.** Před změnou hodnoty vždy:
   ```bash
   grep -rn 'data-i18n="ten.klíč"' --include="*.html" .
   ```
   Reálný případ z historie repa: `home.tier_red.badge` („Aktuálně ve vývoji") sdílely
   homepage, RED.html i POWERADD.html. Když se RED posunul na „první série", nešlo ten
   klíč přepsat — PowerAdd ve vývoji pořád je. Řešením byl **nový klíč**
   `red.badge_first_batch` pro RED, sdílený zůstal PowerAddu.
   Když se významy rozejdou, zakládej nový klíč, nepřepisuj sdílený.

4. `lang.js` fetchuje **`/assets/data/i18n.json` root-absolutně**. Přes `file://`
   to nefunguje — vždy testuj přes `python3 -m http.server`.

5. Na 7 stránkách `instructions/jak-to-funguje/*` běží KaTeX. `setLang()` po přepnutí
   volá `renderMathInElement()` znovu — nesahej na to, jinak zůstane surový LaTeX.

## CSS konvence

- **Nikdy neměň globální default kvůli jedné stránce.** `section { padding: 140px 0 }`
  je globální; homepage si to přepisuje `style="padding:72px 0;"` inline na konkrétních
  sekcích. Vypadá to nečistě, ale je to záměr — jinak by se rozsypaly ostatní stránky.
- Stejně tak `.problem` má `background: var(--paper-2)`, ale na homepage je přebitý
  `style="background:transparent;"`, protože tam vytvářel nechtěné pruhování.
- **Pozor na pořadí v kaskádě.** Modifikátory jako `.tier-card-featured` musí být
  v souboru **za** základní `.tier-card`, jinak je základ přebije (stalo se).
- Barvy vždy přes tokeny (`--accent`, `--ink`, `--line`, `--paper`, `--surface`,
  `--tier-red/green/yellow`). Tmavý režim se řeší v bloku `:root[data-theme="dark"]`
  na konci souboru — každá nová barva potřebuje i tam protějšek.
- Barva značky je **teal `#0d9488`** (`--accent`), ne modrá. Logo v `assets/icons/`
  bylo z brand kitu přebarveno z `#2f6fed` na teal.

## Validace před každým commitem

```bash
# 1) i18n.json je platný JSON
python3 -c "import json; json.load(open('assets/data/i18n.json', encoding='utf-8')); print('OK')"

# 2) žádný data-i18n klíč v HTML nechybí ve slovníku
python3 - <<'EOF'
import re, json, os
d = json.load(open('assets/data/i18n.json', encoding='utf-8'))
miss = []
for root, dirs, files in os.walk('.'):
    if '.git' in dirs: dirs.remove('.git')
    for fn in files:
        if not fn.endswith('.html'): continue
        p = os.path.join(root, fn)
        keys = set(re.findall(r'data-i18n(?:-title|-placeholder|-alt|-aria-label)?="([^"]+)"',
                              open(p, encoding='utf-8').read()))
        m = [k for k in keys if k not in d]
        if m: miss.append((p, m))
print('chybějící klíče:', miss or 'žádné')
EOF

# 3) všechny href/src ukazují na existující soubor
python3 - <<'EOF'
import re, os
bad = []
for root, dirs, files in os.walk('.'):
    if '.git' in dirs: dirs.remove('.git')
    for fn in files:
        if not fn.endswith('.html'): continue
        p = os.path.join(root, fn)
        for m in re.finditer(r'(?:href|src)="([^"]+)"', open(p, encoding='utf-8').read()):
            u = m.group(1)
            if u.startswith(('http://','https://','mailto:','tel:','#','data:')): continue
            t = os.path.normpath('.' + u.split('#')[0].split('?')[0]) if u.startswith('/') \
                else os.path.normpath(os.path.join(root, u.split('#')[0].split('?')[0]))
            if t and not os.path.exists(t): bad.append((p, u))
print('rozbité odkazy:', bad or 'žádné')
EOF

# 4) JSON-LD bloky jsou platné (jsou v index/faq/RED/products)
python3 - <<'EOF'
import re, json
for f in ['index.html','faq.html','products/RED.html','products/index.html']:
    c = open(f, encoding='utf-8').read()
    for i, b in enumerate(re.findall(r'<script type="application/ld\+json">(.*?)</script>', c, re.S)):
        try: json.loads(b)
        except Exception as e: print(f'CHYBA {f} blok {i+1}: {e}')
print('JSON-LD OK')
EOF
```

## Testování v prohlížeči

Vždy přes lokální server, ne `file://`:
```bash
python3 -m http.server 8080
```
Prohlížeč občas drží starou verzi CSS — buď použij nový port, nebo v konzoli:
```js
const l = document.querySelector('link[href*="style.css"]');
l.href = l.href.split('?')[0] + '?v=' + Date.now();
```

## Redakční standardy

Majitel projektu je na tohle citlivý a opakovaně (oprávněně) vracel texty,
které tvrdily víc, než je pravda. Než napíšeš jakékoli tvrzení, ověř si ho v repu.

- **Netvrď schopnosti, které nemáš čím doložit.** „Zvládne ji i učitel bez technického
  vzdělání" bylo nahrazeno za „Navrženo tak, aby s ní mohl učit i učitel bez hlubších
  znalostí elektroniky." Rozdíl mezi slibem a záměrem je tady podstatný.
- **Nedělej z konceptu hotový produkt.** Existuje jen deska **RED** (první série,
  k předobjednání, 550 Kč DIY / 750 Kč READY / EduSET 5× 3500 Kč).
  **Green a Yellow jsou koncepty**, **PowerAdd je prototyp ve vývoji**, **PRO je koncept**.
  Kdekoli zmíníš „3 úrovně", musí být poblíž jasné, že dvě z nich zatím nejsou.
- **Stav dostupnosti drž konzistentní napříč VŠEMI výskyty**, včetně JSON-LD.
  Web už jednou tvrdil `availability: PreOrder` s cenou a zároveň „deska je ve vývoji"
  ve strukturovaných datech FAQ. Když měníš stav produktu, projeď:
  ```bash
  grep -rn "ve vývoji\|první série\|koncept" --include="*.html" .
  ```
- **Škola není jediný zákazník.** Píše se i pro domácí kutily a kroužky.
- Tón: věcný, konkrétní, bez marketingového nafukování. Čísla a fakta místo přídavných jmen.

## Git

- Commit zprávy **česky**, popisují *proč*, ne jen *co*.
- Po commitu následuje `git push` (deploy).
- Před `git add -A` zkontroluj `git status`, ať se nepřibalí nic nechtěného.

## Známé otevřené věci

1. **Datum „září 2026" v `company/pro-ucitele.html` a `company/metodika-zavora.html`.**
   Formulace „testování ve výuce plánujeme spustit… v září 2026" je psaná jako plán
   do budoucna. Až to datum nastane, přestane být pravdivá — potřebuje aktualizaci
   podle skutečného stavu (to ví jen majitel projektu).

2. Formuláře (kontakt i předobjednávka) jedou přes **web3forms** s hardcoded
   `access_key` v HTML. Funguje to, ale není tam žádný backend ani databáze.

Vzhled, logo a barvy řeší **`BRAND.md`** — přečti si ho, než sáhneš na cokoli
vizuálního. Rastrové ikony se **negenerují ručně**, renderují se z `favicon.svg`
přes `rsvg-convert` (postup je v `BRAND.md`).
