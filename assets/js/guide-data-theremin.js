// Shieldio — guide data: Theremin
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "theremin",
  meta: {
    title: "Theremin",
    image: "../../../../assets/images/RED_hand_hold.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "20–30 minut",
    learn: ["Ultrazvuk", "Bzučák", "Mapování hodnot", "Zvuk"],
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
    bzucak: {
      term: "Bzučák",
      photo: null,
      text: "Součástka, která podle povelu z programu vydá tón. U theremina se jeho výška (frekvence) mění podle naměřené vzdálenosti ruky.",
      fact: null,
      datasheet: null,
    },
    frekvence: {
      term: "Frekvence",
      photo: null,
      text: "Počet kmitů zvukové vlny za sekundu, udávaný v hertzích (Hz). Čím vyšší frekvence, tím vyšší tón slyšíme.",
      fact: "Lidské ucho slyší zvuky zhruba od 20 Hz do 20 000 Hz.",
      datasheet: null,
    },
    arduino: {
      term: "Arduino",
      photo: "../../../../assets/images/RED_arduino_nano.jpeg",
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu vyhodnocuje vzdálenost a ovládá bzučák.",
      fact: "Deska RED používá konkrétně Arduino Nano.",
      datasheet: null,
    },
    senzor: {
      term: "Senzor",
      photo: null,
      text: "Součástka, která měří něco z okolí (například vzdálenost) a převádí to na elektrický signál, se kterým dál pracuje program.",
      fact: null,
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
      what: "Hlavní deska projektu. Ultrazvukový senzor i bzučák jsou už na desce zabudované.",
      how: "Uvnitř desky je Arduino Nano, které podle naměřené vzdálenosti mění výšku tónu bzučáku.",
      fact: "Deska RED je aktuálně ve vývoji, první funkční prototyp.",
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
      instructions: "Ultrazvukový <span class=\"term\" data-term=\"senzor\">senzor</span> i <span class=\"term\" data-term=\"bzucak\">bzučák</span> jsou už na desce zabudované, nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
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
      instructions: "Pohybuj rukou nad ultrazvukovým senzorem. Mění bzučák výšku tónu podle vzdálenosti ruky?",
      tree: {
        question: "Mění se výška tónu podle vzdálenosti ruky?",
        no: {
          question: "Ozývá se z bzučáku vůbec nějaký zvuk?",
          noResult: "Bzučák mlčí. Zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
          yesResult: "Zvuk hraje, ale výška se neměnÍ. Zkontroluj v programu, že naměřenou vzdálenost mapuješ na frekvenci tónu.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Zkus nastavit vlastní rozsah tónů, od nejnižšího po nejvyšší, jaký chceš slyšet." },
      { text: "Přidej podmínku, která ztiší nebo vypne tón, když je ruka moc daleko." },
    ],
    moreProjects: [
      { title: "Prototyp závory", href: "../zavora/index.html" },
      { title: "Parkovací asistent", href: "../parkovaci-asistent/index.html" },
      { title: "Časovač", href: "../casovac/index.html" },
    ],
    levelUp: {
      title: "PROline",
      href: "../../../../products/PRO.html",
      text: "Pokročilá řada Shieldio, zatím ve vývoji, ale mrkni, co chystáme.",
    },
  },
};
