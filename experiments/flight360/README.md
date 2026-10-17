# Flight360

Samostatný statický web a interaktivní 360° prohlídky na https://flight360.shieldio.cz. Projekt Shieldio; vlastní CSS a žádné externí JS knihovny ani fonty.

## Obsah a scény

Galerie je v `videos.json`. Každá položka má stabilní unikátní `id`, `title`, `description`, `url`, volitelný `subtitle`, `location`, `category`, délku `duration` v sekundách a `initialView: {yaw, pitch, fov}` ve stupních. Aktuálně jsou zveřejněny dva skutečné záznamy: celý 120,5s záznam Mezi Štítnou a Popovem (les a louka) z R2 a 15s Štítná · Záhumení. Lokality potvrdil majitel. Názvy lokalit a klientské reference se nesmějí domýšlet.

Nové scény doplníte do JSON; přehrávač automaticky doplní navigaci. Video musí být equirectangular 2:1, MP4/H.264 + AAC, doporučené 3840 × 1920. Přehrávač přijímá videa ze stejného originu a z https://flight360-media.shieldio.cz. Doména je výslovně povolená ve validaci i CSP. R2 bucket `flight360-media` používá Standard storage a CORS z `r2-cors.json`; HTML video má `crossorigin="anonymous"` kvůli WebGL. Návštěvníci nemají upload ani administraci.

## Návštěvnické funkce

- Ovládání myší, dotykem, dvěma prsty, šipkami, +/− a Home; mezerník spouští/zastavuje let při zaměření obrazu. Přiblížení je gestem nebo kolečkem, bez samostatného posuvníku. Číselný směr pohledu se návštěvníkům nezobrazuje; ve sdílených odkazech se stále zachovává.
- Pozastavení, časová osa, posuvník rychlosti přehrávání 0,5–1,5×, zvuk, výchozí pohled a celá obrazovka (včetně náhradního režimu pro mobilní Safari).
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

Tato verze je připravený veřejný statický web, nikoli systém pro placené účty, správu zákazníků, rezervace nebo nahrávání médií. Není tu měřená mapa ani telemetrie. Dlouhé záznamy jsou v R2; správa více zákaznických lokalit bude vyžadovat navazující správu obsahu. Sdílená orientace je relativní směr záznamu, nikoli zeměpisný azimut.

## Dlouhá videa v R2

Celý let: `https://flight360-media.shieldio.cz/360%20free/les-a-louka-cely-let.mp4` (212 403 781 B, 3840 × 1920, H.264/AAC, faststart). MP4 se načítá přes HTTP Range podle přehrávání a posunu; nejde o adaptivní HLS. Další videa exportujte s `-movflags +faststart`, nahrajte do tohoto bucketu a doplňte URL do `videos.json`. Ve jménech preferujte pomlčky, mezery v URL kódujte jako `%20`. Velká média neukládejte do GitHubu ani mezi statické assety Workeru. Při náhradě videa používejte nový název souboru kvůli cache. CORS origins jsou omezené na produkční web a jeho workers.dev adresu; veřejné soubory může kdokoli stáhnout.
