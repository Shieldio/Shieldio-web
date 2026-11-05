# Programování Shieldio RED v prohlížeči

Vstupní stránka: `/instructions/blokovy-editor.html`. Zachovává odkazy a preset `?preset=zavora`.

## Architektura

- Blockly generuje C++ pro RED. Událost `shieldio:code-change` zneplatní předchozí kompilaci.
- Záložka Arduino C++ obsahuje oddělený ruční zdroj. Společná lišta importuje `.ino` do této záložky a exportuje `.ino` aktuálního režimu nebo `.hex` aktuální úspěšné kompilace v obou režimech. Nastavení desky, soubory, knihovny a návod jsou rozbalovací. Editor používá dostupnou výšku okna a umožňuje zvětšení na celé okno.
- Module Worker překládá skutečným AVR GCC přes WebAssembly. Zdroj neopouští prohlížeč; neexistuje vzdálené compile API, tajný token ani serverový proces. Ruční `.ino` se překládá jako C++, s přidaným `Arduino.h`, bez automatického generování prototypů funkcí.
- `arduino-flasher.mjs` implementuje STK500v1 přes Web Serial: reset DTR/RTS, synchronizace, kontrola signatury ATmega328P, zápis stránek po 128 B, přečtení a porovnání každé stránky, opuštění bootloaderu a uvolnění USB portu.
- Výběr portu nastává přímo z kliknutí před případnou kompilací. Samotný port se otevírá až pro nahrání a vždy se zavře.
- Uspěje pouze ověřený zápis; výpadek USB, timeout, jiný čip a odlišný obsah flash se hlásí jako chyby. Při přerušení zápisu je potřeba nahrát znovu.
- Podporované desky: klasický Nano/RED, ATmega328P 16 MHz, 115200 pro Optiboot, 57600 pro starý bootloader. Limit aplikace 30 720 B v obou režimech chrání i větší starý bootloader. Nano Every/33/ESP32 nejsou podporované.
- RAM údaj je statická alokace z ELF. U SSD1306 připočítáváme 1024 B dynamického framebufferu. Zbývající prostor musí stačit zásobníku a dalším dynamickým alokacím; statická kontrola nezaručuje běhovou bezpečnost libovolného C++.

## Kompilátor a třetí strany

