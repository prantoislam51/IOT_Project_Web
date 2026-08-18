import { NextRequest } from "next/server";
import { apiOk, apiCreated, badRequest, serverError, parseJsonBody } from "@/lib/api";
import { requireSession, requireAdmin } from "@/lib/auth-guard";
import { StudentModel } from "@/models/Student";
import { studentFormSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const section = searchParams.get("section");
    const department = searchParams.get("department");
    const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (section) filter.section = section;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const students = await StudentModel.find(filter)
      .sort({ studentId: 1 })
      .limit(limit)
      .lean();

    return apiOk(students, "Students retrieved");
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody(request);
  const parsed = studentFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid student data.");
  }

  try {
    const data = parsed.data;
    const existing = await StudentModel.findOne({
      $or: [{ studentId: data.studentId }, ...(data.email ? [{ email: data.email.toLowerCase() }] : [])],
    });
    if (existing) {
      const field = existing.studentId === data.studentId ? "Student ID" : "Email";
      return badRequest(`${field} is already in use.`);
    }

    const student = await StudentModel.create({
      ...data,
      email: data.email || "",
      phone: data.phone || "",
      profileImage: data.profileImage || "",
    });

    return apiCreated(student, "Student created successfully");
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return badRequest("A student with this ID or email already exists.");
    }
    return serverError();
  }
}
