// Shieldio — guide data: Časovač
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "casovac",
  meta: {
    title: "Časovač",
    image: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "20–30 minut",
    learn: ["Ultrazvuk", "Měření času", "Podmínky", "OLED displej"],
    parentHref: "../index.html",
    parentLabel: "Zpět na výběr projektů RED",
    editorHref: "/instructions/blokovy-editor.html",
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
    oled: {
      term: "OLED displej",
      photo: "../../../../assets/images/red-build-clean/17-oled-displej.jpg",
      text: "Malý obrazovkový displej na desce, na který program může vypisovat text nebo čísla, třeba naměřený čas.",
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
      what: "Hlavní deska celého projektu. V sestavené sadě jsou ultrazvukový senzor i OLED displej už zapojené, v nesestavené je zasuneš sám do patic z návodu na pájení.",
      how: "Uvnitř desky je modul kompatibilní s Arduino® Nano, které podle nahraného programu měří čas mezi událostmi zachycenými senzorem.",
      fact: "Deska RED vychází z otestovaných prototypů; u vývojové série zjišťujeme zájem o budoucí využití.",
      datasheet: null,
    },
    {
      id: "arduino",
      name: "Arduino Nano",
      photo: "../../../../assets/images/red-build-clean/15-arduino-nano.jpg",
      what: "Malý počítač na desce, který podle nahraného programu měří čas mezi událostmi zachycenými senzorem.",
      how: "Pokud máš nesestavenou sadu, je už zasunutý v patici na desce z návodu na pájení. Nic dalšího s ním dělat nemusíš.",
      fact: "Deska RED používá modul kompatibilní s Arduino® Nano.",
      datasheet: null,
    },
    {
      id: "hcsr04",
      name: "Ultrazvuk HC-SR04",
      photo: "../../../../assets/images/red-build-clean/16-ultrazvuk.jpg",
      what: "Měří vzdálenost a čas, po který je před senzorem překážka.",
      how: "Vyšle ultrazvukový signál a změří, za jak dlouho se odrazí zpátky.",
      fact: "Přesnost na centimetry, dosah až několik metrů.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    {
      id: "oled",
      name: "OLED displej",
      photo: "../../../../assets/images/red-build-clean/17-oled-displej.jpg",
      what: "Malý obrazovkový displej na desce, program na něj může vypisovat naměřený čas.",
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
      instructions: "OLED <span class=\"term\" data-term=\"oled\">displej</span> zapoj do konektoru označeného <b>OLED</b> na desce Shieldio RED. Před zasunutím bez napájení porovnej popisky napájení a signálů na modulu i desce. Program na něj bude vypisovat naměřený čas.",
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
      instructions: {"cs": "Pro blokovou variantu zapni Pokročilý režim a Pokročilé bloky; použiješ Vzdálenost, Proměnné a Displej. Blok čas od startu vrací milisekundy; výsledek v sekundách získáš vydělením rozdílu 1000. V editoru Shieldio sestav program, který při přiblížení ruky pod zvolený práh spustí měření času a výsledek zobrazí na OLED. Předem si určete, zda druhé přiblížení čas zastaví, nebo zda se měří do oddálení ruky; obě varianty jsou možné, ale třída musí testovat stejnou.", "en": "For the block version, enable Advanced mode and Advanced blocks; use Distance, Variables and Display. Time since startup is in milliseconds; divide the time difference by 1000 for seconds. Build a sketch that starts timing when a hand crosses your chosen distance threshold and displays the result on OLED. Decide whether the next approach or moving away stops timing, then test the same rule."},
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
      instructions: "Zakryj rukou ultrazvukový senzor na desce. Spustí se na displeji odpočítávání nebo měření času?",
      tree: {
        question: "Spustí se časovač na displeji, když zakryješ senzor?",
        no: {
          question: "Mění se aspoň číslo vzdálenosti na displeji, i když se časovač nespustí?",
          noResult: "Senzor asi neměří. Zkontroluj v editoru Shieldio, že nahrání skončilo bez chyby (krok 3).",
          yesResult: "Vzdálenost se měří správně, ale časovač se nespouští. Zkontroluj v programu podmínku, při jaké vzdálenosti (v cm) se má časovač spustit.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Zkus místo zakrytí rukou měřit čas mezi dvěma průjezdy před senzorem." },
      { text: "Zobraz na displeji nejlepší (nejkratší) naměřený čas." },
    ],
    moreProjects: [
      { title: "Prototyp závory", href: "../zavora/index.html" },
      { title: "Parkovací asistent", href: "../parkovaci-asistent/index.html" },
      { title: "Theremin", href: "../theremin/index.html" },
    ],
    levelUp: {
      title: "PROline",
      href: "../../../../products/PRO.html",
      text: "Pokročilá řada Shieldio, zatím ve vývoji, ale mrkni, co chystáme.",
    },
  },
};

