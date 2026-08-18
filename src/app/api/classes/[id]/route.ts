import { NextRequest } from "next/server";
import { apiOk, badRequest, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { ClassModel } from "@/models/Class";
import { classFormSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  try {
    const cls = await ClassModel.findById(id)
      .populate("courseId", "code name credits semester section")
      .populate("teacherId", "name email department")
      .populate("studentIds", "studentId name email status profileImage department program section")
      .populate("deviceId", "deviceId name status lastSeen");
    if (!cls) return notFound("Class");

    if (
      session.user.role === "TEACHER" &&
      session.user.teacherId &&
      cls.teacherId._id.toString() !== session.user.teacherId
    ) {
      return badRequest("You are not assigned to this class.");
    }

    return apiOk(cls, "Class retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can update classes.");
  }
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = classFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid class data.");
  }

  try {
    const data = parsed.data;
    const cls = await ClassModel.findByIdAndUpdate(
      id,
      {
        ...data,
        room: data.room || "",
        schedule: data.schedule || "",
        deviceId: data.deviceId || null,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!cls) return notFound("Class");
    return apiOk(cls, "Class updated successfully");
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can delete classes.");
  }
  const { id } = await params;

  try {
    const cls = await ClassModel.findByIdAndDelete(id).lean();
    if (!cls) return notFound("Class");
    return apiOk(cls, "Class deleted successfully");
  } catch {
    return serverError();
  }
}
