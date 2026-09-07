// Shieldio — reusable Ohm's law resistor calculator widget
// Auto-inits any .resistor-calc element on the page (data-calc="vs|vf|i|r|note").

(function () {
  const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

  function nextSafeStandard(value) {
    if (!isFinite(value) || value <= 0) return null;
    const exp = Math.floor(Math.log10(value));
    let best = null;
    for (let e = exp - 1; e <= exp + 2; e++) {
      E12.forEach(base => {
        const candidate = Math.round(base * Math.pow(10, e) * 1e6) / 1e6;
        if (candidate >= value && (best === null || candidate < best)) best = candidate;
      });
    }
    return best;
  }

  function formatOhm(v) {
    if (v == null || !isFinite(v)) return "—";
    const locale = currentLang() === "cs" ? "cs-CZ" : "en-US";
    if (v >= 1000000) return (v / 1000000).toLocaleString(locale, { maximumFractionDigits: 2 }) + " MΩ";
    if (v >= 1000) return (v / 1000).toLocaleString(locale, { maximumFractionDigits: 2 }) + " kΩ";
    return v.toLocaleString(locale, { maximumFractionDigits: v < 10 ? 2 : (v < 100 ? 1 : 0) }) + " Ω";
  }

  const STRINGS = {
    cs: {
      needHigherSupply: "Napájecí napětí musí být vyšší než úbytek napětí na LED.",
      varSupply: "napájení",
      varLed: "LED",
      varCurrent: "proud",
      nearestValue: (v, current) => `Nejbližší vyšší hodnota z řady E12 je ${v}; skutečný proud bude přibližně ${current}.`,
      formulaFallback: (R) => `R = (Vnapájení − VLED) ⁄ Iproud ≈ ${R}`,
      textFallback: (Vs, Vf, Ima, R, std) =>
        `Vzorec: R = (Vnapájení − VLED) ⁄ Iproud = (${Vs} − ${Vf}) V ⁄ ${Ima} A ≈ ${R}. Nejbližší běžně vyráběná hodnota z řady E12 je ${std}.`,
    },
    en: {
      needHigherSupply: "The supply voltage must be higher than the LED's voltage drop.",
      varSupply: "supply",
      varLed: "LED",
      varCurrent: "current",
      nearestValue: (v, current) => `The next higher E12 value is ${v}; the actual current will be about ${current}.`,
      formulaFallback: (R) => `R = (Vsupply − VLED) ⁄ Icurrent ≈ ${R}`,
      textFallback: (Vs, Vf, Ima, R, std) =>
        `Formula: R = (Vsupply − VLED) ⁄ Icurrent = (${Vs} − ${Vf}) V ⁄ ${Ima} A ≈ ${R}. The nearest standard E12 value is ${std}.`,
    },
  };

  function currentLang() {
    return document.documentElement.lang === "en" ? "en" : "cs";
  }

  function init(el) {
    const vs = el.querySelector('[data-calc="vs"]');
    const vf = el.querySelector('[data-calc="vf"]');
    const i = el.querySelector('[data-calc="i"]');
    const rOut = el.querySelector('[data-calc="r"]');
    const standardOut = el.querySelector('[data-calc="standard"]');
    const actualCurrentOut = el.querySelector('[data-calc="actual-current"]');
    const note = el.querySelector('[data-calc="note"]');
    if (!vs || !vf || !i || !rOut) return;

    function update() {
      const t = STRINGS[currentLang()];
      const Vs = parseFloat(vs.value);
      const Vf = parseFloat(vf.value);
      const Ima = parseFloat(i.value);
      if (!isFinite(Vs) || !isFinite(Vf) || !isFinite(Ima) || Ima <= 0 || Vs <= Vf) {
        rOut.textContent = "—";
        if (standardOut) standardOut.textContent = "—";
        if (actualCurrentOut) actualCurrentOut.textContent = "—";
        if (note) note.textContent = t.needHigherSupply;
        return;
      }
      const R = (Vs - Vf) / (Ima / 1000);
      const std = nextSafeStandard(R);
      const actualCurrent = ((Vs - Vf) / std) * 1000;
      rOut.textContent = formatOhm(R);
      if (standardOut) standardOut.textContent = formatOhm(std);
      if (actualCurrentOut) actualCurrentOut.textContent = `${actualCurrent.toLocaleString(currentLang() === "cs" ? "cs-CZ" : "en-US", { maximumFractionDigits: 1 })} mA`;
      if (note) {
        const tail = ` \\approx ${formatOhm(R).replace("Ω", "\\,\\Omega").replace("kΩ", "\\,\\text{k}\\Omega")}`;
        const formula = `R = \\dfrac{V_{${t.varSupply}} - V_{${t.varLed}}}{I_{${t.varCurrent}}} = \\dfrac{${Vs} - ${Vf}\\,\\text{V}}{${(Ima / 1000).toLocaleString("cs-CZ")}\\,\\text{A}}${tail}`;
        if (window.katex) {
          note.innerHTML = "";
          const formulaSpan = document.createElement("span");
          note.appendChild(formulaSpan);
          try {
            katex.render(formula, formulaSpan, { throwOnError: false, displayMode: false });
          } catch (e) {
            formulaSpan.textContent = t.formulaFallback(formatOhm(R));
          }
          note.appendChild(document.createTextNode(" " + t.nearestValue(formatOhm(std), `${actualCurrent.toLocaleString(currentLang() === "cs" ? "cs-CZ" : "en-US", { maximumFractionDigits: 1 })} mA`)));
        } else {
          note.textContent = t.textFallback(Vs, Vf, (Ima / 1000).toLocaleString("cs-CZ"), formatOhm(R), formatOhm(std));
        }
      }
    }

    [vs, vf, i].forEach(inp => inp.addEventListener("input", update));
    document.addEventListener("shieldio-lang-change", update);
    update();
  }

  const BAND_COLORS = [
    { key: "black", cs: "Černá", en: "Black", value: 0, hex: "#171717", multiplier: 1 },
    { key: "brown", cs: "Hnědá", en: "Brown", value: 1, hex: "#78350f", multiplier: 10, tolerance: 1 },
    { key: "red", cs: "Červená", en: "Red", value: 2, hex: "#dc2626", multiplier: 100, tolerance: 2 },
    { key: "orange", cs: "Oranžová", en: "Orange", value: 3, hex: "#f97316", multiplier: 1000 },
    { key: "yellow", cs: "Žlutá", en: "Yellow", value: 4, hex: "#facc15", multiplier: 10000 },
    { key: "green", cs: "Zelená", en: "Green", value: 5, hex: "#16a34a", multiplier: 100000, tolerance: .5 },
    { key: "blue", cs: "Modrá", en: "Blue", value: 6, hex: "#2563eb", multiplier: 1000000, tolerance: .25 },
    { key: "violet", cs: "Fialová", en: "Violet", value: 7, hex: "#7e22ce", multiplier: 10000000, tolerance: .1 },
    { key: "grey", cs: "Šedá", en: "Grey", value: 8, hex: "#6b7280", multiplier: 100000000, tolerance: .05 },
    { key: "white", cs: "Bílá", en: "White", value: 9, hex: "#f8fafc", multiplier: 1000000000 },
    { key: "gold", cs: "Zlatá", en: "Gold", hex: "#d4af37", multiplier: .1, tolerance: 5 },
    { key: "silver", cs: "Stříbrná", en: "Silver", hex: "#a8a8a8", multiplier: .01, tolerance: 10 },
  ];

  function initColorTool(root) {
    let mode = "value";
    const lang = () => currentLang();
    const copy = {
      cs: { title: "Barevný kód rezistoru", intro: "Převáděj hodnotu na čtyři proužky i proužky zpět na hodnotu. Pod pomůckou najdeš úplnou tabulku barev.", toBands: "Hodnota → proužky", fromBands: "Proužky → hodnota", value: "Hodnota", unit: "Jednotka", tolerance: "Tolerance", band1: "1. číslice", band2: "2. číslice", multiplier: "Násobitel", result: "Výsledek", rounded: "Nejbližší hodnota zobrazitelná čtyřmi proužky", tableColor: "Barva", tableDigit: "Číslice", tableMultiplier: "Násobitel", tableTolerance: "Tolerance" },
      en: { title: "Resistor colour code", intro: "Convert a value to four bands or the bands back to a value. The complete colour table is below.", toBands: "Value → bands", fromBands: "Bands → value", value: "Value", unit: "Unit", tolerance: "Tolerance", band1: "1st digit", band2: "2nd digit", multiplier: "Multiplier", result: "Result", rounded: "Nearest value representable with four bands", tableColor: "Colour", tableDigit: "Digit", tableMultiplier: "Multiplier", tableTolerance: "Tolerance" },
    };
    const label = color => color[lang()];
    const colorByKey = key => BAND_COLORS.find(color => color.key === key);
    const option = (color, text) => `<option value="${color.key}">${text || label(color)}</option>`;

    function visual(keys) {
      return `<div class="resistor-visual" aria-hidden="true"><div class="resistor-body">${keys.map(key => `<span class="resistor-band" style="background:${colorByKey(key).hex}"></span>`).join("")}</div></div>`;
    }

    function valueToBands(value, tolerance) {
      if (!isFinite(value) || value <= 0) return null;
      let exponent = Math.floor(Math.log10(value)) - 1;
      exponent = Math.min(9, Math.max(-2, exponent));
      let digits = Math.round(value / Math.pow(10, exponent));
      if (digits >= 100) { digits = Math.round(digits / 10); exponent += 1; }
      if (digits < 10 || digits > 99 || exponent > 9) return null;
      const multiplier = BAND_COLORS.find(color => color.multiplier === Math.pow(10, exponent));
      const toleranceColor = BAND_COLORS.find(color => color.tolerance === tolerance);
      if (!multiplier || !toleranceColor) return null;
      return { keys: [BAND_COLORS[Math.floor(digits / 10)].key, BAND_COLORS[digits % 10].key, multiplier.key, toleranceColor.key], value: digits * multiplier.multiplier };
    }

    function render() {
      const t = copy[lang()];
      const digitOptions = BAND_COLORS.slice(0, 10);
      const multiplierOptions = BAND_COLORS.filter(color => color.multiplier !== undefined);
      const toleranceOptions = BAND_COLORS.filter(color => color.tolerance !== undefined);
      root.innerHTML = `
        <h2>${t.title}</h2><p>${t.intro}</p>
        <div class="resistor-tool-tabs" role="tablist">
          <button class="resistor-tool-tab" type="button" data-mode="value" aria-selected="${mode === "value"}">${t.toBands}</button>
          <button class="resistor-tool-tab" type="button" data-mode="bands" aria-selected="${mode === "bands"}">${t.fromBands}</button>
        </div>
        <div class="resistor-tool-panel" data-panel="value" ${mode === "value" ? "" : "hidden"}>
          <div class="resistor-tool-fields">
            <div class="resistor-tool-field"><label for="resistorValue">${t.value}</label><input id="resistorValue" type="number" min="0.1" step="0.1" value="220"></div>
            <div class="resistor-tool-field"><label for="resistorUnit">${t.unit}</label><select id="resistorUnit"><option value="1">Ω</option><option value="1000">kΩ</option><option value="1000000">MΩ</option></select></div>
            <div class="resistor-tool-field"><label for="resistorTolerance">${t.tolerance}</label><select id="resistorTolerance">${[1,2,5,10].map(n => `<option value="${n}" ${n === 5 ? "selected" : ""}>±${n} %</option>`).join("")}</select></div>
          </div><div data-value-visual></div><p class="resistor-tool-result" data-value-result></p>
        </div>
        <div class="resistor-tool-panel" data-panel="bands" ${mode === "bands" ? "" : "hidden"}>
          <div class="resistor-tool-fields">
            <div class="resistor-tool-field"><label>${t.band1}</label><select data-band="0">${digitOptions.slice(1).map(c => option(c)).join("")}</select></div>
            <div class="resistor-tool-field"><label>${t.band2}</label><select data-band="1">${digitOptions.map(c => option(c)).join("")}</select></div>
            <div class="resistor-tool-field"><label>${t.multiplier}</label><select data-band="2">${multiplierOptions.map(c => option(c, `${label(c)} · ×${c.multiplier}`)).join("")}</select></div>
            <div class="resistor-tool-field"><label>${t.tolerance}</label><select data-band="3">${toleranceOptions.map(c => option(c, `${label(c)} · ±${c.tolerance} %`)).join("")}</select></div>
          </div><div data-bands-visual></div><p class="resistor-tool-result" data-bands-result></p>
        </div>
        <div class="resistor-color-table-wrap"><table class="learn-table"><thead><tr><th>${t.tableColor}</th><th>${t.tableDigit}</th><th>${t.tableMultiplier}</th><th>${t.tableTolerance}</th></tr></thead><tbody>${BAND_COLORS.map(c => `<tr><td><span class="resistor-color-swatch" style="background:${c.hex}"></span>${label(c)}</td><td>${c.value === undefined ? "—" : c.value}</td><td>${c.multiplier === undefined ? "—" : `×${c.multiplier}`}</td><td>${c.tolerance === undefined ? "—" : `±${c.tolerance} %`}</td></tr>`).join("")}</tbody></table></div>`;

      const updateValue = () => {
        const raw = Number(root.querySelector("#resistorValue").value) * Number(root.querySelector("#resistorUnit").value);
        const converted = valueToBands(raw, Number(root.querySelector("#resistorTolerance").value));
        root.querySelector("[data-value-visual]").innerHTML = converted ? visual(converted.keys) : "";
        root.querySelector("[data-value-result]").textContent = converted ? `${t.rounded}: ${formatOhm(converted.value)} · ${converted.keys.map(key => label(colorByKey(key))).join(" – ")}` : "—";
      };
      const updateBands = () => {
        const selects = [...root.querySelectorAll("[data-band]")];
        const colors = selects.map(select => colorByKey(select.value));
        const value = (colors[0].value * 10 + colors[1].value) * colors[2].multiplier;
        root.querySelector("[data-bands-visual]").innerHTML = visual(colors.map(color => color.key));
        root.querySelector("[data-bands-result]").textContent = `${t.result}: ${formatOhm(value)} ±${colors[3].tolerance} %`;
      };
      root.querySelectorAll(".resistor-tool-tab").forEach(button => button.addEventListener("click", () => { mode = button.dataset.mode; render(); }));
      root.querySelectorAll("#resistorValue,#resistorUnit,#resistorTolerance").forEach(input => input.addEventListener("input", updateValue));
      root.querySelectorAll("[data-band]").forEach(select => select.addEventListener("change", updateBands));
      root.querySelector('[data-band="0"]').value = "red";
      root.querySelector('[data-band="1"]').value = "red";
      root.querySelector('[data-band="2"]').value = "brown";
      root.querySelector('[data-band="3"]').value = "gold";
      updateValue(); updateBands();
    }
    document.addEventListener("shieldio-lang-change", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".resistor-calc").forEach(init);
    document.querySelectorAll(".resistor-color-tool").forEach(initColorTool);
  });
})();
