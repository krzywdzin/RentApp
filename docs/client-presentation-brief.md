# RentApp — Brief do prezentacji klientowi

*Notatki dla Antoniego na spotkanie ~1h z KITEK. Nie folder marketingowy — ściąga do zerknięcia w trakcie rozmowy. Ton koleżeński, konkretny, bez korpo-bullshitu.*

---

## Zanim zaczniesz (5 min przed)

- [ ] Telefon naładowany, mobilka zalogowana, dane testowe w bazie
- [ ] Web panel otwarty na drugiej zakładce, zalogowany jako admin
- [ ] Przykładowy klient + pojazd + wolny termin gotowy do zademonstrowania „od zera do umowy”
- [ ] Karta SIM / dostęp do telefonu do pokazania, że SMS faktycznie przychodzi
- [ ] Mail testowy do pokazania gotowej wiadomości z PDF
- [ ] Szklanka wody obok

---

## Pierwsze 5 minut — co powiedzieć na start

Prosty otwieracz, nie przemowa:

> „Pokażę Wam, co już działa i w jaki sposób pracownik będzie z tego korzystał na co dzień. Podzielę to na cztery części: najpierw web — tam siedzi właściciel i biuro, potem telefon pracownika na punkcie wydania, potem jak wygląda umowa i komunikacja z klientem, a na końcu zwrot. Jak coś będzie niejasne — przerywajcie od razu, nie zbieramy pytań na koniec.”

Trzy rzeczy, które warto rzucić *zanim* zaczniesz klikać:

1. **To jest gotowe do uruchomienia** — nie prototyp, nie demo, działający system.
2. **Jedna baza, dwa interfejsy** — web dla biura, mobile dla punktu wydania. Ten sam login, te same dane.
3. **Świadomie zostawiliśmy kilka rzeczy ręcznych** — tam, gdzie automat byłby pozorem bezpieczeństwa. Wytłumaczę przy okazji.

---

## Plan na godzinę (ramowy)

| Minuty | Część | Cel |
|--------|-------|-----|
| 0–5 | Wstęp + co zobaczą | Ustawienie oczekiwań |
| 5–20 | **Web** — klienci, pojazdy, kalendarz, wynajmy, rozliczenia | Pokazać „biuro” |
| 20–40 | **Mobile** — nowy najem od zera: OCR, zdjęcia, podpisy, drugi kierowca | Pokazać punkt wydania |
| 40–50 | **Dokumenty i komunikacja** — PDF, hasło, SMS, mail, portal klienta | Pokazać efekt dla klienta końcowego |
| 50–55 | **Zwrot** — protokół, VAT reminder | Domknąć cykl |
| 55–60 | Pytania / ustalenia dalszych kroków | — |

*Gdy klient zboczy na bok — nie blokuj, to są płatne pytania. Wróć miękko: „dokładnie do tego dojdziemy za chwilę”.*

---

## Część 1 — Web (biuro)

**Kolejność klikania:**

1. **Klienci** — dodawanie, pola firmowe (NIP, VAT, adres), szukanie po nazwisku/PESEL
2. **Pojazdy i klasy pojazdów** — jeden pojazd, potem pokazać że klasa grupuje (np. „kompakt”, „SUV”)
3. **Kalendarz** — widok miesiąc/tydzień, konflikty, wolne terminy
4. **Nowy wynajem z poziomu web** (krótko — główny przepływ jest na mobile)
5. **Lista wynajmów** — statusy, filtrowanie, szczegóły jednego wynajmu
6. **Rozliczenia** — co się liczy, jak wygląda podsumowanie
7. **Użytkownicy** — „dodajecie pracowników sami, admin to Wy”

**Co warto podkreślić:**

- Jedno konto admina = właściciel firmy. Pracowników dodaje admin z poziomu web.
- Kalendarz jest „mózgiem” — po nim najwygodniej planować.
- Rozliczenia widać od razu, nie trzeba eksportu do Excela, żeby zobaczyć co kto oddał.

---

## Część 2 — Mobile (punkt wydania)

**Opowieść, nie funkcje.** Pokazujesz historyjkę: przychodzi klient, pracownik robi z nim umowę w 5 minut.

**Kolejność:**

1. Logowanie pracownika
2. „Nowy najem” — wybór klienta albo dodanie nowego
3. **OCR dowodu osobistego** — klikasz, skanujesz, pola się wypełniają
4. **OCR prawa jazdy** — to samo, ale pokazujesz że łapie datę ważności, kategorię, nr blankietu, organ wydający
5. **Zdjęcia pojazdu przed wydaniem** — 4–6 zdjęć, wszystkie trafiają do PDF
6. **Drugi kierowca** (opcjonalnie) — pokaż jednym kliknięciem
7. **Podpisy** — klienta + pracownika, na ekranie
8. Zatwierdzenie → „właśnie wystartowała umowa”

