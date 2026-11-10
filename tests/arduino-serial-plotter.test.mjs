import assert from "node:assert/strict";
import { parsePlotLine, SerialPlotter, PLOT_COLORS } from "../assets/js/arduino-serial-plotter.mjs";

const row = text => ({ ...parsePlotLine(text) });
assert.deepEqual(row("23.5"), { S1: 23.5 });
assert.deepEqual(row("12 25"), { S1: 12, S2: 25 });
assert.deepEqual(row("12,25;-3.25e-2"), { S1: 12, S2: 25, S3: -0.0325 });
assert.deepEqual(row("A:12 B:-3.5"), { A: 12, B: -3.5 });
assert.deepEqual(row("teplota=23.4,vlhkost=56"), { teplota: 23.4, vlhkost: 56 });
for (const bad of ["", "hello world", "<script>1</script>", "1.2 V", "A:3 B:bad", "Infinity", "1e999", "NaN"]) {
  assert.equal(parsePlotLine(bad), null, bad);
}
assert.equal(parsePlotLine("0 ".repeat(9)), null, "max eight series per row");

const plot = new SerialPlotter({ maxSamples: 10 });
assert.equal(plot.append("A:12 B:20\r"), true);
assert.equal(plot.append("\nA:15 B:18\n"), true);
assert.deepEqual(plot.series, ["A", "B"]);
assert.equal(plot.count, 2);
assert.deepEqual({ ...plot.samples[1].values }, { A: 15, B: 18 });
assert.equal(plot.append("text status\n"), false, "ignore log messages");
plot.append("A:20 B:10\n".repeat(30));
assert.equal(plot.count, 32);
assert.equal(plot.samples.length, 10, "bounded history");
assert.equal(plot.samples[0].index, 23);
const r = plot.range();
assert.ok(r.min < 10 && r.max > 20, "auto-range adds padding");
plot.clear();
assert.equal(plot.samples.length, 0);
assert.equal(plot.series.length, 0);
assert.equal(plot.count, 0);
plot.append("hello without newline".repeat(1000));
assert.ok(plot.partial.length <= 4096, "partial text line bounded");
assert.equal(PLOT_COLORS.length, 8);
console.log("Sériový plotter: parser, pojmenované řady, streamované řádky, limity a rozsah OK.");
