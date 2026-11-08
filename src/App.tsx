
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  ClipboardCheck, Settings, Search, Plus, Clock, MapPin,
  CheckCircle2, Pencil, Trash2, X, Save, LogOut, User,
  Mail, Lock, AlertTriangle, History, Printer
} from "lucide-react";
import "./App.css";

// ==========================================
// DATA TYPES
// Defines the structure of courses, accounts, timetable slots,
// assignments, makeup classes, attendance and CSV preview rows.
// ==========================================
type Course = {
  id: number;
  code: string;
  name: string;
  color: string;
};

type Account = {
  name: string;
  email: string;
  password: string;
};

type Slot = {
  id: number;
  courseId: number;
  day: string;
  start: string;
  end: string;
  room: string;
};

type CsvPreviewRow = {
  courseCode: string;
  day: string;
  start: string;
  end: string;
  room: string;
  valid: boolean;
  error: string;
};

type Assignment = {
  id: number;
  title: string;
  courseId: number;
  type: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
};

type MakeupClass = {
  id: number;
  courseId: number;
  date: string;
  start: string;
  end: string;
  room: string;
  note: string;
};

type AttendanceRecord = {
  id: number;
  courseId: number;
  date: string;
  status: "Present" | "Absent";
};

// ==========================================
// DEFAULT DATA & CONSTANTS
// Initial sample courses and weekdays used by the timetable.
// ==========================================
const initialCourses: Course[] = [
  { id: 1, code: "CS301", name: "Data Warehousing", color: "#8974e8" },
  { id: 2, code: "CS402", name: "Deep Learning", color: "#55a8e9" },
  { id: 3, code: "CS305", name: "Web Programming", color: "#efa45f" }
];

const weekdays = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

