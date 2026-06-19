export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Codebook from "@/models/Codebook";
import Person from "@/models/Person";
import Invoice from "@/models/Invoice";

// PUT /api/codebook/[id]  { value: "nová hodnota" }
// Kaskádový update: zároveň prepíše zodpovedajúce pole vo všetkých persons
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { value } = await req.json();
  if (!value?.trim()) {
    return NextResponse.json({ error: "value je povinné" }, { status: 400 });
  }

  // Načítaj starú hodnotu pred zmenou
  const existing = await Codebook.findById(params.id);
  if (!existing) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  const oldValue = existing.value;
  const newValue = value.trim();
  const type = existing.type as "profileType" | "department";

  if (oldValue === newValue) {
    return NextResponse.json(existing);
  }

  try {
    // 1. Uprav číselník
    const item = await Codebook.findByIdAndUpdate(
      params.id,
      { value: newValue },
      { new: true }
    );

    // 2. Kaskádový update — prepíš starú hodnotu na novú vo všetkých kolekciách
    const [personsResult, invoicesResult] = await Promise.all([
      Person.updateMany({ [type]: oldValue }, { $set: { [type]: newValue } }),
      Invoice.updateMany({ [type]: oldValue }, { $set: { [type]: newValue } }),
    ]);

    return NextResponse.json({
      item,
      personsUpdated:  personsResult.modifiedCount,
      invoicesUpdated: invoicesResult.modifiedCount,
    });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Hodnota už existuje" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE /api/codebook/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Codebook.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
