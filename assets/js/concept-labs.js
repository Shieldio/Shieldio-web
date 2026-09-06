// Shieldio — interactive concept labs shared by the "Jak to funguje" pages.
// Each model uses only quantities explained on its page and exposes progressively
// deeper readouts through the existing simple / advanced / equations switch.
(function () {
  const TOPIC = {
    "ohmuv-zakon": "ohm",
    "tlacitka-a-debounce": "debounce",
    "dioda-a-led": "diode",
    "ultrazvuk": "ultrasonic",
    "kondenzatory": "capacitor",
    "pcb": "pcb",
  };

  const TEXT = {
    cs: {
      title: "Interaktivní model",
      change: "Změň hodnoty a sleduj, co se stane.",
      voltage: "Napětí", resistance: "Odpor", current: "Proud", power: "Výkon",
      press: "Simulovat stisk", debounce: "Doba debounce", rawEdges: "Změn bez ošetření", accepted: "Uznané stisky",
      diodeType: "Součástka", silicon: "Křemíková dioda", redLed: "Červená LED", blueLed: "Modrá LED",
      direction: "Směr", forward: "propustný", reverse: "závěrný", threshold: "Prahové napětí", dark: "nesvítí", shines: "svítí",
      distance: "Vzdálenost", temperature: "Teplota vzduchu", ping: "Vyslat pulz", echo: "Čas ozvěny", soundSpeed: "Rychlost zvuku",
      mode: "Průběh", charge: "Nabíjení", discharge: "Vybíjení", capacitance: "Kapacita", time: "Čas", tau: "Časová konstanta",
      width: "Šířka cestičky", length: "Délka cestičky", thickness: "Tloušťka mědi", drop: "Úbytek napětí", loss: "Ztrátový výkon",
      pcbNote: "Model počítá elektrický odpor a ztráty. Bezpečný proud nelze určit jen ze šířky; záleží i na chlazení, vrstvě a dovolené teplotě.",
      ohmAlt: "Obvod s napětím, rezistorem a animovaným proudem", debounceAlt: "Časový průběh zákmitů tlačítka před a po ošetření", diodeAlt: "Zjednodušený model diody v propustném a závěrném směru",
      ultrasonicAlt: "Měření vzdálenosti ultrazvukovým pulzem", capacitorAlt: "Křivka nabíjení a vybíjení kondenzátoru", pcbAlt: "Měděná cestička na plošném spoji",
      ohmSimple: "Vyšší napětí žene stejným odporem větší proud. Vyšší odpor proud brzdí.",
      debounceSimple: "Jeden mechanický stisk vytvoří několik rychlých hran. Debounce je sloučí do jedné události.",
      diodeSimple: "V propustném směru proud kolem typického úbytku prudce roste. Zjednodušený model ho v závěrném směru blokuje.",
      ultrasonicSimple: "Pulz urazí cestu k překážce i zpět. Proto se při výpočtu vzdálenosti dráha dělí dvěma.",
      capacitorSimple: "Po jedné časové konstantě je kondenzátor nabitý asi na 63 %. Po pěti téměř úplně.",
      pcbSimple: "Delší a užší měděná cestička má větší odpor. Při stejném proudu proto ztrácí víc energie jako teplo.",
    },
    en: {
      title: "Interactive model",
      change: "Change the values and watch what happens.",
      voltage: "Voltage", resistance: "Resistance", current: "Current", power: "Power",
      press: "Simulate press", debounce: "Debounce time", rawEdges: "Raw transitions", accepted: "Accepted presses",
      diodeType: "Component", silicon: "Silicon diode", redLed: "Red LED", blueLed: "Blue LED",
      direction: "Direction", forward: "forward", reverse: "reverse", threshold: "Threshold voltage", dark: "off", shines: "on",
      distance: "Distance", temperature: "Air temperature", ping: "Send pulse", echo: "Echo time", soundSpeed: "Speed of sound",
      mode: "Curve", charge: "Charging", discharge: "Discharging", capacitance: "Capacitance", time: "Time", tau: "Time constant",
      width: "Trace width", length: "Trace length", thickness: "Copper thickness", drop: "Voltage drop", loss: "Power loss",
      pcbNote: "The model calculates electrical resistance and loss. Safe current cannot be determined from width alone; cooling, layer placement, and allowed temperature also matter.",
      ohmAlt: "Circuit with voltage, a resistor, and animated current", debounceAlt: "Button bounce waveform before and after debouncing", diodeAlt: "Simplified diode model in forward and reverse direction",
      ultrasonicAlt: "Distance measurement using an ultrasonic pulse", capacitorAlt: "Capacitor charging and discharging curve", pcbAlt: "Copper trace on a printed circuit board",
      ohmSimple: "More voltage drives more current through the same resistance. More resistance limits current.",
      debounceSimple: "One mechanical press creates several fast transitions. Debouncing merges them into one event.",
      diodeSimple: "In the forward direction, current rises steeply around the typical voltage drop. The simplified model blocks it in reverse.",
      ultrasonicSimple: "The pulse travels to the obstacle and back. That is why the travelled distance is divided by two.",
      capacitorSimple: "After one time constant, the capacitor is about 63% charged. After five, it is almost full.",
      pcbSimple: "A longer, narrower copper trace has more resistance. At the same current, it loses more energy as heat.",
    },
  };

  function lang() { return document.documentElement.lang === "en" ? "en" : "cs"; }
  function tx(key) { return TEXT[lang()][key]; }
  function num(value, digits) {
    return Number(value).toLocaleString(lang() === "cs" ? "cs-CZ" : "en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  }
  function field(label, input, output) {
    return `<label class="concept-lab-field"><span>${label} <output>${output}</output></span>${input}</label>`;
  }
  function shell(simpleText, controls, visual, readings, equation) {
    return `<div class="concept-lab-head"><div><span class="eyebrow-dark">${tx("title")}</span><h2>${tx("change")}</h2></div></div>
      <div class="concept-lab-grid"><div class="concept-lab-controls">${controls}</div><div class="concept-lab-stage">${visual}</div></div>
      <p class="concept-lab-simple">${simpleText}</p>
      <div class="concept-lab-readings lab-depth-advanced">${readings}</div>
      <div class="concept-lab-equation lab-depth-equations">${equation}</div>`;
  }
  function reading(label, value, hook) {
    return `<div><span>${label}</span><b data-lab-out="${hook}">${value}</b></div>`;
  }

  function ohm(root) {
    root.innerHTML = shell(tx("ohmSimple"),
      field(tx("voltage"), '<input data-lab="u" type="range" min="1" max="12" step="0.5" value="5">', '<span data-lab-out="u">5,0 V</span>') +
      field(tx("resistance"), '<input data-lab="r" type="range" min="100" max="2000" step="10" value="220">', '<span data-lab-out="r">220 Ω</span>'),
      `<svg viewBox="0 0 620 220" role="img" aria-label="${tx("ohmAlt")}">
        <path class="lab-wire" d="M90 45 H530 V175 H90 Z"/><rect x="260" y="25" width="100" height="40" rx="8" class="lab-component"/>
        <path d="M278 45 l12 -12 12 24 12 -24 12 24 12 -24 12 12" class="lab-symbol"/><line x1="75" y1="82" x2="105" y2="82" class="lab-symbol"/><line x1="82" y1="105" x2="98" y2="105" class="lab-symbol"/>
        <text x="310" y="92" text-anchor="middle" class="lab-svg-label" data-lab-out="svg-r">220 Ω</text><text x="120" y="132" class="lab-svg-label" data-lab-out="svg-u">5,0 V</text>
        <g data-lab="flow">${[0,1,2,3,4].map(i => `<circle r="6" class="lab-flow-dot" style="animation-delay:${-i * .35}s"><animateMotion dur="2s" repeatCount="indefinite" path="M90 45 H530 V175 H90 V45"/></circle>`).join("")}</g>
      </svg>`,
      reading(tx("current"), "22,7 mA", "i") + reading(tx("power"), "0,114 W", "p"),
      '<span data-lab-out="formula">I = U / R = 5 V / 220 Ω = 22,7 mA</span>');
    const update = () => {
      const u = +root.querySelector('[data-lab="u"]').value;
      const r = +root.querySelector('[data-lab="r"]').value;
      const i = u / r * 1000, p = u * u / r;
      root.querySelectorAll('[data-lab-out="u"]').forEach(x => x.textContent = num(u,1) + " V");
      root.querySelector('[data-lab-out="r"]').textContent = num(r,0) + " Ω";
      root.querySelector('[data-lab-out="svg-r"]').textContent = num(r,0) + " Ω";
      root.querySelector('[data-lab-out="svg-u"]').textContent = num(u,1) + " V";
      root.querySelector('[data-lab-out="i"]').textContent = num(i,1) + " mA";
      root.querySelector('[data-lab-out="p"]').textContent = num(p,3) + " W";
      root.querySelector('[data-lab-out="formula"]').textContent = `I = U / R = ${num(u,1)} V / ${num(r,0)} Ω = ${num(i,1)} mA`;
      root.querySelectorAll("animateMotion").forEach(a => a.setAttribute("dur", Math.max(.55, 3.2 - i / 18) + "s"));
    };
    root.querySelectorAll("input").forEach(x => x.addEventListener("input", update)); update();
  }

  function debounce(root) {
    root.innerHTML = shell(tx("debounceSimple"),
      field(tx("debounce"), '<input data-lab="wait" type="range" min="5" max="60" step="5" value="25">', '<span data-lab-out="wait">25 ms</span>') +
      `<button class="btn btn-primary" type="button" data-lab="press">${tx("press")}</button>`,
      `<svg viewBox="0 0 620 230" role="img" aria-label="${tx("debounceAlt")}"><text x="18" y="30" class="lab-svg-label">RAW</text><text x="18" y="145" class="lab-svg-label">CLEAN</text>
        <path data-lab="raw" class="lab-signal lab-signal-raw" d=""/><path data-lab="clean" class="lab-signal lab-signal-clean" d=""/><line data-lab="sweep" x1="70" y1="10" x2="70" y2="215" class="lab-sweep"/></svg>`,
      reading(tx("rawEdges"), "7", "edges") + reading(tx("accepted"), "1", "accepted"),
      '<span data-lab-out="formula">t_stabilní ≥ t_debounce = 25 ms</span>');
    const draw = () => {
      const wait = +root.querySelector('[data-lab="wait"]').value;
      const pts = [[70,80],[165,80],[170,45],[178,80],[187,45],[199,80],[211,45],[226,80],[240,45],[560,45]];
      root.querySelector('[data-lab="raw"]').setAttribute("d", "M" + pts.map(p=>p.join(" ")).join(" L"));
      root.querySelector('[data-lab="clean"]').setAttribute("d", `M70 190 H${240 + wait * 2.5} V155 H560`);
      root.querySelector('[data-lab-out="wait"]').textContent = num(wait,0) + " ms";
      root.querySelector('[data-lab-out="formula"]').textContent = `t_stabilní ≥ t_debounce = ${num(wait,0)} ms`;
    };
    root.querySelector('[data-lab="wait"]').addEventListener("input", draw);
    root.querySelector('[data-lab="press"]').addEventListener("click", () => {
      const sweep = root.querySelector('[data-lab="sweep"]'); sweep.classList.remove("is-running"); void sweep.getBoundingClientRect(); sweep.classList.add("is-running");
    }); draw();
  }

  function diode(root) {
    root.innerHTML = shell(tx("diodeSimple"),
      field(tx("voltage"), '<input data-lab="u" type="range" min="-5" max="5" step="0.1" value="2">', '<span data-lab-out="u">2,0 V</span>') +
      field(tx("diodeType"), `<select data-lab="type"><option value="0.7">${tx("silicon")}</option><option value="1.9" selected>${tx("redLed")}</option><option value="3.0">${tx("blueLed")}</option></select>`, ""),
      `<svg viewBox="0 0 620 240" role="img" aria-label="${tx("diodeAlt")}"><line x1="65" y1="120" x2="555" y2="120" class="lab-wire"/><polygon points="275,75 275,165 365,120" class="lab-component"/><line x1="370" y1="72" x2="370" y2="168" class="lab-symbol"/>
        <circle cx="470" cy="120" r="42" class="lab-led" data-lab="led"/><g data-lab="diode-flow">${[0,1,2].map(i=>`<circle cx="100" cy="120" r="6" class="lab-flow-dot diode-dot" style="animation-delay:${-i*.4}s"/>`).join("")}</g>
        <text x="310" y="205" text-anchor="middle" class="lab-svg-label" data-lab-out="state"></text></svg>`,
      reading(tx("direction"), "", "direction") + reading(tx("threshold"), "1,9 V", "vf") + reading(tx("current"), "0,5 mA", "i"),
      '<span data-lab-out="formula">I ≈ max(0; (U − U_F) / 220 Ω)</span>');
    const update = () => {
      const u = +root.querySelector('[data-lab="u"]').value, vf = +root.querySelector('[data-lab="type"]').value;
      const i = u > vf ? (u-vf)/220*1000 : 0, forward = u >= 0;
      root.querySelector('[data-lab-out="u"]').textContent = num(u,1) + " V";
      root.querySelector('[data-lab-out="vf"]').textContent = num(vf,1) + " V";
      root.querySelector('[data-lab-out="i"]').textContent = num(i,1) + " mA";
      root.querySelector('[data-lab-out="direction"]').textContent = forward ? tx("forward") : tx("reverse");
      root.querySelector('[data-lab-out="state"]').textContent = i > 0 ? tx("shines") : tx("dark");
      root.querySelector('[data-lab="led"]').style.opacity = String(.12 + Math.min(1,i/15)*.88);
      root.querySelector('[data-lab="diode-flow"]').classList.toggle("is-flowing", i > .05);
      root.querySelector('[data-lab-out="formula"]').textContent = `I ≈ max(0; (${num(u,1)} V − ${num(vf,1)} V) / 220 Ω) = ${num(i,1)} mA`;
    };
    root.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",update)); update();
  }

  function ultrasonic(root) {
    root.innerHTML = shell(tx("ultrasonicSimple"),
      field(tx("distance"), '<input data-lab="d" type="range" min="5" max="200" step="1" value="40">', '<span data-lab-out="d">40 cm</span>') +
      field(tx("temperature"), '<input data-lab="temp" type="range" min="0" max="35" step="1" value="20">', '<span data-lab-out="temp">20 °C</span>') +
      `<button class="btn btn-primary" type="button" data-lab="ping">${tx("ping")}</button>`,
      `<svg viewBox="0 0 620 230" role="img" aria-label="${tx("ultrasonicAlt")}"><rect x="40" y="75" width="70" height="80" rx="10" class="lab-component"/><circle cx="66" cy="115" r="15" class="lab-symbol"/><circle cx="94" cy="115" r="15" class="lab-symbol"/><rect data-lab="obstacle" x="480" y="45" width="28" height="140" rx="5" class="lab-obstacle"/><line x1="110" y1="115" x2="494" y2="115" class="lab-guide"/><circle data-lab="pulse" cx="110" cy="115" r="10" class="lab-pulse"/><text x="75" y="185" text-anchor="middle" class="lab-svg-label">HC-SR04</text><text data-lab-out="svg-d" x="300" y="95" text-anchor="middle" class="lab-svg-label">40 cm</text></svg>`,
      reading(tx("echo"), "2 332 µs", "echo") + reading(tx("soundSpeed"), "343,4 m/s", "speed"),
      '<span data-lab-out="formula">d = t · v / 2</span>');
    const update = () => {
      const d=+root.querySelector('[data-lab="d"]').value,t=+root.querySelector('[data-lab="temp"]').value,v=331.3+.606*t, echo=d*2/(v*100)*1e6;
      const x=145+(d-5)/195*365;
      root.querySelector('[data-lab-out="d"]').textContent=num(d,0)+" cm"; root.querySelector('[data-lab-out="svg-d"]').textContent=num(d,0)+" cm";
      root.querySelector('[data-lab-out="temp"]').textContent=num(t,0)+" °C"; root.querySelector('[data-lab-out="echo"]').textContent=num(echo,0)+" µs"; root.querySelector('[data-lab-out="speed"]').textContent=num(v,1)+" m/s";
      root.querySelector('[data-lab="obstacle"]').setAttribute("x",x); root.querySelector('[data-lab-out="svg-d"]').setAttribute("x",(110+x)/2);
      root.querySelector('[data-lab-out="formula"]').textContent=`d = t · v / 2 = ${num(echo,0)} µs · ${num(v,1)} m/s / 2 = ${num(d,0)} cm`;
      root.dataset.targetX=x;
    };
    root.querySelectorAll("input").forEach(x=>x.addEventListener("input",update));
    root.querySelector('[data-lab="ping"]').addEventListener("click",()=>{const p=root.querySelector('[data-lab="pulse"]'),x=root.dataset.targetX;p.classList.remove("is-running");p.style.setProperty("--pulse-distance",(x-110)+"px");void p.getBoundingClientRect();p.classList.add("is-running")}); update();
  }

  function capacitor(root) {
    root.innerHTML = shell(tx("capacitorSimple"),
      `<div class="concept-lab-segment" data-lab="mode"><button type="button" class="active" data-mode="charge">${tx("charge")}</button><button type="button" data-mode="discharge">${tx("discharge")}</button></div>`+
      field(tx("resistance"), '<input data-lab="r" type="range" min="1" max="100" step="1" value="10">', '<span data-lab-out="r">10 kΩ</span>')+
      field(tx("capacitance"), '<select data-lab="c"><option value="0.1">0,1 µF</option><option value="1">1 µF</option><option value="10">10 µF</option><option value="100" selected>100 µF</option><option value="1000">1000 µF</option></select>', "")+
      field(tx("time"), '<input data-lab="time" type="range" min="0" max="5" step="0.1" value="1">', '<span data-lab-out="time">1,0 τ</span>'),
      `<svg viewBox="0 0 620 270" role="img" aria-label="${tx("capacitorAlt")}"><line x1="65" y1="220" x2="570" y2="220" class="lab-axis"/><line x1="65" y1="35" x2="65" y2="220" class="lab-axis"/><path data-lab="curve" class="lab-curve" d=""/><circle data-lab="point" r="8" class="lab-point"/><g data-lab="plates"><line x1="500" y1="70" x2="500" y2="180" class="lab-symbol"/><line x1="540" y1="70" x2="540" y2="180" class="lab-symbol"/></g><text x="317" y="248" text-anchor="middle" class="lab-svg-label">t / τ</text><text x="38" y="128" text-anchor="middle" class="lab-svg-label" transform="rotate(-90 38 128)">U / Uₛ</text></svg>`,
      reading(tx("tau"), "1,00 s", "tau") + reading(tx("voltage"), "3,16 V", "voltage"),
      '<span data-lab-out="formula">U_C(t) = U_S · (1 − e^(−t/RC))</span>');
    let mode="charge";
    const update=()=>{const r=+root.querySelector('[data-lab="r"]').value,c=+root.querySelector('[data-lab="c"]').value,n=+root.querySelector('[data-lab="time"]').value,tau=r*1000*c/1e6;const ratio=mode==="charge"?1-Math.exp(-n):Math.exp(-n),u=5*ratio;
      root.querySelector('[data-lab-out="r"]').textContent=num(r,0)+" kΩ";root.querySelector('[data-lab-out="time"]').textContent=num(n,1)+" τ";root.querySelector('[data-lab-out="tau"]').textContent=tau<1?num(tau*1000,0)+" ms":num(tau,2)+" s";root.querySelector('[data-lab-out="voltage"]').textContent=num(u,2)+" V";
      const pts=[];for(let i=0;i<=100;i++){const x=65+i/100*430,q=mode==="charge"?1-Math.exp(-i/20):Math.exp(-i/20),y=220-q*175;pts.push((i?"L":"M")+x+" "+y)}root.querySelector('[data-lab="curve"]').setAttribute("d",pts.join(" "));const px=65+n/5*430,py=220-ratio*175;root.querySelector('[data-lab="point"]').setAttribute("cx",px);root.querySelector('[data-lab="point"]').setAttribute("cy",py);
      root.querySelector('[data-lab-out="formula"]').textContent=mode==="charge"?`U_C(t) = U_S · (1 − e^(−t/RC)) = ${num(u,2)} V`:`U_C(t) = U_0 · e^(−t/RC) = ${num(u,2)} V`;
    };
    root.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",update));root.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;root.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle("active",x===b));update()}));update();
  }

  function pcb(root) {
    root.innerHTML = shell(tx("pcbSimple"),
      field(tx("width"), '<input data-lab="w" type="range" min="0.2" max="3" step="0.1" value="1">', '<span data-lab-out="w">1,0 mm</span>')+
      field(tx("length"), '<input data-lab="l" type="range" min="20" max="300" step="10" value="100">', '<span data-lab-out="l">100 mm</span>')+
      field(tx("current"), '<input data-lab="i" type="range" min="0.1" max="3" step="0.1" value="1">', '<span data-lab-out="i-control">1,0 A</span>')+
      field(tx("thickness"), '<select data-lab="t"><option value="35">35 µm (1 oz)</option><option value="70">70 µm (2 oz)</option></select>', ""),
      `<svg viewBox="0 0 620 240" role="img" aria-label="${tx("pcbAlt")}"><rect x="40" y="35" width="540" height="170" rx="18" class="lab-board"/><circle cx="90" cy="120" r="26" class="lab-pad"/><circle cx="530" cy="120" r="26" class="lab-pad"/><line data-lab="trace" x1="115" y1="120" x2="505" y2="120" class="lab-trace"/><text x="310" y="185" text-anchor="middle" class="lab-svg-label" data-lab-out="trace-label"></text></svg>`,
      reading(tx("resistance"), "0,048 Ω", "r-result")+reading(tx("drop"),"0,048 V","drop")+reading(tx("loss"),"0,048 W","loss"),
      '<span data-lab-out="formula">R = ρ · L / (w · h)</span><p class="concept-lab-note">'+tx("pcbNote")+'</p>');
    const update=()=>{const w=+root.querySelector('[data-lab="w"]').value,l=+root.querySelector('[data-lab="l"]').value,i=+root.querySelector('[data-lab="i"]').value,t=+root.querySelector('[data-lab="t"]').value;const r=1.68e-8*(l/1000)/((w/1000)*(t/1e6)),drop=i*r,p=i*i*r;
      root.querySelector('[data-lab-out="w"]').textContent=num(w,1)+" mm";root.querySelector('[data-lab-out="l"]').textContent=num(l,0)+" mm";root.querySelector('[data-lab-out="i-control"]').textContent=num(i,1)+" A";root.querySelector('[data-lab-out="r-result"]').textContent=num(r,3)+" Ω";root.querySelector('[data-lab-out="drop"]').textContent=num(drop,3)+" V";root.querySelector('[data-lab-out="loss"]').textContent=num(p,3)+" W";root.querySelector('[data-lab="trace"]').style.strokeWidth=4+w*8;root.querySelector('[data-lab-out="trace-label"]').textContent=`${num(l,0)} mm × ${num(w,1)} mm × ${num(t,0)} µm`;root.querySelector('[data-lab-out="formula"]').textContent=`R = ρ · L / (w · h) = ${num(r,3)} Ω;  P = I²R = ${num(p,3)} W`;
    };root.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",update));update();
  }

  const BUILD = { ohm, debounce, diode, ultrasonic, capacitor, pcb };
  function init() {
    const slug = location.pathname.split("/").filter(Boolean).slice(-2, -1)[0];
    const topic = TOPIC[slug]; if (!topic || !BUILD[topic]) return;
    const wrap = document.querySelector(".learn-section > .wrap"); if (!wrap) return;
    let root = wrap.querySelector(".concept-lab");
    if (!root) { root=document.createElement("section"); root.className="concept-lab"; const anchor=wrap.querySelector(".learn-diagram, .resistor-calc, .learn-board-tie"); wrap.insertBefore(root,anchor||wrap.firstChild); }
    BUILD[topic](root);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init); else init();
  document.addEventListener("shieldio-lang-change",()=>{const root=document.querySelector(".concept-lab");if(root){root.remove();init();}});
})();
