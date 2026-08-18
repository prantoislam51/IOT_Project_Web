import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface StudentDoc extends Document {
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  department: string;
  program: string;
  semester: number;
  section: string;
  profileImage?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<StudentDoc>(
  {
    studentId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: "", index: true },
    phone: { type: String, trim: true, default: "" },
    department: { type: String, required: true, trim: true, index: true },
    program: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, required: true, trim: true, index: true },
    profileImage: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

StudentSchema.index({ department: 1, semester: 1, section: 1 });

export const StudentModel: Model<StudentDoc> =
  (models as Models).Student ?? model<StudentDoc>("Student", StudentSchema);
