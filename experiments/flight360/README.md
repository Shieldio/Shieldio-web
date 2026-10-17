# Flight360

Samostatný statický web a interaktivní 360° prohlídky na https://flight360.shieldio.cz. Projekt Shieldio; vlastní CSS a žádné externí JS knihovny ani fonty.

## Obsah a scény

Galerie je v `videos.json`. Každá položka má stabilní unikátní `id`, `title`, `description`, `url`, volitelnou délku `duration` v sekundách a `initialView: {yaw, pitch, fov}` ve stupních. Aktuálně jsou zveřejněny dva skutečné záznamy: 25s výběr Les a louka a 15s Let nad obcí. Celý původní záznam Les a louka má 120,5 s a zůstává v uživatelových souborech. Názvy lokalit a klientské reference se nesmějí domýšlet.

Nové scény doplníte do JSON; přehrávač automaticky doplní navigaci. Video musí být equirectangular 2:1, MP4/H.264 + AAC, doporučené 3840 × 1920. Aktuální přehrávač z bezpečnostních důvodů přijímá jen videa ze stejného originu. Při pozdějším přechodu na mediální CDN upravte validaci adres a CSP a povolte CORS na médiích. Návštěvníci nemají upload ani administraci.

## Návštěvnické funkce

- Ovládání myší, dotykem, dvěma prsty, šipkami, +/− a Home; mezerník spouští/zastavuje let při zaměření obrazu.
- Pozastavení, časová osa, rychlost, zvuk, výchozí pohled a celá obrazovka (včetně náhradního režimu pro mobilní Safari).
- Sdílení scény, času, směru a zorného úhlu v URL fragmentu; nový pohled se otevírá pozastavený.
- `?embed=1` zobrazí samotný přehrávač s označením Flight360. Dialog poskytuje kód iframe.
- Bez automatického spuštění pohybu a bez externí analytiky či cookies. Video se po spuštění opakuje; při skrytí karty se zastaví.
- Základní režim přehraje ploché panoramatické video, pokud zařízení nepodporuje WebGL nebo potřebnou velikost textury.
- Zřetelné chybové a načítací stavy, opakování pokusu, klávesnice a přístupné dialogy.

Kontaktní tlačítko otevírá e-mail na info@shieldio.cz; web nemá formulář ani předstíraný backend. Veškeré materiály na webu jsou veřejné.

## Lokální kontrola

Z této složky spusťte `python3 -m http.server 8080`. Nepoužívejte file://; galerie se načítá přes fetch. Otestujte přehrávání, otáčení, posun času, sdílený odkaz, embed a mobilní šířku.

## Nasazení

Z kořene repozitáře: `npx wrangler deploy --config wrangler.flight360.jsonc`. Cloudflare build je připojen k větvi main. Měňte pouze `experiments/flight360/`; nepřepisujte ostatní konfigurace Workerů. `_headers` nastavuje CSP, cache a základní bezpečnostní hlavičky; frame-ancestors povoluje vložení veřejné prohlídky do jiných webů.

## Provozní hranice

Tato verze je připravený veřejný statický web, nikoli systém pro placené účty, správu zákazníků, rezervace nebo nahrávání médií. Není tu měřená mapa ani telemetrie. Dlouhé záznamy a více zákaznických lokalit budou vyžadovat samostatné mediální úložiště a navazující správu obsahu. Sdílená orientace je relativní směr záznamu, nikoli zeměpisný azimut.
