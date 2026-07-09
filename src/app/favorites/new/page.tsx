"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Film, Music, Compass, Sparkles, AlignLeft } from "lucide-react";

function NewFavoriteForm() {
  const { initData, refetch } = useTelegram();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get active category from search params or default to movie
  const paramCategory = searchParams.get("category");
  const initialCategory = ["movie", "song", "place", "other"].includes(paramCategory || "")
    ? (paramCategory as "movie" | "song" | "place" | "other")
    : "movie";

  const [category, setCategory] = useState<"movie" | "song" | "place" | "other">(initialCategory);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "movie": return <Film className="h-4.5 w-4.5" />;
      case "song": return <Music className="h-4.5 w-4.5" />;
      case "place": return <Compass className="h-4.5 w-4.5" />;
      default: return <Sparkles className="h-4.5 w-4.5" />;
    }
  };

  const getPlaceholderText = (cat: string) => {
    switch (cat) {
      case "movie": return "Интерстеллар, Титаник...";
      case "song": return "Perfect - Ed Sheeran...";
      case "place": return "Кофейня на углу...";
      default: return "Любимая настольная игра...";
    }
  };

  const getLabelText = (cat: string) => {
    switch (cat) {
      case "movie": return "Название фильма";
      case "song": return "Название песни";
      case "place": return "Название места";
      default: return "Название предмета/вещи";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await refetch();
        router.refresh();
        router.push("/favorites");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не удалось добавить в любимое.");
      }
    } catch (error) {
      console.error(error);
      alert("Сетевая ошибка при добавлении в любимое.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          Наше любимое <Star className="h-6 w-6 text-amber-400 fill-amber-400/20 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Добавьте предмет в наши общие списки лучших вещей!
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative gap-1 text-center">
        {(["movie", "song", "place", "other"] as const).map((cat) => {
          const isActive = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`py-2 text-[10px] font-bold rounded-xl transition-all duration-300 relative z-10 flex flex-col items-center gap-1 ${
                isActive ? "text-rose-500 bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-rose-400"
              }`}
            >
              {getCategoryIcon(cat)}
              <span>
                {cat === "movie" ? "Фильмы" : cat === "song" ? "Песни" : cat === "place" ? "Места" : "Разное"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {getLabelText(category)}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={getPlaceholderText(category)}
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlignLeft className="h-3 w-3 text-rose-400" /> Ваш отзыв / Описание
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Почему вы любите это? Ваши эмоции..."
            rows={4}
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push("/favorites")}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-rose-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            {submitting ? "Добавляем..." : "Добавить"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewFavoritePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    }>
      <NewFavoriteForm />
    </Suspense>
  );
}
