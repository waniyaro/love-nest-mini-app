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
      const formattedDateTime = new Date(dateTime).toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const locationText = location ? ` в <b>${location}</b>` : "";
      await sendTelegramNotification(
        authResult.partnerId,
        `💖 <b>Новое приглашение на свидание!</b>\n\n<b>${authResult.user.firstName}</b> приглашает вас на свидание: <b>"${title}"</b>\n📅 Дата и время: <b>${formattedDateTime}</b>${locationText}\n\n<i>Откройте IS TWO, чтобы посмотреть детали!</i> ✨`
      );
    }

    return Response.json({ date: dateEvent });
  } catch (error) {
    console.error("Error creating date event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
