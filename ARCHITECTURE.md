# System Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (React + Vite)                            │
│                   Port: 3000                                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Login/    │  │     User     │  │  Collector   │     │
│  │   Register   │  │  Dashboard   │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              i18n (Arabic primary, English)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ (Axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                    (NestJS + TypeScript)                     │
│                   Port: 3001                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  JWT Auth Guard                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │   Auth   │ │  Users   │ │Publishers│ │  Books   │     │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Lists   │ │  Orders  │ │Notificat-│ │   i18n   │     │
│  │  Module  │ │  Module  │ │ions Mod. │ │  Module  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│                     (PostgreSQL)                             │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  users  │ │publishers│ │  books  │ │  lists  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │list_books│ │tracking │ │ orders  │ │order_   │          │
│  │         │ │         │ │         │ │books    │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  ┌─────────┐ ┌─────────┐                                    │
│  │notifica-│ │ managed_│                                    │
│  │tions    │ │customers│                                    │
│  └─────────┘ └─────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

## 📊 User Workflow

```
┌─────────────┐
│   Register  │
│   / Login   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         User Dashboard                   │
└─────────────────────────────────────────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Create Lists │    │Browse Books │    │View Orders  │    │Manage Lists │
└──────┬──────┘    └──────┬──────┘    └─────────────┘    └──────┬──────┘
       │                  │                                       │
       ▼                  ▼                                       ▼
┌─────────────┐    ┌─────────────┐                        ┌─────────────┐
│Set Name &   │    │Add Books to │                        │Merge Lists  │
│Description  │    │Selected List│                        │Update Status│
└──────┬──────┘    └──────┬──────┘                        └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│Make Public  │    │Set Priority │
│(for admin)  │    │& Status     │
└─────────────┘    └─────────────┘
```

## 🔧 Collector Workflow

```
┌─────────────┐
│Collector    │
│Login        │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│        Collector Dashboard               │
└─────────────────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Collector    │ │Manage Orders│ │Manage       │ │Manage Books │ │View All     │
│View         │ │             │ │Publishers   │ │             │ │Users        │
│(Public Lists│ └──────┬──────┘ └─────────────┘ └─────────────┘ └─────────────┘
└──────┬──────┘        │
       │              │
       ▼              ▼
┌─────────────┐ ┌─────────────┐
│Filter by:   │ │Update       │
│- Hall       │ │Shipping     │
│- Booth      │ │Status       │
│- Priority   │ └─────────────┘
│- Status     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Update Book  │
│Tracking:    │
│- Search     │
│  Status     │
│- Actual     │
│  Price      │
│- Discount   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Select Books │
│from Multiple│
│Users        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Create Order │
└─────────────┘
```

## 🔄 Data Flow: Creating an Order

```
USER SIDE                    BACKEND                    DATABASE
─────────                    ───────                    ────────

1. Create List
   ├─ Name: "My Books"
   ├─ Public: true
   └─ Description
                    ──────────────────────────────────>
                    POST /api/lists                     INSERT INTO lists
                    <──────────────────────────────────
                    { id: 1, ... }

2. Add Books
   ├─ Book ID: 5
   ├─ Priority: 5
   └─ Status: "want"
                    ──────────────────────────────────>
                    POST /api/lists/1/books             INSERT INTO list_books
                    <──────────────────────────────────
                    { id: 1, ... }

ADMIN SIDE (Collector)

3. View Public Lists
                    ──────────────────────────────────>
                    GET /api/orders/collector-view     SELECT * FROM list_books
                    <──────────────────────────────────  JOIN lists, books, publishers
                    [{ user, books, ... }]

4. Update Tracking
   ├─ Search: "found"
   ├─ Actual Price: 140
   └─ Discount: 10
                    ──────────────────────────────────>
                    POST /api/orders/tracking           INSERT/UPDATE admin_book_tracking
                    <──────────────────────────────────
                    { updated }

5. Create Order
   ├─ User ID: 2
   └─ Book IDs: [1,2,3]
                    ──────────────────────────────────>
                    POST /api/orders                    BEGIN TRANSACTION
                                                        INSERT INTO orders
                                                        INSERT INTO order_books (x3)
                                                        UPDATE total_price
                    <──────────────────────────────────  COMMIT
                    { order_id: 1, ... }

6. Update Shipping
   └─ Status: "shipped"
                    ──────────────────────────────────>
                    PUT /api/orders/1                   UPDATE orders
                    <──────────────────────────────────  SET shipping_status
                    { updated }

USER SIDE

7. View Order Status
                    ──────────────────────────────────>
                    GET /api/orders/my-orders           SELECT * FROM orders
                    <──────────────────────────────────  WHERE user_id = ?
                    [{ status: "shipped", ... }]
```

## 🔐 Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────────┐
│         Auth Controller          │
└──────┬──────────────────────────┘
       │
       │ 2. Validate credentials
       ▼
┌─────────────────────────────────┐
│         Auth Service             │
│  - Check email exists            │
│  - Compare password (bcrypt)     │
│  - Generate JWT token            │
└──────┬──────────────────────────┘
       │
       │ 3. Return token + user data
       ▼
┌─────────────┐
│   Client    │
│  Store:     │
│  - token    │
│  - user     │
└──────┬──────┘
       │
       │ 4. Subsequent requests
       │    Authorization: Bearer <token>
       ▼
┌─────────────────────────────────┐
│         Auth Guard               │
│  - Extract token                 │
│  - Verify JWT                    │
│  - Attach user to request        │
└──────┬──────────────────────────┘
       │
       │ 5. Access granted
       ▼
┌─────────────────────────────────┐
│         Controller               │
│  @UseGuards(AuthGuard)           │
│  Access req.user                 │
└─────────────────────────────────┘
```

## 🌍 Internationalization Flow

```
┌─────────────┐
│   User      │
│  Clicks     │
│  Language   │
│  Toggle     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│    i18n.changeLanguage()         │
│    - Switch to 'ar' or 'en'      │
└──────┬──────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Update Text  │    │Update       │    │Update       │
│Content      │    │Direction    │    │Number       │
│             │    │(LTR/RTL)    │    │Format       │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Re-render │
                   │   All       │
                   │   Components│
                   └─────────────┘
```

## 📦 Module Dependencies

```
                      ┌─────────────┐
                      │ App Module  │
                      └──────┬──────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Auth Module │    │Users Module │    │Publishers   │
│ + JwtModule │    │ + JwtModule │    │Module       │
└─────────────┘    └─────────────┘    │ + JwtModule │
         │                             └─────────────┘
         │ provides
         ▼
┌─────────────┐
│ JWT Strategy│
│ Auth Guards │
└─────────────┘
         │
         │ used by (all import JwtModule)
         ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Books Module │    │Lists Module │    │Orders Module│    │Notifications│
│ + JwtModule │    │ + JwtModule │    │ + JwtModule │    │   Module    │
└─────────────┘    └─────────────┘    └─────────────┘    │ + JwtModule │
                                                           └─────────────┘
```

> **Note:** All modules using AuthGuard must import JwtModule to resolve the JwtService dependency.

---

These diagrams illustrate the complete system architecture, data flow, and component interactions.
