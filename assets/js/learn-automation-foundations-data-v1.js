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
        ['Úloha vstupní periferie', 'Vstupní zařízení převádí fyzikální děj nebo povel uživatele na digitální data. Cesta vede od snímače přes elektroniku a rozhraní do ovladače operačního systému. U každého zařízení rozlišuj princip snímání, rozlišení, vzorkování, zpoždění a rozhraní.'],
        ['Klávesnice a myš', 'Klávesnice snímá matici spínačů a řadič vyhodnocuje stisk i případný opakovaný stisk. Optická myš porovnává rychlé snímky povrchu a počítá relativní pohyb; DPI vyjadřuje citlivost snímání, ne univerzální měřítko kvality. Bezdrátové zařízení řeší napájení a rušení navíc oproti kabelu.'],
        ['Obraz a zvuk na vstupu', 'Skener snímá předlohu řádkově; optické rozlišení vyjadřuje počet skutečně snímaných bodů. Kamera převádí světlo přes snímač na obrazové vzorky, kde hraje roli rozlišení, snímková frekvence, expozice a komprese. Mikrofon mění akustický tlak na elektrický signál, který se následně vzorkuje a převádí A/D převodníkem.'],
        ['Další vstupy', 'Dotyková obrazovka může snímat odporově, kapacitně nebo infračerveně. Čtečka čárového kódu a QR kódu pořizuje obraz a dekóduje vzor; biometrický snímač vyžaduje zvláštní ochranu osobních údajů. Herní ovladač dodává polohy os, tlačítka a někdy zpětnou vazbu.'],
        ['Rozhraní a ovladač', 'USB je běžné univerzální rozhraní; Bluetooth přidává bezdrátovou vrstvu. Zařízení se hlásí třídou nebo vlastním ovladačem. Ovladač převádí přijatá data na události, které aplikace rozumí. Při diagnostice ověř napájení, kabel či spojení, rozpoznání systémem, oprávnění aplikace a až pak samotný snímač.'],
        ['Maturitní kostra', 'Vyber klávesnici, myš, skener, kameru a mikrofon. U každého řekni fyzikální princip, co znamená důležitý parametr a jak se data dostanou do PC. Zakonči rozhraním, rolí ovladače a stručným postupem hledání poruchy.']
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
    }
  };
})();
