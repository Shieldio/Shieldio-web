// Shieldio — interactive PWM simulator for the "Jak to funguje" PWM page.
// One slider (duty cycle %) drives two different real-world interpretations:
// LED brightness (average-power reading) and servo angle (pulse-width reading).
(function () {
  function buildWave(dutyPct) {
    const cycles = 4, width = 500, height = 70, margin = 6;
    const cycleW = (width - 2 * margin) / cycles;
    const onW = cycleW * (dutyPct / 100);
    const highY = margin, lowY = height - margin;
    let x = margin;
    const pts = [`${x},${lowY}`];
    for (let i = 0; i < cycles; i++) {
      pts.push(`${x},${highY}`);
      x += onW;
      pts.push(`${x},${highY}`);
      pts.push(`${x},${lowY}`);
      x += cycleW - onW;
      pts.push(`${x},${lowY}`);
    }
    return pts.join(" ");
  }

  function init() {
    const slider = document.getElementById("pwmSlider");
    const wave = document.getElementById("pwmWave");
    const led = document.getElementById("pwmLed");
    const arm = document.getElementById("pwmServoArm");
    const pctOut = document.getElementById("pwmPct");
    const msOut = document.getElementById("pwmMs");
    const degOut = document.getElementById("pwmDeg");
    const modeToggle = document.querySelector("[data-pwm-mode-toggle]");
    if (!slider || !wave || !led || !arm) return;

    let mode = "led";

    function render() {
      const duty = Number(slider.value);
      wave.innerHTML = `<polyline points="${buildWave(duty)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>`;
      led.setAttribute("fill-opacity", String(0.12 + (duty / 100) * 0.88));
      const angle = (duty / 100) * 180;
      const pulseMs = 1 + (duty / 100) * 1;
      arm.setAttribute("transform", `rotate(${angle - 90} 50 90)`);
      if (pctOut) pctOut.textContent = duty + " %";
      if (msOut) msOut.textContent = pulseMs.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ms";
      if (degOut) degOut.textContent = Math.round(angle) + "°";
    }

    function applyMode() {
      document.querySelectorAll("[data-pwm-device]").forEach((el) => {
        el.hidden = el.dataset.pwmDevice !== mode;
      });
      document.querySelectorAll('[data-pwm-readout="servo"]').forEach((el) => {
        el.style.display = mode === "servo" ? "" : "none";
      });
      if (modeToggle) {
        modeToggle.querySelectorAll(".guide-mode-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.pwmMode === mode);
        });
      }
    }

    if (modeToggle) {
      modeToggle.querySelectorAll(".guide-mode-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          mode = btn.dataset.pwmMode;
          applyMode();
        });
      });
    }

    slider.addEventListener("input", render);
    applyMode();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
