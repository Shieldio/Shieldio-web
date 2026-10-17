# Shieldio Flight360 — experimentální 360° prohlížeč

Interaktivní webové demo pro sférická 360° videa z dronu.

## Co funguje
- Equirectangular 2:1 panoramatické video MP4/WebM přes lokální výběr souboru (bez uploadu na server).
- Rozhlížení myší/dotykem/šipkami, kolečko a slider zoomu.
- Přehrávání, pozastavení, seek, rychlost, fullscreen.
- Ilustrační statické panorama před nahráním souboru.
- Responzivní mobilní layout.

## Spuštění
Otevřete `index.html` z lokálního HTTP serveru nebo nasaďte složku `experiments/flight360/` jako statické stránky. Pro Three.js je potřeba internet (ES modul z jsDelivr). Použijte aktuální prohlížeč s WebGL.

## Omezení
Není to skutečné volné létání ve 3D. Panorama se přehrává po natočené trase. Demo neobsahuje video uživatele, GPS/telemetrii ani backend. 8K 360° záznam nemusí všechny prohlížeče hardwarově dekódovat; pro produkci se hodí optimalizovaný stream.

## Publikace
Tento PR je určen pro schválení; není automaticky veřejně nasazen na shieldio.cz. Možné URL po integraci: `https://shieldio.cz/experiments/flight360/` (podle pravidel existujícího nasazení).
