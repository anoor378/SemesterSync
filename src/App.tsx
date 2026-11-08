
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  ClipboardCheck, Settings, Search, Plus, Clock, MapPin,
  CheckCircle2, Pencil, Trash2, X, Save, LogOut, User,
  Mail, Lock, AlertTriangle, History, Printer, Upload,
  Download, Share2, Copy, CalendarX, Menu
} from "lucide-react";
import "./App.css";

// Types used throughout the application
type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  color: string;
};

type Slot = {
  id: string;
  courseId: string;
  day: string;
  start: string;
  end: string;
  room: string;
};

type ClassException = {
  id: string;
  slotId: string;
  date: string;
};

type MakeupClass = {
  id: string;
  courseId: string;
  date: string;
  start: string;
  end: string;
  room: string;
};

type Deadline = {
  id: string;
  courseId: string;
  title: string;
  type: "Assignment" | "Exam" | "Quiz" | "Project";
  dueDate: string;
  dueTime: string;
  completed: boolean;
};

type Attendance = {
  id: string;
  courseId: string;
  sessionId: string;
  date: string;
  status: "Present" | "Absent";
};

type AcademicData = {
  courses: Course[];
  slots: Slot[];
  exceptions: ClassException[];
  makeupClasses: MakeupClass[];
  deadlines: Deadline[];
  attendance: Attendance[];
};

type ShareSnapshot = {
  code: string;
  courses: Course[];
  slots: Slot[];
};

type CsvRow = {
  code: string;
  name: string;
  day: string;
  start: string;
  end: string;
  room: string;
  error: string;
};

const DAYS = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday"
];

const COLORS = [
  "#8974e8", "#55a8e9", "#efa45f",
  "#5cbda7", "#e87f9c", "#9b87d8"
];

const EMPTY_DATA: AcademicData = {
  courses: [],
  slots: [],
  exceptions: [],
  makeupClasses: [],
  deadlines: [],
  attendance: []
};

