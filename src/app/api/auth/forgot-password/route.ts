import { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { apiOk, parseJsonBody, badRequest } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "forgot-pw"), 5, 60_000);
  if (!limit.allowed) {
    return badRequest("Too many requests. Please wait a minute and try again.");
  }

  const body = await parseJsonBody(request);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });

  // Always respond with success to avoid account enumeration.
  if (!user || user.status !== "ACTIVE") {
    return apiOk({}, "If the account exists, a reset link has been generated.");
  }

  const rawToken = randomBytes(32).toString("hex");
  user.resetToken = createHash("sha256").update(rawToken).digest("hex");
  user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // Email delivery is not configured in this demo, so the raw link is returned.
  const origin = request.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;

  return apiOk({ resetUrl }, "If the account exists, a reset link has been generated.");
}
