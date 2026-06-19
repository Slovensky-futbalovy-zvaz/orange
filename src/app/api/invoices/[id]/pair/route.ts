export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Person from "@/models/Person";

// PATCH /api/invoices/[id]/pair
// Body: { personName, department, profileType, monthlyServiceLimit }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  const { personName, department, profileType, monthlyServiceLimit } = await req.json();

  const invoice = await Invoice.findById(params.id);
  if (!invoice) return NextResponse.json({ error: "Faktúra nenájdená" }, { status: 404 });

  const serviceIdentification = invoice.serviceIdentification;

  // Upsert osoby (vrátane cn z faktúry)
  const person = await Person.findOneAndUpdate(
    { serviceIdentification },
    {
      personName,
      serviceIdentification,
      cn: invoice.cn,
      department: department || "",
      profileType: profileType || "P",
      monthlyServiceLimit: Number(monthlyServiceLimit) || 20,
      personActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Aktualizuj VŠETKY faktúry pre toto číslo (naprieč mesiacmi)
  await Invoice.updateMany(
    { serviceIdentification },
    [
      {
        $set: {
          personId: person._id,
          personName: personName,
          profileType: profileType || "P",
          department: department || "",
          monthlyServiceLimit: Number(monthlyServiceLimit) || 20,
          overTheLimit: {
            $max: [0, { $subtract: ["$celkovaCena", Number(monthlyServiceLimit) || 20] }],
          },
        },
      },
    ]
  );

  return NextResponse.json({ ok: true, person });
}
