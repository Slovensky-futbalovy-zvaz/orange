export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import Invoice from "@/models/Invoice";

/**
 * GET /api/codebook/sync-invoices
 *
 * Pre každú osobu nájde jej faktúry podľa serviceIdentification
 * a prepíše department + profileType na aktuálne hodnoty z persons.
 */
export async function GET() {
  await connectDB();

  const persons = await Person.find({}, "serviceIdentification department profileType").lean();

  let invoicesUpdated = 0;

  for (const person of persons) {
    if (!person.serviceIdentification) continue;

    const result = await Invoice.updateMany(
      { serviceIdentification: person.serviceIdentification },
      {
        $set: {
          department:  person.department,
          profileType: person.profileType,
        },
      }
    );

    invoicesUpdated += result.modifiedCount;
  }

  return NextResponse.json({
    personsProcessed: persons.length,
    invoicesUpdated,
  });
}
