# Auckland International Campus (AIC) / Otago Polytechnic
## IA730001 – Advanced Application Development Concepts
### Final Assessment Report — Student Task & Assignment Planner

**Student Name:** [Insert Your Full Name]  
**Student ID:** [Insert Your Student ID]  
**Programme:** Bachelor of Information Technology (BIT) / GDIT  
**Course Code & Title:** IA730001 – Advanced Application Development Concepts  
**Date of Submission:** November 2026  
**GitHub Repository:** [Insert your GitHub repository link here]  
**Figma Prototype / File Link:** `[PENDING: Insert your shared Figma board/file link here before submitting]`

---

## 1. Executive Summary & Project Overview
The **Student Task & Assignment Planner** is an enterprise-grade Progressive Web Application (PWA) developed to assist university students in organizing coursework, managing assignment deadlines, scheduling daily study revision tasks, and receiving timely automated push reminders.

The system is constructed using **React 18**, **TypeScript**, **Vite**, **Node.js**, **Express.js**, and **MongoDB**, adhering to strict software engineering standards, security principles, architectural design patterns, and offline-first capabilities.

---

## 2. Phase 1: Design Phase Deliverables

### 2.1 Figma High-Fidelity UI Wireframes & Prototype Link
- **Figma Share Link:** `[PENDING STUDENT ACTION: Create/Paste Figma Board URL Here]`
- **Design Specifications Followed:** Detailed in `docs/DESIGN.md`, covering:
  - 8-point typographic and spacing scale.
  - Apple macOS Ventura/Sonoma frosted translucent styling (`rgba(255, 255, 255, 0.75)`, `backdrop-filter: blur(20px)`).
  - High-contrast accessible color tokens: Primary Academic Blue (`#0071e3`), Emerald Success (`#34c759`), Amber Warning (`#ff9f0a`), Crimson Danger (`#ff3b30`).
  - Wireframe screens: Authentication, Executive Dashboard, Assignment Manager, Study Tasks, Settings & Security.

### 2.2 Fictional Student Persona
- **Persona Name:** Liam Chen
- **Age:** 21
- **Programme:** Bachelor of Information Technology (Year 3)
- **Institution:** Auckland International Campus (AIC), Otago Polytechnic
- **Goals:** Track major university project deadlines across 4 technical courses, prevent last-minute penalty submissions, and maintain daily 45-minute study sessions.
- **Pain Points:** Fragmented deadlines across various LMS portals, inability to access deadline checklists while commuting offline, and lack of automated deadline alerts.

### 2.3 Storyboard (6-Frame Student Journey)
*Refer to full narrative in `docs/DESIGN.md`.*
1. **Frame 1 (Overwhelmed):** Liam struggles with scattered submission dates and forgets a weekly lab deadline.
2. **Frame 2 (Discovery & PWA Install):** Liam registers on Student Planner and installs it as a native desktop PWA.
3. **Frame 3 (Populating Coursework):** Liam adds his assignments and breaks down his weekend into study tasks.
4. **Frame 4 (Offline Study on Commute):** Liam views his daily checklist on the train without an active internet connection.
5. **Frame 5 (Automatic Reconnect & Reminder):** Liam reconnects to campus Wi-Fi; queued changes sync, and a Web Push deadline reminder alerts him of an upcoming lab.
6. **Frame 6 (Success):** All coursework is submitted on time with 0 overdue items on his executive dashboard.

### 2.4 UML Class Diagram & Sequence Workflows
- **Class Diagram:** Details relationships between `User`, `Assignment`, `StudyTask`, `PushSubscription`, `PlannerRepository`, `PlannerService`, `AuthService`, and `PushService` (documented in `docs/ARCHITECTURE.md`).
- **Student Login Workflow:** Student -> React UI -> Express Controller -> AuthService -> MongoDB -> JWT Token response with `tokenVersion`.
- **Assignment Creation Workflow:** Form submission -> Validation middleware -> Service Layer -> Repository -> MongoDB persistence -> IndexedDB cache update.

---

## 3. Phase 2: Implementation & Technical Architecture

### 3.1 Software Architecture & Design Patterns
- **Repository Pattern (`PlannerRepository.ts`):** Isolates Mongoose database operations from business logic.
- **Service Layer Pattern (`PlannerService.ts`, `AuthService.ts`, `PushService.ts`):** Enforces tenant validation rules, password length constraints, and push message delivery.
- **Controller Pattern (`controllers.ts`):** Manages HTTP request inputs and response status codes.
- **Middleware Pattern (`auth.ts`, `validate.ts`, `errorHandler.ts`):** Centralizes token authentication, Zod schema validation, and error masking.
- **Observer / Background Scheduler (`ReminderScheduler.ts`):** Background worker running every 30 minutes scanning MongoDB for coursework due within 24 hours.

### 3.2 Security Implementation
- **Password Hashing:** Passwords encrypted using bcrypt with 12 salt rounds.
- **JWT Authorization & Server-Side Revocation:** Stateless Bearer tokens signed with HMAC-SHA256. `tokenVersion` stored on User documents in MongoDB. Logging out increments `tokenVersion`, invalidating tokens immediately with HTTP 401.
- **Tenant Data Isolation:** Every query enforces `{ userId }` scoping to prevent cross-account record access.
- **Network Protection:** Helmet security headers, Express Rate Limiting (500 requests/15 min), and dynamic CORS whitelist supporting `localhost` and local network IPs (`172.*`, `192.168.*`, `10.*`).

### 3.3 Progressive Web Application & Offline Storage
- **Service Worker (`sw.js`):** Cache-first strategy for app shell assets.
- **IndexedDB (`indexedDB.ts`):** Local persistence for assignments and study tasks allowing complete offline viewing.
- **Offline Mutation Sync Queue (`sync.ts`):** Queues offline creates, updates, and deletes, automatically synchronizing with the server upon reconnection.

