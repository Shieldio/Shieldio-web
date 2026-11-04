# ESP32 Studio — volitelný server sestavení

Samostatný nástroj je na `/esp32/`. Školní RED editor se nemění.
**Server sestavení zatím není nasazený.** Na živém webu se kód pouze edituje
a exportuje; USB nahrávání kompletních `.merged.bin` funguje bez tohoto API.
Nevydávat tuto verzi za hotový online C++ kompilátor.

## Zprovoznění na vlastním Linux serveru

```sh
docker build -t shieldio-esp32-toolchain:3.3.12 services/esp32-compiler
python3 services/esp32-compiler/server.py
```

Služba poslouchá na loopbacku `127.0.0.1:8788`. Přesměrovat ze `shieldio.cz`
jen `/api/esp32/status` a `/api/esp32/compile`. Před službu patří TLS,
limit těla 220 kB, timeout 140 s, limit požadavků podle IP a limit připojení.
Služba pouští jediný build, další vrací 429. Nezpřístupňovat Docker daemon do sítě.
Provozovatel, hostitel ani rozpočet serveru zatím nebyli zvoleni.
Obyčejný Cloudflare Worker pro statické soubory tento nativní toolchain nespustí.

Frontend povolí kompilaci až po odpovědi JSON s `protocol=shieldio-esp32-v1`
a deskou v `boards`. Chybějící API nebo fallback HTML se nesmí použít jako úspěch,
nesmí se spustit AVR kompilátor a nesmí se nabízet nefunkční sestavení ESP32.
Kompilátor se hlásí jako dostupný jen při existenci toolchain image.
Před vystavením API je nutné image skutečně sestavit a ověřit kompilací sketchů.

## Rozsah

USB: ESP32, S2, S3, C2, C3, C5, C6, C61, H2, P4 a Arduino Nano ESP32 (S3).
Pouze kompletní Arduino merged obraz od adresy 0 s tabulkou oddílů na 0x8000.
Validuje se čip obrazu i skutečné desky a kapacita flash, zápis se ověřuje MD5.
Neprovádí se `eraseAll`. Při přerušení zápisu je třeba nahrát firmware znovu.
Fyzické ověření všech variant dosud neproběhlo.

Sestavení: Arduino-ESP32 3.3.12, Arduino CLI 1.5.1, dev profily pro
ESP32/S2/S3/C3/C5/C6/H2/P4 a Nano ESP32. C2/C61 potřebují vlastní sestavení
statických knihoven nebo Arduino jako komponentu ESP-IDF; zatím pouze upload.
Jeden sketch s core/SDK knihovnami, bez nahrávání vlastních složek knihoven.
Periferie, GPIO a dostupnost WiFi/Bluetooth závisí na fyzické desce.
Vlastní oddíly, šifrované obrazy, ESP8266 a novější čipy mimo esptool-js 0.7.0
nejsou součástí této verze.

Každý sketch se sestaví v novém kontejneru bez sítě, bez klíčů hostitele,
pod uživatelem 65534, s read-only rootem a limity procesů/CPU/RAM/souborů.
Zdroj není spouštěný na hostiteli API. Mountuje se pouze daný dočasný projekt.
Zdroj i výstupy se po skončení smažou, log je omezen a neukládá se do access logu.
Uživatelský vstup nikdy neovládá shell, argumenty CLI, cestu, FQBN ani Docker mount.

## Kontroly

```sh
node tests/esp32-studio.test.mjs
python3 -m unittest discover -s services/esp32-compiler -p 'test_*.py'
```

Regresní testy ověřují všechny profily, odmítnutí app-only firmwaru, nesprávný
čip a kapacitu, chybu MD5, přerušení, uvolnění USB a izolaci sestavení.
Bez běžícího Dockeru nebylo možné lokálně ověřit image ani skutečnou kompilaci.
