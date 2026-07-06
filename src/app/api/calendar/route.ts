import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/bot";

export async function GET(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const events = await prisma.calendarEvent.findMany({
      where: { coupleId: authResult.couple.id },
      orderBy: { date: "asc" },
    });
    return Response.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { title, description, date } = await req.json();
    if (!title || !date) {
      return Response.json({ error: "Title and Date are required" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        date: new Date(date),
        coupleId: authResult.couple.id,
        createdById: authResult.user.telegramId,
      },
    });

    // Notify partner
    if (authResult.partnerId) {
      const formattedDate = new Date(date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await sendTelegramNotification(
        authResult.partnerId,
        `🎉 <b>Новое событие в календаре!</b>\n\n<b>${authResult.user.firstName}</b> добавил(а) памятную дату: <b>"${title}"</b>\n📅 Дата: <b>${formattedDate}</b>\n\n<i>Любите и помните важные моменты!</i> ❤️`
      );
    }

    return Response.json({ event });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
