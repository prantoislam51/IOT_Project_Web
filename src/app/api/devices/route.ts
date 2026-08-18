import { NextRequest } from "next/server";
import { apiOk, apiCreated, badRequest, serverError, parseJsonBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { DeviceModel } from "@/models/Device";
import { ClassModel } from "@/models/Class";
import { deviceFormSchema } from "@/lib/validations";
import { generateDeviceApiKey, isDeviceOnline } from "@/lib/device-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const devices = await DeviceModel.find()
      .populate("classId", "name room")
      .sort({ deviceId: 1 })
      .lean();

    const withStatus = devices.map((d) => ({
      ...d,
      online: isDeviceOnline(d.lastSeen),
    }));

    return apiOk(withStatus, "Devices retrieved");
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody(request);
  const parsed = deviceFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid device data.");
  }

  try {
    const existing = await DeviceModel.findOne({ deviceId: parsed.data.deviceId });
    if (existing) {
      return badRequest("A device with this ID already exists.");
    }

    const apiKey = generateDeviceApiKey();
    const device = await DeviceModel.create({
      deviceId: parsed.data.deviceId,
      name: parsed.data.name,
      location: parsed.data.location || "",
      status: parsed.data.status,
      apiKey,
      classId: parsed.data.classId || null,
    });

    // Two-way link: class -> device (used to route attendance commands).
    if (parsed.data.classId) {
      await ClassModel.updateOne({ _id: parsed.data.classId }, { deviceId: device._id });
    }

    return apiCreated(
      { ...device.toObject(), apiKey },
      "Device registered. Copy the API key — it is shown only once."
    );
  } catch {
    return serverError();
  }
}
