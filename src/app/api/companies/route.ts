export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";

// GET /api/companies
export async function GET() {
  await connectDB();
  const companies = await Company.find().sort({ companyName: 1 }).lean();
  return NextResponse.json(companies);
}

// POST /api/companies
export async function POST(req: NextRequest) {
  await connectDB();
  const { cn, companyName } = await req.json();
  if (!cn || !companyName) return NextResponse.json({ error: "Chýba cn alebo companyName" }, { status: 400 });
  const company = await Company.findOneAndUpdate(
    { cn },
    { cn, companyName },
    { upsert: true, new: true }
  );
  return NextResponse.json(company);
}
