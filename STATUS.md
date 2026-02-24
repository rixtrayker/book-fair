# Kotobgy - Project Status & Next Steps

> Last Updated: 2026-02-24

---

## Executive Summary

**Kotobgy** is a bilingual (Arabic-first) book sourcing and fair management platform. The backend refactoring is **complete**, implementing all planned features from PROJECT_PROMPT.md Phases 1-10. The frontend TypeScript migration is **complete**. Remaining work involves implementing missing UI features from SPEC.md.

---

## Backend Status: COMPLETE

### Session Fixes Applied

| Fix | Description |
|-----|-------------|
| JwtModule imports | Added to all modules using AuthGuard |
| FTS Migration | Fixed subquery issue, now uses simple tsvector |
| Database | Created kotobgy database, ran all migrations |

### Implemented Features

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Security Fixes (IDOR, JWT, Rate Limiting) | DONE |
| 2 | Order Status Flow | DONE |
| 3 | Collector Assignment System | DONE |
| 4 | Merge Lists Fix | DONE |
| 5 | Soft Delete & Notifications | DONE |
| 6 | Arabic i18n (Primary Language) | DONE |
| 7 | Database Migrations (PostgreSQL) | DONE |
| 8 | Pagination | DONE |
| 9 | Code Structure Refactoring | DONE |
| 10 | Polish (Logging, Swagger) | DONE |

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL | User requirement (NOT SQLite) |
| ORM | None (Raw SQL) | Intentional design decision |
| Auth | JWT + Guards | Role-based access control |
| i18n | nestjs-i18n | Arabic primary, English secondary |
| API Docs | Swagger | Available at `/api/docs` |

---

## API Endpoints Coverage: COMPLETE

All **47 backend endpoints** are now covered in the frontend API client.

### Summary by Module

| Module | Endpoints | Frontend Coverage |
|--------|-----------|-------------------|
| Auth | 3 | `auth.register()`, `auth.registerCollector()`, `auth.login()` |
| Users | 2 | `users.getProfile()`, `users.getAll()` |
| Books | 6 | `books.create()`, `books.getAll()`, `books.getOne()`, `books.update()`, `books.delete()`, `books.restore()` |
| Publishers | 5 | Full coverage |
| Lists | 17 | Full coverage (including claim, assign, invite, share) |
| Orders | 9 | Full coverage (including tracking, admin-view, assign) |
| Notifications | 4 | Full coverage |

See [frontend/src/api/ENDPOINTS.md](./frontend/src/api/ENDPOINTS.md) for complete documentation.

---

## Frontend Status: TYPESCRIPT MIGRATION COMPLETE

### Completed This Session

| Task | Status |
|------|--------|
| Convert JSX to TSX (7 files) | DONE |
| i18n default to Arabic | DONE |
| index.html lang/dir RTL | DONE |
| TypeScript strict mode | DONE |
| Build passes | DONE |
| Tailwind CSS installed | DONE |

### Previous Fixes (Already Applied)

| Issue | Status |
|-------|--------|
| Role check uses old 'admin' | Fixed - now uses 'super_admin' |
| API proxy wrong port | Fixed in vite.config.ts (3001) |
| No pagination support | Added in api/index.ts |
| No notifications API | Added in api/index.ts |
| No TypeScript | Added tsconfig.json |

### Package Recommendations (IMPLEMENTED)

| Package | Purpose | Status |
|---------|---------|--------|
| Tailwind CSS | Styling, RTL support | Added to package.json |
| @tanstack/react-query | Data fetching, caching | Added |
| zustand | State management | Added |
| react-hook-form + zod | Forms, validation | Added |
| react-hot-toast | Notifications UI | Added |
| @dnd-kit/core | Drag & drop reorder | Added |
| date-fns | Date formatting | Added |

### Install Commands

```bash
cd frontend
npm install
```

---

## File Structure (Updated)

