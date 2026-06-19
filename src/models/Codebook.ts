import mongoose, { Schema, models, model } from "mongoose";

const CodebookSchema = new Schema(
  {
    type:  { type: String, required: true, enum: ["profileType", "department"] },
    value: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Unikátna kombinácia type + value
CodebookSchema.index({ type: 1, value: 1 }, { unique: true });

export default models.Codebook || model("Codebook", CodebookSchema);
