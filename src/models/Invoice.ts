import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceDetail {
  entryName: string;
  amount: number | null;
  units: number | null;
  priceWithoutVat: number;
  vat: number;
  priceWithVat: number;
}

export interface IInvoice extends Document {
  cn: string;            // číslo zákazníka (spoločnosť)
  invoiceYear: string;   // "2026"
  invoiceMonth: string;  // "05"
  serviceIdentification: string; // "0902198279"
  userName: string;      // meno z Orange
  personId: mongoose.Types.ObjectId | null;
  personName: string | null;
  profileType: string | null;
  department: string | null;
  monthlyServiceLimit: number | null;
  celkovaCena: number;   // price-without-vat z <invoice>
  overTheLimit: number;  // max(0, celkovaCena - monthlyServiceLimit)
  details: IInvoiceDetail[];
  dateFrom: string;
  dateTo: string;
}

const InvoiceDetailSchema = new Schema<IInvoiceDetail>({
  entryName: String,
  amount: { type: Number, default: null },
  units: { type: Number, default: null },
  priceWithoutVat: { type: Number, default: 0 },
  vat: { type: Number, default: 23 },
  priceWithVat: { type: Number, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>({
  cn: { type: String, required: true, index: true },
  invoiceYear: { type: String, required: true, index: true },
  invoiceMonth: { type: String, required: true, index: true },
  serviceIdentification: { type: String, required: true },
  userName: { type: String },
  personId: { type: Schema.Types.ObjectId, ref: "Person", default: null },
  personName: { type: String, default: null },
  profileType: { type: String, default: null },
  department: { type: String, default: null },
  monthlyServiceLimit: { type: Number, default: null },
  celkovaCena: { type: Number, default: 0 },
  overTheLimit: { type: Number, default: 0 },
  details: [InvoiceDetailSchema],
  dateFrom: String,
  dateTo: String,
});

InvoiceSchema.index({ cn: 1, invoiceYear: 1, invoiceMonth: 1, serviceIdentification: 1 }, { unique: true });
InvoiceSchema.index({ cn: 1, invoiceYear: 1, invoiceMonth: 1, department: 1 });
InvoiceSchema.index({ cn: 1, invoiceYear: 1, invoiceMonth: 1, overTheLimit: -1 });
InvoiceSchema.index({ serviceIdentification: 1 });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
