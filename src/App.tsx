
import { useEffect, useState, type FormEvent } from "react";
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  ClipboardCheck, Settings, Search, Bell, Plus, Clock, MapPin,
  CheckCircle2, Pencil, Trash2, X, Save, ArrowLeft, LogOut,
  Lock, Mail, User, GraduationCap
} from "lucide-react";
import "./App.css";

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

const initialCourses: Course[] = [
  { id: 1, code: "CS301", name: "Data Warehousing", color: "#8974e8" },
  { id: 2, code: "CS402", name: "Deep Learning", color: "#55a8e9" },
  { id: 3, code: "CS305", name: "Web Programming", color: "#efa45f" }
];

const classes = [
  { time: "09:00 - 10:30", name: "Data Warehousing", room: "Room 204", color: "purple" },
  { time: "11:00 - 12:30", name: "Deep Learning", room: "Lab 3", color: "blue" },
  { time: "01:00 - 02:30", name: "Web Programming", room: "Room 105", color: "orange" }
];

const deadlines = [
  { title: "Web Programming Project", course: "Web Programming", date: "Nov 07", type: "Project" },
  { title: "Deep Learning Quiz", course: "Deep Learning", date: "Nov 09", type: "Quiz" },
  { title: "Database Assignment", course: "DBMS", date: "Nov 12", type: "Assignment" }
];

