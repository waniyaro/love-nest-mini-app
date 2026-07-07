import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bot } from "@/lib/bot";

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
      // In development / mock mode, redirect to UI avatars placeholder
      return Response.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(userExists.firstName)}&background=FDA4AF&color=FFF`);
    }

    // 2. Fetch user profile photos using Telegram Bot API
    const photos = await bot.api.getUserProfilePhotos(Number(telegramId), { limit: 1 });
    if (photos.total_count === 0) {
      // Return placeholder avatar if user has no photo
      return Response.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(userExists.firstName)}&background=FDA4AF&color=FFF`);
    }

    // Get the medium size photo (e.g. index 1 if available, otherwise 0)
    const photoSizes = photos.photos[0];
    const photoSize = photoSizes[1] || photoSizes[0];

    // 3. Get file path
    const file = await bot.api.getFile(photoSize.file_id);
    if (!file.file_path) {
      return new Response("File path not found", { status: 404 });
    }

    // 4. Fetch the file content from Telegram servers and proxy it
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      return new Response("Failed to fetch photo from Telegram", { status: 502 });
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
    return Response.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(userExists.firstName)}&background=FDA4AF&color=FFF`);
  }
}
