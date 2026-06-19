export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MonthlyImport from "@/models/MonthlyImport";
import Invoice from "@/models/Invoice";
import CompanyInvoice from "@/models/CompanyInvoice";

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

// GET /api/analytics?cn=&year=&monthFrom=01&monthTo=12
export async function GET(req: NextRequest) {
  await connectDB();

  const cn = req.nextUrl.searchParams.get("cn") || "";
  const year = req.nextUrl.searchParams.get("year") || "";
  const monthFrom = req.nextUrl.searchParams.get("monthFrom") || "01";
  const monthTo = req.nextUrl.searchParams.get("monthTo") || "12";

  const matchCn = cn ? { cn } : {};

  // --- Build period match ---
  let periodMatch: Record<string, unknown>;
  let periodLabel: string;
  if (year) {
    const months = buildMonthRange(monthFrom, monthTo);
    periodMatch = { ...matchCn, invoiceYear: year, invoiceMonth: { $in: months } };
    periodLabel = buildPeriodLabel(year, monthFrom, monthTo);
  } else {
    // No period filter — use all data (limit to last 12 months for trend)
    periodMatch = matchCn;
    periodLabel = "Všetky dáta";
  }

  // --- Monthly trend ---
  // When period is selected, show all months in period; otherwise last 12
  const trendPipeline = [
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
        celkovaFirma: { $sum: "$celkovaFirma" },
      },
    },
    { $sort: { invoiceYear: -1, invoiceMonth: -1 } },
    ...(year ? [] : [{ $limit: 12 }]),
  ];

  const monthlyTrendRaw = await MonthlyImport.aggregate(trendPipeline);

  // --- Period-level aggregate stats (sum over selected period) ---
  let periodStats: {
    pocetCisel: number;
    celkovaNaklady: number;
    pocetNadlimitov: number;
    sumaNadlimitov: number;
  } | null = null;

  if (year) {
    periodStats = {
      pocetCisel: monthlyTrendRaw.reduce((s, m) => s + (m.pocetCisel ?? 0), 0),
      celkovaNaklady: Math.round(monthlyTrendRaw.reduce((s, m) => s + (m.celkovaNaklady ?? 0), 0) * 100) / 100,
      pocetNadlimitov: monthlyTrendRaw.reduce((s, m) => s + (m.pocetNadlimitov ?? 0), 0),
      sumaNadlimitov: Math.round(monthlyTrendRaw.reduce((s, m) => s + (m.sumaNadlimitov ?? 0), 0) * 100) / 100,
    };
  }

  // --- Top repeat over-limiters ---
  // Use last 6 months within the period (or all period months if < 6)
  const last6 = monthlyTrendRaw.slice(0, 6).map((m) => ({
    invoiceYear: m.invoiceYear,
    invoiceMonth: m.invoiceMonth,
  }));

  const topPrekracovateliaRaw = last6.length > 0
    ? await Invoice.aggregate([
        {
          $match: {
            ...matchCn,
            overTheLimit: { $gt: 0 },
            $or: last6.map((m) => ({ invoiceYear: m.invoiceYear, invoiceMonth: m.invoiceMonth })),
          },
        },
        {
          $group: {
            _id: { personId: "$personId", personName: "$personName" },
            pocetMesiacov: { $sum: 1 },
            sumaNadlimitov: { $sum: "$overTheLimit" },
            avgNadlimit: { $avg: "$overTheLimit" },
          },
        },
        { $sort: { pocetMesiacov: -1, sumaNadlimitov: -1 } },
        { $limit: 10 },
      ])
    : [];

  // --- byStredisko: aggregate across the whole period ---
  let byStredisko: Array<{ stredisko: string; celkovaCena: number; nadlimit: number }> = [];
  if (year) {
    const months = buildMonthRange(monthFrom, monthTo);
    byStredisko = await Invoice.aggregate([
      {
        $match: {
          ...matchCn,
          invoiceYear: year,
          invoiceMonth: { $in: months },
          department: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$department",
          celkovaCena: { $sum: "$celkovaCena" },
          nadlimit: { $sum: "$overTheLimit" },
        },
      },
      { $sort: { celkovaCena: -1 } },
      {
        $project: {
          stredisko: "$_id",
          celkovaCena: { $round: ["$celkovaCena", 2] },
          nadlimit: { $round: ["$nadlimit", 2] },
        },
      },
    ]);
  } else {
    // Fallback: last month only
    const lastMonthRecord = monthlyTrendRaw[0];
    if (lastMonthRecord) {
      const { invoiceYear, invoiceMonth } = lastMonthRecord;
      byStredisko = await Invoice.aggregate([
        { $match: { ...matchCn, invoiceYear, invoiceMonth, department: { $ne: null } } },
        {
          $group: {
            _id: "$department",
            celkovaCena: { $sum: "$celkovaCena" },
            nadlimit: { $sum: "$overTheLimit" },
          },
        },
        { $sort: { celkovaCena: -1 } },
        {
          $project: {
            stredisko: "$_id",
            celkovaCena: { $round: ["$celkovaCena", 2] },
            nadlimit: { $round: ["$nadlimit", 2] },
          },
        },
      ]);
    }
  }

  const lastMonthRecord = monthlyTrendRaw[0];
  const lastMonth = lastMonthRecord
    ? `${lastMonthRecord.invoiceYear}-${lastMonthRecord.invoiceMonth}`
    : "";

  // --- Stacked trend (firemné náklady ANNEX + MAIN-CONS) ---
  const allMonths = monthlyTrendRaw.map((m) => ({
    invoiceYear: m.invoiceYear,
    invoiceMonth: m.invoiceMonth,
  }));

  // Firemné poplatky: len ANNEX + userName="" — MAIN-CONS je duplicitný súmar, vylučujeme ho
  const firemneTrend = allMonths.length > 0
    ? await CompanyInvoice.aggregate([
        {
          $match: {
            ...matchCn,
            invoiceType: "ANNEX",
            userName: { $in: ["", null] },
            $or: allMonths.map((m) => ({ invoiceYear: m.invoiceYear, invoiceMonth: m.invoiceMonth })),
          },
        },
        {
          $group: {
            _id: { invoiceYear: "$invoiceYear", invoiceMonth: "$invoiceMonth" },
            suma: { $sum: "$celkovaCena" },
          },
        },
        { $sort: { "_id.invoiceYear": 1, "_id.invoiceMonth": 1 } },
      ])
    : [];

  const firemneSumy = new Map<string, number>();
  for (const f of firemneTrend) {
    const key = `${f._id.invoiceYear}-${f._id.invoiceMonth}`;
    firemneSumy.set(key, Math.round(f.suma * 100) / 100);
  }

  const stackedTrend = [...monthlyTrendRaw].reverse().map((m) => {
    const key = `${m.invoiceYear}-${m.invoiceMonth}`;
    const firemne = firemneSumy.get(key) ?? 0;
    return {
      mesiac: key,
      zamestnanci: m.celkovaNaklady,
      annex: firemne,
      mainCons: 0,
      firemne,
    };
  });

  // --- Top firemné služby: across entire period ---
  let topFiremneSluzby: Array<{ entryName: string; suma: number }> = [];
  if (year) {
    const months = buildMonthRange(monthFrom, monthTo);
    topFiremneSluzby = await CompanyInvoice.aggregate([
      { $match: { ...matchCn, invoiceType: "ANNEX", userName: { $in: ["", null] }, invoiceYear: year, invoiceMonth: { $in: months } } },
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
  } else if (lastMonthRecord) {
    // Fallback: last month only
    const { invoiceYear, invoiceMonth } = lastMonthRecord;
    topFiremneSluzby = await CompanyInvoice.aggregate([
      { $match: { ...matchCn, invoiceType: "ANNEX", userName: { $in: ["", null] }, invoiceYear, invoiceMonth } },
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
  }

  const monthlyTrendWithKey = [...monthlyTrendRaw].reverse().map((m) => ({
    ...m,
    mesiac: `${m.invoiceYear}-${m.invoiceMonth}`,
  }));

  // KPI for last month (always shown alongside periodStats)
  const latestStats = lastMonthRecord
    ? {
        pocetCisel: lastMonthRecord.pocetCisel,
        celkovaNaklady: Math.round(lastMonthRecord.celkovaNaklady * 100) / 100,
        pocetNadlimitov: lastMonthRecord.pocetNadlimitov,
        sumaNadlimitov: Math.round(lastMonthRecord.sumaNadlimitov * 100) / 100,
      }
    : null;

  return NextResponse.json({
    monthlyTrend: monthlyTrendWithKey,
    topPrekracovateliaRaw,
    byStredisko,
    lastMonth,
    stackedTrend,
    topFiremneSluzby,
    latestStats,
    periodStats,
    periodLabel,
  });
}
