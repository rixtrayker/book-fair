# Kotobgy — Business Requirements Document

> **كتبجي** (Kotobgy) — Book Sourcing & Fair Management Platform

---

## Executive Summary

**Kotobgy** is a bilingual (Arabic-first) platform that bridges the gap between book enthusiasts and professional book sourcers (collectors). The platform operates in two modes: seasonal book fair management and year-round book sourcing services.

---

## Problem Statement

### The Challenge

1. **Book Fair Season**: Customers struggle to navigate massive book fairs, remember what they want, and communicate their needs to collectors who work the fairs.

2. **Year-Round Sourcing**: Book enthusiasts want books that aren't readily available locally. They need someone trustworthy to find, acquire, and ship these books to them.

3. **Collector Inefficiency**: Collectors waste time managing scattered requests via WhatsApp, phone calls, and paper notes with no centralized system.

### The Solution

A unified platform where:
- Customers create organized, shareable book wish lists
- Collectors view, claim, and fulfill requests systematically
- Everyone tracks progress from request to delivery

---

## Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Customers** | Organized lists, transparent tracking, trusted sourcers, no more scattered WhatsApp requests |
| **Collectors** | Centralized request management, clear workflows, customer relationship building, business growth |
| **Fair Organizers** | Demand insights, reduced chaos, better customer experience |

---

## User Personas

### Persona 1: The Book Enthusiast (Customer)

**Name**: Ahmed, 32, Software Engineer

**Goals**:
- Find rare Arabic literature and technical books
- Track multiple orders from different collectors
- Avoid losing requests in chat apps

**Pain Points**:
- Books get lost in WhatsApp conversations
- No visibility into sourcing progress
- Hard to prioritize which books to order first

**Behaviors**:
- Creates themed lists ("Arabic Poetry", "Programming Books")
- Shares lists with trusted collectors
- Tracks delivery status regularly

---

### Persona 2: The Professional Collector

**Name**: Fatima, 28, Book Fair Veteran

**Goals**:
- Manage multiple customer requests efficiently
- Build reputation and customer base
- Track earnings per book/order

**Pain Points**:
- Requests scattered across chat apps
- Hard to remember which customer wanted which book
- No system to show customers her progress

**Behaviors**:
- Claims books from multiple lists
- Updates status as she sources
- Creates offers for books she has in stock

---

### Persona 3: The Managed Customer

**Name**: Umm Hassan, 55, Homemaker

**Goals**:
- Get books for her children without using technology
- Trust a collector to handle everything

**Pain Points**:
- Not comfortable with apps
- Prefers phone/in-person communication
- Wants someone to handle the entire process

**Behaviors**:
- Collector creates account on her behalf
- Communicates via phone with collector
- Collector manages her lists entirely

---

### Persona 4: The Super Admin

**Name**: Platform Owner

**Goals**:
- Oversee platform health
- Manage user accounts
- Control feature rollouts

**Behaviors**:
- Reviews flagged content
- Manages collector verification
- Views system analytics

---

## User Journeys

### Journey 1: Customer Creates and Shares a List

```
1. Customer logs in → Dashboard
2. Creates new list "My Must-Haves"
3. Searches book pool for "الأمير الصغير"
   ├─ Found? → Add to list, set priority
   └─ Not found? → Create new book entry → Add to list
4. Repeats for more books
5. Reorders books by drag-and-drop
6. Shares list:
   ├─ Public link → Send to any collector
   └─ Invite specific collector → Collector gets notification
7. Waits for claims and updates
```

---

### Journey 2: Collector Claims and Fulfills

```
1. Collector logs in → Dashboard
2. Views "Shared With Me" or browses public lists
3. Opens customer list
4. Claims "pending" books → Status: claimed
5. Sources books at fair/shops
6. Updates status: claimed → in_progress → sourced
7. Ships books:
   ├─ Status: shipped
   ├─ Adds tracking number
   └─ Uploads shipping sticker
8. Customer confirms delivery → Status: delivered
```

---

### Journey 3: Collector Creates Managed Customer

```
1. Collector creates customer profile
   ├─ Name: "Umm Hassan"
   ├─ Phone: "+20..."
   └─ Notes: "Prefers phone calls"
2. Creates list "Umm Hassan's Books"
3. Adds books to list
4. Sources and ships books
5. Calls Umm Hassan for delivery coordination
```

---

### Journey 4: LLM-Assisted Book Import

```
1. Collector receives WhatsApp list from customer
2. Collector pastes raw text into import tool
3. LLM parses and formats:
   ├─ Extracts title, author, quantity
   └─ Matches against existing book pool
4. Preview shows:
   ├─ 12 books matched existing entries
   └─ 3 new books to create
5. Collector reviews, edits if needed
6. Confirms import → Books added to list
```

---

## Business Rules

### List Management

| Rule | Description |
|------|-------------|
| Multiple lists | Customer can create unlimited lists |
| Visibility | Lists are private by default; can be made public via share token |
| Invitations | Customer can invite specific collectors to private lists |
| Ownership | Only list owner can delete the list |
| Soft delete | Lists are soft-deleted; can be restored by admin |

---

### Book Entry Statuses

| Status | Set By | Transition Rules |
|--------|--------|------------------|
| `pending` | System | Default state; any collector can claim |
| `claimed` | Collector | Irreversible by collector; only customer can revert |
| `in_progress` | Collector | Requires `claimed` first |
| `sourced` | Collector | Book is in collector's possession |
| `shipped` | Collector | Requires tracking info |
| `delivered` | Customer/Collector | Final state |
| `not_found` | Collector | Auto-unassigns collector; reverts to pending |
| `cancelled` | Customer | Only customer can cancel |

