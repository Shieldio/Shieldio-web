# Audit elektro / UI — revize pracovního prostředí

Revize 21. 10. 2026 navazuje na připomínky k veřejné verzi `0d17693`. Cíl: srozumitelný školní editor s oddělenými pracovními režimy a korektním měřením.

| Nález | Oprava | Ověření |
| --- | --- | --- |
| Náhodná uzlová sonda zaměněná za napětí kondenzátoru | Výběr součástky → napětí mezi vývody / proud → cílový osciloskop | Regrese rozdílu 10 V − 4 V = 6 V, proudového kanálu a DOM výběru |
| Záznam skáče na začátek | Konec konečného záznamu zastaví přehrávání, restart je samostatná akce | DOM test konce, opakovaného Spustit a kroků |
| Příliš mnoho horních lišt, málo prostoru | Dvě lišty, ukázky v menu, skrývatelné panely a tažné oddělovače | DOM struktura a opětovné otevření panelů |
| Překrývající sondy a obdélníky výběru | Bez uzlových sond; zvýraznění samotné značky a celého propojení | DOM scény, vlastní SVG/CSS |
| Nejasné vybrání a přepojení vodiče | Celá ohnutá větev je jeden výběr; konce lze přetáhnout, úsek posunout | Modelové regrese ortogonality, větvení a výměny propojení |
| Přesun součástky odpojil vývod uprostřed vodiče | Před přesunem materializovat vývod jako dělicí bod vodiče | Audit toku moveConnected/splitAt |
| Tažení nesprávného rovnoběžného úseku | Hledání podle polohy kliknutého segmentu, nejen společné x/y | Audit containment podmínky |
| Dvojklik někdy přepnul dvakrát | Jediná akce na dvojklik; kliknutí pouze vybírá; OFF/ON ve vlastnostech | DOM test jednoho přepnutí |
| Změna logického vstupu resetovala paměť | Událostní checkpoint každého vzorku, pokračování z aktuálního času | Čítač, RESET, D FF, TON/TOF/TP, libovolný checkpoint |
| Změna analogového zdroje resetovala kondenzátor | Zachování napětí kondenzátorů, proudů cívek a výstupu OZ | Regrese kontinuity a absolutního času |
| Jemný zoom nebo decimace skryly úzké pulsy | Decimace viditelného rozsahu s min/max; logické přechody zachovány | Regrese jednovzorkové špičky, pulsu, mezery a zoomu |
| Duplicita posledního časového vzorku způsobila dt = 0 | Zaokrouhlení počtu kroků pouze v toleranci floating point, kontrola dt > 0 | Přesná i neceločíselná hranice časového záznamu |
| LED nad 2,35 mA nekonvergovala | Odstraněn fyzikálně nesprávný strop exp(40); spojitá limitovaná exponenciála a derivace | DC KCL pro 5 V / 330 Ω, proud > 5 mA |
| Proudový zdroj měl v ngspice neexistující branch vektor | Sériový snímací zdroj 0 V | Test polarity a transientního proudového kanálu |
| Generátor a cívka měly nevhodnou kresbu | Cívka se třemi oblouky; sinusová značka zůstává vzpřímená | Vlastní SVG a audit symbolů |
| Ukázky nebyly seřazené podle učiva | Základy, kondenzátory, AC/filtry, diody, OZ; logika a FBD odděleně | Režimový katalog a importní regrese |

## Rozsah ověřování

Automatické testy ověřují analytické Ohm/RC/RL/AC/RLC výsledky, filtry Wien/T, diody a OZ, logickou paměť, model editoru a Worker. Integrační kontrola zahrnuje DOM prostředí i skutečný Chromium přes Chrome DevTools Protocol: Web Worker, CSP, analogový záznam, výběr měření, třetí osciloskop, dvojklik vstupu a oddělení FBD. GitHub Actions před nasazením spouští také skutečné ngspice WASM referenční obvody. Automaticky ukládá snímky tmavého/světlého analogu a číslicového editoru. Po kontrole snímků se popisky grafů přizpůsobují skutečné šířce přístroje, značky DC zdroje zůstávají čitelné po otočení a prázdné logické osciloskopy se skrývají. Ověření touchpadu/dotyku a ostatních školních Safari/Chrome/Edge zůstává samostatnou kontrolou.

## Hranice modelu

- Nejde o validovaný RF ani smíšený analogově-digitální simulátor. AC do 10 GHz je výpočet ideálních soustředěných modelů.
- Krok se nastavuje automaticky, zpětný Euler numericky tlumí nejrychlejší děje. Velikost a délka výpočtu mají limity.
- FBD je výuková logika, ne kompatibilní import/export projektů Mosaic nebo kompilátor PLC.
- OZ nemodeluje proud napájecích větví. Zenerova a tunelová dioda jsou obecné výukové aproximace. Úplná shoda každého SVG s licencovanými listy IEC 60617 nebyla ověřena.
- Výstup logického prvku ukazuje vypočtený stav; ruční změna výstupu proti připojenému hradlu není platná logická operace.
- Změna topologie, počátečních podmínek nebo frekvence digitálních hodin spouští nový záznam; běžné přepnutí vstupu zachovává čas a paměť.

## Doplnění: souvislý běh a VA demo

Předchozí konečný záznam je nahrazen souvislou akvizicí. Testy `continuous.test.mjs` kontrolují absolutní čas, zachování RC/číslicového stavu, změnu zdroje a omezený buffer. Testy `xy-scope.test.mjs` ověřují všechny čtyři VA příklady proti KVL, I = U(RS)/RS a diodové rovnici. UI má společné časové grafy s nezávislými V/A osami a přepínání vstupu jediným kliknutím. Chrome QA zahrnuje hotové VA příklady, postup času přes více period, X–Y zoom a dva kanály v jednom grafu. Starší řádky výše popisují historickou revizi.
