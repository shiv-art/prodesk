# Team Task Manager (Full-Stack)

A full-stack task manager where teams can create projects, add members, assign tasks, and track progress with role-based access.

## Features Implemented

- Authentication: Signup/Login with JWT
- Project management: Create projects, view project list
- Team management: Add users to a project with `ADMIN` or `MEMBER` role
- Task management: Create tasks, assign to project members, track task status
- Dashboard summary: My tasks, status distribution, overdue task count
- Role-based access:
  - Project admins can add members
  - Only assignee or project admin can change task status

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (Mongoose ODM)
- Auth: JWT + bcrypt
- Deployment: Railway

## Project Structure

- `backend` - Express APIs and Mongo models
- `frontend` - React app dashboard UI

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:projectId/members`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId/status`
- `GET /api/tasks/dashboard/summary`

## Local Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set values in `backend/.env`:

- `PORT=4000`
- `MONGO_URI=...`
- `JWT_SECRET=...`

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set in `frontend/.env`:

- `VITE_API_URL=http://localhost:4000/api`

## Railway Deployment (Mandatory)

Create **two Railway services** from this repository:

1. **Backend service**
   - Root directory: `backend`
   - Start command: `npm start`
   - Environment variables:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `PORT` (Railway sets this automatically, optional)
   - Deploy and copy the backend URL.

2. **Frontend service**
   - Root directory: `frontend`
   - Start command: `npm run build && npm run preview -- --host 0.0.0.0 --port $PORT`
   - Environment variables:
     - `VITE_API_URL=<your-backend-url>/api`
   - Redeploy frontend after setting `VITE_API_URL`.

## Submission Checklist

- Live URL: `<ADD_FRONTEND_RAILWAY_URL>`
- GitHub Repo: `<ADD_GITHUB_REPO_URL>`
- README: Completed (this file)

## Notes

- To add a member, that user must sign up first.
- Recommended flow:
  1. Signup as admin user
  2. Create project
  3. Signup second user
  4. Add second user as member/admin by email
  5. Create and assign tasks
