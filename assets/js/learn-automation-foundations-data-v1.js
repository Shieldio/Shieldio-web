(() => {
  window.ShieldioAutomationFoundations = {
    'automatizace-01-zaklady-cislicove-techniky': {
      title: 'Základy číslicové techniky',
      chapters: [
        ['Poziční soustavy', 'Číslo se zapisuje jako součet číslic násobených mocninami základu soustavy. V binární soustavě je základ 2; bity mají váhy 1, 2, 4, 8… Například 101101₂ = 32 + 8 + 4 + 1 = 45₁₀. Šestnáctková soustava seskupuje čtyři bity do jedné číslice 0–F; 1011 1101₂ = BD₁₆.'],
        ['Logické úrovně', 'Logická 0 a 1 jsou abstraktní stavy, ne vždy přesně 0 V a napájecí napětí. Konkrétní povolené vstupní i výstupní úrovně určuje datasheet. Rozhoduje také proudová zatížitelnost, šumová rezerva a společná zem. Nezapojený digitální vstup se nesmí nechávat plovoucí.'],
        ['Základní hradla', 'AND je 1 jen tehdy, jsou-li oba vstupy 1. OR je 1, stačí-li alespoň jeden vstup 1. NOT výstup převrátí. XOR je 1 právě při rozdílných vstupech. NAND a NOR jsou univerzální hradla: lze z nich sestavit libovolnou booleovskou funkci.'],
        ['Booleova algebra', 'Proměnné nabývají 0/1. Zápis A·B znamená AND, A+B znamená OR a ¬A negaci. Platí například A+0=A, A·1=A, A+A=A, A·¬A=0 a De Morganovy věty ¬(A·B)=¬A+¬B a ¬(A+B)=¬A·¬B. Pro kontrolu výsledku vždy sestav pravdivostní tabulku.'],
        ['Kombinační obvody', 'Výstup závisí jen na současných vstupech, nemají paměť ani potřebný hodinový signál. Patří sem multiplexor, dekodér, kodér, sčítačka, komparátor a logika pro výběr signálu. Příklad: půlsčítačka má součet S=A XOR B a přenos C=A·B.'],
        ['Maturitní kostra', 'Definuj bit a poziční soustavy, ukaž převod jedné hodnoty, nakresli pravdivostní tabulku a hradla, vysvětli Booleovu algebru a odliš kombinační obvod od sekvenčního. Uveď konkrétní obvod, například sčítačku nebo multiplexor.']
      ],
      lab: 'logic'
    },
    'automatizace-02-sekvencni-obvody': {
      title: 'Sekvenční obvody',
      chapters: [
        ['Kombinační × sekvenční', 'Kombinační obvod reaguje pouze na aktuální vstupy. Sekvenční obvod má paměť: výstup a příští stav závisí na vstupech i dosavadním stavu. Jeho blokové schéma obsahuje kombinační logiku, paměťový prvek a často hodinový signál CLK.'],
        ['Klopný obvod', 'Bistabilní klopný obvod má dva stabilní stavy a uchovává jeden bit Q. Asynchronní RS klopný obvod nastaví stav vstupem S a zruší R; zakázaná kombinace závisí na konkrétním zapojení. Synchronní obvody mění stav v určeném okamžiku hodin.'],
        ['D, JK a T', 'D klopný obvod při aktivní hraně uloží hodnotu D do Q. JK odstraňuje zakázaný stav RS; při J=K=1 stav překlápí. T klopný obvod při T=1 překlápí stav při každé aktivní hraně a hodí se jako základ binárního děliče kmitočtu.'],
        ['Časování a metastabilita', 'Vstup musí být stabilní po dobu setup před hranou CLK a hold po hraně CLK. Porušení může vyvolat metastabilitu — výstup se po neurčitou krátkou dobu nechová jako jasná 0/1. Asynchronní signály se proto obvykle vedou přes synchronizátor alespoň se dvěma D klopnými obvody.'],
        ['Registry a čítače', 'Registr je skupina klopných obvodů pro uložení více bitů; posuvný registr při každém taktu data posune. Čítač prochází předem danou posloupností stavů. nbitový binární čítač má 2ⁿ stavů; čtyřbitový tedy 16. Asynchronní čítač má zpoždění mezi stupni, synchronní přepíná bity společným taktem.'],
        ['Maturitní kostra', 'Nakresli blok se stavovou pamětí, vysvětli roli CLK a rozdíl mezi hranou a úrovní. Charakterizuj D, JK a T klopný obvod, uveď setup/hold a metastabilitu, pak praktické použití v registru, čítači nebo děliči frekvence.']
      ],
      lab: 'flipflop'
    },
    'automatizace-03-jednocipovy-mikropocitac-architektura-pamet-klopne-obvody': {
      title: 'Jednočipový mikropočítač: architektura, paměť, klopné obvody a přerušení',
      chapters: [
        ['Co je mikrokontrolér', 'Jednočipový mikropočítač (MCU) integruje CPU, programovou paměť, pracovní paměť a periférie do jednoho čipu. Na rozdíl od běžného PC je určen pro konkrétní řídicí úlohu: čte vstupy, vyhodnotí program a ovládá výstupy. Konkrétní architektura se liší podle rodiny čipů.'],
        ['CPU a registry', 'CPU vykonává cyklus načti instrukci → dekóduj → proveď. Programový čítač (PC) drží adresu další instrukce, zásobník obsluhuje volání funkcí a přerušení, obecné registry urychlují výpočty. ALU provádí aritmetické a logické operace a stavový registr uchovává příznaky výsledku.'],
        ['Paměti', 'Flash/ROM uchovává program i bez napájení. SRAM je rychlá pracovní paměť proměnných, po vypnutí obsah ztratí. EEPROM nebo emulovaná EEPROM slouží pro trvalé nastavení, ale má omezený počet zápisů. Přesné velikosti, mapu paměti a možnosti zápisu vždy ověř v datasheetu.'],
        ['Sběrnice a I/O', 'Adresová část vybírá registr nebo paměťové místo, datová nese hodnotu a řídicí signály určují čtení/zápis. GPIO pin lze nastavit jako vstup nebo výstup; vstup mívá volitelný pull-up/pull-down podle čipu. Výstup MCU nesmí přímo napájet motor či relé bez vhodného tranzistorového výkonového stupně a ochrany.'],
        ['Přerušení', 'Přerušení zastaví běžný tok programu, uloží potřebný kontext a předá řízení obslužné rutině ISR. Zdrojem může být časovač, změna pinu, dokončení komunikace nebo chyba. ISR má být krátká; sdílené proměnné mezi ISR a hlavním programem vyžadují správné zacházení podle jazyka a architektury.'],
        ['Klopné obvody uvnitř MCU', 'Registry, čítače, stavové příznaky i posuvné periferie jsou realizované paměťovými prvky. D klopné obvody zachycují stav na hraně hodin, což umožňuje synchronní návrh. To propojuje téma sekvenčních obvodů s reálným mikrokontrolérem.'],
        ['Maturitní kostra', 'Nakresli blok MCU: CPU, Flash, SRAM, periférie, GPIO a sběrnice. Popiš PC, registry a zásobník, porovnej Flash/SRAM/EEPROM, vysvětli vstup/výstup a přerušení. Uzavři konkrétní cestou: tlačítko → GPIO → program → tranzistor → motor.']
      ],
      lab: 'mcu'
    },
    'automatizace-06-seriovy-a-paralelni-prenos-posuvne-registry': {
      title: 'Sériový a paralelní přenos, posuvné registry',
      chapters: [
        ['Co přenos zajišťuje', 'Přenos převádí informaci mezi zdrojem a příjemcem. Kromě datových vodičů řeší směr, společnou referenci, časování, rychlost, případně adresování a kontrolu chyb. Rozhraní se volí podle počtu zařízení, vzdálenosti, požadované rychlosti a elektromagnetického rušení.'],
        ['Sériový × paralelní', 'Sériový přenos posílá bity postupně jedním nebo několika vodiči. Šetří piny a pro delší spoje bývá výhodnější. Paralelní přenos předává několik bitů současně; vyžaduje více vodičů a při vyšší rychlosti je citlivý na rozdílné zpoždění jednotlivých cest.'],
        ['Synchronizace', 'Synchronní přenos má společný hodinový signál, který určuje okamžik vzorkování dat. Asynchronní přenos sdílí předem domluvenou rychlost a rámec. U UARTu běžný rámec obsahuje start bit, datové bity, volitelnou paritu a stop bit; chybná rychlost nebo časování vede k chybám přenosu.'],
        ['UART, SPI a I²C', 'UART je typicky bodové asynchronní spojení TX/RX. SPI používá hodinový signál a oddělené datové směry; je rychlé, ale pro více zařízení potřebuje volbu čipu. I²C používá dvě sdílené linky SDA a SCL s pull-up odpory a adresuje více zařízení na sběrnici. Nejde o zaměnitelné názvy konektorů, ale o různé komunikační protokoly.'],
        ['Posuvný registr', 'Posuvný registr je řetězec klopných obvodů. Na každé aktivní hraně se bit posune o jednu pozici. Typ SIPO mění sériový vstup na paralelní výstup, PISO naopak načte paralelní slovo a vysílá je sériově. Používá se například pro rozšíření počtu výstupů mikrokontroléru.'],
        ['Maturitní kostra', 'Porovnej sériový a paralelní přenos, vysvětli roli hodin a rámce UART. Charakterizuj UART, SPI a I²C včetně signálů a použití. Nakresli několikastupňový posuvný registr, ukaž pohyb bitu po hranách CLK a uveď převod SIPO nebo PISO.']
      ],
      lab: 'transfer'
    },
    'automatizace-07-navrh-kombinacnich-a-sekvencnich-obvodu-fuzzy-logika': {
      title: 'Návrh kombinačních a sekvenčních obvodů, fuzzy logika',
      chapters: [
        ['Od zadání k obvodu', 'Nejprve přesně pojmenuj vstupy a výstupy, stanov jejich logické úrovně a vytvoř pravdivostní tabulku. U kombinačního obvodu pak pro každý výstup sestavíš booleovskou funkci. Teprve potom vybírej hradla nebo integrovaný obvod.'],
        ['Minimalizace funkce', 'Funkci lze zapsat součtem součinů nebo součinem součtů. Algebraické úpravy a Karnaughova mapa hledají sousední jedničky, aby se snížil počet proměnných i hradel. Minimalizace nesmí změnit hodnotu výstupu pro žádnou kombinaci vstupů; výsledkem proto vždy ověř pravdivostní tabulkou.'],
        ['Kombinační bloky', 'Dekodér převádí binární kód na jeden aktivní výstup, multiplexor vybírá jeden z více vstupů a komparátor porovnává čísla. Sčítačka realizuje aritmetiku; půlsčítačka má S=A XOR B a přenos C=A·B. Obvody nemají paměť a výstup se mění po průchodu zpožděním hradel.'],
        ['Sekvenční návrh', 'U sekvenčního obvodu vedle vstupů urči i stavy. Sestav stavový diagram, tabulku přechodů a zvol paměťové prvky. Synchronní návrh mění stav hranou CLK; asynchronní vstupy je nutné před zpracováním synchronizovat. Příkladem je automat semaforu, čítač nebo řadič.'],
        ['Fuzzy logika', 'Fuzzy řízení nepoužívá jen ostré ano/ne, ale stupně příslušnosti od 0 do 1. Hodnota teploty může být současně „trochu teplá“ a „střední“. Postup je: fuzzifikace vstupů, vyhodnocení pravidel IF–THEN, sloučení závěrů a defuzzifikace na konkrétní akční hodnotu.'],
        ['Maturitní kostra', 'Na krátkém zadání ukaž cestu od tabulky k minimalizované funkci a hradlům. U sekvenčního obvodu nakresli stavový diagram a vysvětli CLK. Fuzzy logiku popiš na regulaci teploty: vstupní množiny, pravidla a výsledný výkon topení.']
      ],
      lab: 'fuzzy'
    },
    'automatizace-13-automatizacni-prostredky-vystupni-cleny': {
      title: 'Automatizační prostředky: výstupní členy',
      chapters: [
        ['Místo v řetězci řízení', 'Výstupní člen převádí malý řídicí signál regulátoru nebo PLC na energii použitelnou pro akční člen. Řetězec je snímač → řídicí systém → výstupní člen → akční člen → řízená soustava. Výstupní člen musí vyhovět napětí, proudu, spínací frekvenci i bezpečnostním požadavkům zátěže.'],
        ['Relé a stykač', 'Elektromagnetické relé spíná kontakty cívkou a poskytuje galvanické oddělení. Stykač je určen pro častější spínání výkonových zátěží, zejména motorů. Cívka je indukčnost: při vypnutí vzniká přepětí, proto se u stejnosměrné cívky používá vhodně zapojená ochranná dioda; musí se ale zohlednit prodloužení odpadu relé.'],
        ['Polovodičové spínání', 'Tranzistor funguje jako elektronický spínač. MOSFET se často používá pro DC zátěže a PWM, SSR pro bezkontaktní spínání s požadavky na odvod ztrátového tepla. U AC zátěží se používá triak; nelze ho bez dalšího obvodu použít jako běžný DC vypínač. Vždy rozlišuj řídicí a výkonovou stranu.'],
        ['Akční členy', 'Elektrický motor mění elektrickou energii na pohyb, ventil řídí tok kapaliny či vzduchu, topné těleso mění energii na teplo. Pro reverzaci motoru se používá H-můstek nebo stykačové zapojení s elektrickým i mechanickým blokováním. Volba se opírá o moment, rychlost, zatížení, pracovní cyklus a prostředí.'],
        ['Ochrana a diagnostika', 'Výstup nesmí být jen „zapnutý“. Sleduje se nadproud, zkrat, teplota, nouzové zastavení a stav zátěže. Oddělení optočlenem nebo bezpečnostním relé neřeší samo všechny požadavky: ochrana musí odpovídat konkrétnímu riziku a normě stroje. Diagnostický kontakt nebo proudové měření odhalí, že příkaz a skutečný pohyb nejsou totéž.'],
        ['Maturitní kostra', 'Vysvětli rozdíl mezi výstupním a akčním členem. Porovnej relé, stykač, tranzistor, SSR a triak podle typu zátěže. Na příkladu motoru uveď výkonové rozhraní, ochranu proti přepětí, jištění a bezpečný stav při poruše.']
      ],
      lab: 'actuator'
    },
    'automatizace-18-prumyslove-roboty-deleni-vlastnosti-a-manipulatory': {
      title: 'Průmyslové roboty: dělení, vlastnosti a manipulátory',
      chapters: [
        ['Robot a manipulátor', 'Průmyslový robot je automaticky řízený, programovatelný víceúčelový manipulátor s několika osami. Manipulátor vykonává polohování a pohyb; robotní systém zahrnuje i řídicí jednotku, chapadlo nebo nástroj, bezpečnostní prvky a přípravky pracoviště.'],
        ['Kinematické uspořádání', 'Kartézský robot se pohybuje v přímých osách X, Y, Z. SCARA je rychlý pro montáž v rovině, kloubový robot má rotační osy a velký dosah, delta robot je velmi rychlý při lehkém přenášení. Volba kinematiky určuje pracovní prostor, přesnost, dosah i omezení pohybu.'],
        ['Osy a souřadné systémy', 'Každá osa má rozsah, rychlost, zrychlení a opakovatelnost. Počet os určuje schopnost natočit nástroj, nikoli automaticky absolutní přesnost. Programátor pracuje se souřadným systémem základny, nástroje a obrobku; před jízdou musí být správně definovaný TCP, tedy pracovní bod nástroje.'],
        ['Efektory', 'Koncový efektor může být mechanické chapadlo, vakuový přísavný nástroj, svářečka, šroubovák nebo kamera. Při volbě je důležitá hmotnost břemene včetně efektoru, tvar, materiál, potřebná síla, bezpečné uchopení a přívody energie. Robot nesmí pracovat na hraně nosnosti bez započtení dynamiky.'],
        ['Bezpečnost a buňka', 'Ochranný prostor se řeší oplocením, dveřními spínači, světelnými závorami, bezpečnostním PLC a nouzovým zastavením. Kolaborativní robot neznamená automaticky bezpečný v každé aplikaci: rozhoduje konkrétní nástroj, rychlost, síly, ostré hrany i hodnocení rizik celé buňky.'],
        ['Maturitní kostra', 'Definuj průmyslový robot, popiš robotní buňku a rozdíl mezi robotem a manipulátorem. Porovnej kartézský, SCARA, kloubový a delta robot. Vysvětli osy, TCP, pracovní prostor a na konci bezpečnost při návrhu pracoviště.']
      ],
      lab: 'robot'
    },
    'automatizace-24-vstupni-periferie-pc': {
      title: 'Vstupní periferie PC',
      chapters: [
        ['Systémové rozdělení vstupů', 'Vstupní periferie převádí fyzikální děj nebo povel uživatele na data pro počítač. Dělíme je například podle snímané veličiny: mechanický pohyb a stisk, světlo a obraz, zvuk, dotyk, poloha nebo identita. U zkoušky postupuj od jevu přes snímač a elektroniku k rozhraní, ovladači a aplikaci.'],
        ['Cesta informace do PC', 'Řetězec má obvykle podobu veličina → snímač → úprava signálu → A/D převodník nebo digitální řadič → komunikační rozhraní → ovladač OS → aplikace. U digitální klávesnice není nutný A/D převodník, protože řadič čte stav spínačů. Mikrofon, kamera nebo analogový joystick naopak vyžadují vzorkování a kvantování nebo jejich ekvivalent v integrovaném řadiči.'],
        ['Klávesnice: princip matice', 'Většina klávesnic používá matici řádků a sloupců. Řadič postupně budí řádky a čte sloupce; podle dvojice určí stisknutou klávesu. Firmware řeší odskok kontaktu, opakování stisku a odeslání scancode. Scancode není znak: rozložení klávesnice, operační systém a aktivní jazyk teprve rozhodnou, zda vznikne například „z“, „y“ nebo zkratka.'],
        ['Typy klávesnic', 'Membránová klávesnice spojuje vrstvy fólie přes gumovou kopulku; je levná a tichá. Mechanická používá samostatný spínač pod každou klávesou; liší se silou, hmatovou odezvou a životností podle typu spínače. Nůžkový mechanismus se používá hlavně v noteboocích pro malý zdvih. Kapacitní klávesnice snímá změnu kapacity, optická přerušení světelného paprsku. Rozdělení „herní“ a „kancelářská“ je účel, ne fyzikální princip.'],
        ['Myš: optické snímání pohybu', 'Optická nebo laserová myš osvětluje povrch a malý obrazový snímač pořizuje mnoho snímků za sekundu. Procesor v myši mezi snímky vyhledává posun textury a odesílá relativní změnu os X a Y. Neurčuje tedy absolutní polohu na stole. Fungování závisí na povrchu, vzdálenosti snímače, rychlosti pohybu i algoritmu; lesklé sklo nebo zcela jednolitý povrch může být problém.'],
        ['Parametry myši a ovladače', 'DPI vyjadřuje počet hlášených kroků při posunu o palec a popisuje citlivost, ne automaticky přesnost. Polling rate je četnost, s níž zařízení odesílá data hostiteli; vyšší hodnota může snížit zpoždění, ale zatěžuje systém a sama nezlepší snímač. Ergonomie, hmotnost, typ tlačítek, kolečko a software mapování funkcí jsou samostatné vlastnosti. Trackball snímá otáčení kuličky, touchpad změnu kapacity prstu.'],
        ['Obrazové vstupy: skener a kamera', 'Plochý skener osvětluje předlohu a řádkový snímač CCD nebo CIS postupně čte odraz světla. Optické rozlišení je skutečný počet snímaných bodů; interpolované rozlišení dopočítává software. Kamera převádí světlo přes objektiv na obrazový snímač CMOS nebo CCD. Rozlišení, snímková frekvence, expozice, citlivost, dynamický rozsah a komprese jsou různé parametry a nelze je nahradit jedním číslem megapixelů.'],
        ['Zvukový vstup a digitalizace', 'Mikrofon mění akustický tlak na elektrický signál; dynamický pracuje elektromagneticky, kondenzátorový změnou kapacity a obvykle potřebuje napájení. Před digitalizací se signál zesílí a filtruje proti aliasingu. A/D převodník vzorkuje v čase a kvantuje amplitudu. Vzorkovací frekvence určuje nejvyšší přenositelnou frekvenci podle Nyquistova principu; bitová hloubka určuje počet kvantizačních úrovní a ovlivňuje dynamický rozsah.'],
        ['Dotyk, kód a biometrie', 'Odporový dotyk zjišťuje stlačením kontakt dvou vodivých vrstev a funguje i stylusem. Kapacitní dotyk měří změnu elektrického pole, proto dobře reaguje na vodivý prst, ale běžně ne na libovolný plastový předmět. Čtečka čárového nebo QR kódu pořídí obraz, lokalizuje vzor a dekóduje data s kontrolními mechanismy. Biometrie snímá biologický znak; správnost systému zahrnuje i ochranu citlivých osobních údajů.'],
        ['Rozhraní a typy připojení', 'PS/2 je starší specializované rozhraní klávesnice a myši, dnes převažuje USB. USB přenáší data i napájení a zařízení se často hlásí standardní třídou HID, takže základní ovladač poskytne systém. Bezdrátová myš nebo klávesnice používá Bluetooth nebo vlastní rádiový přijímač v USB; řeší párování, dosah, rušení, baterii a někdy zpoždění. USB-A, USB-C a micro-USB popisují především tvar konektoru, ne automaticky rychlost ani podporovaný protokol.'],
        ['Ovladač, oprávnění a diagnostika', 'Ovladač převádí data zařízení na standardní události, například stisk klávesy, pohyb kurzoru nebo video stream. Aplikace může navíc potřebovat oprávnění ke kameře či mikrofonu. Při poruše postupuj systematicky: napájení a kabel, jiný port nebo přijímač, rozpoznání systémem, správný ovladač, oprávnění aplikace, nastavení vstupu a nakonec samotný snímač. Neměň více věcí najednou, jinak nepoznáš příčinu.'],
        ['Maturitní odpověď', 'Začni rozdělením vstupů a obecným řetězcem informace. Podrobně vysvětli matici klávesnice a princip optické myši včetně DPI a polling rate. Potom porovnej obrazový a zvukový vstup, dotykové technologie a rozhraní USB, Bluetooth a PS/2. Uzavři rolí ovladače a postupem diagnostiky. U každého zařízení vždy řekni princip, parametr, použití a omezení.']
      ],
      lab: 'input'
    },
    'automatizace-25-vystupni-periferie-pc': {
      title: 'Výstupní periferie PC',
      chapters: [
        ['Úloha výstupu', 'Výstupní zařízení mění digitální data na člověkem nebo technologií vnímatelný výsledek: obraz, zvuk, tištěný dokument nebo pohyb. K posouzení nestačí jeden parametr; rozhoduje účel, rozhraní, rychlost, přesnost, náklady i podmínky použití.'],
        ['Monitor', 'LCD/OLED panel tvoří obraz z bodů a subpixelů. Rozlišení určuje počet obrazových bodů, obnovovací frekvence počet aktualizací za sekundu, jas světelný výkon a kontrast poměr světlé a tmavé. Grafická karta posílá digitální obraz typicky přes HDMI nebo DisplayPort; kompatibilita závisí na verzi rozhraní, rozlišení a obnovovací frekvenci.'],
        ['Tiskárny', 'Inkoustová tiskárna nanáší kapky inkoustu, laserová pracuje s elektrostatickým obrazem a tonerem, jehličková mechanicky vytváří body úderem. Pro kancelář se sleduje rychlost, náklady na stránku a oboustranný tisk; pro grafiku barvy, rozlišení a médium. Udávané DPI je hustota tiskových bodů, nikoli totéž co rozlišení fotografie.'],
        ['Zvuk a hmatová odezva', 'Zvuková karta převádí digitální vzorky D/A převodníkem na analogový signál pro zesilovač a reproduktor. Důležité jsou vzorkovací frekvence, bitová hloubka, odstup šumu a výkon zesilovače. Sluchátka a reproduktory mají vlastní impedanci a výkonové limity; hlasitost není vhodný jediný ukazatel kvality.'],
        ['Projektory a specializované výstupy', 'Projektor vytváří obraz optickou soustavou; významný je světelný tok, kontrast, vzdálenost a okolní osvětlení. Haptická, řídicí a průmyslová zařízení mohou výstupem ovládat i fyzický proces, proto se používá výkonové rozhraní a zpětná vazba podobně jako v automatizaci.'],
        ['Maturitní kostra', 'Porovnej monitor, tiskárnu a zvukový výstup podle principu a parametrů. Vysvětli cestu digitálních dat k obrazu nebo zvuku, pojmenuj rozhraní a ukaž, proč se zařízení vybírá podle účelu, ne jen podle jednoho čísla v katalogu.']
      ],
      lab: 'output'
    },
    'automatizace-05-programovani-jednocipovych-mikropocitacu-a-plc': {
      title: 'Programování jednočipových mikropočítačů a PLC',
      chapters: [
        ['Úloha programu v řízení', 'Program převádí požadavky technologie na opakovatelnou posloupnost čtení vstupů, vyhodnocení podmínek a ovládání výstupů. Nejdřív popiš technologii, vstupy, výstupy, mezní stavy a bezpečný stav. Kód je až poslední krok návrhu, ne náhrada za zadání.'],
        ['Program MCU', 'Mikrokontrolér po resetu nastaví hodiny, piny a periferie, pak obvykle běží hlavní smyčka. V ní může číst vstupy, aktualizovat stavový automat a řídit výstupy; časově kritické události obsluhují přerušení. Rozděl program na inicializaci, periodické úlohy a obsluhy událostí.'],
        ['Debounce a stav tlačítka', 'Mechanické tlačítko při stisku krátce kmitá. Jednoduché zpoždění není vždy vhodné; robustní řešení vzorkuje stav v čase a potvrdí změnu až po stabilním intervalu. Pro reakci na jeden stisk rozliš aktuální stav, předchozí stav a hranu změny.'],
        ['PLC a cyklus skenu', 'PLC opakuje cyklus: načte obraz vstupů, vykoná program, zapíše obraz výstupů a provede systémové úlohy. Proto se fyzický vstup nemění v každém řádku programu okamžitě a dlouhý program prodlužuje dobu cyklu. Časovače a čítače mají přesně určené chování podle konkrétního prostředí.'],
        ['Jazyky IEC 61131-3', 'LD (Ladder Diagram) připomíná reléové schéma, FBD spojuje funkční bloky, ST je textový strukturovaný jazyk a SFC popisuje sekvenci kroků a přechodů. Volba jazyka závisí na úloze, týmu a údržbě; všechny musí popisovat stejné bezpečné chování technologie.'],
        ['Diagnostika a verze', 'Program měj pod verzí, komentuj signály podle reálné technologie a odděl konfiguraci od logiky. Při poruše sleduj fyzický stav, obraz vstupů, proměnné, stavové kroky a výstupy. Nikdy neměň online více neověřených věcí najednou a před změnou zvaž bezpečný dopad na stroj.'],
        ['Maturitní odpověď', 'Začni analýzou I/O a bezpečného stavu. Porovnej smyčku MCU s cyklem PLC, vysvětli debounce, přerušení a stavový automat. Potom charakterizuj LD, FBD, ST a SFC a uzavři diagnostikou, dokumentací a řízením změn.']
      ],
      lab: 'none'
    },
    'automatizace-08-pocitace-v-ovladacich-a-ridicich-systemech-programovatelne': {
      title: 'Počítače v ovládacích a řídicích systémech, programovatelné automaty',
      chapters: [
        ['Ovládání a řízení', 'Ovládání provede příkaz bez nutného měření výsledku; řízení využívá informace o procesu a podle nich rozhoduje. Řídicí systém zahrnuje snímače, vstupní moduly, řídicí jednotku, komunikaci, výstupní moduly, akční členy a obslužné rozhraní.'],
        ['PLC: konstrukce a moduly', 'PLC tvoří CPU, napájecí zdroj, paměť, komunikační rozhraní a moduly vstupů/výstupů. Kompaktní PLC má části v jednom tělese, modulární systém je rozšiřitelný. Digitální I/O pracuje se stavy, analogové I/O převádí spojitou veličinu přes A/D nebo D/A převodník a vyžaduje správné měřítko i diagnostiku.'],
        ['Průmyslová komunikace', 'Sběrnice propojuje PLC, vzdálené I/O, měniče, HMI a nadřazené systémy. Při návrhu rozliš fyzickou vrstvu, protokol, topologii, adresování, dobu odezvy a diagnostiku. Ethernetový konektor sám neříká, zda je komunikace vhodná pro časově kritické řízení.'],
        ['Distribuované I/O a HMI', 'Vzdálené I/O zkracuje kabeláž od snímačů a akčních členů, ale vyžaduje návrh napájení, komunikace a bezpečného chování při výpadku spojení. HMI zobrazuje stav, alarmy a umožňuje obsluze zadávat povolené hodnoty; nesmí nahrazovat bezpečnostní funkce.'],
        ['Spolehlivost a bezpečnost', 'Systém řeší výpadek napájení, přerušený kabel, chybu snímače, výpadek komunikace a chybu programu. Bezpečný stav se určí z rizik technologie. Zálohy projektu, řízení přístupu, segmentace sítě a aktualizace jsou součástí kybernetické bezpečnosti průmyslového řízení.'],
        ['Maturitní odpověď', 'Nakresli řetězec snímač → I/O → PLC → výstupní člen → akční člen. Popiš CPU, digitální i analogové moduly, cyklus PLC, komunikaci a HMI. Uzavři poruchovými stavy, bezpečným stavem, diagnostikou a odpovědným přístupem do sítě.']
      ],
      lab: 'none'
    }
  };
  const maturityExtensions = {
    'automatizace-01-zaklady-cislicove-techniky': [
      ['Kódování a reprezentace hodnot', 'Číslo, znak a stav nejsou totéž. Nezáporné celé číslo lze zapsat přímo binárně, znak se převádí přes kódování jako ASCII nebo Unicode a záporná čísla se v procesorech obvykle ukládají ve dvojkovém doplňku. Uveď rozdíl mezi 8bitovým rozsahem bez znaménka 0 až 255 a se znaménkem −128 až 127.'],
      ['Kombinační bloky v praxi', 'Multiplexor vybere jeden datový vstup podle adresních vstupů, dekodér aktivuje jeden z výstupů podle binárního kódu a komparátor vyhodnotí A>B, A=B nebo A<B. U každého blokového obvodu řekni, zda má paměť: nemá, proto je jeho výstup po průchodu zpožděním určen aktuálními vstupy.'],
      ['Návrh a ověření funkce', 'Při návrhu nejprve pojmenuj vstupy i výstupy, sestav pravdivostní tabulku, odvoď rovnici a minimalizuj ji. Až potom kresli hradla. Funkci ověř všemi řádky tabulky; simulace či zapojení může odhalit i chybu názvu signálu nebo opačnou aktivní úroveň.']
    ],
    'automatizace-02-sekvencni-obvody': [
      ['Asynchronní a synchronní návrh', 'Asynchronní obvod může změnit stav okamžitě po změně vstupu, což komplikuje zpoždění a hazardy. Synchronní obvod mění stav při hraně společného CLK, proto lze chování rozdělit na kombinační logiku mezi paměťovými prvky a stav uložený ve flip-flopech.'],
      ['Registry a posuv dat', 'Paralelní registr uloží několik bitů naráz. Posuvný registr přesune při každé hraně obsah o jednu pozici; SIPO převádí sériový vstup na více výstupů a PISO načte paralelní hodnotu pro sériové vyslání. Prakticky tím rozšíříš počet pinů řídicí jednotky.'],
      ['Čítače a dělení frekvence', 'T klopný obvod při T=1 mění stav při každé aktivní hraně a na výstupu vytváří poloviční frekvenci. Řetězec n bitů dělí kmitočet a prochází 2ⁿ stavy. Odliš asynchronní ripple čítač se zpožděním mezi stupni od synchronního čítače se společným CLK.']
    ],
    'automatizace-03-jednocipovy-mikropocitac-architektura-pamet-klopne-obvody': [
      ['Paměťová mapa a periferie', 'MCU nevnímá GPIO, časovač ani UART jako abstraktní ikony: jejich řídicí a stavové registry jsou na adresách paměťové mapy. Zápisem bitu do registru můžeš nastavit směr pinu, režim časovače nebo povolit přerušení; čtením získáš stav periferie.'],
      ['Vstup, výstup a výkonové rozhraní', 'GPIO může být vstup, výstup nebo alternativní funkce periférie. Vstup nesmí plavat; používá se pull-up nebo pull-down. Výstup MCU má omezený proud a přímo nenapájí motor ani relé: pro výkonovou zátěž patří budič, tranzistor, ochrana proti přepětí a společně promyšlená zem.'],
      ['Priorita a sdílená data', 'Při současných přerušeních rozhoduje priorita a maskování konkrétní architektury. Proměnnou používanou ISR i hlavním programem je nutné navrhnout bezpečně: označení volatile řeší optimalizaci kompilátoru, ale samo nevytvoří atomickou operaci ani nevyloučí souběh.']
    ],
    'automatizace-06-seriovy-a-paralelni-prenos-posuvne-registry': [
      ['Přenosová rychlost a propustnost', 'Baud vyjadřuje počet symbolů za sekundu, bit/s počet bitů za sekundu; u jednoduchého binárního UARTu se často číselně shodují, ale pojmy nejsou univerzální synonyma. U UARTu do propustnosti započítej start, stop a případně paritní bit, nejen osm datových bitů.'],
      ['Elektrické vrstvy a robustnost', 'Logický protokol neurčuje automaticky elektrické úrovně ani vzdálenost kabelu. Pro delší či rušené vedení se volí vhodná fyzická vrstva, zakončení, společná reference nebo diferenciální přenos. Nezaměňuj UART jako formát komunikace s konkrétním konektorem USB.'],
      ['Adresování a sdílená sběrnice', 'I²C umožňuje více zařízení na dvou linkách; zařízení má adresu a linky potřebují pull-up odpory, protože výstup běžně aktivně stahuje logickou nulu. U SPI je typicky každý slave volen vlastním CS; výhodou je jednoduchost a rychlost, nevýhodou více signálů.']
    ],
    'automatizace-07-navrh-kombinacnich-a-sekvencnich-obvodu-fuzzy-logika': [
      ['Karnaughova mapa a minimalizace', 'Karnaughova mapa uspořádá kombinace v Grayově kódu, takže sousední pole se liší jedinou proměnnou. Skupiny jedniček o velikosti 1, 2, 4 nebo 8 zjednoduší členy rovnice. Mapa minimalizuje logickou funkci, ale nenahrazuje ověření všech stavů.'],
      ['Stavový automat', 'Pro sekvenční zadání nakresli stavy a šipky podmíněné vstupy. Potom vytvoř tabulku současného stavu, vstupu, příštího stavu a případného výstupu. Rozliš Mooreův automat, kde výstup závisí na stavu, a Mealyho automat, kde závisí i přímo na vstupu.'],
      ['Fuzzy regulace na příkladu', 'Pro teplotu zvol například množiny nízká, střední, vysoká a pro výkon malý, střední, velký. Pravidla mohou být „je-li teplota nízká, výkon velký“ a „je-li teplota střední, výkon střední“. Defuzzifikace z výsledných stupňů příslušnosti vytvoří jednu řídicí hodnotu.']
    ],
    'automatizace-13-automatizacni-prostredky-vystupni-cleny': [
      ['Spínací parametry a ztráty', 'Při volbě výstupu porovnej jmenovité napětí, proud, špičkový proud, typ zátěže, spínací frekvenci a ztrátový výkon. Mechanické kontakty trpí obloukem a opotřebením, polovodičový spínač má vodivý úbytek a musí odvést teplo.'],
      ['Motory a reverzace', 'DC motor se reverzuje změnou polarity pomocí H-můstku nebo vhodného stykačového zapojení. Nikdy nespínej oba směry současně; potřebuješ blokování a bezpečný čas přechodu. U motoru se hodnotí napětí, proud, rozběhový proud, moment, rychlost a ochrana proti přetížení.'],
      ['Bezpečnostní funkce', 'Nouzové zastavení, bezpečnostní relé, dveřní spínač a běžný programový výstup nejsou zaměnitelné. Bezpečnostní funkce se navrhuje podle rizika a ověřuje pro celé zařízení. Diagnostika musí poznat například zkrat, přerušený vodič nebo nesoulad příkazu a skutečného stavu.']
    ],
    'automatizace-18-prumyslove-roboty-deleni-vlastnosti-a-manipulatory': [
      ['Přesnost, opakovatelnost a kalibrace', 'Přesnost říká, jak blízko robot dojede k absolutně požadovanému bodu; opakovatelnost, jak přesně opakuje stejný pohyb. Pro montáž bývá často kritická opakovatelnost. Kalibrace os, nástroje a souřadného systému obrobku rozhoduje o skutečném výsledku.'],
      ['Plánování dráhy a singularity', 'Řídicí systém plánuje dráhu kloubů nebo nástroje s omezením rychlosti a zrychlení. Některé konfigurace kloubového robotu vedou k singularitě, kde malé požadavky na pohyb nástroje vyžadují nepřiměřený pohyb os. Programátor proto sleduje i konfiguraci a bezpečné přiblížení.'],
      ['Výběr efektoru', 'Chapadlo se volí podle tvaru, materiálu, hmotnosti, potřebné síly a tolerance polohy. Vakuový efektor potřebuje vhodný povrch a kontrolu podtlaku, mechanické čelisti řeší sílu a deformaci dílu. Nosnost robotu zahrnuje břemeno, efektor, kabely a dynamické síly.']
    ],
    'automatizace-25-vystupni-periferie-pc': [
      ['Technologie obrazovek', 'LCD moduluje podsvícení tekutými krystaly, OLED vytváří světlo přímo v jednotlivých pixelech. Při srovnání vysvětli princip, jas, kontrast, odezvu, možná omezení dlouhodobého zobrazení a proč nativní rozlišení LCD není libovolně zaměnitelné za jiné.'],
      ['Obrazová rozhraní', 'HDMI a DisplayPort jsou digitální rozhraní obrazu a mohou nést i zvuk. Možnost konkrétního rozlišení a obnovovací frekvence závisí na verzi zdroje, kabelu, přijímače i nastavení barevného formátu. Konektor sám neprokazuje maximální datový tok celé sestavy.'],
      ['Tiskový řetězec a diagnostika', 'Aplikace vytváří tiskovou úlohu, ovladač ji převede do jazyka zařízení a fronta ji předá tiskárně přes USB, síť nebo Wi‑Fi. Při poruše odliš konektivitu, frontu, ovladač, papír, toner či inkoust, mechaniku a stavové hlášení zařízení.']
    ]
  };
  Object.entries(maturityExtensions).forEach(([slug, chapters]) => {
    const lesson = window.ShieldioAutomationFoundations[slug];
    const last = lesson.chapters.pop();
    lesson.chapters.push(...chapters, last);
  });
})();
