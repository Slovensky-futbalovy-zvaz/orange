export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CompanyInvoice from "@/models/CompanyInvoice";

// GET /api/service-report/[month]?cn=
// Vracia MAIN-CONS záznamy pre daný mesiac (štandardné firemné služby)
export async function GET(_req: NextRequest, { params }: { params: { month: string } }) {
  await connectDB();

  const [invoiceYear, invoiceMonth] = params.month.split("-");
  const cn = _req.nextUrl.searchParams.get("cn") || "";
  const cnMatch = cn ? { cn } : {};

  const items = await CompanyInvoice.find({
    ...cnMatch,
    invoiceYear,
    invoiceMonth,
    invoiceType: "MAIN-CONS",
  })
    .sort({ celkovaCena: -1 })
    .lean();

  const total = items.reduce((s, i) => s + i.celkovaCena, 0);

  return NextResponse.json({
    mesiac: params.month,
    cn: items[0]?.cn || cn,
    items,
    total: Math.round(total * 100) / 100,
  });
}
