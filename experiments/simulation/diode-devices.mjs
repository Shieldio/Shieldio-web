/** Educational approximations near 25 °C, not measured samples or vendor SPICE
 * models. Values in SI. Limits come from the cited manufacturer documentation;
 * Is, n and rs are deliberately simple curve fits and remain editable.
 * Reviewed 2026-10-21. Thermal/destructive behavior and junction capacitance are
 * not simulated. Limits should drive warnings, never silently clip I(V).
 */
const ledN=2,ledRs=8,ledCurrent=.002,ledVoltage=1.8;
const ledIs=ledCurrent/Math.expm1((ledVoltage-ledCurrent*ledRs)/(.02585*ledN));
const shared=[
 'Přibližný výukový model při 25 °C; nejde o měřená data ani model výrobce.',
 'Bez samohřevu, kapacit přechodu, zotavení a fyzického poškození. Mezní hodnoty slouží k upozornění.'
];
export const DIODES=[
 {
  id:'1n4148',name:'1N4148',type:'diode',manufacturer:'Vishay',
  params:{value:2.5e-9,n:1.75,rs:.6},
  limits:{maxForwardCurrent:.3,maxAverageCurrent:.15,maxReverseVoltage:75,maxRepetitiveReverseVoltage:100,maxPower:.5,conditions:'Ptot 500 mW: délka vývodu 4 mm a teplota vývodu nejvýše 25 °C; průběžný IF 300 mA, průměrný IF(AV) 150 mA.'},
  sourceURL:'https://www.vishay.com/docs/81857/1n4148.pdf',
  assumptions:[...shared,'Shockleyho přechod a sériový odpor aproximují dopřednou charakteristiku. Závěrný průraz kolem 100 V zde není modelován. VF ≤ 1 V při 10 mA je katalogové maximum, nikoli hodnota všech kusů.']
 },
 {
  id:'bat54',name:'BAT54',type:'schottky',manufacturer:'Diodes Incorporated',
  params:{value:1e-7,n:1.1,rs:2},
  limits:{maxForwardCurrent:.2,maxAverageCurrent:.2,maxReverseVoltage:30,maxPower:.2,conditions:'Rodina BAT54/A/C/S: mezní údaje při TA 25 °C a chlazení podle katalogu. Výkon 200 mW je údaj pro pouzdro.'},
  sourceURL:'https://www.diodes.com/datasheet/download/BAT54A.pdf',
  sourceFallbackURL:'https://www.diodes.com/part/view/BAT54A',
  assumptions:[...shared,'Model představuje jeden přechod rodiny BAT54. BAT54A obsahuje dvě diody se společnou anodou; tento dvouvývodový model nepředstavuje celé pouzdro.','PDF se při ověření nenačetlo; limity 30 V, 200 mA a 200 mW byly ověřeny na oficiální produktové stránce BAT54A. Parametry Is, n a rs jsou zvolená výuková aproximace.']
 },
 {
  id:'ls-p47k',name:'LS P47K (červená LED)',type:'led',manufacturer:'ams OSRAM',
  params:{value:ledIs,n:ledN,rs:ledRs},
  limits:{maxForwardCurrent:.02,maxReverseVoltage:12,typicalForwardVoltage:1.8,minForwardVoltage:1.7,maxForwardVoltage:2.2,testCurrent:.002,conditions:'IF max. 20 mA a VR max. 12 V při teplotě pájecího bodu TS 25 °C. VF 1,70 / 1,80 / 2,20 V: min. / typ. / max. při 2 mA.'},
  sourceURL:'https://look.ams-osram.com/m/47160da8cb4b3a4a/original/LS-P47K.pdf',
  assumptions:[...shared,'Is je dopočteno tak, aby model s n = 2 a rs = 8 Ω měl VF přibližně 1,80 V při 2 mA. To je typická katalogová hodnota, nikoli kalibrace konkrétního kusu.','Barva je super red, typicky 630 nm. Model nepočítá světelný tok ani účinnost.']
 },
 {
  id:'bzx55c5v1',name:'BZX55C5V1',type:'zener',manufacturer:'Vishay',
  params:{value:1e-12,n:1.5,rs:2,breakdown:4.99,rz:20},
  limits:{maxPower:.5,nominalZenerVoltage:5.1,minZenerVoltage:4.8,maxZenerVoltage:5.4,testCurrent:.005,maxDynamicResistance:35,conditions:'Ptot 500 mW: délka vývodu 4 mm a TL 25 °C. VZ = 4,8 až 5,4 V při IZT = 5 mA; ZZ < 35 Ω při tomto proudu.'},
  sourceURL:'https://www.vishay.com/docs/85604/bzx55.pdf',
  assumptions:[...shared,'Průrazná větev je výukově lineární: vnitřní koleno 4,99 V, rz = 20 Ω a vnější rs = 2 Ω dávají přibližně 5,10 V při 5 mA a diferenciální odpor 22 Ω. Parametr breakdown tedy není katalogové VZ při testovacím proudu.','Model nezahrnuje měkké koleno ani závislost průrazu a rz na proudu a teplotě.']
 }
];
