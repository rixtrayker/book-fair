# Backend Refactoring Plan

> This document outlines the refactoring plan for the Kotobgy backend. For project specification, see [SPEC.md](./SPEC.md).

---

## Current Issues Found (Code Review)

### Critical Security Issues

| Issue | File | Line | Severity |
|-------|------|------|----------|
| IDOR: Any user can view any order | `orders.controller.ts` | 50-54 | CRITICAL |
| Hardcoded JWT secret fallback | `app.module.ts` | 14 | CRITICAL |
| No rate limiting on auth endpoints | `auth.controller.ts` | - | HIGH |

### Business Logic Issues

| Issue | File | Line | Severity |
|-------|------|------|----------|
| Order creation doesn't update list_books status | `orders.service.ts` | 105-118 | HIGH |
| Race condition: duplicate orders for same book | `orders.service.ts` | 76-124 | HIGH |
| Merge lists doesn't handle duplicates | `lists.service.ts` | 121-131 | HIGH |
| Merge lists not wrapped in transaction | `lists.service.ts` | 121-131 | HIGH |
| Book delete doesn't handle list references | `books.service.ts` | 58-61 | HIGH |
| Publisher delete doesn't check for books | `publishers.service.ts` | 37-40 | MEDIUM |
| No unique constraint on (list_id, book_id) | `database.ts` | 83-95 | MEDIUM |
| Duplicate book allowed in same list | `lists.service.ts` | 60-68 | MEDIUM |

### Data Integrity Issues

| Issue | File | Line | Severity |
|-------|------|------|----------|
| orders table missing ON DELETE behavior | `database.ts` | 114-125 | HIGH |
| order_books missing ON DELETE CASCADE | `database.ts` | 127-137 | MEDIUM |
| books.publisher_id missing ON DELETE | `database.ts` | 57-69 | HIGH |
| list_books.book_id missing ON DELETE | `database.ts` | 83-95 | MEDIUM |

### Missing Production Features

| Feature | Status | Priority |
|---------|--------|----------|
| Unit/Integration Testing | Not implemented | CRITICAL |
| Environment Configuration | No @nestjs/config | HIGH |
| Structured Logging | Only console.log | HIGH |
| API Documentation | No Swagger | MEDIUM |
| Security Headers | No Helmet | HIGH |
| Rate Limiting | Not implemented | HIGH |
| Pagination | Not implemented | MEDIUM |
| Error Standardization | Inconsistent | MEDIUM |
| Docker/CI-CD | Not implemented | MEDIUM |

---

## Requirements from Code Review Discussion

### Resolved Requirements

| # | Requirement | Decision |
|---|-------------|----------|
| 1 | Fix IDOR bug in orders | Users see own orders only. Collectors see orders assigned to them + public orders. |
| 2 | Total price calculation | Keep as-is (actual_price is final price) |
| 3 | Update list_books status when ordered | Implement status field and update flow |
| 4 | Assign book to specific collector | Assignment can be at: order level, list level, or individual book level |
| 5 | Merge lists duplicates | Skip duplicates during merge |
| 6 | Delete book behavior | Soft delete. Notify user & collector via in-app. Publisher delete: leave as-is |
| 7 | Arabic language support | Arabic is PRIMARY language. Book titles stored in one language only |
| 8 | Email notifications | Prepare infrastructure but DISABLE by default. Super Admin can enable later |
| 9 | Role naming | Rename "Admin" → "Collector". Add new "Super Admin" role |

---

## Clarified Business Rules

### Role Hierarchy

| Role | Description | Permissions |
|------|-------------|-------------|
| **Customer** | Book enthusiast | Browse, create lists, view own data |
| **Collector** (formerly Admin) | Sources books | View assigned books, update status, manage orders |
| **Super Admin** | System administrator | Full access, enable/disable features, manage users |

### Collector Assignment Levels

Assignment can happen at **three levels** (priority: book > list > order):

| Level | What Gets Assigned | Visibility |
|-------|-------------------|------------|
| **Order Level** | All books in an order | Collector sees all books in that order |
| **List Level** | All books in a list | Collector sees all books in that list |
| **Book Level** | Individual book in a list | Collector sees ONLY that specific book |

**Privacy Rule for Private Lists:**
- When books in a private list are assigned to different collectors
- Each collector can ONLY see books specifically assigned to them
- They CANNOT see other books in the list unless the entire list is explicitly shared

### Order Purpose

Orders are **tracking records** for:
- Delivered/fulfilled customer books
- Shipping information
- Price/receipt tracking
- Collector assignment for fulfillment

### Soft Delete Strategy

All deletable entities use soft delete:
```sql
deleted_at DATETIME DEFAULT NULL
```

- Books: Soft delete, remove from active lists, preserve history
- Lists: Soft delete, preserve for analytics
- Orders: Soft delete, preserve for records

---

## Implementation Plan

### Phase 1: Security Fixes (Priority: CRITICAL)

#### 1.1 Fix IDOR in Orders

**Current Code (`orders.controller.ts:50-54`):**
```typescript
@Get(':id')
@UseGuards(AuthGuard)
getOrder(@Param('id') id: string) {
  return this.ordersService.getOrder(+id);
}
```

**Required Changes:**
1. Create `@User()` decorator to extract current user from request
2. Modify controller to pass user to service
3. Service validates:
   - If user is customer: Only return orders where `user_id === currentUser.id`
   - If user is collector: Return order if assigned to them OR if public
   - If user is super_admin: Return any order
4. Add `visibility` field to orders table
5. Add `assigned_collector_id` to orders

