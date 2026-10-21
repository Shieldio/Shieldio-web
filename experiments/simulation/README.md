# SHiELDiO Sim

Česká webová elektrotechnická laboratoř pro SPŠ na `simulation.shieldio.cz`. Samostatný Cloudflare Worker v repozitáři Shieldio-web. Bez účtů, projekt se ukládá jako soubor nebo samostatný sdílený odkaz.

## Práce v laboratoři

1. Při otevření vyberte **Elektrické obvody**, **Číslicovou techniku** nebo **FBD bloky**. Každé prostředí má vlastní knihovnu, ukázky a rozpracovaný projekt. Analogové a logické prvky se nemíchají.
2. Horní nabídka obsahuje soubor, logicky seskupené ukázky a základní operace. Součástku vložte z knihovny; kliknutím ji vyberete, tažením přesunete. Klávesa R otáčí analogové součástky; bloky mají stálou orientaci.
3. W zapne spojování vývodů, Esc spojování ukončí. Pravé tlačítko nabízí operace. Vybraný vodič se zvýrazní a zobrazí konce pro přepojení; tažení čáry posouvá úsek. Ohnuté propojení se počítá jako jeden vodič. Křížení bez vývodu nebo koncového bodu zůstává oddělené.
4. Číslicový vstup přepne **jediný klik** nebo tlačítka OFF/ON ve vlastnostech. Výstupy ukazují přímo 0/1; X znamená neurčitý stav a Z odpojený signál. Výstupu připojeného hradla nelze ručně vnutit jiný stav.
5. U analogové součástky vyberte **napětí mezi jejími vývody** nebo **proud součástkou** a cílový osciloskop. Napětí kondenzátoru je V(a) − V(b), ne uzlové napětí vůči zemi. U OZ jde o napětí OUT vůči zemi a proud výstupního vývodu.
6. Spustit zahájí průběžný výpočet a posouvání okna osciloskopu. Pozastavit, šipky a časový kurzor umožňují inspekci vzorků. **Reset** obnoví počáteční stav. Rychlost určuje postup simulace a časová základna šířku zobrazeného okna.
7. Až čtyři osciloskopy mají vlastní časové i svislé měřítko. Kolečko přibližuje čas, tažení posouvá okno. Napětí a proud lze sledovat současně s levou a pravou osou. Přenos/fáze je samostatná AC analýza.
8. Parametry přijímají SI předpony, například `4.7k`, `100n`, `2m`. Generátor má frekvenci, periodu, fázi, amplitudu, offset, průběh a střídu. Při živé změně zdroje zůstává stav kondenzátorů a cívek v aktuálním čase; logické vstupy zachovávají stav pamětí a časovačů. Změna struktury nebo hodinové frekvence vyžaduje nový záznam.
9. Šířku postranních panelů a výšku osciloskopů mění tažení oddělovačů. Panely lze skrýt. Světlý/tmavý motiv se pamatuje. Soubor nabízí export schématu s měřením do PNG/SVG a dat do CSV.

## Modely a přesnost

- Analog: modifikovaná uzlová analýza, pevný krok zpětného Eulerova schématu. Automatická volba kroku z délky záznamu, frekvencí a časových konstant. Výpočet běží ve Web Workeru a lze jej přerušit.
- Ideální soustředěné RLC, napěťové i proudové zdroje, spínač, exponenciální dioda/LED/Schottky, Zenerova a tunelová aproximace. Kondenzátor může mít počáteční napětí, cívka počáteční proud.
- OZ má konečné zesílení, dominantní pól, omezenou rychlost přeběhu a volitelné skutečné napájecí vývody V+/V−. Model nezahrnuje klidový proud ani výkon napájecích větví. Starší třívývodové modely používají parametr rail.
- Digitální/FBD vrstva: ideální čtyřstavová logika, kombinační funkce, klopné obvody, čítač, registr, TON/TOF/TP. Události jsou vyhodnocené i mezi zobrazovanými vzorky. Neobsahuje fyzikální zpoždění, napěťové úrovně ani metastabilitu; není importérem Mosaic nebo nástrojem pro skutečné PLC.
- AC do 10 GHz představuje matematickou odezvu ideálního modelu. Nezahrnuje parazity, vedení ani elektromagnetické vazby. Není validovaným RF návrhovým nástrojem. Časový záznam má limity počtu vzorků a velikosti matice.
- Pohyb ve vodičích zobrazuje konvenční proud nebo opačný pohyb elektronů tam, kde lze proud určit z navazující dvouvývodové větve. Neznámé větve neanimuje. Rychlost bodů není fyzikální driftová rychlost elektronů.
- ngspice je zachováno jako izolované referenční rozhraní a regresní kontrola. Uživatelské prostředí nevyžaduje volbu řešiče ani časového kroku.

## Moduly a ověření

