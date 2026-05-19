# Deshpande Blocks — Project Brain

## App name & purpose

**Deshpande Blocks** is a society (housing society / apartment block) management web app.

| Audience | Capabilities |
|----------|--------------|
| **Admins** | Manage members, log expenses, record/confirm payments, generate monthly maintenance dues, configure society settings, view dashboard stats/charts |
| **Members** | View dues and transactions, submit maintenance payments (amount + receipt), browse society expenses |

**Production:** https://deshpandeblocks.netlify.app  
**Repository:** Monorepo — `client/` (React SPA) + `server/` (Express API).

---

## Architecture (plain text)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 18 + Vite)                        │
│  Pages ──► React Query ──► client/src/api/*.js ──► Axios (+ Bearer JWT) │
│  AuthContext ◄── Firebase Auth (email/password)                           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS  /api/*
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              EXPRESS API (local :5001  |  Netlify serverless)            │
│  Routes ──► authMiddleware ──► [adminMiddleware] ──► Controllers           │
│                              verifyIdToken (role claim)                  │
│                                    │                                     │
│                                    ▼                                     │
│                              Services ──► Firestore / Storage / Auth     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Firebase: Firestore (data) · Storage (private files) · Auth (users)    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Deploy topology (Netlify):**

```
User → client/dist (static SPA)
     → /api/* → netlify/functions/api.mjs → serverless-http(app)
     → /*     → index.html (React Router)
```

---

## Full folder structure

```
Society Management App/
├── client/                          # React frontend (Vite 5)
│   ├── public/                      # Static assets (favicon.svg)
│   ├── src/
│   │   ├── api/                     # Axios API clients — one file per domain
│   │   ├── components/
│   │   │   ├── common/              # Loader, FileUpload, FileViewerModal, EmptyState, ErrorBoundary
│   │   │   ├── dashboard/           # Admin dashboard cards + Recharts
│   │   │   └── Layout/              # AppLayout, Sidebar, Header
│   │   ├── context/                 # AuthContext (Firebase + profile)
│   │   ├── pages/
│   │   │   ├── admin/               # Admin CRUD & dashboards
│   │   │   ├── user/                # Member portal pages
│   │   │   └── auth/                # LoginPage
│   │   ├── routes/                  # AppRoutes, PrivateRoute, AdminRoute
│   │   ├── utils/                   # formatters, constants, UPI helpers (legacy)
│   │   ├── App.jsx                  # Root + ErrorBoundary wrapper
│   │   ├── main.jsx                 # Providers: Query, Router, Ant Design, Auth
│   │   ├── index.css                # Design tokens & global Ant overrides
│   │   └── firebaseConfig.js        # Client Firebase init (auth only)
│   ├── .env / .env.production       # VITE_* (API URL, Firebase public config)
│   └── vite.config.js               # Dev server :5173; proxies /api → :5001
│
├── server/                          # Express API
│   ├── src/
│   │   ├── app.js                   # Express app (no listen) — local + Netlify
│   │   ├── index.js                 # Local dev entry — listen on PORT (default 5001)
│   │   ├── config/firebase.js       # Admin SDK (env JSON or key file)
│   │   ├── controllers/             # HTTP handlers — validate, call services, respond
│   │   ├── middleware/              # authMiddleware, adminMiddleware, errorHandler
│   │   ├── routes/                  # Mount paths under /api/*
│   │   ├── services/                # Firestore business logic
│   │   ├── utils/                   # responseFormatter, helpers, flatUtils
│   │   └── scripts/createFirstAdmin.js  # One-time bootstrap
│   └── serviceAccountKey.json       # Local only (gitignored)
│
├── netlify/
│   ├── functions/api.mjs            # serverless-http wrapper for Express
│   └── (netlify.toml at repo root)
│
├── tests/                           # Playwright E2E
│   ├── fixtures.js                  # Worker-scoped authenticated context
│   ├── global-setup.js
│   ├── dashboard.spec.js
│   └── multi-flat.spec.js
│
├── firestore.rules                  # Firestore security rules (deploy separately)
├── package.json                     # Root: concurrently dev, Playwright
├── PROJECT.md                       # This file
├── DECISIONS.md                     # Architecture decisions log
└── COMPONENTS.md                    # Component & utility catalog
```

### Role of each major area

| Path | Role |
|------|------|
| `client/src/api/` | Thin HTTP layer; maps REST to async functions returning `res.data.data` |
| `client/src/pages/admin/` | Admin UI: members, expenses, transactions, dues, settings, dashboard |
| `client/src/pages/user/` | Member UI: dashboard, my dues, pay maintenance, society expenses |
| `server/src/services/` | All Firestore reads/writes and domain rules |
| `server/src/controllers/` | Validate input, call services, format JSON via `sendSuccess`/`sendError` |
| `server/src/routes/` | Wire middleware + express-validator + controllers |
| `netlify/functions/` | Production API host (same `app.js` as local) |

---

## State management architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        main.jsx Providers                        │
├─────────────────────────────────────────────────────────────────┤
│  QueryClientProvider (TanStack Query — staleTime 5min)           │
│    └── BrowserRouter                                             │
│          └── ConfigProvider (Ant Design theme)                   │
│                └── AuthProvider (useReducer + Firebase listener) │
│                      └── App → AppRoutes                         │
└─────────────────────────────────────────────────────────────────┘

AuthContext state:
  user      → Firebase Auth user object
  profile   → { uid, name, role, flatNumber, ... } from GET /api/auth/me
  loading   → true until Firebase + profile resolved
  login()   → email OR 10-digit contact + password
  logout()  → signOut + clear localStorage token

Per-page server state (React Query):
  queryKey: ['members', filters, page]  |  ['dues', ...]  |  ['config']  etc.
  mutations invalidate related queryKeys on success

Local UI state:
  useState in pages — modals, filters, Ant Design Form.useForm()
```

**Route guards:**

| Guard | Requirement |
|-------|-------------|
| `PrivateRoute` | Firebase `user` present |
| `AdminRoute` | `profile.role === 'admin'` |

---

## Data flow: source → processing → output

### Typical read (e.g. Members list)

1. `Members.jsx` → `useQuery({ queryFn: () => fetchMembers({ search, page }) })`
2. `client/src/api/members.js` → `GET /api/members` (Bearer token)
3. `memberController.getMembers` → `memberService.getMembers` → Firestore `members`
4. Response: `{ success: true, data: { data: [...], total, page, limit } }`
5. React Query caches by `queryKey`; Ant Design `Table` renders rows

### Typical write (e.g. Create expense)

1. Optional: `<FileUpload>` → `POST /api/upload` → GCS path stored in form state
2. Form `onFinish` → `useMutation.mutate(values)` → `POST /api/expenses`
3. `expenseService` writes document with `serverTimestamp()`
4. `onSuccess` → `message.success` + `invalidateQueries`

### Auth flow

1. `login(identifier, password)` → Firebase `signInWithEmailAndPassword` (email or synthetic `{contact}@society.app`)
2. Token in `localStorage`; Axios interceptor attaches `Authorization: Bearer`
3. `GET /api/auth/me` loads Firestore member profile (role for routing/sidebar)

### File view flow

1. UI stores GCS path in `fileUrl` (not a public URL)
2. `FileViewerModal` → `GET /api/files/view?path=...` → blob URL in modal
3. `fileController` downloads buffer from Storage (binary-safe on Netlify)

---

## REST API surface

| Prefix | Auth | Notes |
|--------|------|-------|
| `GET /api/health` | — | Health check |
| `/api/auth` | Mixed | `POST /lookup` public; `GET /me` authenticated |
| `/api/members` | Admin | CRUD members |
| `/api/expenses` | Auth / Admin write | Members read; admins write |
| `/api/transactions` | Mixed | `POST /self`, `GET /my` for members |
| `/api/dues` | Mixed | `POST /generate` admin; `GET /my` member |
| `/api/upload` | Auth | Multipart file upload |
| `/api/files` | Auth | `GET /view?path=` blob proxy |
| `/api/config` | Auth read / Admin write | `societyConfig/config` |
| `/api/dashboard` | Admin | `GET /stats` |

---

## Firestore data model

| Collection / doc | Purpose |
|------------------|---------|
| `members/{uid}` | Profile; `flatNumber` may be comma-separated; `isActive` |
| `expenses` | Society expenses (title, type, amount, date, fileUrl) |
| `transactions` | Payments (memberId, amount, status, month, fileUrl, recordedBy) |
| `maintenanceDues` | Monthly dues (`amount`, `flatCount`, `status`, `paidAmount`) |
| `societyConfig/config` | `societyName`, `monthlyMaintenanceAmount`, `upiId` |

All production reads/writes go through **Express + Admin SDK**. Firestore rules are a safety net if client SDK were ever used.

---

## Key third-party packages

| Package | Role in this app |
|---------|------------------|
| **react** / **react-dom** | UI library |
| **react-router-dom** | SPA routing, nested layouts, route guards |
| **vite** | Dev server & production bundler |
| **antd** | Tables, forms, modals, layout, messages |
| **@tanstack/react-query** | Server-state cache, mutations, invalidation |
| **axios** | HTTP client + interceptors (401 → /login) |
| **firebase** (client) | Email/password auth only |
| **dayjs** | Date/month formatting |
| **recharts** | Admin dashboard bar chart |
| **express** | REST API |
| **firebase-admin** | Auth verify, Firestore, Storage |
| **express-validator** | Request body/query validation |
| **multer** | Multipart upload parsing |
| **sharp** | Image compression on upload (lazy-loaded) |
| **serverless-http** | Netlify function adapter |
| **cors** | Allow `CLIENT_ORIGIN` (comma-separated list supported) |
| **dotenv** | Server env loading |
| **concurrently** | Run client + server via root `npm run dev` |
| **@playwright/test** | E2E functional tests |

---

## Environment setup

### Prerequisites

- Node.js **20+**
- Firebase project: Auth (Email/Password), Firestore, Storage
- Service account key for Admin SDK

### Install

```bash
npm run install:all   # root + client + server
```

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port — **5001** (default); Vite proxy targets this |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to `serviceAccountKey.json` (local) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON string (Netlify production) |
| `FIREBASE_STORAGE_BUCKET` | GCS bucket name |
| `CLIENT_ORIGIN` | CORS origin(s), comma-separated |

```bash
cd server && cp .env.example .env
cp serviceAccountKey.json.example serviceAccountKey.json
# Paste real service account into serviceAccountKey.json
```

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5001/api` locally, or `/api` in production |
| `VITE_FIREBASE_*` | Firebase web app config from console |

```bash
cd client && cp .env.example .env
```

**Note:** `client/.env.example` shows port 5000; actual server default is **5001** and `vite.config.js` proxies to 5001. Use `VITE_API_BASE_URL=http://localhost:5001/api` or rely on Vite proxy with `VITE_API_BASE_URL=/api`.

### Bootstrap first admin

```bash
cd server
node src/scripts/createFirstAdmin.js \
  --name "Super Admin" \
  --email "admin@example.com" \
  --password "YourPassword@123" \
  --contact "9876543210" \
  --flat "Office" \
  --society "Deshpande Blocks" \
  --upi "society@upi" \
  --maintenance 1100
```

### Firestore rules

```bash
firebase deploy --only firestore:rules
```

---

## Build & run commands

| Command | Where | Effect |
|---------|-------|--------|
| `npm run dev` | Root | Client :5173 + server :5001 (concurrently) |
| `npm run dev --prefix client` | Client | Vite dev only |
| `npm run dev --prefix server` | Server | nodemon API |
| `npm run build --prefix client` | Client | Output `client/dist` |
| `npm start --prefix server` | Server | Production Node (no Vite) |
| `npm run test:unit --prefix server` | Server | `flatUtils` unit tests |
| `npx playwright test` | Root | E2E (requires running app) |

**Netlify build** (from `netlify.toml`): install server + client deps → `vite build` → publish `client/dist`; API via serverless function with esbuild bundler.
