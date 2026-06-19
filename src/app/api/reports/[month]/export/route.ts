export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import * as XLSX from "xlsx";

// GET /api/reports/[month]/export?filter=nadlimit|all&cn=&department=&search=
export async function GET(req: NextRequest, { params }: { params: { month: string } }) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter     = searchParams.get("filter")     || "nadlimit";
  const cn         = searchParams.get("cn")         || null;
  const department = searchParams.get("department") || null;
  const search     = searchParams.get("search")     || null;

  const [invoiceYear, invoiceMonth] = params.month.split("-");

  const query: Record<string, unknown> = { invoiceYear, invoiceMonth };
  if (cn)         query.cn         = cn;
  if (filter === "nadlimit") query.overTheLimit = { $gt: 0 };
  if (department) query.department = department;

  // Textové vyhľadávanie (rovnaká logika ako na fronte)
  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };
    query.$or = [
      { personName:             regex },
      { serviceIdentification:  regex },
      { userName:               regex },
      { department:             regex },
      { profileType:            regex },
    ];
  }

  const invoices = await Invoice.find(query)
    .sort({ department: 1, overTheLimit: -1 })
    .lean();

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Prehľad ──────────────────────────────────────────────────────
  const sheetData = [
    ["Stredisko", "Meno", "Číslo", "Meno v Orange", "Typ", "Limit (€)", "Skutočná cena (€)", "Nadlimit (€)", "Rozpis položiek"],
    ...invoices.map((inv) => [
      inv.department              || "—",
      inv.personName              || "—",
      inv.serviceIdentification,
      inv.userName,
      inv.profileType             || "—",
      inv.monthlyServiceLimit     ?? "—",
      inv.celkovaCena,
      inv.overTheLimit > 0 ? inv.overTheLimit : "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inv.details as any[]).map((d) => `${d.entryName}: ${d.priceWithoutVat.toFixed(2)} €`).join(" | "),
    ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
  ws1["!cols"] = [
    { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 28 },
    { wch: 6  }, { wch: 10 }, { wch: 18  }, { wch: 14 }, { wch: 80 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, filter === "nadlimit" ? "Nadlimity" : "Všetky čísla");

  // ── Sheet 2: Sumarizácia po strediskách ───────────────────────────────────
  const byDept = new Map<string, { count: number; total: number; overTheLimit: number }>();
  for (const inv of invoices) {
    const s = inv.department || "Nespárované";
    const curr = byDept.get(s) || { count: 0, total: 0, overTheLimit: 0 };
    curr.count++;
    curr.total += inv.celkovaCena;
    curr.overTheLimit += inv.overTheLimit;
    byDept.set(s, curr);
  }
  const sheet2Data = [
    ["Stredisko", "Počet čísel", "Celkové náklady (€)", "Suma nadlimitov (€)"],
    ...Array.from(byDept.entries())
      .sort((a, b) => b[1].overTheLimit - a[1].overTheLimit)
      .map(([s, d]) => [s, d.count, +d.total.toFixed(2), +d.overTheLimit.toFixed(2)]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Sumarizácia");

  const buf      = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `Orange_nadlimity_${params.month}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
