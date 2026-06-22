# Orange Fakturácia

Webová aplikácia na správu fakturácie mobilných služieb Orange — prehľad výpisov, výpočet nadlimitov a reporty pre ekonomické oddelenie.

Projekt bol vyvinutý v spolupráci so **Slovenským futbalovým zväzom (SFZ)**, ktorý ho využíva pre správu firemných mobilných paušálov. Aplikácia je uverejnená ako open-source pod licenciou EUPL-1.2 a môže byť nasadená pre ľubovoľnú organizáciu.

## Funkcie

- **Import výpisov** — nahratie `Hromadny_export.xml` z Orange Business portálu, automatické spárovanie čísel a výpočet nadlimitov
- **Databáza osôb** — správa zamestnancov s limitmi na volania
- **Databáza spoločností** — podpora viacerých organizácií / stredísk
- **Report pre ekonomiku** — prehľad nadlimitov s exportom do Excel (`.xlsx`)
- **Analýzy (Prehľad)** — mesačný trend nákladov, náklady po strediskách, opakovaní prekračovatelia; výber obdobia (rok + rozsah mesiacov) cez popover kalendár v hlavičke
- **Komplexný prehľad** — analytický pohľad na náklady za **všetky** spoločnosti naraz (mesačný trend, náklady po spoločnostiach, podiel na celku) pre vyjednávanie množstevných zliav; prístup riadený príznakom na používateľovi (správca automaticky)
- **Správa používateľov** — magic link prihlásenie, role správca/používateľ, pridelenie prístupu k spoločnostiam, príznak „Komplexný prehľad", opätovné odoslanie žiadosti o aktiváciu
- **Mobilná responzivita** — plná podpora mobilných zariadení: hamburger menu, slide-in sidebar, horizontálny scroll tabuliek, pie charty prispôsobené malým obrazovkám

## Stack

- **Frontend/Backend:** Next.js 14 (App Router, TypeScript)
- **Databáza:** MongoDB (Mongoose)
- **Auth:** Passwordless (magic link), JWT v httpOnly cookie, Ecomail.cz na emaily
- **UI:** Tailwind CSS, Recharts, Lucide, CSS custom properties
- **Fonty:** Manrope (400–800) + Instrument Serif — via `next/font/google`
- **Deployment:** Vercel

## Design systém

Aplikácia používa CSS design tokeny — všetky farby sú definované ako `var(--token)` na `<html>` elemente, bez hardcoded hex hodnôt v komponentoch.

### Témy

Téma sa prepína atribútom `data-dir` na `<html>`:

| Hodnota | Téma | Farba akcentu |
|---|---|---|
| `d` | Orange (predvolená) | `#ff7900` |
| `a` | Atrament | `#4f46e5` |
| `b` | Hĺbka | `#0d9488` |
| `c` | Grafit | `#1c1917` |

### Tokeny

| Token | Použitie |
|---|---|
| `--accent` | Primárna farba akcentu |
| `--accent-soft` | Svetlé pozadie akcentu (ikony, badges) |
| `--accent-ink` | Text na `--accent-soft` pozadí |
| `--paper` | Hlavné pozadie stránky |
| `--surface` | Karty, modály, panely |
| `--ink` | Primárny text |
| `--muted` | Sekundárny text |
| `--faint` | Terciárny text, placeholdery |
| `--line` | Oddeľovače, borders |
| `--side-bg` | Sidebar pozadie |
| `--side-fg` | Sidebar text |
| `--side-active-bg` | Aktívna položka v sidebar |
| `--side-active-fg` | Text aktívnej položky |
| `--danger` | Chybové stavy, nadlimity |
| `--radius` | Zaoblenie kariet |

### React Contexts

