import mongoose, { Schema, Document } from "mongoose";

export interface IMonthlyImport extends Document {
  cn: string;            // číslo zákazníka (spoločnosť)
  invoiceYear: string;   // "2026"
  invoiceMonth: string;  // "05"
  dateFrom: string;
  dateTo: string;
  pocetCisel: number;
  celkovaNaklady: number;
  pocetNadlimitov: number;
  sumaNadlimitov: number;
  celkovaFirma: number;
  importovaneDna: Date;
}

const MonthlyImportSchema = new Schema<IMonthlyImport>({
  cn: { type: String, required: true, index: true },
  invoiceYear: { type: String, required: true },
  invoiceMonth: { type: String, required: true },
  dateFrom: { type: String },
  dateTo: { type: String },
  pocetCisel: { type: Number, default: 0 },
  celkovaNaklady: { type: Number, default: 0 },
  pocetNadlimitov: { type: Number, default: 0 },
  sumaNadlimitov: { type: Number, default: 0 },
  celkovaFirma: { type: Number, default: 0 },
  importovaneDna: { type: Date, default: Date.now },
});

MonthlyImportSchema.index({ cn: 1, invoiceYear: 1, invoiceMonth: 1 }, { unique: true });

export default mongoose.models.MonthlyImport ||
  mongoose.model<IMonthlyImport>("MonthlyImport", MonthlyImportSchema);
