# Luxmaxing
Samostatný český statický web v adresáři luxmaxing/.
Worker: shieldio-luxmaxing. Vlastní doména: luxmaxing.shieldio.cz.

## Nasazení
Push na main spouští .github/workflows/deploy-luxmaxing.yml.
Repository secrets:
- CLOUDFLARE_API_TOKEN: token s Workers Scripts Edit a oprávněními potřebnými pro Custom Domains (Zone Read, DNS Edit) pro zónu shieldio.cz.
- CLOUDFLARE_ACCOUNT_ID: ID Cloudflare účtu, který vlastní aktivní zónu shieldio.cz.
Token neukládejte do repozitáře.
Alternativa z přihlášeného lokálního prostředí:
npx wrangler deploy --config wrangler.luxmaxing.jsonc

Cloudflare vytvoří Custom Domain i DNS a TLS certifikát. Existující kolidující DNS záznam je potřeba nejprve vyřešit.
Po nasazení ověřte https://luxmaxing.shieldio.cz/ a stažení pruvodce.txt.
E-mailový odběr zatím není aktivní; stránka to uvádí. Žádné osobní údaje nesbírá.
Vzhled je izolovaný od společného CSS a web nemění stávající jazykové klíče.
