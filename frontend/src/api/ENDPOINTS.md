# API Endpoints Reference

> Complete list of all backend endpoints with frontend coverage status

---

## Authentication (`/auth`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| POST | `/auth/register` | `auth.register()` | Register new customer |
| POST | `/auth/register/collector` | `auth.registerCollector()` | Register new collector |
| POST | `/auth/login` | `auth.login()` | Login |

---

## Users (`/users`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| GET | `/users/profile` | `users.getProfile()` | Get current user profile |
| GET | `/users` | `users.getAll()` | List all users (collector+) |

---

## Books (`/books`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| POST | `/books` | `books.create()` | Create new book |
| GET | `/books` | `books.getAll()` | List books (paginated, searchable) |
| GET | `/books/:id` | `books.getOne()` | Get single book |
| PUT | `/books/:id` | `books.update()` | Update book |
| DELETE | `/books/:id` | `books.delete()` | Soft delete book |
| POST | `/books/:id/restore` | `books.restore()` | Restore deleted book (super_admin) |

---

## Publishers (`/publishers`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| POST | `/publishers` | `publishers.create()` | Create publisher |
| GET | `/publishers` | `publishers.getAll()` | List publishers |
| GET | `/publishers/:id` | `publishers.getOne()` | Get publisher |
| PUT | `/publishers/:id` | `publishers.update()` | Update publisher |
| DELETE | `/publishers/:id` | `publishers.delete()` | Delete publisher |

---

## Lists (`/lists`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| POST | `/lists` | `lists.create()` | Create list |
| GET | `/lists` | `lists.getAll()` | Get user's lists |
| GET | `/lists/public` | `lists.getPublic()` | Get public lists (collector) |
| GET | `/lists/shared/:token` | `lists.getByShareToken()` | Get list by share token |
| GET | `/lists/:id` | `lists.getOne()` | Get list with access check |
| PUT | `/lists/:id` | `lists.update()` | Update list |
| DELETE | `/lists/:id` | `lists.delete()` | Soft delete list |
| POST | `/lists/:id/books` | `lists.addBook()` | Add book to list |
| GET | `/lists/:id/books` | `lists.getBooks()` | Get books in list |
| PUT | `/lists/books/:bookId` | `lists.updateBook()` | Update list book entry |
| DELETE | `/lists/books/:bookId` | `lists.removeBook()` | Remove book from list |
| POST | `/lists/merge` | `lists.merge()` | Merge two lists |
| POST | `/lists/:id/invite` | `lists.inviteCollector()` | Invite collector to list |
| POST | `/lists/:id/invitation/respond` | `lists.respondToInvitation()` | Accept/decline invitation |
| POST | `/lists/:id/assign` | `lists.assignCollector()` | Assign collector to list |
| DELETE | `/lists/:id/assign` | `lists.unassignCollector()` | Unassign collector from list |
| POST | `/lists/:id/books/:bookId/assign` | `lists.assignCollectorToBook()` | Assign collector to book |
| DELETE | `/lists/:id/books/:bookId/assign` | `lists.unassignCollectorFromBook()` | Unassign collector from book |
| POST | `/lists/:id/books/:bookId/claim` | `lists.claimBook()` | Collector claims book |

---

## Orders (`/orders`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| POST | `/orders` | `orders.create()` | Create order (collector) |
| GET | `/orders` | `orders.getAll()` | Get all orders (collector) |
| GET | `/orders/my-orders` | `orders.getMyOrders()` | Get user's orders |
| GET | `/orders/:id` | `orders.getOne()` | Get order with access check |
| PUT | `/orders/:id` | `orders.update()` | Update order |
| POST | `/orders/tracking` | `orders.updateTracking()` | Update book tracking (collector) |
| GET | `/orders/admin-view` | `orders.getAdminView()` | Get collector dashboard view |
| POST | `/orders/:id/assign` | `orders.assignCollector()` | Assign collector to order |
| DELETE | `/orders/:id/assign` | `orders.unassignCollector()` | Unassign collector (super_admin) |

---

## Notifications (`/notifications`)

| Method | Endpoint | Frontend | Description |
|--------|----------|----------|-------------|
| GET | `/notifications` | `notifications.getAll()` | Get user notifications |
| POST | `/notifications/:id/read` | `notifications.markAsRead()` | Mark as read |
| POST | `/notifications/read-all` | `notifications.markAllAsRead()` | Mark all as read |
| DELETE | `/notifications/:id` | `notifications.delete()` | Delete notification |

---

## Role-Based Access Summary

| Endpoint | Customer | Collector | Super Admin |
|----------|----------|-----------|-------------|
| `GET /lists/public` | ❌ | ✅ | ✅ |
| `POST /lists/:id/books/:bookId/claim` | ❌ | ✅ | ✅ |
| `POST /orders` | ❌ | ✅ | ✅ |
| `GET /orders` | ❌ | ✅ | ✅ |
| `POST /orders/tracking` | ❌ | ✅ | ✅ |
| `GET /orders/admin-view` | ❌ | ✅ | ✅ |
| `POST /books/:id/restore` | ❌ | ❌ | ✅ |
| `DELETE /orders/:id/assign` | ❌ | ❌ | ✅ |

---

## Pagination

All list endpoints support pagination via query parameters:

```
?page=1&limit=20&sortBy=created_at&sortOrder=desc
```

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Error Response Format

```json
{
  "success": false,
  "statusCode": 404,
  "message": "الكتاب غير موجود",
  "code": "BOOK_NOT_FOUND",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "path": "/api/books/999"
}
```

---

## Language Header

All requests include `Accept-Language` header:
- Default: `ar` (Arabic)
- Alternative: `en` (English)

Set via: `localStorage.setItem('language', 'ar')`
