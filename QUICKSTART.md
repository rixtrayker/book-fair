# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
./setup.sh
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Admin account: `admin@bookfair.com` / `admin123`
- User account: `user@bookfair.com` / `user123`
- Sample publishers and books

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📱 Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎯 Quick Demo Flow

### As User:
1. Login with `user@bookfair.com` / `user123`
2. Create a new list (e.g., "My Reading List")
3. Go to Books tab
4. Add books to your list
5. Set priorities (1-5) and status (want/maybe/thinking)
6. Make the list public (toggle in list settings)

### As Admin:
1. Login with `admin@bookfair.com` / `admin123`
2. Go to Admin View
3. See all public user lists
4. Filter by hall/booth to optimize collection
5. Update search status as you find books
6. Enter actual prices and discounts
7. Select books and create an order
8. Update shipping status

## 🌍 Language Toggle

Click the language button in the header to switch between English and Arabic.

## 🔧 Troubleshooting

**Port already in use:**
- Backend: Change port in `backend/src/main.ts` (line 11)
- Frontend: Change port in `frontend/vite.config.js` (line 6)

**Database issues:**
- Delete `backend/bookfair.db` and restart backend to recreate

**Module not found:**
- Run `npm install` in both backend and frontend directories

## 📚 Key Features to Try

1. **Multiple Lists**: Users can create separate lists for different purposes
2. **Priority System**: 5-level priority with color badges
3. **Status Tracking**: 4 user statuses + 3 admin search statuses
4. **Smart Filtering**: Admins can filter by location to optimize routes
5. **Bulk Orders**: Admins can select books from multiple users
6. **Price Tracking**: Track original vs actual prices with discounts
7. **Bilingual**: Full Arabic and English support with RTL layout

## 🎨 Priority Colors

- 🔴 Priority 5 (Highest)
- 🟠 Priority 4
- 🟡 Priority 3
- 🟠 Priority 2
- 🟢 Priority 1 (Lowest)

## 📊 Status Flow

**User Side:**
- Want → Maybe → Thinking → Cancel

**Admin Side:**
- Searching → Found → Purchased

**Order Side:**
- Pending → Shipped → Delivered

Enjoy using the Book Fair Management System! 📚✨
