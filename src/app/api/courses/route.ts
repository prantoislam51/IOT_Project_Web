import { NextRequest } from "next/server";
import { apiOk, apiCreated, badRequest, serverError, parseJsonBody } from "@/lib/api";
import { requireSession } from "@/lib/auth-guard";
import { CourseModel } from "@/models/Course";
import { courseFormSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();
    const teacherId = searchParams.get("teacherId");

    const filter: Record<string, unknown> = {};
    if (teacherId) filter.teacherId = teacherId;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await CourseModel.find(filter)
      .populate("teacherId", "name email")
      .sort({ code: 1 })
      .lean();

    return apiOk(courses, "Courses retrieved");
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return badRequest("Only admins can create courses.");
  }

  const body = await parseJsonBody(request);
  const parsed = courseFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid course data.");
  }

  try {
    const course = await CourseModel.create(parsed.data);
    return apiCreated(course, "Course created successfully");
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return badRequest("A course with this code already exists.");
    }
    return serverError();
  }
}
