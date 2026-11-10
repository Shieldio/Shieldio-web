// Sériový plotter sdílí proud UTF-8 dat se sériovým monitorem. Žádný další USB reader.
export const PLOT_COLORS = Object.freeze(["#0d9488", "#e87934", "#8064d8", "#2277c7", "#d24c7f", "#7c9b28", "#b57b10", "#16a3a6"]);
const NUM = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?";
const NUM_RE = new RegExp("^" + NUM + "$");
const NAMED_RE = new RegExp("(?:^|[\\s,;]+)([\\p{L}_][\\p{L}\\p{N}_.-]{0,31})\\s*[:=]\\s*(" + NUM + ")(?=$|[\\s,;]+)", "gu");

// Formáty: 23.5; 12 25; 12,25; teplota:23.5 vlhkost:45; A=2,B=3.
// Textové logy, jednotky a neplatná čísla se bezpečně ignorují.
export function parsePlotLine(line) {
  const input = String(line).trim();
  if (!input || input.length > 512) return null;
  const matches = [...input.matchAll(NAMED_RE)];
  if (matches.length) {
    if (input.replace(NAMED_RE, "").replace(/[\\s,;]+/g, "")) return null;
    const result = Object.create(null);
    for (const match of matches) {
      const value = Number(match[2]);
      if (!Number.isFinite(value)) return null;
      result[match[1]] = value;
    }
    return Object.keys(result).length <= 8 ? result : null;
  }
  const tokens = input.split(/[\\s,;]+/);
  if (tokens.length > 8 || tokens.some(token => !NUM_RE.test(token))) return null;
  const result = Object.create(null);
  for (let i = 0; i < tokens.length; i++) {
    const value = Number(tokens[i]);
    if (!Number.isFinite(value)) return null;
    result["S" + (i + 1)] = value;
  }
  return result;
}

export class SerialPlotter {
  constructor({ maxSamples = 600, maxSeries = 8 } = {}) {
    this.maxSamples = Math.max(10, Math.min(2000, Math.floor(maxSamples)));
    this.maxSeries = Math.max(1, Math.min(8, Math.floor(maxSeries)));
    this.clear();
  }
  clear() {
    this.partial = "";
    this.series = [];
    this.samples = [];
    this.count = 0;
  }
  append(chunk) {
    if (!chunk) return false;
    const joined = this.partial + String(chunk);
    const lines = joined.split(/\\r\\n|\\r|\\n/);
    this.partial = lines.pop() || "";
    // Poškozený nekonečný řádek nesmí neomezeně zabírat paměť.
    if (this.partial.length > 4096) this.partial = "";
    let changed = false;
    for (const line of lines) {
      const data = parsePlotLine(line);
      if (!data) continue;
      const values = Object.create(null);
      for (const [name, value] of Object.entries(data)) {
        if (!this.series.includes(name)) {
          if (this.series.length >= this.maxSeries) continue;
          this.series.push(name);
        }
        values[name] = value;
      }
      if (!Object.keys(values).length) continue;
      this.samples.push({ index: ++this.count, values });
      changed = true;
    }
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
    return changed;
  }
  range() {
    let lo = Infinity, hi = -Infinity;
    for (const sample of this.samples) {
      for (const value of Object.values(sample.values)) {
        if (value < lo) lo = value;
        if (value > hi) hi = value;
      }
    }
    if (!Number.isFinite(lo)) return { min: -1, max: 1 };
    const span = hi - lo;
    const padding = (span || Math.max(1, Math.abs(hi) * 0.1)) * 0.1;
    return { min: lo - padding, max: hi + padding };
  }
}

function formatTick(value) {
  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
    return value.toExponential(1);
  }
  return Number(value.toPrecision(4)).toString();
}

export function drawSerialPlot(canvas, plot, { min = null, max = null, emptyLabel = "Čekám na číselná data…" } = {}) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.floor(rect.width), height = Math.floor(rect.height);
  if (width < 100 || height < 100) return;
  const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth; canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const style = getComputedStyle(canvas);
  const color = name => style.getPropertyValue(name).trim();
  const ink = color("--ink") || "#26312f";
  const soft = color("--ink-soft") || "#75817d";
  const line = color("--line") || "#dce4e1";
  const paper = color("--paper") || "#ffffff";
  ctx.fillStyle = paper; ctx.fillRect(0, 0, width, height);
  const left = 62, top = 14, right = width - 14, bottom = height - 30;
  const chartW = right - left, chartH = bottom - top;
  if (chartW <= 0 || chartH <= 0) return;

  let bounds = plot.range();
  if (Number.isFinite(min) && Number.isFinite(max) && max > min) bounds = { min, max };
  const span = bounds.max - bounds.min;
  ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const y = top + i * chartH / 4;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y);
    ctx.strokeStyle = line; ctx.stroke();
    ctx.fillStyle = soft;
    ctx.fillText(formatTick(bounds.max - i * span / 4), left - 10, y);
  }
  for (let i = 0; i <= 5; i++) {
    const x = left + i * chartW / 5;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom);
    ctx.strokeStyle = line; ctx.stroke();
  }

  if (!plot.samples.length) {
    ctx.fillStyle = soft; ctx.textAlign = "center";
    ctx.fillText(emptyLabel, left + chartW / 2, top + chartH / 2);
    return;
  }

  const yPosition = value => bottom - (value - bounds.min) / span * chartH;
  const xStep = chartW / (plot.maxSamples - 1);
  const first = plot.samples.length - 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(left, top, chartW, chartH); ctx.clip();
  plot.series.forEach((name, channel) => {
    ctx.strokeStyle = PLOT_COLORS[channel % PLOT_COLORS.length];
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    let drawing = false;
    ctx.beginPath();
    plot.samples.forEach((sample, i) => {
      const value = sample.values[name];
      if (value === undefined) { drawing = false; return; }
      const x = right - (first - i) * xStep, y = yPosition(value);
      if (!drawing) { ctx.moveTo(x, y); drawing = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.restore();
  ctx.fillStyle = soft; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText("#" + plot.samples[0].index, left, height - 6);
  ctx.textAlign = "right";
  ctx.fillText("#" + plot.count, right, height - 6);
}
