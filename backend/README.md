
# SemesterSync

**SemesterSync** is a full-stack semester management web application developed for a Web Programming course project.

It helps students organize courses, weekly class schedules, assignments, examinations, attendance, and academic deadlines in one place.

## Features

### Authentication
- Student signup and login
- Secure password hashing
- JWT-based authentication
- Profile management
- User-specific academic data

### Course Management
- Add, edit, and delete courses
- Assign course codes, names, and colors
- Manage multiple weekly classes per course

### Weekly Timetable
- View a weekly class schedule
- Add, edit, and delete class sessions
- Detect overlapping class timings
- Cancel individual class sessions
- Schedule one-time makeup classes
- Print the timetable

### Assignments and Deadlines
- Manage assignments, quizzes, exams, and projects
- Set due dates and times
- Mark tasks as completed
- Filter deadlines by course, type, or status
- Identify overdue tasks

### Attendance Tracking
- Mark students as Present or Absent
- Record attendance for individual class sessions
- Prevent duplicate attendance records
- View course-wise attendance percentages

### Dashboard
- Today's scheduled classes
- Upcoming academic deadlines
- Pending and overdue tasks
- Course attendance overview

### CSV Import and Export
- Download a CSV timetable template
- Upload timetable data
- Preview imported rows
- Validate class details and detect conflicts
- Confirm import after validation
- Export timetable data to CSV

### Timetable Sharing
- Generate a timetable sharing code
- Copy courses and weekly class slots between accounts
- Keep personal attendance and deadlines separate

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Tokens
- bcryptjs
- csv-parse

**Development Tools**
- Visual Studio Code
- Git and GitHub
- npm

## Project Structure

```text
SemesterSync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── src/
│   ├── api/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── store.ts
├── package.json
└── README.md
```

## Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- Git
- A MongoDB Atlas account
- Visual Studio Code or another code editor

### 1. Clone the repository

```bash
git clone https://github.com/anoor378/SemesterSync.git
cd SemesterSync
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure backend environment variables

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret_key
```

Replace the placeholders with your own configuration.

Never commit `.env` files or database credentials to GitHub.

### 5. Configure frontend environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the backend

Open a terminal inside the `backend` folder:

```bash
npm run dev
```

The backend runs at:

http://localhost:5000

Health check:

http://localhost:5000/api/health

### 7. Start the frontend

Open another terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

http://localhost:5173

## Production Build

To check the frontend production build:

```bash
npm run build
```

## CSV Template

SemesterSync supports timetable imports using these columns:

| Course Code | Course Name | Day | Start | End | Room |
|---|---|---|---|---|---|
| CS301 | Web Programming | Monday | 09:00 | 10:00 | Room 101 |

The application provides a downloadable CSV template.

## Security

- Passwords are hashed before storage.
- Authentication uses JSON Web Tokens.
- Academic records are associated with individual user accounts.
- Sensitive credentials are configured using environment variables.

## Project Scope

SemesterSync focuses on student semester planning and academic record management.

The application does not require third-party calendar synchronization, automated reminders, or external scheduling services.

## Academic Project

Developed as a Web Programming semester project.

**SemesterSync — Your semester, organized in one place.**
