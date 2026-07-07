import { authenticateTelegramUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/bot";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("startParam");

  const authResult = await authenticateTelegramUser(req.headers.get("authorization"), startParam);
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  return Response.json({
    user: authResult.user,
    partner: authResult.partner,
    couple: authResult.couple,
    botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME || "IStwo_bot",
  });
}

export async function POST(req: Request) {
  const authResult = await authenticateTelegramUser(req.headers.get("authorization"));
  if ("error" in authResult) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { startDate } = await req.json();
    if (!startDate) {
      return Response.json({ error: "Missing startDate" }, { status: 400 });
    }

    const updatedCouple = await prisma.couple.update({
      where: { id: authResult.couple.id },
      data: { startDate: new Date(startDate) },
    });

    // Notify partner via Bot if they have logged in before
    if (authResult.partnerId && authResult.partner) {
      const formattedDate = new Date(startDate).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await sendTelegramNotification(
        authResult.partnerId,
        `📅 <b>${authResult.user.firstName}</b> обновил(а) дату начала ваших отношений на <b>${formattedDate}</b>! 💕`
      );
    }

    return Response.json({ couple: updatedCouple });
  } catch (error) {
    console.error("Error updating couple start date:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
