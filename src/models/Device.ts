import { Schema, model, type Models, type Model, type Document } from "mongoose";

export type DeviceCommandType =
  | "ATTENDANCE_STARTED"
  | "ATTENDANCE_COMPLETED"
  | "DISPLAY_MESSAGE"
  | "RESTART"
  | "UPDATE_CONFIG";

export interface DeviceCommand {
  type: DeviceCommandType;
  sessionId?: string | null;
  message?: string;
  createdAt: Date;
}

export interface DeviceDoc extends Document {
  deviceId: string;
  name: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE";
  apiKey: string;
  ipAddress?: string;
  firmwareVersion?: string;
  lastSeen?: Date | null;
  currentState?: string;
  classId?: Schema.Types.ObjectId | null;
  commands: DeviceCommand[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceCommandSchema = new Schema(
  {
    type: { type: String, enum: ["ATTENDANCE_STARTED", "ATTENDANCE_COMPLETED", "DISPLAY_MESSAGE", "RESTART", "UPDATE_CONFIG"], required: true },
    sessionId: { type: String, default: null },
    message: { type: String, default: "" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const DeviceSchema = new Schema<DeviceDoc>(
  {
    deviceId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    apiKey: { type: String, required: true, index: true },
    ipAddress: { type: String, default: "" },
    firmwareVersion: { type: String, default: "" },
    lastSeen: { type: Date, default: null, index: true },
    currentState: { type: String, default: "" },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    commands: { type: [DeviceCommandSchema], default: [] },
  },
  { timestamps: true }
);

export const DeviceModel: Model<DeviceDoc> =
  (models as Models).Device ?? model<DeviceDoc>("Device", DeviceSchema);
