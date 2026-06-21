export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MonthlyImport from "@/models/MonthlyImport";
import Company from "@/models/Company";
import { getCurrentUser } from "@/lib/auth";

function buildMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  for (let m = parseInt(from); m <= parseInt(to); m++) {
    months.push(m.toString().padStart(2, "0"));
  }
  return months;
}

function buildPeriodLabel(year: string, monthFrom: string, monthTo: string): string {
  if (monthFrom === monthTo) return `${year}/${monthFrom}`;
  if (monthFrom === "01" && monthTo === "12") return year;
  return `${year}/${monthFrom} – ${year}/${monthTo}`;
}

const round2 = (n: number) => Math.round((n ?? 0) * 100) / 100;

// GET /api/complex-overview?year=&monthFrom=01&monthTo=12
// Agregát NÁKLADOV cez VŠETKY spoločnosti (ignoruje vyberač).
// Prístup: len Správca (admin) alebo používateľ s príznakom complexOverview.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neprihlásený" }, { status: 401 });

  const allowed = user.role === "admin" || user.complexOverview === true;
  if (!allowed) {
    return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
  }

  await connectDB();

  const year = req.nextUrl.searchParams.get("year") || "";
  const monthFrom = req.nextUrl.searchParams.get("monthFrom") || "01";
  const monthTo = req.nextUrl.searchParams.get("monthTo") || "12";

  let periodMatch: Record<string, unknown>;
  let periodLabel: string;
  if (year) {
    const months = buildMonthRange(monthFrom, monthTo);
    periodMatch = { invoiceYear: year, invoiceMonth: { $in: months } };
    periodLabel = buildPeriodLabel(year, monthFrom, monthTo);
  } else {
    periodMatch = {};
    periodLabel = "Všetky dáta";
  }

  // --- Company name lookup ---
  const companyDocs = await Company.find().lean();
  const nameByCn = new Map<string, string>();
  for (const c of companyDocs as unknown as Array<{ cn: string; companyName: string }>) {
    nameByCn.set(c.cn, c.companyName);
  }
  const labelFor = (cn: string) => nameByCn.get(cn) || cn;

  // --- Per-month overall trend (across all companies) ---
  const monthlyTrendRaw = await MonthlyImport.aggregate([
    { $match: periodMatch },
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
    { $sort: { invoiceYear: 1 as const, invoiceMonth: 1 as const } },
  ]);

  const monthlyTrend = monthlyTrendRaw.map((m) => ({
    mesiac: `${m.invoiceYear}-${m.invoiceMonth}`,
    celkovaNaklady: round2(m.celkovaNaklady),
    sumaNadlimitov: round2(m.sumaNadlimitov),
    pocetNadlimitov: m.pocetNadlimitov ?? 0,
  }));

  // --- Period totals ---
  const periodStats = {
    pocetCisel: monthlyTrendRaw.reduce((s, m) => s + (m.pocetCisel ?? 0), 0),
    celkovaNaklady: round2(monthlyTrendRaw.reduce((s, m) => s + (m.celkovaNaklady ?? 0), 0)),
    pocetNadlimitov: monthlyTrendRaw.reduce((s, m) => s + (m.pocetNadlimitov ?? 0), 0),
    sumaNadlimitov: round2(monthlyTrendRaw.reduce((s, m) => s + (m.sumaNadlimitov ?? 0), 0)),
  };

  // --- Per-company totals over the period ---
  const byCompanyRaw = await MonthlyImport.aggregate([
    { $match: periodMatch },
    {
      $group: {
        _id: "$cn",
        celkovaNaklady: { $sum: "$celkovaNaklady" },
        pocetCisel: { $sum: "$pocetCisel" },
        pocetNadlimitov: { $sum: "$pocetNadlimitov" },
        sumaNadlimitov: { $sum: "$sumaNadlimitov" },
      },
    },
    { $sort: { celkovaNaklady: -1 } },
  ]);

  const totalCost = byCompanyRaw.reduce((s, c) => s + (c.celkovaNaklady ?? 0), 0);

  const byCompany = byCompanyRaw.map((c) => ({
    cn: c._id as string,
    companyName: labelFor(c._id as string),
    celkovaNaklady: round2(c.celkovaNaklady),
    pocetCisel: c.pocetCisel ?? 0,
    pocetNadlimitov: c.pocetNadlimitov ?? 0,
    sumaNadlimitov: round2(c.sumaNadlimitov),
    podiel: totalCost > 0 ? Math.round((c.celkovaNaklady / totalCost) * 1000) / 10 : 0,
  }));

  // Stable company order (by total cost desc) for stacked chart + colours
  const companyOrder = byCompany.map((c) => c.companyName);

  // --- Per-month split by company (stacked) ---
  const monthlyByCompanyRaw = await MonthlyImport.aggregate([
    { $match: periodMatch },
    {
      $group: {
        _id: { invoiceYear: "$invoiceYear", invoiceMonth: "$invoiceMonth", cn: "$cn" },
        celkovaNaklady: { $sum: "$celkovaNaklady" },
      },
    },
  ]);

  const monthMap = new Map<string, Record<string, number | string>>();
  for (const row of monthlyByCompanyRaw) {
    const key = `${row._id.invoiceYear}-${row._id.invoiceMonth}`;
    if (!monthMap.has(key)) monthMap.set(key, { mesiac: key });
    const entry = monthMap.get(key)!;
    const name = labelFor(row._id.cn);
    entry[name] = round2((entry[name] as number ?? 0) + row.celkovaNaklady);
  }
  const monthlyByCompany = Array.from(monthMap.values()).sort((a, b) =>
    (a.mesiac as string).localeCompare(b.mesiac as string)
  );

  return NextResponse.json({
    periodLabel,
    periodStats,
    monthlyTrend,
    byCompany,
    companyOrder,
    monthlyByCompany,
  });
}
