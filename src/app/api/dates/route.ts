import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/bot";

export async function GET(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const dates = await prisma.dateEvent.findMany({
      where: { coupleId: authResult.couple.id },
      orderBy: { dateTime: "asc" },
    });
    return Response.json({ dates });
  } catch (error) {
    console.error("Error fetching dates:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { title, description, location, dateTime } = await req.json();
    if (!title || !dateTime) {
      return Response.json({ error: "Title and Date/Time are required" }, { status: 400 });
    }

    const dateEvent = await prisma.dateEvent.create({
      data: {
        title,
        description,
        location,
        dateTime: new Date(dateTime),
        coupleId: authResult.couple.id,
        createdById: authResult.user.telegramId,
      },
    });

    // Notify partner via Bot
    if (authResult.partnerId) {
      const dateObj = new Date(dateTime);
      const formattedDate = dateObj.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = dateObj.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const locationText = location ? location : "Не указано";
      await sendTelegramNotification(
        authResult.partnerId,
        `💖 <b>Приглашение на свидание!</b>\n\n<b>${authResult.user.firstName}</b> назначил(а) вам свидание:\n🏷️ Название: <b>"${title}"</b>\n📅 Дата: <b>${formattedDate}</b>\n⏰ Время: <b>${formattedTime}</b>\n📍 Место: <b>${locationText}</b>\n\n<i>Откройте IS TWO, чтобы посмотреть детали!</i> ✨`
      );
    }

    return Response.json({ date: dateEvent });
  } catch (error) {
    console.error("Error creating date event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
