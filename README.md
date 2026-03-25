# Society Management App

A full-stack web application to manage residential housing societies — tracking members, maintenance dues, payments, and expenses.

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Frontend       | React 18 (Vite), React Router v6, Ant Design 5       |
| State Mgmt     | React Context API, TanStack React Query              |
| Backend        | Node.js 20+, Express.js                              |
| Database       | Firebase Firestore                                   |
| Authentication | Firebase Authentication (Email/Password)             |
| File Storage   | Firebase Storage                                     |

---

## Features

### Admin
- Login with role-based redirect
- Manage members (add, edit, deactivate)
- Record and manage expenses with file upload
- Record member payments/transactions
- Generate and track monthly maintenance dues
- Dashboard with stats and charts

### Members
- Login and view personal dashboard
- View past transactions and payment history
- View pending maintenance dues
- Pay maintenance via GPay, PhonePe, Paytm (UPI deep links)
- Upload payment receipt for admin verification
- View all society expenses

---

## Prerequisites

1. **Node.js** v20 or higher
2. **Firebase project** — [Create one at console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password provider)
   - Enable **Firestore** (in production mode)
   - Enable **Storage**
   - Generate a **Service Account key**: Project Settings → Service accounts → Generate new private key

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd society-management-app
npm run install:all
```

### 2. Configure the Server

```bash
cd server
cp .env.example .env
cp serviceAccountKey.json.example serviceAccountKey.json
```

Edit `server/.env`:
```
PORT=5000
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
CLIENT_ORIGIN=http://localhost:5173
```

Replace `server/serviceAccountKey.json` with the downloaded Firebase service account key.

### 3. Configure the Client

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Find these values in Firebase Console → Project Settings → Your Apps → Web App config.

### 4. Deploy Firestore Security Rules

Install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
```

Copy the rules:
```bash
cp firestore.rules firestore.rules   # already at root
firebase deploy --only firestore:rules
```

### 5. Create the First Admin (one-time bootstrap)

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

This creates:
- Firebase Auth user with admin custom claim
- `members` Firestore document with role: "admin"
- `societyConfig` document with default values

---

## Running the App

### Development (both client + server)
```bash
# From the root directory
npm run dev
```

This starts:
- Server on **http://localhost:5000**
- Client on **http://localhost:5173**

### Run individually
```bash
# Server only
npm run dev --prefix server

# Client only
npm run dev --prefix client
```

---

## Folder Structure

```
society-management-app/
├── client/                         # React frontend
│   └── src/
│       ├── api/                    # Axios API call functions
│       ├── components/
│       │   ├── Layout/             # AppLayout, Sidebar, Header
│       │   ├── common/             # Loader, ErrorBoundary, FileUpload, EmptyState
│       │   └── dashboard/          # DashboardCards, Charts
│       ├── context/                # AuthContext + AuthProvider
│       ├── hooks/                  # Custom hooks
│       ├── pages/
│       │   ├── auth/               # LoginPage
│       │   ├── admin/              # Admin pages
│       │   └── user/               # Member pages
│       ├── routes/                 # AppRoutes, PrivateRoute, AdminRoute
│       └── utils/                  # formatters, constants, upiLinks
├── server/                         # Node.js + Express backend
│   └── src/
│       ├── config/                 # Firebase Admin SDK init
│       ├── controllers/            # Request/response handlers
│       ├── middleware/             # Auth, Admin, Error handler
│       ├── routes/                 # Express route definitions
│       ├── scripts/                # Bootstrap scripts
│       ├── services/               # Business logic layer
│       └── utils/                  # Response formatter, helpers
├── firestore.rules                 # Firestore security rules
├── package.json                    # Root — runs both with concurrently
└── README.md
```

---

## UPI Payment Flow

When a member clicks "Pay Now":
1. The app fetches the society's UPI ID from `societyConfig`
2. Generates deep-link URLs for GPay, PhonePe, Paytm, and generic UPI
3. Clicking a button opens the respective payment app
4. After payment, the member uploads a screenshot via "Already Paid?"
5. A transaction is created with `status: "pending"` and `recordedBy: "self"`
6. Admin reviews and confirms/rejects the transaction

---

## Environment Variables Reference

### Server (`server/.env`)
| Variable                      | Description                          |
| ----------------------------- | ------------------------------------ |
| `PORT`                        | Server port (default: 5000)          |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON       |
| `FIREBASE_STORAGE_BUCKET`     | Firebase Storage bucket name         |
| `CLIENT_ORIGIN`               | Frontend origin for CORS             |

### Client (`client/.env`)
| Variable                           | Description                     |
| ---------------------------------- | ------------------------------- |
| `VITE_API_BASE_URL`                | Backend API base URL            |
| `VITE_FIREBASE_API_KEY`            | Firebase web API key            |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Firebase auth domain            |
| `VITE_FIREBASE_PROJECT_ID`         | Firebase project ID             |
| `VITE_FIREBASE_STORAGE_BUCKET`     | Firebase storage bucket         |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase messaging sender ID    |
| `VITE_FIREBASE_APP_ID`             | Firebase app ID                 |