**Files to Modify:**
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/common/decorators/user.decorator.ts` (create)

#### 1.2 Fix Hardcoded JWT Secret

**Current Code (`app.module.ts:14`):**
```typescript
secret: process.env.JWT_SECRET || 'dev-secret-change-me',
```

**Required Changes:**
1. Add `@nestjs/config` module
2. Create `.env`, `.env.example`, `.env.production`
3. Fail fast in production if JWT_SECRET not set
4. Move all secrets to environment variables

**Files to Modify:**
- `backend/src/app.module.ts`
- `backend/src/config/config.module.ts` (create)
- `backend/.env` (create)
- `backend/.env.example` (create)

#### 1.3 Add Rate Limiting

**Required Changes:**
1. Install `@nestjs/throttler`
2. Configure in `app.module.ts`
3. Apply stricter limits on auth endpoints

---

### Phase 2: Order Status Flow (Priority: HIGH)

#### 2.1 Add Status to list_books

**Current Schema:**
```sql
CREATE TABLE list_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 3,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**New Schema:**
```sql
ALTER TABLE list_books ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE list_books ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
```

**Status Values (from SPEC.md):**
| Status | Set By | Description |
|--------|--------|-------------|
| `pending` | System | No collector assigned |
| `claimed` | Collector | Collector took responsibility |
| `in_progress` | Collector | Actively sourcing |
| `sourced` | Collector | Has book in hand |
| `shipped` | Collector | Book shipped |
| `delivered` | Customer/Collector | Book received |
| `not_found` | Collector | Could not find - auto-unassigns |
| `cancelled` | Customer | No longer wanted |

**Status Transition Rules:**
```
pending → claimed → in_progress → sourced → shipped → delivered
   ↓         ↓          ↓           ↓          ↓
cancelled  cancelled  cancelled  cancelled  cancelled
   ↑         ↑
   └─────────┘ (not_found reverts to pending)
```

#### 2.2 Update Order Creation Flow

**Current:** No status update when books added to order

**New Flow:**
1. Create order
2. Insert order_books records
3. Update `list_books.status = 'ordered'` for all books
4. Wrap in transaction

**Files to Modify:**
- `backend/src/orders/orders.service.ts`
- `backend/src/database.ts` (migration)

---

### Phase 3: Collector Assignment (Priority: HIGH)

#### 3.1 Assignment Levels

**Three levels of assignment with privacy implications:**

| Assignment Level | Table | Field | Visibility Rule |
|-----------------|-------|-------|-----------------|
| Order Level | `orders` | `assigned_collector_id` | Collector sees ALL books in that order |
| List Level | `lists` | `assigned_collector_id` | Collector sees ALL books in that list |
| Book Level | `list_books` | `assigned_collector_id` | Collector sees ONLY that specific book |

**Privacy Rule (Critical):**
- For PRIVATE lists with books assigned to MULTIPLE collectors
- Each collector sees ONLY books assigned to them
- They CANNOT see other books in the list
- Exception: If list is explicitly shared with collector (via `list_invitations`)

#### 3.2 Database Changes

**Add to orders (order-level assignment):**
```sql
ALTER TABLE orders ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN visibility TEXT DEFAULT 'private'; -- 'public' | 'private'
```

**Add to lists (list-level assignment):**
```sql
ALTER TABLE lists ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
```

**Add to list_books (book-level assignment):**
```sql
ALTER TABLE list_books ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
```

#### 3.3 API Changes

**New Endpoints:**
```
POST   /orders/:id/assign              - Assign collector to order (super_admin/owner)
DELETE /orders/:id/assign              - Unassign collector from order

POST   /lists/:id/assign               - Assign collector to entire list (owner only)
DELETE /lists/:id/assign               - Unassign collector from list (owner only)

POST   /lists/:id/books/:bookId/assign - Assign collector to specific book (owner only)
DELETE /lists/:id/books/:bookId/assign - Unassign collector from book (owner only)

GET    /collectors/:id/assignments     - Get all assignments for a collector
GET    /collectors/me/assignments      - Get current collector's assignments
```

**Assignment Resolution Logic (Service Layer):**
```typescript
getAssignmentForBook(listBookId: number): number | null {
  // Priority: book-level > list-level > order-level
  
  // 1. Check book-level assignment
  const bookAssignment = await this.getListBookAssignment(listBookId);
  if (bookAssignment) return bookAssignment;
  
  // 2. Check list-level assignment
  const listAssignment = await this.getListAssignment(listBookId);
  if (listAssignment) return listAssignment;
  
  // 3. Check order-level assignment (if book is in an order)
  const orderAssignment = await this.getOrderAssignment(listBookId);
  if (orderAssignment) return orderAssignment;
  
  return null;
}
```

#### 3.4 Visibility Query for Collectors

**When collector views a private list:**
```sql
SELECT lb.*, b.title, b.author_name
FROM list_books lb
JOIN books b ON lb.book_id = b.id
JOIN lists l ON lb.list_id = l.id
WHERE l.id = ?
  AND (
    -- Collector is assigned to this specific book
    lb.assigned_collector_id = :collectorId
    -- OR collector is assigned to entire list
    OR l.assigned_collector_id = :collectorId
    -- OR list is explicitly shared with collector
    OR EXISTS (
      SELECT 1 FROM list_invitations li 
      WHERE li.list_id = l.id 
        AND li.collector_id = :collectorId
        AND li.status = 'accepted'
    )
    -- OR list is public
    OR l.visibility = 'public'
  )
  AND lb.deleted_at IS NULL;
```

**Files to Modify:**
- `backend/src/orders/orders.service.ts`
- `backend/src/lists/lists.service.ts`
- `backend/src/database.ts`
- `backend/src/common/guards/visibility.guard.ts` (create)

#### 3.5 Business Rules

- Only ONE collector per book/list/order at a time
- Collector can claim a book from public lists (sets `assigned_collector_id` to themselves)
- Only list OWNER can unassign a collector
- `not_found` status auto-unassigns the collector
- Super Admin can assign/unassign any resource
- Assignment does NOT override list visibility for OTHER books

