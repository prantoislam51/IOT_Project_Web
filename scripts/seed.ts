/**
 * Seed script — populates the database with demo data:
 * admin + teacher accounts, 12 students, 4 courses, 3 classes,
 * an ESP32 device, and a week of submitted attendance history.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/smart-attendance";

// Inline minimal schemas so the script runs standalone without importing Next.js code.
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String, name: String,
  role: { type: String, enum: ["ADMIN", "TEACHER"], default: "TEACHER" },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
}, { timestamps: true });

const TeacherSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, phone: String,
  employeeId: { type: String, unique: String }, department: String,
  status: { type: String, default: "ACTIVE" },
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true }, name: String, email: String, phone: String,
  department: String, program: String, semester: Number, section: String,
  status: { type: String, default: "ACTIVE" },
}, { timestamps: true });

const CourseSchema = new mongoose.Schema({
  code: { type: String, unique: true }, name: String, department: String,
  credits: Number, semester: Number, section: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  status: { type: String, default: "ACTIVE" },
}, { timestamps: true });

const ClassSchema = new mongoose.Schema({
  name: String, courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  room: String, schedule: String, startTime: String, endTime: String,
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
  status: { type: String, default: "ACTIVE" },
}, { timestamps: true });

const sessionStudentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  studentIdSnapshot: String, studentNameSnapshot: String,
  status: { type: String, enum: ["PRESENT", "ABSENT"], default: null }, markedAt: Date,
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  date: String, startedAt: Date, submittedAt: Date,
  status: { type: String, enum: ["DRAFT", "ACTIVE", "SUBMITTED", "CANCELLED"], default: "ACTIVE" },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
  students: [sessionStudentSchema],
}, { timestamps: true });
SessionSchema.index({ classId: 1, date: 1 }, { unique: true });

const RecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession" },
  classId: mongoose.Schema.Types.ObjectId, courseId: mongoose.Schema.Types.ObjectId,
  teacherId: mongoose.Schema.Types.ObjectId, studentId: mongoose.Schema.Types.ObjectId,
  studentIdSnapshot: String, studentNameSnapshot: String,
  status: { type: String, enum: ["PRESENT", "ABSENT"] }, date: String, markedAt: Date,
}, { timestamps: true });
RecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true }, name: String, location: String,
  status: { type: String, default: "ACTIVE" }, apiKey: String,
  ipAddress: String, firmwareVersion: String, lastSeen: Date, currentState: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  commands: [],
}, { timestamps: true });

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const conn = mongoose.connection;

  console.log("Clearing existing data...");
  const collections = ["users", "teachers", "students", "courses", "classes", "attendancesessions", "attendancerecords", "devices"];
  for (const name of collections) {
    try { await conn.dropCollection(name); } catch { /* collection may not exist */ }
  }

  const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
  const Teacher = mongoose.models.Teacher ?? mongoose.model("Teacher", TeacherSchema);
  const Student = mongoose.models.Student ?? mongoose.model("Student", StudentSchema);
  const Course = mongoose.models.Course ?? mongoose.model("Course", CourseSchema);
  const Class = mongoose.models.Class ?? mongoose.model("Class", ClassSchema, "classes");
  const Session = mongoose.models.AttendanceSession ?? mongoose.model("AttendanceSession", SessionSchema);
  const Record = mongoose.models.AttendanceRecord ?? mongoose.model("AttendanceRecord", RecordSchema);
  const Device = mongoose.models.Device ?? mongoose.model("Device", DeviceSchema);

  console.log("Creating teachers...");
  const teacher = await Teacher.create([
    { name: "Dr. Shahana Akter", email: "teacher@smart.edu", employeeId: "EMP-101", department: "CSE", phone: "+8801711000001" },
  ]);
  const t1 = teacher[0];

  console.log("Creating users...");
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const teacherHash = await bcrypt.hash("Teacher@123", 12);
  await User.create([
    { email: "admin@smart.edu", passwordHash: adminHash, name: "System Administrator", role: "ADMIN" },
    { email: "teacher@smart.edu", passwordHash: teacherHash, name: "Dr. Shahana Akter", role: "TEACHER", teacherId: t1._id },
  ]);

  console.log("Creating students...");
  const names = ["Rahim Uddin", "Karim Mahmud", "Hasan Ali", "Fatema Begum", "Sumaiya Islam", "Tanvir Ahmed", "Nusrat Jahan", "Mehedi Hasan", "Rifat Chowdhury", "Sadia Afrin", "Imran Kabir", "Jannatul Ferdous"];
  const studentDocs = [];
  for (let i = 0; i < names.length; i++) {
    studentDocs.push({
      studentId: `23303${String(101 + i)}`,
      name: names[i],
      email: `student${101 + i}@smart.edu`,
      phone: `+8801710000${String(100 + i)}`,
      department: "CSE", program: "BSc in Computer Science & Engineering",
      semester: 3, section: i < 8 ? "B" : "A", status: "ACTIVE",
    });
  }
  const students = await Student.insertMany(studentDocs);

  console.log("Creating courses...");
  const courses = await Course.insertMany([
    { code: "CSC 215", name: "Data Structures", department: "CSE", credits: 3, semester: 3, section: "B", teacherId: t1._id },
    { code: "CSC 213", name: "Discrete Mathematics", department: "CSE", credits: 3, semester: 3, section: "B", teacherId: t1._id },
    { code: "CSC 217", name: "Digital Logic Design", department: "CSE", credits: 3, semester: 3, section: "B", teacherId: t1._id },
    { code: "CSC 211", name: "Object Oriented Programming", department: "CSE", credits: 3, semester: 3, section: "A", teacherId: t1._id },
  ]);

  console.log("Creating device...");
  const apiKey = randomBytes(24).toString("hex");
  const device = await Device.create({
    deviceId: "DEVICE-001", name: "Room 302 Display", location: "Room 302, Academic Building",
    status: "ACTIVE", apiKey, firmwareVersion: "1.0.0",
    ipAddress: "192.168.1.50", lastSeen: new Date(), currentState: "READY",
  });

  console.log("Creating classes...");
  const sectionB = students.filter((s) => s.section === "B");
  const sectionA = students.filter((s) => s.section === "A");
  const classes = await Class.insertMany([
    { name: "CSC 215 — Section B", courseId: courses[0]._id, teacherId: t1._id, studentIds: sectionB.map((s) => s._id), room: "302", schedule: "Sun & Tue", startTime: "09:00", endTime: "10:30", deviceId: device._id },
    { name: "CSC 213 — Section B", courseId: courses[1]._id, teacherId: t1._id, studentIds: sectionB.map((s) => s._id), room: "303", schedule: "Mon & Wed", startTime: "11:00", endTime: "12:30" },
    { name: "CSC 211 — Section A", courseId: courses[3]._id, teacherId: t1._id, studentIds: sectionA.map((s) => s._id), room: "401", schedule: "Thu", startTime: "14:00", endTime: "15:30" },
  ]);

  console.log("Creating attendance history (past 7 days)...");
  const dayKey = (offsetDays: number) => {
    const d = new Date(Date.now() - offsetDays * 86400000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  };

  let sessionsCreated = 0;
  for (let offset = 7; offset >= 1; offset--) {
    const date = dayKey(offset);
    const dow = new Date(`${date}T00:00:00+06:00`).getDay(); // 0=Sun
    const classesToday = classes.filter((c) =>
      (c.schedule.includes("Sun") && dow === 0) || (c.schedule.includes("Tue") && dow === 2) ||
      (c.schedule.includes("Mon") && dow === 1) || (c.schedule.includes("Wed") && dow === 3) ||
      (c.schedule.includes("Thu") && dow === 4)
    );
    for (const c of classesToday) {
      const roster = students.filter((s) => c.studentIds.includes(s._id));
      const entries = roster.map((s, idx) => ({
        studentId: s._id, studentIdSnapshot: s.studentId, studentNameSnapshot: s.name,
        status: (idx % 10 < 8 ? "PRESENT" : "ABSENT") as "PRESENT" | "ABSENT",
        markedAt: new Date(`${date}T10:00:00+06:00`),
      }));
      const session = await Session.create({
        classId: c._id, courseId: c.courseId, teacherId: c.teacherId, date,
        startedAt: new Date(`${date}T09:00:00+06:00`), submittedAt: new Date(`${date}T10:00:00+06:00`),
        status: "SUBMITTED", deviceId: c.deviceId ?? null, students: entries,
      });
      await Record.insertMany(entries.map((e) => ({
        sessionId: session._id, classId: c._id, courseId: c.courseId, teacherId: c.teacherId,
        studentId: e.studentId, studentIdSnapshot: e.studentIdSnapshot, studentNameSnapshot: e.studentNameSnapshot,
        status: e.status, date, markedAt: e.markedAt,
      })));
      sessionsCreated++;
    }
  }

  console.log("\n==========================================");
  console.log("  Seed completed successfully!");
  console.log("==========================================");
  console.log(`Users:        2 (admin + teacher)`);
  console.log(`Teachers:     1`);
  console.log(`Students:     ${students.length}`);
  console.log(`Courses:      ${courses.length}`);
  console.log(`Classes:      ${classes.length}`);
  console.log(`Devices:      1`);
  console.log(`Sessions:     ${sessionsCreated} (submitted history)`);
  console.log("\nLogin credentials:");
  console.log("  Admin:    admin@smart.edu    / Admin@123");
  console.log("  Teacher:  teacher@smart.edu  / Teacher@123");
  console.log(`\nDevice API key (DEVICE-001): ${apiKey}`);
  console.log("  → put this into esp32-attendance-display/include/config.h");
  console.log("==========================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
