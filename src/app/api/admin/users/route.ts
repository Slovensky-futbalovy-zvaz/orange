import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser, generateToken } from "@/lib/auth";
import { sendInvitation } from "@/lib/email";

/** Zoznam všetkých používateľov (len admin) */
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
    }

    await connectDB();
    const users = await User.find({}, "-magicToken -magicTokenExpiry")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}

/** Pozvanie nového používateľa (len admin) */
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
    }

    await connectDB();

    const { email, firstName, lastName, role, companies } = await req.json();
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Vyplňte všetky povinné polia." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "Používateľ s týmto emailom už existuje." },
        { status: 409 }
      );
    }

    const expiryDays = 7;
    const token = generateToken();
    const expiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      status: "pending",
      companies: role === "admin" ? [] : (companies || []),
      magicToken: token,
      magicTokenExpiry: expiry,
    });

    const inviterName = `${me.firstName} ${me.lastName}`;
    await sendInvitation(
      user.email,
      user.firstName,
      token,
      inviterName,
      user.companies
    );

    return NextResponse.json({ ok: true, userId: user._id });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
