import { buildFirmware, SENSOR } from "./avr-compiler.mjs?v=20261102-studio2";
import { validateLibraries, resolveLibraries } from "./arduino-libraries.mjs";

self.onmessage = async ({ data }) => {
  try {
    const libraries = [...validateLibraries(data.libraries || [])];
    const combined = resolveLibraries(data.source, libraries).dependencySource;
    if (/ShieldioDisplay\.h/.test(combined)) {
      const response = await fetch(new URL("../arduino/ShieldioDisplay.json", import.meta.url));
      if (!response.ok) throw new Error("loadFailure");
      libraries.push(await response.json());
    }
    const result = await buildFirmware({
      source: "#include <Arduino.h>\n#line 1 \"shieldio.ino\"\n" + data.source,
      sensors: /Adafruit_SSD1306\.h/.test(combined) ? [SENSOR.OLED] : [],
      libraries,
    });
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message || String(error), details: error.details });
  }
};
