import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  cn: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    cn: { type: String, required: true, unique: true, trim: true },
    companyName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Company ||
  mongoose.model<ICompany>("Company", CompanySchema);
