# SHiELDiO Sim

Česká webová elektrotechnická laboratoř pro SPŠ na `simulation.shieldio.cz`. Samostatný Cloudflare Worker v repozitáři Shieldio-web. Bez účtů, projekt se ukládá jako soubor nebo samostatný sdílený odkaz.

## Práce v laboratoři

1. Při otevření vyberte **Elektrické obvody**, **Číslicovou techniku** nebo **FBD bloky**. Každé prostředí má vlastní knihovnu, ukázky a rozpracovaný projekt. Analogové a logické prvky se nemíchají.
2. Horní nabídka obsahuje soubor, logicky seskupené ukázky a základní operace. Součástku vložte z knihovny; kliknutím ji vyberete, tažením přesunete. Klávesa R otáčí analogové součástky; bloky mají stálou orientaci.
3. W zapne spojování vývodů, Esc spojování ukončí. Pravé tlačítko nabízí operace. Vybraný vodič se zvýrazní a zobrazí konce pro přepojení; tažení čáry posouvá úsek. Ohnuté propojení se počítá jako jeden vodič. Křížení bez vývodu nebo koncového bodu zůstává oddělené.
4. Číslicový vstup přepne **dvojklik** nebo tlačítka OFF/ON ve vlastnostech. Výstupy ukazují přímo 0/1; X znamená neurčitý stav a Z odpojený signál. Výstupu připojeného hradla nelze ručně vnutit jiný stav.
5. U analogové součástky vyberte **napětí mezi jejími vývody** nebo **proud součástkou** a cílový osciloskop. Napětí kondenzátoru je V(a) − V(b), ne uzlové napětí vůči zemi. U OZ jde o napětí OUT vůči zemi a proud výstupního vývodu.
6. Spustit vypočte a přehraje konečný časový záznam. Pozastavit, šipky a časový kurzor umožňují inspekci vzorků. Na konci se záznam zastaví. **Od začátku** vytvoří nový děj. Rychlost mění přehrávání; délka záznamu určuje simulovaný čas.
7. Až čtyři osciloskopy mají vlastní časové i svislé měřítko. Kolečko přibližuje čas, tažení posouvá okno. Veličiny s odlišnými jednotkami mají vlastní přístroj. Přenos/fáze je samostatná AC analýza.
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
