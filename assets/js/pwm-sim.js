// Shieldio — interactive PWM simulator for the "Jak to funguje" PWM page.
// LED PWM and servo control both use pulses, but they do not use the same scale:
// LEDs use a 0–100% duty cycle, while a hobby servo reads a 1–2 ms pulse in a 20 ms period.
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
    const avgOut = document.getElementById("pwmAvg");
    const msOut = document.getElementById("pwmMs");
    const degOut = document.getElementById("pwmDeg");
    const controlLabel = document.getElementById("pwmControlLabel");
    const controlValue = document.getElementById("pwmControlValue");
    const modeToggle = document.querySelector("[data-pwm-mode-toggle]");
    if (!slider || !wave || !led || !arm) return;

    let mode = "led";
    const values = { led: 50, servo: 1.5 };
    const locale = () => document.documentElement.lang === "en" ? "en-US" : "cs-CZ";

    function render() {
      values[mode] = Number(slider.value);
      const pulseMs = mode === "servo" ? values.servo : null;
      const duty = mode === "servo" ? (pulseMs / 20) * 100 : values.led;
      wave.innerHTML = `<polyline points="${buildWave(duty)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>`;
      led.setAttribute("fill-opacity", String(0.12 + (values.led / 100) * 0.88));
      const angle = mode === "servo" ? (pulseMs - 1) * 180 : 90;
      arm.setAttribute("transform", `rotate(${angle - 90} 50 90)`);
      if (pctOut) pctOut.textContent = duty.toLocaleString(locale(), { maximumFractionDigits: 1 }) + " %";
      if (avgOut) avgOut.textContent = ((values.led / 100) * 5).toLocaleString(locale(), { maximumFractionDigits: 2 }) + " V";
      if (msOut && pulseMs !== null) msOut.textContent = pulseMs.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ms";
      if (degOut) degOut.textContent = Math.round(angle) + "°";
      if (controlValue) controlValue.textContent = mode === "servo"
        ? pulseMs.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ms"
        : Math.round(values.led) + " %";
    }

    function applyMode() {
      document.querySelectorAll("[data-pwm-device]").forEach((el) => {
        el.hidden = el.dataset.pwmDevice !== mode;
      });
      document.querySelectorAll('[data-pwm-readout="servo"]').forEach((el) => {
        el.style.display = mode === "servo" ? "" : "none";
      });
      document.querySelectorAll('[data-pwm-readout="led"]').forEach((el) => {
        el.style.display = mode === "led" ? "" : "none";
      });
      if (mode === "servo") {
        slider.min = "1"; slider.max = "2"; slider.step = "0.05"; slider.value = String(values.servo);
        if (controlLabel) controlLabel.firstChild.textContent = document.documentElement.lang === "en" ? "Servo pulse " : "Pulz serva ";
        slider.setAttribute("aria-label", document.documentElement.lang === "en" ? "Servo pulse length in milliseconds" : "Délka pulzu serva v milisekundách");
      } else {
        slider.min = "0"; slider.max = "100"; slider.step = "1"; slider.value = String(values.led);
        if (controlLabel) controlLabel.firstChild.textContent = document.documentElement.lang === "en" ? "LED duty cycle " : "Střída LED ";
        slider.setAttribute("aria-label", document.documentElement.lang === "en" ? "LED duty cycle in percent" : "Střída LED v procentech");
      }
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
          render();
        });
      });
    }

    slider.addEventListener("input", render);
    document.addEventListener("shieldio-lang-change", () => { applyMode(); render(); });
    applyMode();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
