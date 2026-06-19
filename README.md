# Orange Výpisy — SFZ

Webová aplikácia na správu mesačných výpisov Orange, výpočet nadlimitov a reporty pre ekonomické oddelenie.

## Funkcie

- **Databáza osôb** — CRUD + import z Excel (Zoznam osob mobily.xlsx)
- **Import XML** — nahratie `Hromadny_export.xml` z Orange portálu, automatické spárovanie čísel a výpočet nadlimitov
- **Report pre ekonomiku** — tabuľka nadlimitov s exportom do Excel (`.xlsx`)
- **Analýzy** — mesačný trend nákladov, náklady po strediskách, opakovní prekračovatelia

## Stack

- **Frontend/Backend:** Next.js 14 (App Router, TypeScript)
- **Databáza:** MongoDB (Mongoose)
- **Deployment:** Vercel
- **UI:** Tailwind CSS, Recharts, Lucide

---

## Lokálne spustenie

### 1. Inštalácia závislostí

```bash
cd orange-vypisy
npm install
```

### 2. Nastavenie `.env.local`

```bash
cp .env.local.example .env.local
```

Otvor `.env.local` a nastav:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/orange-vypisy
```

### 3. Spustenie

```bash
npm run dev
```

Otvor `http://localhost:3000`

---

## Deployment na Vercel

### 1. Push na GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tvoj-org/orange-vypisy.git
git push -u origin main
```

### 2. Import do Vercel

1. Otvor [vercel.com](https://vercel.com) → **Add New Project**
2. Vyber tvoj GitHub repozitár
3. V sekcii **Environment Variables** pridaj:
   - `MONGODB_URI` = tvoj MongoDB connection string
4. Klikni **Deploy**

### 3. Vlastná doména (orange.futbalsfz.sk)

1. V Vercel projekte → **Settings → Domains**
2. Pridaj `orange.futbalsfz.sk`
3. V DNS nastaveniach futbalsfz.sk pridaj CNAME záznam:
   - Name: `orange`
   - Value: `cname.vercel-dns.com`

---

## Prvé kroky po deploymente

### 1. Import osôb z Excel

1. Otvor **Osoby** → **Import Excel**
2. Vyber súbor `Zoznam osob mobily.xlsx`
3. Systém importuje všetky osoby s ich limitmi

### 2. Mesačný import výpisu

1. Z Orange portálu stiahni **Hromadný export** (XML)
2. Otvor **Import výpisu**
3. Nahraj XML súbor
4. Systém automaticky:
   - Spáruje telefónne čísla s databázou osôb
   - Vypočíta nadlimit pre každú osobu: `max(0, celková_cena - limit)`
   - Uloží výsledky do histórie

### 3. Export pre ekonomiku

1. Otvor **Report → [mesiac]**
2. Prepni filter na **Len nadlimity**
3. Klikni **Export Excel**
4. Excel súbor obsahuje 2 listy:
   - **Nadlimity** — zoznam osôb s nadlimitmi a rozpisom položiek
   - **Sumarizácia** — náklady po strediskách

---

## Štruktúra projektu

```
src/
├── app/
│   ├── api/
│   │   ├── persons/          # CRUD API pre osoby
│   │   ├── import/           # XML import
│   │   ├── reports/[month]/  # Report + Excel export
│   │   └── analytics/        # Analýzy
│   ├── osoby/                # Správa osôb
│   ├── import/               # Import výpisu
│   ├── report/               # Reporty
│   └── analyzy/              # Analýzy a grafy
├── models/
│   ├── Person.ts             # Model osoby
│   ├── Invoice.ts            # Model faktúry (mesačné záznamy)
│   └── MonthlyImport.ts      # Model mesačného importu
├── lib/
│   └── mongodb.ts            # MongoDB pripojenie
└── components/
    └── Sidebar.tsx           # Navigácia
```

## Formát XML

Aplikácia očakáva formát **Hromadný export** z Orange Business portálu (`MASS-EXPORT`).
Každý `<invoice>` element obsahuje:
- `phone-number` — telefónne číslo
- `user-name` — meno v Orange systéme
- `price-without-vat` — celková cena bez DPH za mesiac
- `<invoice-details>` — rozpis položiek

## Výpočet nadlimitu

```
nadlimit = max(0, price-without-vat - Limit_na_volania)
```

Ak číslo nie je v databáze osôb, nadlimit = 0 a záznám je označený ako "Nespárované".
