# Kontrola exteriéru kostela – 18. 10. 2026

Podklad: celý veřejný originál `kostel%20exterier.mov`, 193 570 475 bajtů,
3840 × 1920, 30 snímků/s, délka 83,233333 s.
SHA-256: `b4507660f92c5805377f0da9609df239999d9fa4397092ee43c9eb123187bd2c`.

## Postup a meze kontroly

Celý let byl prohlédnut v panoramatických přehledech včetně začátku a odletu.
Každá z 538 výsledných kotev byla zobrazena v kontrolním výřezu skutečného
snímku v čase kotvy. Vodorovné okraje výřezů jsou periodické, aby bylo vidět
navázání na spoji panoramatu. Kontrolní snímky byly zmenšené na 1920 × 960;
nejde o ověření každého snímku při plném 4K rozlišení ani garanci pixelové přesnosti.

Dráhy vznikly sledováním vybraných fyzických detailů Lucasovým–Kanadeovým
optickým tokem po jednotlivých snímcích (30 Hz, pracovní obraz 960 × 480),
s periodickým přesahem obrazu a zpětnou kontrolou toku. Výsledné kotvy jsou
uložené každých 0,2 s, nikoli dopočítané pouhým rozdělením starých intervalů.
Kontrola výřezů vedla ke zkrácení intervalů u vstupu, kněžiště a sakristie,
než referenční prvek zmizí za rohem. U celkových značek hřbitova jde o označení
areálu; není to identifikace konkrétního hrobu.

## Opravy významu bodů

- Farní třída: uživatel výslovně určil nízkou zahnutou budovu na straně kostela.
  Značka nyní sleduje tuto budovu v časech 0–8 s a 75–83,2 s. Původní dráha
  44–56 s na patrové budově naproti kostelu byla odstraněna. Název ani historické
  údaje této budovy se neodvozují z architektonického katalogu kostela.
- Kříž: kotva na skutečném misijním kříži u vstupu, pouze 41–43,4 s.
- Náhrobky: kotva na skutečných památkách u zadní stěny sakristie, 53,4–56 s.
  Označení pohřbených jako duchovních bylo odstraněno, protože nebylo doložené.
- Odstraněny samostatné výplňové karty střechy, přístupové cesty, hřbitovního
  chodníku, údajné hřbitovní zdi a duplicitních náhrobků a vstupu síně.
- Boční vstup nahrazuje nepřesně sledovaná boční okna; jde o skutečné dveře
  se stříškou uprostřed jižní strany lodi.
- Manifest má 18 časových stop, některé ukazují tutéž stavbu v jiném úseku.
  Toto číslo neznamená 18 různých staveb ani 18 nezávislých památek.

Spoj panoramatu přechází sledované okno věže mezi 14,4 a 14,6 s, nikoli přesně
v 11 s. Regresní test ověřuje naměřený přechod i oba směry syntetického přechodu
od 11 s. Přehrávač normalizuje interpolované `u` do intervalu [0, 1).

## Referenční pixely pro opakování kontroly

Souřadnice jsou v panoramatu 1920 × 960, počátek vlevo nahoře.

| Stopa | Čas | x | y |
|---|---:|---:|---:|
| kostel-prvni | 11 | 1204 | 600 |
| vez-uvod | 14 | 1754 | 600 |
| hrbitov-prvni | 11 | 1000 | 650 |
| smutecni-prvni | 17 | 1200 | 575 |
| hrbitov-rady | 34 | 1050 | 608 |
| vez | 38 | 1633 | 430 |
| pruceli | 42 | 1047 | 675 |
| kriz | 42 | 1295 | 535 |
| lod | 45 | 803 | 450 |
| kneziste | 49 | 766 | 465 |
| sakristie | 51 | 697 | 629 |
| historicke-nahrobky | 54 | 301 | 666 |
| farni-trida | 0 | 535 | 735 |
| obradni-sin-zaver | 60 | 1000 | 550 |
| hrbitov-zaver | 70 | 1300 | 660 |
| vezni-hodiny | 38 | 1632 | 393 |
| bocni-vstup | 45 | 1055 | 595 |
| farni-trida-odlet | 80 | 530 | 724 |

## Informační zdroje

Odkazy na farnost, obec a Atlas české architektury zůstávají v kartách.
Při této opravě byly znovu načteny historie obce, stránka správy hřbitova a
katalogové popisy kostela a obřadní síně. Web farnosti vracel při automatickém
čtení 403; jeho odkaz byl zachován jako kontakt, nikoli jako nově ověřený důkaz.
Nedoložené datum rozšíření hřbitova 1968 bylo z karty odstraněno.

- https://www.stitna-popov.cz/obec/o-obci/neco-malo-z-historie-obce/
- https://www.stitna-popov.cz/obcan/mistni-hrbitov/
- https://archmap.cz/cs/objekt/51817
- https://archmap.cz/cs/objekt/52474
- https://farnosts.cz/

## Ověření přehrávače

`node --test tests/flight360-embed.test.mjs`: 12/12 testů. Testy pokrývají
embed směrování a hlavičky, hustotu a platnost kotev, viditelnost mimo interval,
referenční souřadnice a interpolaci přes seam v obou směrech. Ostatní scény
v manifestu zůstaly obsahově shodné s výchozím commitem 138a193.

Místní vizuální zkouška ovládání proběhla na kopii H.264 (1920 × 960) vytvořené
z téhož originálu: přehrávání/pauza, výběr Farní třídy s posunem na začátek,
časový posuv na 41,6 s a dialog sdílení se správným časem. Zdrojová URL v produkci
zůstává původní HEVC MOV; místní test nepotvrzuje jeho přehratelnost ve všech
prohlížečích. Vestavěný prohlížeč originál v místním náhledu nepřehrál.
