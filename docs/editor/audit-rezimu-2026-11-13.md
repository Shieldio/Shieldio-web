# Audit přívětivosti editoru

## Opravené chování

- Jednoduchý režim nastaví skutečný profil RED a základní nabídku bloků,
  nikoli pouze skryté ovladače. Pokročilý režim obnoví poslední cílovou
  desku a výběr pokročilých bloků. Rozpracovaný program se nemaže.
- Import univerzálního nebo pokročilého projektu otevře pokročilý režim.
- Jediný viditelný výběr cíle: Shieldio RED, klasické Nano ATmega328P,
  Uno R3 ATmega328P. Volba cíle mění kompilaci, HEX limit, nahrávání
  i nabídku analogových pinů. Změna cíle zneplatní předchozí HEX.
- RED moduly mají vlastní kategorie pod označením desky. Displej má
  jedinou kategorii s vnitřními popisky Text, Zvířátka a Kreslení.
- Základní čekání i délka tónu jsou v sekundách. Legacy milisekundové
  bloky se nemigrují násobením ani přejmenováním, takže zachovají čas.
- Text pro displej se píše přímo do zaobleného pole. Samostatný textový
  operátor je dostupný v pokročilé nabídce. LED mají barvu i textový název.
- Jednoduchý monitor má jediné připojení a automatické odvození rychlosti
  z konstantního Serial.begin(...), jinak 9600 baud. Při otevření s již
  vybraným portem začne příjem automaticky. Plotter a nastavení jsou pro
  pokročilý režim; při návratu do jednoduchého se plotter zavře.
- Pokročilý monitor odesílá UTF-8 zprávy s LF, CRLF nebo bez ukončení.
  Omezení 4096 bajtů zahrnuje konec řádku. Před uploadem se dokončí zápis
  a uvolní reader/writer; monitor a plotter sdílí jediný port.
- Editor má vlastní scrollování; otevřené sériové panely nepřetékají
  do patičky ani nevytváří vodorovné přetékání stránky.

## Ověření

Headless Blockly: opakované přechody režimů, import/autosave,
sekundy a legacy projekty, jednotný displej, Uno analogové piny.
UI: skutečný cíl v compiler Worker zprávě, cache podle desky,
paměť Uno/Nano, skrytí plotteru, odesílání zpráv a upload handoff.
Serial: UTF-8, ukončení, limity, souběžný zápis, stop/disconnect.
Flasher: STK500v1, bootloadery, meze aplikace Uno/Nano, ověření zápisu.
Skutečný AVR GCC: původní projekty a blokové předvolby, Uno makro
a šest analogových vstupů, návrat na Nano s osmi vstupy.
Prohlížeč: RED → Uno → simple → pro, jeden displej, jednoduchý
monitor a ohraničení plotteru.

USB nahrávání na fyzickou Uno a Nano nebylo v této relaci provedeno.
Podpora se týká ATmega328P, nikoli Uno R4 nebo Nano Every.
