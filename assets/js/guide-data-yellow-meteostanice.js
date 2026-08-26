// Shieldio — guide data: Meteostanice (Baseline Yellow)
// PŘÍPRAVNÝ interní návrh — stránka zatím není nikde na webu odkazovaná.
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "yellow-meteostanice",
  meta: {
    title: "Meteostanice",
    image: null,
    tier: "yellow",
    difficulty: "Yellow · Rozšíření",
    duration: "20–30 minut",
    learn: ["Teplotu a vlhkost", "Světlo", "Zvuk", "Displej"],
    parentHref: "../../../index.html",
    parentLabel: "Zpět na výběr návodů",
    mblockGuideHref: "../../../../instructions/mblock/index.html",
  },

  glossary: {
    dht11: {
      term: "DHT11",
      photo: null,
      text: "Senzor, který měří teplotu vzduchu a relativní vlhkost. Výsledek posílá desce jako digitální signál.",
      fact: "DHT11 měří teplotu zhruba v rozsahu 0–50 °C a vlhkost 20–90 %.",
      datasheet: null,
    },
    fotorezistor: {
      term: "Fotorezistor",
      photo: null,
      text: "Součástka, jejíž odpor se mění podle množství světla, které na ni dopadá. Díky tomu deska pozná, jak je kolem světlo nebo tma.",
      fact: null,
      datasheet: null,
    },
    mikrofon: {
      term: "Mikrofon",
      photo: null,
      text: "Snímá zvuk z okolí a mění ho na elektrický signál, se kterým může program dál pracovat, třeba zjistit, jestli je v místnosti hlasitý zvuk.",
      fact: null,
      datasheet: null,
    },
    oled: {
      term: "OLED displej",
      photo: null,
      text: "Malý obrazovkový displej na desce, na který program může vypisovat naměřené hodnoty: teplotu, vlhkost nebo světlo.",
      fact: "Každý pixel OLED displeje svítí sám o sobě, takže displej nepotřebuje podsvícení.",
      datasheet: null,
    },
    arduino: {
      term: "Arduino",
      photo: null,
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu čte senzory a ovládá výstupy.",
      fact: null,
      datasheet: null,
    },
    senzor: {
      term: "Senzor",
      photo: null,
      text: "Součástka, která měří něco z okolí (například teplotu nebo světlo) a převádí to na elektrický signál, se kterým dál pracuje program.",
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
      id: "shieldio-yellow",
      name: "Shieldio YELLOW",
      photo: null,
      what: "Hlavní deska projektu. Senzor teploty a vlhkosti, fotorezistor, mikrofon i OLED displej jsou už na desce zabudované.",
      how: "Program čte hodnoty ze senzorů a vypisuje je na displej.",
      fact: null,
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
      parts: ["shieldio-yellow", "usb"],
    },
    {
      id: "connect",
      title: "Připoj desku",
      type: "wiring",
      photo: null,
      instructions: "Senzor <span class=\"term\" data-term=\"dht11\">DHT11</span>, <span class=\"term\" data-term=\"fotorezistor\">fotorezistor</span>, <span class=\"term\" data-term=\"mikrofon\">mikrofon</span> i <span class=\"term\" data-term=\"oled\">OLED displej</span> jsou už na desce zabudované, nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
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
            "V mBlocku zkontroluj, že je vybraná správná deska.",
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
      instructions: "Podívej se na displej. Ukazuje aktuální teplotu a vlhkost?",
      tree: {
        question: "Ukazuje displej teplotu a vlhkost?",
        no: {
          question: "Objevilo se na displeji vůbec něco?",
          noResult: "Displej asi nedostává data. Zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
          yesResult: "Displej něco ukazuje, ale ne správné hodnoty. Zkontroluj v programu, že čteš data ze senzoru DHT11 správně.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Přidej podmínku, která na displeji upozorní, když je příliš horko nebo vlhko." },
      { text: "Zkus pomocí mikrofonu detekovat hlasitý zvuk a zobrazit varování." },
    ],
    levelUp: {
      title: "Baseline Red",
      href: "../../../../instructions/baseline/red/index.html",
      text: "Další úroveň: ultrazvuk, servo a vlastní robotika v pohybu.",
    },
  },
};
