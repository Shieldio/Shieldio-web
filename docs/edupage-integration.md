# EduPage Lab integrace

## Stav a hranice technického testu

Na `stage.learn.shieldio.cz/edupage/` běží jednorázový studijní přehled. Ověří přihlášení, ve stejné serverové operaci načte známky a souhrn docházky. Vrátí pouze předmět, hodnotu, datum, typ, váhu a maximum bodů plus agregované počty hodin. Heslo server použije pouze v průběhu jednoho požadavku. Neukládá heslo, cookies ani vytvořenou relaci.

## Architektura

Tok testu je `prohlížeč → POST /api/edupage/probe → EduPage`. Worker povolí jen syntakticky bezpečnou subdoménu `*.edupage.org`, kontroluje origin požadavku a vrací pouze stav a obecnou zprávu. CAPTCHA ani 2FA neobchází.

## Zdroje a míra jistoty

- **OFFICIAL:** veřejné stránky a aplikace EduPage potvrzují existenci funkcí rozvrhu, známek, docházky a školní komunikace. Nebyla nalezena stabilní veřejná dokumentace studentského API pro tento integrační scénář.
- **UNOFFICIAL:** `EdupageAPI/edupage-api` je GPL Python knihovna používající přímé neoficiální endpointy a parsování HTML. Dokumentuje login, session, CAPTCHA/2FA výjimky, známky, předměty, rozvrh, změny, učitele, učebny, oznámení a další moduly.
- **UNOFFICIAL:** `JustAlex0000/Edupage-Extras` je MIT browser extension. Docházku a rozvrh čte z již otevřených přihlášených stránek a deklaruje lokální cache do 15 minut bez sběru credentials.
- **UNOFFICIAL:** `loumadev/EdupageAPI` je Node knihovna se známkami, rozvrhem, úkoly, testy a dalšími objekty; její rozhraní ani `_data` nejsou veřejný kontrakt EduPage.
- **INFERRED:** endpointy, cookies a struktura odpovědí se mohou změnit bez oznámení. Textové známky a školní konfigurace vyžadují explicitní parser a testování na účtu, který uživatel oprávněně poskytne.

## Plánovaná normalizovaná data

Známka nese původní `value`, volitelnou numerickou reprezentaci, váhu, datum a kategorii. Parser přijímá pouze celé číselné známky 1–5; procenta, body, slovní známky a modifikátory jako `2-` svévolně nepřevádí. Vypočítaný vážený průměr je vždy oddělený od oficiálního hodnocení školy.

Docházka nese počet odučených a zameškaných hodin. Limit je uživatelský vstup, nikoli tvrzení školy. Simulace je označena jako projekce.

## Bezpečnost případného skutečného adaptéru

Skutečný adapter musí běžet pouze serverově. Doporučená session: náhodný identifikátor v `Secure; HttpOnly; SameSite=Lax` cookie, krátká životnost, rotace po loginu, CSRF token pro změnové POST požadavky a šifrované serverové uložení session. Credentials použít jen pro vytvoření EduPage session a po úspěchu je zahodit, pokud konkrétní ověřená knihovna nevyžaduje opakovaný login. V takovém případě je nutné samostatně schválit šifrování at rest a retenční dobu.

Logy smějí obsahovat typ operace, dobu, výsledek a cache hit/miss. Nesmějí obsahovat heslo, cookie, session token, známky, absence, jméno ani obsah zpráv. Povinné jsou timeouty, omezení pokusů o login a request rate limiting. CAPTCHA nebo 2FA se nesmí obcházet.

### Kontrola soukromí stage verze

- Přihlášení zůstává jednorázové. Heslo ani EduPage session se neukládají do cookies, KV, databáze, logů ani úložiště prohlížeče.
- Odpověď obsahuje jen předmět, známku, váhu, datum, agregovanou docházku a rozvrh. Jméno, učitelé, spolužáci, komentáře a zprávy se zahazují na serveru.
- Přihlašovací stránka má `noindex`, omezenou CSP, `no-referrer` a nenačítá Google Fonts, analytiku ani reklamu.
- Distribuovaný Cloudflare Rate Limiting omezuje pět pokusů za minutu pro zahashovanou kombinaci klienta, školy a uživatelského jména. Samotné identifikátory nejsou klíčem limitu.
- Integrace je neoficiální. Před přesunem na produkční doménu je stále nutné doplnit provozovatele a kontakt do finálního informačního textu podle skutečného správce služby.

## Cache a odolnost budoucího adaptéru

Rozvrh a suplování: doporučené TTL 2–5 minut. Známky, absence a úkoly: 5–15 minut. Statická metadata předmětů: déle. Cache musí být oddělená podle uživatelské session. Při chybě lze vrátit poslední známá data s `stale: true` a časem synchronizace. Paralelní načtení nesmí vytvořit waterfall; adapter používá omezené paralelní požadavky, timeout a retry s backoffem pouze u bezpečných čtení.

## Feature flags a deployment

`EDUPAGE_ENABLED=true` povolí pouze testovací endpoint. Produkce nemá integraci zapnutou. Stage Worker používá `wrangler.stage.jsonc` a nesdílí jméno produkčního Workeru.

## Známá omezení

Jde o neoficiální a křehkou integraci. Úspěch jednorázového testu ještě nepotvrzuje dostupnost konkrétních datových modulů. Chybí trvalé omezení počtu pokusů napříč instancemi Workeru; před veřejným provozem je nutné přidat Cloudflare Rate Limiting nebo jinou sdílenou ochranu. Podpora 2FA, CAPTCHA, ukládání relace a osobních dat není implementovaná.
