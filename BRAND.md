# Shieldio — brand guidelines

Praktický manuál ke značce Shieldio, jak je reálně nasazená na webu.
Doplňuje `AGENTS.md`, který řeší kód. Tenhle soubor řeší vzhled.

> **Poznámka k původu.** Dodaný `shieldio-logo-kit.zip` obsahoval jen artwork
> (SVG + PNG), žádný psaný manuál. Geometrie níže je **naměřená z SVG souborů**.
> Kde jde o doporučení, ne o fakt z kitu, je to výslovně označeno.

---

## 1. Soubory a co kdy použít

V repu (`assets/icons/`):

| soubor | kdy použít |
|---|---|
| `logo-full-color.svg` | hlavní logo (ikona + nápis) na světlém pozadí |
| `logo-full-white.svg` | totéž na tmavém pozadí |
| `favicon.svg` | favicon, moderní prohlížeče |
| `favicon-16/32/48.png`, `favicon.ico` | favicon, starší prohlížeče |
| `apple-touch-icon.png` | ikona na plochu iOS |
| `icon-192.png`, `icon-512.png` | PWA manifest, Organization JSON-LD |

V navbaru a patičce se obě varianty vloží zároveň a přepínají se přes CSS:

```html
<a class="logo" href="/index.html">
  <img class="logo-full logo-full-light" src="/assets/icons/logo-full-color.svg" alt="Shieldio">
  <img class="logo-full logo-full-dark"  src="/assets/icons/logo-full-white.svg" alt="Shieldio">
</a>
```

`.logo-full-dark` je skrytý, dokud není `:root[data-theme="dark"]`. Nikdy nepřebarvuj
logo přes CSS filtry — vždy vyměň soubor.

Zdrojový kit (mimo repo, `shieldio-logo-kit.zip`) má navíc černou a bílou variantu
ikony a PNG ve třech velikostech. Ty na webu potřeba nejsou.

---

## 2. Konstrukce značky

### Ikona — 740 × 740

Pět zaoblených čtverců v kříži na zaobleném čtvercovém podkladu.

| prvek | hodnota | v poměru |
|---|---|---|
| podklad | 740 × 740, radius 161.32 | radius = **21,8 %** strany |
| čtverec | 151.79 × 151.79, radius 47.06 | radius = **31 %** strany |
| mezera mezi čtverci | 37.95 | **25 %** strany čtverce |
| okraj kolem kříže | 104.36 | **14,1 %** strany podkladu |
| kříž celkem | 531.28 × 531.28 | **71,8 %** podkladu |

Pozice čtverců (x, y): střed `294.10, 294.10` · nahoře `294.10, 104.36` ·
dole `294.10, 483.85` · vlevo `104.36, 294.10` · vpravo `483.85, 294.10`.

Kříž je **opticky i matematicky vystředěný** — okraj 104.36 je na všech čtyřech stranách stejný.

### Nápis

Vlastní lettering, **není to font**. Nedá se přepsat v žádném písmu — vždy se
vkládá jako vektor. Píše se **malými písmeny**: `shieldio`, nikdy `Shieldio`
ani `SHIELDIO`.

Tři akcenty v nápisu jsou v brand barvě, zbytek liter v barvě textu:
- tečka nad prvním `i`
- tečka nad druhým `i`
- celé koncové `o` (je to prstenec, `fill-rule="evenodd"`)

### Lockup (ikona + nápis) — 4732.80 × 900

- Poměr stran **5,26 : 1**
- Ikona 740 vysoká, vertikální okraj 80 nahoře i dole
- Mezera mezi ikonou a nápisem **162.80** = **22 %** výšky ikony
- Výška verzálek nápisu je shodná s výškou ikony (740), takže obojí opticky sedí

**Lockup neskládej znovu ručně.** Rozestup je zapečený v souboru — použij
`logo-full-*.svg` jak je. Když potřebuješ samotnou ikonu, použij `favicon.svg`.

---

## 3. Barvy

### Brand barva

**Teal `#0d9488`.** Jediná akční barva značky. Používá se na tlačítka, odkazy,
akcenty v logu a aktivní stavy.

| token | hex | použití |
|---|---|---|
| `--accent` | `#0d9488` | primární tlačítka, akcenty v logu, aktivní stavy |
| `--accent-soft` | `#5eead4` | akcent na tmavém pozadí (v tmavém režimu) |
| `--accent-deep` | `#0b7a70` | hover na primárních tlačítkách, odkazy na světlém |

### Povrchy a text

| token | light | dark |
|---|---|---|
| `--paper` | `#fbfbfd` | `#000000` |
| `--paper-2` | `#f5f5f7` | `#121214` |
| `--surface` | `#ffffff` | `#1c1c1e` |
| `--line` | `#d2d2d7` | `#38383a` |
| `--ink` | `#1d1d1f` | `#f5f5f7` |
| `--ink-soft` | `#6e6e73` | `#98989d` |

### Barvy úrovní (tier)

**Nejsou to brand barvy.** Používají se **výhradně** k rozlišení úrovní desek —
na kartách úrovní, štítcích a názvech desek. Nikdy ne jako obecná dekorace,
nikdy ne pro tlačítka nebo odkazy.

