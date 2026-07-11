"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, AlignLeft, PartyPopper } from "lucide-react";

function NewEventForm() {
  const { initData, refetch } = useTelegram();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get values from query params or default to today
  const today = new Date();
  const paramDay = searchParams.get("day");
  const paramMonth = searchParams.get("month");
  const paramYear = searchParams.get("year");

  const day = paramDay ? parseInt(paramDay) : today.getDate();
  const month = paramMonth ? parseInt(paramMonth) : today.getMonth();
  const year = paramYear ? parseInt(paramYear) : today.getFullYear();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const monthNamesGenitive = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSubmitting(true);
    try {
      const eventDate = new Date(year, month, day, 12, 0, 0); // Noon to avoid timezone offset shifts
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          date: eventDate.toISOString(),
          isRecurring,
        }),
      });

      if (res.ok) {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await refetch();
        router.refresh();
        router.push("/calendar");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не удалось добавить событие.");
      }
    } catch (err) {
      console.error(err);
      alert("Сетевая ошибка при создании события.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          Запомнить дату <PartyPopper className="h-6 w-6 text-rose-500" />
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Добавьте знаменательное событие на <span className="font-extrabold text-rose-500">{day} {monthNamesGenitive[month]}</span>
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Star className="h-3 w-3 text-rose-400 fill-rose-400/20" /> Название события
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Годовщина встречи, день рождения..."
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlignLeft className="h-3 w-3 text-rose-400" /> Описание (необязательно)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Наши воспоминания о встрече или идеи для подарков..."
            rows={4}
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
          />
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 border border-rose-100/30 dark:border-rose-950/15 p-4 rounded-2xl select-none">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4.5 w-4.5 accent-rose-500 rounded border-rose-200 cursor-pointer"
          />
          <label htmlFor="isRecurring" className="flex flex-col cursor-pointer">
            <span className="text-xs font-extrabold text-slate-800 dark:text-rose-100">Повторять каждый год</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Событие будет автоматически появляться в календаре каждый год</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-rose-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            {submitting ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    }>
      <NewEventForm />
    </Suspense>
  );
}
