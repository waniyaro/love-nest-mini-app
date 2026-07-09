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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const date = await prisma.dateEvent.findUnique({
        where: { id },
        include: {
          photoRelation: true,
        },
      });

      if (!date || date.coupleId !== authResult.couple.id) {
        return Response.json({ error: "Date event not found" }, { status: 404 });
      }

      const responseDate = {
        ...date,
        photo: date.photoRelation?.photo || null,
        photoRelation: undefined,
      };

      return Response.json({ date: responseDate });
    }

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

export async function PATCH(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing date ID" }, { status: 400 });
    }

    const currentEvent = await prisma.dateEvent.findUnique({
      where: { id },
    });

    if (!currentEvent || currentEvent.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Date event not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    // 1. Handle confirmation status (pending -> accepted/declined)
    if (body.status) {
      updateData.status = body.status;
      
      // Notify partner of status change
      if (authResult.partnerId) {
        const statusEmoji = body.status === "accepted" ? "✅" : "❌";
        const statusText = body.status === "accepted" ? "принял(а)" : "отклонил(а)/перенес(ла)";
        await sendTelegramNotification(
          authResult.partnerId,
          `${statusEmoji} <b>Ответ на свидание!</b>\n\n<b>${authResult.user.firstName}</b> ${statusText} ваше приглашение на свидание <b>"${currentEvent.title}"</b>!`
        );
      }
    }

    // 2. Handle feedback / reviews / photo / completed
    const isCreatorMe = currentEvent.createdById === authResult.user.telegramId;
    
    if (body.feedback !== undefined) {
      if (isCreatorMe) {
        updateData.creatorFeedback = body.feedback;
      } else {
        updateData.partnerFeedback = body.feedback;
      }
    }

    if (body.emoji !== undefined) {
      if (isCreatorMe) {
        updateData.creatorEmoji = body.emoji;
      } else {
        updateData.partnerEmoji = body.emoji;
      }
    }

    if (body.photo !== undefined) {
      if (body.photo) {
        updateData.photoRelation = {
          upsert: {
            create: { photo: body.photo },
            update: { photo: body.photo },
          },
        };
      } else {
        const existingPhoto = await prisma.dateEventPhoto.findUnique({
          where: { dateEventId: id },
        });
        if (existingPhoto) {
          updateData.photoRelation = {
            delete: true,
          };
        }
      }
    }

    if (body.isCompleted !== undefined) {
      updateData.isCompleted = body.isCompleted;
    }

    const updatedEvent = await prisma.dateEvent.update({
      where: { id },
      data: updateData,
    });

    // Notify partner of feedback/rating
    if (body.feedback && body.emoji) {
      const recipientId = isCreatorMe ? authResult.partnerId : currentEvent.createdById;
      if (recipientId) {
        await sendTelegramNotification(
          recipientId,
          `💖 <b>Партнер оставил отзыв о свидании!</b>\n\n<b>${authResult.user.firstName}</b> поделился(лась) эмоциями о свидании <b>"${currentEvent.title}"</b>:\n${body.emoji} <i>"${body.feedback}"</i>\n\n<i>Откройте IS TWO, чтобы посмотреть воспоминания!</i> 📸`
        );
      }
    }

    return Response.json({ date: updatedEvent });
  } catch (error) {
    console.error("Error updating date event:", error);
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
      return Response.json({ error: "Missing date ID" }, { status: 400 });
    }

    const currentEvent = await prisma.dateEvent.findUnique({
      where: { id },
    });

    if (!currentEvent || currentEvent.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Date event not found" }, { status: 404 });
    }

    await prisma.dateEvent.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting date event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

