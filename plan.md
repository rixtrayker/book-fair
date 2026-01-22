# 📚 Book Fair Shopping List - Project Plan

> A mobile-first, bilingual (EN/AR) book fair management app with advanced search, budget tracking, and publisher location management.

---

## 🎯 Project Overview

**Purpose:** Help book fair visitors track books, manage budgets across payment methods, locate publishers by hall/column, and organize purchases with tags, topics, and priorities.

**Tech Stack:**
- **Frontend:** HTML + Tailwind CSS + Alpine.js (lightweight, no build step)
- **Backend:** SQLite via sql.js (runs entirely in browser)
- **Storage:** IndexedDB for persistence + Export/Import
- **PWA:** Service Worker for offline capability
- **i18n:** Custom lightweight solution for EN/AR with RTL support

---

## 📊 Database Schema

### Tables Overview

```sql
-- Publishers with location info
CREATE TABLE publishers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT,
    hall TEXT,              -- e.g., "H1", "H2"
    column TEXT,            -- e.g., "C70", "A15"
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topics (auto-extracted, colored)
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    color TEXT NOT NULL,    -- Tailwind color class e.g., "bg-blue-500"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags (auto-extracted, colored)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    color TEXT NOT NULL,    -- Tailwind color class
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main books table
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    title_ar TEXT,
    author TEXT,
    author_ar TEXT,
    publisher_id INTEGER REFERENCES publishers(id),
    price REAL,                     -- NULL if no price
    has_discount BOOLEAN DEFAULT 0,
    discount_ratio INTEGER,         -- e.g., 20 for 20%
    original_price REAL,            -- calculated or entered
    topic_id INTEGER REFERENCES topics(id),
    can_read_pdf BOOLEAN DEFAULT 0,
    priority INTEGER DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),  -- 1=highest
    status TEXT DEFAULT 'wishlist' CHECK(status IN ('wishlist', 'to-buy', 'purchased', 'skipped')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Book-Tags junction table (many-to-many)
CREATE TABLE book_tags (
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
);

-- Wallets for budget tracking
CREATE TABLE wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,             -- 'Cash', 'Credit Card', 'Instapay'
    name_ar TEXT,
    balance REAL DEFAULT 0,
    icon TEXT,                      -- emoji or icon class
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions (purchases)
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER REFERENCES books(id),
    wallet_id INTEGER REFERENCES wallets(id),
    amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Pre-seeded Data

**Default Topics:**
- history, reading, writing, cultural, religious, sport, technical, philosophy, fiction, biography, self-help, politics, science, children, art

**Default Tags:**
- local, foreign, foreign-in-egypt, need-now, pricey, hot-offer, easy, medium, hard, classic, modern, bestseller, rare

**Default Wallets:**
- Cash (💵)
- Credit Card (💳)
- Instapay (📱)

---

## 🎨 UI/UX Design Principles

### Visual Design
- **Dark Mode:** Toggle with system preference detection, persisted choice
- **Colors:** Vibrant badges for tags/topics, clean background
- **Mobile-First:** Large touch targets, swipe actions, bottom navigation
- **RTL Support:** Proper Arabic layout with Tailwind RTL utilities

### Color Palette for Auto-Generation
```javascript
const badgeColors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500'
];
```

---

## 🚀 Development Stages

---

## Stage 1: Foundation & Core Structure
**Duration:** ~2-3 hours
**Goal:** Basic app shell with database and navigation

### Module 1.1: Project Setup
**Requirements:**
- [ ] Create HTML structure with Tailwind CDN
- [ ] Setup Alpine.js for reactivity
- [ ] Implement dark mode toggle (localStorage + system preference)
- [ ] Create responsive bottom navigation (mobile) / sidebar (desktop)
- [ ] Setup RTL/LTR toggle with language switcher

**Files:**
```
/index.html          - Main app shell
/js/app.js           - Alpine.js main store
/js/i18n.js          - Translation system
/js/translations.js  - EN/AR strings
/css/custom.css      - Minimal custom styles
```

### Module 1.2: Database Layer
**Requirements:**
- [ ] Initialize sql.js (WebAssembly SQLite)
- [ ] Create all tables on first run
- [ ] Implement auto-save to IndexedDB
- [ ] Load database from IndexedDB on startup
- [ ] Create DB utility functions (query, insert, update, delete)
- [ ] Seed default topics, tags, and wallets

**Files:**
```
/js/db.js            - Database initialization & utilities
/js/schema.js        - Table definitions & seeds
```

### Module 1.3: Navigation & Layout
**Requirements:**
- [ ] Bottom nav: Books, Publishers, Budget, Search, Settings
- [ ] Header with app title, language toggle, dark mode toggle
- [ ] Page container with smooth transitions
- [ ] Loading states and empty states

**Deliverable:** App loads, shows empty states, dark mode works, language switches

---

## Stage 2: Publishers Management
**Duration:** ~1-2 hours
**Goal:** Full CRUD for publishers with location

### Module 2.1: Publishers List View
**Requirements:**
- [ ] List all publishers with hall/column badges
- [ ] Sort by: name, hall, recently added
- [ ] Search/filter publishers
- [ ] Empty state with "Add First Publisher" CTA
- [ ] Swipe to edit/delete (mobile)

### Module 2.2: Publisher Form (Add/Edit)
**Requirements:**
- [ ] Slide-up modal form
- [ ] Fields: Name (EN), Name (AR), Hall, Column, Notes
- [ ] Hall suggestions (H1-H10 common)
- [ ] Validation: Name required
- [ ] Success toast notification

### Module 2.3: Publisher Detail View
**Requirements:**
- [ ] Show all books from this publisher
- [ ] Location prominently displayed
- [ ] Quick stats: total books, total value, purchased count

**Deliverable:** Can add, edit, delete publishers; see their locations

---

## Stage 3: Books Management (Core)
**Duration:** ~3-4 hours
**Goal:** Full CRUD for books with all fields

### Module 3.1: Books List View
**Requirements:**
- [ ] Card-based list showing:
  - Title (bilingual)
  - Author
  - Publisher name + location badge (H1-C70)
  - Price (with discount indicator)
  - Priority stars (1-5)
  - Status badge (color-coded)
  - Topic badge
  - Tag badges (scrollable)
  - PDF indicator icon
- [ ] Group by: status, publisher, topic, priority
- [ ] Sort by: priority, price, recently added, title
- [ ] Quick status change (tap status badge cycles through)
- [ ] Swipe actions: edit, delete, mark purchased

### Module 3.2: Book Form (Add/Edit)
**Requirements:**
- [ ] Full-screen or large modal form
- [ ] Fields:
  - Title (EN) - required
  - Title (AR)
  - Author (EN)
  - Author (AR)
  - Publisher - dropdown with search + "Add New" option
  - Price - optional number input
  - Has Discount - toggle
  - Discount Ratio - shown if has discount (%)
  - Topic - dropdown with search + "Add New" option
  - Tags - multi-select chips with "Add New" option
  - Can Read PDF - toggle
  - Priority - 1-5 star selector
  - Status - dropdown
  - Notes - textarea
- [ ] Auto-calculate original price from discount
- [ ] Inline topic/tag creation with random color assignment
- [ ] Form validation

### Module 3.3: Book Detail View
**Requirements:**
- [ ] Full book information display
- [ ] Edit/Delete buttons
- [ ] Quick actions: change status, buy now
- [ ] Publisher location with "Navigate" hint
- [ ] Related books (same author or publisher)

### Module 3.4: Auto-Tag/Topic System
**Requirements:**
- [ ] When typing new topic: check if exists, create if not
- [ ] When typing new tag: check if exists, create if not
- [ ] Assign random unused color from palette
- [ ] Store color in database permanently

**Deliverable:** Full book management with all fields working

---

## Stage 4: Budget & Wallet Management
**Duration:** ~2-3 hours
**Goal:** Track spending across payment methods

### Module 4.1: Wallets Overview
**Requirements:**
- [ ] Dashboard showing all wallets with balances
- [ ] Total available budget (sum of all wallets)
- [ ] Total spent (sum of purchased books)
- [ ] Remaining budget
- [ ] Visual progress bar (spent vs available)
- [ ] Edit wallet balances

### Module 4.2: Wallet Management
**Requirements:**
- [ ] Edit initial balance for each wallet
- [ ] Add custom wallets
- [ ] Delete custom wallets (keep defaults)
- [ ] Color/icon customization

### Module 4.3: Purchase Flow
**Requirements:**
- [ ] When marking book as "purchased":
  - Show wallet selector modal
  - Confirm/edit amount (default to book price)
  - Optional: split across wallets
  - Record transaction
  - Update wallet balance
- [ ] Transaction history per wallet
- [ ] Undo purchase (restore balance)

### Module 4.4: Budget Analytics
**Requirements:**
- [ ] Spending by: topic, publisher, tag
- [ ] Daily spending chart (simple bars)
- [ ] "To-buy" total estimation
- [ ] Warning when to-buy exceeds remaining budget

**Deliverable:** Full budget tracking with purchase flow

---

## Stage 5: Advanced Search & Filtering
**Duration:** ~2-3 hours
**Goal:** Comprehensive search with combined filters

### Module 5.1: Search Interface
**Requirements:**
- [ ] Prominent search bar on Books page
- [ ] Real-time search as you type
- [ ] Search in: title, author, notes, publisher name
- [ ] Bilingual search (EN and AR)

### Module 5.2: Filter Panel
**Requirements:**
- [ ] Slide-out filter panel (mobile) / sidebar (desktop)
- [ ] Filter by:
  - Status (multi-select)
  - Priority (range: 1-5)
  - Price range (min-max slider)
  - Has discount (yes/no/any)
  - Can read PDF (yes/no/any)
  - Publisher (multi-select with search)
  - Topic (multi-select with color badges)
  - Tags (multi-select with color badges)
  - Hall (multi-select)
- [ ] Active filters shown as removable chips
- [ ] Clear all filters button
- [ ] Filter count badge on filter button

### Module 5.3: Saved Filters (Views)
**Requirements:**
- [ ] Save current filter combination as named view
- [ ] Quick access to saved views
- [ ] Default views: "Priority 1", "To Buy", "Hot Offers", "Purchased Today"
- [ ] Delete saved views

### Module 5.4: Search Results
**Requirements:**
- [ ] Result count displayed
- [ ] Highlight matching text in results
- [ ] Group results by relevance or chosen grouping
- [ ] "No results" state with suggestions

**Deliverable:** Powerful search with combined filters

---

## Stage 6: Polish & Mobile Optimization
**Duration:** ~2 hours
**Goal:** Smooth mobile experience

### Module 6.1: Mobile UX Enhancements
**Requirements:**
- [ ] Pull-to-refresh on lists
- [ ] Swipe gestures (edit, delete, status change)
- [ ] Haptic feedback (where supported)
- [ ] Large touch targets (min 44px)
- [ ] Floating action button for "Add Book"
- [ ] Bottom sheets for forms (mobile)

### Module 6.2: PWA Setup
**Requirements:**
- [ ] Web manifest for installability
- [ ] Service worker for offline support
- [ ] Cache static assets
- [ ] IndexedDB for data persistence
- [ ] Add to home screen prompt

### Module 6.3: Animations & Transitions
**Requirements:**
- [ ] Page transitions
- [ ] List item animations (add/remove)
- [ ] Modal animations
- [ ] Loading skeletons
- [ ] Toast notifications

**Deliverable:** Polished, installable PWA

---

## Stage 7: Data Management & Export
**Duration:** ~1-2 hours
**Goal:** Backup and export functionality

### Module 7.1: Database Export/Import
**Requirements:**
- [ ] Export full SQLite database file
- [ ] Import SQLite database (merge or replace)
- [ ] Auto-backup to IndexedDB

### Module 7.2: CSV Export
**Requirements:**
- [ ] Export books to CSV with all fields
- [ ] Export publishers to CSV
- [ ] Export transactions/spending report
- [ ] Include Arabic text properly (UTF-8 BOM)

### Module 7.3: Data Management
**Requirements:**
- [ ] Clear all data (with confirmation)
- [ ] Reset to defaults
- [ ] Database statistics (record counts)

**Deliverable:** Full backup and export capabilities

---

## 📁 Final File Structure

```
book-fair-list/
├── index.html              # Main app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── custom.css          # Minimal custom styles
├── js/
│   ├── app.js              # Main Alpine.js store & routing
│   ├── db.js               # sql.js wrapper & IndexedDB persistence
│   ├── schema.js           # Table definitions & migrations
│   ├── i18n.js             # Translation system
│   ├── translations.js     # EN/AR strings
│   ├── utils.js            # Helper functions
│   └── components/
│       ├── books.js        # Books CRUD & list
│       ├── publishers.js   # Publishers CRUD & list
│       ├── budget.js       # Wallets & transactions
│       ├── search.js       # Search & filters
│       └── settings.js     # App settings & export
└── assets/
    └── icons/              # PWA icons
