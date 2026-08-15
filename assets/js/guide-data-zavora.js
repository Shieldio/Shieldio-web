// Shieldio — guide data: Prototyp závory (Automatická závora)
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.

window.SHIELDIO_GUIDE = {
  id: "zavora",
  meta: {
    title: "Automatická závora",
    image: "../../../../assets/images/RED_barrier_closed.jpeg",
    tier: "red",
    difficulty: "Red · Pokročilá",
    duration: "45–60 minut",
    learn: ["Servo", "Ultrazvuk", "Podmínky", "Automatizaci"],
  },

  glossary: {
    servo: {
      term: "Servo",
      photo: null,
      text: "Motor, který se dokáže natočit do přesného úhlu (obvykle 0–180°) a v něm zůstat. Řídí se elektrickým pulzem (PWM signálem) — délka pulzu určuje úhel natočení.",
      fact: "Stejný princip řízení používají třeba serva v RC modelech letadel a aut.",
      datasheet: null,
    },
    pwm: {
      term: "PWM",
      photo: null,
      text: "Pulzně-šířková modulace — způsob řízení pomocí rychle se opakujících elektrických pulzů. Čím delší pulz, tím větší výstup (například úhel serva).",
      fact: "Zkratka PWM znamená Pulse Width Modulation.",
      datasheet: null,
    },
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
      photo: "../../../../assets/images/RED_arduino_nano.jpeg",
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
      what: "Hlavní deska celého projektu — na ni se připojuje servo i ultrazvukový senzor.",
      how: "Uvnitř desky je Arduino Nano, které podle nahraného programu ovládá vše připojené.",
      fact: "Deska RED je aktuálně ve vývoji — první funkční prototyp.",
      datasheet: null,
    },
    {
      id: "servo",
      name: "Servo SG90",
      photo: null,
      what: "Motor, který otáčí ramenem závory.",
      how: "Řídí se PWM signálem — délka pulzu určuje, do jakého úhlu se natočí.",
      fact: "SG90 je jedno z nejběžnějších hobby serv na světě.",
      datasheet: null,
    },
    {
      id: "hcsr04",
      name: "Ultrazvuk HC-SR04",
      photo: null,
      what: "Měří vzdálenost přijíždějícího auta od závory.",
      how: "Vyšle ultrazvukový signál a změří, za jak dlouho se odrazí zpátky.",
      fact: "Přesnost na centimetry, dosah až několik metrů.",
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
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
      parts: ["shieldio-red", "servo", "hcsr04", "usb"],
    },
    {
      id: "servo",
      title: "Zapoj <span class=\"term\" data-term=\"servo\">servo</span>",
      type: "wiring",
      photo: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
      instructions: "Servo zapoj do konektoru označeného <b>SERVO</b> na desce Shieldio RED. Konektor jde zasunout jen jedním způsobem — nedá se to splést.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Servo není zasunuté úplně — zkus ho zatlačit až na doraz.",
          "Kabel je otočený — konektor má jen jednu správnou orientaci.",
          "Servo není ve správném konektoru — zkontroluj popisek SERVO na desce.",
        ],
      },
    },
    {
      id: "hcsr04",
      title: "Zapoj <span class=\"term\" data-term=\"ultrazvuk\">ultrazvuk</span>",
      type: "wiring",
      photo: null,
      instructions: "Senzor <span class=\"term\" data-term=\"hcsr04\">HC-SR04</span> zapoj do konektoru označeného <b>ULTRAZVUK</b>. Stejně jako u serva — konektor jde zasunout jen správně.",
      troubleshoot: {
        title: "Nejčastější chyby",
        items: [
          "Senzor není zasunutý úplně — zkontroluj, že sedí na doraz.",
          "Kabel je v jiném konektoru než ULTRAZVUK.",
          "Senzor je otočený — vysílač a přijímač musí směřovat od desky ven.",
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
      blocksEditorHref: "../../../../instructions/blokovy-editor.html?preset=zavora",
      arduino: {
        screenshot: null,
        note: 'Ukázkový Arduino kód pro tento projekt zatím připravujeme — zkus mezitím blokové programování v <a href="../../../../instructions/blokovy-editor.html?preset=zavora">našem editoru</a>, má už nachystaný startovní program přesně pro tenhle projekt.',
        diagnostics: [
          {
            title: "Chyba: Nelze nahrát (upload error)",
            items: [
              "Zkontroluj, že je v Arduino IDE vybraný port desky (Tools → Port).",
              "Zkontroluj, že je vybraná správná deska (Tools → Board → Arduino Nano).",
              "Zkus jiný USB kabel — některé nabíjecí kabely nepřenáší data.",
            ],
          },
          {
            title: "Chyba: Kompilace selhala",
            items: [
              "Zkontroluj, že jsou nainstalované potřebné knihovny pro servo a ultrazvukový senzor.",
              "Projdi hlášku chyby — obvykle ukazuje přesný řádek s problémem.",
              "Zkus kód znovu zkompilovat po uložení souboru.",
            ],
          },
        ],
      },
    },
    {
      id: "test",
      title: "Vyzkoušej projekt",
      type: "diagnostic-tree",
      instructions: "Přilož ruku před ultrazvukový senzor. Otevřela se závora?",
      tree: {
        question: "Otevřela se závora?",
        no: {
          question: "Hýbe se servo vůbec?",
          noResult: "Servo asi není napájené. Zkontroluj kabel v kroku 2.",
          yes: {
            question: "Mění se hodnota vzdálenosti v mBlocku, když přiblížíš ruku?",
            noResult: "Ultrazvukový senzor asi není správně zapojený. Zkontroluj kabel v kroku 3.",
            yesResult: "Zkontroluj v programu prahovou hodnotu vzdálenosti — možná je nastavená příliš nízko.",
          },
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: "Zkus, aby se závora po pár sekundách sama zase zavřela." },
      { text: "Uprav v programu práh vzdálenosti, na jakou se závora otevírá." },
    ],
    moreProjects: [
      { title: "Parkovací asistent", href: "../parkovaci-asistent/index.html" },
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
