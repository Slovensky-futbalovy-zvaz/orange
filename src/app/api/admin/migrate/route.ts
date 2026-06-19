export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// GET /api/admin/migrate
// Jednorazová migrácia starých názvov polí na nové
// Spustiť iba raz! Následné spustenia sú bezpečné (nepoškodzujú dáta).
export async function GET() {
  try {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return NextResponse.json({ error: "DB nie je pripojená" }, { status: 500 });

  // Diagnostika: zoznam kolekcií a počty dokumentov
  const collections = await db.listCollections().toArray();
  const colNames = collections.map((c) => c.name);

  const results: Record<string, unknown> = { collections: colNames };

  // ── 0. Seed spoločností (upsert — bezpečné opakovanie)
  {
    const col = db.collection("companies");
    const companies = [
      { cn: "0252080007", companyName: "Slovenský futbalový zväz" },
      { cn: "0252219878", companyName: "SFZ Marketing, s. r. o." },
    ];
    for (const c of companies) {
      await col.updateOne({ cn: c.cn }, { $set: c }, { upsert: true });
    }
    results.companiesSeeded = companies.length;
  }

  // ── 1. Person: cislo → serviceIdentification, meno → personName,
  //              stredisko → department, typProfilu → profileType,
  //              limitNaVolania → monthlyServiceLimit, aktivny → personActive
  {
    const col = db.collection("people");

    // Krok A: zmaž staré indexy ktoré by blokovali premenovanie
    const oldIndexes = ["cislo_1", "meno_1", "typProfilu_1", "stredisko_1", "limitNaVolania_1", "aktivny_1"];
    for (const idx of oldIndexes) {
      try { await col.dropIndex(idx); } catch { /* index neexistuje, OK */ }
    }

    // Krok B: premenuj zo starých polí
    const r = await col.updateMany(
      { $or: [{ cislo: { $exists: true } }, { meno: { $exists: true } }, { aktivny: { $exists: true } }] },
      {
        $rename: {
          cislo: "serviceIdentification",
          meno: "personName",
          stredisko: "department",
          typProfilu: "profileType",
          limitNaVolania: "monthlyServiceLimit",
          aktivny: "personActive",
        },
      }
    );

    // Krok C: premenuj "name" → "personName" (ak bola predchádzajúca migrácia na "name")
    await col.updateMany(
      { name: { $exists: true }, personName: { $exists: false } },
      { $rename: { name: "personName" } }
    );

    results.persons = { matched: r.matchedCount, modified: r.modifiedCount };
  }

  // ── 2. Invoice: mesiac split + field renames
  //   mesiac "2026-05" → invoiceYear "2026" + invoiceMonth "05"
  //   cislo → serviceIdentification, personMeno → personName,
  //   typProfilu → profileType, stredisko → department,
  //   limitNaVolania → monthlyServiceLimit, nadlimit → overTheLimit
  {
    const col = db.collection("invoices");

    // Zmaž starý unique index (bez cn) aby nový {cn,year,month,serviceId} mohol byť vytvorený
    try { await col.dropIndex("invoiceYear_1_invoiceMonth_1_serviceIdentification_1"); } catch { /* OK */ }
    try { await col.dropIndex("mesiac_1_cislo_1"); } catch { /* OK */ }
    // Nastav cn="" pre záznamy kde chýba
    await col.updateMany({ cn: { $exists: false } }, { $set: { cn: "" } });

    // Step A: rename simple fields
    await col.updateMany(
      { cislo: { $exists: true } },
      {
        $rename: {
          cislo: "serviceIdentification",
          personMeno: "personName",
          typProfilu: "profileType",
          stredisko: "department",
          limitNaVolania: "monthlyServiceLimit",
          nadlimit: "overTheLimit",
        },
      }
    );

    // Step B: split mesiac "2026-05" → invoiceYear + invoiceMonth
    const toSplit = await col.find({ mesiac: { $exists: true } }).toArray();
    let splitCount = 0;
    for (const doc of toSplit) {
      const parts = String(doc.mesiac).split("-");
      if (parts.length === 2) {
        await col.updateOne(
          { _id: doc._id },
          {
            $set: { invoiceYear: parts[0], invoiceMonth: parts[1] },
            $unset: { mesiac: "" },
          }
        );
        splitCount++;
      }
    }
    results.invoices = {
      simpleRenames: (await col.estimatedDocumentCount()),
      mesiacSplit: splitCount,
    };
  }

  // ── 3. MonthlyImport: mesiac split + priradenie cn + oprava indexu
  {
    const col = db.collection("monthlyimports");
    // Zmaž starý unique index (bez cn) aby nový {cn,year,month} mohol byť vytvorený
    try { await col.dropIndex("invoiceYear_1_invoiceMonth_1"); } catch { /* neexistuje, OK */ }
    try { await col.dropIndex("mesiac_1"); } catch { /* neexistuje, OK */ }
    // Nastav cn="" pre záznamy kde chýba
    await col.updateMany({ cn: { $exists: false } }, { $set: { cn: "" } });
    const toSplit = await col.find({ mesiac: { $exists: true } }).toArray();
    let splitCount = 0;
    for (const doc of toSplit) {
      const parts = String(doc.mesiac).split("-");
      if (parts.length === 2) {
        await col.updateOne(
          { _id: doc._id },
          {
            $set: { invoiceYear: parts[0], invoiceMonth: parts[1] },
            $unset: { mesiac: "" },
          }
        );
        splitCount++;
      }
    }
    results.monthlyImports = { mesiacSplit: splitCount };
  }

  // ── 4. CompanyInvoice: mesiac split
  {
    const col = db.collection("companyinvoices");
    const toSplit = await col.find({ mesiac: { $exists: true } }).toArray();
    let splitCount = 0;
    for (const doc of toSplit) {
      const parts = String(doc.mesiac).split("-");
      if (parts.length === 2) {
        await col.updateOne(
          { _id: doc._id },
          {
            $set: { invoiceYear: parts[0], invoiceMonth: parts[1] },
            $unset: { mesiac: "" },
          }
        );
        splitCount++;
      }
    }
    results.companyInvoices = { mesiacSplit: splitCount };
  }

  // ── 5. Prirad cn k existujúcim záznamom z MonthlyImports
  //    (pre prípad, že MonthlyImport má cn ale Invoice ešte nie)
  {
    const col = db.collection("invoices");
    const imports = await db.collection("monthlyimports").find({ cn: { $exists: true, $ne: "" } }).toArray();
    let cnUpdated = 0;
    for (const imp of imports) {
      if (!imp.cn) continue;
      const r = await col.updateMany(
        { invoiceYear: imp.invoiceYear, invoiceMonth: imp.invoiceMonth, $or: [{ cn: { $exists: false } }, { cn: "" }] },
        { $set: { cn: imp.cn } }
      );
      cnUpdated += r.modifiedCount;
    }
    results.invoicesCnAssigned = cnUpdated;
  }

  // ── 6. Prirad cn k osobám podľa ich telefónnych čísel v invoices
  {
    const invoiceCol = db.collection("invoices");
    const peopleCol = db.collection("people");
    const peopleWithoutCn = await peopleCol.find({ $or: [{ cn: { $exists: false } }, { cn: "" }] }).toArray();
    let personCnUpdated = 0;
    for (const person of peopleWithoutCn) {
      const inv = await invoiceCol.findOne({ serviceIdentification: person.serviceIdentification, cn: { $exists: true, $ne: "" } });
      if (inv?.cn) {
        await peopleCol.updateOne({ _id: person._id }, { $set: { cn: inv.cn } });
        personCnUpdated++;
      }
    }
    results.personsCnAssigned = personCnUpdated;
  }

  // ── 7. Fallback: všetky osoby bez cn → "0252080007" (Slovenský futbalový zväz)
  //    Všetky existujúce osoby patria pod SFZ
  {
    const peopleCol = db.collection("people");
    const r = await peopleCol.updateMany(
      { $or: [{ cn: { $exists: false } }, { cn: "" }] },
      { $set: { cn: "0252080007" } }
    );
    results.personsCnFallback = r.modifiedCount;
  }

  return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[migrate] error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
