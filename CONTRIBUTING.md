# IS TWO (Love Nest) -- Contribution & Developer Guide

This guide outlines how to set up the development environment, modify the database, configure bot commands, and maintain the application's user interface design standards.

---

## 1. Local Development Setup

To get the application running locally:

### Prerequisites
* Node.js (v18+)
* PostgreSQL database instance (local or Supabase)
* A Telegram Bot token (obtained from [@BotFather](https://t.me/BotFather))

### Step-by-Step
1. **Clone and Install:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   *Make sure `ALLOWED_TELEGRAM_IDS` contains your personal Telegram ID so you can bypass the whitelist check.*

3. **Verify Configuration:**
   Run the diagnostics script to ensure everything is set up:
   ```bash
   npm run doctor
   ```

4. **Initialize Database:**
   Generate the Prisma Client and apply migrations:
   ```bash
   npm run db:generate
   ```

5. **Start Dev Processes:**
   You will need to run the Next.js development server and the Telegram Bot process in parallel:
   ```bash
   # Terminal 1 (Next.js server)
   npm run dev

   # Terminal 2 (Telegram Bot Polling)
   npm run bot
   ```

---

## 2. Modifying the Database Schema

If you need to add or update database models:
1. Edit [prisma/schema.prisma](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/prisma/schema.prisma).
2. Generate the new client and create a migration:
   ```bash
   npm run db:migrate
   ```
3. Run the generator to sync TypeScript types:
   ```bash
   npm run db:generate
   ```

*Remember to follow the Base64 Decoupling pattern: never store heavy attachments directly in main tables.*

---

## 3. UI Design Standards: Glassmorphism

The application has a premium, responsive Glassmorphism layout designed for mobile webviews. To maintain this aesthetic:

### Background & Cards
* Use transparent, blurred layers: `bg-white/10 backdrop-blur-md`
* Use thin, soft borders: `border border-white/10`
* Use rounded corners for elements: `rounded-2xl` or `rounded-3xl`
* Ensure elements are readable against the background gradient by applying appropriate drop shadows: `shadow-lg shadow-black/5`

### Text & Elements
* Primary text: `text-white`
* Secondary text: `text-white/60`
* Accents and interactive states: `rose-400` / `indigo-400` with soft transitions (`transition-all duration-300`)

---

## 4. Quality Checks

Before committing any changes:
* Run ESLint to verify there are no formatting or lint errors:
  ```bash
  npm run lint
  ```
* Run the doctor script to check environment status:
  ```bash
  npm run doctor
  ```
