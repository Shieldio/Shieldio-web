// Original educational schematics. Values are SI; coordinates follow a 20 px grid.
const palette = { input: '#d28a12', output: '#1376d1', extra: '#9654b4' };
function builder(title, settings = {}) {
  const project = { version: 1, title, components: [], wires: [], probes: [], settings: { duration: .005, step: .000005, acStart: 10, acStop: 1e7, ...settings } };
  let wireId = 0;
  return {
    project,
    c(id, type, x, y, value, rotation = 0, extra = {}) {
      project.components.push({ id, type, x, y, rotation, params: { ...(value === undefined ? {} : { value }), ...extra } });
      return this;
    },
    w(...points) {
      for (let i = 1; i < points.length; i++) project.wires.push({ id: `w${++wireId}`, a: { x: points[i-1][0], y: points[i-1][1] }, b: { x: points[i][0], y: points[i][1] } });
      return this;
    },
    p(id, x, y, label, color = palette.output) { project.probes.push({ id, x, y, label, color }); return this; }
  };
}
const entry = (id, description, b) => ({ id, title: b.project.title, description, project: b.project });
function standardSource(b, dc = false, amplitude = 1) {
  return b.c('V1', dc ? 'vdc' : 'vac', 180, 300, amplitude, 90, dc ? {} : { frequency: 1000, offset: 0, waveform: 'sine' })
    .c('GND', 'gnd', 180, 440)
    .w([180,260],[180,220],[280,220])
    .w([180,340],[180,440])
    .p('in',180,220,'Vstup',palette.input);
}

const low = standardSource(builder('RC dolní propust'))
  .c('R1','resistor',360,220,1000).c('C1','capacitor',560,320,100e-9,90)
  .w([280,220],[320,220]).w([400,220],[560,220],[560,280])
  .w([560,360],[560,440],[180,440]).p('out',560,220,'Výstup');
const high = standardSource(builder('RC horní propust'))
  .c('C1','capacitor',360,220,100e-9).c('R1','resistor',560,320,1000,90)
  .w([280,220],[320,220]).w([400,220],[560,220],[560,280])
  .w([560,360],[560,440],[180,440]).p('out',560,220,'Výstup');
const ohm = standardSource(builder('Ohmův zákon', { duration: .002, step: .000002 }),true,5)
  .c('R1','resistor',480,320,1000,90)
  .w([280,220],[480,220],[480,280]).w([480,360],[480,440],[180,440])
  .p('ur',480,220,'Napětí na R1');
const divider = standardSource(builder('Odporový dělič'),true,10)
  .c('R1','resistor',360,220,1000).c('R2','resistor',560,320,2000,90)
  .w([280,220],[320,220]).w([400,220],[560,220],[560,280])
  .w([560,360],[560,440],[180,440]).p('out',560,220,'Výstup děliče');
const resonance = standardSource(builder('Sériový RLC obvod', { duration: .003, step: .000001 }))
  .c('R1','resistor',340,220,100).c('L1','inductor',500,220,.01)
  .c('C1','capacitor',660,320,100e-9,90)
  .w([280,220],[300,220]).w([380,220],[460,220]).w([540,220],[660,220],[660,280])
  .w([660,360],[660,440],[180,440]).p('out',660,220,'Napětí na C1');
const rectifier = standardSource(builder('Jednocestný usměrňovač', { duration: .01, step: .000005 }),false,5)
  .c('D1','diode',360,220,undefined,0,{is:1e-14,n:1})
  .c('R1','resistor',560,320,1000,90)
  .w([280,220],[320,220]).w([400,220],[560,220],[560,280])
  .w([560,360],[560,440],[180,440]).p('out',560,220,'Usměrněný výstup');
const charging = standardSource(builder('Nabíjení a vybíjení kondenzátoru', {duration:.01,step:.000005}))
  .c('R1','resistor',360,220,1000).c('C1','capacitor',560,320,1e-6,90)
  .w([280,220],[320,220]).w([400,220],[560,220],[560,280])
  .w([560,360],[560,440],[180,440]).p('out',560,220,'Napětí kondenzátoru');
charging.project.components.find(c=>c.id==='V1').params={value:2.5,offset:2.5,frequency:200,waveform:'square'};

