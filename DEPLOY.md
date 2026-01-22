# Deploy to Fly.io

## 🚀 Quick Deploy

### Prerequisites

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:
```bash
flyctl auth login
```

### Deploy Steps

1. **Create Fly app** (first time only):
```bash
flyctl apps create book-fair
```

2. **Create volume for database**:
```bash
flyctl volumes create book_fair_data --region ams --size 1
```

3. **Deploy**:
```bash
flyctl deploy
```

4. **Seed database** (first time):
```bash
flyctl ssh console
cd /app
node seed-production.js
exit
```

5. **Open app**:
```bash
flyctl open
```

## 🔧 Configuration

### Environment Variables

Set secrets:
```bash
flyctl secrets set JWT_SECRET=your-secret-key-here
```

### Scale

```bash
# Scale up
flyctl scale vm shared-cpu-1x --memory 512

# Scale down (auto-sleep)
flyctl scale count 1
```

### Logs

```bash
flyctl logs
```

### SSH Access

```bash
flyctl ssh console
```

## 📊 Database

Database is stored in persistent volume at `/data/bookfair.db`

### Backup Database

```bash
flyctl ssh sftp get /data/bookfair.db ./backup.db
```

### Restore Database

```bash
flyctl ssh sftp shell
put ./backup.db /data/bookfair.db
```

## 🌍 Custom Domain

```bash
flyctl certs add yourdomain.com
```

## 💰 Pricing

- **Free tier**: 3 shared-cpu-1x VMs with 256MB RAM
- **Auto-sleep**: App sleeps after inactivity (free)
- **Volume**: 1GB free, $0.15/GB/month after

## 🔄 Updates

```bash
# Deploy new version
git push origin main
flyctl deploy

# Rollback
flyctl releases
flyctl releases rollback <version>
```

## 📝 URLs

- **App**: https://book-fair.fly.dev
- **Dashboard**: https://fly.io/apps/book-fair

## 🛠️ Troubleshooting

### App won't start

```bash
flyctl logs
flyctl ssh console
```

### Database issues

```bash
flyctl ssh console
ls -la /data
sqlite3 /data/bookfair.db ".tables"
```

### Reset everything

```bash
flyctl apps destroy book-fair
# Then start over
```

## 📱 Access

After deployment:
- **Frontend**: https://book-fair.fly.dev
- **API**: https://book-fair.fly.dev/api
- **Login**: 
  - User: amr@bookfair.com / amr123
  - Admin: mohamed@bookfair.com / mohamed123

---

**Ready to deploy!** 🚀

Run: `flyctl deploy`
