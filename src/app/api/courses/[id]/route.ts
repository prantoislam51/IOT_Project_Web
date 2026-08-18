import { NextRequest } from "next/server";
import { apiOk, badRequest, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { CourseModel } from "@/models/Course";
import { courseFormSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  try {
    const course = await CourseModel.findById(id)
      .populate("teacherId", "name email department")
      .lean();
    if (!course) return notFound("Course");
    return apiOk(course, "Course retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can update courses.");
  }
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = courseFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid course data.");
  }

  try {
    const course = await CourseModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!course) return notFound("Course");
    return apiOk(course, "Course updated successfully");
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return badRequest("A course with this code already exists.");
    }
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can delete courses.");
  }
  const { id } = await params;

  try {
    const course = await CourseModel.findByIdAndDelete(id).lean();
    if (!course) return notFound("Course");
    return apiOk(course, "Course deleted successfully");
  } catch {
    return serverError();
  }
}
