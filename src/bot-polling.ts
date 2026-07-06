import "dotenv/config";
import { bot } from "./lib/bot";

console.log("🌸 Starting Telegram Bot in Long Polling mode...");

bot.catch((err) => {
  console.error("Error in bot execution:", err);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`🤖 Bot @${botInfo.username} is running and listening for messages!`);
  },
});
