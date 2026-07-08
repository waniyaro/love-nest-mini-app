import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/bot";

export async function GET(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { coupleId: authResult.couple.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { title, url, price, type, description, photo, rating } = await req.json();
    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        title,
        url: url || null,
        price: price || null,
        type: type || "item",
        description: description || null,
        photo: photo || null,
        creatorRating: rating ? parseInt(rating) : null,
        coupleId: authResult.couple.id,
        createdById: authResult.user.telegramId,
      },
    });

    // Notify partner
    if (authResult.partnerId) {
      let message = "";
      if (type === "place") {
        message = `📍 <b>Новое место!</b>\n\n<b>${authResult.user.firstName}</b> добавил(а) место <b>${title}</b> в список мест!`;
        if (price) {
          message += `\n💰 Бюджет: <b>${price}</b>`;
        }
        if (url) {
          message += `\n🔗 <a href="${url}">Ссылка/Карта</a>`;
        }
      } else {
        message = `🎁 <b>Новое желание!</b>\n\n<b>${authResult.user.firstName}</b> добавил(а) <b>${title}</b> в свой вишлист!`;
        if (price) {
          message += `\n💰 Цена: <b>${price}</b>`;
        }
        if (url) {
          message += `\n🔗 <a href="${url}">Ссылка на товар</a>`;
        }
      }
      message += `\n\n<i>Откройте IS TWO, чтобы посмотреть детали!</i> 🌸`;

      await sendTelegramNotification(authResult.partnerId, message);
    }

    return Response.json({ item });
  } catch (error) {
    console.error("Error creating wishlist item:", error);
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
      return Response.json({ error: "Missing item ID" }, { status: 400 });
    }

    const currentItem = await prisma.wishlistItem.findUnique({
      where: { id },
    });

    if (!currentItem || currentItem.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = {};

    // Determine what field we are updating
    if (body.togglePurchased) {
      updateData.isPurchased = !currentItem.isPurchased;
    } else {
      if (body.isPurchased !== undefined) updateData.isPurchased = body.isPurchased;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.photo !== undefined) updateData.photo = body.photo;
      if (body.price !== undefined) updateData.price = body.price;
      if (body.url !== undefined) updateData.url = body.url;
      
      const isCreatorMe = currentItem.createdById === authResult.user.telegramId;
      if (body.rating !== undefined) {
        if (isCreatorMe) {
          updateData.creatorRating = body.rating ? parseInt(body.rating) : null;
        } else {
          updateData.partnerRating = body.rating ? parseInt(body.rating) : null;
        }
      }
    }

    const updatedItem = await prisma.wishlistItem.update({
      where: { id },
      data: updateData,
    });

    // Notify partner if marked as purchased/visited
    if (authResult.partnerId && updatedItem.isPurchased && !currentItem.isPurchased) {
      const isPlace = updatedItem.type === "place";
      const itemTitle = updatedItem.url
        ? `<a href="${updatedItem.url}"><b>${updatedItem.title}</b></a>`
        : `<b>${updatedItem.title}</b>`;

      const titleText = isPlace ? "Место посещено!" : "Желание исполнено!";
      const actionText = isPlace ? "отметил(а) место как посещенное" : "отметил(а) ваше желание как исполненное";
      const icon = isPlace ? "📍" : "💝";

      await sendTelegramNotification(
        authResult.partnerId,
        `${icon} <b>${titleText}</b>\n\n<b>${authResult.user.firstName}</b> ${actionText}: ${itemTitle}! 🎉`
      );
    }

    return Response.json({ item: updatedItem });
  } catch (error) {
    console.error("Error updating wishlist item:", error);
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
      return Response.json({ error: "Missing item ID" }, { status: 400 });
    }

    const currentItem = await prisma.wishlistItem.findUnique({
      where: { id },
    });

    if (!currentItem || currentItem.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.wishlistItem.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