**Co warto powiedzieć w trakcie:**

- „To cały proces wydania na punkcie — od wejścia klienta do wyjścia z autem robi się w 5 minut.”
- „Pracownik nic nie przepisuje ręcznie z dowodu — OCR zrobił robotę.”
- „Podpisy są na ekranie, umowa nie wymaga drukarki.”

---

## Część 3 — Dokumenty i komunikacja

Pokazujesz **efekt końcowy** — jak to wygląda dla klienta końcowego.

**Kolejność:**

1. Otwórz świeżo wygenerowany PDF umowy → pokaż że jest **zaszyfrowany hasłem**
2. Powiedz: *„hasłem jest numer rejestracyjny pojazdu — klient ma go na umowie, na kluczach i w SMS-ie”*
3. Pokaż wysłany **mail** — temat: `Umowa [NR-SPRAWY] — [NR-REJ]`, w załączniku PDF
4. Pokaż **SMS** z hasłem (numer rejestracyjny)
5. Portal klienta — link ważny 30 dni, bez logowania hasłem

**Dlaczego to jest dobre (powiedz wprost):**

- PDF jest zaszyfrowany — jak ktoś przechwyci mail, nie otworzy bez hasła.
- Hasło idzie **innym kanałem** (SMS-em), nie w tym samym mailu.
- Temat maila od razu identyfikuje sprawę — biuro nie musi szukać.
- Klient nie musi zakładać konta, żeby pobrać umowę — ma link w mailu.

**Przy okazji SMS-a o przedłużeniu** — wspomnij że system potrafi przypomnieć klientowi o terminie zwrotu. Nie demoj, tylko zasygnalizuj („wysyłamy też przypomnienia SMS-em, pokażę jak chcecie”).

---

## Część 4 — Zwrot

Domykasz pętlę. Krótko:

1. Lista aktywnych wynajmów → wybierasz ten do zwrotu
2. Zdjęcia po zwrocie
3. **Modal przypomnienia o VAT** — „zanim zatwierdzisz, pamiętaj o fakturze VAT jeśli klient firmowy”
4. Protokół zwrotu — PDF, podpis, zamknięcie sprawy

**Co powiedzieć:**

> „Ten modal o VAT to nie gadżet — to zabezpieczenie przed zapomnieniem, bo najczęstszy błąd księgowy to właśnie brak faktury przy zwrocie firmowym. System pilnuje pracownika.”

---

## Jak mówić o OCR

**Nie obiecuj 100%.** OCR jest świetny, ale nie magia — lepiej powiedzieć prawdę.

Formuła:

> „OCR rozpoznaje dane z dowodu i prawa jazdy — w 90%+ przypadków pracownik tylko zatwierdza, nic nie przepisuje. Gdy zdjęcie jest krzywe albo dokument zniszczony, pracownik poprawia ręcznie te 1–2 pola. To dalej jest dużo szybsze niż przepisywanie wszystkiego od zera.”

**Czego nie mów:**

- „Zawsze rozpoznaje” — nie zawsze. Będą edge case'y i nie ma sensu kłamać.
- „To jest AI najnowszej generacji” — klient tego nie ogarnie i tylko podniesie oczekiwania.

**Co dodać, jeśli zapytają o dokładność:**

> „Mamy trzy poziomy — najpierw model AI (Gemini od Google), potem uproszczony odczyt tekstowy, a na końcu lokalny parser. System sam przechodzi na niższy poziom jak wyższy nie działa. Pracownik widzi wynik i może poprawić przed zatwierdzeniem.”

---

## Jak mówić o CEPiK

**To jest kluczowy moment — nie ściemniaj.** Klient może myśleć, że macie pełną integrację państwową. Nie macie i to jest OK — wytłumacz dlaczego.

Formuła:

> „CEPiK u nas to na dzień dzisiejszy **checkpoint operacyjny, nie integracja z bazą państwową**. Dostęp do prawdziwego API CEPiK dla przewoźników wymaga oficjalnego wniosku do Ministerstwa Cyfryzacji — to jest osobny proces po Waszej stronie. Do czasu jego uzyskania system zapisuje fakt, że pracownik zweryfikował dokument — jest ślad audytowy, kto i kiedy sprawdził. Gdy uzyskacie dostęp CEPiK Carriers API, podepniemy prawdziwe sprawdzenie bez zmiany interfejsu dla pracownika.”

