import { NextRequest } from "next/server";
import { apiOk, badRequest, parseJsonBody, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { SettingModel, getSystemSettings } from "@/models/Setting";
import { systemSettingsSchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const settings = await getSystemSettings();
    return apiOk(settings, "Settings retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody(request);
  const parsed = systemSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid settings.");
  }

  try {
    await SettingModel.findOneAndUpdate(
      { key: "system" },
      { $set: { settings: parsed.data } },
      { upsert: true, new: true }
    );
    return apiOk(parsed.data, "Settings updated successfully");
  } catch {
    return serverError();
  }
}