```

---

## 🚀 Deployment Guide

### Option 1: Static Hosting (Recommended)

**GitHub Pages:**
```bash
# 1. Create repository
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/book-fair-list.git
git push -u origin main

# 2. Enable GitHub Pages
# Go to: Settings > Pages > Source: main branch > / (root)
# Your app will be at: https://YOUR_USERNAME.github.io/book-fair-list/
```

**Netlify:**
```bash
# 1. Drag and drop the folder to netlify.com/drop
# 2. Or connect your GitHub repo for auto-deploys
```

**Vercel:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd book-fair-list
vercel
```

### Option 2: Self-Hosted

**Simple HTTP Server (Local Testing):**
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

**Nginx Config (Production):**
```nginx
server {
    listen 80;
    server_name bookfair.yourdomain.com;
    root /var/www/book-fair-list;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|wasm)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 3: Mobile App (Capacitor)

```bash
# 1. Install Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialize
npx cap init "Book Fair List" com.yourname.bookfairlist

# 3. Add platforms
npx cap add android
npx cap add ios

# 4. Copy web assets
npx cap copy

# 5. Open in native IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

---

## ✅ Definition of Done (Each Stage)

- [ ] All requirements checked off
- [ ] Works on mobile Chrome/Safari
- [ ] Works on desktop Chrome/Firefox
- [ ] Dark mode tested
- [ ] Arabic translation complete
- [ ] RTL layout correct
- [ ] No console errors
- [ ] Data persists after refresh

---

## 📝 Notes

- **sql.js:** Uses WebAssembly, ~1MB initial load. Will be cached by service worker.
- **IndexedDB:** Stores the entire SQLite database as a blob for persistence.
- **No Backend:** Everything runs client-side. Data stays on user's device.
- **Future Enhancement:** Could add optional cloud sync with Supabase/Firebase.

---

## 🕐 Estimated Total Time

| Stage | Duration |
|-------|----------|
| Stage 1: Foundation | 2-3 hours |
| Stage 2: Publishers | 1-2 hours |
| Stage 3: Books | 3-4 hours |
| Stage 4: Budget | 2-3 hours |
| Stage 5: Search | 2-3 hours |
| Stage 6: Polish | 2 hours |
| Stage 7: Export | 1-2 hours |
| **Total** | **13-19 hours** |

---

*Ready to start? Let's begin with Stage 1!* 🚀