// Non-inverting amplifier: + input driven, - input senses the feedback divider.
const noninv = builder('Neinvertující zesilovač s OZ');
noninv.c('V1','vac',160,300,.5,90,{frequency:1000,offset:0,waveform:'sine'})
 .c('GND','gnd',160,500).c('U1','opamp',560,240,undefined,0,{gain:1e5,rail:15,slew:.5e6,gbw:1e6})
 .c('R1','resistor',380,400,1000,90).c('R2','resistor',640,360,10000)
 .w([160,260],[160,220],[520,220]).w([160,340],[160,500])
 .w([520,260],[480,260],[480,360],[380,360])
 .w([380,360],[600,360]).w([680,360],[740,360],[740,240],[600,240])
 .w([380,440],[380,500],[160,500])
 .p('in',160,220,'Vstup',palette.input).p('out',740,240,'Výstup OZ');

// Inverting amplifier: grounded + input and resistor summing junction at - input.
const inv = builder('Invertující zesilovač s OZ');
inv.c('V1','vac',160,340,.5,90,{frequency:1000,offset:0,waveform:'sine'})
 .c('GND','gnd',160,520).c('U1','opamp',600,280,undefined,0,{gain:1e5,rail:15,slew:.5e6,gbw:1e6})
 .c('R1','resistor',360,300,1000).c('R2','resistor',600,140,10000)
 .w([160,300],[320,300]).w([160,380],[160,520])
 .w([400,300],[480,300],[560,300]).w([480,300],[480,140],[560,140])
 .w([640,140],[760,140],[760,280],[640,280])
 .w([560,260],[520,260],[520,440],[160,440])
 .p('in',160,300,'Vstup',palette.input).p('out',760,280,'Výstup OZ');

// Wien lead-lag network: series RC feeding parallel RC. f0 = 1/(2*pi*R*C).
const wien = standardSource(builder('Wienův článek'))
 .c('R1','resistor',340,220,1000).c('C1','capacitor',500,220,100e-9)
 .c('R2','resistor',660,320,1000,90).c('C2','capacitor',820,320,100e-9,90)
 .w([280,220],[300,220]).w([380,220],[460,220]).w([540,220],[660,220],[820,220],[820,280])
 .w([660,220],[660,280]).w([660,360],[660,440],[180,440])
 .w([820,360],[820,440],[660,440]).p('out',660,220,'Výstup Wienova článku');

// Two independent T paths; each shunt has its own ground symbol, all pointing down.
const twin = builder('Dvojité T — pásmová zádrž', {duration:.005,step:.000002,acStart:10,acStop:1e6});
twin.c('V1','vac',100,340,1,90,{frequency:1591.549,offset:0,waveform:'sine'})
 .c('GND','gnd',100,640).c('GND2','gnd',480,380).c('GND3','gnd',480,640)
 .c('R1','resistor',340,220,1000).c('R2','resistor',620,220,1000)
 .c('C3','capacitor',480,320,200e-9,90)
 .c('C1','capacitor',340,460,100e-9).c('C2','capacitor',620,460,100e-9)
 .c('R3','resistor',480,560,500,90)
 .w([100,300],[100,220],[220,220],[300,220])
 .w([220,220],[220,460],[300,460])
 .w([380,220],[480,220],[580,220]).w([480,220],[480,280]).w([480,360],[480,380])
 .w([660,220],[780,220],[780,460],[660,460])
 .w([380,460],[480,460],[580,460]).w([480,460],[480,520])
 .w([480,600],[480,640]).w([100,380],[100,640])
 .p('in',220,220,'Vstup',palette.input).p('out',780,220,'Výstup');
// Bridged-T: CRC T section bridged by 2R. H(f0)=1/3, not an infinite notch.
const bridged=builder('Přemostěný T článek', {duration:.005,step:.000002,acStart:10,acStop:1e6});
bridged.c('V1','vac',100,300,1,90,{frequency:1591.549,offset:0,waveform:'sine'})
 .c('GND','gnd',100,560).c('GND2','gnd',480,560)
 .c('RB','resistor',480,140,2000).c('C1','capacitor',340,300,100e-9).c('C2','capacitor',620,300,100e-9)
 .c('R3','resistor',480,440,500,90)
 .w([100,260],[100,220],[220,220],[220,140],[440,140])
 .w([220,220],[220,300],[300,300]).w([380,300],[480,300],[580,300])
 .w([520,140],[780,140],[780,300],[660,300])
 .w([480,300],[480,400]).w([480,480],[480,560]).w([100,340],[100,560])
 .p('in',220,220,'Vstup',palette.input).p('out',780,300,'Výstup');

