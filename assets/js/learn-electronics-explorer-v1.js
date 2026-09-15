(() => {
  const profiles = {
    '02': ['PN přechod a propustný/závěrný směr', 'VA charakteristika diody', 'usměrnění, filtrace a ochrana'],
    '03': ['stavba NPN/PNP a proudové vztahy', 'pracovní bod a zesílení', 'spínač a zesilovač v praxi'],
    '04': ['JFET a MOSFET: řídicí elektroda', 'pracovní oblast a spínání', 'výkonové ztráty a ochrany'],
    '05': ['tyristorové a spínací prvky', 'optoelektronické a senzorové prvky', 'volba prvku a bezpečný návrh'],
    '06': ['LCD, OLED a LED zobrazování', 'pixely, řízení a obnovování', 'jas, kontrast a použití'],
    '07': ['RC/RL obvody a kmitočtová závislost', 'mezní kmitočet a Bodeho graf', 'filtry a praktické omezení'],
    '09': ['malý signál, pracovní bod a zkreslení', 'napěťové a proudové zesílení', 'vstupní a výstupní vlastnosti'],
    '10': ['výkon, účinnost a třídy zesilovačů', 'zátěž a tepelné ztráty', 'ochrany výkonového stupně'],
    '11': ['ideální operační zesilovač', 'zpětná vazba a základní zapojení', 'omezení reálného obvodu'],
    '12': ['transformace, usměrnění a filtrace', 'stabilizace a spínaný zdroj', 'zvlnění, ztráty a bezpečnost'],
    '13': ['podmínka kmitání a zpětná vazba', 'sinusový, relaxační a řízený generátor', 'kmitočet, stabilita a použití'],
    '14': ['magnetoelektrický a elektromagnetický systém', 'moment, stupnice a tlumení', 'rozsah, přesnost a bezpečnost měření'],
    '15': ['měření U, I a R převodem', 'bočník, dělič a převodník', 'chyba, zatížení a kalibrace'],
    '16': ['vzorkování, kvantování a kódování', 'aliasing a filtrace', 'digitální zpracování signálu'],
    '17': ['vzorkování a kvantování ADC', 'SAR, flash a integrační převodník', 'rozlišení, rychlost a chyba'],
    '18': ['váhový a R–2R převodník', 'referenční napětí a výstup', 'rozlišení, monotónnost a použití'],
    '19': ['typy měřicích generátorů', 'průběh, amplituda a kmitočet', 'impedance, modulace a bezpečné měření'],
    '20': ['vertikální a časová osa', 'spouštění a vzorkování', 'sondy, měření a limity'],
    '21': ['činný, jalový a zdánlivý výkon', 'měření energie a účiník', 'chyby a bezpečnost práce'],
    '22': ['měření periody a kmitočtu', 'fázový posun a časový rozdíl', 'metody a přesnost'],
    '23': ['metody měření R, C, L a Z', 'mosty, měřiče a kmitočet', 'chyby, svody a parazitní vlivy'],
    '24': ['snímač, převod, sběr dat a HMI', 'komunikace, čas a synchronizace', 'kalibrace, chyba a dokumentace'],
    '25': ['převod neelektrické veličiny', 'teplota, tlak, poloha a síla', 'rozsah, přesnost a praktická volba']
  };
  const palette = number => ({'02':'dioda','03':'tranzistor','04':'tranzistor','05':'dioda','06':'signal','07':'filter','09':'signal','10':'signal','11':'signal','12':'dioda','13':'signal','14':'meter','15':'meter','16':'digital','17':'digital','18':'digital','19':'signal','20':'scope','21':'meter','22':'scope','23':'meter','24':'digital','25':'meter'})[number] || 'signal';
  const graphic = type => ({
    dioda: '<svg viewBox="0 0 640 230" role="img" aria-label="Schéma diody a VA charakteristika"><path d="M50 115h130l90-65v130l-90-65m90 0h80m22-72v144M372 115h220"/><path d="M420 185V50m0 135h155M430 180c18-2 28-22 36-50 12-43 24-58 80-62" class="ee-accent"/><text x="125" y="95">anoda</text><text x="318" y="95">katoda</text><text x="493" y="207">U</text><text x="397" y="65">I</text></svg>',
    tranzistor: '<svg viewBox="0 0 640 230" role="img" aria-label="Řídicí elektroda ovlivňuje proud mezi dvěma vývody"><circle cx="320" cy="115" r="70"/><path d="M80 115h170m70-65v130m70-65h170M250 115l70-35m0 70 70-35"/><path d="M390 115l-30-22v44z" class="ee-fill"/><text x="100" y="94">vstup</text><text x="505" y="94">výstup</text><text x="304" y="40">řízení</text></svg>',
    filter: '<svg viewBox="0 0 640 230" role="img" aria-label="Frekvenční charakteristika filtru"><path d="M70 185h520M90 30v155"/><path d="M95 55 C190 55 245 55 305 85 S405 155 590 172" class="ee-accent"/><path d="M90 120h505" stroke-dasharray="8 8"/><text x="590" y="207">f</text><text x="64" y="42">A</text><text x="350" y="115">mezní oblast</text></svg>',
    signal: '<svg viewBox="0 0 640 230" role="img" aria-label="Průběh signálu v čase"><path d="M60 115h530M80 35v160"/><path d="M65 115 C95 20 125 20 155 115 S215 210 245 115 S305 20 335 115 S395 210 425 115 S485 20 515 115 S575 210 605 115" class="ee-accent"/><text x="592" y="142">t</text><text x="65" y="28">u</text></svg>',
    meter: '<svg viewBox="0 0 640 230" role="img" aria-label="Měřicí řetězec"><rect x="70" y="70" width="125" height="90" rx="12"/><rect x="258" y="70" width="125" height="90" rx="12"/><rect x="446" y="70" width="125" height="90" rx="12"/><path d="M195 115h63m125 0h63" class="ee-accent"/><text x="132" y="121">snímač</text><text x="320" y="121">měřidlo</text><text x="507" y="121">výsledek</text></svg>',
    digital: '<svg viewBox="0 0 640 230" role="img" aria-label="Spojitý signál přechází do vzorků"><path d="M55 170h540M55 35v135M65 120 C110 40 155 40 200 120 S290 200 335 120 S425 40 470 120 S560 200 605 120"/><path d="M85 170v-35m55 35v-105m55 105v-65m55 65v-35m55 35v-105m55 105v-65m55 65v-35m55 35v-105" class="ee-accent"/><text x="75" y="205">vzorky</text></svg>',
    scope: '<svg viewBox="0 0 640 230" role="img" aria-label="Mřížka osciloskopu s průběhem"><path d="M60 30v170M140 30v170M220 30v170M300 30v170M380 30v170M460 30v170M540 30v170M60 30h520M60 72h520M60 115h520M60 158h520M60 200h520" stroke-dasharray="4 6"/><path d="M62 130 C130 40 180 40 250 130 S370 220 440 130 S550 40 580 95" class="ee-accent"/></svg>'
  })[type];
  const interactive = type => type === 'scope' ? '<div class="ee-controls"><label>časová základna <input type="range" min="1" max="10" value="5" data-ee-range></label><output data-ee-output>5 ms/dílek</output></div>' : '<div class="ee-controls"><label>vstupní hodnota <input type="range" min="0" max="100" value="50" data-ee-range></label><output data-ee-output>50 %</output></div>';
  window.renderShieldioElectronicsExplorer = (root, question) => {
    const concepts=profiles[question.number] || ['princip a blokové schéma','parametry a měřicí postup','praktické použití a omezení'];
    const chapters=[
      ['Mapa tématu', `Téma rozděl na tři osy: ${concepts.join('; ')}. Nejdřív řekni, jaký fyzikální nebo informační jev využívá, a pak jej zakresli do blokového schématu.`],
      ['Základní princip', `Vysvětli bez vzorce, co je vstup, co se uvnitř mění a jak vzniká výstup. U tématu ${question.title} vždy odděl ideální model od reálného zapojení.`],
      ['Názorný model', 'Posuň ovladač a sleduj, že změna vstupu mění zobrazený stav. Model nevypočítává konkrétní součástku; slouží k nácviku vztahu vstup → zpracování → výstup.'],
      ['Schéma a značení', 'Nakresli značku nebo blokovou cestu signálu. Ke každému vývodu či bloku dopiš jeho funkci a směr toku energie nebo informace.'],
      ['Charakteristika a graf', 'Popiš osy grafu, jednotky a význam sklonu, mezí nebo prahu. Graf není dekorace: řekni, co se při změně parametru zlepší a co se naopak zhorší.'],
      ['Parametry', 'Uveď alespoň pět parametrů: pracovní rozsah, napájení, proud či výkon, rychlost nebo kmitočet, přesnost, teplotní závislost a mezní hodnoty.'],
      ['Praktické zapojení', `Vyber konkrétní použití pro ${question.title}. Popiš zdroj signálu, hlavní prvek, zátěž nebo měřidlo, ochranné prvky a očekávaný výsledek.`],
      ['Měření a ověření', 'Navrhni, co změříš, jaké přístroje použiješ a kde budou referenční body. Doplň, jak ověříš správné nastavení ještě před připojením citlivé zátěže.'],
      ['Typické chyby a bezpečnost', 'Rozliš chybu zapojení, překročení mezních hodnot, rušení a chybu měření. Vždy začni bezpečným stavem, správným rozsahem přístroje a kontrolou polarity či uzemnění.'],
      ['Maturita nanečisto', `Mluv pět minut: definice → princip → schéma → graf → parametry → praktický příklad → měření → omezení. Potom si otevři bod, který neumíš vysvětlit bez nápovědy.`]
    ];
    let current=0, value=50, type=palette(question.number);
    root.className='af-study';
    root.innerHTML=`<aside class="af-maturity"><span>Rozpracovaný učební materiál · 15 minut</span><h2>${question.title}</h2><div>${concepts.map((x,i)=>`<p><b>${i+1}.</b> ${x}</p>`).join('')}</div><h3>Jak s materiálem pracovat</h3><ul><li>Nejdřív pojmenuj jev a zakresli ho.</li><li>Pak přečti graf a spoj jej s měřením.</li><li>Nakonec vysvětli praktické použití i omezení.</li></ul></aside><div class="af-nav">${chapters.map((_,i)=>`<button type="button" data-ee-chapter="${i}">${String(i+1).padStart(2,'0')}</button>`).join('')}</div><article class="af-panel" data-ee-panel></article>`;
    const panel=root.querySelector('[data-ee-panel]');
    const show=i=>{current=Math.max(0,Math.min(chapters.length-1,i));const [title,body]=chapters[current];panel.innerHTML=`<span class="af-kicker">${current+1} / ${chapters.length} · elektronika</span><h2>${title}</h2><p>${body}</p><section class="af-visual ee-visual"><h3>Vizualizace</h3>${graphic(type)}${interactive(type)}<p data-ee-reading><b>Odečet modelu:</b> vstupní hodnota ${value} %.</p></section><div class="af-exam"><b>Zkoušková věta:</b> Pojmenuj veličiny, vysvětli princip vlastními slovy a doplň příklad, kde je limit daného řešení důležitý.</div><div class="af-footer"><button data-ee-prev ${current===0?'disabled':''}>← Předchozí</button><button data-ee-next ${current===chapters.length-1?'disabled':''}>Další →</button></div>`;root.querySelectorAll('[data-ee-chapter]').forEach((b,n)=>b.setAttribute('aria-current',n===current));};
    root.addEventListener('click',e=>{const c=e.target.closest('[data-ee-chapter]');if(c)show(+c.dataset.eeChapter);if(e.target.closest('[data-ee-next]'))show(current+1);if(e.target.closest('[data-ee-prev]'))show(current-1);});
    root.addEventListener('input',e=>{if(!e.target.matches('[data-ee-range]'))return;value=+e.target.value;const scope=type==='scope';panel.querySelector('[data-ee-output]').textContent=scope?`${value} ms/dílek`:`${value} %`;panel.querySelector('[data-ee-reading]').innerHTML=`<b>Odečet modelu:</b> ${scope?'časová základna':'vstupní hodnota'} ${value}${scope?' ms/dílek':' %'}.`;});show(0);
  };
})();
