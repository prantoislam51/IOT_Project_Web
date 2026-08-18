import { NextRequest } from "next/server";
import { apiOk, apiCreated, badRequest, serverError, parseJsonBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { TeacherModel } from "@/models/Teacher";
import { UserModel } from "@/models/User";
import { teacherFormSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const teachers = await TeacherModel.find(filter).sort({ name: 1 }).lean();
    return apiOk(teachers, "Teachers retrieved");
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody(request);
  const parsed = teacherFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid teacher data.");
  }

  try {
    const data = parsed.data;
    const existing = await TeacherModel.findOne({
      $or: [{ email: data.email.toLowerCase() }, { employeeId: data.employeeId }],
    });
    if (existing) {
      const field = existing.email === data.email.toLowerCase() ? "Email" : "Employee ID";
      return badRequest(`${field} is already in use.`);
    }

    const teacher = await TeacherModel.create({
      ...data,
      phone: data.phone || "",
      profileImage: data.profileImage || "",
    });

    // Create the linked login account with a default password.
    const existingUser = await UserModel.findOne({ email: teacher.email });
    if (!existingUser) {
      await UserModel.create({
        email: teacher.email,
        name: teacher.name,
        role: "TEACHER",
        teacherId: teacher._id,
        passwordHash: await bcrypt.hash("Teacher@123", 12),
      });
    }

    return apiCreated(teacher, "Teacher created successfully. Default password: Teacher@123");
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return badRequest("A teacher with this email or employee ID already exists.");
    }
    return serverError();
  }
}
