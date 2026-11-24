# Practice rubric checklist and evidence plan

| Rubric area | Included in this practice project | Evidence to capture while running |
|---|---|---|
| Setup/configuration (5) | Vite, TypeScript, Express, env examples, scripts | Terminal install/start commands; config screenshots |
| Frontend (10) | Responsive dashboard, assignment/task screens, forms | Screenshots of each working screen and validation |
| Auth (10) | Register/login, bcrypt password hashes, JWT middleware, owner-scoped queries | Register/login Postman responses; rejected unauthenticated request |
| Backend CRUD (10) | Mongo models, controllers, services, repositories, CRUD routes | Postman create/list/update/delete requests and MongoDB records |
| Push API (10) | VAPID configuration, subscription storage, test notification endpoint | Browser permission, subscription and delivered notification evidence |
| Patterns/code quality (10) | Controller-Service-Repository separation, validation middleware | Folder structure and explanation of responsibilities |
| Unit testing (5) | Vitest service tests and frontend utility tests | Terminal test output; add more tests as features are extended |
| Troubleshooting (5) | Central error handler, request logging, health endpoint | Real debugger/watchers and error reproduction/fix screenshots |
| Additional features (5) | PWA cache and indexes; replication is deployment-dependent | Browser Application > Service Workers/Cache; Atlas replica-set screenshot if configured |
| Viva (10) | README and architecture/API explanations | Be able to explain code paths, security, tests and trade-offs |
| Reports (20) | API docs, setup docs, diagrams can be included separately | Final report with genuine screenshots and Git URL |

## Known practice-build limitations to verify/extend
- Push notifications: the subscription and test-send flow is implemented; scheduled deadline delivery requires a scheduler/worker and deployment strategy.
- Offline mode caches the app shell/static files only; private API data is intentionally not cached. If offline data access is required, implement carefully scoped IndexedDB storage and conflict handling.
- The UI currently provides create/list/delete and completion flows; implement edit dialogs and assignment status updates to exercise every CRUD operation from the interface. Backend PATCH routes are available.
- The tests are starter meaningful tests, not exhaustive coverage of every route and model. Expand with integration tests against a test MongoDB.
- Database replication/scaling is an optional cloud configuration, not enabled by this local starter.
- Do not claim screenshots or cloud deployment evidence until you have captured them from your own environment.