function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("semestersync_accounts") || "[]");
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<Account | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("semestersync_user") || "null");
    } catch {
      return null;
    }
  });

  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem("semestersync_courses");
      return saved ? JSON.parse(saved) : initialCourses;
    } catch {
      return initialCourses;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseColor, setCourseColor] = useState("#8974e8");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    localStorage.setItem("semestersync_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("semestersync_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("semestersync_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("semestersync_courses", JSON.stringify(courses));
  }, [courses]);

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");

    if (!authName.trim() || !authEmail.trim() || !authPassword) {
      setAuthError("Please fill in all fields.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Password must contain at least 6 characters.");
      return;
    }

    if (authPassword !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    const exists = accounts.some(
      account => account.email.toLowerCase() === authEmail.trim().toLowerCase()
    );

    if (exists) {
      setAuthError("An account with this email already exists. Please login.");
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
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setConfirmPassword("");
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");

    const account = accounts.find(
      item =>
        item.email === authEmail.trim().toLowerCase() &&
        item.password === authPassword
    );

    if (!account) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    setCurrentUser(account);
    setActivePage("Dashboard");
    setAuthEmail("");
    setAuthPassword("");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePage("Dashboard");
    setAuthPage("login");
    setAuthError("");
    setAuthPassword("");
    setConfirmPassword("");
  };

  const openAddModal = () => {
    setEditingId(null);
    setCourseName("");
    setCourseCode("");
    setCourseColor("#8974e8");
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditingId(course.id);
    setCourseName(course.name);
    setCourseCode(course.code);
    setCourseColor(course.color);
    setShowModal(true);
  };

  const saveCourse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!courseName.trim() || !courseCode.trim()) {
      alert("Please enter both course name and course code.");
      return;
    }

    const duplicate = courses.some(
      course =>
        course.code.toLowerCase() === courseCode.trim().toLowerCase() &&
        course.id !== editingId
    );

    if (duplicate) {
      alert("A course with this code already exists.");
      return;
    }

    if (editingId !== null) {
      setCourses(previous =>
        previous.map(course =>
          course.id === editingId
            ? {
                ...course,
                name: courseName.trim(),
                code: courseCode.trim().toUpperCase(),
                color: courseColor
              }
            : course
        )
      );
    } else {
      const newCourse: Course = {
        id: Date.now(),
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase(),
        color: courseColor
      };
      setCourses(previous => [...previous, newCourse]);
    }

    setShowModal(false);
  };

  const deleteCourse = (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(previous => previous.filter(course => course.id !== id));
    }
  };

  const filteredCourses = courses.filter(course =>
    `${course.name} ${course.code}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="brand-icon">S</div>
          <span>Semester<span className="brand-light">Sync</span></span>
        </div>

        <div className="auth-card">
          <div className="auth-icon">
            <GraduationCap size={30} />
          </div>

          <h1>{authPage === "login" ? "Welcome Back!" : "Create Your Account"}</h1>
          <p className="auth-subtitle">
            {authPage === "login"
              ? "Login to manage your semester."
              : "Start organizing your academic life."}
          </p>

          <div className="auth-tabs">
            <button
              className={authPage === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setAuthPage("login");
                setAuthError("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={authPage === "signup" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setAuthPage("signup");
                setAuthError("");
              }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={authPage === "login" ? handleLogin : handleSignup}>
            {authPage === "signup" && (
              <>
                <label htmlFor="authName">Full Name</label>
                <div className="auth-input-wrap">
                  <User size={18} />
                  <input
                    id="authName"
                    type="text"
                    placeholder="Enter your full name"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="authEmail">Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={18} />
              <input
                id="authEmail"
                type="email"
                placeholder="student@example.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <label htmlFor="authPassword">Password</label>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input
                id="authPassword"
                type="password"
                placeholder="Enter your password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
              />
            </div>

            {authPage === "signup" && (
              <>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={18} />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {authError && <div className="auth-error">{authError}</div>}

            <button className="auth-submit" type="submit">
              {authPage === "login" ? "Login to Dashboard" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authPage === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setAuthPage(authPage === "login" ? "signup" : "login");
                setAuthError("");
              }}
            >
              {authPage === "login" ? " Sign Up" : " Login"}
            </button>
          </p>
        </div>

        <p className="auth-footer">© 2026 SemesterSync. Organize your semester smarter.</p>
      </div>
    );
  }

  const renderDashboard = () => (
    <>
      <section className="welcome-banner">
        <div>
          <span className="welcome-tag">YOUR ACADEMIC SPACE</span>
          <h1>Stay organized.<br />Stay ahead.</h1>
          <p>Manage your classes, deadlines and attendance all in one place.</p>
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={18} /> Add New Course
          </button>
        </div>
        <div className="banner-decoration">S</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top"><span>Total Courses</span><BookOpen /></div>
          <h2>{String(courses.length).padStart(2, "0")}</h2>
          <small>Active this semester</small>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Today's Classes</span><CalendarDays /></div>
          <h2>03</h2>
          <small>Scheduled for today</small>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Pending Tasks</span><ClipboardList /></div>
          <h2>05</h2>
          <small>Need your attention</small>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Attendance</span><CheckCircle2 /></div>
          <h2>87%</h2>
          <small>Overall attendance</small>
        </div>
      </section>

      <section className="content-grid">
        <div className="content-card">
          <div className="section-heading">
            <div><h3>Today's Schedule</h3><p>Your classes for today</p></div>
            <a href="#" onClick={e => e.preventDefault()}>View Timetable</a>
          </div>
          {classes.map((item, index) => (
            <div className="class-item" key={index}>
              <div className={`class-indicator ${item.color}`} />
              <div className="class-details">
                <strong>{item.name}</strong>
                <small><Clock size={13} /> {item.time}</small>
                <small><MapPin size={13} /> {item.room}</small>
              </div>
              <span className="class-status">Class</span>
            </div>
          ))}
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div><h3>Upcoming Deadlines</h3><p>Don't miss your submissions</p></div>
            <a href="#" onClick={e => e.preventDefault()}>View All</a>
          </div>
          {deadlines.map((item, index) => (
            <div className="deadline-item" key={index}>
              <div className="date-box">
                <strong>{item.date.split(" ")[1]}</strong>
                <small>{item.date.split(" ")[0]}</small>
              </div>
              <div className="deadline-details">
                <strong>{item.title}</strong>
                <small>{item.course}</small>
                <span>{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderCourses = () => (
    <section className="courses-page">
      <div className="courses-toolbar">
        <div><h3>My Courses</h3><p>Manage all your semester courses in one place.</p></div>
        <button className="primary-button" onClick={openAddModal}>
          <Plus size={18} /> Add Course
        </button>
      </div>

      <div className="course-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search by course name or code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="course-summary">
        <div><span>Total Registered Courses</span><h2>{courses.length}</h2></div>
        <BookOpen size={27} />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={38} />
          <h3>No courses found</h3>
          <p>Add a new course or change your search.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div className="course-card" key={course.id}>
              <div className="course-color-bar" style={{ backgroundColor: course.color }} />
              <div className="course-card-content">
                <div className="course-card-top">
                  <div className="course-icon" style={{
                    backgroundColor: `${course.color}20`, color: course.color
                  }}>
                    <BookOpen size={23} />
                  </div>
                  <span className="course-code">{course.code}</span>
                </div>
                <h3>{course.name}</h3>
                <p>Registered course</p>
                <div className="course-actions">
                  <button onClick={() => openEditModal(course)}><Pencil size={15} /> Edit</button>
                  <button className="delete-action" onClick={() => deleteCourse(course.id)}>
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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>Semester<span className="brand-light">Sync</span></span>
        </div>

        <p className="menu-label">MENU</p>
        <nav className="nav-menu">
          <button className={`nav-link ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("Dashboard")}>
            <LayoutDashboard size={19} /> Dashboard
          </button>
          <button className={`nav-link ${activePage === "Timetable" ? "active" : ""}`}
            onClick={() => setActivePage("Timetable")}>
            <CalendarDays size={19} /> Timetable
          </button>
          <button className={`nav-link ${activePage === "My Courses" ? "active" : ""}`}
            onClick={() => setActivePage("My Courses")}>
            <BookOpen size={19} /> My Courses
          </button>
          <button className={`nav-link ${activePage === "Assignments" ? "active" : ""}`}
            onClick={() => setActivePage("Assignments")}>
            <ClipboardList size={19} /> Assignments
          </button>
          <button className={`nav-link ${activePage === "Attendance" ? "active" : ""}`}
            onClick={() => setActivePage("Attendance")}>
            <ClipboardCheck size={19} /> Attendance
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className={`nav-link ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => setActivePage("Settings")}>
            <Settings size={19} /> Settings
          </button>
          <div className="profile">
            <div className="avatar">
              {currentUser.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{currentUser.name}</strong>
              <small>Semester Student</small>
            </div>
            <button className="logout-button" onClick={handleLogout} title="Logout" aria-label="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{activePage}</h2>
            <p>{activePage === "Dashboard"
              ? `Welcome back, ${currentUser.name}! Here's your semester overview.`
              : `Manage your ${activePage.toLowerCase()} here.`}</p>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search"><Search size={19} /></button>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="avatar">
              {currentUser.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {activePage === "Dashboard" && renderDashboard()}
        {activePage === "My Courses" && renderCourses()}

        {activePage !== "Dashboard" && activePage !== "My Courses" && (
          <div className="empty-state">
            <CalendarDays size={38} />
            <h3>{activePage} coming next!</h3>
            <p>We will implement this module in the next development step.</p>
            <button className="primary-button" onClick={() => setActivePage("Dashboard")}>
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        )}

        <footer>© 2026 SemesterSync. Organize your semester smarter.</footer>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h3>{editingId !== null ? "Edit Course" : "Add New Course"}</h3>
                <p>Enter your course information below.</p>
              </div>
              <button className="close-button" onClick={() => setShowModal(false)}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveCourse}>
              <label htmlFor="courseName">Course Name</label>
              <input id="courseName" type="text" placeholder="e.g. Web Programming"
                value={courseName} onChange={e => setCourseName(e.target.value)} required />

              <label htmlFor="courseCode">Course Code</label>
              <input id="courseCode" type="text" placeholder="e.g. CS301"
                value={courseCode} onChange={e => setCourseCode(e.target.value)} required />

              <label htmlFor="courseColor">Course Color</label>
              <div className="color-picker-row">
                {["#8974e8", "#55a8e9", "#efa45f", "#48b99b", "#e8759b"].map(color => (
                  <button type="button" key={color}
                    className={`color-option ${courseColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCourseColor(color)}
                    aria-label={`Select color ${color}`} />
                ))}
                <input type="color" value={courseColor}
                  onChange={e => setCourseColor(e.target.value)}
                  aria-label="Custom course color" />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-button">
                  <Save size={16} /> {editingId !== null ? "Save Changes" : "Add Course"}
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
