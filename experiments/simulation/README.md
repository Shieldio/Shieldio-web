# SHiELDiO Sim

Česká webová elektrotechnická laboratoř pro výuku na SPŠ. Samostatný Cloudflare Worker na `simulation.shieldio.cz`; projektové soubory jsou přenosné a nejsou potřeba účty.

## Použití

1. Otevřete vzorový obvod nebo založte nový.
2. Součástku vyberte v knihovně a vložte kliknutím. Hodnoty lze zadávat s předponami, například `4.7k`, `100n`, `1e6`. Klávesa R otáčí vybranou součástku.
3. W zapne vodiče; klikněte na vývody nebo body mřížky. Esc ukončí spojování. Křížení bez koncového bodu není spoj. Každé analogové schéma potřebuje zem.
4. P přidává napěťové sondy vůči zemi. Spustit vypočte záznam a přehraje jeho časovou osu. Pozastavit zastaví přehrávání; přerušit lze i rozpracovaný výpočet.
5. Karta Pracovní bod ukazuje DC hodnoty. Přenos a fáze provede malou signálovou AC analýzu vůči zvolenému generátoru.
6. Uložit soubor zachová upravitelný projekt. Sdílet vytvoří odkaz obsahující jeho kopii. Export nabízí PNG, SVG a CSV naměřených hodnot.

## Modely a přesnost

- Živý výpočet používá modifikovanou uzlovou analýzu; časová integrace je zpětný Euler s pevným krokem. Časový krok je nezávislý na frekvenci kreslení obrazovky.
- R, L, C jsou soustředěné ideální prvky. Dioda používá exponenciální model. OZ má konečné zesílení, dominantní pól, napájecí meze a omezení slew rate. Jde o obecný model, nikoli konkrétní katalogový obvod.
- Časová simulace začíná nulovým napětím kondenzátorů a nulovým proudem cívek. DC karta naopak počítá ustálený pracovní bod.
- Pro časové průběhy zvolte alespoň 100 kroků na periodu a ověřujte výsledek dalším zmenšením kroku. Pevný krok tlumí rychlé přechodové děje a nezachycuje nekonečně rychlé ideální hrany.
- AC analýza přijímá frekvence do 10 GHz, ale v tomto pásmu znázorňuje matematickou odezvu modelu. Neobsahuje parazitní kapacity a indukčnosti plošného spoje, elektromagnetické vazby ani šíření po vedení. Nejde o ověřený RF návrhový nástroj.
- Zpoždění hradel a fyzikální metastabilita nejsou součástí ideální číslicové vrstvy. Číslicové a analogové schéma se nyní vyhodnocují odděleně. FBD je výukový režim, ne importér projektů Mosaic ani nástroj pro programování skutečného PLC.
- Chyby topologie a numerická nekonvergence zastaví výpočet; aplikace nemá nahrazovat chybný výsledek ilustrativním průběhem.

## Zdrojové moduly

| Soubor | Úloha |
| --- | --- |
| `app.mjs`, `index.html`, `style.css` | Editor, vlastnosti, přístroje, import a export |
| `engine.mjs` | Analogová MNA, DC, přechodová a AC analýza |
| `solver-worker.mjs` | Výpočet mimo hlavní vlákno; zrušení terminací Workeru |
| `digital.mjs` | Ideální číslicová logika, paměťové prvky a časovače FBD |
| `examples.mjs` | Původní zapojení se sondami a nastavením |
| `spice-adapter.mjs`, `spice-worker.mjs` | Izolované rozhraní k ngspice / EEcircuit-engine |
| `prepare-vendor.mjs` | Stažení pevné verze závislosti s ověřením SHA-256 |

## Nasazení a kontrola

Spustit z kořene repozitáře:

```sh
node --test experiments/simulation/tests/*.test.mjs tests/simulation-worker.test.mjs
node experiments/simulation/prepare-vendor.mjs
npx wrangler deploy --config wrangler.simulation.jsonc
```

Workflow `.github/workflows/deploy-simulation.yml` používá již zavedený repository secret `CLOUDFLARE_API_TOKEN` a stávající Cloudflare účet. Doména je deklarována jako Worker custom domain. Není nutné měnit konfigurace ostatních webů v repozitáři.