- **`ThemeContext`** — aktuálna téma (`theme`, `setTheme`), `THEMES` array s hex hodnotami pre Recharts
- **`PeriodContext`** — globálny výber obdobia (`year`, `monthFrom`, `monthTo`, `periodLabel`, `availableYears`)
- **`CompanyContext`** — vybraná spoločnosť (`selectedCn`, `companies`)
- **`AuthContext`** — prihlásený používateľ, rola, logout

## Lokálne spustenie

### Požiadavky

- **Node.js 18+** (odporúčané 20 LTS) a npm
- **MongoDB** — MongoDB Atlas (free tier stačí) alebo lokálna inštancia
- **Ecomail.cz** účet s overenou odosielacou doménou (na magic-link emaily)

> **Poznámka pre forkerov:** `package-lock.json` nie je verzovaný (zámerne — obsahuje neplatný semver z optional platform bindings, ktorý láme `npm install` na Verceli). `npm install` vytvorí čerstvý lockfile lokálne; build je tým pádom plne funkčný, len nie bit-to-bit reprodukovateľný.

### 1. Inštalácia závislostí

```bash
npm install
```

### 2. Nastavenie `.env.local`

```bash
cp .env.local.example .env.local
```

Vyplň premenné v `.env.local`:

| Premenná | Povinná | Popis |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (Atlas alebo lokálny) |
| `JWT_SECRET` | ✅ | Náhodný tajný kľúč — vygeneruj: `openssl rand -base64 32` |
| `ECOMAIL_API_KEY` | ✅ | API kľúč z Ecomail → Nastavenia → API |
| `FROM_EMAIL` | ✅ | Odosielateľ emailov — musí byť z domény **overenej v Ecomail**. Táto adresa sa zároveň použije ako email primárneho správcu pri prvom štarte. |
| `FROM_NAME` | — | Zobrazované meno odosielateľa (predvolené: `Orange Fakturácia`) |
| `REPLY_TO_EMAIL` | — | Adresa pre odpovede — užitočné ak `FROM_EMAIL` je no-reply adresa. Ak nie je nastavená, použije sa `FROM_EMAIL`. |
| `APP_URL` | ✅ | Verejná URL aplikácie bez lomítka (napr. `https://orange.domena.sk`) |
| `PUBLIC_ORG_NAME` | — | Názov organizácie zobrazený v UI a emailoch (predvolené: `Slovenský futbalový zväz`) |

> **Ecomail a doména:** Transaktičné emaily vyžadujú overenú odosielaciu doménu. Overiť ju môžeš v Ecomail → Nastavenia → Odosielacie domény pridaním SPF/DKIM záznamov do DNS. Ak používaš subdoménu (napr. `mail.domena.sk`) ako `FROM_EMAIL`, nastav `REPLY_TO_EMAIL` na svoju skutočnú schránku.

### 3. Spustenie

```bash
npm run dev
```

Otvor `http://localhost:3000` — ak `FROM_EMAIL` nie je nastavená, login stránka zobrazí konfiguračný návod.

## Deployment na Vercel

1. Pushnúť na GitHub
2. Importovať projekt na [vercel.com](https://vercel.com) → **Add New Project**
3. Nastaviť environment variables (viď tabuľka vyššie)
4. Kliknúť **Deploy**

> **IP whitelist:** Vercel používa dynamické IP adresy — v MongoDB Atlas nastav Network Access na `0.0.0.0/0` (Allow Access from Anywhere).

## Prvé prihlásenie

Pri prvom štarte aplikácia automaticky vytvorí konto primárneho správcu s emailom nastaveným v `FROM_EMAIL`. Na login stránke zadaj túto adresu a príde ti magic link.

Ďalší používatelia sa pridávajú cez **Admin → Používatelia → Pozvať**.

## Roadmap a známe obmedzenia

Plánované vylepšenia a známe nedostatky sú v [TODO.md](TODO.md). História zmien je v [CHANGELOG.md](CHANGELOG.md).

## Licencia

[EUPL-1.2](LICENSE) — European Union Public Licence v. 1.2
