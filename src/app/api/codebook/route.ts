export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Codebook from "@/models/Codebook";

// GET /api/codebook?type=profileType|department
export async function GET(req: NextRequest) {
  await connectDB();
  const type = req.nextUrl.searchParams.get("type");
  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  const items = await Codebook.find({ type }).sort({ value: 1 }).lean();
  return NextResponse.json(items);
}

// POST /api/codebook  { type, value }
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { type, value } = body;

  if (!type || !value?.trim()) {
    return NextResponse.json({ error: "type a value sú povinné" }, { status: 400 });
  }

  try {
    const item = await Codebook.create({ type, value: value.trim() });
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    // Duplicate key
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Hodnota už existuje" }, { status: 409 });
    }
    throw e;
  }
}
