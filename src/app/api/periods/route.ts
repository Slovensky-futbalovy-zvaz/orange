export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MonthlyImport from "@/models/MonthlyImport";

// GET /api/periods?cn=optional
// Vracia dostupné roky + default hodnoty pre period filter
export async function GET(req: NextRequest) {
  await connectDB();

  const cn = req.nextUrl.searchParams.get("cn") || "";
  const match = cn ? { cn } : {};

  const years = (await MonthlyImport.distinct("invoiceYear", match)) as string[];
  years.sort((a, b) => b.localeCompare(a)); // newest first

  const latest = await MonthlyImport.findOne(match)
    .sort({ invoiceYear: -1, invoiceMonth: -1 })
    .lean() as { invoiceYear?: string; invoiceMonth?: string } | null;

  return NextResponse.json({
    years,
    latestYear: latest?.invoiceYear ?? new Date().getFullYear().toString(),
    latestMonth: latest?.invoiceMonth ?? "12",
  });
}
