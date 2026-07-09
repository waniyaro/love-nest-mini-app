"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, Trash2, Film, Music, Compass, Sparkles, Edit3, Check, X, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface FavoriteItem {
  id: string;
  title: string;
  category: string; // "movie" | "song" | "place" | "other"
  creatorNote: string | null;
  partnerNote: string | null;
  createdById: string;
}

export default function FavoritesPage() {
  const { initData, user, partner } = useTelegram();
  const router = useRouter();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs for categories
  const [activeTab, setActiveTab] = useState<"movie" | "song" | "place" | "other">("movie");

  // Note Inline Editing State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${initData}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.favorites);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleUpdateNote = async (id: string) => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/favorites?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({ note: editingNoteValue.trim() }),
      });

      if (res.ok) {
        setEditingNoteId(null);
        setEditingNoteValue("");
        await loadFavorites();
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id: string) => {
    const message = "Вы уверены, что хотите удалить этот элемент?";
    const proceedDelete = async () => {
      try {
        const res = await fetch(`/api/favorites?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${initData}` },
        });
        if (res.ok) {
          await loadFavorites();
          if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
          }
        }
      } catch (e) {
        console.error(e);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "movie": return <Film className="h-4.5 w-4.5" />;
      case "song": return <Music className="h-4.5 w-4.5" />;
      case "place": return <Compass className="h-4.5 w-4.5" />;
      default: return <Sparkles className="h-4.5 w-4.5" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "movie": return "Любимые фильмы";
      case "song": return "Любимые песни";
      case "place": return "Любимые места";
      default: return "Разное";
    }
  };

  const filteredItems = items.filter((item) => item.category === activeTab);

  const handleAddClick = () => {
    router.push(`/favorites/new?category=${activeTab}`);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1">
          <Link href="/" className="h-8 w-8 rounded-xl bg-white/60 dark:bg-slate-900/60 flex items-center justify-center text-slate-600 dark:text-slate-400 mr-1 shadow-sm border border-rose-100/30">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
            Наше любимое <Star className="h-5 w-5 text-amber-400 fill-amber-400/20 animate-pulse" />
          </h1>
        </div>
        <button
          onClick={handleAddClick}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative gap-1 text-center">
        {(["movie", "song", "place", "other"] as const).map((cat) => {
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setEditingNoteId(null);
              }}
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

      {/* Favorite Items List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredItems.map((item) => {
            const isCreatorMe = item.createdById === user?.telegramId;
            
            // Notes mapping
            const myNote = isCreatorMe ? item.creatorNote : item.partnerNote;
            const partnerNote = isCreatorMe ? item.partnerNote : item.creatorNote;
            
            const isEditingMyNote = editingNoteId === `${item.id}-my`;

            return (
              <div
                key={item.id}
                className="glass-card rounded-3xl p-5 flex flex-col gap-4 border border-rose-100/40 dark:border-rose-950/10 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl flex-shrink-0">{getCategoryIcon(item.category)}</span>
                    <h3 className="font-extrabold text-slate-800 dark:text-rose-100 text-sm">
                      {item.title}
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-rose-50 dark:bg-slate-900/50 hover:text-rose-500 text-slate-400 transition-all flex items-center justify-center active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                  {/* My Note */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ваш отзыв:</span>
                      {!isEditingMyNote && (
                        <button
                          onClick={() => {
                            setEditingNoteId(`${item.id}-my`);
                            setEditingNoteValue(myNote || "");
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {isEditingMyNote ? (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <textarea
                          value={editingNoteValue}
                          onChange={(e) => setEditingNoteValue(e.target.value)}
                          placeholder="Ваши мысли..."
                          rows={2}
                          className="w-full p-2 rounded-xl border border-rose-200 bg-white dark:bg-slate-900 text-xs outline-none focus:border-rose-400 focus:ring-1 resize-none"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateNote(item.id)}
                            disabled={savingNote}
                            className="h-6 w-6 rounded-md bg-rose-gradient text-white flex items-center justify-center shadow-sm disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap mt-0.5">
                        {myNote || "Оставьте свой отзыв!"}
                      </p>
                    )}
                  </div>

                  {/* Partner Note */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Отзыв {partner?.firstName || "партнера"}:</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap mt-0.5">
                      {partner ? (partnerNote || "Пока без отзыва") : "Ожидаем партнера..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-4 animate-float">
            {getCategoryIcon(activeTab)}
          </div>
          <h3 className="font-bold text-slate-700 dark:text-rose-100 text-sm">
            {getCategoryName(activeTab)} пока пуст
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            Нажмите кнопку «Добавить», чтобы зафиксировать ваши любимые вещи!
          </p>
        </div>
      )}
    </div>
  );
}
