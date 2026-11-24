# Technical Troubleshooting, Debugging & Academic Reflection

## IA730001 — Student Task & Assignment Planner Project Reflection

### 1. Key Technical Challenges & How They Were Resolved

#### Challenge 1: Logout JWT Invalidation vs. Stateless Architecture
- **Problem**: In standard stateless JWT authentication, tokens cannot easily be revoked prior to their expiry (`exp` claim) without storing every single token in memory or a database. If a student logged out on a public lab computer, an intercepted token remained valid.
- **Solution**: We implemented the **Token Version Pattern** (`tokenVersion` field on the `User` document in MongoDB). When a student logs out, the backend endpoint `/api/auth/logout` atomically increments the user's `tokenVersion`. When any protected endpoint is accessed via the `requireAuth` middleware, the JWT's embedded `tokenVersion` is compared to the database record. If mismatched, HTTP 401 is returned immediately, achieving true server-side revocation without sacrificing scalability.

#### Challenge 2: Date Boundary Calculations Across Timezones (New Zealand UTC+12/13)
- **Problem**: When computing "Overdue" and "Upcoming within 7 Days" items, the backend previously used raw `now` comparisons while the frontend evaluated localized midnight timestamps. This resulted in discrepancy where items due today were incorrectly flagged as overdue.
- **Solution**: Developed unified date boundary algorithms in `backend/src/utils/dateUtils.ts` and `frontend/src/lib/dateUtils.ts`. An assignment is defined as overdue **only if its due date timestamp is strictly before the start of today (`00:00:00.000`)**. Upcoming items are strictly defined within `[startOfToday, sevenDaysFromToday (23:59:59.999)]`. All calculations across the executive dashboard banner, summary cards, and detail pages now match 100%.

#### Challenge 3: Offline Data Synchronization & PWA IndexedDB Persistence
- **Problem**: When offline, users create assignments and tasks that lack server-generated MongoDB `_id` values. Subsequent modifications or deletions while still offline could create broken entity references or race conditions upon reconnection.
- **Solution**: Structured IndexedDB object stores (`assignments`, `study_tasks`, `sync_queue`) with deterministic optimistic updates. When reconnecting, `flushSyncQueue` executes FIFO queued mutations against the REST API and automatically clears the queue upon confirmed server response, with background error logging and real-time counter indicators in the UI.

#### Challenge 4: Real Web Push Protocol Integration
- **Problem**: Push notifications failed or simulated empty responses when valid VAPID keys were missing or mismatched between client and server.
- **Solution**: Generated standard RFC 8292 VAPID keypairs (`web-push generate-vapid-keys`), wired them into both `.env` configurations, and implemented persistent subscription management in MongoDB. The scheduler actively inspects assignments and tasks due within 24 hours to dispatch targeted push alerts.

---

### 2. Personal Learning Outcomes & Architectural Reflection
1. **Clean Architecture & Separation of Concerns**: Implementing the Repository and Service patterns on the Express backend cleanly decouples database queries from route handlers, drastically simplifying automated testing with Vitest mocks.
2. **Security by Default**: Enforcing strict schema validation with Zod, parameterized Mongoose queries (preventing NoSQL injection), Helmet HTTP security headers, CORS origin whitelisting, and Bcrypt (cost factor 12) password hashing.
3. **PWA Standards**: Leveraging Web App Manifest, Service Worker caches, and IndexedDB for seamless academic workflow continuity even during network outages.
