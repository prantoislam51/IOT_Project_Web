import { NextRequest } from "next/server";
import { apiOk, serverError } from "@/lib/api";
import { authenticateDevice } from "@/lib/device-auth";
import { DeviceModel } from "@/models/Device";
import { getSystemSettings } from "@/models/Setting";

type Params = { params: Promise<{ id: string }> };

/**
 * ESP32 polls this endpoint while active. Returns pending commands and
 * clears them (delivered), plus the current display timing configuration.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { device, error: authError } = await authenticateDevice(request, id);
  if (authError) return authError;

  try {
    const doc = await DeviceModel.findById(device._id).lean();
    const commands = doc?.commands ?? [];

    if (commands.length > 0) {
      await DeviceModel.updateOne({ _id: device._id }, { $set: { commands: [] } });
    }

    const settings = await getSystemSettings();

    return apiOk(
      {
        commands: commands.map((c) => ({
          type: c.type,
          sessionId: c.sessionId ?? null,
          message: c.message ?? "",
          createdAt: c.createdAt,
        })),
        config: {
          studentDisplaySeconds: settings.studentDisplaySeconds,
          lcdTransitionMs: settings.lcdTransitionMs,
          successDurationSeconds: settings.successDurationSeconds,
          readyDurationSeconds: settings.readyDurationSeconds,
          defaultAttendanceStatus: settings.defaultAttendanceStatus,
        },
      },
      `${commands.length} command(s) delivered`
    );
  } catch {
    return serverError();
  }
}
