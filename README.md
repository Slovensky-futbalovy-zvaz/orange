# Orange Fakturácia

Webová aplikácia na správu fakturácie mobilných služieb Orange — prehľad výpisov, výpočet nadlimitov a reporty pre ekonomické oddelenie.

Projekt bol vyvinutý v spolupráci so **Slovenským futbalovým zväzom (SFZ)**, ktorý ho využíva pre správu firemných mobilných paušálov. Aplikácia je uverejnená ako open-source pod licenciou EUPL-1.2 a môže byť nasadená pre ľubovoľnú organizáciu.

## Funkcie

- **Import výpisov** — nahratie `Hromadny_export.xml` z Orange Business portálu, automatické spárovanie čísel a výpočet nadlimitov
- **Databáza osôb** — správa zamestnancov s limitmi na volania
- **Databáza spoločností** — podpora viacerých organizácií / stredísk
- **Report pre ekonomiku** — prehľad nadlimitov s exportom do Excel (`.xlsx`)
- **Analýzy** — mesačný trend nákladov, náklady po strediskách, opakovaní prekračovatelia
- **Správa používateľov** — magic link prihlásenie, role správca/používateľ, pridelenie prístupu k spoločnostiam

## Stack

- **Frontend/Backend:** Next.js 14 (App Router, TypeScript)
- **Databáza:** MongoDB (Mongoose)
- **Auth:** Passwordless (magic link), JWT v httpOnly cookie, Ecomail.cz na emaily
- **UI:** Tailwind CSS, Recharts, Lucide
- **Deployment:** Vercel

## Lokálne spustenie

### 1. Inštalácia závislostí

```bash
npm install
```

### 2. Nastavenie `.env.local`

```bash
cp .env.local.example .env.local
```

Vyplň premenné v `.env.local`:

| Premenná | Popis |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Náhodný tajný kľúč (`openssl rand -base64 32`) |
| `ECOMAIL_API_KEY` | API kľúč z Ecomail.cz |
| `FROM_EMAIL` | Emailová adresa odosielateľa |
| `FROM_NAME` | Meno odosielateľa (napr. `Orange Fakturácia`) |
| `APP_URL` | Verejná URL aplikácie (bez lomítka na konci) |

### 3. Spustenie

```bash
npm run dev
```

Otvor `http://localhost:3000` — pri prvom spustení sa zobrazí formulár na vytvorenie správcovského konta.

## Deployment na Vercel

1. Pushuješ na GitHub
2. Importuješ projekt vo [vercel.com](https://vercel.com) → **Add New Project**
3. Nastavíš environment variables (viď tabuľka vyššie)
4. Klikneš **Deploy**

## Prvé prihlásenie

Pri prvom spustení (prázdna databáza) login stránka zobrazí formulár na registráciu prvého správcu. Po vyplnení príde aktivačný email s odkazom.

Ďalší používatelia sa pridávajú cez **Admin → Používatelia → Pozvať**.

## Licencia

[EUPL-1.2](LICENSE) — European Union Public Licence v. 1.2
