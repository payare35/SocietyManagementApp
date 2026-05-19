# Deshpande Blocks — Project Brain

## App name & purpose

**Deshpande Blocks** is a society (housing society / apartment block) management web app. Admins manage members, log expenses, record payments, generate monthly maintenance dues, and configure society settings. Members view their dues, submit maintenance payments (amount + receipt), and browse society expenses.

Production: https://deshpandeblocks.netlify.app  
Repository: monorepo with `client/` (React SPA) and `server/` (Express API).

---

## Full folder structure

```
Society Management App/
├── client/                          # React frontend (Vite)
│   ├── public/                      # Static assets (favicon.svg)
│   ├── src/
│   │   ├── api/                     # Axios API clients per domain
│   │   ├── components/
│   │   │   ├── common/              # Shared UI widgets
│   │   │   ├── dashboard/           # Admin dashboard charts/cards
│   │   │   └── Layout/              # Shell: sidebar, header, layout
│   │   ├── context/                 # AuthContext (Firebase + profile)
│   │   ├── pages/
│   │   │   ├── admin/               # Admin CRUD & dashboards
│   │   │   ├── user/                # Member portal pages
│   │   │   └── auth/                # Login
│   │   ├── routes/                  # Router config & guards
│   │   ├── utils/                   # formatters, constants, UPI helpers
│   │   ├── App.jsx                  # Root + ErrorBoundary
│   │   ├── main.jsx                 # Providers (Query, Router, Ant Design, Auth)
│   │   ├── index.css                # Design tokens & global Ant overrides
│   │   └── firebaseConfig.js        # Client Firebase init
│   ├── .env / .env.production       # VITE_* (API URL, Firebase public config)
│   └── vite.config.js
│
├── server/                          # Express API
│   ├── src/
│   │   ├── app.js                   # Express app (no listen) — used locally + Netlify
│   │   ├── index.js                 # Local dev entry (listen :5001)
│   │   ├── config/firebase.js       # Admin SDK init (env JSON or key file)
│   │   ├── controllers/             # Request handlers
│   │   ├── middleware/              # auth, admin, errors
│   │   ├── routes/                  # Mount paths under /api/*
│   │   ├── services/                # Firestore business logic
│   │   ├── utils/                   # Shared server helpers
│   │   └── scripts/createFirstAdmin.js  # Bootstrap script
│   └── serviceAccountKey.json       # Local only (gitignored)
│
├── netlify/
│   ├── functions/api.mjs            # serverless-http wrapper for Express
│   └── netlify.toml                 # Build, redirects, function config
│
├── tests/                           # Playwright E2E
│   ├── fixtures.js                  # Worker-scoped authenticated context
│   ├── dashboard.spec.js            # Full UI regression suite
│   └── multi-flat.spec.js           # Multi-flat dues scenario
│
├── package.json                     # Root: concurrently dev, Playwright
├── PROJECT.md                       # This file
├── DECISIONS.md                     # Architecture decisions log
└── COMPONENTS.md                    # Component catalog
```

### Role of each major area

| Path | Role |
|------|------|
| `client/src/api/` | Thin HTTP layer; maps REST to typed-ish async functions |
| `client/src/pages/admin/` | Admin UI: members, expenses, transactions, dues, settings, dashboard |
| `client/src/pages/user/` | Member UI: dashboard, my dues, pay maintenance, society expenses |
| `server/src/services/` | All Firestore reads/writes and domain rules |
| `server/src/controllers/` | Validate input, call services, format JSON responses |
| `server/src/routes/` | Wire middleware + validation + controllers |
| `netlify/functions/` | Production API host (same `app.js` as local) |

---

## State management architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        main.jsx Providers                        │
├─────────────────────────────────────────────────────────────────┤
│  QueryClientProvider (TanStack Query)                            │
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
  useState in pages — modals, filters, form instances (Ant Design Form.useForm)
```

**Guards:**

- `PrivateRoute` — requires Firebase `user`
- `AdminRoute` — requires `profile.role === 'admin'`

---

## Data flow: API → model → state → UI

```
┌──────────┐     Bearer JWT      ┌──────────────┐     Admin SDK    ┌───────────┐
│  Browser │ ──────────────────► │ Express API  │ ───────────────► │ Firestore │
│ (React)  │ ◄── JSON envelope   │ controllers  │ ◄─────────────── │ Storage   │
└──────────┘   { success, data } └──────────────┘                  └───────────┘
      │                                    │
      │ Firebase Auth                      │ verifyIdToken + custom claims
      ▼                                    ▼
 localStorage.token                  req.user { uid, role }
```

**Typical read path (e.g. Members list):**

1. `Members.jsx` → `useQuery({ queryFn: () => fetchMembers({ search, page }) })`
2. `client/src/api/members.js` → `GET /api/members`
3. `memberController.getMembers` → `memberService.getMembers` → Firestore `members` collection
4. Response: `{ success: true, data: { data: [...], total, page, limit } }`
5. React Query caches by `queryKey`; Ant Design `Table` renders `data.data`

**Typical write path (e.g. Create expense):**

1. Form `onFinish` → `useMutation.mutate(values)`
2. `POST /api/expenses` (+ optional file already uploaded to Storage)
3. Service writes document with `serverTimestamp()`
4. `onSuccess` → `message.success` + `invalidateQueries`

**Auth path:**

1. `login(identifier, password)` → Firebase `signInWithEmailAndPassword`
2. Token stored in `localStorage`; Axios interceptor attaches `Authorization: Bearer`
3. `GET /api/auth/me` loads Firestore member profile (role for routing/sidebar)

**File view path:**

1. UI stores GCS path string in `fileUrl` field (not public URL)
2. `FileViewerModal` → `GET /api/files/view?path=...` (blob)
3. `fileController` downloads from Storage, returns buffer (binary-safe on Netlify)

---

## Firestore data model (conceptual)

| Collection / doc | Purpose |
|------------------|---------|
| `members/{uid}` | Member profile; `flatNumber` may be comma-separated |
| `expenses` | Society expenses (title, type, amount, date, fileUrl) |
| `transactions` | Payments (member, amount, status, month, fileUrl) |
| `maintenanceDues` | Generated monthly dues (`amount`, `flatCount`, `status`) |
| `societyConfig/config` | `societyName`, `monthlyMaintenanceAmount`, `upiId` |

---

## Key third-party packages

| Package | Role in this app |
|---------|------------------|
| **react** / **react-dom** | UI library |
| **react-router-dom** | SPA routing, nested layouts, route guards |
| **vite** | Dev server & production bundler |
| **antd** | Tables, forms, modals, layout, messages |
| **@tanstack/react-query** | Server-state cache, mutations, invalidation |
| **axios** | HTTP client + interceptors |
| **firebase** (client) | Email/password auth |
| **dayjs** | Date/month formatting in forms & tables |
| **recharts** | Admin dashboard bar chart |
| **express** | REST API |
| **firebase-admin** | Auth verify, Firestore, Storage |
| **express-validator** | Request body validation |
| **multer** | Multipart upload parsing |
| **sharp** | Image compression on upload (lazy-loaded) |
| **serverless-http** | Netlify function adapter |
| **cors** | Allow configured client origins |
| **concurrently** | Run client + server in `npm run dev` |
| **@playwright/test** | E2E functional tests |
