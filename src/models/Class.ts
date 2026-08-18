import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface ClassDoc extends Document {
  name: string;
  courseId: Schema.Types.ObjectId;
  teacherId: Schema.Types.ObjectId;
  studentIds: Schema.Types.ObjectId[];
  room?: string;
  schedule?: string;
  startTime: string;
  endTime: string;
  deviceId?: Schema.Types.ObjectId | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<ClassDoc>(
  {
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    room: { type: String, trim: true, default: "" },
    schedule: { type: String, trim: true, default: "" },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

ClassSchema.index({ courseId: 1, teacherId: 1 });

export const ClassModel: Model<ClassDoc> =
  (models as Models).Class ?? model<ClassDoc>("Class", ClassSchema, "classes");