---

### Claiming Rules

| Rule | Description |
|------|-------------|
| One collector | Only one collector can be assigned per book entry |
| First claim wins | First collector to claim gets the assignment |
| Cannot unclaim | Collector cannot self-unassign; must use `not_found` |
| Customer override | Customer can unassign collector (revert to pending) |

---

### Priority System

| Priority | Meaning | Use Case |
|----------|---------|----------|
| 1 (Low) | "Eventually" | Wishlist, not urgent |
| 2 | "Nice to have" | Would like but not critical |
| 3 (Medium) | "Interested" | Standard priority |
| 4 | "Want soon" | Higher priority |
| 5 (High) | "Urgent" | Need ASAP, willing to pay premium |

---

### Price Visibility

| Viewer | Can See Price? |
|--------|----------------|
| List owner (customer) | Yes |
| Assigned collector | Yes |
| Other collectors | No |
| Public viewers | No |

---

### Managed Customers

| Rule | Description |
|------|-------------|
| Created by collector | Collector creates profile with name, phone, notes |
| Flagged as managed | `is_managed = true`, `managed_by = collector_id` |
| Account claim | Managed customer can later claim account with email/password |
| Collector access | Creating collector has full access to customer's lists |

---

## Feature Scope

### MVP Features (Implemented)

| Feature | Status |
|---------|--------|
| User registration (customer, collector) | Done |
| Authentication (JWT) | Done |
| Book pool with search | Done |
| Customer lists (CRUD) | Done |
| List entries with priority | Done |
| Soft delete | Done |
| Pagination | Done |
| Arabic/English i18n | Done |
| Notifications backend | Done |
| Collector role support | Done |

---

### High Priority (Next Phase)

| Feature | Description |
|---------|-------------|
| List sharing UI | Public links + collector invitations |
| Book claiming UI | Claim button, status progression |
| Collector dashboard | My claims, shared lists, managed customers |
| Notifications UI | Bell icon, notification list |
| Shipping tracking | Status updates, tracking numbers |

---

### Medium Priority

| Feature | Description |
|---------|-------------|
| Managed customers UI | Create managed profiles |
| Collector offers | Proactive book offerings |
| Drag-and-drop reorder | Manual list ordering |
| Book cover uploads | Multiple images per book |

---

### Low Priority (Future)

| Feature | Description |
|---------|-------------|
| LLM import | Parse unstructured book lists |
| Email notifications | Email alerts for key events |
| Analytics dashboard | Insights for collectors |
| Price negotiation | In-app price discussions |

---

## Notification Events

| Event | Recipient | Trigger |
|-------|-----------|---------|
| List invitation | Collector | Customer invites to private list |
| Book claimed | Customer | Collector claims a book |
| Status update | Customer | Collector updates status |
| Shipped | Customer | Collector marks as shipped |
| Delivered | Collector | Customer confirms delivery |
| Not found | Customer | Collector marks as not found |
| New offer (targeted) | Specific customers | Collector creates targeted offer |
| List updated | Invited collectors | Customer modifies shared list |

---

## Success Metrics

### Customer Metrics

| Metric | Target |
|--------|--------|
| Books added per user | 10+ per month |
| List shares | 50% of lists shared |
| Delivery confirmation rate | 90%+ |

### Collector Metrics

| Metric | Target |
|--------|--------|
| Claims per collector | 20+ per month |
| Fulfillment rate | 80%+ (not `not_found`) |
| Response time | <48 hours to claim |

### Platform Metrics

| Metric | Target |
|--------|--------|
| Daily active users | 100+ during fair season |
| Book pool size | 10,000+ unique books |
| Repeat customers | 60%+ return |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing | Cash/direct payment preferred |
| In-app chat | WhatsApp already works; avoid complexity |
| Mobile app | Web-responsive PWA sufficient |
| Book reviews | Not core to sourcing workflow |
| Multi-language metadata | Store in original language only |
| Advanced analytics | Future enhancement |

---

## Arabic-First UX Guidelines

### RTL Layout

- All layouts support `dir="rtl"`
- Use logical CSS properties (`ps-4`, `ms-2` instead of `pl-4`, `ml-2`)
- Icons flip appropriately for RTL

### Typography

- Arabic font stack: `Tajawal`, `Cairo`, `Noto Sans Arabic`
- Line height increased for Arabic readability
- Text alignment defaults to `start` (right in RTL)

### Search

- Normalize Arabic text (strip diacritics) for search
- Support Alef variants (ا, أ, إ, آ)
- Support Teh Marbuta (ة) and Heh (ه) equivalence

### Content

- All UI text in Arabic with English translation
- Error messages in user's preferred language
- System notifications in Arabic by default

---

## Glossary

| Term (AR) | Term (EN) | Definition |
|-----------|-----------|------------|
| كتبجي | Kotobgy | Book sourcer/collector |
| قائمة | List | Customer's book wish list |
| جامع كتب | Collector | Book sourcing professional |
| معرض الكتاب | Book Fair | Cairo International Book Fair |
| مصدر | Sourced | Book found and acquired |
| مشحون | Shipped | Book in transit |

---

## Contact & Support

For business inquiries, feature requests, or partnership opportunities:
- GitHub: [github.com/rixtrayker/book-fair](https://github.com/rixtrayker/book-fair)

---

*Document Version: 1.0 | Last Updated: 2026-02-24*
