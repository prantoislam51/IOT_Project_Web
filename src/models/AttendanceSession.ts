import { Schema, model, type Models, type Model, type Document } from "mongoose";

export type AttendanceStatus = "PRESENT" | "ABSENT";
export type SessionStatus = "DRAFT" | "ACTIVE" | "SUBMITTED" | "CANCELLED";

export interface SessionStudentEntry {
  studentId: Schema.Types.ObjectId;
  studentIdSnapshot: string;
  studentNameSnapshot: string;
  status: AttendanceStatus | null;
  markedAt: Date | null;
}

export interface AttendanceSessionDoc extends Document {
  classId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  teacherId: Schema.Types.ObjectId;
  date: string;
  startedAt: Date;
  submittedAt: Date | null;
  status: SessionStatus;
  deviceId?: Schema.Types.ObjectId | null;
  students: SessionStudentEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const SessionStudentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentIdSnapshot: { type: String, required: true },
    studentNameSnapshot: { type: String, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], default: null },
    markedAt: { type: Date, default: null },
  },
  { _id: false }
);

const AttendanceSessionSchema = new Schema<AttendanceSessionDoc>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    date: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true, default: () => new Date() },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "SUBMITTED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", default: null },
    students: { type: [SessionStudentSchema], default: [] },
  },
  { timestamps: true }
);

AttendanceSessionSchema.index({ classId: 1, date: 1 }, { unique: true });

export const AttendanceSessionModel: Model<AttendanceSessionDoc> =
  (models as Models).AttendanceSession ??
  model<AttendanceSessionDoc>("AttendanceSession", AttendanceSessionSchema);
