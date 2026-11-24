# Architecture & Design Patterns — Student Planner

## 1. System Architecture Diagram

```mermaid
flowchart TD
  subgraph Frontend ["Frontend (React 18 + TypeScript + Vite)"]
    UI["Pages & Components (Dashboard, Assignments, Tasks, Settings)"]
    APIClient["API Client (/src/lib/api.ts)"]
    IDB["IndexedDB Offline Storage (/src/lib/indexedDB.ts)"]
    SyncQueue["Offline Sync Engine (/src/lib/sync.ts)"]
    SW["Service Worker (/public/sw.js)"]
    UI --> APIClient
    UI --> IDB
    SyncQueue --> APIClient
    SW -.-> UI
  end

  subgraph Backend ["Backend (Express + Node.js + TypeScript)"]
    MW["Middleware (Helmet, CORS, RateLimit, Auth, Validation)"]
    Controllers["Controllers Layer"]
    Services["Service Layer (AuthService, PlannerService, PushService)"]
    Scheduler["ReminderScheduler (Background Worker)"]
    Repos["Repository Layer (PlannerRepository)"]
    MW --> Controllers
    Controllers --> Services
    Scheduler --> Services
    Services --> Repos
  end

  subgraph Database ["Persistence Layer"]
    Mongo[("MongoDB Database")]
    Repos --> Mongo
  end

  APIClient -- "REST HTTPS + JWT" --> MW
```

---

## 2. UML Class Diagram

```mermaid
classDiagram
  class User {
    +ObjectId _id
    +string name
    +string email
    +string passwordHash
    +Date createdAt
    +Date updatedAt
    +verifyPassword(password: string): Promise~boolean~
  }

  class Assignment {
    +ObjectId _id
    +ObjectId userId
    +string title
    +string subject
    +string description
    +Date dueDate
    +string priority
    +string status
    +string notes
    +Date createdAt
  }

  class StudyTask {
    +ObjectId _id
    +ObjectId userId
    +string title
    +string description
    +string subject
    +Date dueDate
    +string priority
    +string status
    +number estimatedDuration
    +boolean completed
    +Date completedAt
  }

  class PushSubscription {
    +ObjectId _id
    +ObjectId userId
    +string endpoint
    +Object keys
  }

  class PlannerRepository {
    +listAssignments(userId: string)
    +findAssignment(userId: string, id: string)
    +createAssignment(data: Object)
    +updateAssignment(userId: string, id: string, data: Object)
    +deleteAssignment(userId: string, id: string)
    +listTasks(userId: string)
    +findTask(userId: string, id: string)
    +createTask(data: Object)
    +updateTask(userId: string, id: string, data: Object)
    +deleteTask(userId: string, id: string)
    +getDashboardSummary(userId: string)
  }

  class PlannerService {
    -repo: PlannerRepository
    +listAssignments(uid: string)
    +getAssignment(uid: string, id: string)
    +createAssignment(uid: string, data: Object)
    +updateAssignment(uid: string, id: string, data: Object)
    +deleteAssignment(uid: string, id: string)
    +listTasks(uid: string)
    +getTask(uid: string, id: string)
    +createTask(uid: string, data: Object)
    +updateTask(uid: string, id: string, data: Object)
    +completeTask(uid: string, id: string, completed: boolean)
    +deleteTask(uid: string, id: string)
    +getDashboardSummary(uid: string)
  }

  class AuthService {
    +register(name, email, password)
    +login(email, password)
    +getMe(userId)
    -session(user)
  }

  class PushService {
    +save(userId, subscription)
    +unsubscribe(userId, endpoint)
    +sendTest(userId)
    +checkAndSendReminders()
  }

  PlannerService --> PlannerRepository
  PlannerRepository --> Assignment
  PlannerRepository --> StudyTask
  AuthService --> User
  PushService --> PushSubscription
```

---

## 3. UML Sequence Diagrams

### 3.1 Authentication Workflow (Login)

```mermaid
sequenceDiagram
  autonumber
  actor Student as Student User
  participant UI as React Frontend
  participant AuthAPI as Express Auth Controller
  participant AuthService as AuthService
  participant DB as MongoDB (Users Collection)

  Student->>UI: Enters email & password
  UI->>AuthAPI: POST /api/auth/login {email, password}
  AuthAPI->>AuthService: login(email, password)
  AuthService->>DB: User.findOne({email})
  DB-->>AuthService: user document with passwordHash
  AuthService->>AuthService: bcrypt.compare(password, user.passwordHash)
  alt Password Valid
    AuthService->>AuthService: jwt.sign(payload, secret, {expiresIn: '1d'})
    AuthService-->>AuthAPI: {token, user}
    AuthAPI-->>UI: 200 OK + JWT Token
    UI->>UI: Persist token to localStorage & memory
    UI-->>Student: Displays Dashboard with academic metrics
  else Password Invalid
    AuthService-->>AuthAPI: throw AppError(401, 'Email or password is incorrect')
    AuthAPI-->>UI: 401 Unauthorized
    UI-->>Student: Displays error alert message
  end
```

### 3.2 Assignment Creation Workflow

```mermaid
sequenceDiagram
  autonumber
  actor Student as Student User
  participant UI as React Frontend
  participant IDB as IndexedDB Cache
  participant API as Express Assignment API
  participant Service as PlannerService
  participant Repo as PlannerRepository
  participant DB as MongoDB (Assignments Collection)

  Student->>UI: Submits New Assignment Form
  alt Online
    UI->>API: POST /api/assignments (Bearer JWT)
    API->>API: validateBody(assignmentBody)
    API->>Service: createAssignment(userId, body)
    Service->>Repo: createAssignment({ ...body, userId })
    Repo->>DB: Assignment.create()
    DB-->>Repo: Saved Document
    Repo-->>Service: Saved Document
    Service-->>API: 201 Created Document
    API-->>UI: 201 Response JSON
    UI->>IDB: Update cached assignments
    UI-->>Student: Renders new card & updates metrics
  else Offline
    UI->>IDB: Save to IndexedDB & enqueue to sync_queue
    UI-->>Student: Renders optimistically with "Offline Mode" indicator
  end
```

---

## 4. Design Patterns Implemented

1. **Repository Pattern (`PlannerRepository.ts`)**:
   - Isolates MongoDB/Mongoose ORM queries from business logic. Enables mock testing without requiring a live database connection.

2. **Service Layer Pattern (`PlannerService.ts`, `AuthService.ts`, `PushService.ts`)**:
   - Encapsulates business validation rules, user ownership validation, and notification coordination.

3. **Controller Pattern (`controllers.ts`)**:
   - Translates HTTP inputs (body, params, userId) into service invocations and returns formatted JSON status codes.

4. **Middleware Pattern (`auth.ts`, `validate.ts`, `errorHandler.ts`)**:
   - Centralizes token verification, Zod schema validation, and unified JSON error handling with safe responses.

5. **Observer / Background Worker Pattern (`ReminderScheduler.ts`)**:
   - Asynchronously runs in the background checking for upcoming assignments and triggering Web Push alerts.
