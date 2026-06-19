export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import Invoice from "@/models/Invoice";
import MonthlyImport from "@/models/MonthlyImport";
import CompanyInvoice from "@/models/CompanyInvoice";
import { parseStringPromise } from "xml2js";

function parseEurPrice(s: string | undefined | null): number {
  if (!s || s === "null") return 0;
  return parseFloat(s.replace(",", ".")) || 0;
}

function decodeXml(buffer: Buffer): string {
  const header = buffer.slice(0, 500).toString("latin1");
  const m = header.match(/encoding=["']([^"']+)["']/i);
  const enc = m ? m[1].toLowerCase() : "utf-8";

  const encMap: Record<string, string> = {
    "windows-1250": "windows-1250",
    "win-1250": "windows-1250",
    "cp1250": "windows-1250",
    "iso-8859-2": "iso-8859-2",
    "iso-8859-1": "iso-8859-1",
    "utf-8": "utf-8",
    "utf8": "utf-8",
  };
  const label = encMap[enc] ?? "utf-8";
  try {
    return new TextDecoder(label).decode(buffer);
  } catch {
    return buffer.toString("utf-8");
  }
}

function parseDetails(inv: any) {
  const detailsNode = inv["invoice-details"]?.["invoice-detail"];
  const detailsList = Array.isArray(detailsNode)
    ? detailsNode
    : detailsNode
    ? [detailsNode]
    : [];
  return detailsList.map((d: any) => ({
    entryName: d["entry-name"] || "",
    amount: d.amount === "null" || !d.amount ? null : Number(d.amount),
    units: d.units === "null" || !d.units ? null : Number(d.units),
    priceWithoutVat: parseEurPrice(d["price-without-vat"]),
    vat: Number(d.vat) || 0,
    priceWithVat: parseEurPrice(d["price-with-vat"]),
  }));
}

