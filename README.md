# SemesterSync – Semester Schedule & Deadline Manager

A student-focused web application designed to organize academic activities in one place. SemesterSync helps students manage their courses, weekly class schedules, assignments, exams, and attendance through a simple and responsive dashboard.

## Overview

Students often manage their academic schedules and deadlines across multiple platforms, making it difficult to stay organized. SemesterSync brings essential academic information together in one application, helping students keep track of their semester activities more efficiently.

## Features

- **User Authentication:** Sign up, log in, and manage a personal profile.
- **Dashboard:** View academic information and important upcoming activities.
- **Course Management:** Add, edit, view, and delete courses.
- **Weekly Timetable:** Organize classes by weekday, time, and room.
- **Class Clash Detection:** Identify overlapping class schedules.
- **Makeup Classes:** Manage one-time makeup class schedules.
- **Assignments & Exams:** Track academic deadlines and completion status.
- **Attendance Tracking:** Record attendance and view course-wise attendance statistics.
- **Attendance History:** Review previously recorded attendance.
- **Data Persistence:** Store application data locally using browser LocalStorage.
- **Responsive Interface:** Designed for desktop and mobile screens.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend development |
| TypeScript | Type safety and data models |
| CSS | Styling and responsive layouts |
| Vite | Development server and build tool |
| React Hooks | State and component management |
| LocalStorage | Client-side data persistence |
| Lucide React | Icons |

## Project Structure

```text
SemesterSync/
│
├── public/
├── src/
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/anoor378/SemesterSync.git
```

### 2. Navigate to the Project

```bash
cd SemesterSync
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access SemesterSync.

## Current Development Status

SemesterSync is currently under development.

The frontend includes the core academic management interface and major student-facing modules. Backend integration, database connectivity, and additional functionality are planned for future development.

## Future Improvements

- Node.js and Express backend integration.
- Database connectivity using MongoDB or MySQL.
- Backend-based authentication and user ownership.
- Redux Toolkit for shared authentication state.
- CSV timetable import with validation and preview.
- Timetable sharing through unique codes.
- Date-specific class cancellation and exceptions.
- API integration and improved data synchronization.

## Project Information

**Project:** SemesterSync – Semester Schedule & Deadline Manager  
**Course:** Web Programming  
**Semester:** Fall 2026  
**Frontend:** React + TypeScript + CSS

---

*SemesterSync – Keep your semester organized, one schedule at a time.*