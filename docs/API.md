# REST API Reference — Student Task & Assignment Planner

Base URL: `http://localhost:4000/api`

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints

### 1.1 Register New Student
- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Request Body:**
  ```json
  {
    "name": "Alex Morgan",
    "email": "alex.morgan@uni.edu",
    "password": "Password123!"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "67375a...",
      "name": "Alex Morgan",
      "email": "alex.morgan@uni.edu"
    }
  }
  ```

### 1.2 User Login
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Request Body:**
  ```json
  {
    "email": "alex.morgan@uni.edu",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK`

### 1.3 Get Current User Profile
- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`

---

## 2. Dashboard Endpoints

### 2.1 Get Aggregated Summary Statistics
- **Method:** `GET`
- **Endpoint:** `/dashboard/summary`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`
  ```json
  {
    "assignments": {
      "total": 5,
      "pending": 3,
      "completed": 2,
      "overdue": 1
    },
    "tasks": {
      "total": 8,
      "pending": 4,
      "completed": 4,
      "overdue": 0
    },
    "upcomingAssignments": [...],
    "todaysTasks": [...],
    "recentAssignments": [...]
  }
  ```

---

## 3. Assignment Management (Feature 1)

### 3.1 List All Assignments
- **Method:** `GET`
- **Endpoint:** `/assignments`
- **Headers:** `Authorization: Bearer <token>`

### 3.2 Get Single Assignment
- **Method:** `GET`
- **Endpoint:** `/assignments/:id`
- **Headers:** `Authorization: Bearer <token>`

### 3.3 Create Assignment
- **Method:** `POST`
- **Endpoint:** `/assignments`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "title": "Machine Learning Lab 2",
    "subject": "COMP309",
    "dueDate": "2026-11-28T23:59:00.000Z",
    "priority": "High",
    "status": "Not Started",
    "description": "Implement SVM and random forest classifiers on dataset.",
    "notes": "Refer to lecture 6 slides."
  }
  ```

### 3.4 Update Assignment
- **Method:** `PATCH`
- **Endpoint:** `/assignments/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "status": "In Progress",
    "priority": "Medium"
  }
  ```

### 3.5 Delete Assignment
- **Method:** `DELETE`
- **Endpoint:** `/assignments/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 4. Study Task Management (Feature 2)

### 4.1 List Study Tasks
- **Method:** `GET`
- **Endpoint:** `/study-tasks`
- **Headers:** `Authorization: Bearer <token>`

### 4.2 Get Single Study Task
- **Method:** `GET`
- **Endpoint:** `/study-tasks/:id`
- **Headers:** `Authorization: Bearer <token>`

### 4.3 Create Study Task
- **Method:** `POST`
- **Endpoint:** `/study-tasks`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "title": "Review Decision Trees",
    "subject": "COMP309",
    "dueDate": "2026-11-20T17:00:00.000Z",
    "priority": "Medium",
    "status": "Not Started",
    "estimatedDuration": 45,
    "description": "Work through tutorial 4 exercises."
  }
  ```

### 4.4 Update Study Task
- **Method:** `PATCH`
- **Endpoint:** `/study-tasks/:id`
- **Headers:** `Authorization: Bearer <token>`

### 4.5 Complete / Toggle Study Task
- **Method:** `PATCH`
- **Endpoint:** `/study-tasks/:id/complete`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "completed": true
  }
  ```

### 4.6 Delete Study Task
- **Method:** `DELETE`
- **Endpoint:** `/study-tasks/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 5. Web Push Notifications

### 5.1 Get VAPID Public Key
- **Method:** `GET`
- **Endpoint:** `/push/public-key`

### 5.2 Subscribe Device to Push
- **Method:** `POST`
- **Endpoint:** `/notifications/subscribe`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
  ```

### 5.3 Unsubscribe Device
- **Method:** `DELETE`
- **Endpoint:** `/notifications/subscribe`
- **Headers:** `Authorization: Bearer <token>`

### 5.4 Trigger Test Notification
- **Method:** `POST`
- **Endpoint:** `/notifications/test`
- **Headers:** `Authorization: Bearer <token>`