// ==========================================
// LOCAL STORAGE HELPER
// Loads saved application data and safely uses fallback data if needed.
// ==========================================
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  // ==========================================
  // APPLICATION STATE
  // Stores account details, academic records, form values and active page.
  // ==========================================
  const [accounts, setAccounts] = useState<Account[]>(() =>
    readStorage("semestersync_accounts", [])
  );

  const [currentUser, setCurrentUser] = useState<Account | null>(() =>
    readStorage<Account | null>("semestersync_user", null)
  );

  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [courses, setCourses] = useState<Course[]>(() =>
    readStorage("semestersync_courses", initialCourses)
  );

  const [slots, setSlots] = useState<Slot[]>(() =>
    readStorage("semestersync_slots", [])
  );

  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    readStorage("semestersync_assignments", [])
  );

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    readStorage("semestersync_attendance", [])
  );

  const [makeupClasses, setMakeupClasses] = useState<MakeupClass[]>(() =>
    readStorage("semestersync_makeup_classes", [])
  );
  const [makeupCourse, setMakeupCourse] = useState("");
  const [makeupDate, setMakeupDate] = useState("");
  const [makeupStart, setMakeupStart] = useState("09:00");
  const [makeupEnd, setMakeupEnd] = useState("10:00");
  const [makeupRoom, setMakeupRoom] = useState("");
  const [makeupNote, setMakeupNote] = useState("");
  const [makeupError, setMakeupError] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [settingsName, setSettingsName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseColor, setCourseColor] = useState("#8974e8");

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [slotCourse, setSlotCourse] = useState("");
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slotRoom, setSlotRoom] = useState("");
  const [slotError, setSlotError] = useState("");
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourse, setAssignmentCourse] = useState("");
  const [assignmentType, setAssignmentType] = useState("Assignment");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [assignmentTime, setAssignmentTime] = useState("23:59");

  const [attendanceCourse, setAttendanceCourse] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [historyCourseFilter, setHistoryCourseFilter] = useState("all");

  // ==========================================
  // DATA PERSISTENCE
  // Keeps account and academic data saved in the browser between visits.
  // ==========================================
  useEffect(() => {
    localStorage.setItem("semestersync_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("semestersync_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("semestersync_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("semestersync_slots", JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem("semestersync_assignments", JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem("semestersync_attendance", JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem("semestersync_makeup_classes", JSON.stringify(makeupClasses));
  }, [makeupClasses]);

  useEffect(() => {
    if (currentUser) {
      setSettingsName(currentUser.name);
      setSettingsEmail(currentUser.email);
    }
  }, [currentUser]);

  // ==========================================
  // SHARED HELPERS & DASHBOARD CALCULATIONS
  // Looks up courses and prepares today's schedule, task status and attendance totals.
  // ==========================================
  const getCourse = (id: number) =>
    courses.find(course => course.id === id);

  // Current date and time
  const now = new Date();

  const todayName = now.toLocaleDateString("en-US", {
    weekday: "long"
  });

  const todayDateString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const currentTimeString = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0")
  ].join(":");

  const todaySlots = slots
    .filter(slot => slot.day === todayName)
    .sort((a, b) => a.start.localeCompare(b.start));

  // Today's one-time makeup classes
  const todayMakeupClasses = makeupClasses
    .filter(item => item.date === todayDateString)
    .sort((a, b) => a.start.localeCompare(b.start));

  // Total regular and makeup classes for today
  const todayClassesCount = todaySlots.length + todayMakeupClasses.length;

  // Combine both class types and sort them by start time
  const todaySchedule = [
    ...todaySlots.map(slot => ({
      id: slot.id,
      courseId: slot.courseId,
      start: slot.start,
      end: slot.end,
      room: slot.room,
      type: "Class"
    })),
    ...todayMakeupClasses.map(item => ({
      id: item.id,
      courseId: item.courseId,
      start: item.start,
      end: item.end,
      room: item.room,
      type: "Makeup"
    }))
  ].sort((a, b) => a.start.localeCompare(b.start));

  const pendingAssignments = assignments.filter(
    item => !item.completed
  );

  // Check whether a pending assignment is overdue
  const isOverdue = (item: Assignment) => {
    if (!item.dueDate) return false;

    if (item.dueDate < todayDateString) return true;

    if (item.dueDate === todayDateString) {
      return item.dueTime < currentTimeString;
    }

    return false;
  };

  // Pending deadlines whose due date/time has passed
  const overdueAssignments = pendingAssignments
    .filter(isOverdue)
    .sort((a, b) =>
      `${a.dueDate} ${a.dueTime}`.localeCompare(
        `${b.dueDate} ${b.dueTime}`
      )
    );

  // Pending deadlines that are still upcoming
  const upcomingAssignments = pendingAssignments
    .filter(item => !isOverdue(item))
    .sort((a, b) =>
      `${a.dueDate} ${a.dueTime}`.localeCompare(
        `${b.dueDate} ${b.dueTime}`
      )
    );

  const filteredAssignments = [...assignments]
    .filter(item => {
      if (assignmentFilter === "completed") return item.completed;
      if (assignmentFilter === "pending") return !item.completed && !isOverdue(item);
      if (assignmentFilter === "overdue") return !item.completed && isOverdue(item);
      return true;
    })
    .sort((a, b) => `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`));

  const attendancePercentage = (courseId?: number) => {
    const records = attendance.filter(record =>
      courseId === undefined || record.courseId === courseId
    );

    if (!records.length) return 0;

    const present = records.filter(
      record => record.status === "Present"
    ).length;

    return Math.round((present / records.length) * 100);
  };

  // ==========================================
  // LOGIN, SIGNUP & LOGOUT
  // Creates accounts, validates login details and manages the active session.
  // ==========================================
  const handleAuth = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");

    if (authPage === "signup") {
      if (authPassword !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }

      if (accounts.some(account =>
        account.email.toLowerCase() === authEmail.trim().toLowerCase()
      )) {
        setAuthError("An account with this email already exists.");
        return;
      }

      const newAccount: Account = {
        name: authName.trim(),
        email: authEmail.trim().toLowerCase(),
        password: authPassword
      };

      setAccounts(previous => [...previous, newAccount]);
      setCurrentUser(newAccount);
      setActivePage("Dashboard");
    } else {
      const account = accounts.find(item =>
        item.email.toLowerCase() === authEmail.trim().toLowerCase() &&
        item.password === authPassword
      );

      if (!account) {
        setAuthError("Incorrect email or password.");
        return;
      }

      setCurrentUser(account);
      setActivePage("Dashboard");
    }

    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setConfirmPassword("");
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePage("Dashboard");
    setAuthPage("login");
    setAuthError("");
  };

  // ==========================================
  // COURSE MANAGEMENT
  // Adds, edits and deletes courses and removes their related academic records.
  // ==========================================
  const openCourseForm = (course?: Course) => {
    setEditingCourseId(course?.id ?? null);
    setCourseName(course?.name ?? "");
    setCourseCode(course?.code ?? "");
    setCourseColor(course?.color ?? "#8974e8");
    setShowCourseModal(true);
  };

  const saveCourse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (courses.some(course =>
      course.code.toLowerCase() === courseCode.trim().toLowerCase() &&
      course.id !== editingCourseId
    )) {
      alert("A course with this code already exists.");
      return;
    }

    if (editingCourseId !== null) {
      setCourses(previous => previous.map(course =>
        course.id === editingCourseId
          ? {
              ...course,
              name: courseName.trim(),
              code: courseCode.trim().toUpperCase(),
              color: courseColor
            }
          : course
      ));
    } else {
      setCourses(previous => [...previous, {
        id: Date.now(),
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase(),
        color: courseColor
      }]);
    }

    setShowCourseModal(false);
  };

  const deleteCourse = (id: number) => {
    if (!window.confirm(
      "Delete this course and its related timetable, assignments and attendance?"
    )) return;

    setCourses(previous => previous.filter(course => course.id !== id));
    setSlots(previous => previous.filter(slot => slot.courseId !== id));
    setAssignments(previous => previous.filter(item => item.courseId !== id));
    setAttendance(previous => previous.filter(record => record.courseId !== id));
    setMakeupClasses(previous => previous.filter(item => item.courseId !== id));
  };

  // ==========================================
  // WEEKLY TIMETABLE MANAGEMENT
  // Adds, edits and deletes recurring class slots with time-clash validation.
  // ==========================================
  const openSlotForm = (slot?: Slot) => {
    setEditingSlotId(slot?.id ?? null);
    setSlotCourse(String(slot?.courseId ?? courses[0]?.id ?? ""));
    setSlotDay(slot?.day ?? "Monday");
    setSlotStart(slot?.start ?? "09:00");
    setSlotEnd(slot?.end ?? "10:00");
    setSlotRoom(slot?.room ?? "");
    setSlotError("");
    setShowSlotForm(true);
  };

  const saveSlot = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSlotError("");

    if (!slotCourse) {
      setSlotError("Please add a course first.");
      return;
    }

    if (slotStart >= slotEnd) {
      setSlotError("End time must be later than start time.");
      return;
    }

    const clash = slots.find(slot =>
      slot.id !== editingSlotId &&
      slot.day === slotDay &&
      slotStart < slot.end &&
      slotEnd > slot.start
    );

    if (clash) {
      const clashCourse = getCourse(clash.courseId);

      setSlotError(
        `Schedule clash! This time overlaps with ${clashCourse?.name ?? "another class"} (${clash.start} - ${clash.end}).`
      );
      return;
    }

    const newSlot: Slot = {
      id: editingSlotId ?? Date.now(),
      courseId: Number(slotCourse),
      day: slotDay,
      start: slotStart,
      end: slotEnd,
      room: slotRoom.trim()
    };

    if (editingSlotId !== null) {
      setSlots(previous => previous.map(slot =>
        slot.id === editingSlotId ? newSlot : slot
      ));
    } else {
      setSlots(previous => [...previous, newSlot]);
    }

    setShowSlotForm(false);
  };

  const deleteSlot = (id: number) => {
    if (window.confirm("Delete this class slot?")) {
      setSlots(previous => previous.filter(slot => slot.id !== id));
    }
  };

  // ==========================================
  // ONE-TIME MAKEUP CLASS MANAGEMENT
  // Adds and deletes dated makeup classes and checks schedule overlaps.
  // ==========================================
  const addMakeupClass = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMakeupError("");
    if (!makeupCourse) {
      setMakeupError("Please select a course.");
      return;
    }
    if (!makeupDate) {
      setMakeupError("Please select the makeup class date.");
      return;
    }
    if (makeupStart >= makeupEnd) {
      setMakeupError("End time must be later than start time.");
      return;
    }
    const dayName = new Date(`${makeupDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
    const recurringClash = slots.find(slot => slot.day === dayName && makeupStart < slot.end && makeupEnd > slot.start);
    const oneTimeClash = makeupClasses.find(item => item.date === makeupDate && makeupStart < item.end && makeupEnd > item.start);
    if (recurringClash || oneTimeClash) {
      setMakeupError("This time overlaps with another class on that date.");
      return;
    }
    setMakeupClasses(previous => [...previous, {
      id: Date.now(), courseId: Number(makeupCourse), date: makeupDate,
      start: makeupStart, end: makeupEnd, room: makeupRoom.trim(), note: makeupNote.trim()
    }]);
    setMakeupCourse(""); setMakeupDate(""); setMakeupStart("09:00");
    setMakeupEnd("10:00"); setMakeupRoom(""); setMakeupNote("");
  };

  const deleteMakeupClass = (id: number) => {
    if (window.confirm("Delete this makeup class?")) {
      setMakeupClasses(previous => previous.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // TIMETABLE CSV EXPORT
  // Converts the weekly timetable into a downloadable CSV file.
  // ==========================================
  const exportTimetableCsv = () => {
    const rows = [
      ["Course Code", "Course Name", "Day", "Start", "End", "Room"],
      ...slots.map(slot => {
        const course = getCourse(slot.courseId);
        return [course?.code ?? "", course?.name ?? "", slot.day, slot.start, slot.end, slot.room];
      })
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url; link.download = "semestersync-timetable.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // ACCOUNT SETTINGS & DATA BACKUP
  // Updates profile information, exports academic data and resets records.
  // ==========================================
  const saveSettings = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanEmail = settingsEmail.trim().toLowerCase();
    if (accounts.some(account => account.email.toLowerCase() === cleanEmail && account.email.toLowerCase() !== currentUser.email.toLowerCase())) {
      setSettingsMessage("This email is already used by another account.");
      return;
    }
    const updated: Account = { ...currentUser, name: settingsName.trim(), email: cleanEmail };
    setAccounts(previous => previous.map(account => account.email.toLowerCase() === currentUser.email.toLowerCase() ? updated : account));
    setCurrentUser(updated);
    setSettingsMessage("Profile updated successfully.");
  };

  const exportAllData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: currentUser ? { name: currentUser.name, email: currentUser.email } : null,
      courses, slots, makeupClasses, assignments, attendance
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "semestersync-backup.json"; link.click();
    URL.revokeObjectURL(url);
  };

  const resetAcademicData = () => {
    if (!window.confirm("This will delete all courses, timetable classes, makeup classes, assignments and attendance records. Continue?")) return;
    setCourses([]); setSlots([]); setMakeupClasses([]); setAssignments([]); setAttendance([]);
    setSettingsMessage("Academic data has been reset.");
  };

  // ==========================================
  // TIMETABLE CSV IMPORT / EXPORT
  // Downloads a template, parses uploaded CSV files, validates rows and imports valid classes.
  // ==========================================
  const downloadCsvTemplate = () => {
    const content = "Course Code,Day,Start,End,Room\nCS301,Monday,09:00,10:00,Room 101\n";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "semestersync-timetable-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (insideQuotes && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (character === "," && !insideQuotes) {
        values.push(value.trim());
        value = "";
      } else {
        value += character;
      }
    }

    values.push(value.trim());
    return values;
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError("");
    setCsvPreview([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

      if (lines.length < 2) {
        setCsvError("CSV file is empty or has no timetable rows.");
        setShowCsvPreview(true);
        return;
      }

      const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
      const requiredHeaders = ["course code", "day", "start", "end", "room"];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

      if (missingHeaders.length > 0) {
        setCsvError(`Missing CSV columns: ${missingHeaders.join(", ")}. Download the template and use its exact headings.`);
        setShowCsvPreview(true);
        return;
      }

      const column = (name: string) => headers.indexOf(name);
      const rows: CsvPreviewRow[] = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const row: CsvPreviewRow = {
          courseCode: values[column("course code")] ?? "",
          day: values[column("day")] ?? "",
          start: values[column("start")] ?? "",
          end: values[column("end")] ?? "",
          room: values[column("room")] ?? "",
          valid: true,
          error: ""
        };

        const course = courses.find(item => item.code.toLowerCase() === row.courseCode.toLowerCase());
        if (!course) row.error = "Course code does not exist.";
        else if (!weekdays.some(day => day.toLowerCase() === row.day.toLowerCase())) row.error = "Invalid weekday.";
        else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.end)) row.error = "Time must use HH:MM format.";
        else if (row.start >= row.end) row.error = "End time must be later than start time.";
        else {
          row.day = weekdays.find(day => day.toLowerCase() === row.day.toLowerCase()) ?? row.day;
          const existingClash = slots.find(slot => slot.day === row.day && row.start < slot.end && row.end > slot.start);
          if (existingClash) row.error = `Clashes with an existing class (${existingClash.start}-${existingClash.end}).`;
        }

        row.valid = row.error === "";
        return row;
      });

      // Also detect clashes between rows in the uploaded CSV.
      rows.forEach((row, index) => {
        if (!row.valid) return;
        const clash = rows.slice(0, index).find(previous =>
          previous.valid && previous.day === row.day && row.start < previous.end && row.end > previous.start
        );
        if (clash) {
          row.valid = false;
          row.error = "Clashes with another row in this CSV.";
        }
      });

      setCsvPreview(rows);
      setShowCsvPreview(true);
    };
    reader.onerror = () => {
      setCsvError("Could not read this file. Please try another CSV file.");
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importValidCsvRows = () => {
    const validRows = csvPreview.filter(row => row.valid);
    if (validRows.length === 0) return;

    const importedSlots: Slot[] = validRows.map(row => ({
      id: Date.now() + Math.floor(Math.random() * 1000000),
      courseId: courses.find(course => course.code.toLowerCase() === row.courseCode.toLowerCase())!.id,
      day: row.day,
      start: row.start,
      end: row.end,
      room: row.room
    }));

    setSlots(previous => [...previous, ...importedSlots]);
    setShowCsvPreview(false);
    setCsvPreview([]);
    setCsvError("");
    alert(`${importedSlots.length} class(es) imported successfully.`);
  };

  // ==========================================
  // ASSIGNMENTS & EXAMS MANAGEMENT
  // Creates, edits, completes and deletes academic deadlines.
  // ==========================================
  const openAssignmentForm = (item?: Assignment) => {
    setEditingAssignmentId(item?.id ?? null);
    setAssignmentTitle(item?.title ?? "");
    setAssignmentCourse(String(item?.courseId ?? courses[0]?.id ?? ""));
    setAssignmentType(item?.type ?? "Assignment");
    setAssignmentDate(item?.dueDate ?? "");
    setAssignmentTime(item?.dueTime ?? "23:59");
    setShowAssignmentForm(true);
  };

  const saveAssignment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!assignmentCourse) {
      alert("Please add a course first.");
      return;
    }

    const newItem: Assignment = {
      id: editingAssignmentId ?? Date.now(),
      title: assignmentTitle.trim(),
      courseId: Number(assignmentCourse),
      type: assignmentType,
      dueDate: assignmentDate,
      dueTime: assignmentTime,
      completed: editingAssignmentId !== null
        ? assignments.find(item =>
            item.id === editingAssignmentId
          )?.completed ?? false
        : false
    };

    if (editingAssignmentId !== null) {
      setAssignments(previous => previous.map(item =>
        item.id === editingAssignmentId ? newItem : item
      ));
    } else {
      setAssignments(previous => [...previous, newItem]);
    }

    setShowAssignmentForm(false);
  };

  const deleteAssignment = (id: number) => {
    if (window.confirm("Delete this deadline?")) {
      setAssignments(previous =>
        previous.filter(item => item.id !== id)
      );
    }
  };

  const toggleAssignment = (id: number) => {
    setAssignments(previous => previous.map(item =>
      item.id === id
        ? { ...item, completed: !item.completed }
        : item
    ));
  };

  // ==========================================
  // ATTENDANCE MANAGEMENT
  // Records present/absent sessions, updates existing records and maintains history.
  // ==========================================
  const markAttendance = (status: "Present" | "Absent") => {
    if (!attendanceCourse) {
      alert("Please select a course.");
      return;
    }

    const courseId = Number(attendanceCourse);

    const existing = attendance.find(record =>
      record.courseId === courseId &&
      record.date === attendanceDate
    );

    if (existing) {
      setAttendance(previous => previous.map(record =>
        record.id === existing.id
          ? { ...record, status }
          : record
      ));
    } else {
      setAttendance(previous => [...previous, {
        id: Date.now(),
        courseId,
        date: attendanceDate,
        status
      }]);
    }
  };

  const deleteAttendance = (id: number) => {
    if (window.confirm("Delete this attendance record?")) {
      setAttendance(previous =>
        previous.filter(record => record.id !== id)
      );
    }
  };

  const filteredCourses = courses.filter(course =>
    `${course.name} ${course.code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredHistory = attendance
    .filter(record =>
      historyCourseFilter === "all" ||
      record.courseId === Number(historyCourseFilter)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  // ==========================================
  // DASHBOARD FEATURE
  // Displays academic statistics, today's regular/makeup classes and upcoming deadlines.
  // ==========================================
  const renderDashboard = () => (
    <>
      <section className="welcome-banner">
        <div>
          <span className="welcome-tag">YOUR ACADEMIC SPACE</span>
          <h1>Stay organized.<br />Stay ahead.</h1>
          <p>Manage your classes, deadlines and attendance all in one place.</p>
          <button
            className="primary-button"
            onClick={() => openCourseForm()}
          >
            <Plus size={18} /> Add New Course
          </button>
        </div>
        <div className="banner-decoration">S</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Courses</span><BookOpen />
          </div>
          <h2>{String(courses.length).padStart(2, "0")}</h2>
          <small>Active this semester</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Today's Classes</span><CalendarDays />
          </div>
          <h2>{String(todayClassesCount).padStart(2, "0")}</h2>
          <small>Regular and makeup classes today</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Tasks</span><ClipboardList />
          </div>
          <h2>{String(pendingAssignments.length).padStart(2, "0")}</h2>
          <small>
            {overdueAssignments.length > 0
              ? `${overdueAssignments.length} overdue deadline(s)`
              : "All tasks on track"}
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Attendance</span><CheckCircle2 />
          </div>
          <h2>{attendancePercentage()}%</h2>
          <small>Based on recorded sessions</small>
        </div>
      </section>

      <section className="content-grid">
        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Today's Schedule</h3>
              <p>Your classes for today</p>
            </div>
            <button
              className="text-link"
              onClick={() => setActivePage("Timetable")}
            >
              View Timetable
            </button>
          </div>

          {todaySchedule.length === 0 ? (
            <p className="module-empty">
              No classes scheduled for today.
            </p>
          ) : todaySchedule.map(item => (
            <div className="class-item" key={`${item.type}-${item.id}`}>
              <div className={`class-indicator ${item.type === "Makeup" ? "orange" : "purple"}`} />
              <div className="class-details">
                <strong>
                  {getCourse(item.courseId)?.name ?? "Course"}
                </strong>
                <small>
                  <Clock size={13} /> {item.start} - {item.end}
                </small>
                <small>
                  <MapPin size={13} /> {item.room || "Room not specified"}
                </small>
              </div>
              <span className="class-status">{item.type}</span>
            </div>
          ))}
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Upcoming Deadlines</h3>
              <p>Don't miss your submissions</p>
            </div>
            <button
              className="text-link"
              onClick={() => setActivePage("Assignments")}
            >
              View All
            </button>
          </div>

          {upcomingAssignments.slice(0, 4).map(item => (
            <div className="deadline-item" key={item.id}>
              <div className="date-box">
                <strong>
                  {item.dueDate ? item.dueDate.slice(8, 10) : "--"}
                </strong>
                <small>
                  {item.dueDate
                    ? new Date(`${item.dueDate}T00:00:00`)
                        .toLocaleString("en-US", { month: "short" })
                    : "Date"}
                </small>
              </div>

              <div className="deadline-details">
                <strong>{item.title}</strong>
                <small>
                  {getCourse(item.courseId)?.name ?? "Course"}
                </small>
                <span>{item.type}</span>
              </div>
            </div>
          ))}

          {upcomingAssignments.length === 0 && (
            <p className="module-empty">
              {pendingAssignments.length === 0
                ? "No pending deadlines. You're all caught up!"
                : "No upcoming deadlines. Check your overdue tasks."}
            </p>
          )}

          {overdueAssignments.length > 0 && (
            <p className="module-hint">
              You also have {overdueAssignments.length} overdue deadline(s).
              Check your Assignments page.
            </p>
          )}
        </div>
      </section>
    </>
  );

  // ==========================================
  // MY COURSES PAGE
  // Displays searchable course cards and course management actions.
  // ==========================================
  const renderCourses = () => (
    <section className="courses-page">
      <div className="courses-toolbar">
        <div>
          <h3>My Courses</h3>
          <p>Manage all your semester courses.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => openCourseForm()}
        >
          <Plus size={18} /> Add Course
        </button>
      </div>

      <div className="course-search">
        <Search size={19} />
        <input
          placeholder="Search by course name or code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="course-summary">
        <div>
          <span>Total Registered Courses</span>
          <h2>{courses.length}</h2>
        </div>
        <BookOpen size={27} />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={38} />
          <h3>No courses found</h3>
          <p>Add a course or change your search.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div className="course-card" key={course.id}>
              <div
                className="course-color-bar"
                style={{ backgroundColor: course.color }}
              />
              <div className="course-card-content">
                <div className="course-card-top">
                  <div
                    className="course-icon"
                    style={{
                      backgroundColor: `${course.color}20`,
                      color: course.color
                    }}
                  >
                    <BookOpen size={23} />
                  </div>
                  <span className="course-code">{course.code}</span>
                </div>

                <h3>{course.name}</h3>
                <p>Registered course</p>

                <div className="course-actions">
                  <button onClick={() => openCourseForm(course)}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    className="delete-action"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // ==========================================
  // TIMETABLE PAGE
  // Displays weekly class slots, makeup classes and CSV import/export controls.
  // ==========================================
  const renderTimetable = () => (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <h3>Weekly Timetable</h3>
          <p>Plan and manage your weekly classes.</p>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button" onClick={exportTimetableCsv}>
            Export Timetable CSV
          </button>
          <button className="secondary-button" onClick={downloadCsvTemplate}>
            Download CSV Template
          </button>
          <button className="secondary-button" onClick={() => document.getElementById("timetable-csv-upload")?.click()}>
            Import CSV
          </button>
          <input
            id="timetable-csv-upload"
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={handleCsvUpload}
          />
          <button
            className="secondary-button"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print
          </button>
          <button
            className="primary-button"
            onClick={() => openSlotForm()}
          >
            <Plus size={17} /> Add Class
          </button>
        </div>
      </div>

      {weekdays.map(day => {
        const daySlots = slots
          .filter(slot => slot.day === day)
          .sort((a, b) => a.start.localeCompare(b.start));

        return (
          <div className="day-section" key={day}>
            <h4>{day}</h4>

            {daySlots.length === 0 ? (
              <p className="module-empty">No classes scheduled.</p>
            ) : daySlots.map(slot => (
              <div className="module-item" key={slot.id}>
                <div
                  className="module-item-color"
                  style={{
                    background: getCourse(slot.courseId)?.color ?? "#8974e8"
                  }}
                />
                <div className="module-item-main">
                  <strong>
                    {getCourse(slot.courseId)?.name ?? "Course removed"}
                  </strong>
                  <span>
                    {getCourse(slot.courseId)?.code} · {slot.room || "Room not specified"}
                  </span>
                </div>
                <div className="module-time">
                  <Clock size={14} /> {slot.start} - {slot.end}
                </div>
                <div className="module-item-actions">
                  <button
                    onClick={() => openSlotForm(slot)}
                    aria-label="Edit class"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    aria-label="Delete class"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {slots.length === 0 && (
        <p className="module-hint">
          Add your first class to start building your timetable.
        </p>
      )}

      <div className="attendance-form makeup-form">
        <h4>Add One-Time Makeup Class</h4>
        <form onSubmit={addMakeupClass}>
          <div className="form-grid">
            <div className="field-group">
              <label>Course</label>
              <select value={makeupCourse} onChange={e => setMakeupCourse(e.target.value)} required>
                <option value="">Select course</option>
                {courses.map(course => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Date</label>
              <input type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Start Time</label>
              <input type="time" value={makeupStart} onChange={e => setMakeupStart(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>End Time</label>
              <input type="time" value={makeupEnd} onChange={e => setMakeupEnd(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Room</label>
              <input value={makeupRoom} onChange={e => setMakeupRoom(e.target.value)} placeholder="Room / Lab" />
            </div>
            <div className="field-group">
              <label>Note (optional)</label>
              <input value={makeupNote} onChange={e => setMakeupNote(e.target.value)} placeholder="Reason or details" />
            </div>
          </div>
          {makeupError && <div className="auth-error">{makeupError}</div>}
          <button className="primary-button" type="submit"><Plus size={16} /> Add Makeup Class</button>
        </form>
      </div>

      <div className="day-section">
        <h4>One-Time Makeup Classes</h4>
        {makeupClasses.length === 0 ? <p className="module-empty">No makeup classes added yet.</p> : [...makeupClasses].sort((a,b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)).map(item => (
          <div className="module-item" key={item.id}>
            <div className="module-item-color" style={{ background: getCourse(item.courseId)?.color ?? "#8974e8" }} />
            <div className="module-item-main">
              <strong>{getCourse(item.courseId)?.name ?? "Course removed"}</strong>
              <span>{item.date} · {item.room || "Room not specified"}{item.note ? ` · ${item.note}` : ""}</span>
            </div>
            <div className="module-time"><Clock size={14} /> {item.start} - {item.end}</div>
            <div className="module-item-actions"><button onClick={() => deleteMakeupClass(item.id)} aria-label="Delete makeup class"><Trash2 size={15} /></button></div>
          </div>
        ))}
      </div>

      {showCsvPreview && (
        <div className="modal-overlay" onClick={() => setShowCsvPreview(false)}>
          <div className="course-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h3>CSV Import Preview</h3>
                <p>Review the rows before adding them to your timetable.</p>
              </div>
              <button className="close-button" onClick={() => setShowCsvPreview(false)}>
                <X size={21} />
              </button>
            </div>

            {csvError && <div className="auth-error"><AlertTriangle size={15} /> {csvError}</div>}

            {csvPreview.length > 0 && (
              <>
                <p className="module-hint">
                  {csvPreview.filter(row => row.valid).length} valid row(s), {csvPreview.filter(row => !row.valid).length} row(s) with errors.
                </p>
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr><th>Course</th><th>Day</th><th>Time</th><th>Room</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, index) => (
                        <tr key={`${row.courseCode}-${row.day}-${row.start}-${index}`}>
                          <td>{row.courseCode}</td>
                          <td>{row.day}</td>
                          <td>{row.start} - {row.end}</td>
                          <td>{row.room || "—"}</td>
                          <td>
                            <span className={`status-pill ${row.valid ? "present" : "absent"}`}>
                              {row.valid ? "Valid" : row.error}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowCsvPreview(false)}>Cancel</button>
              <button className="primary-button" onClick={importValidCsvRows} disabled={!csvPreview.some(row => row.valid)}>
                Import Valid Classes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  // ==========================================
  // ASSIGNMENTS & EXAMS PAGE
  // Displays deadlines with all, pending, completed and overdue filters.
  // ==========================================
  const renderAssignments = () => (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <h3>Assignments & Exams</h3>
          <p>Track your academic deadlines and progress.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => openAssignmentForm()}
        >
          <Plus size={17} /> Add Deadline
        </button>
      </div>

      <div className="module-summary-row">
        <div className="mini-summary">
          <span>Total</span>
          <strong>{assignments.length}</strong>
        </div>
        <div className="mini-summary">
          <span>Pending</span>
          <strong>{pendingAssignments.length}</strong>
        </div>
        <div className="mini-summary">
          <span>Completed</span>
          <strong>{assignments.length - pendingAssignments.length}</strong>
        </div>
      </div>

      <div className="toolbar-actions assignment-filters">
        {(["all", "pending", "completed", "overdue"] as const).map(filter => (
          <button key={filter} className={assignmentFilter === filter ? "primary-button" : "secondary-button"} onClick={() => setAssignmentFilter(filter)}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={35} />
          <h3>No deadlines yet</h3>
          <p>Add your assignments, quizzes and exams.</p>
        </div>
      ) : (
        filteredAssignments.length === 0 ? (
          <p className="module-empty">No {assignmentFilter} assignments found.</p>
        ) : filteredAssignments.map(item => (
            <div
              className={`module-item assignment-item ${item.completed ? "is-completed" : ""}`}
              key={item.id}
            >
              <div className="assignment-check">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleAssignment(item.id)}
                />
              </div>

              <div className="module-item-main">
                <strong>{item.title}</strong>
                <span>
                  {getCourse(item.courseId)?.name ?? "Course"} · {item.type}
                </span>
                {!item.completed && isOverdue(item) && (
                  <span className="overdue-label">Overdue</span>
                )}
              </div>

              <div className="module-time">
                <CalendarDays size={14} />
                {item.dueDate} at {item.dueTime}
              </div>

              <div className="module-item-actions">
                <button
                  onClick={() => openAssignmentForm(item)}
                  aria-label="Edit deadline"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteAssignment(item.id)}
                  aria-label="Delete deadline"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
      )}
    </section>
  );

  // ==========================================
  // ATTENDANCE PAGE
  // Records class attendance and displays course-wise attendance percentages.
  // ==========================================
  const renderAttendance = () => (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <h3>Attendance Tracker</h3>
          <p>Mark attendance and review your attendance history.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => setActivePage("Attendance History")}
        >
          <History size={16} /> View History
        </button>
      </div>

      <div className="attendance-form">
        <h4>Record a Class Session</h4>

        <div className="form-grid">
          <div className="field-group">
            <label>Course</label>
            <select
              value={attendanceCourse}
              onChange={e => setAttendanceCourse(e.target.value)}
            >
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Class Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
            />
          </div>
        </div>

        <div className="attendance-buttons">
          <button
            className="present-button"
            onClick={() => markAttendance("Present")}
          >
            <CheckCircle2 size={17} /> Mark Present
          </button>
          <button
            className="absent-button"
            onClick={() => markAttendance("Absent")}
          >
            <X size={17} /> Mark Absent
          </button>
        </div>

        <p className="module-hint">
          If a record already exists for this course and date,
          marking again will update it instead of creating a duplicate.
        </p>
      </div>

      <h3 className="subsection-title">Course Attendance</h3>

      <div className="attendance-course-grid">
        {courses.map(course => {
          const records = attendance.filter(
            record => record.courseId === course.id
          );

          return (
            <div className="attendance-course-card" key={course.id}>
              <div className="attendance-course-heading">
                <span
                  className="course-dot"
                  style={{ background: course.color }}
                />
                <strong>{course.name}</strong>
              </div>

              <h2>{attendancePercentage(course.id)}%</h2>

              <p>
                {records.filter(record => record.status === "Present").length}
                {" "}present out of {records.length} recorded classes
              </p>

              <div className="attendance-progress">
                <span
                  style={{
                    width: `${attendancePercentage(course.id)}%`,
                    background: course.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  // ==========================================
  // ATTENDANCE HISTORY PAGE
  // Shows recorded sessions with course filtering and delete actions.
  // ==========================================
  const renderHistory = () => (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <h3>Attendance History</h3>
          <p>All recorded attendance sessions, organized by date.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => setActivePage("Attendance")}
        >
          <ClipboardCheck size={16} /> Back to Attendance
        </button>
      </div>

      <div className="history-filter">
        <label>Filter by course</label>
        <select
          value={historyCourseFilter}
          onChange={e => setHistoryCourseFilter(e.target.value)}
        >
          <option value="all">All courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Course Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredHistory.map(record => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>
                  {getCourse(record.courseId)?.name ?? "Deleted course"}
                </td>
                <td>
                  {getCourse(record.courseId)?.code ?? "—"}
                </td>
                <td>
                  <span className={`status-pill ${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </td>
                <td>
                  <button
                    className="table-delete"
                    onClick={() => deleteAttendance(record.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="history-total">
        Total recorded sessions: <strong>{filteredHistory.length}</strong>
      </div>
    </section>
  );

  // ==========================================
  // LOGIN / SIGNUP SCREEN
  // Renders authentication UI when no account is currently logged in.
  // ==========================================
  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="brand-icon">S</div>
          <span>
            Semester<span className="brand-light">Sync</span>
          </span>
        </div>

        <div className="auth-card">
          <div className="auth-icon">
            <User size={27} />
          </div>

          <h1>
            {authPage === "signup"
              ? "Create your account"
              : "Welcome back"}
          </h1>

          <p className="auth-subtitle">
            {authPage === "signup"
              ? "Start organizing your semester today."
              : "Login to access your academic dashboard."}
          </p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authPage === "login" ? "active" : ""}`}
              onClick={() => {
                setAuthPage("login");
                setAuthError("");
              }}
            >
              Login
            </button>

            <button
              className={`auth-tab ${authPage === "signup" ? "active" : ""}`}
              onClick={() => {
                setAuthPage("signup");
                setAuthError("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {authPage === "signup" && (
              <>
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <User size={17} />
                  <input
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </>
            )}

            <label>Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={17} />
              <input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={17} />
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={4}
              />
            </div>

            {authPage === "signup" && (
              <>
                <label>Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={17} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    minLength={4}
                  />
                </div>
              </>
            )}

            {authError && (
              <div className="auth-error">{authError}</div>
            )}

            <button className="auth-submit" type="submit">
              {authPage === "signup"
                ? "Create Account"
                : "Login to Dashboard"}
            </button>
          </form>

          <p className="auth-switch">
            {authPage === "signup"
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              onClick={() => {
                setAuthPage(authPage === "signup" ? "login" : "signup");
                setAuthError("");
              }}
            >
              {authPage === "signup" ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>

        <p className="auth-footer">
          © 2026 SemesterSync. Organize your semester smarter.
        </p>
      </div>
    );
  }

  // ==========================================
  // MAIN APPLICATION LAYOUT
  // Renders sidebar navigation, topbar, selected page and global dialogs.
  // ==========================================
  return (
    <div className="app-layout semestersync-readable">
      {/* ==========================================
          SIDEBAR NAVIGATION
          Provides links to all application modules and the user profile.
          ========================================== */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>
            Semester<span className="brand-light">Sync</span>
          </span>
        </div>

        <p className="menu-label">MENU</p>

        <nav className="nav-menu">
          {[
            ["Dashboard", LayoutDashboard],
            ["Timetable", CalendarDays],
            ["My Courses", BookOpen],
            ["Assignments", ClipboardList],
            ["Attendance", ClipboardCheck],
            ["Attendance History", History]
          ].map(([label, Icon]) => {
            const NavIcon = Icon as typeof LayoutDashboard;

            return (
              <button
                key={label as string}
                className={`nav-link ${activePage === label ? "active" : ""}`}
                onClick={() => setActivePage(label as string)}
              >
                <NavIcon size={19} /> {label as string}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-link ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={19} /> Settings
          </button>

          <div className="profile">
            <div className="avatar">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{currentUser.name}</strong>
              <small>{currentUser.email}</small>
            </div>

            <button
              className="logout-button"
              onClick={logout}
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA & TOPBAR
          Displays the current page heading and selected feature screen.
          ========================================== */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{activePage}</h2>
            <p>
              {activePage === "Dashboard"
                ? "Welcome back! Here's your semester overview."
                : `Manage your ${activePage.toLowerCase()} here.`}
            </p>
          </div>

          <div className="top-actions">
            <button
              className="icon-button"
              aria-label="Search"
              onClick={() => setActivePage("My Courses")}
            >
              <Search size={19} />
            </button>
            <div className="avatar">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {activePage === "Dashboard" && renderDashboard()}
        {activePage === "My Courses" && renderCourses()}
        {activePage === "Timetable" && renderTimetable()}
        {activePage === "Assignments" && renderAssignments()}
        {activePage === "Attendance" && renderAttendance()}
        {activePage === "Attendance History" && renderHistory()}

        {/* ==========================================
            SETTINGS PAGE
            Allows profile updates, academic data export and data reset.
            ========================================== */}
        {activePage === "Settings" && (
          <section className="module-page">
            <div className="module-toolbar"><div><h3>Account Settings</h3><p>Update your profile and manage your SemesterSync data.</p></div></div>
            <div className="attendance-form">
              <h4>Profile Information</h4>
              <form onSubmit={saveSettings}>
                <div className="form-grid">
                  <div className="field-group"><label>Full Name</label><input value={settingsName} onChange={e => setSettingsName(e.target.value)} required /></div>
                  <div className="field-group"><label>Email Address</label><input type="email" value={settingsEmail} onChange={e => setSettingsEmail(e.target.value)} required /></div>
                </div>
                <button className="primary-button" type="submit"><Save size={16} /> Save Profile</button>
              </form>
              {settingsMessage && <p className="module-hint">{settingsMessage}</p>}
            </div>
            <div className="attendance-form">
              <h4>Data Management</h4>
              <p className="module-hint">Download a backup of your academic data or clear the current semester records. Passwords are not included in the backup.</p>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={exportAllData}>Export All Data (JSON)</button>
                <button className="absent-button" onClick={resetAcademicData}><Trash2 size={16} /> Reset Academic Data</button>
              </div>
            </div>
          </section>
        )}

        <footer>
          © 2026 SemesterSync. Organize your semester smarter.
        </footer>
      </main>

      {/* ==========================================
          GLOBAL FORM MODALS
          The following dialogs handle course, timetable and assignment forms.
          ========================================== */}
      {/* ==========================================
          COURSE FORM MODAL
          Adds a new course or edits the selected course.
          ========================================== */}
      {showCourseModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCourseModal(false)}
        >
          <div
            className="course-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h3>
                  {editingCourseId ? "Edit Course" : "Add New Course"}
                </h3>
                <p>Enter your course information.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowCourseModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveCourse}>
              <label>Course Name</label>
              <input
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Web Programming"
                required
              />

              <label>Course Code</label>
              <input
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. CS301"
                required
              />

              <label>Course Color</label>
              <div className="color-picker-row">
                {[
                  "#8974e8", "#55a8e9", "#efa45f",
                  "#48b99b", "#e8759b"
                ].map(color => (
                  <button
                    type="button"
                    key={color}
                    className={`color-option ${courseColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCourseColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={courseColor}
                  onChange={e => setCourseColor(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCourseModal(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  <Save size={16} /> Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          TIMETABLE CLASS FORM MODAL
          Adds or edits a recurring weekly class.
          ========================================== */}
      {showSlotForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowSlotForm(false)}
        >
          <div
            className="course-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h3>
                  {editingSlotId ? "Edit Class" : "Add Class Slot"}
                </h3>
                <p>Set the course, day and class timing.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowSlotForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveSlot}>
              <label>Course</label>
              <select
                value={slotCourse}
                onChange={e => setSlotCourse(e.target.value)}
                required
              >
                <option value="">Select course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>

              <label>Weekday</label>
              <select
                value={slotDay}
                onChange={e => setSlotDay(e.target.value)}
              >
                {weekdays.map(day => (
                  <option key={day}>{day}</option>
                ))}
              </select>

              <div className="form-grid">
                <div>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={slotStart}
                    onChange={e => setSlotStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={slotEnd}
                    onChange={e => setSlotEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <label>Room</label>
              <input
                value={slotRoom}
                onChange={e => setSlotRoom(e.target.value)}
                placeholder="e.g. Lab 3"
              />

              {slotError && (
                <div className="auth-error">
                  <AlertTriangle size={15} /> {slotError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowSlotForm(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  <Save size={16} /> Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          ASSIGNMENT / EXAM FORM MODAL
          Adds or edits an academic deadline.
          ========================================== */}
      {showAssignmentForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignmentForm(false)}
        >
          <div
            className="course-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h3>
                  {editingAssignmentId
                    ? "Edit Deadline"
                    : "Add Assignment or Exam"}
                </h3>
                <p>Enter the deadline details.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowAssignmentForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveAssignment}>
              <label>Title</label>
              <input
                value={assignmentTitle}
                onChange={e => setAssignmentTitle(e.target.value)}
                placeholder="e.g. Database Assignment"
                required
              />

              <label>Course</label>
              <select
                value={assignmentCourse}
                onChange={e => setAssignmentCourse(e.target.value)}
                required
              >
                <option value="">Select course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>

              <label>Type</label>
              <select
                value={assignmentType}
                onChange={e => setAssignmentType(e.target.value)}
              >
                <option>Assignment</option>
                <option>Project</option>
                <option>Quiz</option>
                <option>Exam</option>
                <option>Presentation</option>
              </select>

              <div className="form-grid">
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={assignmentDate}
                    onChange={e => setAssignmentDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Due Time</label>
                  <input
                    type="time"
                    value={assignmentTime}
                    onChange={e => setAssignmentTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAssignmentForm(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  <Save size={16} /> Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
