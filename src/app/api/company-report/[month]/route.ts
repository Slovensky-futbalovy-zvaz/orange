export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CompanyInvoice from "@/models/CompanyInvoice";

// GET /api/company-report/[month]
// Vracia len ANNEX záznamy — MAIN-CONS je len súmar tých istých dát, vylučujeme ho.
export async function GET(_req: NextRequest, { params }: { params: { month: string } }) {
  await connectDB();

  const [invoiceYear, invoiceMonth] = params.month.split("-");

  const cn = _req.nextUrl.searchParams.get("cn") || "";
  const cnMatch = cn ? { cn } : {};

  const items = await CompanyInvoice.find({
    ...cnMatch,
    invoiceYear,
    invoiceMonth,
    invoiceType: "ANNEX", // vylúčiť MAIN-CONS (duplicitný súmar)
  })
    .sort({ celkovaCena: -1 })
    .lean();

  // Rozdeliť na firemné (userName="") a zamestnanecké (userName≠"")
  const firemne = items.filter((i) => !i.userName);
  const zamestnancke = items.filter((i) => i.userName);

  const totalFiremne = firemne.reduce((s, i) => s + i.celkovaCena, 0);
  const totalZamestnancke = zamestnancke.reduce((s, i) => s + i.celkovaCena, 0);
  const total = totalFiremne + totalZamestnancke;

  return NextResponse.json({
    mesiac: params.month,
    cn: items[0]?.cn || cn,
    // Zachovávame pôvodné kľúče pre kompatibilitu s detail stránkou
    annex: firemne,
    mainCons: zamestnancke,
    totalAnnex: Math.round(totalFiremne * 100) / 100,
    totalMainCons: Math.round(totalZamestnancke * 100) / 100,
    total: Math.round(total * 100) / 100,
  });
}