Knihovna EEcircuit-engine 1.8.0 se při sestavení stáhne pod pevně daným kontrolním součtem. Uživatelům ji pak poskytuje přímo vlastní doména. Přehled původu a licencí obsahuje `THIRD_PARTY.md`.

## Ověřování před další školní verzí

- Referenční regresní obvody: Ohmův zákon, dělič, RC/RL přechod, přenos a fáze RC, RLC rezonance, dioda a zpětná vazba/saturace/slew rate OZ.
- Pravdivostní tabulky, platné hrany klopných obvodů, čítače a časovače. Neurčité stavy a konflikty výstupů musí zůstat viditelné.
- Ruční ověření zapojování, touchpadu/dotyku, přepínání zdrojů a PNG exportu v Safari/Chrome/Edge na školních počítačích.
- Ověření shody vybraných průběhů s ngspice pro stejný model a stejné počáteční podmínky.
- Rozšíření přístrojů: diferenciální a matematické kanály, nezávislé osy kanálů, FFT a komfortnější kurzory.
- Teprve po ověření rozšiřovat tranzistory, konkrétní modely IO, toleranční analýzu a smíšené analogové/číslicové zapojení.

## Revize pracovního prostředí — 20. 10. 2026

Úvodní volba odděluje analog, číslicovou techniku a FBD. Katalog, ukázky a měření se filtrují podle režimu; import smí obsahovat jen součástky daného režimu. Každý režim má vlastní místní rozpracovaný projekt. Přechod přes horní menu uloží původní práci. Sdílený projekt zachovává `mode`.

- Horní nabídka obsahuje ukázky; žádný seznam ukázek nezabírá knihovnu součástek.
- Světlé/tmavé prostředí, jednotky v parametrech, pravé tlačítko otáčí, Esc/Hotovo ukončí vodič. Vodič se na cílovém vývodu ukončí sám. Vkládání je jednorázové, další kopii lze duplikovat.
- Dvojklik přepíná vstup/spínač. Pohyb bodů ukazuje konvenční směr proudu pouze na vodičích, kde lze proud určit z navazující dvouvývodové větve; animace neurčuje proud neznámé odbočky.
- Osciloskop přehrává posouvající se okno konečného vypočteného záznamu, při konci se vrací na začátek. Rychlost je rychlost přehrávání. Pauza a kroky umožňují číst jednotlivé vzorky. Slider zdroje přepočítá záznam od nulových počátečních podmínek, neudržuje stav kondenzátorů mezi dvěma změnami.
- Schottky: Shockleyův model s odlišným Is/n. Zener: interaktivně exponenciální propustná větev a lomený lineární závěrný průraz; ngspice používá D s BV/IBV/RS, takže průrazové křivky nejsou identické. Tunelová: analytická výuková aproximace špičkové větve + vodivost + Shockleyova větev, záporný diferenciální odpor. Není modelem konkrétního výrobku; nepokrývá všechny parazity nebo tunelové kapacity.
- OZ nově vkládaný má `powered:true` a napájecí vývody `vcc:(0,-60)` / `vee:(0,60)`. Výstup je omezen skutečně připojenými napětími, zachovává omezení pásma a přeběhu. Model nezahrnuje klidový proud ani přenos proudu do napájecích vývodů. Starší soubory bez `powered` zachovávají původní třívývodový model s parametrem `rail`.
- Ukázky dvojitého T a přemostěného T se testují proti analytickému přenosu. Přemostěné T je CRC se shuntem R/2 a přemostěním 2R; při f0 má přenos 1/3, nikoli úplnou zádrž.

Referenční zdroje: [IEC 60617 — oficiální databáze](https://webstore.iec.ch/en/publication/2723), [HMC — twin-T a bridged-T](https://pages.hmc.edu/ruye/e84/lectures/ch6/node4.html), [ADI MT-225](https://www.analog.com/media/en/training-seminars/tutorials/MT-225.pdf). Jednotlivé licencované listy IEC nebyly přístupné; aplikace netvrdí úplnou normovou shodu. Všechny kresby jsou vlastní SVG.
