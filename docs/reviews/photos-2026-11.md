# Revize obrazových podkladů · listopad 2026

Vizuálně prohlédnuto všech 149 souborů v `assets/images/` ve skupinových náhledech, klíčové záběry také jednotlivě v plném rozlišení. Přiřazení fotografií k obsahu bylo zkontrolováno v úvodní stránce, produktu RED, přehledu projektů a montážním návodu.

| Sada | Zjištění | Rozhodnutí |
|---|---|---|
| RED v ruce, detail Nano/OLED, tlačítka, skutečná závora | Věrohodné fotografie prototypu. Některé kompozice se opakují. | Ponechat jako autentické produktové záběry; závora je jediný doložený hotový projekt na fotografii. |
| `RED_parking_assistant_white.png` | Ukazuje stejnou konfiguraci desky a závory; parkovací funkci nedokládá. | V kartách parkování použít fotografii skutečného senzoru HC-SR04 a text to výslovně uvádí. Původní soubor zůstává v archivu. |
| Karty Theremin a digitální metr | Záběr Nano/OLED nebo samotné součástky není fotografií běžícího projektu. | Theremin má detail bzučáku, metr detail displeje. Karty popisují, co snímek ukazuje. |
| Radar | Hotový otočný skener zatím není nafocen. | Karta ukazuje senzor a označuje projekt jako navazující experiment. V návodu zůstává referenční fotografie serva v prototypu závory a samostatný senzor, oba s popiskem. |
| `red-build-clean/00–62` a původní `red-build/00–62` | Montážní kroky jsou skutečné záběry PCB; část detailů je přepálená a čistší varianty nejsou vždy detailnější. Orientaci součástek je třeba číst z popisků a revize. | Zachovat reálné fotografie jednotlivých kroků. Původní sada je archivní; u rezistorů viz níže. |
| Rezistory 220 Ω, 10 kΩ, 330 Ω, 4,7 kΩ | Původní stolní makra mají tvrdé světlo a proužky nejsou spolehlivě čitelné. | Ve výběru součástek a tabulce jsou upravené ilustrační snímky v `assets/images/reference/`. U každého je upozornění na ověření multimetrem a odkaz na původní fotografii. Upravené proužky se **nesmějí** použít k určení hodnoty. |

Pro další focení mají největší přínos skutečný digitální metr s čitelným OLED, parkovací asistent při reakci na překážku a hotový radar s držákem senzoru. U nové revize PCB je nutné pořídit i detail R6/R7 a orientace polarizovaných dílů; montážní fotky nyní dokumentují RED V3 a nejsou automaticky referencí pro V4/V5.