| Soubor | Úloha |
| --- | --- |
| app.mjs, index.html, style.css | Editor, panely, přístroje a export |
| workbench-model.mjs, symbols.mjs | Propojení, diferenciální měření, import, automatické nastavení a SVG značky |
| engine.mjs, solver-worker.mjs | Analogové výpočty a Worker |
| digital.mjs | Událostní logika, paměťové checkpointy a FBD |
| examples.mjs | Analogové ukázky od základů po filtry a zesilovače |
| spice-adapter.mjs, spice-worker.mjs | Referenční ngspice / EEcircuit-engine |

```sh
node experiments/simulation/prepare-vendor.mjs
node --test experiments/simulation/tests/*.test.mjs tests/simulation-worker.test.mjs
npx wrangler deploy --config wrangler.simulation.jsonc
```

GitHub Actions před nasazením ověřuje analogové rovnice, digitální paměť, model editoru, referenční ngspice WASM a Worker. Následuje integrační test ve skutečném Chromiu (bez dodatečné knihovny), který ukládá snímky prostředí do GitHub Actions artefaktů. EEcircuit-engine 1.8.0 se stáhne s pevným SHA-256; vendor se necommituje. Licence jsou v THIRD_PARTY.md.

Značky jsou vlastní SVG podle běžných elektrotechnických konvencí. Jednotlivé placené listy IEC 60617 nebyly ověřeny; úplná normová shoda se netvrdí. Filtry Wien / dvojité T / přemostěné T se ověřují analyticky. Přemostěné T CRC se shuntem R/2 a přemostěním 2R má při f0 přenos 1/3.

Referenční zdroje: [IEC 60617](https://webstore.iec.ch/en/publication/2723), [HMC filtry T](https://pages.hmc.edu/ruye/e84/lectures/ch6/node4.html), [ADI MT-225](https://www.analog.com/media/en/training-seminars/tutorials/MT-225.pdf).

## Průběžná simulace a demo VA charakteristik — 21. 10. 2026

Aktuální běh navazuje výpočetní úseky v absolutním čase. Výchozí rychlost 1× používá skutečně uplynulý čas jako cíl simulace; při náročném výpočtu se čeká na další vypočtené vzorky. Není zde převod „1 s přehrávání = …“. Časová základna určuje šířku viditelného okna, ne konec děje. Paměť přístroje je omezený posuvný buffer. RUN navazuje, HOLD dovoluje inspekci a Reset jako jediný obnovuje počáteční stav. U/I lze přidat do jednoho časového grafu, jehož levá a pravá osa mají vlastní jednotky.

V horní nabídce jsou čtyři hotové VA příklady: Si, Schottky, Zener 5,1 V a LED. Přímé odkazy `/?example=diode-iv-silicon`, `/?example=diode-iv-schottky`, `/?example=diode-iv-zener`, `/?example=diode-iv-led` přeskočí úvodní volbu prostředí. Stiskněte Spustit.

Trojúhelníkový generátor 25 Hz napájí sériovou kombinaci R1, D1 a snímacího RS = 100 Ω. R1 omezuje proud. První osciloskop má připravené X = U(D1), Y = I(D1), druhý sleduje proud v čase. U(D1) je rozdíl A–K, proud souhlasí s U(RS)/100 Ω. U Zenerky má závěrná větev záporné U i I. Použité modely nemají tepelný průraz, parazitní kapacity nebo výrobcem ověřené parametry konkrétního typu.

Tlačítko Y–t / X–Y v každém analogovém osciloskopu mění režim. X a Y lze zvolit z libovolných měřených kanálů. Paměť drží stopu; vypnutá paměť zobrazuje krátkou pohyblivou stopu. Kolečko a +/− přibližují, tažení posouvá osy, Celý obnoví rozsah. Kliknutím na stopu se odečte současný pár U/I. Volba os se ukládá do souboru i sdíleného odkazu. PNG/SVG obsahuje i X–Y graf.

Logické vstupy a spínače přepíná jediný klik, tažení je přesouvá. Dvojklik neprovede druhé přepnutí. Stav ON/OFF je na vstupu, vypočtené 0/1/X na vývodech a stav vodičů je barevný. Číslicová paměť a časovače navazují mezi výpočetními úseky.

Zdroje: DC je kresleno dlouhou kladnou a krátkou zápornou elektrodou, generátor kruhem s právě zvoleným průběhem, proudový zdroj kruhem se směrovou šipkou. Jde o vlastní kresby běžných konvencí; úplná shoda s licencovanou databází IEC se netvrdí. Referenční popisy: [SparkFun — čtení schémat](https://learn.sparkfun.com/tutorials/how-to-read-a-schematic/all.pdf), [Tektronix — současné kanály v XY](https://www.tek.com/en/support/faqs/does-tds1000-2000-series-have-xy-display-format-addition-yt), [Pico — charakteristiky v XY](https://www.picotech.com/library/knowledge-bases/oscilloscopes/xy-display-mode).
