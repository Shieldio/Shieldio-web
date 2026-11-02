# Programování Shieldio RED v prohlížeči

Vstupní stránka: `/instructions/blokovy-editor.html`. Zachovává odkazy a preset `?preset=zavora`.

## Architektura

- Blockly generuje C++ pro RED. Událost `shieldio:code-change` zneplatní předchozí kompilaci.
- Záložka Arduino C++ obsahuje oddělený ruční zdroj, import `.ino` a export `.ino`/`.hex`.
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

GCC a binutils jsou GPLv3+, knihovní objekty mají licence svých upstream projektů. Originální zdroje, úpravy a build pokyny toolchainu jsou v odkazovaném upstream repozitáři; zdroj naší úpravy je veřejně v tomto repozitáři. Další knihovny se za běhu neinstalují.

## Ověření

`node --test tests/arduino-flasher.test.mjs` ověřuje Intel HEX, ochranu bootloaderu, protokolový přenos se zpětnou kontrolou, odmítnutí jiného čipu, poškozený zápis a uvolnění portu při chybě nebo zrušení.

Pro hardwarovou přejímku otevři stránku v desktop Chrome/Edge přes HTTPS nebo localhost, připoj RED, vyber port a nahraj blikání LED D5. Ověř oba bootloadery na příslušných deskách, servo, OLED a chování při vytažení USB. Cloudový test ani mock protokolu nenahrazuje tento fyzický test.
