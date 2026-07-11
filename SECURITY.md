# IS TWO (Love Nest) -- Security Policy

This document outlines security practices, whitelisting mechanisms, and credentials management for the IS TWO couples application.

---

## 1. Access Whitelisting (Cryptographic Validation)

To protect the privacy of the couple, access is guarded at two levels:

### Client & API Verification
1. When the Telegram Mini App starts, it obtains the initialization data (`initData`) from the Telegram WebApp SDK.
2. Next.js API routes validate this `initData` cryptographically using the `TELEGRAM_BOT_TOKEN` as a secret key to ensure the request is genuinely coming from Telegram.
3. The parsed Telegram User ID is matched against `ALLOWED_TELEGRAM_IDS` in the environment variables.

### Bot Polling Check
1. The Telegram bot only responds to commands from IDs present in the `ALLOWED_TELEGRAM_IDS` list.
2. Any unauthorized user interacting with the bot will be ignored or presented with a static access-denied message.

---

## 2. Secrets Management

* **Never commit the `.env` file** to git. It contains production database credentials and your Telegram Bot token. The `.gitignore` file is pre-configured to block it.
* When deploying to hosting platforms like Vercel or Supabase, use their environment variable management interface rather than hardcoding values.
* If your `TELEGRAM_BOT_TOKEN` is exposed, regenerate it immediately via [@BotFather](https://t.me/BotFather).

---

## 3. Database Security

* Use transaction-pooled connection strings (`DATABASE_URL` via port `6543`) for application requests.
* Use direct connection strings (`DIRECT_URL` via port `5432`) only for migrations.
* Never expose your direct connection string publicly.
