// Shieldio — guide data: Parkovací asistent
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "parkovaci-asistent",
  meta: {
    title: "Parkovací asistent",
    image: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "20–30 minut",
    learn: ["Ultrazvuk", "Podmínky", "LED indikaci", "OLED displej"],
    parentHref: "../index.html",
    parentLabel: "Zpět na výběr projektů RED",
    editorHref: "/instructions/blokovy-editor.html?preset=parkovani",
    programmingGuideHref: "/instructions/programovani/",
  },

  glossary: {
    ultrazvuk: {
      term: "Ultrazvuk",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      text: "Zvuk s frekvencí nad hranicí lidského sluchu. Senzor HC-SR04 ho vyšle a měří, za jak dlouho se odrazí zpět od překážky. Z toho spočítá vzdálenost.",
      fact: "Stejným principem se orientují netopýři nebo lodní sonary.",
      datasheet: null,
    },
    hcsr04: {
      term: "HC-SR04",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      text: "Ultrazvukový senzor vzdálenosti. Má vysílač a přijímač zvukových vln a změří vzdálenost k nejbližší překážce s přesností na centimetry.",
      fact: "Běžný dosah je zhruba 2 cm až 4 m.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    arduino: {
      term: "Arduino",
      photo: "../../../../assets/images/RED_detail_nano_oled_white.jpg",
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu ovládá senzory a výstupy.",
      fact: "Deska RED používá modul kompatibilní s Arduino® Nano.",
      datasheet: null,
    },
    pin: {
      term: "Pin",
      photo: "../../../../assets/images/RED_layout_labeled.png",
      text: "Kovový kontakt na desce, kterým se propojují jednotlivé součástky: vstupy a výstupy signálu i napájení.",
      fact: null,
      datasheet: null,
    },
    senzor: {
      term: "Senzor",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      text: "Součástka, která měří něco z okolí (například vzdálenost) a převádí to na elektrický signál, se kterým dál pracuje program.",
      fact: null,
      datasheet: null,
    },
    led: {
      term: "LED",
      photo: "../../../../assets/images/red-build-clean/09-led.jpg",
      text: "Světelná dioda: malá součástka, která svítí, když jí prochází elektrický proud. V programu ji můžeš zapínat a vypínat podle podmínek.",
      fact: "Zkratka LED znamená Light Emitting Diode, dioda vyzařující světlo.",
      datasheet: null,
    },
    oled: {
      term: "OLED displej",
      photo: "../../../../assets/images/red-build-clean/17-oled-displej.jpg",
      text: "Malý obrazovkový displej na desce, na který program může vypisovat text nebo čísla, třeba naměřenou vzdálenost.",
      fact: "Každý pixel OLED displeje svítí sám o sobě, takže displej nepotřebuje podsvícení.",
      datasheet: null,
    },
    mblock: {
      term: "Editor Shieldio",
      photo: null,
      text: "Blokové programovací prostředí (podobné Scratchi), ve kterém se program sestavuje přetahováním barevných bloků místo psaní kódu. Funguje přímo v prohlížeči.",
      fact: null,
      datasheet: null,
    },
  },

  parts: [
    {
      id: "shieldio-red",
      name: "Shieldio RED",
      photo: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
      what: "Hlavní deska celého projektu. LED jsou napájené přímo na desce. V sestavené sadě jsou ultrazvukový senzor i OLED displej už zapojené, v nesestavené je zasuneš sám do patic z návodu na pájení.",
      how: "Uvnitř desky je modul kompatibilní s Arduino® Nano, které podle nahraného programu vyhodnocuje vzdálenost a ovládá LED i displej.",
      fact: "Deska RED vychází z otestovaných prototypů; u vývojové série zjišťujeme zájem o budoucí využití.",
      datasheet: null,
    },
    {
      id: "arduino",
      name: "Arduino Nano",
      photo: "../../../../assets/images/red-build-clean/15-arduino-nano.jpg",
      what: "Malý počítač na desce, který podle nahraného programu vyhodnocuje vzdálenost a ovládá LED i displej.",
      how: "Pokud máš nesestavenou sadu, je už zasunutý v patici na desce z návodu na pájení. Nic dalšího s ním dělat nemusíš.",
      fact: "Deska RED používá modul kompatibilní s Arduino® Nano.",
      datasheet: null,
    },
    {
      id: "hcsr04",
      name: "Ultrazvuk HC-SR04",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      what: "Měří vzdálenost auta od místa, kam parkuješ.",
      how: "Vyšle ultrazvukový signál a změří, za jak dlouho se odrazí zpátky.",
      fact: "Přesnost na centimetry, dosah až několik metrů.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    {
      id: "oled",
      name: "OLED displej",
      photo: "../../../../assets/images/red-build-clean/17-oled-displej.jpg",
      what: "Malý obrazovkový displej na desce, program na něj může vypisovat naměřenou vzdálenost.",
      how: "Připojuje se přes I2C: SDA na A4 a SCL na A5. GND a VCC musí odpovídat popiskům na desce i modulu. Před zasunutím odpoj napájení.",
      fact: "Standardní 0,96\" displej SSD1306, stejný typ používá i blokový editor.",
      datasheet: null,
    },
    {
      id: "usb",
      name: "USB-C kabel",
      photo: "../../../../assets/images/red-build-clean/15-usb-a-usb-c-kabel.jpg",
      what: "Propojuje desku s počítačem. V sestavené i nesestavené kompletní sadě je součástí balení 1,5m USB-A na USB-C kabel.",
      how: "Slouží k nahrání programu i k napájení během programování. Pokud dodaný kabel nemáš po ruce, funguje jakýkoli jiný funkční USB-C datový kabel.",
      fact: null,
      datasheet: null,
    },
  ],

  steps: [
    {
      id: "parts",
      title: "Připrav si součástky",
      type: "parts-check",
      parts: ["shieldio-red", "arduino", "hcsr04", "oled", "usb"],
    },
    {
      id: "connect",
      title: "Připoj desku",
      type: "wiring",
      kit: "assembled",
      photo: "../../../../assets/images/red-build-clean/15-usb-a-usb-c-kabel.jpg",
      instructions: "Ultrazvukový <span class=\"term\" data-term=\"senzor\">senzor</span> i <span class=\"term\" data-term=\"oled\">OLED displej</span> jsou už na desce zapojené, nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Deska se v počítači vůbec neobjeví. Zkus jiný USB port.",
          "Kabel je jen nabíjecí a nepřenáší data. Zkus jiný USB-C kabel.",
          "Deska je připojená, ale nic se neděje. Zkontroluj v editoru Shieldio, že je vybraná správná deska.",
        ],
      },
    },
    {
      id: "connect-hcsr04",
      title: "Zapoj <span class=\"term\" data-term=\"ultrazvuk\">ultrazvuk</span>",
      type: "wiring",
      kit: "unassembled",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      instructions: "Senzor <span class=\"term\" data-term=\"hcsr04\">HC-SR04</span> zapoj do konektoru označeného <b>ULTRAZVUK</b> na desce Shieldio RED. Před zasunutím bez napájení porovnej popisky napájení a signálů na modulu i desce.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Senzor není zasunutý úplně. Zkontroluj, že sedí na doraz.",
          "Kabel je v jiném konektoru než ULTRAZVUK.",
          "Senzor je otočený. Vysílač a přijímač musí směřovat od desky ven.",
        ],
      },
    },
    {
      id: "connect-oled",
      title: "Zapoj <span class=\"term\" data-term=\"oled\">displej</span>",
      type: "wiring",
      kit: "unassembled",
      photo: "../../../../assets/images/red-build-clean/17-oled-displej.jpg",
      instructions: "OLED <span class=\"term\" data-term=\"oled\">displej</span> zapoj do konektoru označeného <b>OLED</b> na desce Shieldio RED. Před zasunutím bez napájení porovnej popisky napájení a signálů na modulu i desce. Program na něj bude vypisovat naměřenou vzdálenost.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Displej se vůbec nerozsvítí. Zkontroluj, že je zasunutý na doraz v konektoru OLED.",
          "Displej svítí, ale nic nezobrazuje. Zkontroluj v programu, že je blok pro displej správně použitý.",
          "Displej je zasunutý v jiném konektoru. Zkontroluj popisek OLED na desce.",
        ],
      },
    },
    {
      id: "upload",
      title: "Nahraj program",
      type: "upload",
      screenshot: null,
      instructions: {"cs": "Otevři připravený program Parkovací asistent. Vzdálenost se měří jednou pro celý průchod a zobrazuje na OLED. Pod 15 cm svítí červená LED, od 15 do méně než 30 cm zelená, od 30 cm obě zhasnou. Bez echa program vypíše Bez echa/No echo a obě LED zhasnou. Základ nepoužívá bzučák. Najdi v blocích hodnoty 15 a 30 a před změnou předpověz výsledek.", "en": "Open the prepared Parking assistant program. Distance is sampled once per loop and shown on the OLED. Below 15 cm the red LED lights; from 15 to below 30 cm the green LED lights; at 30 cm and above both are off. With no echo the display reads Bez echa/No echo and both LEDs are off. The basic program does not use the buzzer. Find 15 and 30 in the blocks and predict the effect before changing them."},
      diagnostics: [
        {
          title: "Chyba: Není nalezen port",
          items: [
            "Zkontroluj, že je deska připojená přes USB-C kabel.",
            "Zkus jiný USB port nebo kabel.",
            "Obnov stránku editoru Shieldio a zkus to znovu.",
          ],
        },
        {
          title: "Chyba: Není připojeno Arduino",
          items: [
            "V editoru Shieldio zkontroluj, že je vybraná RED a správný USB port.",
            "Odpoj a znovu připoj USB-C kabel.",
            "Zkus jiný USB kabel, některé nabíjecí kabely nepřenáší data.",
          ],
        },
      ],
    },
    {
      id: "test",
      title: "Vyzkoušej projekt",
      type: "diagnostic-tree",
      instructions: {"cs": "Vyzkoušej předmět přibližně v 50 cm (obě LED zhasnuté), 20 cm (zelená) a 10 cm (červená). OLED ukazuje vzdálenost v cm. Při nezískaném echu mají obě LED zhasnout a OLED oznámit chybu měření. Výsledek porovnej s bloky, pak změň jeden práh a opakuj test.", "en": "Test an object at about 50 cm (both LEDs off), 20 cm (green) and 10 cm (red). The OLED shows centimetres. If no echo is received, both LEDs must be off and the OLED must report the invalid reading. Compare with the blocks, then change one threshold and repeat."},
      tree: {
        question: "Rozsvítí se LED, když se přiblížíš k senzoru?",
        no: {
          question: "Mění se aspoň číslo vzdálenosti na displeji?",
          noResult: "Nejdřív ověř úspěšné nahrání. Pokud OLED hlásí Bez echa/No echo, ověř orientaci senzoru bez napájení a zkus rovnou překážku před senzorem. Pokud je OLED prázdný, prověř jeho připojení a napájení podle své revize.",
          yesResult: "Vzdálenost se měří správně, ale LED se nerozsvěcí. Zkontroluj v programu prahovou hodnotu (kolik cm) pro rozsvícení LED.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Přidej bzučák jako volitelné rozšíření: při červené LED zahraj krátký tón. Při chybě měření tón nevydávej." },
      { text: "Uprav prahové hodnoty vzdálenosti tak, aby seděly na tvoje parkovací místo." },
    ],
    moreProjects: [
      { title: "Prototyp závory", href: "../zavora/index.html" },
      { title: "Časovač", href: "../casovac/index.html" },
      { title: "Theremin", href: "../theremin/index.html" },
    ],
    levelUp: {
      title: "PROline",
      href: "../../../../products/PRO.html",
      text: "Pokročilá řada Shieldio, zatím ve vývoji, ale mrkni, co chystáme.",
    },
  },
};

