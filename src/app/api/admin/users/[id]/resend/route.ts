import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser, generateToken } from "@/lib/auth";
import { sendInvitation } from "@/lib/email";

/** Znovu odošle žiadosť o aktiváciu (pozvánku) s novým tokenom — len admin. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "Používateľ neexistuje." }, { status: 404 });
    }

    // Nový jednorazový token, platnosť 7 dní
    const token = generateToken();
    user.magicToken = token;
    user.magicTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    const inviterName = `${me.firstName} ${me.lastName}`;
    await sendInvitation(user.email, user.firstName, token, inviterName, user.companies);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend invitation error:", err);
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
