# Shieldio-web
Official website of Shieldio – a modular STEM platform helping schools teach electronics and programming through intuitive educational hardware.

## Shieldio Learn – deployment

Redakční pravidla a stav obsahu jsou v `learn/CONTENT.md`.

Shieldio Learn je samostatná statická větev v adresáři `learn/`, nasazovaná ze stejného repozitáře jako druhý Cloudflare Worker. Hlavní web používá `wrangler.jsonc`; Learn používá `wrangler.learn.jsonc`. Díky tomu se změny routingu Learn nedotýkají `shieldio.cz`.

### První nasazení

1. V Cloudflare musí být zóna `shieldio.cz` aktivní ve stejném účtu, do kterého je přihlášený Wrangler.
2. Z kořene repozitáře spusťte `npx wrangler deploy --config wrangler.learn.jsonc`.
3. Konfigurace vytvoří Worker `shieldio-learn` a připojí Custom Domain `learn.shieldio.cz`.

Pro zvolený způsob **není potřeba ručně vytvářet DNS záznam**:

- Type: vytváří a spravuje Cloudflare automaticky pro Worker Custom Domain,
- Name/Host: `learn`,
- Target/Value: Worker `shieldio-learn`, nejde o ručně zadávaný CNAME cíl,
- SSL: certifikát vydá Cloudflare automaticky.

Pokud už na `learn.shieldio.cz` existuje A, AAAA nebo CNAME záznam, je nutné jej před přidáním Custom Domain odstranit; Cloudflare Custom Domain nelze připojit přes existující CNAME. Stejného výsledku lze dosáhnout v dashboardu přes **Workers & Pages → shieldio-learn → Settings → Domains & Routes → Add → Custom Domain** a zadáním `learn.shieldio.cz`.

### Ověření

Po nasazení otevřete:

- `https://learn.shieldio.cz/`
- `https://learn.shieldio.cz/maturita/`
- `https://learn.shieldio.cz/maturita/otazka/demo-otazka-01/`

Ověřte stav 200, platný HTTPS certifikát a to, že `https://shieldio.cz/` dál zobrazuje hlavní produktový web. Lokálně lze obsah kontrolovat bez Worker routingu na `http://127.0.0.1:PORT/learn/`; host-based routing se testuje pomocí `npx wrangler dev --config wrangler.learn.jsonc`.
