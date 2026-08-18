import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, badRequest, parseJsonBody, serverError } from "@/lib/api";
import { authenticateDevice } from "@/lib/device-auth";
import { rateLimit } from "@/lib/rate-limit";
import { DeviceModel } from "@/models/Device";

type Params = { params: Promise<{ id: string }> };

const heartbeatSchema = z.object({
  ip: z.string().max(45).optional(),
  firmwareVersion: z.string().max(20).optional(),
  state: z.string().max(30).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { device, error: authError } = await authenticateDevice(request, id);
  if (authError) return authError;

  const limit = rateLimit(`heartbeat:${device.deviceId}`, 30, 60_000);
  if (!limit.allowed) return badRequest("Heartbeat rate limit exceeded.");

  const body = await parseJsonBody(request);
  const parsed = heartbeatSchema.safeParse(body ?? {});

  try {
    const updates: Record<string, unknown> = { lastSeen: new Date() };
    if (parsed.success) {
      if (parsed.data.ip) updates.ipAddress = parsed.data.ip;
      if (parsed.data.firmwareVersion) updates.firmwareVersion = parsed.data.firmwareVersion;
      if (parsed.data.state) updates.currentState = parsed.data.state;
    }

    const updated = await DeviceModel.findByIdAndUpdate(device._id, updates, { new: true }).lean();

    return apiOk(
      { deviceId: updated?.deviceId, lastSeen: updated?.lastSeen },
      "Heartbeat received"
    );
  } catch {
    return serverError();
  }
}
