# IA730001 Viva & Code Defence Preparation Guide (10 Marks)

This guide prepares you to confidently explain your code, architectural decisions, and technical implementations to the course examiner during your Viva presentation.

---

### Question 1: How is your system architected, and why did you select this design pattern?
**Model Answer:**
> "I implemented a layered enterprise architecture separating concerns into:
> 1. **Controller Layer (`controllers.ts`):** Parses HTTP requests, extracts parameters, and delegates to services.
> 2. **Service Layer (`PlannerService.ts`, `AuthService.ts`, `PushService.ts`):** Contains pure business logic, input validation, and security rules.
> 3. **Repository Layer (`PlannerRepository.ts`):** Encapsulates all Mongoose and MongoDB data operations.
> 4. **Middleware Layer (`auth.ts`, `validate.ts`, `errorHandler.ts`):** Handles JWT authorization, Zod schema validation, and error masking.
>
> This architecture directly addresses the quality attributes required by the rubric:
> - **Modifiability:** The database ORM can be replaced or modified without altering business rules.
> - **Testability:** Business services can be tested with mock repositories using Vitest without relying on a live database connection."

---

### Question 2: How do you enforce security and prevent cross-tenant data access?
**Model Answer:**
> "Security is enforced at multiple layers:
> 1. **Authentication:** User passwords are encrypted with bcrypt using 12 salt rounds before database storage.
> 2. **Authorization:** Stateless JWT tokens are signed using HMAC-SHA256 containing the user ID in the `sub` claim.
> 3. **Strict Data Scoping:** Every single query in `PlannerRepository.ts` includes `{ userId }`. Even if an attacker guesses another student's assignment ID, the query `findOne({ _id: id, userId: req.userId })` returns `null` (404 Not Found).
> 4. **Server-Side Token Revocation:** Each user has a `tokenVersion` stored in MongoDB. When a student logs out, the server increments `tokenVersion`, instantly invalidating previously issued tokens even before their expiration timestamp."

---

### Question 3: How does your offline functionality work, and how does it prevent data loss?
**Model Answer:**
> "The offline architecture combines two mechanisms:
> 1. **Cache-First Static Shell:** The Service Worker (`sw.js`) caches HTML, CSS, JavaScript, and manifest icons.
> 2. **IndexedDB Local Persistence (`indexedDB.ts`):** When online, coursework is cached in the browser's IndexedDB. When internet connectivity is lost, the frontend continues to load and display cached assignments and tasks.
> 3. **Offline Mutation Sync Queue (`sync.ts`):** If a student creates, updates, completes, or deletes an assignment while offline, the app applies the update optimistically and enqueues the action into an IndexedDB `sync_queue`.
> 4. **Automatic Reconnection:** When the browser detects an `online` event, `flushSyncQueue()` automatically sends the queued requests to the backend in chronological order."

---

### Question 4: How is Web Push implemented, and how does the background reminder scheduler work?
**Model Answer:**
> "Web Push uses the standard W3C Push API and VAPID (Voluntary Application Server Identification) protocol:
> 1. The client registers the service worker and generates a subscription containing cryptographic public keys (`p256dh` and `auth`).
> 2. The keys are stored in the MongoDB `PushSubscriptions` collection linked to the student's `userId`.
> 3. A background worker (`ReminderScheduler.ts`) runs on a 30-minute interval, querying MongoDB for incomplete assignments or study tasks due within 24 hours.
> 4. It constructs notification payloads and transmits them through `web-push`. If a browser subscription has expired (HTTP 410 Gone), it automatically purges the expired subscription from MongoDB."

---

### Question 5: How would you scale the database if this application served 50,000 university students?
**Model Answer:**
> "I would implement MongoDB Replication and Horizontal Sharding:
> 1. **Replica Sets:** Deploy a 3-node replica set (1 Primary, 2 Secondaries) with automated failover elections and an asynchronous oplog. Heavy dashboard read operations would use `secondaryPreferred` read preferences.
> 2. **Sharding:** Shard the `assignments` and `studytasks` collections using `{ userId: 'hashed' }` as the shard key. Because every query in our repository is already scoped by `userId`, the `mongos` query router targets only the specific shard holding that student's records, eliminating cross-shard broadcast overhead."