**Kluczowe punkty:**

- Mówisz **„shortcut operacyjny”** lub **„manualny checkpoint”** — nie „integracja”.
- Nie kłamiesz, że to państwowa weryfikacja.
- Pokazujesz ścieżkę w przód (można podłączyć później).
- Wspominasz audyt — admin widzi kto i kiedy sprawdził.

**Jeśli klient zapyta „czy to bezpieczne”:**

> „Tak samo jak dzisiaj, gdy pracownik patrzy na prawo jazdy klienta przy ladzie. Różnica jest taka, że u nas to jest zapisane w systemie z imieniem pracownika, datą i godziną.”

---

## Jak mówić o PDF, mailu, SMS i haśle

Trzy zdania, które warto zapamiętać:

1. **„PDF umowy jest zaszyfrowany — klient dostaje go mailem, ale hasło osobnym SMS-em.”**
2. **„Hasłem jest numer rejestracyjny auta — proste do zapamiętania, nie wymaga menedżera haseł.”**
3. **„Temat maila to numer sprawy i numer rejestracyjny — księgowa nie szuka po klientach, tylko po sprawie.”**

**Argumenty „dlaczego tak, a nie inaczej”:**

- **Dlaczego SMS-em a nie mailem?** — bo gdyby haker przechwycił skrzynkę klienta, miałby i PDF i hasło. Rozdzielamy kanały.
- **Dlaczego numer rejestracyjny?** — bo klient go widzi za każdym razem, nie zapomni. Menedżer haseł dla umowy byłby nadmiarowy.
- **Dlaczego portal klienta?** — żeby klient nie musiał kopać w mailach za 3 miesiące, gdy potrzebuje umowy do ubezpieczyciela.

---

## Najmocniejsze argumenty biznesowe

Jeśli klient zapyta „co to nam daje” — te cztery rzeczy są najtwardsze:

### 1. Skrócenie obsługi klienta na punkcie
Z 20–30 minut (papier + przepisywanie) na **5–7 minut** (OCR + podpisy na ekranie). Przy kilku wydaniach dziennie to oszczędność godzin pracy w tygodniu.

### 2. Koniec drukarki na punkcie
Umowy są elektroniczne, podpisy na ekranie, PDF leci mailem. Punkt wydania nie potrzebuje papieru, tonera ani archiwum segregatorów.

### 3. Ślad audytowy zamiast karteczek
Kto wydał auto, kiedy, komu, z jakimi zdjęciami. Gdy klient zwróci auto porysowane i będzie się spierał — macie zdjęcia z dnia wydania z podpisem obu stron.

### 4. Klient końcowy dostaje dokumenty od razu
Mail z umową w ciągu 1 minuty od podpisania. Brak „odezwę się jutro z umową”. Dla klientów B2B to wygląda profesjonalnie.

---

## Czego NIE mówić / czego nie robić

**NIE mów:**

- ❌ „CEPiK jest zintegrowany” — nie jest. To checkpoint operacyjny.
- ❌ „OCR działa w 100%” — nie działa. Około 90–95% na dobrych zdjęciach.
- ❌ „Wszystko się dzieje automatycznie” — niektóre rzeczy są świadomie ręczne.
- ❌ „To jest najlepszy system na rynku” — nie wiesz, klient nie lubi pustych superlatyw.
- ❌ „Dodamy wszystko co chcecie” — nie obiecuj poza zakresem.

**NIE rób:**

- ❌ Nie demonstruj funkcji, których sam jeszcze dziś rano nie sprawdziłeś.
- ❌ Nie pokazuj bazy danych ani kodu — nawet jak klient prosi.
- ❌ Nie otwieraj konsoli deweloperskiej na oczach klienta.
- ❌ Nie mów o bugach, które akurat naprawiasz.
- ❌ Nie wchodź w technologię głębiej niż „Gemini od Google robi OCR, reszta to standardowe technologie webowe”.

**Co mówić, gdy klient drąży technicznie:**

> „Wolę nie wchodzić w szczegóły techniczne tu przy kawie, bo to jest kilka godzin dyskusji. Dla Was ważne jest, że to działa, jest utrzymywalne i można rozwijać. Jak chcecie, robimy osobne spotkanie z dokumentacją techniczną.”

---

## Mini-skrypty — gotowe zdania do wyciągnięcia z rękawa

### Gdy klient pyta „co jeśli nie mamy zasięgu na punkcie”
> „System wymaga internetu w momencie podpisania i wysyłki. Zasięg LTE wystarczy — nie potrzeba światłowodu. Na kompletny offline byśmy musieli wrócić do rozmowy, bo to inny projekt.”

