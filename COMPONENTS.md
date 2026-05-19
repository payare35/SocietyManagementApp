# Deshpande Blocks — Components & Design Tokens

## Reusable UI components

### `ErrorBoundary`
- **Path:** `client/src/components/common/ErrorBoundary.jsx`
- **Purpose:** Class component that catches render errors and shows Ant Design `Result` with reload.
- **Props:** `children` (ReactNode)
- **Usage:**
```jsx
<ErrorBoundary>
  <AppRoutes />
</ErrorBoundary>
```

---

### `Loader`
- **Path:** `client/src/components/common/Loader.jsx`
- **Purpose:** Centered Ant Design `Spin` for route loading or inline loading.
- **Props:**
  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `fullScreen` | boolean | `false` | If true, fills viewport height |
- **Usage:**
```jsx
if (loading) return <Loader fullScreen />;
```

---

### `EmptyState`
- **Path:** `client/src/components/common/EmptyState.jsx`
- **Purpose:** Ant Design `Empty` with optional CTA button for empty tables/lists.
- **Props:**
  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `description` | string | `'No data found'` | Empty state text |
  | `buttonText` | string | — | Optional button label |
  | `onAction` | function | — | Button click handler |
- **Usage:**
```jsx
<Table locale={{ emptyText: <EmptyState description="No dues found." /> }} />
```

---

### `FileUpload`
- **Path:** `client/src/components/common/FileUpload.jsx`
- **Purpose:** Drag-and-drop upload to Firebase Storage via `POST /api/upload`; validates JPG/PNG/PDF ≤ 5MB.
- **Props:**
  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `folder` | string | `'general'` | Storage folder segment (`expenses`, `transactions`, etc.) |
  | `onUpload` | function | required | `( { filePath, fileName } \| null ) => void` |
  | `label` | string | — | Dragger hint text |
- **Returns via callback:** `{ filePath, fileName }` — store in form state, send to API on submit.
- **Usage:**
```jsx
const [fileData, setFileData] = useState(null);
<FileUpload folder="expenses" onUpload={setFileData} label="Upload receipt (optional)" />
// on submit: fileUrl: fileData?.filePath, fileName: fileData?.fileName
```

---

### `FileViewerModal`
- **Path:** `client/src/components/common/FileViewerModal.jsx`
- **Purpose:** Wraps a clickable trigger; opens modal with image/PDF preview via authenticated blob URL.
- **Props:**
  | Prop | Type | Description |
  |------|------|-------------|
  | `filePath` | string | GCS path or legacy `http` URL |
  | `fileName` | string | Modal title & download name |
  | `children` | ReactNode | Trigger (e.g. link `Button`) |
- **Usage:**
```jsx
<FileViewerModal filePath={record.fileUrl} fileName={record.fileName}>
  <Button size="small" type="link" icon={<PaperClipOutlined />}>View</Button>
</FileViewerModal>
```

---

### `DashboardCards`
- **Path:** `client/src/components/dashboard/DashboardCards.jsx`
- **Purpose:** Four stat cards for admin dashboard (members, collections, expenses, pending dues).
- **Props:**
  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `stats` | object | `{}` | Keys: `totalMembers`, `totalCollections`, `totalExpenses`, `pendingDues` |
- **Usage:**
```jsx
<DashboardCards stats={dashboardData} />
```

---

### `MonthlyChart` (default export from `Charts.jsx`)
- **Path:** `client/src/components/dashboard/Charts.jsx`
- **Purpose:** Recharts bar chart — collections vs expenses by month.
- **Props:**
  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `data` | array | `[]` | `{ month, collections, expenses }[]` |
- **Usage:**
```jsx
<MonthlyChart data={stats.monthlyBreakdown} />
```

---

### `AppLayout`
- **Path:** `client/src/components/Layout/AppLayout.jsx`
- **Purpose:** Shell with sidebar, header, and `<Outlet />` for nested routes; handles mobile drawer.
- **Props:** None (uses router `Outlet`)
- **Usage:** Wrapped in `AppRoutes` under `PrivateRoute`.

---

