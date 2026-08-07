// Shieldio — guide data: Reakční hra (Baseline Green)
// NÁVRH — interní draft, název i koncept projektu zatím nejsou potvrzené.
// Stránka zatím není nikde na webu odkazovaná.
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "green-reakcni-hra",
  meta: {
    title: "Reakční hra",
    image: null,
    tier: "green",
    difficulty: "Green · Základ",
    duration: "15–20 minut",
    learn: ["Tlačítko", "LED", "Bzučák", "Podmínky"],
  },

  glossary: {
    tlacitko: {
      term: "Tlačítko",
      photo: null,
      text: "Nejjednodušší vstupní součástka — program pozná, jestli je zmáčknuté nebo ne, a podle toho reaguje.",
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
    bzucak: {
      term: "Bzučák",
      photo: null,
      text: "Součástka, která podle povelu z programu vydá krátký tón nebo pípnutí — používá se jako zvuková odezva.",
      fact: null,
      datasheet: null,
    },
    analogovy_vstup: {
      term: "Analogový vstup",
      photo: null,
      text: "Vstup, který kromě zapnuto/vypnuto umí číst i plynulé hodnoty — třeba míru natočení nebo intenzitu signálu ze senzoru.",
      fact: null,
      datasheet: null,
    },
    arduino: {
      term: "Arduino",
      photo: null,
      text: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu čte vstupy a ovládá výstupy.",
      fact: null,
      datasheet: null,
    },
    pin: {
      term: "Pin",
      photo: null,
      text: "Kovový kontakt na desce, kterým se propojují jednotlivé součástky — vstupy a výstupy signálu i napájení.",
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
      id: "shieldio-green",
      name: "Shieldio GREEN",
      photo: null,
      what: "Hlavní deska projektu — tlačítko, LED i bzučák jsou už na desce zabudované.",
      how: "Program náhodně rozsvítí LED a měří, jak rychle na ni reaguješ stiskem tlačítka.",
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
      parts: ["shieldio-green", "usb"],
    },
    {
      id: "connect",
      title: "Připoj desku",
      type: "wiring",
      photo: null,
      instructions: "<span class=\"term\" data-term=\"tlacitko\">Tlačítko</span>, <span class=\"term\" data-term=\"led\">LED</span> i <span class=\"term\" data-term=\"bzucak\">bzučák</span> jsou už na desce zabudované — nic navíc zapojovat nemusíš. Stačí desku připojit přes USB-C kabel k počítači.",
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
            "V mBlocku zkontroluj, že je vybraná správná deska.",
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
      instructions: "Zmáčkni tlačítko, jakmile se rozsvítí LED. Ozve se bzučák a hra zareaguje?",
      tree: {
        question: "Reaguje hra na stisk tlačítka?",
        no: {
          question: "Rozsvítí se LED vůbec?",
          noResult: "LED se nerozsvěcí — zkontroluj v mBlocku, že program běží a deska je připojená (krok 3).",
          yesResult: "LED svítí, ale tlačítko nic nedělá — zkontroluj v programu blok, který čte stisk tlačítka.",
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Zkus přidat počítadlo, kolikrát po sobě zvládneš zareagovat správně." },
      { text: "Uprav rychlost hry — jak dlouho program čeká, než rozsvítí LED." },
    ],
    levelUp: {
      title: "Baseline Yellow",
      href: "../../../../products/YELLOW.html",
      text: "Další úroveň — teplota, vlhkost, světlo a vlastní meteostanice.",
    },
  },
};
