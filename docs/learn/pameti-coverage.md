# Paměti PC — pokrytí podkladu v2

Zdroj: `LEARN_Pameti_PC_Content_Package_v2_ROZSIRENY.docx`, dodaný majitelem.
Lekce: `/maturita/otazka/automatizace-23-pameti-pc/`.

## Mapa učiva

| Oddíl podkladu | Kapitola v lekci |
|---|---|
| 4.1, 19.1 | 01 Rozdělení; 02 Hierarchie a volatilita |
| 4.2, 19.2 | 03 SRAM/DRAM/Flash; 05 SDRAM/DDR/moduly |
| 19.3 | 04 RS NOR/NAND, D prvky a registr |
| 4.3 | 06 Parametry, CL, kanály, ECC |
| 4.4 | 07 Adresování a READ/WRITE |
| 4.5 | 08 Registry a cache |
| 4.6 | 09 ROM/PROM/EPROM/EEPROM/Flash |
| 4.7, 19.4 | 10 HDD, disketa a páska; 11 SSD a NAND |
| 19.5 | 12 CD/DVD/Blu-ray, ROM/R/RW/RE |
| 19.6 | 13 SD/microSD, kapacitní rodiny a značení |
| 19.7 | 14 USB Flash a externí úložiště |
| 4.8, 19.8 | 15 Formát/konektor/sběrnice/protokol |
| 4.9 | 16 Jednotky, latence, propustnost, IOPS |
| Požadavek majitele 8. 9. 2026 | 17 Fragmentace HDD vs SSD |
| 4.10 | 18 Diagnostika a návrh systému |
| 19.9, 19.10 | 19 Vinyl a historické nosiče (L4) |
| 8, 20 | Maturita nanečisto a hodnoticí osnova napříč větvemi |

Všechny položky obsahového checklistu 24 jsou zastoupené. Kategorizace má sedm
pohledů; cvičení ověřuje šest nezávislých kritérií pro 18 skupin médií.
Výkon je samostatný výklad: latence nemá být zaměňována se sekvenční propustností.

## Implementace a omezení

- `learn-memory-data-v2.js`: výklad, srovnávací tabulky, cíle, zdroje a praktické otázky.
- `learn-memory-v2.js`: řízené modely, třídění, READ/WRITE, LRU, CL, diagnostika,
  otevřené odpovědi a ústní sebehodnocení. Automatické skóre se neprezentuje jako zvládnutí maturity.
- Fotografie navržené v podkladu jsou zatím nahrazené označenými výukovými schématy.
  Nejde o tvrzení, že byly dodány reálné fotografie EPROM nebo rozložené diskety.
- Některé návrhy animací jsou realizované krokováním stavů a textovým vysvětlením,
  nikoli souvislou fyzikální simulací. Modely nemají představovat benchmark hardwaru.
- L0 odkrývá odborný výklad, L1 přidává intuitivní vysvětlení, L2 osnovu odpovědi,
  L3 celé maturitní jádro, L4 automaticky otevírá rozšíření. Všechny kapitoly zůstávají dostupné.
- Výsledky pokusů se ukládají lokálně; rozepsané texty ne. Textové odpovědi hodnotí
  student s osnovou, případně vyučující; žádný nedoložený automatický NLP klasifikátor.

## Co závisí na dalších podkladech

Přesný školní rozsah L3, terminologie konkrétního vyučujícího, citace na stránky/slajdy,
školní příklady, odborné potvrzení hodnoticí osnovy a relevantní videa s časovými úseky.
Nejsou doplněné vymyšlenými zdroji. Citace standardů jsou přímo u příslušných kapitol.

## Ověření

`node tests/learn-memory.cjs` kontroluje datový kontrakt a čisté modely.
Před publikací navíc validační sada AGENTS.md a lokální HTTP kontrola všech kapitol,
klíčových stavových přechodů, úzkého zobrazení a obou témat.
