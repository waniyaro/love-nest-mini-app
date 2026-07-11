"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, ChevronDown, X } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  createdById: string;
  isRecurring: boolean;
}

interface DateEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  createdById: string;
  status: string;
}

const SketchyCircle = () => (
  <svg 
    viewBox="0 0 100 100" 
    className="absolute inset-0 w-full h-full pointer-events-none stroke-rose-500/85 dark:stroke-rose-400/90 fill-none scale-[1.35] z-10" 
    strokeWidth="4.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path 
      d="M 50,12 
         C 75,12 90,28 90,48 
         C 90,70 70,88 48,88 
         C 26,88 10,70 10,48 
         C 10,26 28,12 48,13
         C 60,14 84,26 84,48
         C 84,65 68,82 50,82"
      className="animate-sketch-draw"
      strokeDasharray="500"
      strokeDashoffset="500"
    />
  </svg>
);

export default function CalendarPage() {
  const { initData, user, partner } = useTelegram();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "scroll">("grid");

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
        setEvents(data.events || []);
        setDates(data.dates || []);
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

  // Picker States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const [pickerMonth, setPickerMonth] = useState(month);

  // Synchronize picker local state with selected year/month when picker opens
  useEffect(() => {
    if (isPickerOpen) {
      setPickerYear(year);
      setPickerMonth(month);
    }
  }, [isPickerOpen, year, month]);

  const scrollToMonth = useCallback((y: number, m: number) => {
    const el = document.getElementById(`scroll-month-${y}-${m}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSelectDate = (y: number, m: number) => {
    setCurrentDate(new Date(y, m, 1));
    setSelectedDay(1);
    setIsPickerOpen(false);
    if (viewMode === "scroll") {
      setTimeout(() => {
        scrollToMonth(y, m);
      }, 100);
    }
  };

  // Scroll to active month on load or mode switch
  useEffect(() => {
    if (viewMode === "scroll" && !loading) {
      const timer = setTimeout(() => {
        scrollToMonth(year, month);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, loading, year, month, scrollToMonth]);

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

  // Get events for a specific day in the active calendar view
  const getEventsForDay = useCallback((day: number, m = month, y = year) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      const isDayMonthMatch = d.getDate() === day && d.getMonth() === m;
      const isRecurring = e.isRecurring !== undefined ? e.isRecurring : true;
      if (isRecurring) {
        return isDayMonthMatch && y >= d.getFullYear();
      }
      return isDayMonthMatch && d.getFullYear() === y;
    });
  }, [events, month, year]);

  // Get date events for a specific day in the active calendar view
  const getDatesForDay = useCallback((day: number, m = month, y = year) => {
    return dates.filter((d) => {
      const dateObj = new Date(d.dateTime);
      return (
        dateObj.getDate() === day &&
        dateObj.getMonth() === m &&
        dateObj.getFullYear() === y
      );
    });
  }, [dates, month, year]);

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
  const selectedDayDates = selectedDay ? getDatesForDay(selectedDay) : [];

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
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
            Календарь <span className="text-rose-500">🗓️</span>
          </h1>
          {/* Toggle View Mode */}
          <div className="flex items-center gap-2 mt-1.5 bg-slate-100/80 dark:bg-slate-900/80 p-0.5 rounded-lg border border-rose-100/10 w-fit select-none">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Сетка
            </button>
            <button
              onClick={() => setViewMode("scroll")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                viewMode === "scroll"
                  ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Лента
            </button>
          </div>
        </div>
        <button
          onClick={handleAddClick}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Calendar Grid card */}
      {viewMode === "grid" ? (
        <div className="glass-card rounded-3xl p-5 shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-full bg-rose-100/50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsPickerOpen(true)}
              className="font-extrabold text-sm text-slate-800 dark:text-rose-100 hover:text-rose-500 transition-all flex items-center gap-1.5 px-3 py-1 bg-white/40 dark:bg-slate-900/40 rounded-full border border-rose-100/10 active:scale-95 shadow-sm"
            >
              <span>{monthNames[month]} {year}</span>
              <ChevronDown className="h-3.5 w-3.5 text-rose-500" />
            </button>

            <button
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-full bg-rose-100/50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 flex items-center justify-center transition-all active:scale-95"
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
            {/* Offsets */}
            {offsetArray.map((offset) => (
              <div key={`offset-${offset}`} className="h-10"></div>
            ))}

            {/* Actual days */}
            {daysArray.map((day) => {
              const dayEvents = getEventsForDay(day);
              const dayDates = getDatesForDay(day);
              const isSelected = selectedDay === day;
              const hasEvent = dayEvents.length > 0;
              const hasDate = dayDates.length > 0;
              const hasPendingDate = dayDates.some((d) => d.status === "pending");
              const hasAcceptedDate = dayDates.some((d) => d.status === "accepted");
              const isToday = 
                day === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all overflow-visible ${
                    isSelected
                      ? "bg-rose-gradient text-white shadow-md shadow-rose-200/40 scale-105"
                      : isToday
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                      : "hover:bg-rose-50/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && !isSelected && <SketchyCircle />}
                  {!isSelected && hasAcceptedDate && (
                    <span className="absolute bottom-0.5 text-[8px] leading-none">❤️</span>
                  )}
                  {!isSelected && !hasAcceptedDate && hasPendingDate && (
                    <span className="absolute bottom-0.5 text-[8px] leading-none">🤍</span>
                  )}
                  {hasEvent && !isSelected && !hasDate && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vertically Scrollable List of Months (iOS-like continuous layout) */
        <div className="glass-card rounded-3xl p-5 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Лента месяцев</span>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="font-extrabold text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-100/10 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Перейти к дате</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-8 overflow-y-auto max-h-[480px] pr-1 scroll-smooth">
            {Array.from({ length: 9 * 12 }, (_, i) => {
              // January 2020 to December 2028 (9 years)
              const yOffset = Math.floor(i / 12);
              const mOffset = i % 12;
              const targetYear = 2020 + yOffset;
              const targetMonth = mOffset;
              const targetDate = new Date(targetYear, targetMonth, 1);
              const mYear = targetDate.getFullYear();
              const mMonth = targetDate.getMonth();
              const mDaysInMonth = new Date(mYear, mMonth + 1, 0).getDate();
              const mFirstDay = new Date(mYear, mMonth, 1).getDay();
              const mOffsetDays = mFirstDay === 0 ? 6 : mFirstDay - 1;

              const mDaysArray = Array.from({ length: mDaysInMonth }, (_, dayIdx) => dayIdx + 1);
              const mOffsetArray = Array.from({ length: mOffsetDays }, (_, offsetIdx) => offsetIdx);

              return (
                <div 
                  key={`scroll-month-${i}`} 
                  id={`scroll-month-${mYear}-${mMonth}`}
                  className="border-b border-rose-100/20 dark:border-rose-950/10 pb-6 last:border-none last:pb-0"
                >
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-rose-100 mb-3 px-1">
                    {monthNames[mMonth]} {mYear}
                  </h3>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {mOffsetArray.map((offset) => (
                      <div key={`scroll-offset-${i}-${offset}`} className="h-10"></div>
                    ))}

                    {mDaysArray.map((day) => {
                      const dayEvents = getEventsForDay(day, mMonth, mYear);
                      const dayDates = getDatesForDay(day, mMonth, mYear);
                      const isSelected = selectedDay === day && month === mMonth && year === mYear;
                      const hasEvent = dayEvents.length > 0;
                      const hasDate = dayDates.length > 0;
                      const hasPendingDate = dayDates.some((d) => d.status === "pending");
                      const hasAcceptedDate = dayDates.some((d) => d.status === "accepted");
                      const isToday = 
                        day === new Date().getDate() && 
                        mMonth === new Date().getMonth() && 
                        mYear === new Date().getFullYear();

                      return (
                        <button
                          key={`scroll-day-${i}-${day}`}
                          onClick={() => {
                            setCurrentDate(new Date(mYear, mMonth, 1));
                            setSelectedDay(day);
                          }}
                          className={`h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all overflow-visible ${
                            isSelected
                              ? "bg-rose-gradient text-white shadow-md shadow-rose-200/40 scale-105"
                              : isToday
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                              : "hover:bg-rose-50/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{day}</span>
                          {hasEvent && !isSelected && <SketchyCircle />}
                          {!isSelected && hasAcceptedDate && (
                            <span className="absolute bottom-0.5 text-[8px] leading-none">❤️</span>
                          )}
                          {!isSelected && !hasAcceptedDate && hasPendingDate && (
                            <span className="absolute bottom-0.5 text-[8px] leading-none">🤍</span>
                          )}
                          {hasEvent && !isSelected && !hasDate && (
                            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

            {(selectedDayEvents.length > 0 || selectedDayDates.length > 0) ? (
              <div className="relative pl-6 border-l-[1.5px] border-dashed border-rose-200 dark:border-rose-950/30 flex flex-col gap-4">
                {/* Anniversaries */}
                {selectedDayEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const yearsDiff = year - eventDate.getFullYear();
                  const isCreatorMe = event.createdById === user?.telegramId;

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline Node Icon */}
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

                {/* Date Events */}
                {selectedDayDates.map((date) => {
                  const isCreatorMe = date.createdById === user?.telegramId;

                  return (
                    <div key={date.id} className="relative">
                      {/* Timeline Node Icon */}
                      <div className="absolute left-[-33px] top-1.5 h-5.5 w-5.5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[11px] shadow-sm">
                        🌹
                      </div>
                      
                      {/* Timeline Card */}
                      <div className="p-4 bg-white/40 dark:bg-slate-900/40 border border-indigo-100/30 dark:border-indigo-950/10 rounded-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-rose-100 leading-tight">
                              Свидание: "{date.title}"
                            </h4>
                            {date.status === "accepted" ? (
                              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                Встреча 💕
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                Ожидает ответа ⏳
                              </span>
                            )}
                          </div>
                          {date.location && (
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                              📍 Место: {date.location}
                            </p>
                          )}
                          {date.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">
                              {date.description}
                            </p>
                          )}
                          <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md mt-2 inline-block">
                            Организатор: {isCreatorMe ? "Вы" : (partner?.firstName || "Партнер")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Памятных дат и свиданий пока нет на этот день.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Month & Year Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm rounded-3xl p-6 shadow-xl border border-rose-100/20 dark:border-rose-950/20 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-rose-100/10">
              <span className="text-sm font-black text-slate-800 dark:text-rose-100">Выберите дату</span>
              <button 
                onClick={() => setIsPickerOpen(false)}
                className="h-7 w-7 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 h-64">
              {/* Year Column */}
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 sticky top-0 bg-transparent backdrop-blur-sm py-1">Год</span>
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                  <button
                    key={y}
                    onClick={() => setPickerYear(y)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all text-left ${
                      pickerYear === y
                        ? "bg-rose-gradient text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {y} год
                  </button>
                ))}
              </div>

              {/* Month Column */}
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 sticky top-0 bg-transparent backdrop-blur-sm py-1">Месяц</span>
                {monthNames.map((mName, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPickerMonth(idx)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all text-left ${
                      pickerMonth === idx
                        ? "bg-rose-gradient text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {mName}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => handleSelectDate(pickerYear, pickerMonth)}
              className="w-full py-3 rounded-2xl bg-rose-gradient text-white text-xs font-extrabold shadow-md shadow-rose-200/50 transition-all active:scale-98 text-center"
            >
              Подтвердить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
