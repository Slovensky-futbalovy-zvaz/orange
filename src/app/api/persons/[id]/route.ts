export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import Invoice from "@/models/Invoice";

// GET /api/persons/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const person = await Person.findById(params.id).lean();
  if (!person) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  return NextResponse.json(person);
}

// PUT /api/persons/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  if (body.serviceIdentification) {
    body.serviceIdentification = body.serviceIdentification
      .replace(/\s/g, "")
      .replace(/^\+421/, "0")
      .replace(/^421/, "0");
  }
  const person = await Person.findByIdAndUpdate(params.id, body, { new: true });
  if (!person) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  // Cascade: update invoices for changed fields
  if (person.serviceIdentification) {
    const update: Record<string, unknown> = {};
    if (body.personName !== undefined) update.personName = person.personName;
    if (body.department !== undefined) update.department = person.department;
    if (body.profileType !== undefined) update.profileType = person.profileType;
    if (body.monthlyServiceLimit !== undefined) update.monthlyServiceLimit = person.monthlyServiceLimit;
    if (Object.keys(update).length > 0) {
      await Invoice.updateMany(
        { serviceIdentification: person.serviceIdentification },
        { $set: update }
      );
    }
  }

  return NextResponse.json(person);
}

// DELETE /api/persons/[id]  (soft delete)
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Person.findByIdAndUpdate(params.id, { personActive: false });
  return NextResponse.json({ ok: true });
}
