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

Trojúhelníkový generátor 25 Hz napájí sériovou kombinaci R1, D1 a snímacího RS = 100 Ω. R1 omezuje proud. První osciloskop má připravené X = U(D1), Y = I(D1), druhý sleduje snímací napětí U(RS) v čase. Po přepnutí prvního do Y–t se současně ukáže U(D1) a I(D1) s vlastními osami. U(D1) je rozdíl A–K, proud souhlasí s U(RS)/100 Ω. U Zenerky má závěrná větev záporné U i I. Použité modely nemají tepelný průraz, parazitní kapacity nebo výrobcem ověřené parametry konkrétního typu.

Tlačítko Y–t / X–Y v každém analogovém osciloskopu mění režim. X a Y lze zvolit z libovolných měřených kanálů. Paměť drží stopu; vypnutá paměť zobrazuje krátkou pohyblivou stopu. Kolečko a +/− přibližují, tažení posouvá osy, Celý obnoví rozsah. Kliknutím na stopu se odečte současný pár U/I. Volba os se ukládá do souboru i sdíleného odkazu. PNG/SVG obsahuje i X–Y graf.

Logické vstupy a spínače přepíná jediný klik, tažení je přesouvá. Dvojklik neprovede druhé přepnutí. Stav ON/OFF je na vstupu, vypočtené 0/1/X na vývodech a stav vodičů je barevný. Číslicová paměť a časovače navazují mezi výpočetními úseky.

Zdroje: DC je kresleno dlouhou kladnou a krátkou zápornou elektrodou, generátor kruhem s právě zvoleným průběhem, proudový zdroj kruhem se směrovou šipkou. Jde o vlastní kresby běžných konvencí; úplná shoda s licencovanou databází IEC se netvrdí. Referenční popisy: [SparkFun — čtení schémat](https://learn.sparkfun.com/tutorials/how-to-read-a-schematic/all.pdf), [Tektronix — současné kanály v XY](https://www.tek.com/en/support/faqs/does-tds1000-2000-series-have-xy-display-format-addition-yt), [Pico — charakteristiky v XY](https://www.picotech.com/library/knowledge-bases/oscilloscopes/xy-display-mode).

## Zjednodušené nabídky a přístroje

Součástky a ukázky jsou rozdělené do rozbalovacích skupin. Ukázky ve výběru mají pouze názvy. Návod k VA měření je sbalený pod „Zapojení a měření VA“.

Každý osciloskop má × pro zavření, + Kanál pro přímý výběr součástky/veličiny a nabídku ⋯ s měřítky. Kanál lze odebrat × přímo u jeho názvu pod grafem. Zavření přístroje přečísluje ostatní; kanály potřebné jiným X–Y přístrojem zůstanou zachované. Lze zavřít i poslední osciloskop a nový přidat tlačítkem + Osciloskop. Zpět obnoví zavřený přístroj i kanály. Tato úprava neobnovuje počáteční stav běžícího obvodu.

## Diode measurement lab (October 2026)

Open `?example=1n4148`, `?example=bat54`, `?example=ls-p47k` or
`?example=bzx55c5v1`. All four examples share one series circuit, with a
triangle source, R1, the diode, RS and ground. The Zener is intentionally
reversed: its cathode faces the source. Scope 1 contains UD and ID; scope 2
plots the synchronous pair UD/ID. The 25 Hz source has a 40 ms period;
10 ms/div and eight horizontal divisions show two periods.

The method selector switches to ideal voltmeter/ammeter readouts with a
stepped DC source. Capture a point or select calculated samples from the
record, then export the table as CSV. Saved rows retain their device identity.
Every displayed point comes from the same solver time, node voltages and
branch current. CSV columns include t_ms, US_V, UD_V, URS_V, ID_mA, VA_V and
VK_V. ID is always positive A to K, including the reversed Zener. Its shunt
voltage is therefore positive while its reverse diode current is negative.

The forward model is a Shockley junction plus an implicit external series
resistance: I = Is[exp((UD − I rs)/(n VT)) − 1], with VT=25.85 mV, and a small
numerical leakage conductance. The Zener junction adds a reverse breakdown
branch with finite dynamic resistance; the selected parameters give about
−5.10 V at −5 mA. These are labelled educational approximations at 25 °C,
not measured data, a vendor SPICE model or an exact catalogue curve. Device
parameters and manufacturer references are in diode-devices.mjs. Warnings
compare current, reverse voltage and power with the catalogue limits and
conditions; no destructive behavior or artificial current clamp is applied.

Known physical limits: no junction capacitance, reverse recovery,
self-heating, package parasitics, transmission lines or instrument loading.
The GHz time controls support inspecting ideal lumped-circuit mathematics;
they do not validate a real diode or board at RF. The native transient method
is backward Euler. The SPICE exporter retains the same series resistance.

Scope sensitivity is initialized once and remains fixed when source
parameters change. Use Auto explicitly to fit a new range. Each channel can
set sensitivity and zero; optional rising/falling triggering only changes
the displayed interval. Acquisition time stays monotonic. Pause freezes the
screen and Reset is the explicit time reset. The buffer holds at most 12,000
samples; CSV exports the retained record or explicitly saved table rows.

Keyboard: R resistor, C capacitor, L inductor, D diode, V DC voltage source,
A AC source, I current source, G ground, O op-amp, S switch; Q select,
W wire, Shift+R rotate, Esc cancel, Delete remove, Space run/pause.
Drag a wire from a terminal to another terminal or an existing conductor.
Shift changes the bend direction. A branch endpoint splits the conductor
and makes an electrical junction; crossings alone remain unconnected.
