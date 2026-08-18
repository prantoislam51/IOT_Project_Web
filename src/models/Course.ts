import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface CourseDoc extends Document {
  code: string;
  name: string;
  department: string;
  credits: number;
  semester: number;
  section: string;
  teacherId: Schema.Types.ObjectId;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<CourseDoc>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    credits: { type: Number, required: true, min: 0.5, max: 6, default: 3 },
    semester: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

export const CourseModel: Model<CourseDoc> =
  (models as Models).Course ?? model<CourseDoc>("Course", CourseSchema);
