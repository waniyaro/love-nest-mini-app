# IS TWO — Telegram Mini App для пар

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Telegram_Mini_App-24A1DE?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Mini App">
  <img src="https://img.shields.io/badge/Next.js-v19.0-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/grammY_Bot-F1C40F?logo=telegram&logoColor=white" alt="grammY Bot">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
</p>

<p align="center">
  <em>Уютное цифровое гнездышко для двоих. Сохраняйте воспоминания, планируйте свидания и делитесь желаниями.</em><br>
  <strong>Приватное пространство с доступом только для вашей пары.</strong>
</p>


| Directory/File | Function |
|---|---|
| [src/app/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/app) | Next.js routes, API handlers, layouts and pages. |
| [src/components/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/components) | UI components (dashboards, cards, modals, form inputs). |
| [src/lib/](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib) | Shared utilities: Prisma Client ([prisma.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/prisma.ts)), Telegram Bot Client ([bot.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/bot.ts)), and scheduler ([scheduler.ts](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/src/lib/scheduler.ts)). |
| [prisma/schema.prisma](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/prisma/schema.prisma) | Database schema defining models and relationships. |
| [doctor.mjs](file:///Users/waniyaro/.gemini/antigravity-ide/scratch/love-nest-mini-app/doctor.mjs) | Diagnostic script to verify the local environment. |
---

## 🔄 Схема взаимодействия партнеров

```mermaid
flowchart TD
    UserA[Партнер A] -->|1. Назначает свидание| Next[Next.js App]
    Next -->|2. Отправляет оповещение| Bot[Telegram Bot]
    Bot -->|3. Присылает сообщение| UserB[Партнер B]
    UserB -->|4. Открывает Mini App| Webview[Telegram Webview]
    Webview -->|5. Нативно подтверждает встречу| Next
    Next -->|6. Присылает ответ| UserA
    
    style UserA fill:#f43f5e,stroke:#fff,stroke-width:2px,color:#fff
    style UserB fill:#6366f1,stroke:#fff,stroke-width:2px,color:#fff
    style Bot fill:#38bdf8,stroke:#fff,stroke-width:2px,color:#fff
    style Webview fill:#ec4899,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 🌟 Ключевые возможности

| Раздел | Описание | Особенности |
|---|---|---|
| **📊 Главный дашборд** | Общий счетчик дней отношений, статус партнера в реальном времени, панель быстрой навигации. | Анимированные счетчики, индикация онлайна. |
| **📅 Планирование свиданий (`/dates`)** | Создание приглашений на свидания, заполнение отзывов, загрузка памятных фотографий. |  Клиентское сжатие картинок, Telegram оповещения. |
| **💖 Общий вишлист & Места (`/wishlist`)** | Разделение на материальные подарки и места, которые вы хотите посетить вдвоем. | Оценка интереса (1-5 сердечек) с обеих сторон. |
| **🎶 Наше любимое (`/favorites`)** | Персональные списки лучшего: фильмов, музыки, книг, мест с личными рецензиями. | Раздельные заметки для каждого из партнеров. |
| **🗓️ Календарь событий (`/calendar`)** | Памятные даты, годовщины, дни рождения с автоматическим расчетом возраста отношений. | Умные пуш-уведомления об общих годовщинах. |

---

## 🚀 Быстрый запуск

### 1. Настройка окружения
Создайте файл `.env` в корневой директории по шаблону `.env.example`:
```env
TELEGRAM_BOT_TOKEN="your_bot_token"
NEXT_PUBLIC_BOT_USERNAME="your_bot_username"
ALLOWED_TELEGRAM_IDS="id_1,id_2"
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
NODE_ENV="development"
```

### 2. Установка зависимостей и проверка
```bash
npm install
npm run doctor # Запуск автоматической диагностики окружения
```

### 3. Настройка базы данных (Prisma)
Примените миграции и сгенерируйте типы:
```bash
npm run db:generate
npm run db:migrate
```

### 4. Запуск локального сервера
Вам понадобится запустить два процесса в разных терминалах:
```bash
# Терминал 1: запуск Next.js веб-сервера
npm run dev

# Терминал 2: запуск Telegram бота (Long Polling)
npm run bot
```

---

## ⚙️ Оптимизации базы данных (Base64 Decoupling)
Для поддержания высокой производительности приложения, тяжелые Base64 строки фотографий свиданий (`DateEventPhoto`) и вишлиста (`WishlistItemPhoto`) вынесены в отдельные таблицы с отношением 1:1. Это предотвращает замедление списочных запросов `SELECT` — фотографии подгружаются через `include` только при переходе на детальные экраны элементов.
