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

// Twin T notch: R-R with midpoint 2C to ground, in parallel with C-C and R/2.
const twin = builder('Dvojité T — pásmová zádrž', {duration:.005,step:.000002,acStart:10,acStop:1e6});
twin.c('V1','vac',140,340,1,90,{frequency:1591.549,offset:0,waveform:'sine'})
 .c('GND','gnd',140,560).c('GND2','gnd',440,80)
 .c('R1','resistor',340,220,1000).c('R2','resistor',540,220,1000)
 .c('C3','capacitor',440,140,200e-9,90)
 .c('C1','capacitor',340,380,100e-9).c('C2','capacitor',540,380,100e-9)
 .c('R3','resistor',440,480,500,90)
 .w([140,300],[240,300],[240,220],[300,220])
 .w([240,300],[240,380],[300,380])
 .w([380,220],[440,220],[500,220]).w([440,220],[440,180]).w([440,100],[440,80])
 .w([580,220],[700,220],[700,380],[580,380])
 .w([380,380],[440,380],[500,380]).w([440,380],[440,440])
 .w([440,520],[440,560],[140,560],[140,380])
 .p('in',240,300,'Vstup',palette.input).p('out',700,300,'Výstup dvojitého T');

const tnet = standardSource(builder('Odporový T článek'))
 .c('R1','resistor',340,220,1000).c('R2','resistor',660,220,1000)
 .c('R3','resistor',500,320,1000,90).c('RL','resistor',820,320,2000,90)
 .w([280,220],[300,220]).w([380,220],[500,220],[620,220])
 .w([500,220],[500,280]).w([700,220],[820,220],[820,280])
 .w([500,360],[500,440],[180,440]).w([820,360],[820,440],[500,440])
 .p('out',820,220,'Výstup T článku');

export const examples = [
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
 entry('t-network','Zatížený odporový T článek. Porovnej útlum při změně zátěže.',tnet)
];
