export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Neprihlásený" }, { status: 401 });
    }
    return NextResponse.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companies: user.companies,
      complexOverview: user.complexOverview ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
