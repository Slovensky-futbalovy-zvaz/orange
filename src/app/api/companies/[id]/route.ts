export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";

// PUT /api/companies/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const company = await Company.findByIdAndUpdate(params.id, body, { new: true });
  if (!company) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  return NextResponse.json(company);
}

// DELETE /api/companies/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Company.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