---

### Phase 4: Merge Lists Fix (Priority: MEDIUM)

#### 4.1 Current Implementation

```typescript
async mergeLists(sourceId: number, targetId: number) {
  await this.db.run(
    `UPDATE list_books SET list_id = ? WHERE list_id = ?`,
    [targetId, sourceId]
  );
  await this.db.run(`DELETE FROM lists WHERE id = ?`, [sourceId]);
}
```

#### 4.2 New Implementation

```typescript
async mergeLists(sourceId: number, targetId: number) {
  return this.db.withTransaction(async () => {
    // 1. Find duplicates (books in both lists)
    const duplicates = await this.db.all(`
      SELECT lb1.id 
      FROM list_books lb1
      JOIN list_books lb2 ON lb1.book_id = lb2.book_id AND lb2.list_id = ?
      WHERE lb1.list_id = ?
    `, [targetId, sourceId]);

    // 2. Delete duplicates from source
    if (duplicates.length > 0) {
      const ids = duplicates.map(d => d.id).join(',');
      await this.db.run(`DELETE FROM list_books WHERE id IN (${ids})`);
    }

    // 3. Move remaining books to target
    await this.db.run(
      `UPDATE list_books SET list_id = ? WHERE list_id = ?`,
      [targetId, sourceId]
    );

    // 4. Delete source list
    await this.db.run(`DELETE FROM lists WHERE id = ?`, [sourceId]);
  });
}
```

**Files to Modify:**
- `backend/src/lists/lists.service.ts`

---

### Phase 5: Book Deletion with Soft Delete & Notification (Priority: MEDIUM)

#### 5.1 Soft Delete Strategy

**All deletable entities use soft delete:**

```sql
-- Add to books table
ALTER TABLE books ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Add to lists table
ALTER TABLE lists ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Add to list_books table
ALTER TABLE list_books ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Add to orders table
ALTER TABLE orders ADD COLUMN deleted_at DATETIME DEFAULT NULL;
```

**Query Pattern:**
```typescript
// Always filter out soft-deleted records
const activeBooks = await this.db.all(
  'SELECT * FROM books WHERE deleted_at IS NULL'
);

// Soft delete
await this.db.run(
  'UPDATE books SET deleted_at = ? WHERE id = ?',
  [new Date().toISOString(), id]
);
```

#### 5.2 Current Implementation

```typescript
async remove(id: number) {
  await this.db.run('DELETE FROM books WHERE id = ?', [id]);
}
```

#### 5.3 New Implementation (Soft Delete with Notifications)

```typescript
async remove(id: number) {
  return this.db.withTransaction(async () => {
    // 1. Check if book is already soft-deleted
    const book = await this.db.get(
      'SELECT * FROM books WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!book) throw new NotFoundException('Book not found');

    // 2. Find all affected users and collectors
    const affectedData = await this.db.all(`
      SELECT 
        l.user_id,
        lb.assigned_collector_id,
        lb.id as list_book_id,
        l.id as list_id,
        l.name as list_name
      FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.book_id = ? AND lb.deleted_at IS NULL
    `, [id]);

    // 3. Group by user and collector
    const usersToNotify = new Map<number, any[]>();
    const collectorsToNotify = new Map<number, any[]>();
    
    affectedData.forEach(row => {
      if (row.user_id) {
        if (!usersToNotify.has(row.user_id)) usersToNotify.set(row.user_id, []);
        usersToNotify.get(row.user_id)!.push({
          listId: row.list_id,
          listName: row.list_name,
          bookTitle: book.title
        });
      }
      if (row.assigned_collector_id) {
        if (!collectorsToNotify.has(row.assigned_collector_id)) {
          collectorsToNotify.set(row.assigned_collector_id, []);
        }
        collectorsToNotify.get(row.assigned_collector_id)!.push({
          bookTitle: book.title
        });
      }
    });

    // 4. Soft delete list_books entries
    await this.db.run(
      'UPDATE list_books SET deleted_at = ? WHERE book_id = ?',
      [new Date().toISOString(), id]
    );

    // 5. Soft delete book
    await this.db.run(
      'UPDATE books SET deleted_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );

    // 6. Send in-app notifications
    for (const [userId, items] of usersToNotify) {
      await this.notificationsService.create({
        userId,
        type: 'book_deleted',
        title: 'تم حذف كتاب من قائمتك',
        message: `تم حذف "${items[0].bookTitle}" من قائمتك "${items[0].listName}"`,
        payload: { bookId: id, affectedLists: items }
      });
    }

    for (const [collectorId, items] of collectorsToNotify) {
      await this.notificationsService.create({
        userId: collectorId,
        type: 'book_deleted',
        title: 'تم حذف كتاب كان معين لك',
        message: `تم حذف "${items[0].bookTitle}" من النظام`,
        payload: { bookId: id }
      });
    }

    return { 
      deleted: true, 
      affectedUsers: usersToNotify.size,
      affectedCollectors: collectorsToNotify.size 
    };
  });
}
```

#### 5.4 Restore Functionality (Super Admin Only)

```typescript
async restore(id: number) {
  return this.db.withTransaction(async () => {
    // Restore book
    await this.db.run(
      'UPDATE books SET deleted_at = NULL WHERE id = ?',
      [id]
    );
    
    // Restore related list_books
    await this.db.run(
      'UPDATE list_books SET deleted_at = NULL WHERE book_id = ?',
      [id]
    );
    
    return { restored: true };
  });
}
```

**Files to Modify:**
- `backend/src/books/books.service.ts`
- `backend/src/database.ts` (add deleted_at columns)
- `backend/src/lists/lists.service.ts` (filter soft-deleted)

#### 5.3 Notification Module

**Create notification infrastructure:**

