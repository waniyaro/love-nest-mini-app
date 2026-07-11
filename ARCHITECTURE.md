# IS TWO (Love Nest) -- Architecture & System Design

This document details the high-level system design, data flows, and architectural conventions of the IS TWO couples application.

---

## 1. High-Level Component Map

The application consists of three main components: a web frontend (Next.js), a database (Supabase PostgreSQL via Prisma), and a notification bot (grammY Telegram Bot).

```
┌────────────────────────────────────────────────────────┐
│                      TELEGRAM CLIENT                   │
│                                                        │
│   ┌───────────────────┐        ┌───────────────────┐   │
│   │  Partner A (App)  │        │ Partner B (Chat)  │   │
│   └─────────┬─────────┘        └─────────▲─────────┘   │
└─────────────┼────────────────────────────┼─────────────┘
              │ 1. Plan Date               │ 3. Receive Notify
              ▼                            │
┌─────────────┼─────────┐        ┌─────────┴─────────┐
│         Next.js       │───────►│    grammY Bot     │ (Polling/Webhook)
│      (App Router)     │ 2. API │ (src/bot-polling) │
└─────────────┬─────────┘        └─────────┬─────────┘
              │                            │
              │                            │
              ▼                            ▼
   ┌───────────────────┐         ┌───────────────────┐
   │    Prisma ORM     │◄────────│    Prisma ORM     │ (Updates Status)
   └──────────┬────────┘         └─────────┬─────────┘
              │                            │
              └──────────────┬─────────────┘
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │ (Supabase)
                    └─────────────────┘
```

### Components

1. **Next.js WebApp:**
   * Acts as both the web frontend (pages) and backend (API routes).
   * Loaded within Telegram's native in-app Webview.
   * Accesses device hardware, native modals, back buttons, and haptics via the Telegram WebApp SDK (`Window.Telegram.WebApp`).

2. **grammY Bot (`src/bot-polling.ts` / `src/lib/bot.ts`):**
   * Long-running process that listens to commands (e.g., `/start`, `/help`) and serves as the gateway URL config.
   * Exposes utility functions (`sendTelegramNotification`) used by Next.js API routes to push real-time alerts to the partners.

3. **Prisma Client & Database:**
   * Single source of truth.
   * PostgreSQL database hosted on Supabase.
   * Integrated with Prisma Schema for automated migrations and strict relations.

---

## 2. Core Data Flow: Planning a Date

1. **Creation:** Partner A opens the Mini App, enters date details (`/dates/new`), and submits the form.
2. **Notification Event:**
   * The API route `src/app/api/dates/route.ts` saves the event in the `DateEvent` table with `status: "pending"`.
   * The route calls `sendTelegramNotification` for Partner B.
3. **Delivery:** The Telegram Bot sends a card to Partner B with a quick-action login button.
4. **Acceptance:**
   * Partner B clicks the button, opens the Mini App date details view, and accepts the invitation.
   * Next.js updates the database to `status: "accepted"`.
   * Next.js triggers a notification back to Partner A ("Your date has been accepted! 🌸").

---

## 3. Database Design Patterns

### Decoupled Base64 Storage (Important)

Saving binary files or heavy Base64 strings directly in tables can severely slow down `SELECT` queries for lists (such as loading the main dashboard or dates calendar).

To keep operations fast, photos are stored in separate, decoupled 1:1 models:
* `DateEvent` has a 1:1 relation to `DateEventPhoto`.
* `WishlistItem` has a 1:1 relation to `WishlistItemPhoto`.

**Rule:**
When querying lists of items, never include the photo relation:
```typescript
// Fast list query
const items = await prisma.wishlistItem.findMany({
  where: { coupleId }
});
```

Only query the photo relation when rendering a detail page:
```typescript
// Detail query
const item = await prisma.wishlistItem.findUnique({
  where: { id },
  include: { photoRelation: true }
});
```

---

## 4. Authentication and Whitelisting

Because this is a private application for a single couple, traditional passwords and registrations are omitted:
1. When loading, the Next.js frontend retrieves the user's Telegram ID from the `Telegram.WebApp.initData` (validated cryptographically on the backend).
2. The user ID is checked against `ALLOWED_TELEGRAM_IDS` in `.env` (a comma-separated string containing exactly two IDs).
3. If the ID is missing from the whitelist, the system rejects the connection immediately.
