
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  Settings,
  Search,
  Bell,
  Plus,
  Clock,
  MapPin,
  CheckCircle2
} from "lucide-react";
import "./App.css";

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
  return (
    <div className="app-layout">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>Semester<span className="brand-light">Sync</span></span>
        </div>

        <p className="menu-label">MENU</p>

        <nav className="nav-menu">
          <a className="nav-link active"><LayoutDashboard size={19} /> Dashboard</a>
          <a className="nav-link"><CalendarDays size={19} /> Timetable</a>
          <a className="nav-link"><BookOpen size={19} /> My Courses</a>
          <a className="nav-link"><ClipboardList size={19} /> Assignments</a>
          <a className="nav-link"><ClipboardCheck size={19} /> Attendance</a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-link"><Settings size={19} /> Settings</a>
          <div className="profile">
            <div className="avatar">AN</div>
            <div>
              <strong>Student Name</strong>
              <small>Semester Student</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back! Here's your semester overview.</p>
          </div>
          <div className="top-actions">
            <button className="icon-button"><Search size={19} /></button>
            <button className="icon-button"><Bell size={19} /></button>
            <div className="avatar">AN</div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="welcome-tag">YOUR ACADEMIC SPACE</span>
            <h1>Stay organized.<br />Stay ahead.</h1>
            <p>Manage your classes, deadlines and attendance all in one place.</p>
            <button className="primary-button">
              <Plus size={18} /> Add New Course
            </button>
          </div>
          <div className="banner-decoration">S</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top"><span>Total Courses</span><BookOpen /></div>
            <h2>06</h2>
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
              <div>
                <h3>Today's Schedule</h3>
                <p>Your classes for today</p>
              </div>
              <a href="#">View Timetable</a>
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
              <div>
                <h3>Upcoming Deadlines</h3>
                <p>Don't miss your submissions</p>
              </div>
              <a href="#">View All</a>
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

        <footer>© 2026 SemesterSync. Organize your semester smarter.</footer>

      </main>
    </div>
  );
}

export default App;
