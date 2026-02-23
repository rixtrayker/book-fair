# Kotobgy — Book Sourcing & Fair Management Platform

A bilingual (Arabic-first) platform connecting book enthusiasts with collectors who source and deliver books.

## Project Structure

```
book-fair/
├── backend/          # NestJS API
├── frontend/         # React SPA
├── SPEC.md           # Project specification
├── PROJECT_PROMPT.md # Backend refactoring plan
├── ARCHITECTURE.md   # System architecture diagrams
└── API-TESTING.md    # API testing guide
```

## Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development
```bash
# Both services
npm run dev

# Or separately
npm run dev:backend   # Port 3001
npm run dev:frontend  # Port 3000
```

### Production Build
```bash
npm run build
```

## Tech Stack

**Backend:**
- NestJS 10.x + TypeScript
- SQLite3 (raw SQL)
- JWT + Passport Authentication
- bcrypt

**Frontend:**
- React 19 + Vite
- Tailwind CSS
- i18next (Arabic/English)
- Axios + React Router

## Roles

| Role | Description |
|------|-------------|
| **Customer** | Browse books, create lists, track orders |
| **Collector** | Source books, manage orders, update status |
| **Super Admin** | Full system access, manage users, feature flags |

## Features

- Book pool with search and deduplication
- Customer wish lists with priority/status
- Collector dashboard and claiming system
- Order tracking and shipping management
- In-app notifications
- Bilingual UI (Arabic primary)

## Documentation

- [SPEC.md](./SPEC.md) - Complete project specification
- [PROJECT_PROMPT.md](./PROJECT_PROMPT.md) - Backend refactoring plan
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture diagrams
- [API-TESTING.md](./API-TESTING.md) - Postman/Newman testing guide

## API Prefix

All routes prefixed with `/api/v1/`

## License

MIT
