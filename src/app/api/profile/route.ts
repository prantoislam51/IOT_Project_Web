import { NextRequest } from "next/server";
import { apiOk, badRequest, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { UserModel } from "@/models/User";
import bcrypt from "bcryptjs";
import { changePasswordSchema, profileSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  try {
    const user = await UserModel.findById(session.user.id).select("name email phone role").lean();
    if (!user) return badRequest("User not found.");
    return apiOk(user);
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await parseJsonBody(request);
  if (!body) return badRequest("Invalid request.");

  // Profile update
  if (body.type === "profile") {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid profile data.");
    try {
      await UserModel.findByIdAndUpdate(session.user.id, parsed.data);
      return apiOk({}, "Profile updated.");
    } catch {
      return serverError();
    }
  }

  // Password change
  if (body.type === "password") {
    const { currentPassword, newPassword, confirmPassword } = body;
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
    try {
      const user = await UserModel.findById(session.user.id);
      if (!user) return badRequest("User not found.");
      const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
      if (!valid) return badRequest("Current password is incorrect.");
      user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      await user.save();
      return apiOk({}, "Password changed successfully.");
    } catch {
      return serverError();
    }
  }

  return badRequest("Invalid request type.");
}
