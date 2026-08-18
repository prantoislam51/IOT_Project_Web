import { NextRequest } from "next/server";
import { apiOk, badRequest, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { DeviceModel } from "@/models/Device";
import { ClassModel } from "@/models/Class";
import { deviceFormSchema } from "@/lib/validations";

const OFFLINE_THRESHOLD_MS = 60_000;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const device = await DeviceModel.findOne({ deviceId: id })
      .populate("classId", "name room courseId")
      .lean();
    if (!device) return notFound("Device");

    const online = device.lastSeen
      ? Date.now() - new Date(device.lastSeen).getTime() < OFFLINE_THRESHOLD_MS
      : false;

    return apiOk({ ...device, online }, "Device retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = deviceFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid device data.");
  }

  try {
    const device = await DeviceModel.findOne({ deviceId: id });
    if (!device) return notFound("Device");

    const previousClassId = device.classId?.toString();
    const nextClassId = parsed.data.classId || null;

    device.name = parsed.data.name;
    device.location = parsed.data.location || "";
    device.status = parsed.data.status;
    device.classId = nextClassId;
    await device.save();

    // Keep the class -> device link in sync both ways.
    if (previousClassId && previousClassId !== nextClassId) {
      await ClassModel.updateOne({ _id: previousClassId, deviceId: device._id }, { deviceId: null });
    }
    if (nextClassId) {
      await ClassModel.updateOne({ _id: nextClassId }, { deviceId: device._id });
    }

    return apiOk(device, "Device updated successfully");
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const device = await DeviceModel.findOne({ deviceId: id });
    if (!device) return notFound("Device");

    if (device.classId) {
      await ClassModel.updateOne({ _id: device.classId }, { deviceId: null });
    }
    await DeviceModel.deleteOne({ _id: device._id });

    return apiOk({}, "Device deleted successfully");
  } catch {
    return serverError();
  }
}
