import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

/** Aktualizácia používateľa — role, spoločnosti (len admin) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
    }

    await connectDB();

    const { role, companies, firstName, lastName, complexOverview } = await req.json();
    const update: Record<string, unknown> = {};

    if (role) update.role = role;
    if (companies !== undefined) update.companies = companies;
    if (firstName) update.firstName = firstName.trim();
    if (lastName) update.lastName = lastName.trim();
    // Admin má Komplexný prehľad vždy; inak podľa príznaku, ak bol poslaný
    if (role === "admin") {
      update.complexOverview = true;
    } else if (complexOverview !== undefined) {
      update.complexOverview = Boolean(complexOverview);
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true, select: "-magicToken -magicTokenExpiry" }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Používateľ neexistuje." },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}

/** Zmazanie používateľa (len admin, nemôže zmazať sám seba) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Prístup zamietnutý." }, { status: 403 });
    }

    if (me._id.toString() === params.id) {
      return NextResponse.json(
        { error: "Nemôžete zmazať vlastné konto." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "Používateľ neexistuje." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chyba servera." }, { status: 500 });
  }
}
