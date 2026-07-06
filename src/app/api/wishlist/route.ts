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
    const { title, url } = await req.json();
    if (!title || !url) {
      return Response.json({ error: "Title and URL are required" }, { status: 400 });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        title,
        url,
        coupleId: authResult.couple.id,
        createdById: authResult.user.telegramId,
      },
    });

    // Notify partner
    if (authResult.partnerId) {
      await sendTelegramNotification(
        authResult.partnerId,
        `🎁 <b>Новое желание в вишлисте!</b>\n\n<b>${authResult.user.firstName}</b> добавил(а) новый товар: <a href="${url}"><b>${title}</b></a>\n\n<i>Откройте Love Nest, чтобы посмотреть полный список желаний!</i> 🛍️`
      );
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

    const updatedItem = await prisma.wishlistItem.update({
      where: { id },
      data: { isPurchased: !currentItem.isPurchased },
    });

    // Notify partner if marked as purchased
    if (authResult.partnerId && updatedItem.isPurchased) {
      await sendTelegramNotification(
        authResult.partnerId,
        `💝 <b>Желание исполнено!</b>\n\n<b>${authResult.user.firstName}</b> отметил(а) ваше желание как исполненное: <a href="${updatedItem.url}"><b>${updatedItem.title}</b></a>! 🎉`
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