const tnet = standardSource(builder('Odporový T článek'))
 .c('R1','resistor',340,220,1000).c('R2','resistor',660,220,1000)
 .c('R3','resistor',500,320,1000,90).c('RL','resistor',820,320,2000,90)
 .w([280,220],[300,220]).w([380,220],[500,220],[620,220])
 .w([500,220],[500,280]).w([700,220],[820,220],[820,280])
 .w([500,360],[500,440],[180,440]).w([820,360],[820,440],[500,440])
 .p('out',820,220,'Výstup T článku');

function power(b){const u=b.project.components.find(c=>c.type==='opamp');u.params.powered=true;const x=u.x,y=u.y;
 b.c('VP','vdc',960,80,15).c('GP','gnd',1060,80)
  .c('VN','vdc',960,620,-15).c('GN','gnd',1060,620)
  .w([920,80],[x,80],[x,y-60]).w([1000,80],[1060,80])
  .w([920,620],[x,620],[x,y+60]).w([1000,620],[1060,620]);
}
power(noninv);power(inv);
const schottky=standardSource(builder('Schottkyho usměrňovač'),false,2)
 .c('D1','schottky',360,220).c('R1','resistor',560,320,1000,90)
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,360],[560,440],[180,440]).p('out',560,220,'Výstup');
const zener=standardSource(builder('Zenerův stabilizátor'),true,12)
 .c('R1','resistor',360,220,1000).c('ZD1','zener',560,320,undefined,270)
 .c('RL','resistor',760,320,10000,90)
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,220],[760,220],[760,280])
 .w([560,360],[560,440],[180,440]).w([760,360],[760,440],[560,440]).p('out',560,220,'Stabilizované napětí');
const tunnel=standardSource(builder('Tunelová dioda — pracovní bod'),true,.2)
 .c('R1','resistor',360,220,10).c('TD1','tunnel',560,320,undefined,90)
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,360],[560,440],[180,440]).p('out',560,220,'Napětí diody');

const capCharge=standardSource(builder('Nabíjení kondenzátoru z DC zdroje',{duration:.01}),true,5)
 .c('R1','resistor',360,220,1000).c('C1','capacitor',560,320,1e-6,90,{initialVoltage:0})
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,360],[560,440],[180,440]);
const capDischarge=standardSource(builder('Vybíjení kondenzátoru přes rezistor',{duration:.01}),true,0)
 .c('R1','resistor',360,220,1000).c('C1','capacitor',560,320,1e-6,90,{initialVoltage:5})
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,360],[560,440],[180,440]);
const chargeCurrent=standardSource(builder('Proudový zdroj — lineární nabíjení',{duration:.01}),true,-.001)
 .c('C1','capacitor',500,320,1e-6,90,{initialVoltage:0})
 .w([280,220],[500,220],[500,280]).w([500,360],[500,440],[180,440]);
chargeCurrent.project.components.find(c=>c.id==='V1').type='idc';
const led=standardSource(builder('LED a ochranný rezistor'),true,5)
 .c('R1','resistor',360,220,330).c('LED1','led',560,320,undefined,90)
 .w([280,220],[320,220]).w([400,220],[560,220],[560,280]).w([560,360],[560,440],[180,440]);
const phases=builder('Dva zdroje — fázový posun 90°',{duration:.005});
phases.c('V1','vac',180,300,1,90,{frequency:1000,phase:0,offset:0,waveform:'sine'}).c('R1','resistor',380,300,1000,90)
 .c('G1','gnd',180,440).w([180,260],[180,220],[380,220],[380,260]).w([180,340],[180,440],[380,440],[380,340])
 .c('V2','vac',680,300,1,90,{frequency:1000,phase:90,offset:0,waveform:'sine'}).c('R2','resistor',880,300,1000,90)
 .c('G2','gnd',680,440).w([680,260],[680,220],[880,220],[880,260]).w([680,340],[680,440],[880,440],[880,340]);
