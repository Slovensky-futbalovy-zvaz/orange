import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";

/** Odošle magic link na prihlásenie */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Zadajte email." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Bezpečnostne vraciame rovnakú odpoveď aj keď user neexistuje
    if (!user || user.status !== "active") {
      return NextResponse.json({ ok: true });
    }

    const token = generateToken();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minút

    user.magicToken = token;
    user.magicTokenExpiry = expiry;
    await user.save();

    await sendMagicLink(user.email, user.firstName, token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
