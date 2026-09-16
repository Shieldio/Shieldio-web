# Omluvenky v Learn+

Aktuální implementace je pouze místní návrh. Nevytváří omluvenku v EduPage.
Není implementovaný zápisový endpoint ani uchovávání relace nebo hesla.

Volitelná kontrola při připojení načítá prázdný dialog přes pozorovaný
`/timeline/?cmd=creator&akcia=ospravedlnenkaDlg` s prázdným tělem. Zdroj se
nespouští a neukládá; vracejí se pouze pevné názvy polí a booleovské příznaky.
Rozpoznání je heuristika, nikoli ověření ukládacího protokolu nebo oprávnění.
Skutečný účet ještě musí tuto kontrolu spustit. Syntetický test UI a test
`tests/plus-note-profile.cjs` ověřují rozpoznání a neúnik citlivých hodnot.

Adaptér `parseAbsenceNoteDialog` rozpoznává pouze OspravedlnenkaDlg, pevnou
cestu /gcall a povolená pole. Nové gpid/gsh ponechává na serveru.
`buildAbsenceNoteRequest` je čistý serializer, není dostupný přes HTTP a nic
neodesílá. Podporuje zatím jeden den a souvislý rozsah hodin. Vyžaduje explicitně
ověřené hodnoty vedlejších polí; žádná hodnota z uživatelovy přílohy není použita
pro přihlášení. Fixture obsahuje pouze fiktivní identifikátor/token.
Před zapnutím zbývá ověřit reálné Request Data včetně checkboxů, ochranu před
duplicitou a nezávislé ověření záznamu po serverovém potvrzení. ASC_cop=ok samo
o sobě není takovým nezávislým ověřením.

## Ověřeno

- Skutečný formulář školy umožňuje důvod, rozsah dat a vyučovacích hodin.
- Na testovaném studentském účtu je formulář dostupný; nelze zobecnit na všechny účty.
- Lokálně v prohlížeči se syntetickým přihlášením: celé dny, jednotlivé hodiny,
  odmítnutí obráceného pořadí hodin, náhled a odkaz na vybranou školu.
- Důvod se vykresluje přes textContent, bez interpretace HTML.
- Změna vstupů ruší náhled. Odpojení resetuje formulář i návrh.

## Před přímým odesíláním

1. Ověřit skutečný zápisový protokol, parametry a ochranu požadavku, nikoli
   zaměnit učitelské omlouvání docházky s elektronickou omluvenkou studenta.
2. Ověřit oprávnění konkrétního účtu a identitu příjemce.
3. Zobrazit přesný náhled a samostatné potvrzení odeslání.
4. Zamezit dvojímu odeslání; při timeoutu nesmí následovat automatický retry.
5. Ověřit vznik konkrétní omluvenky, ne pouze HTTP 200.
6. Upravit soukromí pro přenos důvodu a uchovávání omluvenky u školy/EduPage.

Žádná skutečná omluvenka nebyla při této práci odeslána. Formulář v EduPage
nebyl vyplněn ani potvrzen. Kopírování může uchovat návrh v systémové schránce;
uživatel je o tom informován na stránce soukromí.
