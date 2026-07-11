---
name: love-nest-mini-app
description: Developer guide for building, running, and modifying the IS TWO couples mini-app
arguments: action
user_invocable: true
user-invocable: true
argument-hint: "[run-dev | run-bot | db-migrate | db-status | doctor]"
license: MIT
---

# Love Nest Mini App (IS TWO) -- Agent Skill Router

This workspace customization skill assists developer agents working on the `love-nest-mini-app` (IS TWO) codebase. It maps specific user requests to proper developer CLI commands and explains the core architectural constraints.

## Technical Stack Quick Reference

* **Frontend & Backend:** Next.js 16 (App Router, React 19)
* **Styling:** Tailwind CSS 4 + custom Glassmorphism tokens
* **Database & ORM:** PostgreSQL (Supabase) + Prisma client
* **Telegram Integration:** Telegram WebApp SDK + grammY bot notifications

## Action Routing

Determine the developer action from the input parameter:

| Action Input | CLI Command / Behavior | Description |
|---|---|---|
| `run-dev` | `npm run dev` | Run the Next.js development server locally |
| `run-bot` | `npm run bot` | Run the Telegram bot polling listener |
| `db-migrate` | `DATABASE_URL=$DIRECT_URL npx prisma migrate dev` | Apply or generate Prisma schema database migrations |
| `db-status` | `DATABASE_URL=$DIRECT_URL npx prisma migrate status` | Check status of applied database migrations |
| `doctor` | `node doctor.mjs` | Run the project environment sanity/diagnostic check |

If the user asks to start, test, or verify the database/server, run the corresponding command after obtaining authorization.

## Critical Guidelines for Developer Agents

1. **Next.js conventions:** Check the `AGENTS.md` and standard nextjs documentation. Heed deprecations.
2. **Database Optimization:** Heavy Base64 image strings (such as uploaded photos) MUST NOT be saved in the primary tables. They must live in separate 1:1 models (`DateEventPhoto` and `WishlistItemPhoto`) to keep SELECT queries fast.
3. **Whitelist Restrictions:** Ensure any API or Bot route validates user requests against `ALLOWED_TELEGRAM_IDS` listed in the environment variables.
4. **Style Tokens:** When editing styles, use Tailwind CSS 4 variables and class helpers. Maintain the premium glassmorphic aesthetic (e.g. `backdrop-blur-md`, semi-transparent borders `border-white/10`, and dark mode friendly palettes).
