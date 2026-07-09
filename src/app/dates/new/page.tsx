"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Calendar, Clock, AlignLeft } from "lucide-react";

export default function NewDatePage() {
  const { initData, refetch } = useTelegram();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          dateTime: combinedDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await refetch();
        router.refresh();
        router.push("/dates");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не удалось запланировать свидание.");
      }
    } catch (error) {
      console.error(error);
      alert("Сетевая ошибка при создании свидания.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          Свидание мечты <Heart className="h-6 w-6 text-rose-500 fill-rose-500/20" />
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Заполните детали. Мы сразу уведомим вашего партнера через Telegram-бота!
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Heart className="h-3 w-3 text-rose-400" /> Название свидания
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Романтический ужин, поход в кино..."
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3 w-3 text-rose-400" /> Место встречи
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ресторан, парк, дома..."
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-rose-400" /> Дата
            </label>
            <input
              type="date"
              required
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3 text-rose-400" /> Время
            </label>
            <input
              type="time"
              required
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlignLeft className="h-3 w-3 text-rose-400" /> Описание / Детали
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Секретный дресс-код, что взять с собой..."
            rows={4}
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push("/dates")}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-rose-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            {submitting ? "Приглашаем..." : "Пригласить"}
          </button>
        </div>
      </form>
    </div>
  );
}
