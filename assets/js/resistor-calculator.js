// Shieldio — reusable Ohm's law resistor calculator widget
// Auto-inits any .resistor-calc element on the page (data-calc="vs|vf|i|r|note").

(function () {
  const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

  function nearestStandard(value) {
    if (!isFinite(value) || value <= 0) return null;
    const exp = Math.floor(Math.log10(value));
    let best = null, bestDiff = Infinity;
    for (let e = exp - 1; e <= exp + 1; e++) {
      E12.forEach(base => {
        // round away binary-float noise (e.g. 2.2 * 100 !== 220 exactly) before comparing
        const candidate = Math.round(base * Math.pow(10, e) * 1e6) / 1e6;
        const diff = Math.round(Math.abs(candidate - value) * 1e6) / 1e6;
        // on a tie, prefer the higher resistance — safer for current-limiting (never exceeds the target current)
        if (diff < bestDiff || (diff === bestDiff && candidate > best)) { bestDiff = diff; best = candidate; }
      });
    }
    return best;
  }

  function formatOhm(v) {
    if (v == null || !isFinite(v)) return "—";
    if (v >= 1000) return (v / 1000).toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) + " kΩ";
    return Math.round(v).toLocaleString("cs-CZ") + " Ω";
  }

  function init(el) {
    const vs = el.querySelector('[data-calc="vs"]');
    const vf = el.querySelector('[data-calc="vf"]');
    const i = el.querySelector('[data-calc="i"]');
    const rOut = el.querySelector('[data-calc="r"]');
    const note = el.querySelector('[data-calc="note"]');
    if (!vs || !vf || !i || !rOut) return;

    function update() {
      const Vs = parseFloat(vs.value);
      const Vf = parseFloat(vf.value);
      const Ima = parseFloat(i.value);
      if (!isFinite(Vs) || !isFinite(Vf) || !isFinite(Ima) || Ima <= 0 || Vs <= Vf) {
        rOut.textContent = "—";
        if (note) note.textContent = "Napájecí napětí musí být vyšší než úbytek napětí na LED.";
        return;
      }
      const R = (Vs - Vf) / (Ima / 1000);
      const std = nearestStandard(R);
      rOut.textContent = formatOhm(R);
      if (note) {
        note.textContent = `Vzorec: R = (Vnapájení − VLED) ⁄ Iproud = (${Vs} − ${Vf}) V ⁄ ${(Ima / 1000).toLocaleString("cs-CZ")} A ≈ ${formatOhm(R)}. Nejbližší běžně vyráběná hodnota z řady E12 je ${formatOhm(std)}.`;
      }
    }

    [vs, vf, i].forEach(inp => inp.addEventListener("input", update));
    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".resistor-calc").forEach(init);
  });
})();
