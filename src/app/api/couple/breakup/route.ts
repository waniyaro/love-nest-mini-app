import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  const userId = authResult.user.telegramId;
  const currentCoupleId = authResult.couple.id;

  try {
    // 1. Create a brand new independent couple space for this user
    const newCouple = await prisma.couple.create({
      data: {
        startDate: null,
      },
    });

    // 2. Move the user to the new couple
    await prisma.user.update({
      where: { telegramId: userId },
      data: {
        coupleId: newCouple.id,
      },
    });

    // 3. Clean up the old couple if it is now empty (i.e. has 0 users left)
    const oldCoupleUsers = await prisma.user.findMany({
      where: { coupleId: currentCoupleId },
    });

    if (oldCoupleUsers.length === 0) {
      await prisma.couple.delete({
        where: { id: currentCoupleId },
      });
      console.log(`Deleted empty old couple after breakup: ${currentCoupleId}`);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error breaking up couple:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
