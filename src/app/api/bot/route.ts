import { bot } from "@/lib/bot";

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken || botToken === "YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER") {
    return new Response("Bot token not configured", { status: 500 });
  }

  try {
    const body = await req.json();
    // Handle the update asynchronously to avoid webhook timeouts from Telegram
    bot.handleUpdate(body).catch((err) => {
      console.error("Error in Grammy update handler:", err);
    });
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error parsing bot webhook request:", error);
    // Return 200 to prevent Telegram from retrying failed updates indefinitely
    return new Response("OK", { status: 200 });
  }
}
