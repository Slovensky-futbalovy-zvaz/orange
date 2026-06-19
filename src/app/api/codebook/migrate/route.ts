export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Codebook from "@/models/Codebook";
import Person from "@/models/Person";

/**
 * GET|POST /api/codebook/migrate
 *
 * Načíta distinct profileType a department z kolekcie `persons`
 * a vloží chýbajúce hodnoty do Codebook (duplicity preskočí).
 *
 * Odpoveď:
 *   { profileType: { found: string[], inserted: number, skipped: number },
 *     department:  { found: string[], inserted: number, skipped: number } }
 */
async function runMigration() {
  await connectDB();

  // Načítaj unikátne hodnoty cez Mongoose model (správna DB aj kolekcia)
  const [rawProfileTypes, rawDepartments] = await Promise.all([
    Person.distinct("profileType"),
    Person.distinct("department"),
  ]);

  const profileTypes: string[] = rawProfileTypes
    .map((v) => String(v).trim())
    .filter(Boolean);

  const departments: string[] = rawDepartments
    .map((v) => String(v).trim())
    .filter(Boolean);

  async function upsertValues(
    type: "profileType" | "department",
    values: string[]
  ): Promise<{ found: string[]; inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (const value of values) {
      try {
        await Codebook.create({ type, value });
        inserted++;
      } catch (e: unknown) {
        if ((e as { code?: number }).code === 11000) {
          skipped++; // already exists
        } else {
          throw e;
        }
      }
    }

    return { found: values, inserted, skipped };
  }

  const [ptResult, deptResult] = await Promise.all([
    upsertValues("profileType", profileTypes),
    upsertValues("department", departments),
  ]);

  return NextResponse.json({
    profileType: ptResult,
    department: deptResult,
  });
}

export async function GET() {
  return runMigration();
}

export async function POST() {
  return runMigration();
}
