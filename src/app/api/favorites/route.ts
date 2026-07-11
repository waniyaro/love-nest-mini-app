export const dynamic = "force-dynamic";

import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const favorites = await prisma.favoriteItem.findMany({
      where: { coupleId: authResult.couple.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { title, category, note } = await req.json();
    if (!title || !category) {
      return Response.json({ error: "Title and Category are required" }, { status: 400 });
    }

    const data: any = {
      title,
      category,
      coupleId: authResult.couple.id,
      createdById: authResult.user.telegramId,
    };

    // Store note under the appropriate field based on who created it
    data.creatorNote = note || null;

    const favorite = await prisma.favoriteItem.create({
      data,
    });

    const { incrementCoupleScore } = await import("@/lib/score");
    await incrementCoupleScore(authResult.couple.id, 5);

    return Response.json({ favorite });
  } catch (error) {
    console.error("Error creating favorite item:", error);
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
      return Response.json({ error: "Missing favorite ID" }, { status: 400 });
    }

    const currentItem = await prisma.favoriteItem.findUnique({
      where: { id },
    });

    if (!currentItem || currentItem.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const { note } = await req.json();

    const isCreator = currentItem.createdById === authResult.user.telegramId;
    const updateData: any = {};
    if (isCreator) {
      updateData.creatorNote = note;
    } else {
      updateData.partnerNote = note;
    }

    const updatedFavorite = await prisma.favoriteItem.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ favorite: updatedFavorite });
  } catch (error) {
    console.error("Error updating favorite item:", error);
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
      return Response.json({ error: "Missing favorite ID" }, { status: 400 });
    }

    const currentItem = await prisma.favoriteItem.findUnique({
      where: { id },
    });

    if (!currentItem || currentItem.coupleId !== authResult.couple.id) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.favoriteItem.delete({
      where: { id },
    });

    const { incrementCoupleScore } = await import("@/lib/score");
    await incrementCoupleScore(authResult.couple.id, -5);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting favorite item:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
