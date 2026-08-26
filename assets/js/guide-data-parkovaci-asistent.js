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
    mblockGuideHref: "../../../../instructions/mblock/index.html",
  },

  glossary: {
    ultrazvuk: {
      term: "Ultrazvuk",
      photo: null,
      text: "Zvuk s frekvencí nad hranicí lidského sluchu. Senzor HC-SR04 ho vyšle a měří, za jak dlouho se odrazí zpět od překážky. Z toho spočítá vzdálenost.",
      fact: "Stejným principem se orientují netopýři nebo lodní sonary.",
      datasheet: null,
    },
    hcsr04: {
      term: "HC-SR04",
      photo: null,
      text: "Ultrazvukový senzor vzdálenosti. Má vysílač a přijímač zvukových vln a změří vzdálenost k nejbližší překážce s přesností na centimetry.",
      fact: "Běžný dosah je zhruba 2 cm až 4 m.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    arduino: {
      term: "Arduino",
      photo: "../../../../assets/images/RED_arduino_nano.jpeg",
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu ovládá senzory a výstupy.",
      fact: "Deska RED používá konkrétně Arduino Nano.",
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
      photo: null,
      text: "Součástka, která měří něco z okolí (například vzdálenost) a převádí to na elektrický signál, se kterým dál pracuje program.",
      fact: null,
      datasheet: null,
    },
    led: {
      term: "LED",
      photo: null,
      text: "Světelná dioda: malá součástka, která svítí, když jí prochází elektrický proud. V programu ji můžeš zapínat a vypínat podle podmínek.",
      fact: "Zkratka LED znamená Light Emitting Diode, dioda vyzařující světlo.",
      datasheet: null,
    },
    oled: {
      term: "OLED displej",
      photo: null,
      text: "Malý obrazovkový displej na desce, na který program může vypisovat text nebo čísla, třeba naměřenou vzdálenost.",
      fact: "Každý pixel OLED displeje svítí sám o sobě, takže displej nepotřebuje podsvícení.",
      datasheet: null,
    },
    mblock: {
      term: "mBlock",
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
      how: "Uvnitř desky je Arduino Nano, které podle nahraného programu vyhodnocuje vzdálenost a ovládá LED i displej.",
      fact: "Deska RED je aktuálně ve vývoji, první funkční prototyp.",
      datasheet: null,
    },
    {
      id: "arduino",
      name: "Arduino Nano",
      photo: "../../../../assets/images/red-build/15-arduino-nano.jpg",
      what: "Malý počítač na desce, který podle nahraného programu vyhodnocuje vzdálenost a ovládá LED i displej.",
      how: "Pokud máš nesestavenou sadu, je už zasunutý v patici na desce z návodu na pájení. Nic dalšího s ním dělat nemusíš.",
      fact: "Deska RED používá konkrétně Arduino Nano.",
      datasheet: null,
    },
    {
      id: "hcsr04",
      name: "Ultrazvuk HC-SR04",
      photo: "../../../../assets/images/red-build/16-ultrazvuk.jpg",
      what: "Měří vzdálenost auta od místa, kam parkuješ.",
      how: "Vyšle ultrazvukový signál a změří, za jak dlouho se odrazí zpátky.",
      fact: "Přesnost na centimetry, dosah až několik metrů.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    {
      id: "oled",
      name: "OLED displej",
      photo: "../../../../assets/images/red-build/17-oled-displej.jpg",
      what: "Malý obrazovkový displej na desce, program na něj může vypisovat naměřenou vzdálenost.",
      how: "Připojuje se přes I2C sběrnici, nemá polaritu ani orientaci, konektor jde zasunout jen jedním způsobem.",
      fact: "Standardní 0,96\" displej SSD1306, stejný typ používá i blokový editor.",
      datasheet: null,
    },
    {
      id: "usb",
      name: "USB-C kabel",
      photo: null,
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
      photo: null,
      instructions: "Ultrazvukový <span class=\"term\" data-term=\"senzor\">senzor</span> i <span class=\"term\" data-term=\"oled\">OLED displej</span> jsou už na desce zapojené, nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Deska se v počítači vůbec neobjeví. Zkus jiný USB port.",
          "Kabel je jen nabíjecí a nepřenáší data. Zkus jiný USB-C kabel.",
          "Deska je připojená, ale nic se neděje. Zkontroluj v mBlocku, že je vybraná správná deska.",
        ],
      },
    },
    {
      id: "connect-hcsr04",
      title: "Zapoj <span class=\"term\" data-term=\"ultrazvuk\">ultrazvuk</span>",
      type: "wiring",
      kit: "unassembled",
      photo: "../../../../assets/images/red-build/16-ultrazvuk.jpg",
      instructions: "Senzor <span class=\"term\" data-term=\"hcsr04\">HC-SR04</span> zapoj do konektoru označeného <b>ULTRAZVUK</b> na desce Shieldio RED. Konektor jde zasunout jen jedním způsobem.",
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
      photo: null,
      instructions: "OLED <span class=\"term\" data-term=\"oled\">displej</span> zapoj do konektoru označeného <b>OLED</b> na desce Shieldio RED. Konektor jde zasunout jen jedním způsobem. Program na něj bude vypisovat naměřenou vzdálenost.",
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
      diagnostics: [
        {
          title: "Chyba: Není nalezen port",
          items: [
            "Zkontroluj, že je deska připojená přes USB-C kabel.",
            "Zkus jiný USB port nebo kabel.",
            "Obnov stránku mBlock a zkus to znovu.",
          ],
        },
        {
          title: "Chyba: Není připojeno Arduino",
          items: [
            "V mBlocku zkontroluj, že je vybraná správná deska (Arduino Nano).",
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
      instructions: "Přibliž ruku k senzoru na desce. Rozsvítí se LED a displej ukáže vzdálenost, když jsi blízko?",
      tree: {
        question: "Rozsvítí se LED, když se přiblížíš k senzoru?",
        no: {
          question: "Mění se aspoň číslo vzdálenosti na displeji?",
          noResult: "Senzor asi neměří. Zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
          yesResult: "Vzdálenost se měří správně, ale LED se nerozsvěcí. Zkontroluj v programu prahovou hodnotu (kolik cm) pro rozsvícení LED.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Přidej druhou barvu LED, která upozorní, když je auto moc blízko." },
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
