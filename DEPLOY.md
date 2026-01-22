# Deploy to Fly.io

## 🚀 Quick Deploy

### Prerequisites

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:
```bash
fly auth login
```

### Deploy Steps

1. **Create Fly app** (first time only):
```bash
fly apps create book-fair
```

2. **Create volume for database**:
```bash
fly volumes create book_fair_data --region ams --size 1
```

3. **Deploy**:
```bash
fly deploy
```

4. **Seed database** (first time):
```bash
fly ssh console
cd /app
node dist/seed-excel.js
exit
```

5. **Open app**:
```bash
fly open
```

## 🔧 Configuration

### Environment Variables

Set secrets:
```bash
fly secrets set JWT_SECRET=your-secret-key-here
```

### Scale

```bash
# Scale up
fly scale vm shared-cpu-1x --memory 512

# Scale down (auto-sleep)
fly scale count 1
```

### Logs

```bash
fly logs
```

### SSH Access

```bash
fly ssh console
```

## 📊 Database

Database is stored in persistent volume at `/data/bookfair.db`

### Backup Database

```bash
fly ssh sftp get /data/bookfair.db ./backup.db
```

### Restore Database

```bash
fly ssh sftp shell
put ./backup.db /data/bookfair.db
```

## 🌍 Custom Domain

```bash
fly certs add yourdomain.com
```

## 💰 Pricing

- **Free tier**: 3 shared-cpu-1x VMs with 256MB RAM
- **Auto-sleep**: App sleeps after inactivity (free)
- **Volume**: 1GB free, $0.15/GB/month after

## 🔄 Updates

```bash
# Deploy new version
git push origin main
fly deploy

# Rollback
fly releases
fly releases rollback <version>
```

## 📝 URLs

- **App**: https://book-fair.fly.dev
- **Dashboard**: https://fly.io/apps/book-fair

## 🛠️ Troubleshooting

### App won't start

```bash
fly logs
fly ssh console
```

### Database issues

```bash
fly ssh console
ls -la /data
sqlite3 /data/bookfair.db ".tables"
```

### Reset everything

```bash
fly apps destroy book-fair
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

Run: `fly deploy`