// POST /api/import  — body: FormData with file
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Chýba súbor" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const xmlText = decodeXml(buffer);

    let parsed: any;
    try {
      parsed = await parseStringPromise(xmlText, { explicitArray: false, mergeAttrs: true });
    } catch (xmlErr: unknown) {
      const msg = xmlErr instanceof Error ? xmlErr.message : String(xmlErr);
      return NextResponse.json({ error: `Neplatný XML súbor: ${msg}` }, { status: 400 });
    }

    const root = parsed["MASS-EXPORT"];
    if (!root) {
      return NextResponse.json(
        { error: "Nesprávny formát XML (očakáva koreňový element MASS-EXPORT)" },
        { status: 400 }
      );
    }

    // Číslo zákazníka (CN) spoločnosti
    const cn: string = String(root.cn || "");

    // Určenie roku a mesiaca z date-from prvej faktúry
    const dateFrom: string = root["date-created"] || "";
    let invoiceYear = "";
    let invoiceMonth = "";
    {
      const invoicesNode = root.invoices?.invoice;
      const firstInv = Array.isArray(invoicesNode) ? invoicesNode[0] : invoicesNode;
      const df: string = firstInv?.["date-from"] || "";
      const match = df.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (match) {
        invoiceYear = match[3];   // "2026"
        invoiceMonth = match[2];  // "05"
      }
    }
    if (!invoiceYear || !invoiceMonth) {
      return NextResponse.json(
        { error: "Nepodarilo sa určiť mesiac z XML (chýba date-from v invoice)" },
        { status: 400 }
      );
    }

    // Re-import: zmazanie starých záznamov pre danú spoločnosť
    const existing = await MonthlyImport.findOne({ cn, invoiceYear, invoiceMonth });
    if (existing) {
      await Invoice.deleteMany({ cn, invoiceYear, invoiceMonth });
      await CompanyInvoice.deleteMany({ cn, invoiceYear, invoiceMonth });
    }

    // Mapa phone-number → osoba
    const allPersons = await Person.find({ personActive: true }).lean();
    const personMap = new Map<string, typeof allPersons[0]>();
    for (const p of allPersons) {
      personMap.set(p.serviceIdentification, p);
    }

    const invoicesNode = root.invoices?.invoice;
    const invoiceList: any[] = Array.isArray(invoicesNode)
      ? invoicesNode
      : invoicesNode
      ? [invoicesNode]
      : [];

    const bulkOps = [];
    const companyBulkOps = [];
    let celkovaNaklady = 0;
    let pocetNadlimitov = 0;
    let sumaNadlimitov = 0;
    let nespárovane = 0;

    for (const inv of invoiceList) {
      const serviceIdentification: string = inv["phone-number"] || "";
      const invoiceType: string = inv["invoice-type"] || "";

      // Firemné poplatky: ANNEX alebo MAIN-CONS bez telefónneho čísla
      if (!serviceIdentification) {
        if (invoiceType === "ANNEX" || invoiceType === "MAIN-CONS") {
          companyBulkOps.push({
            invoiceYear,
            invoiceMonth,
            cn,
            invoiceType,
            userName: inv["user-name"] || "",
            celkovaCena: parseEurPrice(inv["price-without-vat"]),
            details: parseDetails(inv),
            dateFrom: inv["date-from"] || "",
            dateTo: inv["date-to"] || "",
          });
        }
        continue;
      }

      // Štandardné faktúry zamestnancov
      const userName: string = inv["user-name"] || "";
      const celkovaCena = parseEurPrice(inv["price-without-vat"]);
      const df: string = inv["date-from"] || "";
      const dt: string = inv["date-to"] || "";

      const person = personMap.get(serviceIdentification);
      const monthlyServiceLimit = person ? person.monthlyServiceLimit : null;
      const overTheLimit = monthlyServiceLimit !== null ? Math.max(0, celkovaCena - monthlyServiceLimit) : 0;

      if (!person) nespárovane++;

      celkovaNaklady += celkovaCena;
      if (overTheLimit > 0) {
        pocetNadlimitov++;
        sumaNadlimitov += overTheLimit;
      }

      bulkOps.push({
        cn,
        invoiceYear,
        invoiceMonth,
        serviceIdentification,
        userName,
        personId: person ? person._id : null,
        personName: person ? person.personName : null,
        profileType: person ? person.profileType : null,
        department: person ? person.department : null,
        monthlyServiceLimit,
        celkovaCena,
        overTheLimit,
        details: parseDetails(inv),
        dateFrom: df,
        dateTo: dt,
      });
    }

    if (bulkOps.length > 0) {
      await Invoice.insertMany(bulkOps);
    }

    // Nastavenie cn pre osoby, ktoré ho ešte nemajú (prvý import)
    if (cn) {
      const phoneNumbers = bulkOps.map((b) => b.serviceIdentification);
      await Person.updateMany(
        { serviceIdentification: { $in: phoneNumbers }, $or: [{ cn: { $exists: false } }, { cn: "" }] },
        { $set: { cn } }
      );
    }
    if (companyBulkOps.length > 0) {
      await CompanyInvoice.insertMany(companyBulkOps);
    }

    const celkovaFirma = companyBulkOps.reduce((s, i) => s + i.celkovaCena, 0);
    const monthKey = `${invoiceYear}-${invoiceMonth}`;

    const monthlyImportData = {
      invoiceYear,
      invoiceMonth,
      dateFrom,
      dateTo: dateFrom,
      pocetCisel: bulkOps.length,
      celkovaNaklady: Math.round(celkovaNaklady * 100) / 100,
      pocetNadlimitov,
      sumaNadlimitov: Math.round(sumaNadlimitov * 100) / 100,
      celkovaFirma: Math.round(celkovaFirma * 100) / 100,
      importovaneDna: new Date(),
    };

    await MonthlyImport.findOneAndUpdate({ cn, invoiceYear, invoiceMonth }, monthlyImportData, { upsert: true });

    return NextResponse.json({
      ok: true,
      mesiac: monthKey,
      cn,
      pocetCisel: bulkOps.length,
      nespárovane,
      celkovaNaklady: monthlyImportData.celkovaNaklady,
      pocetNadlimitov,
      sumaNadlimitov: monthlyImportData.sumaNadlimitov,
      pocetFiremnychZaznamov: companyBulkOps.length,
      celkovaFirma: monthlyImportData.celkovaFirma,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[import] unhandled error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
