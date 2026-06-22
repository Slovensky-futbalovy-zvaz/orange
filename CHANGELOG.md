# Changelog

Všetky podstatné zmeny sú zaznamenané v tomto súbore.

Formát je inšpirovaný [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Pridané

- **Komplexný prehľad** — nová obrazovka `src/app/complex-overview/page.tsx` s analytickým pohľadom na náklady za **všetky** spoločnosti (ignoruje vyberač spoločnosti). Obsahuje KPI karty, mesačný trend nákladov/nadlimitov, stacked graf nákladov po spoločnostiach po mesiacoch a podiel spoločností na celkových nákladoch (donut + tabuľka s % z celku). Účel: vyjednávanie množstevných zliav a prehľad podielu firiem. **Bez** blokov „Opakovaní prekračovatelia" a „Detail po strediskách".
- **`src/app/api/complex-overview/route.ts`** — agregačné API cez všetky spoločnosti (rok + rozsah mesiacov); prístup len pre Správcu alebo používateľa s príznakom `complexOverview`.
- **Príznak `complexOverview` na používateľovi** (`src/models/User.ts`) — riadi prístup ku Komplexnému prehľadu; Správca ho má vždy. Nastaviteľný cez checkbox v správe používateľov (pozvánka aj editácia).
- **`src/components/PeriodPicker.tsx`** — nový popover vyberač obdobia v hlavičke: navigácia rokov (len roky s dátami), výber rozsahu mesiacov (1. klik začiatok, 2. klik koniec), „Aktuálny mesiac" a „Hotovo" (zmena sa aplikuje až po potvrdení).
- **Znovu odoslať žiadosť o aktiváciu** — v správe používateľov pribudla ikona (pri čakajúcich účtoch) na opätovné odoslanie pozvánky s novým tokenom (`POST /api/admin/users/[id]/resend`).

### Zmenené

- **`src/components/Sidebar.tsx`** — voľbu „Všetky spoločnosti" vo vyberači vidí už len Správca (mýlila bežných používateľov). Pridaná položka menu „Komplexný prehľad" (pre Správcu alebo používateľa s príznakom). Prepínač šablón prerobený na riadok „Šablóna · {názov}" s farebným štvorčekom a rozbaľovacím menu (namiesto štyroch farebných bodiek).
- **`src/contexts/CompanyContext.tsx`** — bežnému používateľovi sa vždy vyberie konkrétna firma (nikdy nezostane na implicitnom „všetky"); výber je role-aware a počká na načítanie auth.
- **`/api/auth/me`, `AuthContext`, `/api/admin/users`** — doplnené pole `complexOverview`.
- **`src/contexts/PeriodContext.tsx`** — doplnené `setPeriod()`, `latestYear`, `latestMonth` pre nový vyberač obdobia.
- **`src/components/AppHeader.tsx`** — staré tri rozbaľovačky obdobia nahradené komponentom `PeriodPicker`; odstránené nefunkčné tlačidlo „Export" (export do Excelu je na obrazovke Osobné).

### Odstránené

- Nepoužívané legacy stránky so slovenskými routami (neboli v menu, duplikovali anglické ekvivalenty): `/analyzy` (≈ `/overview`), `/spolocnost` + `/spolocnost/[month]`, `/osoby` (≈ `/people`), `/report` + `/report/[month]` (≈ `/personal`).
- Stray súbor `jose-6.2.3.tgz` z roota repozitára (balík sa ťahá z npm registry).

### Opravené

- **Magic-link „odkaz vypršal" hneď po doručení** — poštové skenery (napr. Microsoft Safe Links) prednačítavali odkaz cez GET a tým spotrebovali jednorazový token ešte pred kliknutím používateľa. E-mailový odkaz teraz vedie na potvrdzovaciu stránku `/auth/verify`, kde sa token spotrebuje až po kliknutí na „Prihlásiť sa" (POST). GET na `/api/auth/verify` už token nezneplatňuje, len presmeruje (spätná kompatibilita pre staré odkazy). Odstránený duplicitný Mongoose index na `Person.serviceIdentification`.

---

## [2026-06-21] — Preloader, SignalBars, kontrast grafov

### Pridané

- **`src/components/SignalBars.tsx`** — animovaná CSS komponenta (5 stĺpcov rastúcej výšky, staggered delay, farba z `--accent`); veľkosti `sm` / `md` / `lg`
- **`src/components/Preloader.tsx`** — full-screen overlay pri prvom načítaní, fade-out po 700 ms, unmount po 1 100 ms; používa `SignalBars size="lg"`

### Zmenené

- **`src/app/layout.tsx`** — `<Preloader />` vložený do root layoutu (pred `<AppShell>`)
- Všetky inline loading stavy `Načítavam…` nahradené komponentou `<SignalBars>` v 11 súboroch:
  `fees/[month]`, `spolocnost/[month]`, `services/[month]`, `companies`, `people`, `overview`, `osoby`, `personal/[month]`, `analyzy`, `report/[month]`, `AppHeader`
- **`src/app/overview/page.tsx`** — druhá séria grafov (Firemné €): farba zmenená z `#f59e0b` (amber) na `#7c3500` (burnt orange) pre vyšší kontrast voči `--accent`
- **`src/app/analyzy/page.tsx`** — rovnaká zmena farby `#f59e0b` → `#7c3500` pre sériu „Firemné (€)"

---

## [2026-06-20] — Mobilná responzivita

### Pridané

- **`AppShell`** — hamburger tlačidlo v mobilnej hornej lište, slide-in sidebar s backdrop overlay (Tailwind `fixed`/`translate-x` pattern, `lg:static`)
- **`Sidebar`** — nový `onNavigate?: () => void` prop; sidebar sa automaticky zavrie po kliknutí na odkaz v mobilnom zobrazení

### Zmenené

- **`src/components/AppShell.tsx`** — kompletný rewrite: `useState` pre `sidebarOpen`, backdrop `div` s `onClick` na zavretie, mobilná top bar s `Menu` ikonou (Lucide), `<main>` s `p-4 sm:p-6`
- **`src/components/Sidebar.tsx`** — pridaný `SidebarProps` interface, `w-64 h-full` na `<aside>`, `onClick={onNavigate}` na všetkých nav linkoch vrátane admin sekcie
- **`src/app/personal/page.tsx`**
  - filter riadok: summary div `ml-auto` → `w-full sm:w-auto sm:ml-auto flex-wrap` (wrappuje na mobile)
  - export tlačidlo: `ml-auto` → `sm:ml-auto`
  - tabuľka výpisov: wrapper `overflow-x-auto`, `<table>` dostala `min-w-[640px]`
- **`src/app/admin/users/page.tsx`**
  - header: `flex items-center justify-between` → `flex flex-wrap items-start justify-between gap-3`, tlačidlá `flex-shrink-0`
  - tabuľka používateľov: wrapper `overflow-x-auto`, `<table>` dostala `min-w-[600px]`
- **`src/app/fees/page.tsx`** — pie chart sekcia "Top firemné služby":
  - `flex items-center gap-3` → `flex flex-col sm:flex-row items-center gap-4`
  - `<ResponsiveContainer width="50%">` zabalený do `<div className="w-full sm:w-[40%] flex-shrink-0">`, `width` zmenený na `"100%"`
  - legenda `flex-1` dostala navyše `w-full`
- **`src/app/overview/page.tsx`** — rovnaký pie chart fix pre sekciu "Štruktúra firemných poplatkov" (identický pattern ako `fees/page.tsx`); tabuľka "Detail po strediskách" dostala `overflow-x-auto` wrapper a `min-w-[500px]`

---

## [2026-06-19] — Opravy autentifikácie a výberu spoločnosti

### Opravené

- Prihlásený používateľ sa po kliknutí na magic link nepresmeruje na landing page (`fix: prihlásený user už neuvidí landing po kliknutí na magic link`)
- Výber spoločnosti v sidebar rešpektuje rolu a počet firiem pridelených používateľovi (`fix: výber spoločnosti rešpektuje rolu a počet firiem`)
