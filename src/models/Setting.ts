import { Schema, model, type Models, type Model, type Document } from "mongoose";

export interface SystemSettings {
  institutionName: string;
  timezone: string;
  studentDisplaySeconds: number;
  lcdTransitionMs: number;
  successDurationSeconds: number;
  readyDurationSeconds: number;
  devicePollingMs: number;
  defaultAttendanceStatus: "PRESENT" | "ABSENT";
}

export interface SettingDoc extends Document {
  key: string;
  settings: SystemSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  institutionName: "Smart Institute of Technology",
  timezone: "Asia/Dhaka",
  studentDisplaySeconds: 4,
  lcdTransitionMs: 500,
  successDurationSeconds: 3,
  readyDurationSeconds: 3,
  devicePollingMs: 2000,
  defaultAttendanceStatus: "PRESENT",
};

const SettingSchema = new Schema<SettingDoc>(
  {
    key: { type: String, required: true, unique: true },
    settings: {
      institutionName: { type: String, default: DEFAULT_SYSTEM_SETTINGS.institutionName },
      timezone: { type: String, default: DEFAULT_SYSTEM_SETTINGS.timezone },
      studentDisplaySeconds: { type: Number, default: DEFAULT_SYSTEM_SETTINGS.studentDisplaySeconds },
      lcdTransitionMs: { type: Number, default: DEFAULT_SYSTEM_SETTINGS.lcdTransitionMs },
      successDurationSeconds: { type: Number, default: DEFAULT_SYSTEM_SETTINGS.successDurationSeconds },
      readyDurationSeconds: { type: Number, default: DEFAULT_SYSTEM_SETTINGS.readyDurationSeconds },
      devicePollingMs: { type: Number, default: DEFAULT_SYSTEM_SETTINGS.devicePollingMs },
      defaultAttendanceStatus: {
        type: String,
        enum: ["PRESENT", "ABSENT"],
        default: DEFAULT_SYSTEM_SETTINGS.defaultAttendanceStatus,
      },
    },
  },
  { timestamps: true }
);

export const SettingModel: Model<SettingDoc> =
  (models as Models).Setting ?? model<SettingDoc>("Setting", SettingSchema);

export async function getSystemSettings(): Promise<SystemSettings> {
  const doc = await SettingModel.findOne({ key: "system" }).lean();
  if (!doc) return DEFAULT_SYSTEM_SETTINGS;
  return { ...DEFAULT_SYSTEM_SETTINGS, ...doc.settings };
}
