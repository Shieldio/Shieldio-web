# Programování Shieldio v prohlížeči

Editor: [`/instructions/blokovy-editor.html`](https://shieldio.cz/instructions/blokovy-editor.html).
Aktuální uživatelský postup: [první program a přehled režimů](https://shieldio.cz/instructions/programovani/#rezimy).
Návody na webu, průvodci projektů a textové verze odkazují na tento společný postup.

## Jednoduchý a pokročilý režim

- Jednoduchý režim je určený pro Shieldio RED. Pod názvem desky jsou kategorie LED,
  Tlačítka, Vzdálenost, Servo, Zvuk a Displej. Horní filtr rodin/modulů se nepoužívá.
- Displej má uvnitř sekce Text, Zvířátka a Kreslení. Text se píše přímo do bloku;
  čísla, úhly a ostatní hodnoty mají editovatelné shadow bloky. Výraz může nahradit
  hodnotu a po odebrání se editovatelné pole vrátí.
- Nové základní bloky čekání a délky tónu používají sekundy. Starší milisekundové
  bloky zůstávají platné a zachovávají čas. V C++ jsou delay() a millis() v ms.
- Pokročilý režim přidává Arduino C++, výběr desky, soubory, knihovny, sériový
  plotter a odesílání zpráv. Volba Pokročilé bloky přidává matematiku, číselné
  proměnné a sériové příkazy; pro časovač a theremin je potřeba.
- Návrat do jednoduchého režimu obnoví RED a základní kategorie bez smazání bloků.
  Opětovné otevření pokročilého režimu obnoví předchozí pro nastavení a desku.
  Import univerzálního/pokročilého projektu otevře odpovídající režim.

## Desky a USB

| Volba Deska | Procesor | Analogové vstupy | Limit aplikace | Bootloader |
| --- | --- | --- | --- | --- |
| Shieldio RED / klasické Nano | ATmega328P, 16 MHz | A0–A7 | 30 720 B | Optiboot 115200 / starý Nano 57600 |
| Arduino Uno R3 | ATmega328P, 16 MHz | A0–A5 | 32 256 B | 115200 |

Volba desky se předává do Workeru, kompilátoru a uploaderu; určuje makro Arduino,
analogové piny i meze HEX. Změna cíle zneplatní starou kompilaci.
Uno/Nano používají univerzální piny; hardwarové moduly RED mají vlastní pevnou mapu.
Uno R4, Nano Every a Nano 33 nejsou tímto AVR editorem podporované.
ESP32 má samostatné Studio a není cílem RED uploaderu.

Přímé USB používá Web Serial v desktop Chrome/Edge přes HTTPS nebo localhost.
Safari nemá podporu USB; bloky, C++, kompilace a export mohou fungovat bez ní.
Program se překládá místně, bez compile API a pomocného programu v místní síti.

`arduino-flasher.mjs` implementuje STK500v1: reset DTR/RTS, synchronizaci, ověření
ATmega328P, zápis 128B stránek a zpětné čtení každé stránky. Úspěch znamená ověřený
zápis. Chyba či odpojení nevytváří úspěšný výsledek; po přerušení nahraj znovu.

## OLED a knihovny

`assets/arduino/ShieldioDisplay.json` obsahuje ShieldioDisplay 0.3.0, licenci MIT
a přesný upstream commit. Načítá se podle include. Podporuje SSD1306 128×64 na
A4/A5, ASCII text 16×8, menu a zvířecí tváře Cat/Dog/Lion s pěti náladami a očima.
`face()` nahradí displej okamžitě a nepotřebuje render(). Text vyžaduje render();
na textové třídě další render() po tváři obnovuje předchozí text.
ShieldioCanvas pro tvary přidává pevný 1024B buffer. Samotný text a tváře jej nemají.

Servo, Wire, SPI, Adafruit GFX a SSD1306 jsou přibalené. Starší Adafruit sketche
zůstávají podporované; nový blokový OLED používá ShieldioDisplay/ShieldioCanvas.
RAM údaj počítá statická data a případný 1024B dynamický buffer Adafruit SSD1306.
Nezahrnuje běhový zásobník ani ostatní dynamické alokace.

Import vlastní knihovny vybírá kořenovou rozbalenou složku. Podporuje hlavičky
a C++ zdroje ve src/ i starší formát root+utility/. C, assembler a binární archivy
se odmítají. Závislosti je potřeba dodat; duplicitní veřejné hlavičky se odmítají.
Limit včetně ShieldioDisplay: 8 knihoven, 160 souborů, 12 C++ jednotek, 2 MB textu.
Vlastní knihovny jsou v paměti záložky a po obnovení je potřeba je načíst znovu.

## Monitor, plotter a odesílání

Jednoduchý monitor má jediné připojení. Otevření s vybraným portem začne přijímat.
Baud se odvozuje z číselného Serial.begin(...), jinak je 9600. Pokročilý monitor
má ruční rychlost, zastavení, vymazání, autoscroll a zprávy s LF/CRLF/bez ukončení.
Zpráva je nejvýše 4096 UTF-8 bajtů včetně konce řádku. Sketch musí data sám číst.

Monitor a plotter sdílí jeden port. Před nahráváním se dokončí probíhající zápis,
uvolní reader/writer a zavře port; po úspěšném uploadu se příjem obnoví.
Monitor uchovává 65 536 znaků, aktualizuje nejvýše po 80 ms a používá textContent.
Plotter je jen v pokročilém režimu, návrat do jednoduchého jej zavře.
Přijímá číslo na řádku, až osm hodnot, nebo pojmenované hodnoty A:12 B:34 / A=12,B=34.
Uchovává 600 vzorků a osm řad. Textové zprávy ignoruje, monitor je nadále ukazuje.

[Ukázka příjmu, grafu a příkazů](https://shieldio.cz/instructions/blokovy-editor.html?example=seriova_linka)
posílá A0 a přijímá 1/0 pro vestavěnou LED Arduino modulu.

## Architektura, úpravy a uložení

Blockly generuje C++ jen z bloků napojených na setup/loop; odložené bloky
nezavádějí periferní závislosti. Ultrazvuk sdílí jeden vzorek, používá 30ms timeout
a nejméně 60ms interval; chybějící echo je neplatné, nikoli nula centimetrů.
`shieldio:code-change` zneplatňuje neaktuální HEX.

Ruční C++ je oddělený zdroj. Při prvním otevření se převezme kód z bloků, další
změny jsou oddělené. Import .ino otevře Arduino C++, export .ino sleduje aktivní
záložku. Funkce musí být deklarované před použitím; nejsou generované Arduino prototypy.
Editor má čísla řádků, odsazování, párování a diagnostiku GCC s navigací do zdroje.
Ctrl/Cmd+Enter kompiluje, se Shiftem nahrává. Formátování mění odsazení, ne syntaxi.

Bloky a C++ se ukládají do localStorage, předvolby mají samostatné klíče. Nový projekt
vytvoří prázdnou práci, Vymazat bloky ponechá oba starty. Neprázdná práce vyžaduje
potvrzení smazání. Ukládej export pro přenos a zálohu; data prohlížeče mohou zmizet.

Předvolby: blikani, zavora, parkovani, zviratko. C++ ukázky: digitalni_metr,
ultrazvukovy_radar, zviratko, seriova_linka. Časovač a theremin jsou zadání
pro vlastní program, nikoli předstírané hotové sketche.

## Kompilátor a ověření

AVR GCC/binutils přes WebAssembly používají připnutý balíček
[@horang-corp/avr-gcc-wasm 0.2.0](https://www.npmjs.com/package/@horang-corp/avr-gcc-wasm).
[Zdrojové build skripty](https://github.com/horang-corp/avr-gcc-wasm) a
[licence](https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/THIRD_PARTY_NOTICES.md).
Nástroje se načítají z jsDelivr, Blockly z unpkg; první spuštění potřebuje internet.
Původní nástroje mají cca 54 MB nekomprimovaných podkladů; offline režim není zaručený.

Testy pokrývají Blockly a režimy, Uno/Nano kompilaci i meze HEX, diagnostiku,
import knihoven, příjem/odesílání serial dat, plotter a uvolnění portu při uploadu.
Odkazy a obsah ověřují site-content a site-journeys testy.
Skutečné AVR sestavení a mock USB nenahrazují fyzickou zkoušku na desce.
