"use client";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { Gift, Plus, ExternalLink, Heart, Trash2 } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  url: string;
  isPurchased: boolean;
  createdById: string;
}

export default function WishlistPage() {
  const { initData, user } = useTelegram();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${initData}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    // Quick prefix for URL if missing http/https
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = `https://${url}`;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          title,
          url: formattedUrl,
        }),
      });

      if (res.ok) {
        await loadWishlist();
        setIsModalOpen(false);
        setTitle("");
        setUrl("");
        
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

  const handleTogglePurchased = async (id: string) => {
    // Optimistic UI Update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPurchased: !item.isPurchased } : item))
    );

    try {
      const res = await fetch(`/api/wishlist?id=${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${initData}` },
      });
      if (!res.ok) {
        // Rollback on error
        await loadWishlist();
      } else {
        // Haptic feedback selection changed
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
      }
    } catch (e) {
      console.error(e);
      await loadWishlist();
    }
  };

  const handleDelete = async (id: string) => {
    const originalItems = [...items];
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await fetch(`/api/wishlist?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${initData}` },
      });
      if (!res.ok) {
        setItems(originalItems);
      } else {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
        }
      }
    } catch (e) {
      console.error(e);
      setItems(originalItems);
    }
  };

  // Extract hostname for cleaner URL displays
  const getDomain = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace("www.", "");
    } catch (e) {
      return "ссылка";
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Вишлист <span className="text-rose-500">🎁</span>
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1 transition-all"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Wishlist Items List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-4.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`glass-card rounded-2xl p-4.5 flex items-center justify-between transition-all duration-300 ${
                item.isPurchased ? "opacity-60 bg-slate-50/20 dark:bg-slate-900/20" : ""
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Custom toggle button (heart checkbox) */}
                <button
                  onClick={() => handleTogglePurchased(item.id)}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all flex-shrink-0 ${
                    item.isPurchased
                      ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                      : "border-rose-200 dark:border-rose-950/60 hover:border-rose-400 text-rose-400"
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${item.isPurchased ? "fill-white stroke-none" : "stroke-[2.5px]"}`} />
                </button>

                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-bold text-xs text-slate-800 dark:text-rose-100 truncate ${
                      item.isPurchased ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {item.title}
                  </h3>
                  
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{getDomain(item.url)}</span>
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:text-slate-500 transition-all flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-4 animate-float">
            <Gift className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-rose-100 text-sm">
            Ваш вишлист пока пуст
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            Добавляйте ссылки на подарки и сюрпризы, о которых мечтаете!
          </p>
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-4"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
                Новое желание <Gift className="h-5 w-5 text-rose-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Добавьте товар в вишлист, и мы сообщим вашему партнеру!
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Название товара
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что за подарок (например, Парные кольца)"
                className="h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ссылка на товар
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://wildberries.ru/catalog/..."
                className="h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
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
                {submitting ? "Добавляем..." : "Добавить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
