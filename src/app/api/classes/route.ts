import { NextRequest } from "next/server";
import { apiOk, apiCreated, badRequest, serverError, parseJsonBody } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { ClassModel } from "@/models/Class";
import { classFormSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const filter: Record<string, unknown> = {};
    // Teachers only see their own classes.
    if (session.user.role === "TEACHER" && session.user.teacherId) {
      filter.teacherId = session.user.teacherId;
    }

    const classes = await ClassModel.find(filter)
      .populate("courseId", "code name credits")
      .populate("teacherId", "name email")
      .populate("studentIds", "studentId name status")
      .populate("deviceId", "deviceId name lastSeen status")
      .sort({ name: 1 })
      .lean();

    return apiOk(classes, "Classes retrieved");
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can create classes.");
  }

  const body = await parseJsonBody(request);
  const parsed = classFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid class data.");
  }

  try {
    const data = parsed.data;
    const cls = await ClassModel.create({
      ...data,
      room: data.room || "",
      schedule: data.schedule || "",
      deviceId: data.deviceId || null,
    });
    return apiCreated(cls, "Class created successfully");
  } catch {
    return serverError();
  }
}
