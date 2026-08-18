import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface AttendanceRecordDoc extends Document {
  sessionId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  teacherId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  studentIdSnapshot: string;
  studentNameSnapshot: string;
  status: "PRESENT" | "ABSENT";
  date: string;
  markedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<AttendanceRecordDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentIdSnapshot: { type: String, required: true },
    studentNameSnapshot: { type: String, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], required: true },
    date: { type: String, required: true, index: true },
    markedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ studentId: 1, date: 1 });

export const AttendanceRecordModel: Model<AttendanceRecordDoc> =
  (models as Models).AttendanceRecord ??
  model<AttendanceRecordDoc>("AttendanceRecord", AttendanceRecordSchema);
