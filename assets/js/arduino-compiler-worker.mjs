import { buildFirmware, SENSOR } from "./avr-compiler.mjs";

self.onmessage = async ({ data }) => {
  try {
    const result = await buildFirmware({
      source: "#include <Arduino.h>\n#line 1 \"shieldio.ino\"\n" + data.source,
      sensors: /Adafruit_SSD1306\.h/.test(data.source) ? [SENSOR.OLED] : [],
    });
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
