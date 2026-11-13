# Zvířátko na displeji a členění bloků RED

Nový projekt: `/instructions/baseline/red/zviratko/`.
Bloky: `?preset=zviratko`. Arduino C++: `?example=zviratko`.
Obě varianty používají ShieldioDisplay 0.3.0 a stejné chování:
bez stisku ospalá kočka, D11 veselá kočka, D12 překvapený pes.
D12 má při současném stisku přednost. Servo není potřeba.

Kategorie modulů jsou pod označením Shieldio RED: LED, Tlačítka,
Vzdálenost, Servo, Zvuk a Displej. Displej obsahuje sekce Text,
Zvířátka a Kreslení. Redundantní horní filtr byl odstraněn.
Jednoduchý režim nabízí čekání a délku tónu v sekundách; staré
milisekundové bloky se načítají se zachováním jejich významu.

## Co by pomohlo v knihovnách

- `face()` už má vhodné malé paměťové nároky. Přidat samostatný
  nepovinný animátor s `update(millis())` pro mrkání a změny nálad bez
  `delay()`. Nezvětšovat objekt pro všechny textové programy.
- Omezit opakované posílání stejné tváře. Teď jednoduché blokové cykly
  volají `face()` znovu, i když se zvíře, nálada a oči nezměnily.
  Umožnit explicitní vynucení překreslení po jiném obsahu displeje.
- Zpřístupnit výsledek inicializace a chyb přenosu. `begin()` je nyní
  `void`, takže program neumí uživateli spolehlivě oznámit chybějící OLED.
- Tlačítka se zákmitovým filtrem a jednorázovou událostí stisku, pevné
  piny RED a časované akce patří do samostatné podpory desky
  (např. ShieldioRed), nikoli do zobrazovací knihovny. Bloky i ruční C++
  pak mohou sdílet totéž API a stejné chování.

`face()` zobrazí obraz okamžitě a zabere celý displej. Na textové třídě
další `render()` obnovuje textový obsah; v bloku zvířátka se proto
nevolá. Tvary používají ShieldioCanvas s dalším 1024B bufferem,
samotná zvířátka používají ShieldioDisplay.

## Ověření

Headless Blockly 13.2.1: načítání předvoleb, generování C++, filtrování
modulů, zachování bloků, staré projekty a validace importu.
AVR GCC: C++ projekt 9588 B flash / 728 B statické RAM;
blokový projekt 9532 B flash / 727 B statické RAM.
Obě varianty se vejdou do Nano / ATmega328P.
Fyzické chování nového projektu je potřeba ověřit na desce;
samotné zvířecí tváře už otestoval správce projektu na OLED.
