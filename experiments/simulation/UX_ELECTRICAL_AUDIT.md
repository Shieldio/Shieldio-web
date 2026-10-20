# Audit elektro / UI — SHiELDiO Sim

Stav k 20. 10. 2026. Poslední ověřená veřejná revize: `0d17693c58b3d0d3318e91e8da02e1801adca99b`.

Tento dokument zachycuje konkrétní nálezy z uživatelského testování a z rozpracované revize. Rozpracované změny byly uloženy v původním místním pracovním prostředí, které se odpojilo. Nejsou součástí této větve a tento audit nepotvrzuje jejich dokončení.

## Nálezy a požadované výsledky

| Priorita | Nález | Požadované chování | Ověření |
|---|---|---|---|
| P0 | Jedna napěťová sonda měří uzel vůči zemi, nikoli napětí součástky. | Výběr součástky → napětí mezi jejími dvěma vývody nebo proud větví → cílový osciloskop. | Plovoucí rezistor mezi 10 V a 5 V ukáže 5 V. Opačné pořadí vývodů obrátí znaménko. |
| P0 | Časový záznam se cyklicky vrací na začátek. | Konec záznamu zastaví přehrávání na posledním vzorku. Nový záznam je explicitní akce. | Čas je monotónní za běhu; po konci se po několika snímcích nezmění. |
| P0 | Změna zdroje přepočítává obvod od nulového počátečního stavu. | Při změně zdroje zachovat aktuální napětí kondenzátoru, proud cívky, absolutní čas a minulou část záznamu. | Nabít RC, v půlce změnit zdroj: Uc nemá neodůvodněný skok ani návrat k nule. Ověřit také RL a OZ. |
| P0 | Změna digitálního vstupu může znovu inicializovat celou sekvenční síť. | Přepnout vstup bez ztráty stavů pamětí, čítačů, hran hodin a časovačů. | D/JK/T klopný obvod, čítač a TON před a po změně vstupu v nenulovém čase. |
| P0 | Záznam přechodového děje předpokládá existenci DC pracovního bodu. | Přechodový výpočet smí fungovat i tam, kde neexistuje konečné DC ustálení. | Ideální proudový zdroj nabíjející kondenzátor bez paralelního odporu: dU/dt = I/C. |
| P1 | Propojení je interně i uživatelsky soubor jednotlivých úseček. | Ohnutý vodič je jedno vybíratelné propojení; větvení a vývody tvoří jeho hranice. | Ohnutý vodič se vybere jako celek, počet propojení nezávisí na počtu ohybů. |
| P1 | Výběr vodiče není výrazný a jeho přepojení vyžaduje smazání. | Výrazná barva, viditelné koncové body; tažením konce přepojení na jiný vývod, tažením úseku změna trasy. | Přepojit existující NAND vstup bez smazání; ověřit výslednou logiku i undo/redo. |
| P1 | Otáčení bloků vytváří nepřehledné trasy. | Číslicové a FBD bloky mají pevné čtení zleva doprava. Pravé tlačítko otevírá kontextovou nabídku. Analog se otáčí explicitní operací. | Pravý klik na FBD blok nezmění natočení ani zapojení. |
| P1 | Digitální stavy jsou skryté v sondách a grafech. | Přímé 0/1/X/Z u výstupů a čitelné OFF/ON u vstupu. Výstupní indikátor není nucený zdroj logické hodnoty. | NAND: 1,1 → 0; přepnutí jednoho vstupu → 1. Odpojený a konfliktní signál zobrazí Z/X. |
| P1 | Panelové lišty zabírají většinu výšky. | Dvě kompaktní horní lišty; měnitelné šířky boků, měnitelná výška osciloskopů, možnost panely skrýt. | 1280×720 i větší rozlišení; ovládací prvky nepřekrývají schéma ani graf. |
| P1 | Parametry jádra zatěžují žáka, parametry zdrojů chybí. | Automatický výpočetní krok; odborné parametry zdroje: amplituda, offset, frekvence, perioda, fáze, průběh, střída. | f a T jsou vzájemně převrácené; dva zdroje s 90° ukážou posun T/4. |
| P1 | Osciloskop nemá samostatné časové a svislé měřítko. | Více osciloskopů vedle sebe, zoom a posun času, kurzor, krokování a nezávislé svislé měřítko. | Zvětšit detail RC děje, odečíst proud v µA a vrátit celý záznam. V různých grafech nesmí dojít k záměně V a A. |
| P1 | Tmavé schéma má nízký kontrast a rušivý výběrový obdélník. | Kontrastní značky a vodiče; zvýraznění skutečné značky. Obdélník případně jen neviditelná zásahová oblast. | Vizuální kontrola obou motivů, výběru součástky i vodiče. |
| P2 | Cívka a otočený AC zdroj neodpovídají požadované kresbě. | Cívka se třemi oblouky; vlnka v AC zdroji čitelná i při svislém umístění. | SVG i PNG po otočení 0/90/180/270°. Úplná normová shoda není bez přístupu k příslušným listům deklarována. |
| P2 | Ukázky nejsou pedagogicky seřazené. | Základy → kondenzátory a přechodové děje → AC a filtry → diody → OZ. | Nabíjení a vybíjení jsou samostatné úlohy s nastavitelným počátečním stavem. |

