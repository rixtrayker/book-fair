# Kotobgy — Book Sourcing & Fair Management Platform

## Project Identity

**Kotobgy** is a bilingual (Arabic-first, English-supported) platform serving two seasonal modes through a shared database, shared users, and a shared **book pool**. It connects **book-geek customers** with **individual book collectors/employees** who source and deliver books.

> ⚠️ **Critical context for any AI agent:** This is ONE project with TWO operational paths sharing the same DB tables, users, and book pool. Do NOT create separate schemas or microservices for each path. The difference is workflow, not data model.

---

## Tech Stack (Already Built — Do Not Change)

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS, Axios, React Router |
| Backend | NestJS 10.x (Express), TypeScript |
| Database | PostgreSQL — **raw SQL via pg driver, no ORM** |
| Auth | JWT + Passport (passport-jwt, passport-local) |
| Password | bcrypt |
| Validation | class-validator, class-transformer |

### Tech Annotations & Cautions

- **PostgreSQL:** Production-grade database with excellent concurrency, full-text search, and JSON support. Use connection pooling for optimal performance.
- **Arabic text & Search:** PostgreSQL supports UTF-8 natively. For Arabic search, use `ILIKE` for case-insensitive matching or implement full-text search with `pg_trgm` extension for better results. Consider storing a `normalized_title` / `normalized_author` column with diacritics stripped for better matching.
- **RTL support:** Tailwind CSS supports RTL via `dir="rtl"` on the root element + `rtl:` variant prefix. Use logical properties (`ps-4` instead of `pl-4`, `ms-2` instead of `ml-2`) throughout. Set up an i18n solution — recommend `react-i18next` with namespace separation per path.
- **File uploads (book covers, shipping stickers):** Use `@nestjs/platform-express` with `multer`. Store files on disk (e.g., `/uploads/{type}/{id}/`) since there's no cloud infra mentioned. Serve via a static route or a dedicated controller. Validate MIME types server-side (images only for covers, images+PDF for stickers). Max file size suggestion: 5MB per file.
- **Search:** For the book pool, implement server-side search with `ILIKE '%term%'` on normalized columns. PostgreSQL's `pg_trgm` extension enables efficient trigram-based search for Arabic text. Consider `CREATE INDEX ON books USING gin (title gin_trgm_ops)` for fast fuzzy matching.
- **LLM book list import (Path 2 — Collector feature):** The collector may paste unstructured text or upload a file, then an LLM formats it into the system's template. Implement this as a backend endpoint that calls an external LLM API (e.g., Anthropic Claude API). Define a strict JSON schema for the output. Validate every row before import. Do NOT auto-commit — show a preview to the collector first.

---

## Roles & Auth

| Role | Description |
|---|---|
| **Customer** | A book enthusiast. Browses the fair catalog (Path 1). Creates sourcing wish lists (Path 2). Can exist on both paths simultaneously. |
| **Collector** (a.k.a. Employee) | An individual who sources books. Works the fair (Path 1). Fulfills sourcing requests year-round (Path 2). Has their own dashboard. Can sign up independently. |
| **Super Admin** | System administrator with full access, can enable/disable features, manage users. |

### Auth Notes

- Both Customers and Collectors register via signup (separate registration flows, same auth system).
- A Collector can manage **non-registered customers** — i.e., create a customer profile on their behalf, prepare book lists for them, and import books. These "managed customers" should have a flag (`is_managed = true`, `managed_by = collector_id`) so they can later claim their account.
- JWT tokens should include `role` and `id` claims. Guard routes accordingly.

---

## Shared Entity: The Book Pool

The **book pool** is the single source of truth for all books ever entered into the system, from either path. Before adding any book to any list, the system MUST search the pool first.

### Book Pool Schema (Conceptual)

```
books
├── id (PK)
├── title (TEXT, required) — original Arabic/English
├── title_normalized (TEXT) — stripped of diacritics, lowercased, for search
├── author_name (TEXT, required)
├── author_name_normalized (TEXT)
├── publisher (TEXT, default: 'غير معروف' / 'UNKNOWN')
├── isbn (TEXT, nullable)
├── cover_images (relation → book_images table, multiple allowed)
├── created_by_user_id (FK)
├── created_at, updated_at
```

