(() => {
  const data = window.ShieldioRlcData;
  if (!data) return;
  const byId = Object.fromEntries(data.chapters.map(chapter => [chapter.id, chapter]));
  const formula = value => '<div class="rlc-formula" data-rlc-math="' + value.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></div>';

  byId.rezistor.html += [
    '<h3>Voltampérová charakteristika rezistoru</h3>',
    '<div class="rlc-chart-card"><svg class="rlc-tech-chart" viewBox="0 0 640 340" role="img" aria-label="Lineární voltampérová charakteristika rezistoru">',
    '<path class="axis" d="M70 170H610M340 30V310"/><path class="tick" d="M205 164v12M475 164v12M334 80h12M334 260h12"/>',
    '<path class="curve-r" d="M95 290L585 50"/><circle class="chart-point" cx="475" cy="104" r="7"/>',
    '<text x="596" y="195">U [V]</text><text x="355" y="42">I [A]</text><text x="483" y="96">U = RI</text></svg>',
    '<p>U ideálního lineárního rezistoru je graf přímka pro kladnou i zápornou polaritu. Sklon grafu I(U) je vodivost 1/R: menší odpor znamená strmější přímku.</p></div>',
    '<div class="resistor-color-tool" data-rlc-color-tool></div>'
  ].join('');

  byId.kondenzator.html += [
    '<h3>Polární elektrolytický kondenzátor</h3>',
    '<figure class="rlc-photo"><img src="/assets/images/learn/electrolytic-capacitors-illustration-v1.png" alt="Ilustrační produktová fotografie hliníkových elektrolytických kondenzátorů s vyznačeným záporným pólem">',
    '<figcaption>Ilustrační vizualizace. Pruh se značkami „−“ označuje záporný pól; u nového radiálního kondenzátoru bývá delší vývod kladný. Po zastřižení vývodů se řiď potiskem pouzdra a dokumentací, ne jejich délkou.</figcaption></figure>',
    '<div class="rlc-polarity" data-rlc-polarity><h3>Simulace polarity</h3><p>Nastav napětí zdroje. Kladná hodnota znamená, že je kladný pól zdroje připojen k anodě kondenzátoru.</p>',
    '<label>Přiložené napětí <output data-polarity-voltage>+5 V</output><input type="range" min="-16" max="16" value="5" step="1" data-polarity-input></label>',
    '<div class="polarity-circuit"><span class="source-plus">+</span><span class="source-minus">−</span><div class="capacitor-can"><span class="negative-stripe">− − −</span></div></div>',
    '<div class="rlc-result" data-polarity-result></div><p class="rlc-small"><strong>Bezpečnost:</strong> obrácenou polaritu v reálném zapojení nezkoušej. Může vzrůst svod a teplota, vznikat plyn a otevřít se bezpečnostní ventil pouzdra.</p></div>',
    '<h3>K čemu se kondenzátor používá</h3><div class="rlc-grid">',
    '<article class="rlc-card"><h4>Zásoba energie</h4><p>Vyhlazuje krátké poklesy napětí a dodá proud při rychlé změně odběru.</p></article>',
    '<article class="rlc-card"><h4>Filtrace a vazba</h4><p>S odporem nebo cívkou omezuje zvlnění a šum. Vazební kondenzátor propouští změny signálu, ale odděluje stejnosměrnou složku.</p></article>',
    '<article class="rlc-card"><h4>Blokování u IO</h4><p>Malý keramický kondenzátor se zapojuje mezi VCC a GND co nejblíže integrovanému obvodu. Elektrolyt poblíž napájecí větve pomáhá při pomalejších změnách odběru.</p></article></div>',
    '<div class="rlc-construction"><svg viewBox="0 0 720 230" role="img" aria-label="Blokovací kondenzátor mezi napájením a zemí u integrovaného obvodu">',
    '<path class="part" d="M80 55h190M450 55h190M270 55v120h180V55M360 175v28M330 203h60M342 215h36M352 227h16"/>',
    '<rect class="case" x="270" y="25" width="180" height="85" rx="12"/><path class="part" d="M510 55v35M485 90h50M485 115h50M510 115v60M510 175h70M580 175v28M550 203h60M562 215h36M572 227h16"/>',
    '<text x="315" y="78">IO</text><text x="70" y="42">VCC</text><text x="465" y="145">C blokovací</text><text x="315" y="220">GND</text></svg></div>'
  ].join('');
  byId.kondenzator.html += '<div class="rlc-note"><strong>Voltampérová charakteristika C:</strong> u ideálního kondenzátoru není proud určen samotnou okamžitou hodnotou napětí, ale rychlostí jeho změny i = C·du/dt. V ustáleném stejnosměrném stavu je proud nulový. Reálný kondenzátor má svod a při překročení pracovního napětí může nastat průraz.</div>';

  byId.civka.html += '<div class="rlc-note"><strong>Voltampérová charakteristika L:</strong> napětí ideální cívky závisí na rychlosti změny proudu u = L·di/dt, proto ji nelze popsat jedinou statickou přímkou I(U). V ustáleném stejnosměrném stavu je na ideální cívce nulové napětí; reálnou cívku omezuje odpor vinutí, oteplení a saturace jádra.</div>';

  byId.charakteristiky.html = [
    '<p><strong>Derating</strong> znamená snížení dovoleného zatížení součástky při horších pracovních podmínkách. U rezistoru se s rostoucí teplotou okolí zmenšuje prostor pro odvod tepla, proto už nemůže bezpečně ztrácet celý jmenovitý výkon.</p>',
    '<div class="rlc-note"><strong>Modelový příklad:</strong> rezistor 0,50 W smí podle ukázkové křivky do 70 °C ztrácet 0,50 W. Při 110 °C už jen přibližně 0,26 W a při 155 °C 0 W. Skutečné body vždy vezmi z katalogového listu konkrétní řady.</div>',
    '<div data-rlc-derating></div>',
    '<h3>Co znamená „potenciometr vs natočení“</h3>',
    '<p>Na vodorovné ose je poloha jezdce od 0 do 100 % mechanického natočení. Na svislé ose je podíl odporu mezi začátkem dráhy a jezdcem k celkovému odporu. U lineárního potenciometru 10 kΩ tedy 50 % natočení znamená přibližně 5 kΩ. U logaritmického průběhu polovina natočení není polovina odporu.</p>',
    '<div data-rlc-pot-graph></div>',
    '<p>Písmena A/B/C nejsou bezpečně univerzální mezi výrobci. Vždy čti graf průběhu odporu v katalogovém listu konkrétního dílu.</p>'
  ].join('');

  byId.spojovani.html = [
    '<div class="rlc-connection-grid"><section><h3>Sériové zapojení</h3><p>Prvky jsou za sebou a všemi protéká stejný proud. U rezistorů se odpory přímo sčítají.</p>',
    '<svg class="rlc-circuit" viewBox="0 0 600 170" role="img" aria-label="Dva rezistory zapojené sériově"><path d="M30 85h70M210 85h80M400 85h170"/><rect x="100" y="58" width="110" height="54"/><rect x="290" y="58" width="110" height="54"/><text x="135" y="48">R₁</text><text x="325" y="48">R₂</text></svg>',
    formula('R_{\\mathrm{s}}=R_1+R_2+\\cdots+R_n'), '<p><strong>Příklad:</strong> 100 Ω + 220 Ω = <strong>320 Ω</strong>.</p></section>',
    '<section><h3>Paralelní zapojení</h3><p>Prvky jsou připojené ke stejným dvěma uzlům a je na nich stejné napětí. Nejprve se sčítají vodivosti.</p>',
    '<svg class="rlc-circuit" viewBox="0 0 600 220" role="img" aria-label="Dva rezistory zapojené paralelně"><path d="M30 110h80M110 110V45h100M320 45h150M110 110v65h100M320 175h150M470 45v130M470 110h100"/><rect x="210" y="18" width="110" height="54"/><rect x="210" y="148" width="110" height="54"/><circle cx="110" cy="110" r="6"/><circle cx="470" cy="110" r="6"/><text x="245" y="15">R₁</text><text x="245" y="140">R₂</text></svg>',
    formula('\\frac{1}{R_{\\mathrm{p}}}=\\frac{1}{R_1}+\\frac{1}{R_2}+\\cdots+\\frac{1}{R_n}'),
    formula('R_{\\mathrm{p}}=\\left(\\frac{1}{R_1}+\\frac{1}{R_2}\\right)^{-1}=\\frac{R_1R_2}{R_1+R_2}'),
    '<p><strong>Příklad:</strong> 100 Ω ∥ 220 Ω = (1/100 + 1/220)<sup>−1</sup> = <strong>68,75 Ω</strong>. Výsledek musí být menší než 100 Ω.</p></section></div>',
    '<h3>Kondenzátory a nevázané cívky</h3><div class="rlc-grid"><article class="rlc-card"><h4>Kondenzátory</h4>',
    formula('C_{\\mathrm{p}}=C_1+C_2,\\qquad C_{\\mathrm{s}}=\\left(\\frac{1}{C_1}+\\frac{1}{C_2}\\right)^{-1}'),
    '<p>Dva stejné kondenzátory C mají paralelně 2C a sériově C/2.</p></article><article class="rlc-card"><h4>Nevázané cívky</h4>',
    formula('L_{\\mathrm{s}}=L_1+L_2,\\qquad L_{\\mathrm{p}}=\\left(\\frac{1}{L_1}+\\frac{1}{L_2}\\right)^{-1}'),
    '<p>Platí jen bez vzájemné magnetické vazby. U vázaných cívek vstupuje do vztahu M a orientace vinutí.</p></article></div>'
  ].join('');

  byId.ac.html = byId.ac.html.replace('<div data-rlc-frequency></div>', '<div data-rlc-tech-frequency></div>');
  byId['navrh-civky'].html = [
    '<ol><li><strong>Z proudu urči průřez vodiče.</strong> Zvol dovolenou proudovou hustotu J podle technologie a chlazení a vypočti ',
    formula('S_{\\mathrm{Cu}}=\\frac{I}{J},\\qquad d=\\sqrt{\\frac{4S_{\\mathrm{Cu}}}{\\pi}}'),
    '</li><li><strong>Z indukčnosti urči počet závitů.</strong> U známého jádra použij katalogový parametr A<sub>L</sub>: ',
    formula('N\\approx\\sqrt{\\frac{L}{A_L}}'),
    '</li><li><strong>Ověř, že se vinutí vejde.</strong> Počítej se skutečným průměrem drátu včetně izolace, počtem závitů v jedné vrstvě a počtem vrstev.</li>',
    '<li><strong>Zkontroluj reálný provoz.</strong> Odpor a ohřev vinutí, proud saturace jádra, vlastní rezonanci a toleranci L. Když kontrola nevyjde, návrh uprav a opakuj.</li></ol>',
    '<div class="rlc-note">Hodnotu J ani A<sub>L</sub> nelze zvolit univerzálně. J závisí na chlazení a konstrukci, A<sub>L</sub> na konkrétním jádře a vzduchové mezeře.</div>'
  ].join('');
  byId.souhrn.html = byId.souhrn.html.replace(/<div data-rlc-sort><\/div>/, '<div class="rlc-finish"><span aria-hidden="true">✓</span><h3>Gratuluju, prošel jsi celou otázku.</h3><p>Teď ji zkus bez nápovědy říct v pořadí: definice → R, C, L → reálné vlastnosti → spojování → AC a rezonance → použití a katalogové meze.</p><a href="/maturita/zkouska/">Vyzkoušet otázku nanečisto →</a></div>');

  const order = ['prehled','rezistor','kondenzator','civka','modely','erady','znaceni','charakteristiky','spojovani','ac','rezonance','navrh-civky','vazba','transformator','katalog','souhrn'];
  data.chapters = order.map(id => byId[id]).filter(Boolean);
  data.version = 5;

  function initialize(root) {
    root.querySelectorAll('[data-rlc-color-tool]:not([data-ready])').forEach(tool => {
      tool.dataset.ready = 'true';
      if (window.ShieldioInitResistorColorTool) window.ShieldioInitResistorColorTool(tool);
    });
    root.querySelectorAll('[data-rlc-polarity]:not([data-ready])').forEach(widget => {
      widget.dataset.ready = 'true';
      const input = widget.querySelector('[data-polarity-input]');
      const draw = () => {
        const voltage = Number(input.value);
        widget.dataset.state = voltage < 0 ? 'reverse' : voltage > 0 ? 'correct' : 'zero';
        widget.querySelector('[data-polarity-voltage]').textContent = (voltage > 0 ? '+' : '') + voltage + ' V';
        widget.querySelector('[data-polarity-result]').textContent = voltage < 0 ? 'Obrácená polarita: nebezpečný stav. Odpoj napájení.' : voltage > 0 ? 'Správná polarita: anoda (+) je na vyšším potenciálu než záporně označený vývod.' : 'Bez přiloženého napětí.';
      };
      input.addEventListener('input', draw); draw();
    });
    root.querySelectorAll('[data-rlc-derating]:not([data-ready])').forEach(widget => {
      widget.dataset.ready = 'true';
      widget.innerHTML = '<h3>Dovolený výkon rezistoru vs teplota okolí</h3><div class="rlc-controls"><label>Teplota okolí <output data-temp-out>25 °C</output><input type="range" min="20" max="155" value="25" data-temp></label></div><svg class="rlc-tech-chart" viewBox="0 0 680 350" role="img" aria-label="Modelová deratingová křivka rezistoru 0,5 W"><path class="axis" d="M70 25V285H645"/><path class="grid" d="M70 90H645M70 155H645M70 220H645M215 25V285M405 25V285M595 25V285"/><path class="curve-r" d="M70 25H290L620 285"/><path class="guide" data-derating-guide/><circle class="chart-point" data-derating-point r="8"/><text x="15" y="32">0,50 W</text><text x="15" y="162">0,25 W</text><text x="15" y="292">0 W</text><text x="270" y="315">70 °C</text><text x="580" y="315">155 °C</text><text x="535" y="340">teplota →</text></svg><div class="rlc-result" data-derating-result></div>';
      const input = widget.querySelector('[data-temp]');
      const draw = () => {
        const temp = Number(input.value), power = temp <= 70 ? .5 : Math.max(0, .5 * (155-temp)/85);
        const x = 70 + (temp-20)/135*550, y = 285-power/.5*260;
        widget.querySelector('[data-temp-out]').textContent = temp + ' °C';
        widget.querySelector('[data-derating-point]').setAttribute('cx', x);
        widget.querySelector('[data-derating-point]').setAttribute('cy', y);
        widget.querySelector('[data-derating-guide]').setAttribute('d', 'M70 ' + y + 'H' + x + 'V285');
        widget.querySelector('[data-derating-result]').textContent = 'Při ' + temp + ' °C je v tomto modelovém příkladu dovolený výkon přibližně ' + power.toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' W.';
      };
      input.addEventListener('input', draw); draw();
    });
    root.querySelectorAll('[data-rlc-pot-graph]:not([data-ready])').forEach(widget => {
      widget.dataset.ready = 'true';
      widget.innerHTML = '<div class="rlc-controls"><label>Natočení jezdce <output data-pot-out>50 %</output><input type="range" min="0" max="100" value="50" data-pot></label></div><svg class="rlc-tech-chart" viewBox="0 0 680 350" role="img" aria-label="Lineární, logaritmický a opačný průběh potenciometru"><path class="axis" d="M70 25V285H645"/><path class="grid" d="M70 155H645M357 25V285"/><path class="pot-linear" d="M70 285L645 25"/><path class="pot-log" d="M70 285C350 282 520 210 645 25"/><path class="pot-reverse" d="M70 285C195 100 365 28 645 25"/><path class="guide" data-pot-guide/><circle class="chart-point" data-pot-point r="8"/><text x="485" y="75">opačný</text><text x="500" y="125">lineární</text><text x="505" y="245">logaritmický</text><text x="8" y="35">100 %</text><text x="30" y="292">0 %</text><text x="535" y="330">natočení →</text></svg><div class="rlc-result" data-pot-result></div>';
      const input = widget.querySelector('[data-pot]');
      const draw = () => {
        const position = Number(input.value), ratio=position/100, x=70+ratio*575, y=285-ratio*260;
        widget.querySelector('[data-pot-out]').textContent = position + ' %';
        widget.querySelector('[data-pot-guide]').setAttribute('d', 'M70 ' + y + 'H' + x + 'V285');
        widget.querySelector('[data-pot-point]').setAttribute('cx', x); widget.querySelector('[data-pot-point]').setAttribute('cy', y);
        widget.querySelector('[data-pot-result]').textContent = 'Lineární potenciometr 10 kΩ: při ' + position + ' % je mezi začátkem dráhy a jezdcem přibližně ' + (10*ratio).toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' kΩ.';
      };
      input.addEventListener('input', draw); draw();
    });
    root.querySelectorAll('[data-rlc-tech-frequency]:not([data-ready])').forEach(widget => {
      widget.dataset.ready = 'true';
      widget.innerHTML = '<h3>Reaktance v závislosti na frekvenci</h3><p>Obě osy jsou logaritmické. Každá svislá čára znamená desetinásobek frekvence, každá vodorovná desetinásobek reaktance.</p><div class="rlc-controls"><label>L [mH]<input data-tech-l type="number" value="10" min="0.001"></label><label>C [µF]<input data-tech-c type="number" value="1" min="0.0001"></label></div><svg class="rlc-tech-chart" viewBox="0 0 720 390" role="img" aria-label="Logaritmický graf kapacitní a indukční reaktance"><path class="axis" d="M80 25V320H690"/><path class="grid" d="M80 84H690M80 143H690M80 202H690M80 261H690M202 25V320M324 25V320M446 25V320M568 25V320"/><path class="curve-l" data-tech-line-l/><path class="curve-c" data-tech-line-c/><circle class="chart-point" data-tech-cross r="7"/><text x="18" y="31">1 MΩ</text><text x="24" y="90">100 kΩ</text><text x="30" y="149">10 kΩ</text><text x="37" y="208">1 kΩ</text><text x="37" y="267">100 Ω</text><text x="45" y="326">10 Ω</text><text x="67" y="350">10 Hz</text><text x="180" y="350">100 Hz</text><text x="307" y="350">1 kHz</text><text x="422" y="350">10 kHz</text><text x="540" y="350">100 kHz</text><text x="650" y="350">1 MHz</text><text x="575" y="65">XL</text><text x="575" y="288">XC</text></svg><div class="rlc-result" data-tech-result></div>';
      const draw = () => {
        const L=Number(widget.querySelector('[data-tech-l]').value)/1000, C=Number(widget.querySelector('[data-tech-c]').value)/1e6;
        const xFor=f=>80+(Math.log10(f)-1)/5*610, yFor=v=>320-(Math.log10(v)-1)/5*295;
        const frequencies=Array.from({length:101},(_,i)=>Math.pow(10,1+i/20));
        const path=fn=>frequencies.map((f,i)=>(i?'L':'M')+xFor(f)+' '+Math.max(25,Math.min(320,yFor(fn(f))))).join(' ');
        widget.querySelector('[data-tech-line-l]').setAttribute('d',path(f=>2*Math.PI*f*L));
        widget.querySelector('[data-tech-line-c]').setAttribute('d',path(f=>1/(2*Math.PI*f*C)));
        const f0=1/(2*Math.PI*Math.sqrt(L*C)), reactance=2*Math.PI*f0*L;
        widget.querySelector('[data-tech-cross]').setAttribute('cx',Math.max(80,Math.min(690,xFor(f0))));
        widget.querySelector('[data-tech-cross]').setAttribute('cy',Math.max(25,Math.min(320,yFor(reactance))));
        widget.querySelector('[data-tech-result]').textContent='Průsečík XL = XC je při f₀ ≈ '+f0.toLocaleString('cs-CZ',{maximumFractionDigits:1})+' Hz a reaktanci přibližně '+reactance.toLocaleString('cs-CZ',{maximumFractionDigits:1})+' Ω.';
      };
      widget.querySelectorAll('input').forEach(input=>input.addEventListener('input',draw)); draw();
    });
    const next=root.querySelector('[data-rlc-action="next"]');
    const nextLabel=root.querySelector('.rlc-finish')?'Hotovo ✓':'Další →';
    if(next && next.textContent!==nextLabel) next.textContent=nextLabel;
  }

  const original=window.renderShieldioRlc;
  window.renderShieldioRlc=root=>{
    original(root);
    const observer=new MutationObserver(()=>initialize(root));
    observer.observe(root,{childList:true,subtree:true});
    initialize(root);
  };
})();