Připnutý balíček: [`@horang-corp/avr-gcc-wasm` 0.2.0](https://www.npmjs.com/package/@horang-corp/avr-gcc-wasm).

- [Zdrojový repozitář a build skripty](https://github.com/horang-corp/avr-gcc-wasm)
- [Původní oznámení a licence](https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/THIRD_PARTY_NOTICES.md)
- [Připnutý původní build adaptér](https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/firmware-builder.js)

Změny v `avr-compiler.mjs`: Nano identita a osm analogových vstupů, konzervativní Nano flash limit, načítání binárek explicitně, výběr pouze potřebných knihoven, výpočet statické RAM z ELF. WebAssembly nástroje a původní knihovní objekty se neupravují a načítají se z připnuté adresy na jsDelivr. První použití potřebuje internet; školní síť musí povolit `cdn.jsdelivr.net` a pro Blockly `unpkg.com`. Balíček obsahuje přibližně 54 MB nekomprimovaných podkladů. HTTP cache může opakované přenosy omezit; offline režim není garantovaný.

GCC a binutils jsou GPLv3+, knihovní objekty mají licence svých upstream projektů. Originální zdroje, úpravy a build pokyny toolchainu jsou v odkazovaném upstream repozitáři; zdroj naší úpravy je veřejně v tomto repozitáři. Vlastní C++ knihovny se načítají z místní složky; nepoužívá se registr ani vzdálený build.

## Ověření

`node --test tests/arduino-flasher.test.mjs` ověřuje Intel HEX, ochranu bootloaderu, protokolový přenos se zpětnou kontrolou, odmítnutí jiného čipu, poškozený zápis a uvolnění portu při chybě nebo zrušení.

Pro hardwarovou přejímku otevři stránku v desktop Chrome/Edge přes HTTPS nebo localhost, připoj RED, vyber port a nahraj blikání LED D5. Ověř oba bootloadery na příslušných deskách, servo, OLED a chování při vytažení USB. Cloudový test ani mock protokolu nenahrazuje tento fyzický test.

## Podpora prohlížečů

Editor používá výhradně přímé USB přes Web Serial, bez místního pomocného programu. Dostupnost ověřuje podle `navigator.serial` a zabezpečeného kontextu. Pro USB nahrávání používej desktop Chrome nebo Edge.

V Safari není Web Serial dostupné. Bloky, Arduino C++, kompilace a export fungují nezávisle na USB transportu; ovládání připojení a nahrávání je zakázané a UI vysvětluje, jak program přenést do podporovaného prohlížeče. Přepínač transportu, lokální síťové spojení i klientské knihovny pro pomocníka byly odstraněny. Žádné compile API ani místní služba nejsou potřeba.

Test `node tests/arduino-programming-ui.test.mjs` ověřuje dostupnost kompilace/exportu bez Web Serial, výběr a odpojení přímého USB, zrušení výběru portu, zotavení po chybě, ochranu proti exportu neaktuálního HEX a přenos zdrojového kódu. Workflow `test-arduino.yml` spouští UI i protokolové testy bez sítě a připojeného hardwaru.


## Pracovní prostředí a bloky

- Výběr desky zůstává podle barev; zatím jediný podporovaný cíl je RED / klasický Nano, ATmega328P, 16 MHz. Univerzální Arduino mění nabídku bloků, nikoli cílový procesor kompilace či uploaderu. Kód bez hardwarových Shieldio bloků neobsahuje jejich piny ani knihovny.
- Moduly RED: LED, tlačítka, HC-SR04, servo, bzučák, SSD1306 OLED. Výběr rodiny nabízí RED a neaktivní YELLOW/PRO; změna nabídky nemaže program. Pokročilá nabídka zpřístupní matematiku, číselné proměnné, sériovou linku a přímou práci s piny.
- Vstupy času, úhlu, tónu, textu, porovnání a opakování obsahují editovatelné shadow bloky. Číslo/text lze napsat přímo; vložený výraz nahradí placeholder, po jeho odebrání se pole vrátí. Chybějící placeholdery doplníme i při importu staršího projektu.
- Kód generují jen bloky připojené k setup/loop; nepoužité odložené bloky nezavádějí hardwarové závislosti. Ultrazvuk používá 30ms timeout.
- Pracovní plocha se přizpůsobuje změnám okna přes ResizeObserver; nerozmísťuje a nepřibližuje program sama. Celý program je samostatná akce. Náhled C++ je na širším okně vedle bloků, pod 1050px pod nimi.
- Bloky a rozepsaný C++ se průběžně ukládají do localStorage pro tentýž prohlížeč/origin. Ukládání do souboru zůstává potřebné pro přenos a zálohu. Parametr platného projektu `?preset=zavora` má přednost před automatickým obnovením.
- Editor C++ má čísla řádků a Tab/Shift+Tab pro odsazení. Ctrl/Cmd+Enter kompiluje, se Shiftem nahrává; upload se pořád řídí dostupností USB a běžnými kontrolami.

## ShieldioDisplay a vlastní knihovny

Přibalený `assets/arduino/ShieldioDisplay.json` obsahuje zdroje ShieldioDisplay 0.2.0, MIT licenci a přesný odkaz na upstream commit. Načte se z vlastního webu podle použití hlavičky. Textové OLED bloky používají úsporný ShieldioDisplay; bloky pro tvary volí ShieldioCanvas s 1024B grafickou pamětí. ShieldioDisplay má 16×8 ASCII textovou mřížku, nepodporuje diakritiku a při begin() zobrazí sekundový úvodní text. Staré ruční Adafruit programy lze dále kompilovat.

Import vybírá kořenovou složku jedné rozbalené knihovny. Podporován je formát se src/ (rekurzivně) i starší kořen + utility/. Příklady se nekompilují. Podporujeme .h/.hpp/.hh/.inc/.ipp/.tpp a C++ .cpp/.cc/.cxx. C, assembler, binární archivy a jiné architektury se odmítnou s vysvětlením; nejde o plnou implementaci všech formátů Arduino CLI.

Hlavičky a zdroje zůstávají v prohlížeči a předávají se Workeru. Z přímých a tranzitivních include vybereme pouze použité knihovny, přidáme jejich include cesty, každý C++ zdroj přeložíme samostatně a objekty spojíme se správnými přibalenými závislostmi. Shodné veřejné hlavičky se odmítají. Změna/odebrání knihovny zneplatní zkompilovaný HEX i pro stejný sketch. Limit včetně ShieldioDisplay je 8 knihoven, 160 souborů, 12 překládaných zdrojů a 2 MB textu. Importované knihovny jsou pouze pro otevřenou záložku a po obnovení se načítají znovu; UI to uvádí.

## Rozšířené testy

`tests/arduino-blocks.test.mjs` používá skutečný Blockly 13.2.1 v headless workspace: zadání do placeholderu, nahrazení výrazem a návrat, migrace starého projektu, filtry bez smazání programu, univerzální piny, proměnné, knihovny a opravená priorita matematických výrazů. Vytváří skutečné sketche pro LED, univerzální Arduino, servo a OLED.

`tests/arduino-libraries.test.mjs` kontroluje import, tranzitivní závislosti, limity, cesty, architektury, konflikty a odsazování. Rozšířený compiler test v CI překládá také sketche z Blockly, ShieldioDisplay a vlastní knihovnu s vnořeným C++ zdrojem závislým na Servo; ověřuje rovněž header-only knihovnu. Hardware ani vykreslení v reálném Chrome tyto testy nenahrazují.

## Diagnostika a úpravy C++

`assets/js/arduino-diagnostics.mjs` čte chyby GCC, slučuje totožné zprávy a nabízí vysvětlení běžných chyb. Přechod do zdroje je dostupný pouze pro řádky ručně psaného sketche. Jednoznačně chybějící `)` lze doplnit samostatným tlačítkem; návrh platí jen pro nezměněnou verzi zdroje. Knihovní chyby se neoznačují jako řádky sketche.

`assets/js/arduino-source-editor.mjs` zajišťuje Tab/Shift+Tab, odsazení nového řádku, párování závorek a uvozovek, přepínání řádkových komentářů a úpravu odsazení. Formátování mění odsazení, nikoli syntaxi C++; zachovává obsah víceřádkových řetězců a maker. Regrese pokrývá `tests/arduino-editor-assist.test.mjs` společně s testem UI.

## Průběh a správa projektu

Lišta zůstává viditelná před spuštěním i po dokončení. Kompilace má neurčitý běžící indikátor; nahrávání a zpětné ověření ukazují skutečný průběh zápisu a čtení. Fáze jsou označené Kompilace, Nahrání a Ověření.

Nový projekt vytvoří prázdné bloky i C++, odstraní vlastní knihovny a přejde na samostatné ukládání bez původního presetu. Vymazat bloky ponechá startovní bloky; v režimu C++ se stejná akce jmenuje Vymazat kód. Neprázdná práce se maže až po potvrzení. Obnovit editor před načtením stránky uloží bloky i C++; při chybě ukládání se obnovení neprovede. Během kompilace a nahrávání jsou tyto akce zakázané.
