import { NextRequest } from "next/server";
import { apiOk, badRequest, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { TeacherModel } from "@/models/Teacher";
import { UserModel } from "@/models/User";
import { teacherFormSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const teacher = await TeacherModel.findById(id).lean();
    if (!teacher) return notFound("Teacher");
    return apiOk(teacher, "Teacher retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = teacherFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid teacher data.");
  }

  try {
    const data = parsed.data;
    const duplicate = await TeacherModel.findOne({
      _id: { $ne: id },
      $or: [{ email: data.email.toLowerCase() }, { employeeId: data.employeeId }],
    });
    if (duplicate) {
      const field = duplicate.email === data.email.toLowerCase() ? "Email" : "Employee ID";
      return badRequest(`${field} is already in use.`);
    }

    const teacher = await TeacherModel.findByIdAndUpdate(
      id,
      { ...data, phone: data.phone || "", profileImage: data.profileImage || "" },
      { new: true, runValidators: true }
    ).lean();
    if (!teacher) return notFound("Teacher");

    // Keep the linked login account in sync.
    const userUpdates: Record<string, string> = {};
    const user = await UserModel.findOne({ teacherId: teacher._id });
    if (user) {
      if (user.email !== teacher.email) userUpdates.email = teacher.email;
      if (user.name !== teacher.name) userUpdates.name = teacher.name;
      if (Object.keys(userUpdates).length > 0) {
        await UserModel.findByIdAndUpdate(user._id, userUpdates);
      }
    }

    return apiOk(teacher, "Teacher updated successfully");
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const teacher = await TeacherModel.findByIdAndDelete(id).lean();
    if (!teacher) return notFound("Teacher");

    // Deactivate (rather than delete) the linked login so attendance history stays intact.
    const user = await UserModel.findOne({ teacherId: teacher._id });
    if (user) {
      user.status = "INACTIVE";
      await user.save();
    }

    return apiOk(teacher, "Teacher deleted successfully");
  } catch {
    return serverError();
  }
}
