# Omluvenky v Learn+

Aktuální implementace je pouze místní návrh. Nevytváří omluvenku v EduPage.
Není implementovaný zápisový endpoint ani uchovávání relace nebo hesla.

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
