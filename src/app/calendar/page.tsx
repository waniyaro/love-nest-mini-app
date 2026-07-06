"use client";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Star, Gift, PartyPopper } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

export default function CalendarPage() {
  const { initData } = useTelegram();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Event Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar", {
        headers: { Authorization: `Bearer ${initData}` },
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get events for a specific day in the active calendar view
  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedDay === null) return;

    setSubmitting(true);
    try {
      const eventDate = new Date(year, month, selectedDay, 12, 0, 0); // set to noon to avoid timezone shifts
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          title,
          description,
          date: eventDate.toISOString(),
        }),
      });

      if (res.ok) {
        await loadEvents();
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        
        // Haptic feedback
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const offsetArray = Array.from({ length: startingOffset }, (_, i) => i);

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Календарь <span className="text-rose-500">🗓️</span>
        </h1>
        {selectedDay !== null && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1 transition-all"
          >
            <Plus className="h-4 w-4" />
            Добавить дату
          </button>
        )}
      </div>

      {/* Calendar Grid card */}
      <div className="glass-card rounded-3xl p-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-full bg-rose-100/50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm text-slate-800 dark:text-rose-100">
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
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                onClick={() => handleDayClick(day)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : isToday
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "hover:bg-rose-50/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{day}</span>
                {/* Event dot indicator */}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse-heart"></span>
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
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 dark:text-rose-100 text-sm mb-4">
              События {selectedDay} {monthNames[month].toLowerCase().slice(0, -1)}я
            </h3>

            {selectedDayEvents.length > 0 ? (
              <div className="flex flex-col gap-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-slate-900/40 border border-rose-100/50 dark:border-rose-950/20 flex gap-3 items-start"
                  >
                    <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 fill-rose-500/10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-rose-100 truncate">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Памятных дат пока нет. Добавьте первую!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-4"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
                Запомнить дату <PartyPopper className="h-5 w-5 text-rose-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Добавьте знаменательную дату на {selectedDay} {monthNames[month]}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Название события
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Годовщина, День рождения, Первая встреча..."
                className="h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Описание (необязательно)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Наши воспоминания о встрече или идеи для празднования..."
                rows={3}
                className="p-3 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all"
              >
                {submitting ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
