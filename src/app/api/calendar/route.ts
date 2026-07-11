export const dynamic = "force-dynamic";

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
    const dates = await prisma.dateEvent.findMany({
      where: { 
        coupleId: authResult.couple.id,
        status: { in: ["accepted", "pending"] },
      },
      orderBy: { dateTime: "asc" },
    });
    return Response.json({ events, dates });
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
    const { title, description, date, isRecurring } = await req.json();
    if (!title || !date) {
      return Response.json({ error: "Title and Date are required" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        date: new Date(date),
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        coupleId: authResult.couple.id,
        createdById: authResult.user.telegramId,
      },
    });

    const { incrementCoupleScore } = await import("@/lib/score");
    await incrementCoupleScore(authResult.couple.id, 10);

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

export async function DELETE(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing event ID" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event || event.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    const { incrementCoupleScore } = await import("@/lib/score");
    await incrementCoupleScore(authResult.couple.id, -10);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