### Book Pool Behavior

- **Search before create:** When a user (customer or collector) wants to add a book, the UI must present a search dialog first. Search by title, author, or publisher. Only if no match is found should the "Create New Book" form appear.
- **Minimum required fields:** `title` + `author_name`. Publisher defaults to UNKNOWN if omitted.
- **Cover images:** Both customers and collectors can attach images. Support multiple images per book. Store as files, reference in a `book_images` table (`book_id`, `image_path`, `uploaded_by`, `created_at`).
- **Deduplication:** Soft — the system suggests matches but doesn't block creation. A future admin merge tool can link duplicates.

---

## PATH 1 — Book Fair Mode (Seasonal)

> **Status: Backend & specs mostly complete.** Included here for context only so the agent understands the full picture.

### Summary

During Cairo International Book Fair season, Collectors/Employees curate a catalog of available books. Customers browse this catalog and tag each book with a personal status.

### Customer Book Statuses (Path 1)

| Status | Meaning |
|---|---|
| `want_to_buy` | I want this book |
| `thinking` | Considering it |
| `not_interested` | Skip |
| `bought` | Already purchased |

### Flow

1. Collector adds books to the **fair catalog** (a subset/tag of the book pool, e.g., `fair_id` or `fair_year` on a join table).
2. Customer browses the fair catalog, filters/searches.
3. Customer sets a status per book (personal to them).
4. Collector sees aggregated demand (how many customers want each book).
5. Collector acquires books, updates availability.

> ⚠️ Path 1 is NOT the focus of this prompt. Do not re-architect it. It works.

---

## PATH 2 — Year-Round Book Sourcing

> **Status: Needs full implementation.** This is the primary focus.

### Concept

Customers maintain **wish lists** of books they want sourced from anywhere (not just the fair). Collectors browse these lists (or receive invitation), claim individual books, source them, and ship them.

---

### Feature Group A: Customer Book Lists

#### A1. List Management

- A customer can create **multiple named lists** (e.g., "Arabic Literature", "Programming", "For my daughter").
- Each list has:
  - `id`, `name`, `description` (optional), `customer_id`, `visibility` (public/private), `share_token` (UUID for public link), `created_at`, `updated_at`.
- **Visibility:**
  - **Private:** Only visible to the customer and collectors explicitly invited.
  - **Public:** Accessible via a shareable link (`/lists/{share_token}`). Any collector with the link can view it.
- **Invitation system:** Customer can invite specific collectors to a private list by collector ID or username. Creates a record in `list_invitations` (`list_id`, `collector_id`, `invited_at`, `status: pending/accepted/declined`).
- Both sharing mechanisms can coexist — a list can be public AND have specific invitations.

#### A2. Adding Books to a List

1. Customer initiates "Add Book" on a list.
2. System presents **search dialog** against the book pool.
3. If found → select existing book → add to list as a `list_entry`.
4. If not found → "Create New Book" form → book is added to the pool → then added to the list.
5. Each `list_entry` has:
   - `id`, `list_id`, `book_id`, `priority` (1–5, integer), `sort_order` (for manual reordering), `status` (see below), `notes` (customer notes), `assigned_collector_id` (nullable), `price` (nullable, set by collector), `created_at`, `updated_at`.

#### A3. List Entry Statuses (Path 2)

| Status | Set By | Description |
|---|---|---|
| `pending` | System (default) | Book is on the list, no collector has claimed it |
| `claimed` | Collector | A collector has taken responsibility for this book |
| `in_progress` | Collector | Collector is actively sourcing |
| `sourced` | Collector | Collector has the book in hand |
| `shipped` | Collector | Book has been shipped |
| `delivered` | Customer/Collector | Book received by customer |
| `not_found` | Collector | Collector could not find the book — auto-unassigns collector |
| `cancelled` | Customer | Customer no longer wants this book |

