# Shieldio Flight360 – veřejná galerie letů

Samostatné responzivní demo 360° video přehrávače s kurátorským výběrem videí. **Návštěvníci na web nenahrávají soubory.** Můžou se rozhlížet myší, dotykem nebo šipkami; zoomovat; zastavit video; přepínat ukázky; posouvat čas; změnit rychlost a přejít na celou obrazovku. Videa se přehrávají ve smyčce. Pokud prohlížeč blokuje autoplay se zvukem, návštěvník klepne na Přehrát.

## Přidání videa správcem

Do `videos.json` přidejte položky, např.:

```json
[
  {
    "title": "Let nad krajinou",
    "description": "360° záznam z DJI dronu",
    "url": "https://media.example.org/flight360/krajina-360.mp4"
  }
]
```

Adresa musí vést na veřejně dostupné **equirectangular video 2:1**, ne reframovaný výřez. Pro veřejné nasazení 8K videí je vhodné komprimované MP4 H.264/H.265 dle podpory prohlížečů, případně adaptivní stream v další verzi. Pokud je video na jiné doméně, server musí povolit CORS, protože video slouží jako WebGL textura. V GitHubu zatím není nahrané žádné reálné video: `videos.json` obsahuje prázdný seznam a viewer ukazuje pouze ilustrační panorama.

## Nasazení

Repozitář obsahuje samostatnou konfiguraci `wrangler.flight360.jsonc`. Po schválení a přípravě domény `flight360.shieldio.cz` v Cloudflare lze nasadit z kořene:

```sh
npx wrangler deploy --config wrangler.flight360.jsonc
```

Konfigurace se nedotýká hlavního webu ani projektů Learn/Light. Samotný commit ani merge automaticky nezaručují, že web běží — vyžaduje Cloudflare deploy. Alternativní doména `flight360.io.cz` by vyžadovala kontrolu vlastnictví a DNS.

## Stav

Implementace je zatím prototyp; bez skutečného 360° videa a testu v prohlížeči nelze potvrdit produkční kvalitu. Nejde o volný 3D let, pouze změnu úhlu pohledu během skutečně natočené trasy. Telemetrie/GPS chybí. Three.js se načítá z CDN.
