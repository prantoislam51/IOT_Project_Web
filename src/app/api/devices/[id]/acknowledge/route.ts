import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, badRequest, parseJsonBody } from "@/lib/api";
import { authenticateDevice } from "@/lib/device-auth";
import { DeviceModel } from "@/models/Device";

type Params = { params: Promise<{ id: string }> };

const ackSchema = z.object({
  commandType: z.string().max(40).optional(),
  sessionId: z.string().max(40).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { device, error: authError } = await authenticateDevice(request, id);
  if (authError) return authError;

  const body = await parseJsonBody(request);
  const parsed = ackSchema.safeParse(body ?? {});
  if (!parsed.success) return badRequest("Invalid acknowledge payload.");

  await DeviceModel.updateOne({ _id: device._id }, { $set: { lastSeen: new Date() } });

  return apiOk({ acknowledged: true }, "Command acknowledged");
}
