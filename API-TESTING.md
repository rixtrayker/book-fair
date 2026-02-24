# API Testing with Postman & Newman

## 📋 Postman Collection

The collection includes **40+ API requests** organized in 6 folders:

### 1. Auth (3 requests)
- Register User
- Login User  
- Login Admin

### 2. Users (2 requests)
- Get Profile
- Get All Users (Admin only)

### 3. Publishers (5 requests)
- Create Publisher
- Get All Publishers
- Get Publisher by ID
- Update Publisher
- Delete Publisher

### 4. Books (6 requests)
- Create Book
- Get All Books
- Search Books
- Get Book by ID
- Update Book
- Delete Book

### 5. Lists (11 requests)
- Create List
- Get My Lists
- Get Public Lists (Admin)
- Get List by ID
- Update List
- Add Book to List
- Get List Books
- Update List Book
- Remove Book from List
- Merge Lists
- Delete List

### 6. Orders (9 requests)
- Get Admin View
- Get Admin View with Filters
- Update Book Tracking
- Create Order
- Get All Orders (Admin)
- Get My Orders
- Get Order by ID
- Update Order Status

## 🚀 Usage

### Option 1: Import to Postman

1. Open Postman
2. Click **Import**
3. Select `postman_collection.json`
4. Collection will appear in your workspace

### Option 2: Use Newman (CLI)

```bash
# Install Newman globally
npm install -g newman

# Run all tests
./test-api.sh
```

Or manually:

```bash
newman run postman_collection.json
```

## 🔧 Configuration

### Collection Variables

The collection uses these variables (auto-populated by tests):

- `baseUrl` - API base URL (default: http://localhost:3001/api/v1)
- `token` - JWT token (set after login)
- `userId` - Current user ID
- `listId` - Last created list ID
- `bookId` - Last created book ID
- `publisherId` - Last created publisher ID
- `orderId` - Last created order ID

### Environment Setup

Create a Postman environment with:

```json
{
  "baseUrl": "http://localhost:3001/api/v1"
}
```

## 🧪 Test Flow

### User Flow:
1. **Register/Login** → Sets `token` and `userId`
2. **Create List** → Sets `listId`
3. **Add Books to List** → Uses `listId` and `bookId`
4. **Update Book Status/Priority**
5. **View My Orders**

### Admin Flow:
1. **Login Admin** → Sets admin `token`
2. **Create Publishers** → Sets `publisherId`
3. **Create Books** → Sets `bookId`
4. **View Admin View** → See all public lists
5. **Update Book Tracking** → Set prices, status
6. **Create Order** → Consolidate books
7. **Update Shipping Status**

## 📊 Newman Reports

After running `./test-api.sh`, check:

- **Console output** - Real-time results
- **newman-results.json** - Detailed JSON report

### Sample Newman Output:

```
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
├─────────────────────────┼──────────┼──────────┤
│                requests │       40 │        0 │
├─────────────────────────┼──────────┼──────────┤
│            test-scripts │       40 │        0 │
├─────────────────────────┼──────────┼──────────┤
│      prerequest-scripts │        0 │        0 │
├─────────────────────────┼──────────┼──────────┤
│              assertions │       40 │        0 │
└─────────────────────────┴──────────┴──────────┘
```

## 🎯 Quick Test Commands

```bash
# Test specific folder
newman run postman_collection.json --folder "Auth"

# Test with custom environment
newman run postman_collection.json --env-var "baseUrl=http://localhost:3001/api/v1"

# Generate HTML report
newman run postman_collection.json --reporters cli,html

# Run with delay between requests
newman run postman_collection.json --delay-request 500

# Verbose output
newman run postman_collection.json --verbose
```

## 🔍 Testing Scenarios

### Scenario 1: Complete User Journey
```bash
# Run in order:
1. Auth → Login User
2. Lists → Create List
3. Lists → Add Book to List
4. Lists → Update List Book (change priority)
5. Lists → Get List Books
6. Orders → Get My Orders
```

### Scenario 2: Admin Workflow
```bash
# Run in order:
1. Auth → Login Admin
2. Publishers → Create Publisher
3. Books → Create Book
4. Orders → Get Admin View
5. Orders → Update Book Tracking
6. Orders → Create Order
7. Orders → Update Order Status
```

## 🛠️ Troubleshooting

**Backend not running:**
```bash
cd backend && npm run start:dev
```

**Database not seeded:**
```bash
cd backend && npm run seed
```

**Token expired:**
- Re-run login request
- Token auto-updates in collection variables

**Port conflict:**
- Update `baseUrl` in collection variables

## 📝 Notes

- All requests include automatic token management
- Variables auto-populate from responses
- Tests validate response codes
- Admin endpoints require admin token
- Some requests depend on previous requests (use folder order)

---

**Ready to test!** 🚀

Start backend, then run: `./test-api.sh`
