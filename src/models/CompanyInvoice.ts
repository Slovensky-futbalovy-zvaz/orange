import mongoose, { Schema, Document } from "mongoose";

export interface ICompanyInvoiceDetail {
  entryName: string;
  amount: number | null;
  units: number | null;
  priceWithoutVat: number;
  vat: number;
  priceWithVat: number;
}

export interface ICompanyInvoice extends Document {
  invoiceYear: string;   // "2026"
  invoiceMonth: string;  // "05"
  cn: string;            // "0252080007"
  invoiceType: string;   // "ANNEX" | "MAIN-CONS"
  userName: string;
  celkovaCena: number;
  details: ICompanyInvoiceDetail[];
  dateFrom: string;
  dateTo: string;
}

const CompanyInvoiceDetailSchema = new Schema<ICompanyInvoiceDetail>({
  entryName: String,
  amount: { type: Number, default: null },
  units: { type: Number, default: null },
  priceWithoutVat: { type: Number, default: 0 },
  vat: { type: Number, default: 23 },
  priceWithVat: { type: Number, default: 0 },
});

const CompanyInvoiceSchema = new Schema<ICompanyInvoice>({
  invoiceYear: { type: String, required: true, index: true },
  invoiceMonth: { type: String, required: true, index: true },
  cn: { type: String, required: true },
  invoiceType: { type: String, required: true },
  userName: { type: String },
  celkovaCena: { type: Number, default: 0 },
  details: [CompanyInvoiceDetailSchema],
  dateFrom: String,
  dateTo: String,
});

CompanyInvoiceSchema.index({ invoiceYear: 1, invoiceMonth: 1, invoiceType: 1 });

export default mongoose.models.CompanyInvoice ||
  mongoose.model<ICompanyInvoice>("CompanyInvoice", CompanyInvoiceSchema);
