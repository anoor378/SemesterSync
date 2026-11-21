# SemesterSync Backend

Express + MongoDB REST API for the existing SemesterSync React frontend.

## Setup
1. Install Node.js 20+ and start MongoDB locally (or use a MongoDB Atlas connection URI).
2. In `backend`, run `npm install`.
3. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random string.
4. Run `npm run dev` and open `http://localhost:5000/api/health`.

## Authentication
`POST /api/auth/signup` (`name,email,password`), `POST /api/auth/login` (`email,password`), `GET /api/auth/me`, `PATCH /api/auth/me`.
Send `Authorization: Bearer <token>` for all other routes.

## CRUD
`GET /api/{courses|slots|exceptions|makeupClasses|deadlines|attendance}`
`POST /api/{resource}` with model fields; `PATCH /api/{resource}/:id`; `DELETE /api/{resource}/:id`.
All records are scoped to the authenticated user. Course deletion cascades to related records.

## Other routes
`GET /api/dashboard`, `POST /api/share`, `GET /api/share/:code`, `POST /api/share/:code/copy`, `POST /api/import/preview` with `{csv:"..."}`, `POST /api/import/confirm` with `{rows:[...]}`.

## Important
This package is backend-only; existing frontend still uses localStorage until integration. API integration and end-to-end tests remain necessary. `id` values are MongoDB document IDs (not frontend UUIDs). Share copy and CSV import are not transactional; test and harden before production use.
