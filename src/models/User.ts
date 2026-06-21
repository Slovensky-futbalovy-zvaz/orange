import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  status: "pending" | "active";
  companies: string[]; // CN kódy spoločností; prázdne pole = žiadne (pre admin sa ignoruje)
  complexOverview: boolean; // prístup ku Komplexnému prehľadu (admin ho má vždy)
  magicToken: string | null;
  magicTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "user"], required: true },
    status: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },
    companies: [{ type: String }],
    complexOverview: { type: Boolean, default: false },
    magicToken: { type: String, default: null },
    magicTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
