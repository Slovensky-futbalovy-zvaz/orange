export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MonthlyImport from "@/models/MonthlyImport";
import Company from "@/models/Company";

// GET /api/reports?cn=optional
// Vracia zoznam mesiacov s názvom spoločnosti pre každý záznam
export async function GET(req: NextRequest) {
  await connectDB();

  const cn = req.nextUrl.searchParams.get("cn") || "";

  // Načítaj spoločnosti pre lookup
  const companies = await Company.find().lean() as unknown as Array<{ cn: string; companyName: string }>;
  const companyMap = new Map(companies.map((c) => [c.cn, c.companyName]));

  if (cn) {
    // Konkrétna spoločnosť — vráť mesiace agregované (jeden záznam na mesiac)
    const months = await MonthlyImport.aggregate([
      { $match: { cn } },
      {
        $group: {
          _id: { invoiceYear: "$invoiceYear", invoiceMonth: "$invoiceMonth" },
          invoiceYear: { $first: "$invoiceYear" },
          invoiceMonth: { $first: "$invoiceMonth" },
          pocetCisel: { $sum: "$pocetCisel" },
          celkovaNaklady: { $sum: "$celkovaNaklady" },
          pocetNadlimitov: { $sum: "$pocetNadlimitov" },
          sumaNadlimitov: { $sum: "$sumaNadlimitov" },
        },
      },
      { $sort: { invoiceYear: -1, invoiceMonth: -1 } },
    ]);

    const companyName = companyMap.get(cn) ?? cn;
    return NextResponse.json(
      months.map((m) => ({ ...m, cn, companyName }))
    );
  } else {
    // Všetky spoločnosti — jeden záznam na (cn, mesiac), zoradené podľa mesiaca
    const months = await MonthlyImport.aggregate([
      {
        $group: {
          _id: { cn: "$cn", invoiceYear: "$invoiceYear", invoiceMonth: "$invoiceMonth" },
          cn: { $first: "$cn" },
          invoiceYear: { $first: "$invoiceYear" },
          invoiceMonth: { $first: "$invoiceMonth" },
          pocetCisel: { $sum: "$pocetCisel" },
          celkovaNaklady: { $sum: "$celkovaNaklady" },
          pocetNadlimitov: { $sum: "$pocetNadlimitov" },
          sumaNadlimitov: { $sum: "$sumaNadlimitov" },
        },
      },
      { $sort: { invoiceYear: -1, invoiceMonth: -1, cn: 1 } },
    ]);

    return NextResponse.json(
      months.map((m) => ({
        ...m,
        companyName: companyMap.get(m.cn) ?? m.cn,
      }))
    );
  }
}
