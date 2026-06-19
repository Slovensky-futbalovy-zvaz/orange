export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";
import { getCurrentUser } from "@/lib/auth";

// GET /api/companies — admin vidí všetky, bežný user len svoje
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neprihlásený" }, { status: 401 });

  await connectDB();

  let companies;
  if (user.role === "admin") {
    companies = await Company.find().sort({ companyName: 1 }).lean();
  } else {
    companies = await Company.find(
      user.companies?.length ? { cn: { $in: user.companies } } : { _id: null }
    )
      .sort({ companyName: 1 })
      .lean();
  }

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
