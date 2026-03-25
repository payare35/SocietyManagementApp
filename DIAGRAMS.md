# Society Management App — Architecture, DFD & Sequence Diagrams

---

## 1. System Architecture Diagram

Shows the three-tier layout: Browser (React + Firebase Client SDK), Express backend (middleware → routes → services), and Firebase/GCP (Auth, Firestore, Storage).

```mermaid
flowchart TB
    subgraph browser [Browser]
        ReactApp["React 18 + Vite\n(port 5173)"]
        FirebaseSDK["Firebase Client SDK\n(Auth only)"]
    end

    subgraph server [Node.js / Express Server - port 5001]
        AuthMW["authMiddleware\n(verifyIdToken)"]
        AdminMW["adminMiddleware\n(role check)"]

        subgraph routes [Routes]
            authR["/api/auth"]
            membersR["/api/members"]
            expensesR["/api/expenses"]
            txR["/api/transactions"]
            duesR["/api/dues"]
            uploadR["/api/upload"]
            configR["/api/config"]
            dashR["/api/dashboard/stats"]
        end

        subgraph services [Services]
            memberSvc["memberService"]
            expenseSvc["expenseService"]
            txSvc["transactionService"]
            duesSvc["duesService"]
            uploadSvc["uploadService"]
            configSvc["configService"]
            dashSvc["dashboardService"]
            authSvc["authService"]
        end
    end

    subgraph firebase [Firebase - GCP]
        FirebaseAuth["Firebase Auth\n(custom claims)"]
        Firestore["Firestore\n5 collections"]
        Storage["Firebase Storage\n(optional)"]
    end

    ReactApp -->|"Bearer token on every request"| AuthMW
    ReactApp -->|"signInWithEmailAndPassword"| FirebaseSDK
    FirebaseSDK -->|"ID token"| FirebaseAuth

    AuthMW --> AdminMW
    AuthMW --> routes
    routes --> services
    memberSvc -->|"createUser / setCustomClaims"| FirebaseAuth
    services -->|"read / write"| Firestore
    uploadSvc -->|"save file"| Storage
```

---

## 2. Data Flow Diagram (DFD) — Level 1

Shows all six process groups, the two external entities (Admin and Member), and the five Firestore data stores, with labelled data flows between them.

```mermaid
flowchart LR
    Admin(["Admin"])
    Member(["Member"])

    subgraph p1 [P1 - Authentication]
        login["Login & Token Verification"]
    end

    subgraph p2 [P2 - Member Management]
        memberCRUD["Create / Edit / Deactivate Members"]
    end

    subgraph p3 [P3 - Expense Management]
        expCRUD["Create / List / Delete Expenses"]
    end

    subgraph p4 [P4 - Transaction Processing]
        adminTx["Admin Records Payment"]
        selfTx["Member Self-Submits Receipt"]
        approveTx["Admin Confirms / Rejects"]
    end

    subgraph p5 [P5 - Dues Management]
        genDues["Generate Monthly Dues"]
        viewDues["View Dues"]
        payDues["Pay via UPI Deep-link"]
    end

    subgraph p6 [P6 - Dashboard Aggregation]
        stats["Aggregate Stats + Chart Data"]
    end

    subgraph ds [Firestore Data Stores]
        DS1[("members")]
        DS2[("expenses")]
        DS3[("transactions")]
        DS4[("maintenanceDues")]
        DS5[("societyConfig")]
    end

    Admin --> login
    Member --> login
    login -->|"profile + role"| DS1

    Admin --> memberCRUD
    memberCRUD -->|"write"| DS1

    Admin --> expCRUD
    expCRUD -->|"write / read"| DS2
    Member -->|"read"| expCRUD

    Admin --> adminTx
    adminTx -->|"write confirmed"| DS3

    Member --> selfTx
    selfTx -->|"write pending"| DS3

    Admin --> approveTx
    approveTx -->|"update status"| DS3

    Admin --> genDues
    genDues -->|"read"| DS1
    genDues -->|"read"| DS5
    genDues -->|"write"| DS4

    Member --> viewDues
    viewDues -->|"read own"| DS4

    Member --> payDues
    payDues -->|"read upiId"| DS5
    payDues -->|"write pending tx"| DS3

    stats -->|"read"| DS1
    stats -->|"read"| DS2
    stats -->|"read"| DS3
    stats -->|"read"| DS4
    Admin --> stats
```

---

## 3. Sequence Diagrams

### 3a. Login Flow