```
backend/src/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
├── dto/
│   └── create-notification.dto.ts
├── interfaces/
│   └── notification.interface.ts
└── channels/
    ├── in-app.channel.ts
    └── email.channel.ts
```

**Notification Table:**
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload TEXT, -- JSON string
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Notification Channels:**
| Channel | Status | Description |
|---------|--------|-------------|
| In-App | ENABLED | Stored in database, polled or SSE |
| Email | DISABLED | Prepared but off by default, Super Admin enables |

**Notification Types:**
| Type | Title (AR) | Title (EN) | Channels |
|------|------------|------------|----------|
| `book_deleted` | تم حذف كتاب من قائمتك | Book removed from your list | in-app, email* |
| `book_assigned` | تم تعيين كتاب لك | A book was assigned to you | in-app, email* |
| `status_updated` | تم تحديث حالة الكتاب | Book status updated | in-app, email* |
| `order_created` | تم إنشاء طلب جديد | New order created | in-app, email* |
| `list_shared` | تم مشاركة قائمة معك | A list was shared with you | in-app, email* |

*Email channel is disabled by default.

**Email Configuration (for future use):**
```typescript
interface EmailConfig {
  enabled: boolean;  // Default: false, Super Admin controls
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  from: string;
  templates: {
    book_deleted: string;
    book_assigned: string;
    // etc.
  };
}
```

**Environment Variables (Email):**
```env
# Email (optional, disabled by default)
EMAIL_ENABLED=false
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@kotobgy.com
SENDGRID_API_KEY=your-api-key
```

**Super Admin Feature Flag:**
```typescript
// System settings table for feature flags
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default values
INSERT INTO system_settings (key, value, description) VALUES
  ('email_notifications_enabled', 'false', 'Enable email notifications'),
  ('email_provider', 'sendgrid', 'Email service provider');
```

**Notification Service:**
```typescript
class NotificationsService {
  async create(dto: CreateNotificationDto): Promise<Notification> {
    // 1. Create in-app notification (always)
    const notification = await this.saveToDatabase(dto);
    
    // 2. Send to email channel if enabled
    const emailEnabled = await this.isEmailEnabled();
    if (emailEnabled) {
      await this.emailChannel.send(notification);
    }
    
    return notification;
  }
  
  private async isEmailEnabled(): Promise<boolean> {
    const setting = await this.db.get(
      'SELECT value FROM system_settings WHERE key = ?',
      ['email_notifications_enabled']
    );
    return setting?.value === 'true';
  }
}
```

**Files to Create:**
- `backend/src/notifications/notifications.module.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/channels/in-app.channel.ts`
- `backend/src/notifications/channels/email.channel.ts`
- `backend/src/database.ts` (add notifications, system_settings tables)

**Files to Modify:**
- `backend/src/books/books.service.ts`
- `backend/src/lists/lists.service.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/app.module.ts` (import NotificationsModule)

---

### Phase 6: Arabic Language Support (Priority: HIGH)

**IMPORTANT:** Arabic is the PRIMARY language. All UI, errors, and messages default to Arabic.

#### 6.1 Language Configuration

**Default Language:** Arabic (`ar`)
**Supported Languages:** Arabic (primary), English (secondary)
**Book Metadata:** Single language only (no bilingual titles)

```typescript
// main.ts
app.useLocale('ar'); // Default locale

// Request language detection
const lang = request.headers['accept-language'] || 'ar';
```

#### 6.2 i18n Architecture

**CRITICAL RULE: NO HARDCODED TEXT**

All user-facing text MUST use i18n translation keys. This includes:
- Error messages
- Success messages
- Validation messages
- Notification titles/messages
- Email content
- API response messages

**Wrong:**
```typescript
throw new NotFoundException('Book not found');
```

**Right:**
```typescript
throw new NotFoundException(this.i18n.translate('errors.BOOK_NOT_FOUND', { lang }));
```

**Install:**
```bash
npm install nestjs-i18n
```

**Structure:**
```
backend/src/i18n/
├── i18n.module.ts
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── books.json
│   ├── orders.json
│   ├── lists.json
│   └── errors.json
└── ar/
    ├── common.json
    ├── auth.json
    ├── books.json
    ├── orders.json
    ├── lists.json
    └── errors.json
```

#### 6.3 Translation Files

**errors.json (Arabic - PRIMARY):**
```json
{
  "BOOK_NOT_FOUND": "الكتاب غير موجود",
  "LIST_NOT_FOUND": "القائمة غير موجودة",
  "ORDER_NOT_FOUND": "الطلب غير موجود",
  "USER_NOT_FOUND": "المستخدم غير موجود",
  "PUBLISHER_NOT_FOUND": "دار النشر غير موجودة",
  "UNAUTHORIZED": "غير مصرح لك بالوصول",
  "FORBIDDEN": "لا تملك صلاحية الوصول",
  "VALIDATION_ERROR": "خطأ في البيانات المدخلة",
  "DUPLICATE_BOOK": "هذا الكتاب موجود بالفعل في القائمة",
  "ASSIGNMENT_REQUIRED": "يجب تعيين جامع للكتاب",
  "INVALID_STATUS_TRANSITION": "لا يمكن تغيير الحالة بهذه الطريقة",
  "BOOK_ALREADY_DELETED": "هذا الكتاب محذوف بالفعل",
  "CANNOT_DELETE_ASSIGNED_BOOK": "لا يمكن حذف كتاب معين لجامع",
  "COLLECTOR_ALREADY_ASSIGNED": "يوجد جامع معين بالفعل لهذا الكتاب",
  "PRIVATE_LIST_ACCESS_DENIED": "لا يمكنك الوصول إلى هذه القائمة الخاصة"
}
```

