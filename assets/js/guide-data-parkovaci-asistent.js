// Shieldio — guide data: Parkovací asistent
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "parkovaci-asistent",
  meta: {
    title: "Parkovací asistent",
    image: "../../../../assets/images/RED_hand_hold.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "20–30 minut",
    learn: ["Ultrazvuk", "Podmínky", "LED indikaci", "OLED displej"],
  },

  glossary: {
    ultrazvuk: {
      term: "Ultrazvuk",
      photo: null,
      text: "Zvuk s frekvencí nad hranicí lidského sluchu. Senzor HC-SR04 ho vyšle a měří, za jak dlouho se odrazí zpět od překážky — z toho spočítá vzdálenost.",
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
      photo: null,
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu ovládá senzory a výstupy.",
      fact: "Deska RED používá konkrétně Arduino Nano.",
      datasheet: null,
    },
    pin: {
      term: "Pin",
      photo: null,
      text: "Kovový kontakt na desce, kterým se propojují jednotlivé součástky — vstupy a výstupy signálu i napájení.",
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
      text: "Světelná dioda — malá součástka, která svítí, když jí prochází elektrický proud. V programu ji můžeš zapínat a vypínat podle podmínek.",
      fact: "Zkratka LED znamená Light Emitting Diode — dioda vyzařující světlo.",
      datasheet: null,
    },
    oled: {
      term: "OLED displej",
      photo: null,
      text: "Malý obrazovkový displej na desce, na který program může vypisovat text nebo čísla — třeba naměřenou vzdálenost.",
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
      photo: "../../../../assets/images/RED_hand_hold.jpeg",
      what: "Hlavní deska celého projektu — ultrazvukový senzor, LED i OLED displej jsou už na desce zabudované.",
      how: "Uvnitř desky je Arduino Nano, které podle nahraného programu vyhodnocuje vzdálenost a ovládá LED i displej.",
      fact: "Deska RED je aktuálně ve vývoji — první funkční prototyp.",
      datasheet: null,
    },
    {
      id: "usb",
      name: "USB-C kabel",
      photo: null,
      what: "Propojuje desku s počítačem.",
      how: "Slouží k nahrání programu i k napájení během programování.",
      fact: null,
      datasheet: null,
    },
  ],

  steps: [
    {
      id: "parts",
      title: "Připrav si součástky",
      type: "parts-check",
      parts: ["shieldio-red", "usb"],
    },
    {
      id: "connect",
      title: "Připoj desku",
      type: "wiring",
      photo: null,
      instructions: "Ultrazvukový <span class=\"term\" data-term=\"senzor\">senzor</span> i <span class=\"term\" data-term=\"oled\">OLED displej</span> jsou už na desce zabudované — nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Deska se v počítači vůbec neobjeví — zkus jiný USB port.",
          "Kabel je jen nabíjecí a nepřenáší data — zkus jiný USB-C kabel.",
          "Deska je připojená, ale nic se neděje — zkontroluj v mBlocku, že je vybraná správná deska.",
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
            "Zkus jiný USB kabel — některé nabíjecí kabely nepřenáší data.",
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
          noResult: "Senzor asi neměří — zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
          yesResult: "Vzdálenost se měří správně, ale LED se nerozsvěcí — zkontroluj v programu prahovou hodnotu (kolik cm) pro rozsvícení LED.",
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
      text: "Pokročilá řada Shieldio — zatím ve vývoji, ale mrkni, co chystáme.",
    },
  },
};
