import { z } from "zod";

export const studentFormSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(3, "Student ID must be at least 3 characters")
    .max(20, "Student ID is too long"),
  name: z.string().trim().min(2, "Name is required").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  department: z.string().trim().min(2, "Department is required").max(60),
  program: z.string().trim().min(2, "Program is required").max(60),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().trim().min(1, "Section is required").max(10),
  profileImage: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export const teacherFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  employeeId: z.string().trim().min(2, "Employee ID is required").max(20),
  department: z.string().trim().min(2, "Department is required").max(60),
  profileImage: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export const courseFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Course code is required")
    .max(15, "Course code is too long")
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, "Course name is required").max(100),
  department: z.string().trim().min(2, "Department is required").max(60),
  credits: z.coerce.number().min(0.5).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().trim().min(1, "Section is required").max(10),
  teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Select a teacher"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const classFormSchema = z.object({
  name: z.string().trim().min(2, "Class name is required").max(80),
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Select a course"),
  teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Select a teacher"),
  studentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).default([]),
  room: z.string().trim().max(30).optional().or(z.literal("")),
  schedule: z.string().trim().max(60).optional().or(z.literal("")),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  deviceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Select a device")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT"]);

export const startSessionSchema = z.object({
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid class"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export const updateAttendanceSchema = z.object({
  statuses: z.array(
    z.object({
      studentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      status: attendanceStatusSchema,
    })
  ),
});

export const submitAttendanceSchema = z.object({
  statuses: z
    .array(
      z.object({
        studentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        status: attendanceStatusSchema,
      })
    )
    .min(1, "At least one student status is required"),
});

export const deviceFormSchema = z.object({
  deviceId: z
    .string()
    .trim()
    .min(3, "Device ID is required")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, - and _ allowed"),
  name: z.string().trim().min(2, "Device name is required").max(60),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  classId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Reset token is invalid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  profileImage: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
});

export const systemSettingsSchema = z.object({
  institutionName: z.string().trim().min(2, "Institution name is required").max(100),
  timezone: z.string().trim().min(2).max(60),
  studentDisplaySeconds: z.coerce.number().int().min(1).max(30),
  lcdTransitionMs: z.coerce.number().int().min(100).max(5000),
  successDurationSeconds: z.coerce.number().int().min(1).max(30),
  readyDurationSeconds: z.coerce.number().int().min(1).max(30),
  devicePollingMs: z.coerce.number().int().min(500).max(10000),
  defaultAttendanceStatus: z.enum(["PRESENT", "ABSENT"]),
});