### Gdy klient pyta „czy dane są bezpieczne”
> „PESEL i dane z dowodu są szyfrowane w bazie — nawet gdyby ktoś wykradł bazę, bez klucza szyfrującego to są śmieci. PDF-y umów są zaszyfrowane hasłem. Hasła do kont admina/pracowników są argon2 — standard dla banków.”

### Gdy klient pyta „co jeśli zginie Wam wsparcie”
> „Kod jest Wasz, dokumentacja jest w repozytorium, infrastruktura (baza, storage) jest na standardowych dostawcach. Każdy kompetentny deweloper Node/React to przejmie — to nie jest egzotyczny stack.”

### Gdy klient pyta „ile to kosztuje utrzymania miesięcznie”
> „To zależy od obciążenia, ale przy normalnym ruchu wypożyczalni to rząd kilkuset złotych miesięcznie za infrastrukturę — hosting, baza, SMS-y, OCR. Konkretny rachunek zrobimy po pierwszym miesiącu produkcyjnym.”

### Gdy klient mówi „to nie tak miało wyglądać”
> „Dobra, powiedzcie co konkretnie byście zmienili — zapiszę i wracam z konkretną wyceną zmiany. Nie ma co dyskutować na sucho.”

### Gdy klient chce „jeszcze jedną rzecz za darmo”
> „Rozumiem że to się wydaje małe, ale każda taka rzecz to 2–5 dni roboczych. Dopisuję na listę i wrócę z wyceną — wtedy zdecydujecie.”

### Gdy klient chwali
> „Dzięki. To była robota kilku miesięcy, cieszę się że widać. Co by Wam się teraz najbardziej przydało w następnym kroku?”

---

## Pytania, których się spodziewać

- **„Co z fakturami?”** → rozliczenia są w systemie, ale pełny moduł fakturowy to osobny temat. Dzisiaj VAT reminder + dane firmy na umowie.
- **„Czy działa na telefonie szefa”?** → web panel działa na każdej przeglądarce. Mobile jest natywna apka (Expo).
- **„Czy dodacie integrację z [X]”?** → „zapiszę, wrócę z wyceną”. Nigdy od razu „tak”.
- **„Kiedy dostaniemy apkę w sklepie”?** → to osobny temat deploymentu, wrócimy po dzisiejszej akceptacji UX.
- **„Czy klient może sobie sam zarezerwować”?** → nie w tej wersji. Portal klienta jest tylko do pobrania dokumentów. Samoobsługa to osobny projekt.
- **„Co z prawem jazdy kategorii C, motocyklami, przyczepami”?** → OCR czyta kategorię, reszta to konfiguracja klas pojazdów. Pokażemy jak będziecie dodawać.

---

## Zamknięcie spotkania

Prosta formuła:

> „To co pokazałem, jest gotowe do uruchomienia. Następne kroki z mojej strony to [konkret 1–2 rzeczy]. Z Waszej strony potrzebuję [konkret — np. decyzja o domenie, dostęp do CEPiK, dane firmy do umowy]. Dajmy sobie tydzień i spotykamy się podsumować. OK?”

Poproś o jedną decyzję do końca spotkania — najlepiej „kiedy ruszamy produkcyjnie”. Nawet miękkie „w ciągu 2 tygodni” wystarczy — ma być ruch.

---

## 10 punktów do zapamiętania (ściąga końcowa)

1. **Mów prosto.** Klient to rodzina, nie zarząd funduszu. Bez buzzwordów.
2. **Web to biuro, mobile to punkt wydania.** Jedna baza, dwa interfejsy.
3. **OCR nie jest magią** — 90%+, pracownik dokleja brakujące. Nie obiecuj 100%.
4. **CEPiK to checkpoint operacyjny**, nie integracja państwowa. Mów prawdę.
5. **PDF zaszyfrowany, hasło SMS-em osobnym kanałem.** Hasło = numer rejestracyjny.
6. **Temat maila = nr sprawy + nr rej.** Biuro nie szuka, otwiera.
7. **Portal klienta** — bez hasła, link 30 dni, do pobrania dokumentów.
8. **VAT reminder przy zwrocie** — zabezpieczenie przed pomyłką księgową.
9. **Nie pokazuj kodu, konsoli, bazy.** Nie odpowiadaj na pytania techniczne głębiej niż musisz.
10. **Wyjdź z jedną decyzją.** Najlepiej „kiedy ruszamy produkcyjnie”.

---

*Pracuje się miękko, mówi konkretnie, demonstruje na przygotowanych danych. Klient to rodzina — ale spotkanie to spotkanie, chcesz wyjść z decyzją.*