**errors.json (English):**
```json
{
  "BOOK_NOT_FOUND": "Book not found",
  "LIST_NOT_FOUND": "List not found",
  "ORDER_NOT_FOUND": "Order not found",
  "USER_NOT_FOUND": "User not found",
  "PUBLISHER_NOT_FOUND": "Publisher not found",
  "UNAUTHORIZED": "Unauthorized access",
  "FORBIDDEN": "Access denied",
  "VALIDATION_ERROR": "Validation error",
  "DUPLICATE_BOOK": "This book already exists in the list",
  "ASSIGNMENT_REQUIRED": "A collector must be assigned to this book",
  "INVALID_STATUS_TRANSITION": "Invalid status transition",
  "BOOK_ALREADY_DELETED": "This book is already deleted",
  "CANNOT_DELETE_ASSIGNED_BOOK": "Cannot delete a book assigned to a collector",
  "COLLECTOR_ALREADY_ASSIGNED": "A collector is already assigned to this book",
  "PRIVATE_LIST_ACCESS_DENIED": "You cannot access this private list"
}
```

**common.json (Arabic - PRIMARY):**
```json
{
  "SUCCESS": "تم بنجاح",
  "CREATED": "تم الإنشاء بنجاح",
  "UPDATED": "تم التحديث بنجاح",
  "DELETED": "تم الحذف بنجاح",
  "RESTORED": "تم الاستعادة بنجاح",
  "PAGINATION": {
    "PAGE": "صفحة",
    "OF": "من",
    "TOTAL": "إجمالي النتائج",
    "NO_RESULTS": "لا توجد نتائج"
  },
  "ACTIONS": {
    "SAVE": "حفظ",
    "CANCEL": "إلغاء",
    "CONFIRM": "تأكيد",
    "DELETE": "حذف",
    "EDIT": "تعديل"
  }
}
```

**notifications.json (Arabic - PRIMARY):**
```json
{
  "BOOK_DELETED_TITLE": "تم حذف كتاب من قائمتك",
  "BOOK_DELETED_MESSAGE": "تم حذف \"{{bookTitle}}\" من قائمتك \"{{listName}}\"",
  "BOOK_ASSIGNED_TITLE": "تم تعيين كتاب لك",
  "BOOK_ASSIGNED_MESSAGE": "تم تعيين \"{{bookTitle}}\" لك",
  "STATUS_UPDATED_TITLE": "تم تحديث حالة الكتاب",
  "STATUS_UPDATED_MESSAGE": "تم تحديث حالة \"{{bookTitle}}\" إلى {{status}}",
  "ORDER_CREATED_TITLE": "تم إنشاء طلب جديد",
  "ORDER_CREATED_MESSAGE": "تم إنشاء طلب جديد يحتوي على {{count}} كتاب",
  "LIST_SHARED_TITLE": "تم مشاركة قائمة معك",
  "LIST_SHARED_MESSAGE": "شارك {{userName}} معك قائمة \"{{listName}}\""
}
```

**notifications.json (English):**
```json
{
  "BOOK_DELETED_TITLE": "Book removed from your list",
  "BOOK_DELETED_MESSAGE": "\"{{bookTitle}}\" was removed from your list \"{{listName}}\"",
  "BOOK_ASSIGNED_TITLE": "A book was assigned to you",
  "BOOK_ASSIGNED_MESSAGE": "\"{{bookTitle}}\" was assigned to you",
  "STATUS_UPDATED_TITLE": "Book status updated",
  "STATUS_UPDATED_MESSAGE": "\"{{bookTitle}}\" status changed to {{status}}",
  "ORDER_CREATED_TITLE": "New order created",
  "ORDER_CREATED_MESSAGE": "A new order was created with {{count}} books",
  "LIST_SHARED_TITLE": "A list was shared with you",
  "LIST_SHARED_MESSAGE": "{{userName}} shared the list \"{{listName}}\" with you"
}
```

#### 6.4 Exception Filter with i18n

**All exceptions use translation keys:**

```typescript
// Common exception base class
export class I18nException extends HttpException {
  constructor(
    public readonly translationKey: string,
    public readonly statusCode: number,
    public readonly args?: Record<string, any>
  ) {
    super(translationKey, statusCode);
  }
}

// Specific exceptions
export class BookNotFoundException extends I18nException {
  constructor(bookId: number) {
    super('errors.BOOK_NOT_FOUND', 404, { bookId });
  }
}

export class PrivateListAccessException extends I18nException {
  constructor() {
    super('errors.PRIVATE_LIST_ACCESS_DENIED', 403);
  }
}
```

**Global Exception Filter:**

```typescript
@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    // Default to Arabic
    const lang = request.headers['accept-language'] || 'ar';

    let status = 500;
    let message: string;
    let code = 'INTERNAL_ERROR';

    if (exception instanceof I18nException) {
      status = exception.statusCode;
      code = exception.translationKey.replace('errors.', '');
      message = this.i18n.translate(exception.translationKey, { 
        lang, 
        args: exception.args 
      });
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
        // Validation errors - translate each
        const messages = Array.isArray(exceptionResponse['message']) 
          ? exceptionResponse['message'] 
          : [exceptionResponse['message']];
        message = messages.map(msg => 
          this.i18n.translate(`validation.${msg}`, { lang })
        ).join(', ');
        code = 'VALIDATION_ERROR';
      } else {
        message = this.i18n.translate('errors.INTERNAL_ERROR', { lang });
      }
    } else {
      message = this.i18n.translate('errors.INTERNAL_ERROR', { lang });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

#### 6.5 Service Usage Pattern

**Every service must inject I18nService and use translations:**

```typescript
@Injectable()
export class BooksService {
  constructor(
    private db: DatabaseService,
    @Inject(I18nService) private i18n: I18nService
  ) {}

  async findOne(id: number, lang: string) {
    const book = await this.db.get(
      'SELECT * FROM books WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!book) {
      throw new NotFoundException(
        this.i18n.translate('errors.BOOK_NOT_FOUND', { lang })
      );
    }
    
    return book;
  }

