export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";

// GET /api/admin/fix-cisla
// Jednorazová migrácia: pridá vedúcu nulu ku všetkým 9-miestnym číslam (serviceIdentification)
export async function GET() {
  await connectDB();

  const persons = await Person.find({}).lean();
  let updated = 0;
  let skipped = 0;

  for (const p of persons) {
    let serviceIdentification = p.serviceIdentification.trim();

    // Strip +421 prefix
    if (serviceIdentification.startsWith("+421")) serviceIdentification = "0" + serviceIdentification.slice(4);
    else if (serviceIdentification.startsWith("421") && serviceIdentification.length === 12) serviceIdentification = "0" + serviceIdentification.slice(3);

    // Add leading 0 if 9 digits
    if (/^\d{9}$/.test(serviceIdentification)) serviceIdentification = "0" + serviceIdentification;

    if (serviceIdentification !== p.serviceIdentification) {
      await Person.updateOne({ _id: p._id }, { $set: { serviceIdentification } });
      updated++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, updated, skipped, total: persons.length });
}
