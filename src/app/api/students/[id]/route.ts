import { NextRequest } from "next/server";
import { apiOk, badRequest, notFound, parseJsonBody, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { StudentModel } from "@/models/Student";
import { AttendanceRecordModel } from "@/models/AttendanceRecord";
import { studentFormSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const student = await StudentModel.findById(id).lean();
    if (!student) return notFound("Student");

    const attendance = await AttendanceRecordModel.find({ studentId: id })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    return apiOk({ student, attendance }, "Student retrieved");
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await parseJsonBody(request);
  const parsed = studentFormSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid student data.");
  }

  try {
    const data = parsed.data;
    const duplicate = await StudentModel.findOne({
      _id: { $ne: id },
      $or: [
        { studentId: data.studentId },
        ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
      ],
    });
    if (duplicate) {
      const field = duplicate.studentId === data.studentId ? "Student ID" : "Email";
      return badRequest(`${field} is already in use.`);
    }

    const student = await StudentModel.findByIdAndUpdate(
      id,
      { ...data, email: data.email || "", phone: data.phone || "", profileImage: data.profileImage || "" },
      { new: true, runValidators: true }
    ).lean();

    if (!student) return notFound("Student");
    return apiOk(student, "Student updated successfully");
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  try {
    const student = await StudentModel.findByIdAndDelete(id).lean();
    if (!student) return notFound("Student");
    return apiOk(student, "Student deleted successfully");
  } catch {
    return serverError();
  }
}
