# Design Phase Specifications — Persona, Storyboard & Wireframes

## 1. Student Persona

### Profile
- **Name:** Liam Chen
- **Age:** 21
- **Program:** Bachelor of Software Engineering (Year 3)
- **Institution:** University of Auckland

### Academic Goals
- Balance 4 heavy technical papers (Distributed Systems, Database Architecture, Machine Learning, Web Technologies).
- Avoid last-minute deadline crunches and penalty submissions.
- Maintain a structured daily study schedule for revision problem sets.

### Frustrations & Pain Points
- Course materials and deadlines are fragmented across multiple course portals (Canvas, GitLab, email).
- Forgets smaller weekly lab requirements because major project deadlines consume focus.
- Loss of internet connection in lecture halls and while commuting prevents checking assignments.
- Generic calendar apps lack assignment-specific statuses (e.g. "Not Started", "In Progress", "Completed", priorities, course codes).

### Technology Usage
- Laptop (Windows 11) for development and study.
- Android smartphone for on-the-go notifications and quick checklist reviews.
- Modern web browser with Progressive Web App (PWA) installation.

---

## 2. Storyboard: Liam's Journey with the Planner

```
[ Frame 1: Overwhelm ]
Liam sits at his desk surrounded by lecture slides and course outlines.
He realizes he missed a minor lab submission deadline yesterday because
his major project was due on the same evening.
Caption: "I need a unified dashboard that shows all my deadlines and daily tasks."

       │
       ▼
[ Frame 2: Discovering & Installing Planner ]
Liam signs up on the Student Task & Assignment Planner web app.
He receives a prompt to install it as a PWA on his Windows laptop.
He enables Web Push notifications in Settings.
Caption: "One-click install as a desktop app with deadline push notifications."

       │
       ▼
[ Frame 3: Populating Coursework ]
Liam adds his 4 major assignments for the semester, setting course codes,
priorities (High, Medium, Low), and due dates.
He breaks down his weekend into 45-minute daily study tasks.
Caption: "Instant clarity on upcoming deadlines and today's focused study plan."

       │
       ▼
[ Frame 4: Studying Offline on Campus ]
While taking the train to university without mobile data, Liam checks
his daily tasks and marks 'Review Graph Algorithms' as complete.
The app notifies him: 'Offline Mode: 1 action queued for sync'.
Caption: "Offline-first resilience powered by IndexedDB."

       │
       ▼
[ Frame 5: Reconnecting & Timely Push Alerts ]
When Liam connects to campus Wi-Fi, the queued task automatically synchronizes.
An hour before his lab, a Web Push reminder appears on his screen:
'Assignment Due Soon: Distributed Systems Lab 3'.
Caption: "Automatic background deadline reminders prevent missed submissions."

       │
       ▼
[ Frame 6: Academic Success ]
Liam glances at his dashboard: 100% of weekly study tasks completed,
all assignments submitted on time, and overdue items at zero.
Caption: "Stress-free semester with organized coursework."
```

---

## 3. High-Fidelity UI Wireframes & Layout Specifications

### 3.1 Authentication Screen (Login / Register)
- **Top Brand:** Blue gradient icon with graduation/book symbol, `Student Planner`, SaaS badge.
- **Card:** Clean dark mode card with subtle border (`#243048`), input fields with floating labels.
- **Password Input:** Integrated eye icon toggle for show/hide plain text password.
- **Validation:** Live field validation and clear error alert banners.

### 3.2 Main Dashboard
- **Top Navigation:** Breadcrumb eyebrow `ACADEMIC WORKSPACE`, page title, online/offline pill status badge, sync queue badge, and instant Refresh button.
- **Welcome Banner:** Dynamic student greeting with today's localized date, overdue item count summary, and quick-action buttons (`Add Assignment`, `New Study Task`).
- **KPI Metrics Grid (4 cards):**
  1. Total Assignments (with pending vs. completed count).
  2. Pending Deadlines (with next 7 days count).
  3. Study Tasks Completed (with percentage completion).
  4. Overdue Items (highlighted in red for immediate attention).
- **Progress Meters:** Visual dual-bar indicators for Assignment completion % and Study Task completion %.
- **Two-Column Split Section:**
  - *Left Panel:* Upcoming assignment deadlines list sorted by urgency with priority pill badges (`High`, `Medium`, `Low`).
  - *Right Panel:* Today's study tasks with duration tags and status indicators.

### 3.3 Assignment Management Page
- **Controls Toolbar:** Full-text instant search bar, filter dropdowns for Status (`Not Started`, `In Progress`, `Completed`), Priority (`High`, `Medium`, `Low`), Subject code, and multi-field sorting.
- **Cards Grid:** Responsive card deck layout displaying subject pill, deadline date, countdown/overdue warnings, description, notes, and actions (`Details`, `Edit`, `Delete` with confirmation modal).
- **Create/Edit Modal:** Dialog with validated fields for Title, Subject, Due Date, Priority, Status, Description, and Private Notes.

### 3.4 Study Tasks Page
- **Controls Toolbar:** Search, completion status filter (`All`, `Pending`, `Completed`), priority filter, subject filter, and sort by date.
- **Task List View:** Checkbox-driven interactive list item rows with duration badge (e.g. `45 mins`), strike-through animation on completed items, and action controls.

### 3.5 Settings & Security Page
- **Profile Summary:** User avatar initials, full name, registered email, and student ID.
- **Web Push Notifications Card:** Connection status indicator (Active / Inactive), Subscribe/Unsubscribe action button, and Send Test Alert button.
- **Data Protection Card:** Documentation of IndexedDB caching, offline queue synchronization, bcrypt password hashing, and user data isolation.
