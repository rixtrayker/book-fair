# Kotobgy — Book Sourcing & Fair Management Platform

A bilingual (Arabic-first) platform connecting book enthusiasts with collectors who source and deliver books.

## Project Structure

```
book-fair/
├── backend/              # NestJS API
├── frontend/             # React + TypeScript SPA
├── proxy/                # nginx reverse proxy config
├── docker-compose.yml    # Docker orchestration
├── .env.docker           # Environment template
├── SPEC.md               # Project specification
├── STATUS.md             # Current status & next steps
├── BUSINESS.md           # Business requirements
├── PROJECT_PROMPT.md     # Backend refactoring plan
├── ARCHITECTURE.md       # System architecture diagrams
├── API-TESTING.md        # API testing guide
└── DEV.md                # Development guide
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
- PostgreSQL (raw SQL via pg)
- JWT + Passport Authentication
- bcrypt + rate limiting

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS
- i18next (Arabic primary, English secondary)
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

- [DEV.md](./DEV.md) - Development guide & Docker setup
- [SPEC.md](./SPEC.md) - Complete project specification
- [STATUS.md](./STATUS.md) - Current status & next steps
- [BUSINESS.md](./BUSINESS.md) - Business requirements & personas
- [PROJECT_PROMPT.md](./PROJECT_PROMPT.md) - Backend refactoring plan
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture diagrams
- [API-TESTING.md](./API-TESTING.md) - Postman/Newman testing guide

## API Prefix

All routes prefixed with `/api/v1/`

## License

MIT
