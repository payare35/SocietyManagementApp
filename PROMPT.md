# Society Management App — Full Build Prompt

You are an expert full-stack developer. Build a complete, production-ready **Society Management Application** from scratch. The app manages residential housing societies — tracking members, maintenance dues, payments, and society expenses.

Follow every instruction below precisely. Do not skip any section. Produce clean, well-structured, production-grade code with proper error handling, loading states, and responsive design.

---

## 1. Tech Stack (Use exactly these)

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React 18+ (Vite), React Router v6, Ant Design 5 component library |
| State Mgmt     | React Context API + useReducer for auth; React Query (TanStack Query) for server state |
| Backend        | Node.js 20+, Express.js                                      |
| Database       | Firebase Firestore                                            |
| Authentication | Firebase Authentication (Email/Password)                     |
| File Storage   | Firebase Storage                                              |
| Styling        | Ant Design components + minimal custom CSS modules            |

**Monorepo structure** with two top-level directories: `/client` and `/server`.

---

## 2. Project Folder Structure

```
society-management-app/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios instance, API call functions
│   │   ├── assets/            # Static images, icons
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout/        # AppLayout, Sidebar, Header
│   │   │   ├── common/        # Loader, ErrorBoundary, FileUpload, EmptyState
│   │   │   └── dashboard/     # DashboardCards, Charts
│   │   ├── context/           # AuthContext, AuthProvider
│   │   ├── hooks/             # useAuth, useFetch, useFileUpload
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage
│   │   │   ├── admin/         # Dashboard, Members, AddMember, Expenses, AddExpense, Transactions, AddTransaction
│   │   │   └── user/          # UserDashboard, MyTransactions, MyDues, SocietyExpenses, PayMaintenance
│   │   ├── routes/            # AppRoutes, PrivateRoute, AdminRoute
│   │   ├── utils/             # helpers, constants, formatters
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── firebaseConfig.js
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/            # firebase-admin init
│   │   ├── middleware/         # authMiddleware, adminMiddleware, errorHandler
│   │   ├── routes/            # authRoutes, memberRoutes, expenseRoutes, transactionRoutes, duesRoutes
│   │   ├── controllers/       # corresponding controllers
│   │   ├── services/          # business logic layer
│   │   ├── utils/             # helpers, response formatter
│   │   └── index.js           # Express app entry point
│   ├── .env.example
│   ├── serviceAccountKey.json.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 3. Firestore Data Model

Design these collections with the exact field names shown. Use Firestore auto-generated document IDs unless noted.

### Collection: `members`
```
{
  uid: string,              // Firebase Auth UID (set as doc ID)
  name: string,
  contactNumber: string,
  email: string | null,
  role: "admin" | "member",
  flatNumber: string,
  societyId: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `expenses`
```
{
  id: string,               // auto-generated
  title: string,
  type: string,             // e.g. "Maintenance", "Repair", "Event", "Utility", "Other"
  amount: number,
  description: string,
  fileUrl: string | null,   // Firebase Storage download URL
  fileName: string | null,
  createdBy: string,        // admin UID
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `transactions`
```
{
  id: string,               // auto-generated
  memberId: string,         // references members.uid
  memberName: string,       // denormalized for quick reads
  flatNumber: string,       // denormalized
  amount: number,
  type: "maintenance" | "penalty" | "other",
  status: "pending" | "confirmed" | "rejected",
  fileUrl: string | null,   // payment receipt upload
  fileName: string | null,
  note: string,
  month: string,            // e.g. "2026-03" (the billing month this payment covers)
  recordedBy: string,       // admin UID who recorded it, or "self" if user-submitted
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `maintenanceDues`
```
{
  id: string,
  memberId: string,
  memberName: string,
  flatNumber: string,
  month: string,            // "YYYY-MM"
  amount: number,
  status: "unpaid" | "paid" | "partial",
  paidAmount: number,
  dueDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `societyConfig` (single document: `config`)
```
{
  societyName: string,
  address: string,
  monthlyMaintenanceAmount: number,
  expenseTypes: string[],   // ["Maintenance", "Repair", "Event", "Utility", "Other"]
  upiId: string | null,     // society's UPI ID for payment links
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4. Authentication & Authorization

### Flow
1. **Admin creates member accounts** via the backend. The backend uses Firebase Admin SDK to call `admin.auth().createUser({ email, password })` (use contactNumber + "@society.app" as a synthetic email if real email is not provided). Return the UID.
2. Store the member document in Firestore `members` collection with that UID.
3. **Set custom claims** on the Firebase Auth user: `{ role: "admin" }` or `{ role: "member" }`.
4. **Login**: The React client calls `signInWithEmailAndPassword` from Firebase client SDK. On success, get the ID token and send it with every API request in the `Authorization: Bearer <token>` header.
5. **Backend middleware**: Verify the ID token using `admin.auth().verifyIdToken(token)`. Extract `uid` and `role` from the decoded token. Attach to `req.user`.
6. **AdminMiddleware**: Check `req.user.role === "admin"`. Return 403 if not.

### First Admin Bootstrap
Provide a one-time setup script (`server/src/scripts/createFirstAdmin.js`) that:
- Takes name, email, password, contactNumber as CLI arguments
- Creates the Firebase Auth user
- Sets admin custom claims
- Creates the `members` document with `role: "admin"`
- Creates the `societyConfig` document with defaults

---

## 5. Backend API Endpoints

All routes are prefixed with `/api`. All protected routes require the `authMiddleware`. Admin-only routes additionally require `adminMiddleware`.

### Auth
| Method | Endpoint                | Auth    | Description                          |
| ------ | ----------------------- | ------- | ------------------------------------ |
| POST   | `/api/auth/login`       | Public  | Verify token, return user profile    |
| GET    | `/api/auth/me`          | User    | Get current user profile             |

### Members (Admin only)
| Method | Endpoint                    | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| POST   | `/api/members`              | Admin  | Create new member (creates Firebase Auth user + Firestore doc) |
| GET    | `/api/members`              | Admin  | List all members with pagination & search |
| GET    | `/api/members/:id`          | Admin  | Get single member details                |
| PUT    | `/api/members/:id`          | Admin  | Update member details                    |
| DELETE | `/api/members/:id`          | Admin  | Soft-delete (set `isActive: false`)      |

### Expenses (Admin write, all read)
| Method | Endpoint                    | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| POST   | `/api/expenses`             | Admin  | Create expense with optional file upload |
| GET    | `/api/expenses`             | User   | List expenses with filters (type, date range), pagination |
| GET    | `/api/expenses/:id`         | User   | Get single expense                       |
| PUT    | `/api/expenses/:id`         | Admin  | Update expense                           |
| DELETE | `/api/expenses/:id`         | Admin  | Delete expense                           |

### Transactions
| Method | Endpoint                          | Auth   | Description                                  |
| ------ | --------------------------------- | ------ | -------------------------------------------- |
| POST   | `/api/transactions`               | Admin  | Record a payment/transaction for a member    |
| GET    | `/api/transactions`               | Admin  | List all transactions with filters & pagination |
| GET    | `/api/transactions/my`            | User   | Get current user's own transactions          |
| GET    | `/api/transactions/:id`           | User   | Get single transaction                       |
| PUT    | `/api/transactions/:id/status`    | Admin  | Approve/reject a transaction                 |

### Maintenance Dues
| Method | Endpoint                          | Auth   | Description                                  |
| ------ | --------------------------------- | ------ | -------------------------------------------- |
| POST   | `/api/dues/generate`              | Admin  | Generate monthly dues for all active members |
| GET    | `/api/dues`                       | Admin  | List all dues with filters                   |
| GET    | `/api/dues/my`                    | User   | Get current user's dues                      |

### File Upload
| Method | Endpoint                    | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| POST   | `/api/upload`               | User   | Upload file to Firebase Storage, return URL |

### Society Config
| Method | Endpoint                    | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| GET    | `/api/config`               | User   | Get society configuration                |
| PUT    | `/api/config`               | Admin  | Update society configuration             |

---

## 6. Frontend Pages & UI Specification

Use **Ant Design** components throughout. The layout should use `Ant Layout` with a collapsible `Sider` for navigation and a top `Header` showing the society name and a user avatar dropdown (Profile, Logout).

### 6.1 Login Page (`/login`)
- Clean centered card with society logo placeholder, email input, password input, and "Sign In" button.
- On success, redirect to `/admin/dashboard` (if admin) or `/dashboard` (if member).
- Show Ant `message.error` on failure.

### 6.2 Admin Pages

#### Dashboard (`/admin/dashboard`)
- **4 stat cards** at the top (Ant `Statistic` inside `Card`):
  - Total Members (active count)
  - Total Collections This Month (sum of confirmed transactions for current month)
  - Total Expenses This Month
  - Pending Dues This Month (count of unpaid dues)
- **Bar chart** (use Recharts or @ant-design/charts): Monthly collections vs expenses for the last 6 months.
- **Recent Transactions table** (last 10), with status tags (green=confirmed, orange=pending, red=rejected).

#### Members List (`/admin/members`)
- Ant `Table` with columns: Name, Flat Number, Contact, Email, Status (Active/Inactive tag), Actions.
- Search bar filtering by name or flat number.
- "Add Member" button in top-right opens the Add Member page.
- Actions column: Edit (opens edit drawer/modal), Deactivate toggle.

#### Add/Edit Member (`/admin/members/new`, `/admin/members/:id/edit`)
- Ant `Form` inside a page or Drawer:
  - Name (required)
  - Flat Number (required)
  - Contact Number (required, validated as 10-digit Indian mobile)
  - Email (optional, validated as email format)
  - Password (required on create, optional on edit; minimum 6 chars)
  - Role select: Admin / Member (only visible to existing admins)
- On submit, call POST `/api/members` or PUT `/api/members/:id`.

#### Expenses (`/admin/expenses`)
- Ant `Table`: Title, Type (color-coded Tag), Amount (formatted as ₹), Date, Attachment (link icon if file exists), Actions.
- Filters: Type dropdown, Date range picker.
- "Add Expense" button.

#### Add Expense (`/admin/expenses/new`)
- Form fields:
  - Title (required)
  - Type (required, Select from `societyConfig.expenseTypes`)
  - Amount (required, number input with ₹ prefix)
  - Description (optional, TextArea)
  - File Upload (optional, Ant `Upload` component with drag-and-drop; max 5MB; accepted: .jpg, .png, .pdf)
- On submit, upload file first via `/api/upload`, get URL, then POST `/api/expenses`.

#### Transactions (`/admin/transactions`)
- Table: Member Name, Flat No., Amount, Type, Month, Status, Receipt, Date, Actions.
- Filters: Status, Month picker, Member search.
- "Record Payment" button → form:
  - Select Member (searchable Ant `Select` populated from members list)
  - Amount (number)
  - Type (maintenance / penalty / other)
  - Month (month picker, format "YYYY-MM")
  - Receipt Upload (optional)
  - Note (optional)

#### Generate Dues (`/admin/dues`)
- Button: "Generate Dues for Month" → Month picker modal → calls POST `/api/dues/generate` with the selected month.
- Table of all dues: Member, Flat, Month, Due Amount, Paid Amount, Status, Actions.
- Action: "Mark as Paid" button (creates a confirmed transaction and updates the due).

### 6.3 Member (End User) Pages

#### My Dashboard (`/dashboard`)
- Welcome message with member name.
- Stat cards:
  - Pending Dues (count)
  - Total Paid This Year
- Next due date and amount highlighted in a prominent card.

#### My Transactions (`/my-transactions`)
- Table of own transactions: Date, Amount, Type, Month, Status, Receipt link.
- No edit/delete — read-only.

#### My Dues (`/my-dues`)
- Table: Month, Due Amount, Paid Amount, Status.
- Each unpaid row shows a **"Pay Now"** button.

#### Pay Maintenance (`/pay`)
- Shows the pending due details (amount, month).
- Three payment buttons that generate **UPI intent deep links** and open them:
  - **Google Pay**: `gpay://upi/pay?pa={upiId}&pn={societyName}&am={amount}&cu=INR&tn=Maintenance-{month}`
  - **PhonePe**: `phonepe://pay?pa={upiId}&pn={societyName}&am={amount}&cu=INR&tn=Maintenance-{month}`
  - **Paytm**: `paytmmp://pay?pa={upiId}&pn={societyName}&am={amount}&cu=INR&tn=Maintenance-{month}`
- Also show a **generic UPI link**: `upi://pay?pa={upiId}&pn={societyName}&am={amount}&cu=INR&tn=Maintenance-{month}` as fallback.
- Below the buttons, a section: "Already Paid? Upload Receipt" — file upload + submit creates a transaction with `status: "pending"` and `recordedBy: "self"`.

#### Society Expenses (`/expenses`)
- Read-only view of the same expenses table (no add/edit/delete actions).
- Filters: Type, Date range.

---

## 7. File Upload Implementation

- Frontend: Use Ant Design `Upload` component. On file select, call `POST /api/upload` with `multipart/form-data`.
- Backend: Use `multer` for multipart parsing. Upload the buffer to Firebase Storage bucket at path `uploads/{collectionName}/{timestamp}_{originalName}`. Generate a signed download URL (or make the file public). Return `{ fileUrl, fileName }`.
- Store the returned `fileUrl` and `fileName` in the relevant Firestore document.

---

## 8. Error Handling & Validation

- **Backend**: Use `express-validator` for input validation on every route. Return consistent JSON error responses: `{ success: false, message: string, errors?: array }`.
- **Frontend**: Display Ant Design `message.error()` for API failures. Show inline form validation using Ant Form's built-in `rules` prop.
- **Global Error Boundary**: Wrap the React app in an ErrorBoundary component that shows a friendly fallback UI.
- **Loading States**: Use Ant `Spin` or `Skeleton` components during data fetches.

---

## 9. Security

- **Firestore Security Rules**: Write rules that:
  - Allow read/write to admins on all collections.
  - Allow members to read their own `transactions` and `maintenanceDues` documents (where `memberId == request.auth.uid`).
  - Allow members to read all `expenses`.
  - Allow members to read `societyConfig`.
  - Deny everything else.
- **Backend**: Never trust client-side role claims alone — always verify the ID token server-side and read claims from the verified token.
- **Environment Variables**: All Firebase config, service account paths, and secrets go in `.env` (never committed). Provide `.env.example` files with placeholder values.
- **CORS**: Configure Express CORS to allow only the frontend origin.

---

## 10. Additional Requirements

1. **Responsive Design**: The app must work well on mobile screens (min 360px wide). The sidebar should collapse to a hamburger menu on small screens.
2. **Indian Rupee Formatting**: All monetary values displayed as `₹1,23,456` (Indian numbering system). Create a `formatCurrency(amount)` utility.
3. **Date Formatting**: Display dates as `DD MMM YYYY` (e.g., `23 Mar 2026`). Use `dayjs`.
4. **Pagination**: All list endpoints support `page` and `limit` query params. Default: page=1, limit=20. Frontend tables use Ant Design's built-in pagination tied to API pagination.
5. **Toast Notifications**: Use Ant Design `message` for success/error toasts on all CUD operations.
6. **Confirmation Modals**: Use Ant `Modal.confirm` before any delete or status-change action.
7. **README.md**: Write a comprehensive README with:
   - Project overview
   - Tech stack
   - Prerequisites (Node.js, Firebase project setup steps)
   - Environment variable setup instructions
   - How to run the first-admin bootstrap script
   - How to start the dev servers (client + server)
   - Folder structure explanation

---

## 11. Code Quality Standards

- Use ES module syntax (`import/export`) throughout.
- Use `async/await` for all asynchronous operations — no raw `.then()` chains.
- Extract all API base URLs, collection names, and magic strings into constants files.
- Every component should be in its own file. No file should exceed 300 lines — extract sub-components or hooks if needed.
- Use PropTypes or JSDoc comments for component props.
- Consistent naming: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE_CASE for constants.

---

## 12. Scripts & Dev Setup

- `client/package.json` scripts: `dev`, `build`, `preview`.
- `server/package.json` scripts: `dev` (using nodemon), `start`.
- Provide a root-level `package.json` with a `dev` script that runs both client and server concurrently using `concurrently`.
- `.gitignore` should exclude: `node_modules/`, `.env`, `serviceAccountKey.json`, `dist/`, `.DS_Store`.

---

## 13. Execution Order

Build the app in this order. Produce the COMPLETE code for every file — no placeholders, no "implement this later" comments, no truncation.

1. Initialize both projects (`client` with Vite + React, `server` with Express). Set up `package.json` files with all dependencies and the root `package.json` with `concurrently`.
2. Firebase config: `client/src/firebaseConfig.js` and `server/src/config/firebase.js` (Admin SDK init).
3. Backend: middleware (auth, admin, error handler) → routes + controllers + services for all endpoints → file upload route.
4. Backend: Bootstrap script (`createFirstAdmin.js`).
5. Frontend: Auth context + login page + route guards.
6. Frontend: Layout (Sidebar + Header + Content area).
7. Frontend: Admin pages (Dashboard → Members → Expenses → Transactions → Dues).
8. Frontend: Member pages (Dashboard → My Transactions → My Dues → Pay Maintenance → Society Expenses).
9. Firestore security rules file (`firestore.rules`).
10. `.env.example` files, `.gitignore`, and `README.md`.

**Output every single file with its full path and complete contents. Do not skip, abbreviate, or truncate any file.**
