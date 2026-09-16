# Omluvenky Learn+

- POST `/api/edupage/absence-note`, konkrétní hodiny jednoho dne nebo celé dny (nejvýše 40 kalendářních dnů včetně).
- Potvrzení až uvnitř přihlášeného dashboardu, po náhledu a zopakování hesla.
- Heslo ani relace se neuchovávají. Odeslání provádí nové přihlášení.
- Celé dny posílají periodfrom/periodto prázdné; datefrom/dateto vymezují rozsah. Prázdná volba a čištění hodin při změně rozsahu jsou doloženy nativním dialogem. Zápis vždy jedním požadavkem.
- Vyžaduje jediného studenta v docházce a podporovaný OspravedlnenkaDlg.
- Nové gpid/gsh pouze z nového dialogu, žádný eval, pevná cesta /gcall.
- Serializer doložen uživatelem: prázdná pokročilá pole, nulové checkboxy,
  remove_menu_evidence=0, _LJSL=4096. Testy používají falešné tokeny.

## Duplicity

Před zápisem kontrola existující omluvenky pro každý den, poté atomický Durable Object
claim v HMAC namespace škola/student/den. Uchovává jen stav a čas sedm dnů.
Po claimu žádný retry ani odblokování při timeoutu/chybě. Změna důvodu nebo hodin
neobejde blokaci téhož dne. Doplnění téhož dne musí uživatel řešit v EduPage.
Vícedenní návrh rezervuje všechny dny před jediným zápisem. Při kolizi zůstanou
i již získané rezervace blokované; žádný zápis se neprovede. Vícedenní rezervace
zůstávají pending do expirace (limit počtu subrequestů), bez ukládání obsahu.

Úspěch vyžaduje ASC_cop=ok + dlg.hide správného dialogu a následný GET docházky
s novým sa_note_subId, správným dnem a shodným sanote. Data následné
kontroly musí obsahovat nový záznam pro každý kalendářní den rozsahu; pokud
EduPage např. vynechá víkend, odpověď je konzervativně nejasná, nikoli retry.
Docházková data této
kontroly nepotvrzují samostatně hodiny; ty jsou součástí akceptovaného požadavku.
Odeslání není schválení školou. Nejasný výsledek = kontrola v EduPage, ne retry.

## Konfigurace a ověření

EDUPAGE_NOTES_ENABLED=true, NOTE_SUBMISSIONS SQLite Durable Object (notes-v1),
existující LEARN_SESSION_SECRET a rate limiter. Bez bindingu/secretu fail closed.
POST ani upstream zdroj se nelogují. Odpovědi API no-store.

tests/plus-note-profile.cjs: parser, token isolation, UTF-8, přesný payload.
tests/plus-note-send.cjs: syntetické EduPage, existující záznam, duplicity,
úspěch, timeout, změněný protokol, odmítnuté potvrzení, obnovení guardu.
Při implementaci neposílat žádné skutečné omluvenky. První reálné odeslání
provádí výhradně uživatel pro novou absenci po kontrole náhledu.