---

## 4. Evidence & Screenshot Portfolio (Checklist for Student)

*Capture the following screenshots from your running system and insert them in the designated blocks below:*

### 4.1 Task 01: Project Environment Setup & Execution
> **[INSERT SCREENSHOT 1 HERE]**  
> *Instructions: Run backend and frontend in terminal. Capture the terminal window showing Node.js on port 4000 ("MongoDB connected", "API listening on http://localhost:4000") and Vite on port 5173.*

### 4.2 Task 02: PWA Configuration & Service Worker Registration
> **[INSERT SCREENSHOT 2 HERE]**  
> *Instructions: In Chrome or Edge, open `http://localhost:5173/`, press F12 -> Application tab. Click 'Manifest' (showing Student Planner details and icons) and 'Service Workers' (showing `sw.js` activated and running).*

### 4.3 Task 03: Frontend Implementation (Assignments & Study Tasks)
> **[INSERT SCREENSHOT 3A HERE]**  
> *Instructions: Capture the Executive Dashboard showing KPI summary cards, progress bars, and upcoming items.*

> **[INSERT SCREENSHOT 3B HERE]**  
> *Instructions: Capture the Assignment Manager view showing search bar, status/priority filter dropdowns, and assignment cards.*

> **[INSERT SCREENSHOT 3C HERE]**  
> *Instructions: Capture the Study Tasks view showing task checklist, duration badges, and completion checkboxes.*

### 4.4 Task 04: Secure Authentication & Logout Revocation
> **[INSERT SCREENSHOT 4A HERE]**  
> *Instructions: Open the Auth screen (`http://localhost:5173/`), show registration/login with client validation.*

> **[INSERT SCREENSHOT 4B HERE]**  
> *Instructions: Click 'Sign Out' in the sidebar to capture the confirmation dialog ("Are you sure you want to sign out...?").*

> **[INSERT SCREENSHOT 4C HERE]**  
> *Instructions: Capture MongoDB Compass or mongosh showing the `users` collection with `passwordHash` ($2a$12$...) and `tokenVersion`.*

### 4.5 Task 05: Backend CRUD & Postman API Testing
> **[INSERT SCREENSHOT 5 HERE]**  
> *Instructions: Open Postman, run the `Student-Planner.postman_collection.json` with Collection Runner, and capture the test runner window showing green passing test assertions.*

### 4.6 Task 06: Secure Push API
> **[INSERT SCREENSHOT 6 HERE]**  
> *Instructions: In Settings & Security (`http://localhost:5173`), enable Web Push, trigger 'Send Test Alert', and capture the native desktop alert popup.*

### 4.7 Task 07: Developer Test Cases & Unit Testing (27 Tests)
> **[INSERT SCREENSHOT 7A HERE]**  
> *Instructions: In terminal, run `npm test` in the `backend` directory. Capture the output showing 22 passed tests across 3 files.*

> **[INSERT SCREENSHOT 7B HERE]**  
> *Instructions: In terminal, run `npm test` in the `frontend` directory. Capture the output showing 5 passed tests.*

### 4.8 Task 08: Offline Mode & IndexedDB Data Persistence
> **[INSERT SCREENSHOT 8 HERE]**  
> *Instructions: Open F12 DevTools -> Network tab -> set throttling to 'Offline'. Refresh the page and show that the assignments and tasks still load from IndexedDB (`student_planner_db`), with the yellow 'Offline Mode' badge in the top bar.*

---

## 5. Troubleshooting, Challenges & Debugging Reflection

### Challenge 1: Web Push "Not Supported" on Local Network IP
- **Issue:** When opening `http://172.26.80.1:5173`, clicking 'Enable Web Push' alerted *"Web Push is not supported in this browser"*.
- **Root Cause Analysis:** According to W3C and browser security standards, `ServiceWorker` and `PushManager` are strictly gated to **Secure Contexts** (`window.isSecureContext`). Browsers treat `localhost` and `127.0.0.1` as secure, but disable push APIs over plain unencrypted HTTP when accessed via private LAN IP addresses (`172.*`, `192.168.*`).
- **Resolution:** Updated `handleTogglePush` in `frontend/src/App.tsx` to detect `isSecureContext` and `window.location.hostname`. The application now provides clear diagnostic alerts explaining whether HTTPS, browser permission, or service worker initialization is required.

### Challenge 2: Stateless JWT vs Server-Side Invalidation on Logout
- **Issue:** Standard stateless JWTs remain valid until expiration even after the user logs out.
- **Resolution:** Introduced the `tokenVersion` pattern. The `User` model stores an integer counter. Logout calls `/api/auth/logout` which atomically increments `tokenVersion`, immediately causing `requireAuth` to reject previously issued tokens with HTTP 401.

### Challenge 3: Inconsistent Overdue vs. Upcoming Calculations
- **Issue:** Discrepancy between dashboard overdue counts and item lists for items due on the current day.
- **Resolution:** Unified boundary calculations in `dateUtils.ts` across backend and frontend, defining overdue strictly as items due prior to `00:00:00.000` of the current day.

---

## 6. Personal Reflection & Viva Preparation Summary
Developing the **Student Task & Assignment Planner** provided deep practical experience in:
1. Building multi-tenant RESTful APIs using the **Repository-Service Pattern** in TypeScript.
2. Handling offline PWA synchronization using browser IndexedDB and Service Workers.
3. Managing asymmetric cryptography with VAPID web push protocols.
4. Implementing true server-side token revocation in modern web applications.
