# Deshpande Blocks — Technical Decisions Log

Format: **DECISION** → **RATIONALE** → **IMPLICATION FOR NEW CODE**

---

## Architecture

### Monorepo with separate client and server
**Decision:** `client/` (Vite SPA) + `server/` (Express API), orchestrated from root `package.json`.  
**Rationale:** Clear separation; same API runs locally and on Netlify serverless.  
**Implication:** New features need `server/src` changes **and** `client/src/api/` + pages. Never call Firestore from the client.

### Layered Routes → Controllers → Services
**Decision:** Express routes wire middleware/validation; controllers handle HTTP; services own Firestore/Auth/Storage.  
**Rationale:** Keeps HTTP concerns separate from business logic; services are testable in isolation.  
**Implication:** No DB access in controllers. No business logic in routes beyond validation arrays.

### `app.js` without `listen()` for dual deployment
**Decision:** `server/src/app.js` exports the Express app; `index.js` listens locally; Netlify imports `app.js` only.  
**Rationale:** One codebase for dev server and serverless.  
**Implication:** Do not add `app.listen()` to `app.js`. Long-running background jobs are not supported on Netlify.

### Firebase Auth on client, verification on server
**Decision:** Users sign in with Firebase client SDK; API validates `Authorization: Bearer <idToken>` via Admin `verifyIdToken`.  
**Rationale:** Standard secure split; custom claims carry `role`.  
**Implication:** Protected routes must use `authMiddleware`; admin routes add `adminMiddleware`. Profile details come from Firestore `members`, not only the token.

### Role in custom claims + Firestore `members.role`
**Decision:** `auth.setCustomUserClaims(uid, { role })` on member create/update; middleware reads `decoded.role`.  
**Rationale:** Fast authorization without a DB read on every request.  
**Implication:** When changing a member's role in admin UI, service must update both Firestore and custom claims.

### Dual-role admins see both nav sections
**Decision:** Sidebar shows "Admin" and "My Account" menus when `profile.role === 'admin'`.  
**Rationale:** Admins who live in the society need member flows without a second account.  
**Implication:** Do not hide member routes from admins. `AdminRoute` only wraps `/admin/*`.

---

## State management

### React Context + useReducer for auth only
**Decision:** Single `AuthContext` for user, profile, login/logout — no global store for app data.  
**Rationale:** Auth is truly global; small state machine is enough.  
**Implication:** Do not put lists, forms, or API results in Context. Use React Query.

### TanStack React Query for all server data
**Decision:** `useQuery` / `useMutation` in page components; API modules return promises.  
**Rationale:** Built-in caching, loading states, and invalidation without boilerplate.  
**Implication:** Use consistent `queryKey` arrays; after mutations, `invalidateQueries` for every affected screen (e.g. `my-dues`, `my-dues-pay`, `members`, `dashboard-stats` when touching payments/dues).

---

## API design

### REST under `/api` with uniform JSON envelope
**Decision:** `{ success, message?, data?, errors? }` via `sendSuccess` / `sendError`.  
**Rationale:** Predictable client error handling (`err.response?.data?.message`).  
**Implication:** Controllers must not call `res.json` ad hoc. Services return plain objects; controllers wrap responses.

### express-validator on routes, checked in controllers
**Decision:** Validation arrays in `*Routes.js`; `validationResult(req)` in controllers.  
**Rationale:** Declarative rules colocated with routes.  
**Implication:** New endpoints need route validators + controller guard. Use `customSanitizer` for normalized fields (e.g. comma-separated `flatNumber`).

### In-memory filter/sort instead of composite Firestore indexes
**Decision:** Simple `where` or `orderBy` queries; filter/paginate in Node when needed.  
**Rationale:** Avoids `FAILED_PRECONDITION` index setup for a small society dataset.  
**Implication:** Do not add multi-field Firestore queries without confirming indexes exist. Prefer fetch-then-filter pattern from `duesService` / `transactionService`.

### Member self-service endpoints under same routers
**Decision:** `POST /api/transactions/self`, `GET /api/dues/my`, etc. use `authMiddleware` only (no admin).  
**Rationale:** Members submit payments and read own data without admin role.  
**Implication:** New member APIs follow this pattern — auth only, scope by `req.user.uid` in service.

---

## Authentication & login

### Login by email OR 10-digit Indian mobile
**Decision:** Contact login tries `{contact}@society.app` first, then `lookupEmailByContact` API for real email.  
**Rationale:** Members may be created without email; synthetic email is the Firebase auth identifier.  
**Implication:** `createMember` must use `buildSyntheticEmail(contact)` when email is omitted. Login field is `identifier`, not `email`.

### `getMe` uses raw axios (not shared interceptor) during bootstrap
**Decision:** `AuthContext` calls `getMe(token)` with explicit Bearer header before interceptor state is stable.  
**Rationale:** Avoid circular dependency and ensure profile loads on first auth.  
**Implication:** Public endpoints (`/auth/lookup`) also use direct axios without requiring stored token.

---

## Files & storage

### Private Firebase Storage + authenticated view endpoint
**Decision:** Upload returns `filePath` (GCS path); viewing via `GET /api/files/view` returns buffer.  
**Rationale:** Public URLs would bypass app auth.  
**Implication:** Store path in `fileUrl` fields. UI uses `FileViewerModal`, not `window.open` to Storage URLs. Legacy `http` URLs still open externally.

