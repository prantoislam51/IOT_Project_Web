import { Schema, model, type Models, type Model, type Document } from "mongoose";

export type UserRole = "ADMIN" | "TEACHER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  teacherId?: Schema.Types.ObjectId | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["ADMIN", "TEACHER"], default: "TEACHER" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel: Model<UserDoc> =
  (models as Models).User ?? model<UserDoc>("User", UserSchema);
