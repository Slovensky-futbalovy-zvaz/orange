export const runtime = "nodejs";
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CompanyInvoice from "@/models/CompanyInvoice";
import Company from "@/models/Company";

function buildMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  for (let m = parseInt(from); m <= parseInt(to); m++) {
    months.push(m.toString().padStart(2, "0"));
  }
  return months;
}

function periodLabel(year: string, monthFrom: string, monthTo: string): string {
  if (monthFrom === monthTo) return `${year}/${monthFrom}`;
  if (monthFrom === "01" && monthTo === "12") return year;
  return `${year}/${monthFrom} – ${year}/${monthTo}`;
}

// GET /api/services?cn=&year=&monthFrom=01&monthTo=12
// Vracia MAIN-CONS záznamy (štandardné firemné služby — predplatné, linky, …)
export async function GET(req: NextRequest) {
  await connectDB();

  const cn = req.nextUrl.searchParams.get("cn") || "";
  const year = req.nextUrl.searchParams.get("year") || "";
  const monthFrom = req.nextUrl.searchParams.get("monthFrom") || "01";
  const monthTo = req.nextUrl.searchParams.get("monthTo") || "12";

  if (!year) {
    return NextResponse.json({ error: "year is required" }, { status: 400 });
  }

  const months = buildMonthRange(monthFrom, monthTo);

  const match: Record<string, unknown> = {
    invoiceYear: year,
    invoiceMonth: { $in: months },
    invoiceType: "MAIN-CONS",
    ...(cn ? { cn } : {}),
  };

  // Company name lookup
  const company = cn
    ? (await Company.findOne({ cn }).lean() as { companyName?: string } | null)
    : null;
  const companyName = company?.companyName ?? (cn || "Všetky spoločnosti");

  // Celková suma + počet záznamov
  const summaryRaw = await CompanyInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: "$celkovaCena" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    total: Math.round((summaryRaw[0]?.total ?? 0) * 100) / 100,
    count: summaryRaw[0]?.count ?? 0,
  };

  // byMonth
  const byMonthRaw = await CompanyInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: { invoiceYear: "$invoiceYear", invoiceMonth: "$invoiceMonth" },
        suma: { $sum: "$celkovaCena" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.invoiceYear": 1, "_id.invoiceMonth": 1 } },
  ]);

  const byMonth = byMonthRaw.map((m) => ({
    mesiac: `${m._id.invoiceYear}-${m._id.invoiceMonth}`,
    total: Math.round(m.suma * 100) / 100,
    count: m.count,
  }));

  // Top services (by priceWithoutVat)
  const topServices = await CompanyInvoice.aggregate([
    { $match: match },
    { $unwind: "$details" },
    {
      $group: {
        _id: "$details.entryName",
        suma: { $sum: "$details.priceWithoutVat" },
      },
    },
    { $match: { suma: { $gt: 0 } } },
    { $sort: { suma: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, entryName: "$_id", suma: { $round: ["$suma", 2] } } },
  ]);

  return NextResponse.json({
    companyName,
    periodLabel: periodLabel(year, monthFrom, monthTo),
    summary,
    byMonth,
    topServices,
  });
}
