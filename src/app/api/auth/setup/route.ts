import { NextResponse } from "next/server";

/**
 * Setup route is disabled — primary admin is seeded automatically
 * from FROM_EMAIL env variable on first DB connection.
 */
export async function GET() {
  return NextResponse.json({
    isEmpty: false,
    fromEmailSet: !!process.env.FROM_EMAIL,
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Manuálny setup je zakázaný. Primárny správca sa vytvorí automaticky z FROM_EMAIL." },
    { status: 403 }
  );
}
