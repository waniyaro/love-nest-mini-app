import { Bot } from "grammy";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Initialize bot. If token is missing, we use a dummy string so the build/compile doesn't fail.
export const bot = new Bot(botToken || "dummy_token");

// Handle bot command handlers
if (botToken && botToken !== "YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER" && botToken !== "dummy_token") {
  bot.command("start", async (ctx) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://love-nest-mini-app.vercel.app";
    const startParam = ctx.match;
    
    let webAppUrl = appUrl;
    if (startParam) {
      const separator = appUrl.includes("?") ? "&" : "?";
      webAppUrl = `${appUrl}${separator}tgWebAppStartParam=${startParam}`;
    }

    await ctx.reply(
      "💖 *Добро пожаловать в IS TWO!* 💖\n\nВаше уютное цифровое пространство для двоих. Здесь вы можете:\n" +
      "• Отсчитывать дни ваших отношений\n" +
      "• Планировать романтические свидания\n" +
      "• Вести общий календарь знаменательных дат\n" +
      "• Делиться вишлистами товаров\n\n" +
      "Нажмите на кнопку ниже, чтобы войти в ваше гнездышко! 👇",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Открыть IS TWO 🌸",
                web_app: { url: webAppUrl },
              },
            ],
          ],
        },
      }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📝 *Справка IS TWO Bot*\n\n" +
      "Этот бот служит мостом для доступа к вашему приложению и присылает уведомления о событиях.\n\n" +
      "• Используйте /start, чтобы получить ссылку на приложение.\n" +
      "• Бот автоматически пришлет вам сообщение, когда ваш партнер запланирует новое свидание!",
      { parse_mode: "Markdown" }
    );
  });

  // Echo/Catch-all handler
  bot.on("message", async (ctx) => {
    await ctx.reply(
      "Сладенькие, используйте кнопку в меню или команду /start, чтобы запустить приложение! 🌸"
    );
  });
}

/**
 * Sends a direct message to a whitelisted Telegram user.
 */
export async function sendTelegramNotification(telegramId: string, message: string) {
  if (!botToken || botToken === "YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER" || botToken === "dummy_token") {
    console.log(`[Bot Mock Notification to ${telegramId}]: ${message}`);
    return false;
  }

  try {
    await bot.api.sendMessage(telegramId, message, { parse_mode: "HTML" });
    return true;
  } catch (error) {
    console.error(`Failed to send Telegram notification to ${telegramId}:`, error);
    return false;
  }
}