  async create(dto: CreateBookDto, lang: string) {
    const book = await this.db.run(
      'INSERT INTO books (title, author_name) VALUES (?, ?)',
      [dto.title, dto.authorName]
    );
    
    return {
      success: true,
      message: this.i18n.translate('common.CREATED', { lang }),
      data: book
    };
  }
}
```

#### 6.6 Controller Pattern

**Controllers pass language from request:**

```typescript
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('accept-language') lang: string = 'ar'
  ) {
    return this.booksService.findOne(+id, lang);
  }
}
```

**Or use a custom decorator:**

```typescript
// decorators/language.decorator.ts
export const Language = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['accept-language'] || 'ar';
  }
);

// Usage
@Get(':id')
async findOne(@Param('id') id: string, @Language() lang: string) {
  return this.booksService.findOne(+id, lang);
}
```

#### 6.7 Validation Messages (i18n)

**All class-validator decorators use i18n keys:**

```typescript
// dto/create-book.dto.ts
export class CreateBookDto {
  @IsNotEmpty({ message: 'validation.TITLE_REQUIRED' })
  @IsString({ message: 'validation.TITLE_MUST_BE_STRING' })
  @MaxLength(500, { message: 'validation.TITLE_TOO_LONG' })
  title: string;

  @IsNotEmpty({ message: 'validation.AUTHOR_REQUIRED' })
  @IsString({ message: 'validation.AUTHOR_MUST_BE_STRING' })
  authorName: string;

  @IsOptional()
  @IsInt({ message: 'validation.PUBLISHER_ID_MUST_BE_INT' })
  publisherId?: number;

