import { describe, it, expect } from "vitest";
import {
  studentFormSchema,
  loginSchema,
  deviceFormSchema,
  courseFormSchema,
  startSessionSchema,
  submitAttendanceSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123456" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "123456" }).success).toBe(false);
  });
  it("rejects short password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123" }).success).toBe(false);
  });
});

describe("studentFormSchema", () => {
  const valid = {
    studentId: "23303101",
    name: "Rahim Uddin",
    department: "CSE",
    program: "BSc CSE",
    semester: 3,
    section: "B",
    status: "ACTIVE",
  };
  it("accepts a valid student", () => {
    expect(studentFormSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a short student ID", () => {
    expect(studentFormSchema.safeParse({ ...valid, studentId: "12" }).success).toBe(false);
  });
  it("rejects semester out of range", () => {
    expect(studentFormSchema.safeParse({ ...valid, semester: 13 }).success).toBe(false);
  });
  it("rejects an invalid email but allows empty", () => {
    expect(studentFormSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
  });
});

describe("courseFormSchema", () => {
  it("accepts a valid course", () => {
    expect(
      courseFormSchema.safeParse({
        code: "csc 215",
        name: "Data Structures",
        department: "CSE",
        credits: 3,
        semester: 3,
        section: "B",
        teacherId: "507f1f77bcf86cd799439011",
        status: "ACTIVE",
      }).success
    ).toBe(true);
  });
  it("uppercases the course code", () => {
    const result = courseFormSchema.parse({
      code: "csc 215",
      name: "Data Structures",
      department: "CSE",
      credits: 3,
      semester: 3,
      section: "B",
      teacherId: "507f1f77bcf86cd799439011",
      status: "ACTIVE",
    });
    expect(result.code).toBe("CSC 215");
  });
});

describe("deviceFormSchema", () => {
  it("accepts a valid device ID", () => {
    expect(
      deviceFormSchema.safeParse({ deviceId: "DEVICE-001", name: "Room 302", status: "ACTIVE" }).success
    ).toBe(true);
  });
  it("rejects device IDs with spaces", () => {
    expect(
      deviceFormSchema.safeParse({ deviceId: "DEVICE 001", name: "Room 302", status: "ACTIVE" }).success
    ).toBe(false);
  });
});

describe("startSessionSchema", () => {
  it("requires a valid ObjectId classId", () => {
    expect(startSessionSchema.safeParse({ classId: "abc" }).success).toBe(false);
    expect(startSessionSchema.safeParse({ classId: "507f1f77bcf86cd799439011" }).success).toBe(true);
  });
  it("accepts an optional YYYY-MM-DD date", () => {
    expect(startSessionSchema.safeParse({ classId: "507f1f77bcf86cd799439011", date: "2026-08-18" }).success).toBe(true);
    expect(startSessionSchema.safeParse({ classId: "507f1f77bcf86cd799439011", date: "18/08/2026" }).success).toBe(false);
  });
});

describe("submitAttendanceSchema", () => {
  it("requires at least one status entry", () => {
    expect(submitAttendanceSchema.safeParse({ statuses: [] }).success).toBe(false);
  });
  it("only accepts PRESENT or ABSENT", () => {
    expect(
      submitAttendanceSchema.safeParse({
        statuses: [{ studentId: "507f1f77bcf86cd799439011", status: "LATE" }],
      }).success
    ).toBe(false);
  });
});