**Rules:**
- Only **one collector** can be assigned to a `list_entry` at a time.
- `claimed` status is **irreversible by the collector** — only the **list owner (customer)** can unassign a collector (revert to `pending`).
- When a collector sets `not_found`, they are automatically unassigned, and the entry reverts to `pending`.
- Status transitions should be validated server-side (e.g., can't go from `pending` to `shipped`).

#### A4. Priority & Ordering

- Each list entry has a `priority` field (1–5, where 5 = highest urgency). Already exists in the current system.
- Entries within a list are **manually reorderable** (drag-and-drop on frontend). Store as `sort_order` integer. Use a gapped sequence (e.g., 1000, 2000, 3000) to avoid rewriting all rows on every reorder.
  - **Frontend tip:** Use `@dnd-kit/core` or `react-beautiful-dnd` (check React 19 compatibility — `@dnd-kit` is more actively maintained).

#### A5. Price Visibility

- When a collector sets a `price` on a list entry, it is visible ONLY to:
  - The collector who set it.
  - The customer who owns the list.
- Other collectors who can view the list (public or invited) must NOT see the price.
- Enforce this at the API level — strip `price` from response if `requester !== assigned_collector && requester !== list_owner`.

---

### Feature Group B: Collector Dashboard & Workflows

#### B1. Collector Dashboard

Each collector has a dashboard showing:
- **My Claims:** All list entries across all customers where they are the assigned collector, grouped by status.
- **Shared With Me:** Lists they've been invited to.
- **Public Lists:** Browsable public lists they can explore and claim from.
- **My Managed Customers:** Non-registered customers they manage.
- **My Offers:** Books they are proactively offering (see B4).

#### B2. Claiming Books

- Collector views a list (via invitation or public link).
- Clicks "Claim" on a `pending` entry → status becomes `claimed`, `assigned_collector_id` is set.
- Collector progresses the status through their workflow.
- **Cannot unclaim** — if they can't find it, they set `not_found` which auto-unassigns.

#### B3. Managed (Non-Registered) Customers

- A collector can create a customer profile: `name`, `phone` (optional), `notes`, `is_managed = true`, `managed_by = collector_id`.
- Collector can create lists on behalf of this customer and add books.
- **Book list import via LLM:** Collector pastes raw text (e.g., a WhatsApp message, a photo-extracted list, a spreadsheet dump) or uploads a file. The system sends it to an LLM with a formatting prompt + the expected JSON schema. The LLM returns structured data. The collector sees a **preview table** to review, edit, and confirm before import.
  - Provide a downloadable **template** (CSV or JSON) so collectors know the expected format for manual imports too.
  - **Caution:** LLM output MUST be validated row-by-row. Missing `title` or `author_name` → flag the row, don't silently skip.
  - **UX:** Show a diff-like preview: "We found 15 books. 12 matched existing pool entries. 3 are new. [Confirm Import]".

#### B4. Collector Offers & Announcements

Collectors can proactively list books they have available or special deals:

```
collector_offers
├── id (PK)
├── collector_id (FK)
├── book_id (FK, nullable — can be a new book not in pool yet)
├── title_override (TEXT, for books not in pool)
├── description (TEXT — e.g., "Last copy, excellent condition")
├── price (DECIMAL, nullable)
├── quantity (INTEGER, default 1)
├── offer_type (ENUM: 'available', 'limited', 'last_piece')
├── visibility (ENUM: 'public', 'targeted')
├── created_at, expires_at (nullable)
```

- **Public offers:** Visible to all customers on an "Offers" feed/page.
- **Targeted offers:** Collector selects specific customers (or managed customers) to notify.
- **Notifications:** When a collector creates a targeted offer, the intended customers receive a notification.
- When a customer is interested, they can add the book to one of their lists directly from the offer, and it's auto-assigned to that collector.

---

### Feature Group C: Shipping & Fulfillment

#### C1. Shipping Flow

Once a collector sets status to `shipped`:
- **Shipping notes:** Free-text field for tracking serial / carrier name / estimated delivery.
- **Shipping sticker attachment:** File upload (image or PDF) of the shipping label/receipt.
- Store in a `shipments` table or as fields on `list_entries`:
  - `shipping_notes` (TEXT), `shipping_tracking_serial` (TEXT), `shipping_sticker_path` (TEXT), `shipped_at` (DATETIME).
- The customer can view this info and attempt to track via their carrier's external system (no in-app tracking integration needed — just display the serial).

#### C2. Delivery Confirmation

- Either the customer or the collector can mark an entry as `delivered`.
- Optional: `delivery_notes`, `delivered_at`.

---

### Feature Group D: Notifications

#### D1. Notification Events

| Event | Recipient | Trigger |
|---|---|---|
| List shared (invitation) | Collector | Customer invites collector to a list |
| Book claimed | Customer | Collector claims a book from their list |
| Status updated | Customer | Collector updates status (in_progress, sourced, shipped, not_found) |
| Book delivered | Collector | Customer confirms delivery |
| New offer (targeted) | Specific customers | Collector creates targeted offer |
| New offer (public) | All customers (optional) | Collector creates public offer — could be a feed rather than push |
| List updated | Invited collectors | Customer adds/removes/reorders books on a shared list |

#### D2. Implementation Notes

- Start with **in-app notifications** (a `notifications` table: `id`, `user_id`, `type`, `payload` JSON, `read`, `created_at`).
- Frontend: poll or use SSE (Server-Sent Events) for real-time updates.
  - **NestJS SSE:** Use `@Sse()` decorator with `Observable<MessageEvent>`. Lightweight and built-in.
- Future: email or push notifications can be layered on.

---

### Feature Group E: Search & Filtering

#### E1. Book Pool Search

- Fields: `title`, `author_name`, `publisher`.
- Match against normalized (diacritics-stripped) columns.
- Return results ranked by relevance (exact match → starts with → contains).
- Endpoint: `GET /books/search?q=term&limit=20`.

#### E2. List Filtering

- Customer's own lists: filter entries by `status`, `priority`, `assigned_collector`.
- Collector's view: filter by `status`, `customer`, `list`.

---

## API Design Guidelines

- RESTful. Prefix all routes with `/api/v1/`.
- Use consistent response envelope: `{ success: boolean, data: T, message?: string, errors?: [] }`.
- Pagination: `?page=1&limit=20` with response metadata `{ total, page, limit, totalPages }`.
- Auth: Bearer JWT on all protected routes. Use NestJS Guards (`@UseGuards(JwtAuthGuard, RolesGuard)`).
- Validation: Use `class-validator` DTOs on all inputs. Fail fast with 400.
- **Arabic content:** Accept and store UTF-8. Ensure `Content-Type: application/json; charset=utf-8` headers. PostgreSQL handles UTF-8 natively.

---

## Database Design Notes

- **No ORM.** All queries are raw SQL via `pg` driver.
- Use migrations: sequential `.sql` files in `/migrations` folder with a custom runner.
- **Foreign keys:** PostgreSQL enforces foreign keys by default.
- **Timestamps:** Store as `TIMESTAMPTZ` for timezone-aware timestamps.
- **Soft deletes:** Use `deleted_at` column where needed (lists, entries) rather than hard deletes.

---

## Summary: Entity Relationship Overview

```
Users (customers + collectors)
 ├── Books (shared pool)
 │    └── BookImages
 ├── Lists (owned by customer)
 │    ├── ListEntries (book + status + priority + assigned_collector)
 │    │    └── Shipments (tracking, sticker)
 │    └── ListInvitations (collector invites)
 ├── CollectorOffers
 │    └── OfferTargets (specific customers)
 ├── ManagedCustomers (created by collector)
 └── Notifications
```

---

## Out of Scope (For Now)

- Payment processing / in-app payments.
- In-app chat between customer and collector.
- Mobile app (web-responsive only).
- Book reviews or ratings.
- Multi-language book metadata (one entry per book, stored in original language).
- Advanced analytics/reporting dashboard.

---

## Implementation Priority (Suggested)

1. **Book Pool** — search, create, images (shared foundation).
2. **Customer Lists** — CRUD, entries, priority, reorder.
3. **Sharing** — public links + collector invitations.
4. **Collector Claiming** — claim flow, status progression.
5. **Collector Dashboard** — my claims, shared lists, managed customers.
6. **Shipping** — status, notes, tracking, sticker upload.
7. **Notifications** — in-app notification system.
8. **Collector Offers** — offer creation, public/targeted, feed.
9. **LLM Import** — book list formatting and import pipeline.
10. **Polish** — RTL refinement, search improvements (FTS5), UX.
