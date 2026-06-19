import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import MonthlyImport from "@/models/MonthlyImport";

// GET /api/reports/[month]?filter=overTheLimit|all&department=...&cn=...
export async function GET(req: NextRequest, { params }: { params: { month: string } }) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";
  const department = searchParams.get("department") || null;
  const cn = searchParams.get("cn") || null;

  const [invoiceYear, invoiceMonth] = params.month.split("-");

  const baseQuery: Record<string, unknown> = { invoiceYear, invoiceMonth };
  if (cn) baseQuery.cn = cn;

  const query: Record<string, unknown> = { ...baseQuery };
  if (filter === "nadlimit") query.overTheLimit = { $gt: 0 };
  if (department) query.department = department;

  const [invoices, summary] = await Promise.all([
    Invoice.find(query).sort({ overTheLimit: -1, celkovaCena: -1 }).lean(),
    MonthlyImport.findOne(cn ? { cn, invoiceYear, invoiceMonth } : { invoiceYear, invoiceMonth }).lean(),
  ]);

  const departments = await Invoice.distinct("department", baseQuery);

  return NextResponse.json({ invoices, summary, departments: departments.filter(Boolean) });
}
