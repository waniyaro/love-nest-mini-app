"use client";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { Calendar, MapPin, Clock, Plus, Heart, Compass } from "lucide-react";

interface DateEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  isCompleted: boolean;
  createdById: string;
}

export default function DatesPage() {
  const { initData, user } = useTelegram();
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter tab: "upcoming" | "past"
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const loadDates = useCallback(async () => {
    try {
      const res = await fetch("/api/dates", {
        headers: { Authorization: `Bearer ${initData}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDates(data.dates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateVal || !timeVal) return;

    setSubmitting(true);
    try {
      const combinedDateTime = new Date(`${dateVal}T${timeVal}`);
      const res = await fetch("/api/dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          dateTime: combinedDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        await loadDates();
        setIsModalOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setLocation("");
        setDateVal("");
        setTimeVal("");
        
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

  // Filter dates
  const now = new Date();
  const upcomingDates = dates.filter((d) => new Date(d.dateTime) >= now);
  const pastDates = dates.filter((d) => new Date(d.dateTime) < now);

  const displayedDates = activeTab === "upcoming" ? upcomingDates : pastDates;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Свидания <span className="text-rose-500">❤️</span>
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1 transition-all"
        >
          <Plus className="h-4 w-4" />
          Запланировать
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "upcoming"
              ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Предстоящие ({upcomingDates.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "past"
              ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Прошедшие ({pastDates.length})
        </button>
      </div>

      {/* Dates List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : displayedDates.length > 0 ? (
        <div className="flex flex-col gap-4">
          {displayedDates.map((date) => {
            const dateObj = new Date(date.dateTime);
            const formattedDate = dateObj.toLocaleDateString("ru-RU", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const formattedTime = dateObj.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={date.id}
                className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 dark:text-rose-100 text-base">
                    {date.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold">
                    {date.createdById === user?.telegramId ? "Вы пригласили" : "Вас пригласили"}
                  </span>
                </div>

                {date.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {date.description}
                  </p>
                )}

                {/* Details grid */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-rose-950/20 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <span className="truncate capitalize">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <span>{formattedTime}</span>
                  </div>
                  {date.location && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="h-4 w-4 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{date.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-4 animate-float">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-rose-100 text-sm">
            {activeTab === "upcoming" ? "Нет запланированных свиданий" : "История свиданий пуста"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            {activeTab === "upcoming" 
              ? "Устройте романтический сюрприз вашему партнеру прямо сейчас!" 
              : "Самые прекрасные моменты еще впереди!"}
          </p>
        </div>
      )}

      {/* Schedule Date Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 flex items-center gap-1">
                Свидание мечты <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Заполните детали. Мы уведомим вашего партнера через бота!
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Название свидания
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, Романтический ужин при свечах"
                className="h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Место встречи
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ресторан, парк, домашний кинотеатр"
                className="h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Дата
                </label>
                <input
                  type="date"
                  required
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Время
                </label>
                <input
                  type="time"
                  required
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Описание / Детали
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Что надеть, что взять с собой, секретный дресс-код..."
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
                {submitting ? "Приглашаем..." : "Пригласить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
