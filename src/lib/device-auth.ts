import { randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { DeviceModel } from "@/models/Device";

/**
 * Device authentication for ESP32 endpoints.
 * Devices authenticate with their deviceId + per-device API key header
 * (never with MongoDB credentials).
 */
export async function authenticateDevice(
  request: NextRequest,
  deviceId: string
): Promise<
  { device: { _id: import("mongoose").Types.ObjectId; deviceId: string; status: string; name: string }; error: null } | { device: null; error: ReturnType<typeof apiError> }
> {
  await connectToDatabase();

  const apiKey =
    request.headers.get("x-api-key") ?? request.nextUrl.searchParams.get("apiKey") ?? "";

  if (!apiKey || !deviceId) {
    return { device: null, error: apiError("Missing device credentials.", 401) };
  }

  const device = await DeviceModel.findOne({ deviceId, apiKey }).lean();
  if (!device) {
    return { device: null, error: apiError("Invalid device ID or API key.", 401) };
  }
  if (device.status !== "ACTIVE") {
    return { device: null, error: apiError("Device is deactivated.", 403) };
  }

  return { device, error: null };
}

export function generateDeviceApiKey(): string {
  return randomBytes(24).toString("hex");
}

const OFFLINE_THRESHOLD_MS = 60_000;

/** A device is considered online if its heartbeat is recent. */
export function isDeviceOnline(lastSeen?: Date | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < OFFLINE_THRESHOLD_MS;
}
