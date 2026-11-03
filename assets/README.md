# Sdílené soubory

[Přehled projektu](../README.md) · [Dokumentace](../docs/README.md)

| Složka | Obsah |
| --- | --- |
| [css/](css/) | Sdílený `style.css`, homepage `home.css`, editor `arduino-programming.css` a styly dalších aplikací. |
| [js/](js/) | Ovládání webu, překlady, návody a programovací editor. |
| [data/](data/) | Slovník `i18n.json`, vyhledávací index a data Learn. |
| [images/](images/) | Fotografie RED, montážní kroky a ilustrační podklady. |
| [icons/](icons/) | Loga a ikony podle [pravidel značky](../docs/development/brand.md). |
| [code/](code/) | Ukázkové programy pro projekty. |
| [arduino/](arduino/) | Podklady a přibalená knihovna pro webový kompilátor. |
| [videos/](videos/) | Video ukázka RED. |

## Editor

- `js/blockly-editor.js` a `js/shieldio-blocks.js`: pracovní plocha a generování programu.
- `js/arduino-programming.mjs`: ovládání editoru a návaznost kompilace na nahrávání.
- `js/arduino-source-editor.mjs` a `js/arduino-diagnostics.mjs`: úpravy C++ a vysvětlení chyb.
- `js/arduino-compiler-worker.mjs` a `js/avr-compiler.mjs`: překlad programu.
- `js/arduino-flasher.mjs`: přenos do desky přes USB.

Architekturu, omezení a testy popisuje [dokumentace editoru](../docs/editor/README.md).
