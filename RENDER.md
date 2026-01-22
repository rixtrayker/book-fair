# Deploy to Render.com (FREE)

## 🎉 Free Tier Features
- ✅ 750 hours/month free
- ✅ Auto-sleep after 15 min inactivity
- ✅ 1GB persistent disk (free)
- ✅ HTTPS included
- ✅ No credit card required

## 🚀 Deploy Steps

### Option 1: One-Click Deploy

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repo: `rixtrayker/book-fair`
4. Click **Apply**
5. Wait for deployment (~5 minutes)

### Option 2: Manual Setup

1. **Create Web Service**:
   - Go to https://dashboard.render.com
   - Click **New +** → **Web Service**
   - Connect GitHub repo: `rixtrayker/book-fair`
   - Settings:
     - **Name**: book-fair
     - **Region**: Frankfurt
     - **Branch**: main
     - **Build Command**: 
       ```bash
       cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build
       ```
     - **Start Command**: 
       ```bash
       cd backend && node dist/main.js
       ```
     - **Plan**: Free

2. **Add Disk** (for persistent database):
   - In service settings → **Disks**
   - Click **Add Disk**
   - **Name**: book-fair-data
   - **Mount Path**: /data
   - **Size**: 1GB
   - Click **Save**

3. **Deploy**:
   - Click **Manual Deploy** → **Deploy latest commit**

4. **Seed Database**:
   - Go to **Shell** tab in dashboard
   - Run:
     ```bash
     cd /opt/render/project/src && node seed-production.js
     ```

## 🌍 Access Your App

After deployment:
- **URL**: https://book-fair.onrender.com
- **Auto-sleep**: Wakes up on first request (~30 seconds)

## 🔧 Environment Variables

No secrets needed! Everything works out of the box.

## 📊 Database

- Stored at `/data/bookfair.db`
- Persists across deployments
- 1GB free storage

## 🔄 Updates

Push to GitHub → Auto-deploys to Render!

```bash
git push origin main
# Render auto-deploys
```

## 💰 Cost

**$0.00** - Completely FREE!

- Free tier: 750 hours/month
- Auto-sleep saves hours
- No credit card required

## 🛠️ Troubleshooting

### App sleeping?
- First request takes ~30 seconds to wake up
- Keep-alive services can prevent sleep (optional)

### Database issues?
- Check disk is mounted at `/data`
- Run seed script from Shell tab

### Build fails?
- Check build logs in dashboard
- Ensure all dependencies in package.json

## 📱 Login

- **User**: amr@bookfair.com / amr123
- **Admin**: mohamed@bookfair.com / mohamed123

---

**Ready to deploy!** 🚀

No credit card, no charges, 100% FREE!