## Stav rozpracované revize před odpojením

Byly zapsány nové soubory pracovního editoru, model propojení a měření, SVG značky, přepracované HTML/CSS a rozšíření zdrojů a ukázek. Je nutné načíst skutečný místní obsah a pokračovat nad ním; nepřepisovat jej slepě starou veřejnou verzí.

Poslední lokální regresní kontrola:

- 21 analogových testů prošlo; jeden test všech ukázek selhal na novém proudovém zdroji s kondenzátorem při požadavku na DC pracovní bod.
- 15 číslicových testů prošlo.
- 5 testů SPICE adaptéru prošlo.
- Přechodový Worker byl následně upraven tak, aby časová analýza nevyžadovala předchozí DC výpočet. Tato změna ještě nebyla znovu ověřena.
- Nové UI nebylo dokončeně ověřeno v prohlížeči. Předchozích 46 úspěšných testů patří starší nasazené revizi, nikoli této přestavbě.

## Kontroly před nasazením

1. Opravit testovací předpoklad: ne každá přechodová úloha má DC ustálený stav. Testovat lineární nabíjení I/C a skutečný přechodový výpočet.
2. Doplnit testy diferenciálního napětí na plovoucí součástce, znamének U/I a měření ve více osciloskopech.
3. Doplnit testy zachování Uc a Il při pokračování v nenulovém čase. Prověřit slučování staré a nové části záznamu.
4. Ověřit pokračování digitální paměti po přepnutí vstupu, včetně zachování hran hodin a rozběhnutých časovačů.
5. Prověřit DC/AC proudové zdroje a LED v obou výpočetních cestách, včetně dostupných proudových kanálů.
6. Prověřit spojitost a topologii po přesunu součástky, otáčení analogu, přesunu ohybu a přepojení konce vodiče; změnu vrátit i zopakovat.
7. Ověřit klik/dvojklik během běžícího vykreslování; ovládací prvky nesmějí mizet pod kurzorem při aktualizaci.
8. Ověřit konec záznamu bez opakování, pauzu bez posunu času, přesně jeden vzorek při krokování, časový zoom a posun grafu.
9. Import/export starých projektů, oddělení pracovních režimů, ukládání měření, PNG/SVG a číselné CSV.
10. Vizuální kontrola obou motivů a malého rozlišení; uložit skutečný náhled dokončené verze.

Nasazení označit jako dokončené až po úspěšném běhu testů a ověření veřejné domény. Výukové modely neoznačovat jako dokonale fyzikálně nebo RF validované.
