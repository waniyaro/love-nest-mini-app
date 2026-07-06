import crypto from "crypto";
import { prisma } from "./prisma";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

/**
 * Verifies the authenticity of Telegram WebApp initData.
 */
export function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return false;

    // Filter and sort keys
    const keys = Array.from(params.keys())
      .filter((key) => key !== "hash")
      .sort();
    const dataCheckString = keys
      .map((key) => `${key}=${params.get(key)}`)
      .join("\n");

    // Calculate secret
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculate hash
    const generatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return generatedHash === hash;
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return false;
  }
}

/**
 * Authenticates user from Telegram Authorization header.
 * Supports mock authentication in development.
 */
export async function authenticateTelegramUser(authHeader: string | null) {
  if (!authHeader) {
    return { error: "Authorization header is missing", status: 401 };
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  let tgUser: TelegramUser | null = null;
  const isDev = process.env.NODE_ENV === "development";

  // Development Bypass / Mock Auth
  if (isDev && (token.startsWith("mock_") || !isNaN(Number(token)))) {
    const mockId = token.startsWith("mock_") ? token.slice(5) : token;
    tgUser = {
      id: parseInt(mockId) || 123456789,
      first_name: mockId === "123456789" ? "Даша" : "Алексей",
      username: mockId === "123456789" ? "dasha_love" : "alexey_love",
    };
  } else {
    // Standard Verification
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { error: "Bot token not configured on server", status: 500 };
    }

    const isValid = verifyTelegramWebAppData(token, botToken);
    if (!isValid) {
      return { error: "Invalid Telegram signature", status: 403 };
    }

    try {
      const params = new URLSearchParams(token);
      const userJSON = params.get("user");
      if (!userJSON) {
        return { error: "User data missing in Telegram payload", status: 400 };
      }
      tgUser = JSON.parse(userJSON) as TelegramUser;
    } catch (e) {
      return { error: "Failed to parse Telegram user data", status: 400 };
    }
  }

  if (!tgUser) {
    return { error: "Authentication failed", status: 401 };
  }

  const userIdStr = String(tgUser.id);
  const whitelistStr = process.env.ALLOWED_TELEGRAM_IDS || "";
  const whitelistedIds = whitelistStr
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!whitelistedIds.includes(userIdStr)) {
    return { error: `Telegram ID ${userIdStr} is not whitelisted`, status: 403 };
  }

  // Get or create shared Couple
  let couple = await prisma.couple.findFirst();
  if (!couple) {
    couple = await prisma.couple.create({
      data: {
        startDate: new Date(), // default to today, user can edit later
      },
    });
  }

  // Find or create User in the database
  let dbUser = await prisma.user.findUnique({
    where: { telegramId: userIdStr },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        telegramId: userIdStr,
        firstName: tgUser.first_name,
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
        coupleId: couple.id,
      },
    });
  } else {
    // Keep username and first name up-to-date
    dbUser = await prisma.user.update({
      where: { telegramId: userIdStr },
      data: {
        firstName: tgUser.first_name,
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
      },
    });
  }

  // Find partner info (the other ID in the whitelist)
  const partnerIdStr = whitelistedIds.find((id) => id !== userIdStr);
  let dbPartner = null;
  if (partnerIdStr) {
    dbPartner = await prisma.user.findUnique({
      where: { telegramId: partnerIdStr },
    });
  }

  return {
    user: dbUser,
    partnerId: partnerIdStr || null,
    partner: dbPartner, // Will be null if the partner hasn't logged in yet
    couple,
  };
}