const createId = () => crypto.randomUUID();

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function todayString() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function dayFromDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US", { weekday: "long" }
  );
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  // Account information is stored separately from academic records.
  const [accounts, setAccounts] = useState<Account[]>(() =>
    readStorage("ss_accounts", [])
  );
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    readStorage("ss_current_user", null)
  );

  const [data, setData] = useState<AcademicData>(EMPTY_DATA);
  const [loadedUser, setLoadedUser] = useState<string | null>(null);

  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Authentication form
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Course form
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseColor, setCourseColor] = useState(COLORS[0]);
  const [courseSearch, setCourseSearch] = useState("");

  // Timetable form
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [slotCourse, setSlotCourse] = useState("");
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slotRoom, setSlotRoom] = useState("");

  // Class cancellation and makeup classes
  const [cancelSlot, setCancelSlot] = useState("");
  const [cancelDate, setCancelDate] = useState(todayString());
  const [makeupCourse, setMakeupCourse] = useState("");
  const [makeupDate, setMakeupDate] = useState(todayString());
  const [makeupStart, setMakeupStart] = useState("09:00");
  const [makeupEnd, setMakeupEnd] = useState("10:00");
  const [makeupRoom, setMakeupRoom] = useState("");

  // Deadline form and filters
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineCourse, setDeadlineCourse] = useState("");
  const [deadlineType, setDeadlineType] = useState<Deadline["type"]>("Assignment");
  const [deadlineDate, setDeadlineDate] = useState(todayString());
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [deadlineCourseFilter, setDeadlineCourseFilter] = useState("all");

  // Attendance
  const [attendanceCourse, setAttendanceCourse] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(todayString());
  const [attendanceSession, setAttendanceSession] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"Present" | "Absent">("Present");

  // Sharing and CSV import
  const [shareCode, setShareCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);

  const user = accounts.find(account => account.id === currentUser);

  // Load the selected student's records when their account changes.
  useEffect(() => {
    if (!currentUser) {
      setData(EMPTY_DATA);
      setLoadedUser(null);
      return;
    }

    const saved = readStorage<AcademicData>(
      `ss_data_${currentUser}`,
      EMPTY_DATA
    );

    setData(saved);
    setLoadedUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("ss_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("ss_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && loadedUser === currentUser) {
      localStorage.setItem(`ss_data_${currentUser}`, JSON.stringify(data));
    }
  }, [data, currentUser, loadedUser]);

  function notify(text: string, isError = false) {
    setMessage(isError ? "" : text);
    setError(isError ? text : "");
  }

  function updateData(changes: Partial<AcademicData>) {
    setData(previous => ({ ...previous, ...changes }));
  }

  function getCourse(id: string) {
    return data.courses.find(course => course.id === id);
  }

  function getAttendancePercent(courseId: string) {
    const records = data.attendance.filter(item => item.courseId === courseId);
    if (!records.length) return 0;
    const present = records.filter(item => item.status === "Present").length;
    return Math.round((present / records.length) * 100);
  }

  function isOverdue(item: Deadline) {
    return !item.completed &&
      `${item.dueDate}T${item.dueTime}` < new Date().toLocaleString("sv-SE").replace(" ", "T").slice(0, 16);
  }

  function isCancelled(slotId: string, date: string) {
    return data.exceptions.some(item =>
      item.slotId === slotId && item.date === date
    );
  }

  function slotsOnDate(date: string) {
    return data.slots.filter(slot =>
      slot.day === dayFromDate(date) && !isCancelled(slot.id, date)
    );
  }

  function hasClash(
    day: string, start: string, end: string,
    excludeId?: string
  ) {
    return data.slots.find(slot =>
      slot.id !== excludeId &&
      slot.day === day &&
      overlaps(start, end, slot.start, slot.end)
    );
  }

  // Demo login and signup. Backend authentication will replace this later.
  function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = authEmail.trim().toLowerCase();

    if (authMode === "signup") {
      if (!authName.trim() || authPassword.length < 6) {
        return notify("Enter your name and a password of at least 6 characters.", true);
      }
      if (authPassword !== confirmPassword) {
        return notify("Passwords do not match.", true);
      }
      if (accounts.some(account => account.email === email)) {
        return notify("This email is already registered.", true);
      }

      const account: Account = {
        id: createId(),
        name: authName.trim(),
        email,
        password: authPassword
      };

      setAccounts(previous => [...previous, account]);
      setCurrentUser(account.id);
    } else {
      const account = accounts.find(item =>
        item.email === email && item.password === authPassword
      );
      if (!account) return notify("Incorrect email or password.", true);
      setCurrentUser(account.id);
    }

    setAuthPassword("");
    setConfirmPassword("");
    setPage("Dashboard");
    notify("");
  }

  function logout() {
    setCurrentUser(null);
    setPage("Dashboard");
    setAuthMode("login");
    notify("");
  }

  // Course management
  function openCourseForm(course?: Course) {
    setEditingCourse(course?.id ?? null);
    setCourseCode(course?.code ?? "");
    setCourseName(course?.name ?? "");
    setCourseColor(course?.color ?? COLORS[0]);
    setCourseFormOpen(true);
  }

  function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = courseCode.trim().toUpperCase();
    const name = courseName.trim();

    if (!code || !name) return notify("Course code and name are required.", true);
    if (data.courses.some(course =>
      course.code === code && course.id !== editingCourse
    )) return notify("This course code already exists.", true);

    const course: Course = {
      id: editingCourse ?? createId(),
      code, name, color: courseColor
    };

    updateData({
      courses: editingCourse
        ? data.courses.map(item => item.id === editingCourse ? course : item)
        : [...data.courses, course]
    });

    setCourseFormOpen(false);
    notify(editingCourse ? "Course updated successfully." : "Course added successfully.");
  }

  function deleteCourse(id: string) {
    if (!window.confirm(
      "Delete this course and all its classes, deadlines and attendance records?"
    )) return;

    const removedSlotIds = new Set(
      data.slots.filter(slot => slot.courseId === id).map(slot => slot.id)
    );

    setData(previous => ({
      courses: previous.courses.filter(item => item.id !== id),
      slots: previous.slots.filter(item => item.courseId !== id),
      exceptions: previous.exceptions.filter(item => !removedSlotIds.has(item.slotId)),
      makeupClasses: previous.makeupClasses.filter(item => item.courseId !== id),
      deadlines: previous.deadlines.filter(item => item.courseId !== id),
      attendance: previous.attendance.filter(item => item.courseId !== id)
    }));
    notify("Course and related records deleted.");
  }

  // Weekly timetable management
  function openSlotForm(slot?: Slot) {
    setEditingSlot(slot?.id ?? null);
    setSlotCourse(slot?.courseId ?? data.courses[0]?.id ?? "");
    setSlotDay(slot?.day ?? "Monday");
    setSlotStart(slot?.start ?? "09:00");
    setSlotEnd(slot?.end ?? "10:00");
    setSlotRoom(slot?.room ?? "");
    setSlotFormOpen(true);
  }

  function saveSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!getCourse(slotCourse)) return notify("Select a valid course.", true);
    if (slotStart >= slotEnd) return notify("End time must be later than start time.", true);

    const clash = hasClash(slotDay, slotStart, slotEnd, editingSlot ?? undefined);
    if (clash) {
      return notify(
        `Schedule clash with ${getCourse(clash.courseId)?.name} (${clash.start}–${clash.end}).`,
        true
      );
    }

    const slot: Slot = {
      id: editingSlot ?? createId(),
      courseId: slotCourse,
      day: slotDay,
      start: slotStart,
      end: slotEnd,
      room: slotRoom.trim()
    };

    updateData({
      slots: editingSlot
        ? data.slots.map(item => item.id === editingSlot ? slot : item)
        : [...data.slots, slot]
    });
    setSlotFormOpen(false);
    notify("Class schedule saved.");
  }

  function deleteSlot(id: string) {
    if (!window.confirm("Delete this weekly class?")) return;
    setData(previous => ({
      ...previous,
      slots: previous.slots.filter(slot => slot.id !== id),
      exceptions: previous.exceptions.filter(item => item.slotId !== id),
      attendance: previous.attendance.filter(item => item.sessionId !== id)
    }));
    notify("Class removed.");
  }

  function cancelClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slot = data.slots.find(item => item.id === cancelSlot);

    if (!slot || dayFromDate(cancelDate) !== slot.day) {
      return notify("Choose a date matching the selected class weekday.", true);
    }
    if (isCancelled(slot.id, cancelDate)) {
      return notify("This class is already cancelled for that date.", true);
    }

    updateData({
      exceptions: [
        ...data.exceptions,
        { id: createId(), slotId: slot.id, date: cancelDate }
      ]
    });
    notify("Class cancelled for the selected date.");
  }

  function addMakeup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getCourse(makeupCourse)) return notify("Select a course.", true);
    if (makeupStart >= makeupEnd) return notify("Invalid class time.", true);

    const recurringClash = slotsOnDate(makeupDate).some(slot =>
      overlaps(makeupStart, makeupEnd, slot.start, slot.end)
    );
    const makeupClash = data.makeupClasses.some(item =>
      item.date === makeupDate &&
      overlaps(makeupStart, makeupEnd, item.start, item.end)
    );

    if (recurringClash || makeupClash) {
      return notify("Makeup class overlaps with another class.", true);
    }

    updateData({
      makeupClasses: [...data.makeupClasses, {
        id: createId(),
        courseId: makeupCourse,
        date: makeupDate,
        start: makeupStart,
        end: makeupEnd,
        room: makeupRoom.trim()
      }]
    });
    notify("Makeup class added.");
  }

  // Assignments, exams, quizzes and projects
  function openDeadlineForm(item?: Deadline) {
    setEditingDeadline(item?.id ?? null);
    setDeadlineTitle(item?.title ?? "");
    setDeadlineCourse(item?.courseId ?? data.courses[0]?.id ?? "");
    setDeadlineType(item?.type ?? "Assignment");
    setDeadlineDate(item?.dueDate ?? todayString());
    setDeadlineTime(item?.dueTime ?? "23:59");
    setDeadlineFormOpen(true);
  }

  function saveDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getCourse(deadlineCourse)) return notify("Select a course.", true);
    if (!deadlineTitle.trim()) return notify("Enter a deadline title.", true);

    const previous = data.deadlines.find(item => item.id === editingDeadline);
    const item: Deadline = {
      id: editingDeadline ?? createId(),
      courseId: deadlineCourse,
      title: deadlineTitle.trim(),
      type: deadlineType,
      dueDate: deadlineDate,
      dueTime: deadlineTime,
      completed: previous?.completed ?? false
    };

    updateData({
      deadlines: editingDeadline
        ? data.deadlines.map(entry => entry.id === editingDeadline ? item : entry)
        : [...data.deadlines, item]
    });
    setDeadlineFormOpen(false);
    notify("Deadline saved successfully.");
  }

  function toggleDeadline(id: string) {
    updateData({
      deadlines: data.deadlines.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  }

  function deleteDeadline(id: string) {
    if (!window.confirm("Delete this deadline?")) return;
    updateData({ deadlines: data.deadlines.filter(item => item.id !== id) });
  }

  // Attendance is recorded against a specific class session and date.
  const availableSessions = [
    ...data.slots.filter(slot =>
      slot.courseId === attendanceCourse &&
      slot.day === dayFromDate(attendanceDate) &&
      !isCancelled(slot.id, attendanceDate)
    ).map(slot => ({
      id: slot.id,
      label: `${slot.start}–${slot.end} (Weekly class)`
    })),
    ...data.makeupClasses.filter(item =>
      item.courseId === attendanceCourse && item.date === attendanceDate
    ).map(item => ({
      id: item.id,
      label: `${item.start}–${item.end} (Makeup class)`
    }))
  ];

  function recordAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = availableSessions.find(item => item.id === attendanceSession);
    if (!session) return notify("Select a valid class session for this date.", true);
    if (attendanceDate > todayString()) {
      return notify("Attendance cannot be recorded for future classes.", true);
    }

    const duplicate = data.attendance.some(item =>
      item.courseId === attendanceCourse &&
      item.date === attendanceDate &&
      item.sessionId === attendanceSession
    );
    if (duplicate) return notify("Attendance for this session already exists.", true);

    updateData({
      attendance: [...data.attendance, {
        id: createId(),
        courseId: attendanceCourse,
        sessionId: attendanceSession,
        date: attendanceDate,
        status: attendanceStatus
      }]
    });
    setAttendanceSession("");
    notify("Attendance recorded successfully.");
  }

  // CSV values are escaped so exported files can be opened in spreadsheet apps.
  function csvValue(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const rows = [
      ["Course Code", "Course Name", "Day", "Start", "End", "Room"],
      ...data.slots.map(slot => [
        getCourse(slot.courseId)?.code ?? "",
        getCourse(slot.courseId)?.name ?? "",
        slot.day, slot.start, slot.end, slot.room
      ])
    ];

    downloadFile(
      rows.map(row => row.map(csvValue).join(",")).join("\r\n"),
      "semestersync-timetable.csv",
      "text/csv;charset=utf-8"
    );
  }

  function downloadTemplate() {
    downloadFile(
      "Course Code,Course Name,Day,Start,End,Room\r\nCS301,Web Programming,Monday,09:00,10:00,Room 101",
      "semestersync-template.csv",
      "text/csv;charset=utf-8"
    );
  }

  function parseCsv(content: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"') {
        if (quoted && content[i + 1] === '"') {
          value += '"';
          i++;
        } else quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(value.trim());
        value = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && content[i + 1] === "\n") i++;
        row.push(value.trim());
        if (row.some(cell => cell)) rows.push(row);
        row = [];
        value = "";
      } else {
        value += char;
      }
    }

    row.push(value.trim());
    if (row.some(cell => cell)) rows.push(row);
    if (quoted) throw new Error("CSV contains an unclosed quotation mark.");
    return rows;
  }

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = (await file.text()).replace(/^\uFEFF/, "");
      const rows = parseCsv(text);
      const expected = ["course code", "course name", "day", "start", "end", "room"];
      const headers = rows[0]?.map(item => item.toLowerCase()) ?? [];

      if (expected.some(header => !headers.includes(header))) {
        throw new Error("CSV must include Course Code, Course Name, Day, Start, End and Room.");
      }

      const index = (name: string) => headers.indexOf(name);
      const preview: CsvRow[] = [];

      for (const values of rows.slice(1)) {
        const row: CsvRow = {
          code: (values[index("course code")] ?? "").toUpperCase(),
          name: values[index("course name")] ?? "",
          day: values[index("day")] ?? "",
          start: values[index("start")] ?? "",
          end: values[index("end")] ?? "",
          room: values[index("room")] ?? "",
          error: ""
        };

        const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (!row.code || !row.name) row.error = "Missing course details";
        else if (!DAYS.includes(row.day)) row.error = "Invalid weekday";
        else if (!timeFormat.test(row.start) || !timeFormat.test(row.end)) {
          row.error = "Use HH:MM time format";
        } else if (row.start >= row.end) row.error = "Invalid time range";
        else if (data.courses.some(course =>
          course.code === row.code && course.name !== row.name
        )) row.error = "Course code already has another name";
        else if (hasClash(row.day, row.start, row.end)) {
          row.error = "Clashes with existing timetable";
        } else if (preview.some(previous =>
          !previous.error && previous.day === row.day &&
          overlaps(row.start, row.end, previous.start, previous.end)
        )) row.error = "Clashes with another CSV row";

        preview.push(row);
      }

      setCsvRows(preview);
      notify(`CSV preview ready: ${preview.length} rows.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not read CSV.", true);
    }
    event.target.value = "";
  }

  function confirmCsvImport() {
    const valid = csvRows.filter(row => !row.error);
    if (!valid.length) return notify("No valid rows to import.", true);

    const courses = [...data.courses];
    const slots = [...data.slots];

    for (const row of valid) {
      let course = courses.find(item => item.code === row.code);
      if (!course) {
        course = {
          id: createId(),
          code: row.code,
          name: row.name,
          color: COLORS[courses.length % COLORS.length]
        };
        courses.push(course);
      }

      slots.push({
        id: createId(),
        courseId: course.id,
        day: row.day,
        start: row.start,
        end: row.end,
        room: row.room
      });
    }

    updateData({ courses, slots });
    setCsvRows([]);
    notify(`${valid.length} classes imported successfully.`);
  }

  // Share codes work between demo accounts using the same browser storage.
  function generateShareCode() {
    if (!data.courses.length) return notify("Add courses before sharing.", true);

    const code = `SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const snapshot: ShareSnapshot = {
      code,
      courses: data.courses,
      slots: data.slots
    };

    localStorage.setItem(`ss_share_${code}`, JSON.stringify(snapshot));
    setShareCode(code);
    notify("Timetable share code generated.");
  }

  function importSharedTimetable() {
    const snapshot = readStorage<ShareSnapshot | null>(
      `ss_share_${importCode.trim().toUpperCase()}`, null
    );
    if (!snapshot) return notify("Share code not found in this browser.", true);

    const courses = [...data.courses];
    const slots = [...data.slots];
    const idMap = new Map<string, string>();

    for (const source of snapshot.courses) {
      let target = courses.find(course => course.code === source.code);
      if (!target) {
        target = { ...source, id: createId() };
        courses.push(target);
      }
      idMap.set(source.id, target.id);
    }

    for (const source of snapshot.slots) {
      const courseId = idMap.get(source.courseId);
      if (!courseId) continue;
      if (slots.some(slot =>
        slot.courseId === courseId &&
        slot.day === source.day &&
        slot.start === source.start &&
        slot.end === source.end
      )) continue;

      slots.push({ ...source, id: createId(), courseId });
    }

    updateData({ courses, slots });
    notify("Shared timetable copied. Deadlines and attendance were not copied.");
  }

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const name = (event.currentTarget.elements.namedItem("profileName") as HTMLInputElement).value.trim();
    const email = (event.currentTarget.elements.namedItem("profileEmail") as HTMLInputElement).value.trim().toLowerCase();

    if (!name || !email) return notify("Name and email are required.", true);
    if (accounts.some(item => item.email === email && item.id !== user.id)) {
      return notify("Email already belongs to another account.", true);
    }

    setAccounts(previous => previous.map(item =>
      item.id === user.id ? { ...item, name, email } : item
    ));
    notify("Profile updated successfully.");
  }

  const today = todayString();
  const todayClasses = [
    ...slotsOnDate(today).map(slot => ({
      id: slot.id,
      courseId: slot.courseId,
      start: slot.start,
      end: slot.end,
      room: slot.room,
      type: "Weekly"
    })),
    ...data.makeupClasses.filter(item => item.date === today).map(item => ({
      ...item,
      type: "Makeup"
    }))
  ].sort((a, b) => a.start.localeCompare(b.start));

  const upcomingDeadlines = data.deadlines
    .filter(item => !item.completed && !isOverdue(item))
    .sort((a, b) => `${a.dueDate}${a.dueTime}`.localeCompare(`${b.dueDate}${b.dueTime}`));

  const filteredDeadlines = data.deadlines.filter(item => {
    if (deadlineCourseFilter !== "all" && item.courseId !== deadlineCourseFilter) return false;
    if (deadlineFilter === "completed") return item.completed;
    if (deadlineFilter === "overdue") return isOverdue(item);
    if (deadlineFilter === "pending") return !item.completed && !isOverdue(item);
    if (["Assignment", "Exam", "Quiz", "Project"].includes(deadlineFilter)) {
      return item.type === deadlineFilter;
    }
    return true;
  }).sort((a, b) => `${a.dueDate}${a.dueTime}`.localeCompare(`${b.dueDate}${b.dueTime}`));

  const navigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Courses", icon: BookOpen },
    { label: "Timetable", icon: CalendarDays },
    { label: "Assignments", icon: ClipboardList },
    { label: "Attendance", icon: ClipboardCheck },
    { label: "Settings", icon: Settings }
  ];

  if (!currentUser || !user) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="brand-icon">S</div>
          <span>Semester<span className="brand-light">Sync</span></span>
        </div>
        <div className="auth-card">
          <div className="auth-icon"><CalendarDays size={29} /></div>
          <h1>{authMode === "login" ? "Welcome back" : "Create an account"}</h1>
          <p className="auth-subtitle">Your semester, organized in one place.</p>

          <div className="auth-tabs">
            <button className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => { setAuthMode("login"); notify(""); }}>Login</button>
            <button className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
              onClick={() => { setAuthMode("signup"); notify(""); }}>Sign Up</button>
          </div>

          <form onSubmit={handleAuth}>
            {authMode === "signup" && (
              <>
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <User size={18} />
                  <input required placeholder="Your name" value={authName}
                    onChange={e => setAuthName(e.target.value)} />
                </div>
              </>
            )}
            <label>Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={18} />
              <input required type="email" placeholder="student@example.com"
                value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            </div>
            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input required type="password" placeholder="Enter password"
                value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
            </div>
            {authMode === "signup" && (
              <>
                <label>Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={18} />
                  <input required type="password" placeholder="Confirm password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button auth-submit" type="submit">
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
          <p className="demo-note">Frontend demo: accounts are saved in this browser only.</p>
        </div>
      </div>
    );
  }

  if (loadedUser !== currentUser) {
    return <div className="loading-screen">Loading your semester...</div>;
  }

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>Semester<span className="brand-light">Sync</span></span>
        </div>
        <p className="menu-label">MAIN MENU</p>
        <nav className="nav-menu">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label}
                className={`nav-link ${page === item.label ? "active" : ""}`}
                onClick={() => { setPage(item.label); setSidebarOpen(false); notify(""); }}>
                <Icon size={19} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
            <button className="logout-button" onClick={logout} title="Logout">
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <button className="mobile-menu-button" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h2>{page}</h2>
              <p>Manage your semester with ease.</p>
            </div>
          </div>
          <div className="top-actions">
            <span className="date-label">{new Date().toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            })}</span>
          </div>
        </header>

        {message && <div className="notice success"><CheckCircle2 size={18} />{message}<button onClick={() => setMessage("")}><X size={16} /></button></div>}
        {error && <div className="notice error"><AlertTriangle size={18} />{error}<button onClick={() => setError("")}><X size={16} /></button></div>}

        {page === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div className="welcome-content">
                <span className="welcome-tag">YOUR ACADEMIC WORKSPACE</span>
                <h1>Hello, {user.name.split(" ")[0]}!</h1>
                <p>Stay on top of classes, assignments and attendance.</p>
                <button className="primary-button" onClick={() => setPage("Timetable")}>
                  <CalendarDays size={18} /> View Timetable
                </button>
              </div>
              <div className="banner-decoration">✦</div>
            </section>

            <div className="stats-grid">
              {[
                { title: "Total Courses", value: data.courses.length, icon: BookOpen },
                { title: "Today's Classes", value: todayClasses.length, icon: CalendarDays },
                { title: "Pending Deadlines", value: data.deadlines.filter(item => !item.completed).length, icon: ClipboardList },
                { title: "Overdue Tasks", value: data.deadlines.filter(isOverdue).length, icon: AlertTriangle }
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-top"><span>{stat.title}</span><Icon size={20} /></div>
                    <h2>{stat.value}</h2>
                    <small>Semester overview</small>
                  </div>
                );
              })}
            </div>

            <div className="content-grid">
              <section className="content-card">
                <div className="section-heading">
                  <div><h3>Today's Classes</h3><p>Your schedule for today</p></div>
                  <button className="text-link" onClick={() => setPage("Timetable")}>View all</button>
                </div>
                {todayClasses.length === 0 ? <p className="muted">No classes scheduled today.</p> :
                  todayClasses.map(item => (
                    <div className="class-item" key={item.id}>
                      <div className="class-indicator" style={{ background: getCourse(item.courseId)?.color }} />
                      <div className="class-details">
                        <strong>{getCourse(item.courseId)?.name}</strong>
                        <small><Clock size={14} /> {item.start} – {item.end}</small>
                        <small><MapPin size={14} /> {item.room || "No room assigned"}</small>
                      </div>
                      <span className="class-status">{item.type}</span>
                    </div>
                  ))}
              </section>

              <section className="content-card">
                <div className="section-heading">
                  <div><h3>Upcoming Deadlines</h3><p>Don't miss your next task</p></div>
                  <button className="text-link" onClick={() => setPage("Assignments")}>View all</button>
                </div>
                {upcomingDeadlines.length === 0 ? <p className="muted">No upcoming deadlines.</p> :
                  upcomingDeadlines.slice(0, 5).map(item => (
                    <div className="deadline-item" key={item.id}>
                      <div className="date-box">
                        <strong>{item.dueDate.slice(8)}</strong>
                        <small>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</small>
                      </div>
                      <div className="deadline-details">
                        <strong>{item.title}</strong>
                        <small>{getCourse(item.courseId)?.code} · {item.dueTime}</small>
                        <span>{item.type}</span>
                      </div>
                    </div>
                  ))}
              </section>
            </div>

            <section className="content-card section-spaced">
              <div className="section-heading"><div><h3>Course Attendance</h3><p>Based on recorded sessions</p></div></div>
              {data.courses.length === 0 ? <p className="muted">Add a course to see attendance.</p> :
                <div className="attendance-summary-grid">
                  {data.courses.map(course => (
                    <div className="attendance-summary" key={course.id}>
                      <div className="row-between"><strong>{course.code}</strong><strong>{getAttendancePercent(course.id)}%</strong></div>
                      <p>{course.name}</p>
                      <div className="progress-track"><div style={{ width: `${getAttendancePercent(course.id)}%`, background: course.color }} /></div>
                    </div>
                  ))}
                </div>}
            </section>
          </>
        )}

        {page === "Courses" && (
          <section className="courses-page">
            <div className="page-toolbar">
              <div><h3>My Courses</h3><p>Manage all your semester courses.</p></div>
              <button className="primary-button" onClick={() => openCourseForm()}><Plus size={17} /> Add Course</button>
            </div>
            <div className="course-search">
              <Search size={19} />
              <input placeholder="Search by course name or code..." value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)} />
            </div>
            <div className="courses-grid">
              {data.courses.filter(course =>
                `${course.code} ${course.name}`.toLowerCase().includes(courseSearch.toLowerCase())
              ).map(course => (
                <div className="course-card" key={course.id}>
                  <div className="course-color-bar" style={{ background: course.color }} />
                  <div className="course-card-content">
                    <div className="course-card-top">
                      <div className="course-icon" style={{ background: `${course.color}20`, color: course.color }}><BookOpen size={22} /></div>
                      <span className="course-code">{course.code}</span>
                    </div>
                    <h3>{course.name}</h3>
                    <p>{data.slots.filter(slot => slot.courseId === course.id).length} weekly classes</p>
                    <div className="course-actions">
                      <button onClick={() => openCourseForm(course)}><Pencil size={15} /> Edit</button>
                      <button className="delete-action" onClick={() => deleteCourse(course.id)}><Trash2 size={15} /> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data.courses.length === 0 && <div className="empty-state"><BookOpen size={35} /><h3>No courses yet</h3><p>Add your first course to get started.</p></div>}
          </section>
        )}

        {page === "Timetable" && (
          <>
            <div className="page-toolbar">
              <div><h3>Weekly Timetable</h3><p>Your recurring class schedule.</p></div>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={() => window.print()}><Printer size={17} /> Print</button>
                <button className="primary-button" onClick={() => openSlotForm()}><Plus size={17} /> Add Class</button>
              </div>
            </div>

            <div className="timetable-grid">
              {DAYS.map(day => (
                <div className="day-column" key={day}>
                  <div className="day-header">{day}</div>
                  <div className="day-content">
                    {data.slots.filter(slot => slot.day === day)
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map(slot => (
                        <div className="timetable-class" key={slot.id}
                          style={{ borderLeftColor: getCourse(slot.courseId)?.color }}>
                          <strong>{getCourse(slot.courseId)?.code}</strong>
                          <span>{getCourse(slot.courseId)?.name}</span>
                          <small><Clock size={13} /> {slot.start} – {slot.end}</small>
                          <small><MapPin size={13} /> {slot.room || "No room"}</small>
                          <div className="mini-actions">
                            <button onClick={() => openSlotForm(slot)} title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => deleteSlot(slot.id)} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    {!data.slots.some(slot => slot.day === day) && <p className="day-empty">No classes</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="content-grid section-spaced">
              <section className="content-card">
                <div className="section-heading"><div><h3>Cancel a Class</h3><p>Cancel one date without changing the weekly timetable.</p></div><CalendarX size={20} /></div>
                <form className="stacked-form" onSubmit={cancelClass}>
                  <label>Weekly Class</label>
                  <select required value={cancelSlot} onChange={e => setCancelSlot(e.target.value)}>
                    <option value="">Select class</option>
                    {data.slots.map(slot => <option key={slot.id} value={slot.id}>{getCourse(slot.courseId)?.code} · {slot.day} {slot.start}</option>)}
                  </select>
                  <label>Cancellation Date</label>
                  <input required type="date" value={cancelDate} onChange={e => setCancelDate(e.target.value)} />
                  <button className="secondary-button" type="submit">Cancel Selected Session</button>
                </form>
                {data.exceptions.map(item => {
                  const slot = data.slots.find(entry => entry.id === item.slotId);
                  return <div className="simple-list-item" key={item.id}>
                    <span>{getCourse(slot?.courseId ?? "")?.code} · {item.date}</span>
                    <button onClick={() => updateData({ exceptions: data.exceptions.filter(entry => entry.id !== item.id) })}><Trash2 size={16} /></button>
                  </div>;
                })}
              </section>

              <section className="content-card">
                <div className="section-heading"><div><h3>Makeup Classes</h3><p>Add a one-time replacement class.</p></div></div>
                <form className="stacked-form" onSubmit={addMakeup}>
                  <label>Course</label>
                  <select required value={makeupCourse} onChange={e => setMakeupCourse(e.target.value)}>
                    <option value="">Select course</option>
                    {data.courses.map(course => <option value={course.id} key={course.id}>{course.code} – {course.name}</option>)}
                  </select>
                  <label>Date</label>
                  <input required type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)} />
                  <div className="form-two-col">
                    <div><label>Start</label><input required type="time" value={makeupStart} onChange={e => setMakeupStart(e.target.value)} /></div>
                    <div><label>End</label><input required type="time" value={makeupEnd} onChange={e => setMakeupEnd(e.target.value)} /></div>
                  </div>
                  <label>Room</label>
                  <input value={makeupRoom} onChange={e => setMakeupRoom(e.target.value)} placeholder="Room 101" />
                  <button className="primary-button" type="submit"><Plus size={16} /> Add Makeup Class</button>
                </form>
                {data.makeupClasses.map(item => (
                  <div className="simple-list-item" key={item.id}>
                    <span>{getCourse(item.courseId)?.code} · {item.date} · {item.start}</span>
                    <button onClick={() => updateData({ makeupClasses: data.makeupClasses.filter(entry => entry.id !== item.id) })}><Trash2 size={16} /></button>
                  </div>
                ))}
              </section>
            </div>

            <div className="content-grid section-spaced">
              <section className="content-card">
                <div className="section-heading"><div><h3>CSV Import & Export</h3><p>Upload a timetable using the provided template.</p></div><Upload size={20} /></div>
                <div className="toolbar-actions">
                  <button className="secondary-button" onClick={downloadTemplate}><Download size={16} /> Template</button>
                  <button className="secondary-button" onClick={exportCsv}><Download size={16} /> Export CSV</button>
                </div>
                <label className="file-upload">Choose CSV File<input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} /></label>
                {csvRows.length > 0 && (
                  <>
                    <div className="csv-preview">
                      {csvRows.map((row, index) => (
                        <div className={`csv-row ${row.error ? "csv-invalid" : ""}`} key={index}>
                          <strong>{row.code} · {row.day} · {row.start}–{row.end}</strong>
                          <small>{row.error || "Valid"}</small>
                        </div>
                      ))}
                    </div>
                    <button className="primary-button" onClick={confirmCsvImport}>Import Valid Rows</button>
                  </>
                )}
              </section>

              <section className="content-card">
                <div className="section-heading"><div><h3>Share Timetable</h3><p>Copy courses and weekly slots between demo accounts.</p></div><Share2 size={20} /></div>
                <button className="primary-button" onClick={generateShareCode}><Share2 size={16} /> Generate Share Code</button>
                {shareCode && <div className="share-code"><strong>{shareCode}</strong><button onClick={() => navigator.clipboard.writeText(shareCode)}><Copy size={17} /></button></div>}
                <div className="stacked-form section-spaced">
                  <label>Import a Shared Timetable</label>
                  <input placeholder="Enter share code" value={importCode} onChange={e => setImportCode(e.target.value)} />
                  <button className="secondary-button" onClick={importSharedTimetable}>Import Timetable</button>
                </div>
                <p className="muted small-text">Sharing works within the same browser. Real cross-device sharing requires the backend.</p>
              </section>
            </div>
          </>
        )}

        {page === "Assignments" && (
          <>
            <div className="page-toolbar">
              <div><h3>Assignments & Exams</h3><p>Keep track of upcoming academic deadlines.</p></div>
              <button className="primary-button" onClick={() => openDeadlineForm()}><Plus size={17} /> Add Deadline</button>
            </div>
            <div className="filter-bar">
              <select value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)}>
                <option value="all">All Statuses & Types</option>
                <option value="pending">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
                <option value="Assignment">Assignments</option>
                <option value="Exam">Exams</option>
                <option value="Quiz">Quizzes</option>
                <option value="Project">Projects</option>
              </select>
              <select value={deadlineCourseFilter} onChange={e => setDeadlineCourseFilter(e.target.value)}>
                <option value="all">All Courses</option>
                {data.courses.map(course => <option key={course.id} value={course.id}>{course.code}</option>)}
              </select>
            </div>
            <div className="records-list">
              {filteredDeadlines.map(item => (
                <div className="record-card" key={item.id}>
                  <div className="record-main">
                    <span className={`status-tag ${item.completed ? "tag-green" : isOverdue(item) ? "tag-red" : ""}`}>
                      {item.completed ? "Completed" : isOverdue(item) ? "Overdue" : item.type}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{getCourse(item.courseId)?.code} · {item.type} · {item.dueDate} at {item.dueTime}</p>
                  </div>
                  <div className="record-actions">
                    <button onClick={() => toggleDeadline(item.id)} title="Toggle completion"><CheckCircle2 size={19} /></button>
                    <button onClick={() => openDeadlineForm(item)} title="Edit"><Pencil size={18} /></button>
                    <button onClick={() => deleteDeadline(item.id)} title="Delete"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              {filteredDeadlines.length === 0 && <div className="empty-state"><ClipboardList size={34} /><h3>No deadlines found</h3><p>Add a deadline or change your filters.</p></div>}
            </div>
          </>
        )}

        {page === "Attendance" && (
          <>
            <div className="page-toolbar"><div><h3>Attendance Tracker</h3><p>Monitor attendance for every course.</p></div></div>
            <div className="attendance-summary-grid">
              {data.courses.map(course => {
                const records = data.attendance.filter(item => item.courseId === course.id);
                return <div className="content-card" key={course.id}>
                  <div className="row-between"><strong>{course.code}</strong><strong>{getAttendancePercent(course.id)}%</strong></div>
                  <p className="muted">{course.name}</p>
                  <div className="progress-track"><div style={{ width: `${getAttendancePercent(course.id)}%`, background: course.color }} /></div>
                  <p className="muted small-text">{records.filter(item => item.status === "Present").length} attended / {records.length} recorded</p>
                </div>;
              })}
            </div>

            <section className="content-card section-spaced">
              <div className="section-heading"><div><h3>Record Attendance</h3><p>Choose a scheduled class session.</p></div></div>
              <form className="stacked-form" onSubmit={recordAttendance}>
                <label>Course</label>
                <select required value={attendanceCourse} onChange={e => { setAttendanceCourse(e.target.value); setAttendanceSession(""); }}>
                  <option value="">Select course</option>
                  {data.courses.map(course => <option value={course.id} key={course.id}>{course.code} – {course.name}</option>)}
                </select>
                <label>Class Date</label>
                <input required type="date" max={today} value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setAttendanceSession(""); }} />
                <label>Class Session</label>
                <select required value={attendanceSession} onChange={e => setAttendanceSession(e.target.value)}>
                  <option value="">Select scheduled session</option>
                  {availableSessions.map(session => <option key={session.id} value={session.id}>{session.label}</option>)}
                </select>
                <label>Status</label>
                <select value={attendanceStatus} onChange={e => setAttendanceStatus(e.target.value as "Present" | "Absent")}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
                <button className="primary-button" type="submit"><Save size={17} /> Save Attendance</button>
              </form>
            </section>

            <section className="content-card section-spaced">
              <div className="section-heading"><div><h3>Attendance History</h3><p>All recorded sessions.</p></div><History size={20} /></div>
              {data.attendance.length === 0 && <p className="muted">No attendance recorded yet.</p>}
              {[...data.attendance].sort((a, b) => b.date.localeCompare(a.date)).map(item => (
                <div className="simple-list-item" key={item.id}>
                  <span>{getCourse(item.courseId)?.code} · {item.date} · <strong>{item.status}</strong></span>
                  <button onClick={() => updateData({ attendance: data.attendance.filter(entry => entry.id !== item.id) })}><Trash2 size={16} /></button>
                </div>
              ))}
            </section>
          </>
        )}

        {page === "Settings" && (
          <>
            <section className="content-card settings-card">
              <div className="section-heading"><div><h3>Profile Settings</h3><p>Update your account information.</p></div><User size={20} /></div>
              <form className="stacked-form" onSubmit={updateProfile} key={user.id + user.email}>
                <label>Full Name</label>
                <input name="profileName" required defaultValue={user.name} />
                <label>Email Address</label>
                <input name="profileEmail" type="email" required defaultValue={user.email} />
                <button className="primary-button" type="submit"><Save size={17} /> Save Changes</button>
              </form>
            </section>
            <section className="content-card section-spaced settings-card">
              <div className="section-heading"><div><h3>Data Management</h3><p>Backup or reset your semester data.</p></div></div>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={() => downloadFile(
                  JSON.stringify(data, null, 2), "semestersync-backup.json", "application/json"
                )}><Download size={17} /> Export Backup</button>
                <button className="danger-button" onClick={() => {
                  if (window.confirm("Delete all your academic data? This cannot be undone.")) {
                    setData({ courses: [], slots: [], exceptions: [], makeupClasses: [], deadlines: [], attendance: [] });
                    notify("Academic data reset successfully.");
                  }
                }}><Trash2 size={17} /> Reset Academic Data</button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Forms stay in modals so the main pages remain uncluttered. */}
      {courseFormOpen && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCourseFormOpen(false); }}>
          <div className="course-modal">
            <div className="modal-heading"><div><h3>{editingCourse ? "Edit Course" : "Add New Course"}</h3><p>Enter your course details.</p></div><button className="close-button" onClick={() => setCourseFormOpen(false)}><X size={20} /></button></div>
            <form className="stacked-form" onSubmit={saveCourse}>
              <label>Course Code</label>
              <input required value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="CS301" />
              <label>Course Name</label>
              <input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Web Programming" />
              <label>Course Color</label>
              <div className="color-picker-row">
                {COLORS.map(color => <button type="button" aria-label={`Select ${color}`} key={color}
                  className={`color-option ${courseColor === color ? "selected" : ""}`}
                  style={{ background: color }} onClick={() => setCourseColor(color)} />)}
                <input type="color" value={courseColor} onChange={e => setCourseColor(e.target.value)} />
              </div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCourseFormOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Save size={16} /> Save Course</button></div>
            </form>
          </div>
        </div>
      )}

      {slotFormOpen && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setSlotFormOpen(false); }}>
          <div className="course-modal">
            <div className="modal-heading"><div><h3>{editingSlot ? "Edit Class" : "Add Weekly Class"}</h3><p>Set the course, day and time.</p></div><button className="close-button" onClick={() => setSlotFormOpen(false)}><X size={20} /></button></div>
            <form className="stacked-form" onSubmit={saveSlot}>
              <label>Course</label>
              <select required value={slotCourse} onChange={e => setSlotCourse(e.target.value)}>
                <option value="">Select course</option>
                {data.courses.map(course => <option key={course.id} value={course.id}>{course.code} – {course.name}</option>)}
              </select>
              <label>Weekday</label>
              <select value={slotDay} onChange={e => setSlotDay(e.target.value)}>
                {DAYS.map(day => <option key={day}>{day}</option>)}
              </select>
              <div className="form-two-col">
                <div><label>Start Time</label><input required type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} /></div>
                <div><label>End Time</label><input required type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} /></div>
              </div>
              <label>Room</label>
              <input value={slotRoom} onChange={e => setSlotRoom(e.target.value)} placeholder="Room 101" />
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setSlotFormOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Save size={16} /> Save Class</button></div>
            </form>
          </div>
        </div>
      )}

      {deadlineFormOpen && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setDeadlineFormOpen(false); }}>
          <div className="course-modal">
            <div className="modal-heading"><div><h3>{editingDeadline ? "Edit Deadline" : "Add Deadline"}</h3><p>Track your assignments and exams.</p></div><button className="close-button" onClick={() => setDeadlineFormOpen(false)}><X size={20} /></button></div>
            <form className="stacked-form" onSubmit={saveDeadline}>
              <label>Title</label>
              <input required value={deadlineTitle} onChange={e => setDeadlineTitle(e.target.value)} placeholder="Assignment 1" />
              <label>Course</label>
              <select required value={deadlineCourse} onChange={e => setDeadlineCourse(e.target.value)}>
                <option value="">Select course</option>
                {data.courses.map(course => <option key={course.id} value={course.id}>{course.code} – {course.name}</option>)}
              </select>
              <label>Type</label>
              <select value={deadlineType} onChange={e => setDeadlineType(e.target.value as Deadline["type"])}>
                {["Assignment", "Exam", "Quiz", "Project"].map(type => <option key={type}>{type}</option>)}
              </select>
              <div className="form-two-col">
                <div><label>Due Date</label><input required type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} /></div>
                <div><label>Due Time</label><input required type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} /></div>
              </div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDeadlineFormOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Save size={16} /> Save Deadline</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