Covers Firebase sign-in, ID token acquisition, custom claim propagation, and role-based redirect to admin vs member dashboard.

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant FirebaseAuth
    participant AuthContext
    participant ExpressAPI
    participant Firestore

    User->>LoginPage: enter email + password
    LoginPage->>FirebaseAuth: signInWithEmailAndPassword()
    FirebaseAuth-->>LoginPage: UserCredential
    LoginPage->>FirebaseAuth: getIdToken(forceRefresh=true)
    FirebaseAuth-->>LoginPage: JWT with role custom claim
    LoginPage->>AuthContext: login(email, password)
    AuthContext->>ExpressAPI: GET /api/auth/me (Bearer token)
    ExpressAPI->>FirebaseAuth: verifyIdToken(token)
    FirebaseAuth-->>ExpressAPI: decoded uid + role
    ExpressAPI->>Firestore: members/{uid}.get()
    Firestore-->>ExpressAPI: member profile doc
    ExpressAPI-->>AuthContext: profile JSON
    AuthContext-->>LoginPage: profile.role
    alt role == admin
        LoginPage->>User: redirect /admin/dashboard
    else role == member
        LoginPage->>User: redirect /dashboard
    end
```

---

### 3b. Admin Records a Payment

Covers optional receipt upload to Firebase Storage, transaction creation with denormalized member data, and query cache invalidation.

```mermaid
sequenceDiagram
    actor Admin
    participant TransactionsPage
    participant ExpressAPI
    participant Firestore

    Admin->>TransactionsPage: click Record Payment, fill form
    opt Receipt file selected
        TransactionsPage->>ExpressAPI: POST /api/upload?folder=transactions (multipart)
        ExpressAPI-->>TransactionsPage: fileUrl + fileName
    end
    TransactionsPage->>ExpressAPI: POST /api/transactions memberId + amount + type + month + fileUrl
    ExpressAPI->>Firestore: members/{memberId}.get()
    Firestore-->>ExpressAPI: memberName + flatNumber
    ExpressAPI->>Firestore: transactions.add() status=confirmed recordedBy=adminUID
    Firestore-->>ExpressAPI: docRef
    ExpressAPI-->>TransactionsPage: 201 transaction object
    TransactionsPage->>TransactionsPage: invalidate query cache, show success toast
```

---

### 3c. Member Pays Maintenance (UPI Flow)

Covers due and config fetching, client-side UPI deep-link construction, external payment app redirect, receipt upload, and self-submitted pending transaction.

```mermaid
sequenceDiagram
    actor Member
    participant PayPage
    participant ExpressAPI
    participant Firestore
    participant UPIApp

    Member->>PayPage: navigate to /pay
    PayPage->>ExpressAPI: GET /api/dues/my
    ExpressAPI->>Firestore: maintenanceDues where memberId == uid
    Firestore-->>ExpressAPI: pending due docs
    ExpressAPI-->>PayPage: pending due with month + amount
    PayPage->>ExpressAPI: GET /api/config
    ExpressAPI->>Firestore: societyConfig/config.get()
    Firestore-->>ExpressAPI: upiId + societyName
    ExpressAPI-->>PayPage: config
    PayPage->>PayPage: build gpay://upi/pay?pa=upiId&am=amount&tn=Maintenance-month
    Member->>UPIApp: tap Pay with GPay / PhonePe / Paytm
    UPIApp-->>Member: payment completed
    Member->>PayPage: returns and uploads screenshot
    PayPage->>ExpressAPI: POST /api/upload?folder=receipts
    ExpressAPI-->>PayPage: fileUrl + fileName
    PayPage->>ExpressAPI: POST /api/transactions/self amount + month + fileUrl + recordedBy=self + status=pending
    ExpressAPI->>Firestore: transactions.add()
    Firestore-->>ExpressAPI: docRef
    ExpressAPI-->>PayPage: 201 pending transaction
    PayPage->>Member: Submitted for verification
```

---

### 3d. Admin Generates Monthly Dues and Marks a Due as Paid

Covers idempotent batch generation (skipping existing dues), and the admin "Mark Paid" flow that creates a confirmed transaction.

```mermaid
sequenceDiagram
    actor Admin
    participant DuesPage
    participant ExpressAPI
    participant Firestore

    Admin->>DuesPage: click Generate Dues, pick month
    DuesPage->>ExpressAPI: POST /api/dues/generate month=2026-03
    ExpressAPI->>Firestore: societyConfig/config.get()
    Firestore-->>ExpressAPI: monthlyMaintenanceAmount
    ExpressAPI->>Firestore: members.where(isActive==true, role==member).get()
    Firestore-->>ExpressAPI: active member list
    ExpressAPI->>Firestore: maintenanceDues.where(month==2026-03).get()
    Firestore-->>ExpressAPI: already-existing dues for that month
    ExpressAPI->>Firestore: batch.set() for each member without an existing due
    Firestore-->>ExpressAPI: batch committed
    ExpressAPI-->>DuesPage: generated N skipped M
    DuesPage->>DuesPage: show success toast, refresh table

    Admin->>DuesPage: click Mark Paid on a row
    DuesPage->>ExpressAPI: POST /api/transactions memberId + amount + type=maintenance + month
    ExpressAPI->>Firestore: transactions.add() status=confirmed
    Firestore-->>ExpressAPI: docRef
    ExpressAPI-->>DuesPage: 201 transaction
    DuesPage->>DuesPage: show success toast
```
