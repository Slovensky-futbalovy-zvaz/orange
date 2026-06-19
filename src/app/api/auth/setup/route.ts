import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { sendAdminActivation } from "@/lib/email";

/** Registrácia prvého správcu — funguje iba keď neexistuje žiadny používateľ */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { error: "Správca už existuje." },
        { status: 403 }
      );
    }

    const { email, firstName, lastName } = await req.json();
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Vyplňte všetky polia." },
        { status: 400 }
      );
    }

    const token = generateToken();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hodín

    const user = await User.create({
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "admin",
      status: "pending",
      companies: [],
      magicToken: token,
      magicTokenExpiry: expiry,
    });

    await sendAdminActivation(user.email, user.firstName, token);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Chyba servera." },
      { status: 500 }
    );
  }
}

/** Overí, či neexistuje žiadny používateľ (pre zobrazenie setup formulára) */
export async function GET() {
  try {
    await connectDB();
    const count = await User.countDocuments();
    return NextResponse.json({ isEmpty: count === 0 });
  } catch {
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
