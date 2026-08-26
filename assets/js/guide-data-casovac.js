// Shieldio — guide data: Časovač
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "casovac",
  meta: {
    title: "Časovač",
    image: "../../../../assets/images/RED_hand_hold.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "20–30 minut",
    learn: ["Ultrazvuk", "Měření času", "Podmínky", "OLED displej"],
    parentHref: "../index.html",
    parentLabel: "Zpět na výběr projektů RED",
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
    oled: {
      term: "OLED displej",
      photo: null,
      text: "Malý obrazovkový displej na desce, na který program může vypisovat text nebo čísla, třeba naměřený čas.",
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
      what: "Hlavní deska celého projektu. Ultrazvukový senzor i OLED displej jsou už na desce zabudované.",
      how: "Uvnitř desky je Arduino Nano, které podle nahraného programu měří čas mezi událostmi zachycenými senzorem.",
      fact: "Deska RED je aktuálně ve vývoji, první funkční prototyp.",
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
      parts: ["shieldio-red", "usb"],
    },
    {
      id: "connect",
      title: "Připoj desku",
      type: "wiring",
      photo: null,
      instructions: "Ultrazvukový <span class=\"term\" data-term=\"senzor\">senzor</span> i <span class=\"term\" data-term=\"oled\">OLED displej</span> jsou už na desce zabudované, nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
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
      instructions: "Zakryj rukou ultrazvukový senzor na desce. Spustí se na displeji odpočítávání nebo měření času?",
      tree: {
        question: "Spustí se časovač na displeji, když zakryješ senzor?",
        no: {
          question: "Mění se aspoň číslo vzdálenosti na displeji, i když se časovač nespustí?",
          noResult: "Senzor asi neměří. Zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
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
