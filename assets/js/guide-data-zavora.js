// Shieldio — guide data: Prototyp závory (Automatická závora)
// Obsah je oddělený od enginu (assets/js/guide-engine.js) — nový návod
// se dělá jen přidáním nového souboru jako je tenhle.
//
// i18n: text fields are { cs, en } objects, resolved by guide-engine.js's t()
// against the shared site-wide language toggle (assets/js/lang.js).

window.SHIELDIO_GUIDE = {
  id: "zavora",
  meta: {
    title: { cs: "Automatická závora", en: "Automatic Barrier" },
    image: "../../../../assets/images/RED_barrier_closed.jpeg",
    doneVideo: "../../../../assets/videos/RED_demo.mp4",
    doneVideoPoster: "../../../../assets/images/RED_demo_poster.jpg",
    tier: "red",
    difficulty: { cs: "Red · Pokročilá", en: "Red · Advanced" },
    duration: { cs: "45–60 minut", en: "45–60 minutes" },
    learn: [
      { cs: "Servo", en: "Servos" },
      { cs: "Ultrazvuk", en: "Ultrasonic sensing" },
      { cs: "Podmínky", en: "Conditions" },
      { cs: "Automatizaci", en: "Automation" },
    ],
    parentHref: "../index.html",
    parentLabel: { cs: "Zpět na výběr projektů RED", en: "Back to RED projects" },
    mblockGuideHref: "../../../../instructions/mblock/index.html",
  },

  glossary: {
    servo: {
      term: { cs: "Servo", en: "Servo" },
      photo: null,
      text: {
        cs: "Motor, který se dokáže natočit do přesného úhlu (obvykle 0–180°) a v něm zůstat. Řídí se elektrickým pulzem (PWM signálem). Délka pulzu určuje úhel natočení.",
        en: "A motor that can turn to a precise angle (usually 0–180°) and hold it. It's controlled by an electrical pulse (a PWM signal), the pulse length sets the angle.",
      },
      fact: {
        cs: "Stejný princip řízení používají třeba serva v RC modelech letadel a aut.",
        en: "The same control principle is used by servos in RC model planes and cars.",
      },
      datasheet: null,
    },
    pwm: {
      term: { cs: "PWM", en: "PWM" },
      photo: null,
      text: {
        cs: "Pulzně-šířková modulace: způsob řízení pomocí rychle se opakujících elektrických pulzů. Čím delší pulz, tím větší výstup (například úhel serva).",
        en: "Pulse-width modulation: a way of controlling something with rapidly repeating electrical pulses. The longer the pulse, the bigger the output (for example, a servo's angle).",
      },
      fact: { cs: "Zkratka PWM znamená Pulse Width Modulation.", en: "PWM stands for Pulse Width Modulation." },
      datasheet: null,
    },
    ultrazvuk: {
      term: { cs: "Ultrazvuk", en: "Ultrasound" },
      photo: null,
      text: {
        cs: "Zvuk s frekvencí nad hranicí lidského sluchu. Senzor HC-SR04 ho vyšle a měří, za jak dlouho se odrazí zpět od překážky. Z toho spočítá vzdálenost.",
        en: "Sound above the range of human hearing. The HC-SR04 sensor sends it out and measures how long it takes to bounce back off an obstacle, then calculates the distance from that.",
      },
      fact: { cs: "Stejným principem se orientují netopýři nebo lodní sonary.", en: "Bats and ship sonar use the exact same principle to navigate." },
      datasheet: null,
    },
    hcsr04: {
      term: { cs: "HC-SR04", en: "HC-SR04" },
      photo: null,
      text: {
        cs: "Ultrazvukový senzor vzdálenosti. Má vysílač a přijímač zvukových vln a změří vzdálenost k nejbližší překážce s přesností na centimetry.",
        en: "An ultrasonic distance sensor. It has a transmitter and receiver for sound waves, and measures the distance to the nearest obstacle accurate to centimeters.",
      },
      fact: { cs: "Běžný dosah je zhruba 2 cm až 4 m.", en: "Typical range is about 2 cm to 4 m." },
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    oled: {
      term: { cs: "OLED displej", en: "OLED display" },
      photo: null,
      text: {
        cs: "Malý obrazovkový displej na desce, program na něj může vypisovat text, čísla nebo jednoduchou grafiku.",
        en: "A small screen on the board, the program can print text, numbers, or simple graphics to it.",
      },
      fact: {
        cs: "Každý pixel OLED displeje svítí sám o sobě, takže displej nepotřebuje podsvícení.",
        en: "Every pixel on an OLED display lights up on its own, so the display doesn't need a backlight.",
      },
      datasheet: null,
    },
    arduino: {
      term: { cs: "Arduino", en: "Arduino" },
      photo: "../../../../assets/images/RED_arduino_nano.jpeg",
      text: {
        cs: "Malý počítač (mikrokontrolér) uvnitř desky Shieldio, který podle nahraného programu ovládá senzory a výstupy.",
        en: "A small computer (microcontroller) inside the Shieldio board, it controls sensors and outputs according to the program you upload.",
      },
      fact: { cs: "Deska RED používá konkrétně Arduino Nano.", en: "The RED board specifically uses an Arduino Nano." },
      datasheet: null,
    },
    pin: {
      term: { cs: "Pin", en: "Pin" },
      photo: "../../../../assets/images/RED_layout_labeled.png",
      text: {
        cs: "Kovový kontakt na desce, kterým se propojují jednotlivé součástky: vstupy a výstupy signálu i napájení.",
        en: "A metal contact on the board used to connect individual parts: signal inputs and outputs, and power.",
      },
      fact: null,
      datasheet: null,
    },
    senzor: {
      term: { cs: "Senzor", en: "Sensor" },
      photo: null,
      text: {
        cs: "Součástka, která měří něco z okolí (například vzdálenost) a převádí to na elektrický signál, se kterým dál pracuje program.",
        en: "A part that measures something about its surroundings (like distance) and converts it into an electrical signal the program can work with.",
      },
      fact: null,
      datasheet: null,
    },
    mblock: {
      term: { cs: "mBlock", en: "mBlock" },
      photo: null,
      text: {
        cs: "Blokové programovací prostředí (podobné Scratchi), ve kterém se program sestavuje přetahováním barevných bloků místo psaní kódu. Funguje přímo v prohlížeči.",
        en: "A block-based programming environment (similar to Scratch), where you build a program by dragging colored blocks instead of writing code. It runs right in the browser.",
      },
      fact: null,
      datasheet: null,
    },
  },

  parts: [
    {
      id: "shieldio-red",
      name: { cs: "Shieldio RED", en: "Shieldio RED" },
      photo: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
      what: {
        cs: "Hlavní deska celého projektu. Na ni se připojuje servo i ultrazvukový senzor.",
        en: "The main board for the whole project. The servo and ultrasonic sensor both connect to it.",
      },
      how: {
        cs: "Uvnitř desky je Arduino Nano, které podle nahraného programu ovládá vše připojené.",
        en: "Inside the board is an Arduino Nano, which controls everything connected to it according to the uploaded program.",
      },
      fact: { cs: "Deska RED je aktuálně ve vývoji, první funkční prototyp.", en: "The RED board is currently in development, the first working prototype." },
      datasheet: null,
    },
    {
      id: "arduino",
      name: { cs: "Arduino Nano", en: "Arduino Nano" },
      photo: "../../../../assets/images/red-build/15-arduino-nano.jpg",
      what: {
        cs: "Malý počítač na desce, který podle nahraného programu ovládá servo i čte ultrazvukový senzor.",
        en: "The small computer on the board, it controls the servo and reads the ultrasonic sensor according to the uploaded program.",
      },
      how: {
        cs: "Pokud máš nesestavenou sadu, je už zasunutý v patici na desce z návodu na pájení. Nic dalšího s ním dělat nemusíš.",
        en: "If you have the unassembled kit, it's already plugged into the socket on the board from the soldering guide. You don't need to do anything else with it.",
      },
      fact: { cs: "Deska RED používá konkrétně Arduino Nano.", en: "The RED board specifically uses an Arduino Nano." },
      datasheet: null,
    },
    {
      id: "servo",
      name: { cs: "Servo SG90", en: "SG90 Servo" },
      photo: null,
      what: { cs: "Motor, který otáčí ramenem závory.", en: "The motor that turns the barrier's arm." },
      how: {
        cs: "Řídí se PWM signálem. Délka pulzu určuje, do jakého úhlu se natočí.",
        en: "Controlled by a PWM signal. The pulse length sets the angle it turns to.",
      },
      fact: { cs: "SG90 je jedno z nejběžnějších hobby serv na světě.", en: "The SG90 is one of the most common hobby servos in the world." },
      datasheet: null,
    },
    {
      id: "hcsr04",
      name: { cs: "Ultrazvuk HC-SR04", en: "HC-SR04 Ultrasonic Sensor" },
      photo: "../../../../assets/images/red-build/16-ultrazvuk.jpg",
      what: { cs: "Měří vzdálenost přijíždějícího auta od závory.", en: "Measures the distance of an approaching car from the barrier." },
      how: {
        cs: "Vyšle ultrazvukový signál a změří, za jak dlouho se odrazí zpátky.",
        en: "Sends out an ultrasonic pulse and measures how long it takes to bounce back.",
      },
      fact: { cs: "Přesnost na centimetry, dosah až několik metrů.", en: "Accurate to centimeters, range up to a few meters." },
      datasheet: "https://www.sparkfun.com/datasheets/Components/HC-SR04.pdf",
    },
    {
      id: "oled",
      name: { cs: "OLED displej", en: "OLED Display" },
      photo: "../../../../assets/images/red-build/17-oled-displej.jpg",
      what: {
        cs: "Malý obrazovkový displej na desce, program na něj může vypisovat text nebo hodnoty.",
        en: "The small screen on the board, the program can print text or values to it.",
      },
      how: {
        cs: "Připojuje se přes I2C sběrnici, nemá polaritu ani orientaci, konektor jde zasunout jen jedním způsobem.",
        en: "Connects over the I2C bus, has no polarity or orientation, the connector only fits one way.",
      },
      fact: { cs: "Standardní 0,96\" displej SSD1306, stejný typ používá i blokový editor.", en: "A standard 0.96\" SSD1306 display, the same type our block editor uses too." },
      datasheet: null,
    },
    {
      id: "usb",
      name: { cs: "USB-C kabel", en: "USB-C Cable" },
      photo: null,
      what: {
        cs: "Propojuje desku s počítačem. V sestavené i nesestavené kompletní sadě je součástí balení 1,5m USB-A na USB-C kabel.",
        en: "Connects the board to your computer. Both the assembled and unassembled complete kits include a 1.5 m USB-A to USB-C cable.",
      },
      how: {
        cs: "Slouží k nahrání programu i k napájení během programování. Pokud dodaný kabel nemáš po ruce, funguje jakýkoli jiný funkční USB-C datový kabel.",
        en: "Used both to upload the program and to power the board while programming. If you don't have the included cable handy, any other working USB-C data cable works too.",
      },
      fact: null,
      datasheet: null,
    },
  ],

  steps: [
    {
      id: "parts",
      title: { cs: "Připrav si součástky", en: "Get your parts ready" },
      type: "parts-check",
      parts: ["shieldio-red", "arduino", "servo", "hcsr04", "oled", "usb"],
    },
    {
      id: "servo",
      title: {
        cs: "Zapoj <span class=\"term\" data-term=\"servo\">servo</span>",
        en: "Connect the <span class=\"term\" data-term=\"servo\">servo</span>",
      },
      type: "wiring",
      photo: "../../../../assets/images/RED_hand_hold_with_parts.jpeg",
      instructions: {
        cs: "Servo zapoj do konektoru označeného <b>SERVO</b> na desce Shieldio RED. Konektor jde zasunout jen jedním způsobem. Nedá se to splést.",
        en: "Plug the servo into the connector labeled <b>SERVO</b> on the Shieldio RED board. The connector only fits one way, you can't get it wrong.",
      },
      troubleshoot: {
        title: { cs: "Nejčastější chyby", en: "Common mistakes" },
        items: [
          { cs: "Servo není zasunuté úplně. Zkus ho zatlačit až na doraz.", en: "The servo isn't fully plugged in. Try pushing it all the way in." },
          { cs: "Kabel je otočený. Konektor má jen jednu správnou orientaci.", en: "The cable is flipped. The connector only has one correct orientation." },
          { cs: "Servo není ve správném konektoru. Zkontroluj popisek SERVO na desce.", en: "The servo is in the wrong connector. Check the SERVO label on the board." },
        ],
      },
    },
    {
      id: "hcsr04",
      title: {
        cs: "Zapoj <span class=\"term\" data-term=\"ultrazvuk\">ultrazvuk</span>",
        en: "Connect the <span class=\"term\" data-term=\"ultrazvuk\">ultrasonic sensor</span>",
      },
      type: "wiring",
      photo: "../../../../assets/images/red-build/16-ultrazvuk.jpg",
      instructions: {
        cs: "Senzor <span class=\"term\" data-term=\"hcsr04\">HC-SR04</span> zapoj do konektoru označeného <b>ULTRAZVUK</b>. Stejně jako u serva, konektor jde zasunout jen správně.",
        en: "Plug the <span class=\"term\" data-term=\"hcsr04\">HC-SR04</span> sensor into the connector labeled <b>ULTRAZVUK</b> (Czech for \"ultrasonic\", printed on the board). Just like the servo, the connector only fits the right way.",
      },
      troubleshoot: {
        title: { cs: "Nejčastější chyby", en: "Common mistakes" },
        items: [
          { cs: "Senzor není zasunutý úplně. Zkontroluj, že sedí na doraz.", en: "The sensor isn't fully plugged in. Check that it's seated all the way." },
          { cs: "Kabel je v jiném konektoru než ULTRAZVUK.", en: "The cable is in a different connector than ULTRAZVUK." },
          { cs: "Senzor je otočený. Vysílač a přijímač musí směřovat od desky ven.", en: "The sensor is turned around. The transmitter and receiver need to face away from the board." },
        ],
      },
    },
    {
      id: "oled",
      title: {
        cs: "Zapoj <span class=\"term\" data-term=\"oled\">displej</span>",
        en: "Connect the <span class=\"term\" data-term=\"oled\">display</span>",
      },
      type: "wiring",
      photo: null,
      instructions: {
        cs: "OLED <span class=\"term\" data-term=\"oled\">displej</span> zapoj do konektoru označeného <b>OLED</b> na desce Shieldio RED. Konektor jde zasunout jen jedním způsobem, nedá se to splést. Co přesně se na něm zobrazí, záleží na programu, který si napíšeš.",
        en: "Plug the OLED <span class=\"term\" data-term=\"oled\">display</span> into the connector labeled <b>OLED</b> on the Shieldio RED board. The connector only fits one way, you can't get it wrong. What exactly shows up on it depends on the program you write.",
      },
      troubleshoot: {
        title: { cs: "Nejčastější chyby", en: "Common mistakes" },
        items: [
          { cs: "Displej se vůbec nerozsvítí. Zkontroluj, že je zasunutý na doraz v konektoru OLED.", en: "The display doesn't light up at all. Check that it's plugged all the way into the OLED connector." },
          { cs: "Displej svítí, ale nic nezobrazuje. Zkontroluj v programu, že je blok pro displej správně použitý.", en: "The display lights up but shows nothing. Check that the display block is used correctly in your program." },
          { cs: "Displej je zasunutý v jiném konektoru. Zkontroluj popisek OLED na desce.", en: "The display is plugged into a different connector. Check the OLED label on the board." },
        ],
      },
    },
    {
      id: "upload",
      title: { cs: "Nahraj program", en: "Upload the program" },
      type: "upload",
      screenshot: null,
      diagnostics: [
        {
          title: { cs: "Chyba: Není nalezen port", en: "Error: Port not found" },
          items: [
            { cs: "Zkontroluj, že je deska připojená přes USB-C kabel.", en: "Check that the board is connected via the USB-C cable." },
            { cs: "Zkus jiný USB port nebo kabel.", en: "Try a different USB port or cable." },
            { cs: "Obnov stránku mBlock a zkus to znovu.", en: "Refresh the mBlock page and try again." },
          ],
        },
        {
          title: { cs: "Chyba: Není připojeno Arduino", en: "Error: Arduino not connected" },
          items: [
            { cs: "V mBlocku zkontroluj, že je vybraná správná deska (Arduino Nano).", en: "In mBlock, check that the correct board (Arduino Nano) is selected." },
            { cs: "Odpoj a znovu připoj USB-C kabel.", en: "Unplug and reconnect the USB-C cable." },
            { cs: "Zkus jiný USB kabel, některé nabíjecí kabely nepřenáší data.", en: "Try a different USB cable, some charging-only cables don't carry data." },
          ],
        },
      ],
      blocksEditorHref: "../../../../instructions/blokovy-editor.html?preset=zavora",
      arduino: {
        screenshot: null,
        note: {
          cs: 'Ukázkový Arduino kód pro tento projekt zatím připravujeme. Zkus mezitím blokové programování v <a href="../../../../instructions/blokovy-editor.html?preset=zavora">našem editoru</a>, má už nachystaný startovní program přesně pro tenhle projekt.',
          en: 'We\'re still preparing sample Arduino code for this project. In the meantime, try block programming in <a href="../../../../instructions/blokovy-editor.html?preset=zavora">our editor</a>, it already has a starter program ready for exactly this project.',
        },
        diagnostics: [
          {
            title: { cs: "Chyba: Nelze nahrát (upload error)", en: "Error: Can't upload (upload error)" },
            items: [
              { cs: "Zkontroluj, že je v Arduino IDE vybraný port desky (Tools → Port).", en: "Check that the board's port is selected in Arduino IDE (Tools → Port)." },
              { cs: "Zkontroluj, že je vybraná správná deska (Tools → Board → Arduino Nano).", en: "Check that the correct board is selected (Tools → Board → Arduino Nano)." },
              { cs: "Zkus jiný USB kabel, některé nabíjecí kabely nepřenáší data.", en: "Try a different USB cable, some charging-only cables don't carry data." },
            ],
          },
          {
            title: { cs: "Chyba: Kompilace selhala", en: "Error: Compilation failed" },
            items: [
              { cs: "Zkontroluj, že jsou nainstalované potřebné knihovny pro servo a ultrazvukový senzor.", en: "Check that the required libraries for the servo and ultrasonic sensor are installed." },
              { cs: "Projdi hlášku chyby. Obvykle ukazuje přesný řádek s problémem.", en: "Read through the error message. It usually points to the exact line with the problem." },
              { cs: "Zkus kód znovu zkompilovat po uložení souboru.", en: "Try recompiling the code after saving the file." },
            ],
          },
        ],
      },
    },
    {
      id: "test",
      title: { cs: "Vyzkoušej projekt", en: "Test the project" },
      type: "diagnostic-tree",
      instructions: {
        cs: "Přilož ruku před ultrazvukový senzor. Otevřela se závora?",
        en: "Hold your hand in front of the ultrasonic sensor. Did the barrier open?",
      },
      tree: {
        question: { cs: "Otevřela se závora?", en: "Did the barrier open?" },
        no: {
          question: { cs: "Hýbe se servo vůbec?", en: "Does the servo move at all?" },
          noResult: { cs: "Servo asi není napájené. Zkontroluj kabel v kroku 2.", en: "The servo probably isn't powered. Check the cable from step 2." },
          yes: {
            question: {
              cs: "Mění se hodnota vzdálenosti v mBlocku, když přiblížíš ruku?",
              en: "Does the distance value in mBlock change when you move your hand closer?",
            },
            noResult: { cs: "Ultrazvukový senzor asi není správně zapojený. Zkontroluj kabel v kroku 3.", en: "The ultrasonic sensor probably isn't connected correctly. Check the cable from step 3." },
            yesResult: { cs: "Zkontroluj v programu prahovou hodnotu vzdálenosti. Možná je nastavená příliš nízko.", en: "Check the distance threshold in your program. It might be set too low." },
          },
        },
      },
    },
  ],

  next: {
    tryDifferent: [
      { text: { cs: "Zkus, aby se závora po pár sekundách sama zase zavřela.", en: "Try making the barrier close again on its own after a few seconds." } },
      { text: { cs: "Uprav v programu práh vzdálenosti, na jakou se závora otevírá.", en: "Adjust the distance threshold in your program that opens the barrier." } },
      { text: { cs: "Zkus na displeji zobrazovat aktuální naměřenou vzdálenost.", en: "Try showing the current measured distance on the display." } },
    ],
    moreProjects: [
      { title: { cs: "Parkovací asistent", en: "Parking Assistant" }, href: "../parkovaci-asistent/index.html" },
      { title: { cs: "Časovač", en: "Timer" }, href: "../casovac/index.html" },
      { title: { cs: "Theremin", en: "Theremin" }, href: "../theremin/index.html" },
    ],
    levelUp: {
      title: { cs: "PROline", en: "PROline" },
      href: "../../../../products/PRO.html",
      text: { cs: "Pokročilá řada Shieldio, zatím ve vývoji, ale mrkni, co chystáme.", en: "Shieldio's advanced line, still in development, but take a look at what we're building." },
    },
  },
};
