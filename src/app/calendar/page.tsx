"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  createdById: string;
}

export default function CalendarPage() {
  const { initData, user, partner } = useTelegram();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar", {
        headers: { Authorization: `Bearer ${initData}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust JS day (0=Sun, 1=Mon, ..., 6=Sat) to Russian standard (0=Mon, ..., 6=Sun)
  const startingOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  const monthNamesGenitive = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getYearPlural = (years: number) => {
    if (years % 10 === 1 && years % 100 !== 11) {
      return `${years} год`;
    }
    if (years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) {
      return `${years} года`;
    }
    return `${years} лет`;
  };

  // Get events for a specific day in the active calendar view (recurring annually)
  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month;
    });
  };

  const handleDeleteEvent = async (id: string) => {
    const message = "Вы уверены, что хотите удалить эту памятную дату?";
    const proceedDelete = async () => {
      try {
        const res = await fetch(`/api/calendar?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${initData}` },
        });

        if (res.ok) {
          if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
          }
          await loadEvents();
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (typeof window !== "undefined" && window.Telegram?.WebApp?.showConfirm) {
      window.Telegram.WebApp.showConfirm(message, (confirmed) => {
        if (confirmed) proceedDelete();
      });
    } else {
      if (window.confirm(message)) {
        proceedDelete();
      }
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const offsetArray = Array.from({ length: startingOffset }, (_, i) => i);

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Keyword icon detection
  const getEventIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("годовщин") || lower.includes("любовь") || lower.includes("свадьб")) return "💖";
    if (lower.includes("рождени") || lower.includes("др") || lower.includes("рождения")) return "🎂";
    if (lower.includes("встреч") || lower.includes("знакомств")) return "✨";
    if (lower.includes("путешеств") || lower.includes("поездк") || lower.includes("отпуск") || lower.includes("море")) return "🌴";
    if (lower.includes("новый год") || lower.includes("праздник") || lower.includes("нг")) return "🎄";
    if (lower.includes("кино") || lower.includes("фильм")) return "🍿";
    if (lower.includes("ужин") || lower.includes("ресторан")) return "🍽️";
    return "⭐️";
  };

  const handleAddClick = () => {
    const dayQuery = selectedDay !== null ? selectedDay : new Date().getDate();
    router.push(`/calendar/new?day=${dayQuery}&month=${month}&year=${year}`);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Календарь <span className="text-rose-500">🗓️</span>
        </h1>
        <button
          onClick={handleAddClick}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Calendar Grid card */}
      <div className="glass-card rounded-3xl p-5 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-full bg-rose-100/50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-sm text-slate-800 dark:text-rose-100">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-full bg-rose-100/50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 flex items-center justify-center transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of week labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          <span>Пн</span>
          <span>Вт</span>
          <span>Ср</span>
          <span>Чт</span>
          <span>Пт</span>
          <span>Сб</span>
          <span>Вс</span>
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Offsets (empty spaces before first day of month) */}
          {offsetArray.map((offset) => (
            <div key={`offset-${offset}`} className="h-10"></div>
          ))}

          {/* Actual days */}
          {daysArray.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDay === day;
            const hasEvent = dayEvents.length > 0;
            const isToday = 
              day === new Date().getDate() && 
              month === new Date().getMonth() && 
              year === new Date().getFullYear();

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-rose-gradient text-white shadow-md shadow-rose-200/40 scale-105"
                    : isToday
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : hasEvent
                    ? "bg-rose-50/50 dark:bg-rose-950/10 border-[0.5px] border-rose-200/50 dark:border-rose-950/30 text-rose-500 dark:text-rose-300"
                    : "hover:bg-rose-50/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{day}</span>
                {/* Event dot indicator */}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day events listing */}
      <div className="flex flex-col gap-3">
        {selectedDay === null ? (
          <div className="glass-card rounded-2xl p-5 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
            Выберите дату на календаре выше, чтобы посмотреть события или добавить новое.
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-5">
            <h3 className="font-black text-slate-800 dark:text-rose-100 text-sm mb-4">
              События {selectedDay} {monthNamesGenitive[month]}
            </h3>

            {selectedDayEvents.length > 0 ? (
              <div className="relative pl-6 border-l-[1.5px] border-dashed border-rose-200 dark:border-rose-950/30 flex flex-col gap-4">
                {selectedDayEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const yearsDiff = year - eventDate.getFullYear();
                  const isCreatorMe = event.createdById === user?.telegramId;

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline Node Icon (positioned absolutely on the left border) */}
                      <div className="absolute left-[-33px] top-1.5 h-5.5 w-5.5 rounded-full bg-rose-gradient flex items-center justify-center text-white text-[11px] shadow-sm">
                        {getEventIcon(event.title)}
                      </div>
                      
                      {/* Timeline Card */}
                      <div className="p-4 bg-white/40 dark:bg-slate-900/40 border border-rose-100/50 dark:border-rose-950/10 rounded-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-rose-100 leading-tight">
                              {event.title}
                            </h4>
                            {yearsDiff > 0 && (
                              <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                {getYearPlural(yearsDiff)}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">
                              {event.description}
                            </p>
                          )}
                          <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md mt-2 inline-block">
                            Добавил(а): {isCreatorMe ? "Вы" : (partner?.firstName || "Партнер")}
                          </span>
                        </div>

                        {/* Delete Event Button */}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                          title="Удалить знаменательную дату"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Памятных дат пока нет. Нажмите «Добавить»!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
