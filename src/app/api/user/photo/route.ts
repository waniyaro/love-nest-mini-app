import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bot } from "@/lib/bot";

function getSvgPlaceholder(name: string) {
  const char = name.trim().charAt(0).toUpperCase() || "?";
  // Beautiful rose pink circle with bold white initials text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="50" fill="#f43f5e" /><text x="50" y="55" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="bold" fill="#ffffff">${char}</text></svg>`;
  
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");

  if (!telegramId) {
    return new Response("Missing telegramId", { status: 400 });
  }

  // 1. Verify user exists in DB to prevent abuse
  const userExists = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!userExists) {
    return new Response("User not found or unauthorized", { status: 404 });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || botToken === "dummy_token" || botToken === "YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER") {
      return getSvgPlaceholder(userExists.firstName);
    }

    // 2. Fetch user profile photos using Telegram Bot API
    const photos = await bot.api.getUserProfilePhotos(Number(telegramId), { limit: 1 });
    if (!photos || !photos.photos || photos.total_count === 0) {
      return getSvgPlaceholder(userExists.firstName);
    }

    // Get the medium size photo
    const photoSizes = photos.photos[0];
    if (!photoSizes || photoSizes.length === 0) {
      return getSvgPlaceholder(userExists.firstName);
    }
    const photoSize = photoSizes[1] || photoSizes[0];

    // 3. Get file path
    const file = await bot.api.getFile(photoSize.file_id);
    if (!file.file_path) {
      return getSvgPlaceholder(userExists.firstName);
    }

    // 4. Fetch the file content from Telegram servers and proxy it
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      return getSvgPlaceholder(userExists.firstName);
    }

    const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
    const buffer = await fileResponse.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying Telegram photo:", error);
    return getSvgPlaceholder(userExists.firstName);
  }
}
