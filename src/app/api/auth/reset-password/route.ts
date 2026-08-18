import { NextRequest } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { apiOk, parseJsonBody, badRequest } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "reset-pw"), 10, 60_000);
  if (!limit.allowed) {
    return badRequest("Too many requests. Please wait a minute and try again.");
  }

  const body = await parseJsonBody(request);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await connectToDatabase();
  const hashedToken = createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await UserModel.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return badRequest("Reset link is invalid or has expired. Please request a new one.");
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return apiOk({}, "Password updated successfully. You can now sign in.");
}