| úroveň | vivid | deep (pro AA kontrast na světlém) |
|---|---|---|
| Green | `#16b548` | `#076e1f` |
| Yellow | `#ffba19` | `#bf8208` |
| Red | `#f72338` | `#a31212` |

Varianty `-deep` existují jen kvůli kontrastu na světlých kartách. V tmavém režimu
jsou aliasované na vivid, protože ta už na tmavém čte dobře.

Řada PRO má vlastní `--pro-blue #2463eb` a `--pro-purple #7c3aed` — zatím koncept.

### Pravidlo

**Každá barva jde přes token.** Žádné hex hodnoty přímo v komponentách. Nová barva
znamená nový token v `:root` **a** jeho protějšek v `:root[data-theme="dark"]`.

---

## 4. Typografie

Na webu se **nepoužívá lettering z loga** — ten je jen v logu samotném.

| role | písmo |
|---|---|
| text | `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif` |
| nadpisy | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif` |
| technické popisky, čísla, štítky | `'JetBrains Mono', monospace` |

Systémové písmo je první v pořadí, Inter je fallback z Google Fonts pro
non-Apple zařízení.

**JetBrains Mono** nese technický charakter značky. Používá se na eyebrow popisky,
štítky, ceny, čísla kroků a stavy — vždy `text-transform: uppercase`
a `letter-spacing: 0.04–0.06em`. Nikdy na běžný text.

---

## 5. Použití loga

### Ochranná zóna

*Doporučení, v kitu nebylo specifikováno.* Volný prostor kolem loga alespoň
**šířku jednoho čtverce z ikony** — tedy 20,5 % výšky ikony. Uvnitř té zóny
nesmí být text, jiné logo ani hrana obrázku.

### Minimální velikost

*Doporučení, ověřené na reálném nasazení:*

- Lockup: **min. 100 px** šířky. Web ho v navbaru vykresluje na 26 px výšky
  (na mobilu 22 px), což odpovídá zhruba 137 px šířky.
- Samotná ikona: **min. 16 px**. Pod tím se mezery mezi čtverci slévají.

### Co nedělat

- Nepřebarvovat jinak než na dodané varianty (color / white).
- Nepsat `Shieldio` velkým S vedle loga jako součást lockupu — nápis je v logu.
- Neroztahovat, nenaklánět, nepřidávat stín ani obrys.
- Nestavět lockup ručně z ikony a nápisu — použij hotový SVG soubor.
- Nedávat barevnou variantu na tmavé pozadí, na to je bílá varianta.
- Nepoužívat tier barvy (zelená/žlutá/červená) v logu.

---

## 6. Tón textů

Značka stojí na tom, že **netvrdí víc, než umí doložit**. To je součást identity,
ne jen redakční detail.

- **Věcně, konkrétně, čísly.** „100×100 mm", „do pěti minut", „550 Kč" místo
  „kompaktní", „rychle", „dostupně".
- **Popisuj záměr, ne zaručený výsledek.** Správně: „Navrženo tak, aby s ní mohl
  učit i učitel bez hlubších znalostí elektroniky." Špatně: „Zvládne ji i učitel
  bez technického vzdělání."
- **Stav produktů drž pravdivý a konzistentní.** Existuje jen **RED** (první série,
  k předobjednání). **Green**, **Yellow** a **PRO** jsou koncepty, **PowerAdd**
  je prototyp ve vývoji. Kde padne „3 úrovně", musí být poblíž jasné, že dvě
  z nich zatím nejsou k mání.
- **Publikum není jen škola.** Píše se pro učitele, kroužky **i domácí kutily**.
- Oslovení: na produktových a školních stránkách vykání, v návodech tykání
  (mluví k žákovi).

---

## 7. Odchylky od dodaného kitu

Kit přišel v **modré**. Web má **teal**, protože modrá se tloukla s akcentní
barvou zbytku webu. Přebarvení proběhlo takto:

| v kitu | v repu | co to je |
|---|---|---|
| `#2f6fed` | `#0d9488` | značková modrá → teal (`--accent`) |
| `#eef2ff` | `#e6f5f3` | podklad ikony |
| `#0f172a` | `#1d1d1f` | barva liter → `--ink` |

Přebarvené je **všechno** — vektory i rastry. Rastrové ikony jsou renderované
z `assets/icons/favicon.svg` pomocí `rsvg-convert`, takže jsou vždy odvozené
od vektoru, ne přebarvené po pixelech.

Přegenerování (po jakékoli změně `favicon.svg`):

```bash
for s in 16 32 48; do rsvg-convert -w $s -h $s assets/icons/favicon.svg -o assets/icons/favicon-$s.png; done
for s in 192 512; do rsvg-convert -w $s -h $s assets/icons/favicon.svg -o assets/icons/icon-$s.png; done

# iOS ikona: plná plocha bez vlastního zaoblení, iOS si nasazuje vlastní masku
sed 's|rx="161.32"|rx="0"|' assets/icons/favicon.svg > /tmp/fullbleed.svg
rsvg-convert -w 180 -h 180 /tmp/fullbleed.svg -o assets/icons/apple-touch-icon.png
```

`favicon.ico` je kontejner s PNG payloadem ve velikostech 16/32/48 — skript
na jeho složení je v historii commitu, který ho vytvořil.
