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

  // Extract start_param from token if present (both in mock and real Telegram)
  let startParam: string | null = null;
  if (token.startsWith("mock_") || !isNaN(Number(token))) {
    if (token.includes("?")) {
      const urlParams = new URLSearchParams(token.substring(token.indexOf("?")));
      startParam = urlParams.get("start_param");
    }
  } else {
    try {
      const params = new URLSearchParams(token);
      startParam = params.get("start_param");
    } catch (e) {
      console.error("Error parsing startParam:", e);
    }
  }

  // Find user and their couple if they already exist
  let dbUser = await prisma.user.findUnique({
    where: { telegramId: userIdStr },
    include: {
      couple: {
        include: {
          users: true,
        },
      },
    },
  });

  let couple = dbUser?.couple || null;

  if (!dbUser) {
    // User does not exist, let's pair them or create a new couple
    let coupleToJoin = null;

    if (startParam && startParam.startsWith("couple_")) {
      const coupleId = startParam.substring(7); // Remove "couple_" prefix
      try {
        const existingCouple = await prisma.couple.findUnique({
          where: { id: coupleId },
          include: { users: true },
        });

        // Join only if couple exists and has less than 2 users
        if (existingCouple && existingCouple.users.length < 2) {
          coupleToJoin = existingCouple;
        }
      } catch (e) {
        console.error("Error finding couple from startParam:", e);
      }
    }

    // If no valid couple to join, create a new one
    if (!coupleToJoin) {
      coupleToJoin = await prisma.couple.create({
        data: {
          startDate: null, // default to null, can be set later
        },
        include: { users: true },
      });
    }

    dbUser = await prisma.user.create({
      data: {
        telegramId: userIdStr,
        firstName: tgUser.first_name,
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
        coupleId: coupleToJoin.id,
      },
      include: {
        couple: {
          include: {
            users: true,
          },
        },
      },
    });
    couple = dbUser.couple;
  } else {
    // User already exists, keep their profile info up-to-date
    dbUser = await prisma.user.update({
      where: { telegramId: userIdStr },
      data: {
        firstName: tgUser.first_name,
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
      },
      include: {
        couple: {
          include: {
            users: true,
          },
        },
      },
    });
    couple = dbUser.couple;
  }

  // Find partner (the other user in the couple)
  const dbPartner = couple?.users.find((u) => u.telegramId !== userIdStr) || null;

  if (!couple) {
    return { error: "Failed to initialize couple space", status: 500 };
  }

  return {
    user: {
      telegramId: dbUser.telegramId,
      username: dbUser.username,
      firstName: dbUser.firstName,
      photoUrl: dbUser.photoUrl,
    },
    partnerId: dbPartner?.telegramId || null,
    partner: dbPartner ? {
      telegramId: dbPartner.telegramId,
      username: dbPartner.username,
      firstName: dbPartner.firstName,
      photoUrl: dbPartner.photoUrl,
    } : null,
    couple: {
      id: couple.id,
      startDate: couple.startDate,
    },
  };
}
