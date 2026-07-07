import { prisma } from "./prisma";
import { sendTelegramNotification } from "./bot";

export function startScheduler() {
  console.log("⏰ Anniversary scheduler started.");
  
  // Run immediately on startup, then every hour
  checkAnniversaries();
  setInterval(() => {
    checkAnniversaries();
  }, 60 * 60 * 1000); // 1 hour
}

async function checkAnniversaries() {
  try {
    const now = new Date();
    // Run the check at 10:00 AM local server time
    if (now.getHours() !== 10) {
      return;
    }

    const currentYear = now.getFullYear();
    
    // Tomorrow's date
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth(); // 0-indexed
    
    // Find calendar events that have not been notified this year
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { lastNotifiedYear: null },
          { lastNotifiedYear: { lt: currentYear } }
        ]
      },
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
      // Ensure the event happened in the past or current year
      if (eventDate.getFullYear() > currentYear) {
        continue;
      }
      
      // Match day and month of tomorrow
      if (eventDate.getDate() === tomorrowDay && eventDate.getMonth() === tomorrowMonth) {
        const users = event.couple.users;
        const yearsDiff = currentYear - eventDate.getFullYear();
        
        let yearsText = "";
        if (yearsDiff > 0) {
          yearsText = ` (${getYearPlural(yearsDiff)})`;
        }
        
        const formattedTomorrowDate = `${tomorrowDay} ${monthNames[tomorrowMonth]}`;
        const message = `🎉 <b>Скоро знаменательная дата!</b>\n\nЗавтра (<b>${formattedTomorrowDate}</b>) — годовщина события: <b>"${event.title}"</b>${yearsText}! ❤️\n\n<i>Не забудьте подготовить приятный сюрприз!</i> ✨`;
        
        for (const user of users) {
          await sendTelegramNotification(user.telegramId, message);
        }
        
        // Update database to mark as notified for this year
        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { lastNotifiedYear: currentYear }
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
