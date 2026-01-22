# ✅ Fly.io Deployment Ready!

## 📦 What Was Added

### Configuration Files:
1. **fly.toml** - Fly.io app configuration
2. **Dockerfile** - Multi-stage build (backend + frontend)
3. **.dockerignore** - Exclude unnecessary files
4. **deploy.sh** - Automated deployment script
5. **seed-production.js** - Production database seeding
6. **DEPLOY.md** - Complete deployment documentation

### Code Changes:
1. **backend/src/main.ts** - Serve static frontend, use PORT env
2. **backend/src/database.ts** - Use `/data` volume in production
3. **backend/package.json** - Added express dependency
4. **frontend/vite.config.js** - Added build configuration

## 🚀 Deploy Now

### Option 1: Automated Script
```bash
./deploy.sh
```

### Option 2: Manual Steps
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create book-fair

# Create volume for database
fly volumes create book_fair_data --region ams --size 1

# Deploy
fly deploy

# Seed database
fly ssh console
cd /app && node seed-production.js
exit

# Open app
fly open
```

## 🌍 After Deployment

Your app will be available at:
- **URL**: https://book-fair.fly.dev
- **API**: https://book-fair.fly.dev/api
- **Frontend**: https://book-fair.fly.dev

### Login Credentials:
- **User**: amr@bookfair.com / amr123
- **Admin**: mohamed@bookfair.com / mohamed123

## 📊 Features

✅ Single container deployment (backend + frontend)
✅ Persistent SQLite database on volume
✅ Auto-sleep when inactive (free tier)
✅ HTTPS enabled by default
✅ Arabic/English support
✅ 82 books pre-loaded
✅ Production-ready configuration

## 💰 Cost

**FREE** on Fly.io free tier:
- 3 shared-cpu-1x VMs (256MB RAM)
- 3GB persistent volume storage
- Auto-sleep after inactivity

## 🔧 Management

```bash
# View logs
fly logs

# SSH into container
fly ssh console

# Scale up
fly scale vm shared-cpu-1x --memory 512

# Restart
fly apps restart book-fair

# Status
fly status
```

## 📝 Environment

The app automatically detects production:
- `NODE_ENV=production`
- Database at `/data/bookfair.db`
- Port from `PORT` env variable
- Frontend served from `/app/public`

## 🎯 Next Steps

1. Run `./deploy.sh` to deploy
2. Seed database with `fly ssh console` → `node seed-production.js`
3. Open app with `fly open`
4. Share URL: https://book-fair.fly.dev

---

**Ready to deploy!** 🚀

All files committed and pushed to GitHub.
