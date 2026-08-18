import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface TeacherDoc extends Document {
  name: string;
  email: string;
  phone?: string;
  employeeId: string;
  department: string;
  profileImage?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<TeacherDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    employeeId: { type: String, required: true, unique: true, trim: true, index: true },
    department: { type: String, required: true, trim: true },
    profileImage: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

export const TeacherModel: Model<TeacherDoc> =
  (models as Models).Teacher ?? model<TeacherDoc>("Teacher", TeacherSchema);