```
frontend/
├── src/
│   ├── api/
│   │   ├── index.ts          # Complete API client with types
│   │   └── ENDPOINTS.md      # API documentation
│   ├── components/
│   │   └── Header.tsx        # Converted to TypeScript
│   ├── pages/
│   │   ├── Login.tsx         # Converted to TypeScript
│   │   ├── Register.tsx      # Converted to TypeScript
│   │   ├── UserDashboard.tsx # Converted to TypeScript
│   │   └── AdminDashboard.tsx # Converted to TypeScript
│   ├── hooks/
│   ├── stores/               # Zustand stores
│   ├── i18n.ts               # Defaults to Arabic (ar)
│   ├── App.tsx               # Converted to TypeScript
│   ├── main.tsx              # Converted to TypeScript
│   └── utils/
├── tsconfig.json             # TypeScript config
├── tsconfig.node.json
├── tailwind.config.js        # Tailwind with RTL
├── postcss.config.js
├── vite.config.ts            # Fixed proxy port
├── index.html                # lang="ar" dir="rtl"
└── package.json              # Updated dependencies
```

---

## Missing Features (from SPEC.md)

### HIGH Priority
| Feature | Description | Status |
|---------|-------------|--------|
| Book Pool Search | Search before create, deduplication | API ready, UI needed |
| List Sharing UI | Public links + collector invitations | API ready, UI needed |
| Collector Claiming | Claim books from lists | API ready, UI needed |

### MEDIUM Priority
| Feature | Description | Status |
|---------|-------------|--------|
| Notifications Panel | Bell icon, notification list | API ready, UI needed |
| Shipping/Tracking | Status, notes, sticker upload | API ready, UI needed |
| Managed Customers | Collector-created profiles | Backend partial, UI needed |

### LOW Priority
| Feature | Description | Status |
|---------|-------------|--------|
| Collector Offers | Proactive book offers | Backend partial, UI needed |
| LLM Import | Book list formatting via AI | Not implemented |

---

## Role-Based Access (Frontend)

```typescript
// Role checks for UI
const isCustomer = user.role === 'customer';
const isCollector = user.role === 'collector' || user.role === 'super_admin';
const isSuperAdmin = user.role === 'super_admin';

// Hide/show features
{isCollector && <CollectorDashboard />}
{isSuperAdmin && <AdminPanel />}
```

### Route Protection

| Route | Customer | Collector | Super Admin |
|-------|----------|-----------|-------------|
| `/` (UserDashboard) | ✅ | ❌ | ❌ |
| `/collector` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |
| `/lists/public` | ❌ | ✅ | ✅ |

---

## Next Steps (Priority Order)

### Phase 1: Setup & Quick Fixes
- [x] Create TypeScript configuration
- [x] Add Tailwind CSS configuration
- [x] Update package.json with recommended packages
- [x] Fix vite.config.ts proxy port
- [x] Create complete API client with types
- [x] Update i18n to default to Arabic
- [x] Convert existing .jsx to .tsx
- [x] Add Tailwind directives to CSS
- [x] Fix backend module dependencies (JwtModule)

### Phase 2: Core UI Updates
- [ ] Create CollectorDashboard (rename AdminDashboard)
- [ ] Add role-based routing
- [ ] Implement react-hot-toast for errors
- [ ] Add React Query for data fetching
- [ ] Create Zustand auth store

### Phase 3: Notifications UI
- [ ] Create Notifications component
- [ ] Add bell icon to Header
- [ ] Implement polling with React Query
- [ ] Add mark as read functionality

### Phase 4: List Sharing
- [ ] Add share button to lists
- [ ] Generate public link UI
- [ ] Invite collector by email/ID
- [ ] Accept/decline invitations UI

### Phase 5: Collector Features
- [ ] Add book claiming UI
- [ ] Add managed customers section
- [ ] Add offers section

### Phase 6: Shipping & Fulfillment
- [ ] Add shipping status updates
- [ ] Add tracking number input
- [ ] Add sticker upload
- [ ] Delivery confirmation

---

## Running the Project

### Backend
```bash
cd backend
npm install
npm run start:dev
# API at http://localhost:3001
# Swagger at http://localhost:3001/api/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

### Database
```bash
createdb kotobgy
# Update backend/.env with PostgreSQL credentials
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=kotobgy

JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d

DEFAULT_LANGUAGE=ar
EMAIL_ENABLED=false
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Documentation References

- [SPEC.md](./SPEC.md) - Full project specification
- [PROJECT_PROMPT.md](./PROJECT_PROMPT.md) - Backend refactoring plan
- [API-TESTING.md](./API-TESTING.md) - API testing guide
- [frontend/src/api/ENDPOINTS.md](./frontend/src/api/ENDPOINTS.md) - Complete API reference