### sharp compression on upload
**Decision:** JPEG/PNG resized (max 2048px) and re-encoded before Storage save.  
**Rationale:** Smaller storage and faster modal preview.  
**Implication:** `sharp` must stay `external_node_modules` in `netlify.toml`. Upload service lazy-loads sharp.

### Buffer + serverless-http binary types on Netlify
**Decision:** `file.download()` → `res.send(buffer)`; `binary: ['image/*', 'application/pdf', ...]` in api.mjs.  
**Rationale:** Streaming/pipe corrupts bytes in Lambda JSON responses.  
**Implication:** Any new binary response types must be added to the `binary` array.

---

## Domain rules

### monthlyMaintenanceAmount in societyConfig
**Decision:** Single config field drives due generation; editable in Admin → Settings.  
**Rationale:** One source of truth for monthly charge.  
**Implication:** Never rename to `maintenanceAmount`. Settings form field name must be `monthlyMaintenanceAmount`.

### Multi-flat members: comma-separated flatNumber × count
**Decision:** `flatNumber` string like `501, 502`; `countFlats()` drives `amount = monthlyMaintenanceAmount * flatCount`.  
**Rationale:** One member can own multiple units with proportional dues.  
**Implication:** Normalize flats on **submit** only (not Form `normalize` on change). Use `flatUtils.countFlats` on server.

### Dues generated for all active members including admins
**Decision:** `generateDues` does not filter out `role === 'admin'`.  
**Rationale:** Admin-residents still owe maintenance.  
**Implication:** Re-running generation skips members who already have a due for that month; new members get a row on next generate.

### Member maintenance payment: manual amount + receipt
**Decision:** Pay Maintenance uses editable amount (default remaining due), file upload, note — no UPI deep-link buttons in UI.  
**Rationale:** Simplified flow; admin confirms transactions. `upiLinks.js` exists but is unused on Pay page.  
**Implication:** Do not reintroduce GPay/PhonePe buttons without explicit product request.

### Self-submitted transactions start as `pending`
**Decision:** `POST /transactions/self` creates `status: 'pending'`, `recordedBy: 'self'`.  
**Rationale:** Admin must confirm before affecting dues balance.  
**Implication:** Confirm/reject flows must call `invalidateQueries` for member and admin views.

### Deactivate member = disable Firebase Auth + `isActive: false`
**Decision:** Soft delete — no hard delete of Firestore member doc from routine admin action.  
**Rationale:** Preserve history; prevent login.  
**Implication:** `generateDues` filters `isActive === true` only.

### Expense custom date
**Decision:** Client sends ISO `date`; service sets `createdAt` from it when provided.  
**Rationale:** Backdated expense entry for accurate reporting.  
**Implication:** Use `formatDate` on display; store Firestore timestamps in services.

---

## Navigation & routing

### React Router v6 nested layouts
**Decision:** `PrivateRoute` → `AppLayout` → `AdminRoute` (admin only) or member routes.  
**Rationale:** Shared chrome (sidebar/header) with role-based guards.  
**Implication:** New pages must be registered in `AppRoutes.jsx` and, for admin, in `Sidebar.jsx` `adminMenuItems`.

### Post-login redirect by role
**Decision:** Admin → `/admin/dashboard`; member → `/dashboard`.  
**Rationale:** Clear default landing per role.  
**Implication:** Login success handlers must check `profile.role`.

---

## UI / UX

### Ant Design + 2-color indigo/slate theme
**Decision:** Primary `#4F46E5`, dark sidebar `#1E293B`, flat surfaces, no gradients.  
**Rationale:** Consistent sleek 2D look in `index.css` and `ConfigProvider`.  
**Implication:** New UI should use CSS variables from `index.css` and Ant tokens — avoid new palette colors.

### Page layout convention
**Decision:** `.page-header` row (title + actions), tables in bordered wrappers, `.app-content` padding.  
**Rationale:** Repeated pattern across admin/member pages.  
**Implication:** Match existing list/form page structure when adding screens.

---

## Deployment

### Netlify: static client + single serverless API function
**Decision:** `client/dist` published; `/api/*` → `api.mjs` wrapping `server/src/app.js`.  
**Rationale:** Full-stack on Netlify without separate backend host.  
**Implication:** Firebase credentials via `FIREBASE_SERVICE_ACCOUNT_JSON` env. Client production uses `VITE_API_BASE_URL=/api`.

### esbuild bundler (not nft) for functions
**Decision:** `node_bundler = "esbuild"` in `netlify.toml`.  
**Rationale:** nft breaks ESM `import` in serverless wrapper.  
**Implication:** Avoid `import.meta.url` in server code paths bundled for Netlify.

### Vite dev proxy for API
**Decision:** `vite.config.js` proxies `/api` → `localhost:5001`.  
**Rationale:** Same-origin API calls in dev without CORS friction.  
**Implication:** Client can use `VITE_API_BASE_URL=/api` during local dev if desired.

---

## Patterns to preserve

1. **Controller → Service → Firestore** — no DB access in controllers.
2. **API module per resource** mirroring server route names.
3. **`message.success` / `message.error`** for user feedback on mutations.
4. **Indian formats:** `formatCurrency` (en-IN INR), dates `DD MMM YYYY`, months `MMM YYYY`.
5. **Pagination:** services return `{ data, total, page, limit }`; client passes `page`/`limit` query params.
6. **Query keys include filters:** e.g. `['members', search, page]` for correct cache invalidation.
7. **Firestore timestamps:** formatters handle `{ seconds }` and `.toDate()` shapes from API JSON.