phases.project.measurements=[{id:'phase0',componentId:'V1',kind:'voltage',scope:0,color:'#e9b44c'},{id:'phase90',componentId:'V2',kind:'voltage',scope:0,color:'#49b9ee'}];
// A slow bipolar triangle sweeps both forward and reverse diode branches.
// RS is a current-sense resistor: I_D = U_RS / RS. U_D is differential A–K.
function diodeIV(id,type,title,amplitude,resistance,params={}){
 const b=standardSource(builder(title,{duration:.04,step:.00001}),false,amplitude)
  .c('R1','resistor',360,220,resistance)
  .c('D1',type,580,320,undefined,90,params)
  .c('RS','resistor',580,460,100,90)
  .w([280,220],[320,220]).w([400,220],[580,220],[580,280])
  .w([580,360],[580,420]).w([580,500],[580,560],[180,560],[180,440]);
 Object.assign(b.project.components.find(c=>c.id==='V1').params,{frequency:25,waveform:'triangle',phase:0});
 b.project.probes=[];
 b.project.measurements=[
  {id:'ud',componentId:'D1',kind:'voltage',scope:0,color:'#49b9ee'},
  {id:'id',componentId:'D1',kind:'current',scope:1,color:'#da89e9'},
  {id:'urs',componentId:'RS',kind:'voltage',scope:0,color:'#69d4a1'}
 ];
 b.project.scopeSettings=[{mode:'xy',xId:'ud',yId:'id',persistence:true},{mode:'time'}];
 b.project.demo={kind:'diode-iv'};
 return entry(id,'Hotové měření: X = U diody mezi A a K, Y = proud diodou. Trojúhelník 25 Hz, předřadný odpor a snímací RS = 100 Ω. Spusťte pro postupné vykreslení VA charakteristiky.',b);
}
const diodeIVExamples=[
 diodeIV('diode-iv-silicon','diode','VA charakteristika — křemíková dioda',2,100,{value:1e-14,n:1.05}),
 diodeIV('diode-iv-schottky','schottky','VA charakteristika — Schottkyho dioda',2,100),
 diodeIV('diode-iv-zener','zener','VA charakteristika — Zenerova dioda 5,1 V',10,1000),
 diodeIV('diode-iv-led','led','VA charakteristika — LED',4,220)
];
export const examples = [
 ...diodeIVExamples,
 entry('capacitor-charge','DC 5 V, R = 1 kΩ, C = 1 µF. Po jedné časové konstantě 1 ms je napětí 63,2 % konečné hodnoty.',capCharge),
 entry('capacitor-discharge','Kondenzátor má na začátku 5 V a vybíjí se přes 1 kΩ. Sledujte znaménko proudu a energii v elektrickém poli.',capDischarge),
 entry('current-source','Proud 1 mA nabíjí 1 µF: napětí roste o 1 V za 1 ms.',chargeCurrent),
 entry('led','Ochranný rezistor omezuje proud LED. Měřte napětí LED i proud rezistorem.',led),
 entry('phase-sources','Dva nezávislé zdroje 1 kHz s rozdílem fáze 90°. Změňte fázi, frekvenci nebo periodu.',phases),
 entry('rc-lowpass','R = 1 kΩ, C = 100 nF. Mezní frekvence přibližně 1,59 kHz; porovnej zesílení a fázi.',low),
 entry('ohm','Zdroj 5 V a rezistor 1 kΩ: proud 5 mA. Změň odpor a sleduj Ohmův zákon.',ohm),
 entry('divider','Dělič 1 kΩ / 2 kΩ napájený 10 V: výstup přibližně 6,67 V.',divider),
 entry('rc-highpass','R = 1 kΩ, C = 100 nF. Dolní frekvence jsou potlačeny, vyšší procházejí.',high),
 entry('rc-step','Obdélníkový zdroj 0–5 V a časová konstanta RC = 1 ms.',charging),
 entry('rlc','R = 100 Ω, L = 10 mH, C = 100 nF. Sleduj rezonanci kolem 5,03 kHz.',resonance),
 entry('rectifier','Sinusový zdroj a dioda se zátěží. Sleduj jednocestné usměrnění.',rectifier),
 entry('opamp-noninverting','OZ s napěťovým zesílením přibližně 11, saturací a omezenou rychlostí přeběhu.',noninv),
 entry('opamp-inverting','OZ se zesílením přibližně −10 a zápornou zpětnou vazbou.',inv),
 entry('wien','Sériový a paralelní RC článek: při f₀ přenos 1/3 a fáze 0°.',wien),
 entry('twin-t','Vyvážená pásmová zádrž: R, R, R/2 a C, C, 2C. Zádrž kolem 1,59 kHz.',twin),
 entry('bridged-t','CRC článek přemostěný odporem 2R. Při 1,59 kHz přenos 1/3 (−9,54 dB).',bridged),
 entry('schottky','Model s menším propustným úbytkem než křemíková dioda.',schottky),
 entry('zener','Závěrný průraz kolem 5,1 V; sériový odpor omezuje proud.',zener),
 entry('tunnel','Výukový model se záporným diferenciálním odporem. Nejde o konkrétní katalogový typ.',tunnel),
 entry('t-network','Zatížený odporový T článek. Porovnej útlum při změně zátěže.',tnet)
];
