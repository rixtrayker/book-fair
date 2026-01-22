# Book Fair Management System

A monorepo containing a complete book fair management system with NestJS backend and React frontend.

## 📁 Project Structure

```
book-fair/
├── backend/          # NestJS API
├── frontend/         # React SPA
├── package.json      # Monorepo root
└── README.md
```

## 🚀 Quick Start

### Install All Dependencies
```bash
npm run install:all
```

### Development (Both Services)
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### Production Build
```bash
npm run build
```

### Seed Database
```bash
npm run seed:excel
```

## 📚 Documentation

- [Complete Documentation](./README-v2.md)
- [Quick Start Guide](./QUICKSTART.md)
- [API Testing](./API-TESTING.md)
- [Architecture](./ARCHITECTURE.md)
- [Deployment - Render.com (FREE)](./RENDER.md)
- [Deployment - Fly.io](./DEPLOY.md)
- [Excel Import](./EXCEL-IMPORT.md)

## 🎯 Features

- **Backend**: NestJS + SQLite + JWT Auth
- **Frontend**: React + Vite + i18n (Arabic/English)
- **Users**: Create lists, manage books, track orders
- **Admins**: Track books, set prices, create orders
- **Bilingual**: Full Arabic/English support

## 🌍 Deployment

### Render.com (FREE - Recommended)
```bash
# Push to GitHub, then deploy via Render dashboard
git push origin main
```
See [RENDER.md](./RENDER.md) for details.

### Fly.io
```bash
flyctl deploy
```
See [DEPLOY.md](./DEPLOY.md) for details.

## 📝 Login Credentials

After seeding:
- **User**: amr@bookfair.com / amr123
- **Admin**: mohamed@bookfair.com / mohamed123

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build both for production |
| `npm run seed:excel` | Seed database from Excel |
| `npm run test:api` | Run API tests with Newman |

## 📊 Tech Stack

**Backend:**
- NestJS
- TypeScript
- SQLite3
- JWT Authentication
- Passport

**Frontend:**
- React 18
- Vite
- i18next (i18n)
- Axios
- React Router

## 📄 License

MIT

---

**GitHub**: https://github.com/rixtrayker/book-fair
