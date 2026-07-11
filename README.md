# IS TWO — Telegram Mini App для пар

<p align="center">
  <img src="public/hero-banner.png" alt="IS TWO - Love Nest couples application" width="800">
</p>

<p align="center">
  <em>Уютное цифровое гнездышко для двоих. Сохраняйте воспоминания, планируйте свидания и делитесь желаниями.</em><br>
  <strong>Приватное пространство с доступом только для вашей пары.</strong>
</p>



---

## 🌸 Скриншоты интерфейса

| Главный экран | Детали свидания |
| :---: | :---: |
| ![Dashboard](public/screenshots/dashboard.png) | ![Date Details](public/screenshots/dates.png) |

| Общий вишлист / Места | Календарь событий |
| :---: | :---: |
| ![Wishlist](public/screenshots/wishlist.png) | ![Calendar](public/screenshots/calendar.png) |

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