### `AppSidebar` (default export from `Sidebar.jsx`)
- **Path:** `client/src/components/Layout/Sidebar.jsx`
- **Purpose:** Dark sidebar / mobile drawer; admin dual-menu or member-only menu.
- **Props:**
  | Prop | Type | Description |
  |------|------|-------------|
  | `collapsed` | boolean | Desktop sider collapsed state |
  | `isMobile` | boolean | Use drawer instead of sider |
  | `onClose` | function | Close mobile drawer |
- **Internal:** `Logo`, `SectionLabel`, `SidebarMenu` — not exported.

---

### `AppHeader` (default export from `Header.jsx`)
- **Path:** `client/src/components/Layout/Header.jsx`
- **Purpose:** Top bar — collapse toggle, society name from config query, user dropdown + logout.
- **Props:**
  | Prop | Type | Description |
  |------|------|-------------|
  | `collapsed` | boolean | Sidebar state |
  | `onToggle` | function | Toggle sidebar |

---

## Route guard components

| Component | Path | Purpose |
|-----------|------|---------|
| `PrivateRoute` | `client/src/routes/PrivateRoute.jsx` | Requires Firebase user; shows `Loader` while loading |
| `AdminRoute` | `client/src/routes/AdminRoute.jsx` | Requires `profile.role === 'admin'` |
| `AppRoutes` | `client/src/routes/AppRoutes.jsx` | Full route table |

---

## Page components (feature screens)

| Area | Path | Screens |
|------|------|---------|
| Admin | `client/src/pages/admin/` | `Dashboard`, `Members`, `AddMember`, `Expenses`, `AddExpense`, `Transactions`, `Dues`, `Settings` |
| Member | `client/src/pages/user/` | `UserDashboard`, `MyTransactions`, `MyDues`, `PayMaintenance`, `SocietyExpenses` |
| Auth | `client/src/pages/auth/` | `LoginPage` |

---

## Client API modules (`client/src/api/`)

| File | Key exports | Backend |
|------|-------------|---------|
| `axios.js` | default `api` | Base URL, Bearer interceptor, 401 → `/login` |
| `auth.js` | `getMe`, `lookupEmailByContact`, `loginVerify` | `/auth/*` |
| `members.js` | `fetchMembers`, `fetchMemberById`, `createMember`, `updateMember`, `deleteMember` | `/members` |
| `expenses.js` | `fetchExpenses`, `fetchExpenseById`, `createExpense`, `updateExpense`, `deleteExpense` | `/expenses` |
| `transactions.js` | `fetchTransactions`, `fetchMyTransactions`, `createTransaction`, `createSelfTransaction`, `updateTransactionStatus` | `/transactions` |
| `dues.js` | `fetchDues`, `fetchMyDues`, `generateDues` | `/dues` |
| `dashboard.js` | `fetchDashboardStats` | `GET /dashboard/stats` (admin) |
| `config.js` | `fetchConfig`, `updateConfig` | `/config` |
| `upload.js` | `uploadFile(file, folder)` | `POST /upload` |
| `files.js` | `fetchFileAsBlob(filePath)` | `GET /files/view` |

**Pattern:** All fetch functions return `res.data.data` (the inner payload).

---

## Server services (`server/src/services/`)

| Service | Path | Responsibility |
|---------|------|----------------|
| `authService` | `authService.js` | `getUserProfile`, `lookupAuthEmailByContact` |
| `memberService` | `memberService.js` | Member CRUD, Firebase user creation, custom claims |
| `expenseService` | `expenseService.js` | Expense CRUD, in-memory filter/paginate |
| `transactionService` | `transactionService.js` | Admin/member transactions, status updates, due reconciliation |
| `duesService` | `duesService.js` | Generate dues, list/filter, mark paid |
| `configService` | `configService.js` | Read/update `societyConfig/config` |
| `dashboardService` | `dashboardService.js` | Aggregate stats for admin dashboard |
| `uploadService` | `uploadService.js` | Multer buffer → sharp compress → GCS upload |

---

## Server middleware