  @IsOptional()
  @Min(0, { message: 'validation.PRICE_MUST_BE_POSITIVE' })
  originalPrice?: number;
}
```

**validation.json (Arabic - PRIMARY):**
```json
{
  "TITLE_REQUIRED": "عنوان الكتاب مطلوب",
  "TITLE_MUST_BE_STRING": "عنوان الكتاب يجب أن يكون نصاً",
  "TITLE_TOO_LONG": "عنوان الكتاب طويل جداً",
  "AUTHOR_REQUIRED": "اسم المؤلف مطلوب",
  "AUTHOR_MUST_BE_STRING": "اسم المؤلف يجب أن يكون نصاً",
  "PUBLISHER_ID_MUST_BE_INT": "معرف دار النشر يجب أن يكون رقماً",
  "PRICE_MUST_BE_POSITIVE": "السعر يجب أن يكون رقماً موجباً",
  "EMAIL_REQUIRED": "البريد الإلكتروني مطلوب",
  "EMAIL_INVALID": "البريد الإلكتروني غير صالح",
  "PASSWORD_REQUIRED": "كلمة المرور مطلوبة",
  "PASSWORD_TOO_SHORT": "كلمة المرور قصيرة جداً",
  "PRIORITY_INVALID": "الأولوية يجب أن تكون بين 1 و 5",
  "STATUS_INVALID": "الحالة غير صالحة"
}
```

**validation.json (English):**
```json
{
  "TITLE_REQUIRED": "Book title is required",
  "TITLE_MUST_BE_STRING": "Book title must be a string",
  "TITLE_TOO_LONG": "Book title is too long",
  "AUTHOR_REQUIRED": "Author name is required",
  "AUTHOR_MUST_BE_STRING": "Author name must be a string",
  "PUBLISHER_ID_MUST_BE_INT": "Publisher ID must be an integer",
  "PRICE_MUST_BE_POSITIVE": "Price must be a positive number",
  "EMAIL_REQUIRED": "Email is required",
  "EMAIL_INVALID": "Email is invalid",
  "PASSWORD_REQUIRED": "Password is required",
  "PASSWORD_TOO_SHORT": "Password is too short",
  "PRIORITY_INVALID": "Priority must be between 1 and 5",
  "STATUS_INVALID": "Status is invalid"
}
```

#### 6.8 Database Arabic Support

**Normalized Columns (from SPEC.md):**
```sql
ALTER TABLE books ADD COLUMN title_normalized TEXT;
ALTER TABLE books ADD COLUMN author_name_normalized TEXT;
```

**Normalization Function:**
```typescript
function normalizeArabic(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic diacritics
    .replace(/[\u0622\u0623]/g, '\u0627') // Normalize Alef variants
    .replace(/\u0629/g, '\u0647') // Normalize Teh Marbuta to Heh
    .toLowerCase();
}
```

**Files to Create:**
- `backend/src/i18n/i18n.module.ts`
- `backend/src/i18n/en/*.json` (all translation files)
- `backend/src/i18n/ar/*.json` (all translation files)
- `backend/src/common/filters/i18n-exception.filter.ts`
- `backend/src/common/exceptions/i18n.exception.ts` (base exception classes)
- `backend/src/common/decorators/language.decorator.ts`
- `backend/src/common/utils/normalize-arabic.ts`

**Files to Modify:**
- `backend/src/app.module.ts` (import I18nModule)
- `backend/src/main.ts` (set default locale to 'ar')
- `backend/src/common/filters/http-exception.filter.ts` (use i18n)
- **ALL Service files** (inject I18nService, replace ALL hardcoded strings)
- **ALL Controller files** (pass language to services)
- **ALL DTO files** (use i18n keys for validation messages)

**CRITICAL:** 
- Zero hardcoded Arabic or English text in service/controller code
- All text must go through i18n translation
- Default language is Arabic

---

### Phase 7: Database Migrations & Integrity (Priority: HIGH)

#### 7.1 Add Missing Foreign Key Constraints

**Migration File:**
```sql
-- 001_fix_foreign_keys.sql

-- Fix books.publisher_id
PRAGMA foreign_keys = OFF;
CREATE TABLE books_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  title_normalized TEXT,
  author_name TEXT NOT NULL,
  author_name_normalized TEXT,
  publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
  isbn TEXT,
  original_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO books_new SELECT * FROM books;
DROP TABLE books;
ALTER TABLE books_new RENAME TO books;
PRAGMA foreign_keys = ON;

-- Similar for orders, order_books, list_books
```

#### 7.2 Add Missing Indexes

```sql
-- 002_add_indexes.sql

CREATE INDEX idx_books_title_normalized ON books(title_normalized);
CREATE INDEX idx_books_author_normalized ON books(author_name_normalized);
CREATE INDEX idx_list_books_list_id ON list_books(list_id);
CREATE INDEX idx_list_books_book_id ON list_books(book_id);
CREATE INDEX idx_list_books_assigned_collector ON list_books(assigned_collector_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

#### 7.3 Add Unique Constraints

```sql
-- 003_add_unique_constraints.sql

-- Prevent duplicate books in same list
CREATE UNIQUE INDEX idx_list_books_unique ON list_books(list_id, book_id);
```

**Files to Create:**
- `backend/migrations/001_fix_foreign_keys.sql`
- `backend/migrations/002_add_indexes.sql`
- `backend/migrations/003_add_unique_constraints.sql`
- `backend/src/database/migrations.service.ts` (runner)

---

### Phase 8: Pagination (Priority: MEDIUM)

#### 8.1 Pagination DTO

```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

#### 8.2 Paginated Response

```typescript
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### 8.3 Endpoints to Update

| Endpoint | Current | New |
|----------|---------|-----|
| `GET /books` | Returns all | Add pagination |
| `GET /orders` | Returns all | Add pagination |
| `GET /lists` | Returns all | Add pagination |
| `GET /users` | Returns all | Add pagination |
| `GET /publishers` | Returns all | Add pagination |

---

### Phase 9: Code Structure Refactoring (Priority: MEDIUM)

#### 9.1 Create Common Module

```
backend/src/common/
├── common.module.ts
├── constants/
│   └── status.constants.ts
├── decorators/
│   ├── user.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── filters/
│   ├── http-exception.filter.ts
│   └── i18n-exception.filter.ts
├── guards/
│   ├── auth.guard.ts
│   ├── roles.guard.ts
│   └── ownership.guard.ts
├── interceptors/
│   ├── logging.interceptor.ts
│   └── transform.interceptor.ts
├── interfaces/
│   ├── user.interface.ts
│   └── pagination.interface.ts
├── pipes/
│   └── validation.pipe.ts
└── utils/
    ├── normalize-arabic.ts
    └── pagination.helper.ts
```

#### 9.2 Standardized API Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  code?: string;
  errors?: ValidationError[];
}
```

---

## Files to Create (Summary)

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables |
| `backend/.env.example` | Template |
| `backend/src/config/config.module.ts` | Config module |
| `backend/src/common/common.module.ts` | Shared utilities |
| `backend/src/common/constants/status.constants.ts` | Status enums |
| `backend/src/common/constants/roles.constants.ts` | Role enums |
| `backend/src/common/decorators/user.decorator.ts` | Extract user from request |
| `backend/src/common/decorators/language.decorator.ts` | Extract language from headers |
| `backend/src/common/decorators/roles.decorator.ts` | Role-based decorator |
| `backend/src/common/filters/i18n-exception.filter.ts` | Translated error responses |
| `backend/src/common/exceptions/i18n.exception.ts` | Base exception classes |
| `backend/src/common/guards/ownership.guard.ts` | Resource ownership check |
| `backend/src/common/guards/visibility.guard.ts` | Private list visibility |
| `backend/src/common/utils/normalize-arabic.ts` | Arabic text normalization |
| `backend/src/i18n/i18n.module.ts` | i18n module |
| `backend/src/i18n/ar/*.json` | Arabic translations (all files) |
| `backend/src/i18n/en/*.json` | English translations (all files) |
| `backend/src/notifications/notifications.module.ts` | Notifications module |
| `backend/src/notifications/notifications.service.ts` | Notification logic |
| `backend/src/notifications/notifications.controller.ts` | Notification endpoints |
| `backend/src/notifications/channels/in-app.channel.ts` | In-app notifications |
| `backend/src/notifications/channels/email.channel.ts` | Email notifications (disabled) |
| `backend/migrations/*.sql` | Database migrations |

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `backend/src/app.module.ts` | Add Config, I18n, Throttler, Notifications modules |
| `backend/src/main.ts` | Set default locale to 'ar', enable CORS |
| `backend/src/database.ts` | Add deleted_at columns, new tables, constraints, indexes |
| `backend/src/auth/auth.controller.ts` | Rate limiting, i18n messages |
| `backend/src/auth/auth.service.ts` | i18n for all messages |
| `backend/src/auth/jwt.strategy.ts` | Use config for secret |
| `backend/src/users/users.service.ts` | i18n, soft delete support |
| `backend/src/users/users.controller.ts` | i18n, pagination |
| `backend/src/orders/orders.controller.ts` | Fix IDOR, add user/language decorators, pagination |
| `backend/src/orders/orders.service.ts` | Add ownership checks, status updates, i18n, soft delete |
| `backend/src/orders/orders.dto.ts` | i18n validation messages |
| `backend/src/lists/lists.service.ts` | Fix merge duplicates, add transaction, i18n, soft delete, visibility |
| `backend/src/lists/lists.controller.ts` | Add assignment endpoints, i18n, pagination |
| `backend/src/lists/lists.dto.ts` | i18n validation messages |
| `backend/src/books/books.service.ts` | Soft delete, notification on delete, i18n |
| `backend/src/books/books.controller.ts` | Restore endpoint, i18n, pagination |
| `backend/src/books/books.dto.ts` | i18n validation messages |
| `backend/src/publishers/publishers.service.ts` | i18n, pagination |
| `backend/src/publishers/publishers.dto.ts` | i18n validation messages |
| **ALL DTOs** | Add i18n validation messages |
| **ALL Services** | Inject I18nService, replace ALL hardcoded strings |
| **ALL Controllers** | Pass language to services |

---

## Database Schema Changes Summary

### New Tables
```sql
-- Notifications
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload TEXT,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System settings (feature flags)
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Tables

**users:**
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'; -- 'customer', 'collector', 'super_admin'
```

**books:**
```sql
ALTER TABLE books ADD COLUMN title_normalized TEXT;
ALTER TABLE books ADD COLUMN author_name_normalized TEXT;
ALTER TABLE books ADD COLUMN deleted_at DATETIME DEFAULT NULL;
```

**lists:**
```sql
ALTER TABLE lists ADD COLUMN visibility TEXT DEFAULT 'private';
ALTER TABLE lists ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
ALTER TABLE lists ADD COLUMN deleted_at DATETIME DEFAULT NULL;
```

**list_books:**
```sql
ALTER TABLE list_books ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE list_books ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
ALTER TABLE list_books ADD COLUMN deleted_at DATETIME DEFAULT NULL;
CREATE UNIQUE INDEX idx_list_books_unique ON list_books(list_id, book_id) WHERE deleted_at IS NULL;
```

**orders:**
```sql
ALTER TABLE orders ADD COLUMN visibility TEXT DEFAULT 'private';
ALTER TABLE orders ADD COLUMN assigned_collector_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN deleted_at DATETIME DEFAULT NULL;
```

### Indexes
```sql
CREATE INDEX idx_books_title_normalized ON books(title_normalized);
CREATE INDEX idx_books_author_normalized ON books(author_name_normalized);
CREATE INDEX idx_list_books_list_id ON list_books(list_id);
CREATE INDEX idx_list_books_book_id ON list_books(book_id);
CREATE INDEX idx_list_books_assigned_collector ON list_books(assigned_collector_id);
CREATE INDEX idx_list_books_status ON list_books(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_assigned_collector ON orders(assigned_collector_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_lists_assigned_collector ON lists(assigned_collector_id);
```

---

## Task Breakdown (Next Step)

When ready, convert to tasks in this order:

### 1. Setup & Infrastructure
   - [ ] Add @nestjs/config module
   - [ ] Create .env and .env.example
   - [ ] Create common module structure
   - [ ] Add deleted_at column to all entities (soft delete)
   - [ ] Add system_settings table for feature flags

### 2. Role System Update
   - [ ] Rename "admin" role to "collector" in database
   - [ ] Add "super_admin" role to users table
   - [ ] Update guards to use new role names
   - [ ] Update all services/controllers with new role checks

### 3. Security Fixes
   - [ ] Create @User() decorator
   - [ ] Create @Language() decorator
   - [ ] Fix IDOR in orders controller
   - [ ] Add ownership validation in orders service
   - [ ] Add rate limiting with @nestjs/throttler

### 4. Database Updates
   - [ ] Add status column to list_books
   - [ ] Add assigned_collector_id to orders, lists, list_books
   - [ ] Add visibility column to orders and lists
   - [ ] Add notifications table
   - [ ] Create migration runner
   - [ ] Add foreign key constraints
   - [ ] Add unique constraint on (list_id, book_id)
   - [ ] Add indexes
   - [ ] Add deleted_at to all tables

### 5. Business Logic Fixes
   - [ ] Update order creation to set status
   - [ ] Fix merge lists with duplicate handling
   - [ ] Implement soft delete for books with notifications
   - [ ] Implement restore functionality (super_admin only)
   - [ ] Update all queries to filter deleted_at IS NULL

### 6. Collector Assignment System
   - [ ] Implement assignment at order level
   - [ ] Implement assignment at list level
   - [ ] Implement assignment at book level
   - [ ] Implement visibility logic for private lists
   - [ ] Create assignment endpoints
   - [ ] Create collector assignments view endpoint

### 7. Notifications Module
   - [ ] Create notifications module
   - [ ] Create notifications service (in-app channel)
   - [ ] Create email channel (disabled by default)
   - [ ] Create notifications controller
   - [ ] Add system_settings for email feature flag
   - [ ] Integrate with books deletion
   - [ ] Integrate with status updates
   - [ ] Integrate with assignments

### 8. Arabic i18n (CRITICAL - No Hardcoded Text)
   - [ ] Install nestjs-i18n
   - [ ] Create i18n module
   - [ ] Create ALL Arabic translation files (ar/*.json)
   - [ ] Create ALL English translation files (en/*.json)
   - [ ] Create i18n exception filter
   - [ ] Create i18n exception base classes
   - [ ] Update ALL DTOs with i18n validation keys
   - [ ] Update ALL services to inject I18nService
   - [ ] Replace ALL hardcoded strings with i18n.translate()
   - [ ] Create Arabic normalization utility
   - [ ] Add normalized columns to books

### 9. Pagination
   - [ ] Create pagination DTO
   - [ ] Create paginated response interface
   - [ ] Update all list endpoints with pagination

### 10. Polish
   - [ ] Standardize API responses
   - [ ] Add logging interceptor
   - [ ] Add request ID correlation
   - [ ] Add @nestjs/swagger for API documentation

---

## Environment Variables Summary

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database
DATABASE_PATH=./bookfair.db

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d

# Language
DEFAULT_LANGUAGE=ar

# Email (disabled by default)
EMAIL_ENABLED=false
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@kotobgy.com
SENDGRID_API_KEY=

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## API Versioning

All routes prefixed with `/api/v1/` as per SPEC.md guidelines.
