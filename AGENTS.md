<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# IS TWO (Love Nest) -- AI Developer Agent Guide

Welcome, Agent! This document is the source of truth for the codebase conventions, project architecture, constraints, and operational scripts of the IS TWO couples application.

---

## 1. Project Architecture & Components

IS TWO is a Telegram Mini App designed for couples to share memories, events, favorites, and wishlists.

```
                    ┌────────────────────────┐
                    │  Telegram WebApp SDK   │ (Client UI inside Telegram)
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Next.js App       │ (App Router React 19 UI & Next.js API Routes)
                    └────┬──────────────┬────┘
                         │              │
                         ▼              ▼
              ┌─────────────┐        ┌─────────────┐
              │  Prisma ORM │        │ grammY Bot  │ (Telegram notification system)
              └──────┬──────┘        └──────┬──────┘
                     │                      │
                     ▼                      ▼
             ┌──────────────┐        ┌──────────────┐
             │  PostgreSQL  │        │ Telegram API │ (Sends direct notifications)
             │  (Supabase)  │        └──────────────┘
             └──────────────┘
```

### Key Directories

| Directory/File | Function |
|---|---|
| [src/app/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/app) | Next.js routes, API handlers, layouts and pages. |
| [src/components/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/components) | UI components (dashboards, cards, modals, form inputs). |
| [src/lib/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib) | Shared utilities: Prisma Client ([prisma.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/prisma.ts)), Telegram Bot Client ([bot.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/bot.ts)), and scheduler ([scheduler.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/scheduler.ts)). |
| [prisma/schema.prisma](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/prisma/schema.prisma) | Database schema defining models and relationships. |
| [doctor.mjs](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/doctor.mjs) | Diagnostic script to verify the local environment. |

---

## 2. Technical Contracts & Core Constraints

As a developer agent, you must strictly follow these rules to maintain database performance and application security.

### 🚨 Database Optimization: Base64 Decoupling (CRITICAL)
* Heavy Base64 image strings (such as uploaded photos) **MUST NOT** be saved in the primary tables.
* Decouple photos into dedicated 1:1 models: `DateEventPhoto` and `WishlistItemPhoto`.
* This prevents slow `SELECT` queries when loading lists of items since Prisma does not query these relation tables unless explicitly requested using `include`.
* **Example:** When querying a list of dates, only select fields from `DateEvent`. Query the associated `DateEventPhoto` only when displaying a single date details page.

### 🔒 Access Whitelist
* Access to the app is restricted via Telegram ID checks.
* The API and Bot routes must validate incoming Telegram IDs against the `ALLOWED_TELEGRAM_IDS` environment variable.
* Always check if `ALLOWED_TELEGRAM_IDS` contains the user's ID before performing database reads/writes.

---

## 3. Operations & Quick Commands

To test, build, or verify the codebase, use these NPM commands:

* **Diagnostic Check:** `npm run doctor` (runs [doctor.mjs](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/doctor.mjs))
* **Local Web Server:** `npm run dev` (starts the Next.js dev server)
* **Local Bot Polling:** `npm run bot` (starts the Telegram bot long polling listener)
* **Prisma Generate:** `npm run db:generate` (runs `npx prisma generate`)
* **Prisma Migrate dev:** `npm run db:migrate` (runs `DATABASE_URL=$DIRECT_URL npx prisma migrate dev`)
* **Prisma Migration status:** `npm run db:status` (runs `DATABASE_URL=$DIRECT_URL npx prisma migrate status`)

---

## 4. Code and Style Guide (Tailwind CSS 4)

* The design uses a premium, modern Glassmorphic style.
* Use background blurs (`backdrop-blur-md`), dark mode values, semi-transparent borders (`border-white/10`), and tailored gradients.
* Respect standard TypeScript/React conventions.