| Middleware | Path | Behavior |
|------------|------|----------|
| `authMiddleware` | `middleware/authMiddleware.js` | Verifies Bearer JWT → `req.user = { uid, role, email }` |
| `adminMiddleware` | `middleware/adminMiddleware.js` | Requires `req.user.role === 'admin'` |
| `errorHandler` | `middleware/errorHandler.js` | Global `{ success: false, message }` on unhandled errors |

---

## Shared client utilities

| Module | Path | Exports / purpose |
|--------|------|-----------------|
| **formatters** | `client/src/utils/formatters.js` | `formatCurrency`, `formatDate`, `formatDateTime`, `formatMonth` — INR & Indian date formats; handles Firestore timestamp shapes |
| **constants** | `client/src/utils/constants.js` | `TRANSACTION_STATUS`, `TRANSACTION_TYPES`, `DUE_STATUS`, `STATUS_COLORS`, `EXPENSE_TYPES`, `EXPENSE_TYPE_COLORS` |
| **upiLinks** | `client/src/utils/upiLinks.js` | `buildUpiLinks({ upiId, societyName, amount, month })` — legacy; Pay page does not use |
| **firebaseConfig** | `client/src/firebaseConfig.js` | `auth` export for Firebase client |

---

## Shared server utilities

| Module | Path | Exports / purpose |
|--------|------|-----------------|
| **responseFormatter** | `server/src/utils/responseFormatter.js` | `sendSuccess(res, data, message?, status?)`, `sendError(res, status, message, errors?)` |
| **helpers** | `server/src/utils/helpers.js` | `buildSyntheticEmail`, `getCurrentMonth`, `getPaginatedSlice` |
| **flatUtils** | `server/src/utils/flatUtils.js` | `countFlats(flatNumber)` — multi-flat dues multiplier |

---

## Auth hook

```javascript
import { useAuth } from '../context/AuthContext';

const { user, profile, loading, error, login, logout, refreshToken } = useAuth();
// profile.role → 'admin' | 'member'
// profile.flatNumber → may be "501, 502"
```

---

## Theme tokens

### CSS variables (`client/src/index.css` — `:root`)

| Token | Value | Usage |
|-------|-------|--------|
| `--indigo-50` … `--indigo-900` | `#EEF2FF` … `#312E81` | Primary scale, hovers, upload dragger |
| `--slate-50` … `--slate-900` | `#F8FAFC` … `#0F172A` | Neutrals, text, sidebar bg |
| `--surface` | `#FFFFFF` | Content background |
| `--radius` | `8px` | Buttons, inputs, tags |
| `--radius-lg` | `12px` | Cards, tables, modals |
| `--shadow-sm` | light shadow | Card hover |
| `--shadow-md` | medium shadow | Stat card hover |
| `--transition` | `0.18s ease` | Buttons, rows, menu items |

### Ant Design `ConfigProvider` tokens (`client/src/main.jsx`)

| Token | Value |
|-------|-------|
| `colorPrimary` | `#4F46E5` |
| `colorLink` | `#4F46E5` |
| `colorSuccess` | `#16A34A` |
| `colorWarning` | `#D97706` |
| `colorError` | `#DC2626` |
| `colorTextBase` | `#1E293B` |
| `colorBgBase` | `#FFFFFF` |
| `borderRadius` | `8` |
| `boxShadow` | `none` |
| `fontFamily` | system stack + Inter |

**Layout / Menu overrides:** `siderBg` `#1E293B`, `darkItemSelectedBg` `#4F46E5`, `headerBg` `#F8FAFC`, `rowHoverBg` `#EEF2FF`.

### Global CSS classes

| Class | Purpose |
|-------|---------|
| `.page-header` | Flex row: title left, actions right |
| `.stat-card` | Dashboard statistic card hover |
| `.app-content` | Main content padding & border |
| `.app-sider` | Sidebar menu item spacing |

### Status / type colors (JS constants)

Use `STATUS_COLORS[status]` and `EXPENSE_TYPE_COLORS[type]` from `constants.js` for Ant Design `<Tag color={...} />`.

### Typography & spacing

- No custom text components — use Ant Design `Typography` (`Title`, `Text`).
- Page content: `.app-content` — `20px 16px` margin.
- Section gaps: `marginBottom: 16` / `24`.
- Forms: `layout="vertical"` on admin forms.
