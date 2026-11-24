# Student Task & Assignment Planner

A university coursework and study productivity Progressive Web Application (PWA) built with **React 18**, **TypeScript**, **Vite**, **Express**, **Node.js**, and **MongoDB**.

---

## 1. Quick Windows Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- MongoDB Community Server or MongoDB Atlas cluster connection string
- PowerShell or Windows Command Prompt

### Step 1: Install Dependencies
Open PowerShell in the project directory:

```powershell
cd student-planner-practice

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install
```

### Step 2: Environment Configuration

In `student-planner-practice\backend`:
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Default parameters in `.env`:
- `PORT=4000`
- `MONGODB_URI=mongodb://127.0.0.1:27017/student_planner`
- `JWT_SECRET=development-only-change-this-secret-32-chars-long`
- `CLIENT_ORIGIN=http://localhost:5173`

In `student-planner-practice\frontend`:
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Default parameters in `.env`:
- `VITE_API_URL=http://localhost:4000/api`

---

## 2. Running the Application

### Terminal 1: Start Backend API & Reminder Scheduler
```powershell
cd student-planner-practice\backend
npm run dev
```
The API listens at `http://localhost:4000/api`. The automated deadline reminder scheduler runs every 30 minutes.

### Terminal 2: Start Frontend Application
```powershell
cd student-planner-practice\frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 3. Running Automated Tests

### Backend Unit & Integration Tests (Vitest)
```powershell
cd student-planner-practice\backend
npm test
```
Runs 10 automated test suites covering password length validation, JWT security, tenant assignment isolation, task completion toggles, and invalid ID error handling.

### Frontend Data Contract Tests (Vitest)
```powershell
cd student-planner-practice\frontend
npm test
```

---

## 4. Production Builds

### Backend Production Build
```powershell
cd student-planner-practice\backend
npm run build
npm start
```

### Frontend Production Build
```powershell
cd student-planner-practice\frontend
npm run build
npm run preview
```

---

## 5. Architectural Overview & Design Patterns
- **Repository Pattern (`PlannerRepository.ts`):** Abstracts MongoDB queries.
- **Service Layer Pattern (`PlannerService.ts`, `AuthService.ts`, `PushService.ts`):** Encapsulates business validation and ownership logic.
- **Controller Pattern (`controllers.ts`):** Handles HTTP request parsing and response statuses.
- **Middleware Pattern (`auth.ts`, `validate.ts`, `errorHandler.ts`):** Centralizes JWT verification, Zod validation, and safe error masking.
- **Progressive Web App & Offline Storage (`indexedDB.ts`, `sw.js`):** Service worker caches static assets; IndexedDB caches coursework and queues offline modifications for automated online sync.

---

## 6. Documentation Index
- `docs/API.md`: Detailed REST API reference with sample request/response payloads.
- `docs/ARCHITECTURE.md`: System architecture and UML Class/Sequence diagrams.
- `docs/DESIGN.md`: Student persona, storyboard, and wireframe specs.
- `docs/RUBRIC-COMPLETION-MATRIX.md`: Complete assessment checklist.
- `postman/Student-Planner.postman_collection.json`: Importable Postman test collection.
