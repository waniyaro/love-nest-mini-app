"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Clock, Plus, ChevronRight } from "lucide-react";

interface DateEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  isCompleted: boolean;
  createdById: string;
  status: string; // "pending" | "accepted" | "declined"
}

export default function DatesPage() {
  const { initData, user, partner } = useTelegram();
  const router = useRouter();
  
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const loadDates = useCallback(async () => {
    try {
      const res = await fetch("/api/dates", {
        headers: { Authorization: `Bearer ${initData}` },
        cache: "no-store",
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

  // Filter dates
  const now = new Date();
  const upcomingDates = dates.filter((d) => new Date(d.dateTime) >= now);
  const pastDates = dates.filter((d) => new Date(d.dateTime) < now);

  const displayedDates = activeTab === "upcoming" ? upcomingDates : pastDates;

  // Icons based on title keywords
  const getEventIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("ужин") || lower.includes("ресторан") || lower.includes("еда") || lower.includes("кафе") || lower.includes("вино") || lower.includes("бар")) return "🍽️";
    if (lower.includes("кино") || lower.includes("фильм") || lower.includes("сериал") || lower.includes("кинотеатр")) return "🍿";
    if (lower.includes("прогулка") || lower.includes("парк") || lower.includes("гулять") || lower.includes("лес")) return "🌳";
    if (lower.includes("поездка") || lower.includes("путешествие") || lower.includes("отель") || lower.includes("самолет") || lower.includes("море")) return "✈️";
    if (lower.includes("театр") || lower.includes("музей") || lower.includes("выставка") || lower.includes("концерт")) return "🎭";
    if (lower.includes("спорт") || lower.includes("актив") || lower.includes("каток") || lower.includes("лыжи") || lower.includes("велосипед")) return "⛸️";
    if (lower.includes("игры") || lower.includes("плойка") || lower.includes("настолки") || lower.includes("игру")) return "🎮";
    if (lower.includes("кофе") || lower.includes("чай") || lower.includes("кофейня")) return "☕";
    return "💖";
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Свидания <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
        </h1>
        <button
          onClick={() => router.push("/dates/new")}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Создать
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            activeTab === "upcoming" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Предстоящие ({upcomingDates.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            activeTab === "past" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Прошедшие ({pastDates.length})
        </button>
        
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 ease-out ${
            activeTab === "upcoming" ? "left-1.5" : "left-[calc(50%)]"
          }`}
        ></div>
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
            const formattedMonth = dateObj.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
            const formattedDay = dateObj.getDate();
            const formattedTime = dateObj.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const isCreatorMe = date.createdById === user?.telegramId;
            const statusLabel = 
              date.status === "accepted" ? "Принято" : 
              date.status === "declined" ? "Перенесено" : "Ожидает ответа";

            return (
              <div
                key={date.id}
                onClick={() => router.push(`/dates/${date.id}`)}
                className="glass-card rounded-3xl flex overflow-hidden min-h-32 relative shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-slate-100/10"
              >
                <div className={`w-2 flex-shrink-0 ${isCreatorMe ? "bg-rose-gradient" : "bg-partner-gradient"}`}></div>
                
                {/* Content side */}
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getEventIcon(date.title)}</span>
                      <h3 className="font-extrabold text-slate-800 dark:text-rose-100 text-base leading-tight truncate">
                        {date.title}
                      </h3>
                    </div>
                    {date.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {date.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Badges / Details Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                    {date.location && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-100/5 dark:border-slate-800/10">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{date.location}</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      date.status === "accepted" ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/20 dark:bg-emerald-950/20 dark:text-emerald-400" :
                      date.status === "declined" ? "bg-red-50/50 text-red-500 border-red-100/20 dark:bg-red-950/20 dark:text-red-400" :
                      "bg-amber-50/50 text-amber-500 border-amber-100/20 dark:bg-amber-950/20 dark:text-amber-400"
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="w-[1px] border-l-2 border-dashed border-rose-200/50 dark:border-rose-950/20 relative flex flex-col justify-between py-2">
                  <div className="absolute top-[-6px] left-[-7px] w-3 h-3 rounded-full bg-background border-b border-rose-200/30 dark:border-rose-950/20"></div>
                  <div className="absolute bottom-[-6px] left-[-7px] w-3 h-3 rounded-full bg-background border-t border-rose-200/30 dark:border-rose-950/20"></div>
                </div>

                {/* Right Date panel */}
                <div className="w-24 bg-rose-50/15 dark:bg-slate-900/10 flex flex-col items-center justify-center p-3 text-center relative">
                  <span className="text-[10px] font-bold text-rose-400 dark:text-rose-300 uppercase tracking-widest leading-none">
                    {formattedMonth}
                  </span>
                  <span className="text-3xl font-black text-rose-500 dark:text-rose-200 mt-1.5 leading-none">
                    {formattedDay}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-0.5 leading-none">
                    <Clock className="h-3 w-3" /> {formattedTime}
                  </span>
                  
                  <ChevronRight className="h-4 w-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-3xl mb-2">🎈</span>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {activeTab === "upcoming" ? "У вас пока нет предстоящих свиданий." : "Вы пока не сохранили историю свиданий."}
          </p>
          <button
            onClick={() => router.push("/dates/new")}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all"
          >
            Запланировать первое свидание
          </button>
        </div>
      )}
    </div>
  );
}
