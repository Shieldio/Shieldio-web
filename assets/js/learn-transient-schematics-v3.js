(() => {
  const chapters = window.ShieldioTransientData.chapters;
  const formula = tex => `<div class="tr-formula" data-tr-math="${tex}"></div>`;
  const diagram = (type, charging) => {
    const capacitor = type === 'RC';
    const source = charging ? '<circle cx="90" cy="150" r="34"/><path d="M78 138h24m-12-12v24m-12 22h24"/><text x="37" y="154">U</text>' : '<text class="tr-small" x="20" y="154">zdroj mimo smyčku</text>';
    const left = charging ? 'M90 70h65m55 0h95M90 70v46m0 68v46h510V70h-55' : 'M210 70h95M210 70v160h390V70h-55';
    const switchPath = charging ? '<path d="M155 70h55"/><circle cx="155" cy="70" r="4"/><circle cx="210" cy="70" r="4"/><text x="174" y="46">V</text>' : '';
    const part = capacitor ? '<path d="M495 70h10m0-27v54m40-54v54m0-27h55"/><text x="515" y="32">C</text>' : '<path d="M495 70c0-23 30-23 30 0s30-23 30 0 30-23 30 0h15"/><text x="530" y="32">L</text>';
    const direction = capacitor && !charging ? '<path class="tr-current" d="M430 130H325"/><path class="tr-current-fill" d="M325 130l12-7v14z"/>' : '<path class="tr-current" d="M325 130h105"/><path class="tr-current-fill" d="M430 130l-12-7v14z"/>';
    const resistorPolarity=capacitor&&!charging?'uR: + vpravo, − vlevo':'uR: + vlevo, − vpravo';
    return `<figure class="tr-circuit tr-circuit-v3"><svg viewBox="0 0 720 270" role="img" aria-label="Uzavřené zapojení ${type} při ${charging?'zapnutí':'vybíjení po odpojení zdroje'}"><g class="tr-electrical"><path d="${left}"/>${source}${switchPath}<path d="M305 70h25m115 0h50"/><rect x="330" y="51" width="115" height="38"/>${part}</g><text x="378" y="42">R</text>${direction}<text x="370" y="154">i</text></svg><figcaption><strong>${charging?'Zdroj je připojený.':'Zdroj je odpojený; smyčka je uzavřená.'}</strong> Proud teče ve směru červené šipky. Referenční polarity: ${resistorPolarity}; u${capacitor?'C':'L'}: + vlevo, − vpravo.</figcaption></figure>`;
  };
  const changes = {
    'rc-nabijeni': {type:'RC',on:true, equations:[String.raw`u_C(t)=U(1-\mathrm{e}^{-t/(RC)})`,String.raw`u_R(t)=U\mathrm{e}^{-t/(RC)},\qquad i(t)=\frac{U}{R}\mathrm{e}^{-t/(RC)}`]},
    'rc-vybijeni': {type:'RC',on:false, equations:[String.raw`u_C(t)=U_0\mathrm{e}^{-t/(RC)}`,String.raw`u_R(t)=U_0\mathrm{e}^{-t/(RC)},\qquad i_{\mathrm{směr\ šipky}}(t)=\frac{U_0}{R}\mathrm{e}^{-t/(RC)}`], note:'Šipka ve schématu ukazuje skutečný vybíjecí směr. Ve staré referenci nabíjení by tentýž proud vyšel záporný.'},
    'rl-zapinani': {type:'RL',on:true,equations:[String.raw`i_L(t)=\frac{U}{R}(1-\mathrm{e}^{-tR/L})`,String.raw`u_R(t)=U(1-\mathrm{e}^{-tR/L}),\qquad u_L(t)=U\mathrm{e}^{-tR/L}`]},
    'rl-vypinani': {type:'RL',on:false,equations:[String.raw`i_L(t)=I_0\mathrm{e}^{-tR/L}`,String.raw`u_R(t)=RI_0\mathrm{e}^{-tR/L},\qquad u_L(t)=-RI_0\mathrm{e}^{-tR/L}`],note:'Po odpojení zdroje proud cívky pokračuje stejným směrem. Cívka obrátí polaritu svého napětí a napájí uzavřenou smyčku.'}
  };
  for (const chapter of chapters) {
    const change = changes[chapter.id];
    if (!change) continue;
    chapter.html = chapter.html.replace(/<figure class="tr-circuit">[\s\S]*?<\/figure>/,diagram(change.type,change.on));
    if (chapter.id === 'rc-vybijeni') chapter.html = chapter.html.replace(/<div class="tr-formula" data-tr-math="u_R\+u_C=0"><\/div>/,formula(String.raw`u_R-u_C=0`)).replace(/<div class="tr-formula" data-tr-math="u_C\(t\)=[\s\S]*?<\/div>/,'').replace(/<p>Záporné znaménko proudu[\s\S]*?<\/p>/,'');
    chapter.html += `<h3>Průběhy napětí a proudu</h3>${change.equations.map(formula).join('')}${change.note?`<p>${change.note}</p>`:''}`;
  }
  const intro=chapters.find(chapter=>chapter.id==='uvod');
  intro.html=intro.html.replace(/<aside class="tr-note">/,`<div data-tr-signals></div>${formula(String.raw`\delta(t)=\frac{\mathrm{d}1(t)}{\mathrm{d}t},\qquad \int_{-\infty}^{\infty}\delta(t)\,\mathrm{d}t=1`)}<aside class="tr-note">`);
})();
