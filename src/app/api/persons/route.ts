export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";

function normalizeServiceId(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("+421")) s = "0" + s.slice(4);
  else if (s.startsWith("421") && s.length === 12) s = "0" + s.slice(3);
  if (/^\d{9}$/.test(s)) s = "0" + s;
  return s;
}

// GET /api/persons?department=...&cn=...
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department") || null;
  const cn = searchParams.get("cn") || null;
  const query: Record<string, unknown> = { personActive: true };
  if (department) query.department = department;
  if (cn) query.cn = cn;
  const persons = await Person.find(query).sort({ personName: 1 }).lean();
  return NextResponse.json(persons);
}

// POST /api/persons — vytvorenie alebo bulk import
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  // Bulk import: pole objektov
  if (Array.isArray(body)) {
    const results = [];
    for (const p of body) {
      const serviceIdentification = normalizeServiceId(p.serviceIdentification || p.cislo || "");
      if (!serviceIdentification) continue;
      const doc = await Person.findOneAndUpdate(
        { serviceIdentification },
        { ...p, serviceIdentification, personActive: true },
        { upsert: true, new: true }
      );
      results.push(doc);
    }
    return NextResponse.json({ ok: true, count: results.length });
  }

  // Jeden záznam
  const { personName, serviceIdentification: rawId, department, profileType, monthlyServiceLimit } = body;
  const serviceIdentification = normalizeServiceId(rawId || "");
  if (!serviceIdentification || !personName) {
    return NextResponse.json({ error: "Chýba meno alebo číslo" }, { status: 400 });
  }

  const person = await Person.findOneAndUpdate(
    { serviceIdentification },
    { personName, serviceIdentification, department, profileType, monthlyServiceLimit, personActive: true },
    { upsert: true, new: true }
  );
  return NextResponse.json(person);
}
