import mongoose, { Schema, Document } from "mongoose";

export interface IPerson extends Document {
  cn: string;            // číslo zákazníka (spoločnosť) — priradené pri prvom importe
  personName: string;
  serviceIdentification: string; // "0902198279"
  department: string;
  profileType: string;
  monthlyServiceLimit: number;
  personActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema = new Schema<IPerson>(
  {
    cn: { type: String, default: "", index: true },
    personName: { type: String, required: true, trim: true },
    serviceIdentification: { type: String, required: true, unique: true, trim: true },
    department: { type: String, default: "", trim: true },
    profileType: { type: String, default: "P" },
    monthlyServiceLimit: { type: Number, required: true, default: 20 },
    personActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pozn.: unikátny index na `serviceIdentification` je definovaný priamo
// na poli (`unique: true`) — netreba ho deklarovať druhýkrát.
PersonSchema.index({ department: 1 });

export default mongoose.models.Person ||
  mongoose.model<IPerson>("Person", PersonSchema);
