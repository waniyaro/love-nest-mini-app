import { prisma } from "./prisma";
import { sendTelegramNotification } from "./bot";

export function startScheduler() {
  console.log("⏰ Anniversary and feedback scheduler started.");
  
  // Run immediately on startup, then every hour
  checkAnniversaries();
  checkRecentDatesForFeedback();
  setInterval(() => {
    checkAnniversaries();
    checkRecentDatesForFeedback();
  }, 60 * 60 * 1000); // 1 hour
}

async function checkAnniversaries() {
  try {
    const now = new Date();
    // Run the check at 10:00 AM local server time
    if (now.getHours() !== 10) {
      return;
    }

    // Normalize today to midnight 00:00:00
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all calendar events
    const events = await prisma.calendarEvent.findMany({
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });

    const monthNames = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];

    for (const event of events) {
      const eventDate = new Date(event.date);
      
      // If the event hasn't happened yet in the timeline, skip it
      if (eventDate.getTime() > todayMidnight.getTime()) {
        continue;
      }

      // Target year of the anniversary we are checking
      let targetYear = todayMidnight.getFullYear();
      let anniversaryDate = new Date(targetYear, eventDate.getMonth(), eventDate.getDate());

      // If the anniversary date for targetYear has already passed, check next year's anniversary
      if (anniversaryDate.getTime() < todayMidnight.getTime()) {
        targetYear += 1;
        anniversaryDate = new Date(targetYear, eventDate.getMonth(), eventDate.getDate());
      }

      // Calculate difference in days using normalized midnights
      const diffTime = anniversaryDate.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Trigger notification exactly 7 days prior
      if (diffDays === 7) {
        // Check if we already notified for this specific targetYear of the event
        if (event.lastNotifiedYear === targetYear) {
          continue;
        }

        // If the event is not recurring, only trigger notifications if targetYear matches the eventDate's year
        if (!event.isRecurring && targetYear !== eventDate.getFullYear()) {
          continue;
        }

        const users = event.couple.users;
        const yearsDiff = targetYear - eventDate.getFullYear();

        let yearsText = "";
        if (yearsDiff > 0) {
          yearsText = ` (${getYearPlural(yearsDiff)})`;
        }

        const formattedTargetDate = `${anniversaryDate.getDate()} ${monthNames[anniversaryDate.getMonth()]}`;
        const message = `🎉 <b>Скоро знаменательная дата!</b>\n\nРовно через неделю (<b>${formattedTargetDate}</b>) — годовщина события: <b>"${event.title}"</b>${yearsText}! ❤️\n\n<i>Не забудьте подготовить приятный сюрприз!</i> ✨`;

        for (const user of users) {
          await sendTelegramNotification(user.telegramId, message);
        }

        // Mark as notified for this targetYear
        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { lastNotifiedYear: targetYear }
        });
      }
    }
  } catch (error) {
    console.error("Error in checkAnniversaries scheduler:", error);
  }
}

function getYearPlural(years: number) {
  if (years % 10 === 1 && years % 100 !== 11) {
    return `${years} год`;
  }
  if (years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) {
    return `${years} года`;
  }
  return `${years} лет`;
}

async function checkRecentDatesForFeedback() {
  try {
    const now = new Date();
    
    // Find past date events that happened (e.g. dateTime < now)
    // and feedbackNotified is false, and status is "accepted" (no need to remind of declined dates!)
    const pastEvents = await prisma.dateEvent.findMany({
      where: {
        dateTime: { lt: now },
        feedbackNotified: false,
        status: "accepted",
      },
      include: {
        couple: {
          include: {
            users: true,
          },
        },
      },
    });

    for (const event of pastEvents) {
      const users = event.couple.users;
      
      // Let's determine who has not left feedback yet
      const needsCreatorFeedback = !event.creatorFeedback;
      const needsPartnerFeedback = !event.partnerFeedback;

      // Find the creator and partner users
      const creatorUser = users.find((u) => u.telegramId === event.createdById);
      const partnerUser = users.find((u) => u.telegramId !== event.createdById);

      const reminderMessage = `📸 <b>Как прошло свидание?</b>\n\nСвидание <b>"${event.title}"</b> уже завершилось! Поделитесь своими впечатлениями, выберите смайлик эмоций и загрузите памятное фото в альбом! 🥰\n\n<i>Откройте IS TWO, чтобы оставить отзыв!</i> 🌸`;

      if (needsCreatorFeedback && creatorUser) {
        await sendTelegramNotification(creatorUser.telegramId, reminderMessage);
      }

      if (needsPartnerFeedback && partnerUser) {
        await sendTelegramNotification(partnerUser.telegramId, reminderMessage);
      }

      // Mark as notified so we don't spam them
      await prisma.dateEvent.update({
        where: { id: event.id },
        data: { feedbackNotified: true },
      });
    }
  } catch (error) {
    console.error("Error in checkRecentDatesForFeedback scheduler:", error);
  }
}

