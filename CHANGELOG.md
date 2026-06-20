# Changelog

Všetky podstatné zmeny sú zaznamenané v tomto súbore.

Formát je inšpirovaný [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
