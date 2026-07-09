"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, ExternalLink, Heart, Trash2, MapPin, Check, Sparkles, HeartIcon } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  url: string | null;
  price: string | null;
  type: string; // "item" or "place"
  isPurchased: boolean;
  createdById: string;
  description: string | null;
  photo: string | null;
  creatorRating: number | null;
  partnerRating: number | null;
}

export default function WishlistPage() {
  const { initData, user, partner } = useTelegram();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation Tabs State
  const [mainTab, setMainTab] = useState<"items" | "places">("items");
  const [itemSubTab, setItemSubTab] = useState<"my" | "partner">("my");

  // Expanded card state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${initData}` },
        cache: "no-store",
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

  const handleTogglePurchased = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid expanding card
    
    // Optimistic UI Update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPurchased: !item.isPurchased } : item))
    );

    try {
      const res = await fetch(`/api/wishlist?id=${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}` 
        },
        body: JSON.stringify({ togglePurchased: true }),
      });
      if (!res.ok) {
        await loadWishlist();
      } else {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
      }
    } catch (e) {
      console.error(e);
      await loadWishlist();
    }
  };

  const handleUpdateRating = async (id: string, selectedRating: number) => {
    try {
      const res = await fetch(`/api/wishlist?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({ rating: selectedRating }),
      });

      if (res.ok) {
        await loadWishlist();
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid expanding card

    const message = "Вы уверены, что хотите удалить этот элемент?";
    const proceedDelete = async () => {
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
      } catch (err) {
        console.error(err);
        setItems(originalItems);
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

  const getDomain = (urlStr: string | null) => {
    if (!urlStr) return "";
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace("www.", "");
    } catch (e) {
      return "ссылка";
    }
  };

  const getDomainStyle = (domain: string) => {
    if (domain.includes("wildberries") || domain.includes("wb.")) {
      return "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300";
    }
    if (domain.includes("ozon")) {
      return "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300";
    }
    if (domain.includes("yandex") || domain.includes("market.yandex")) {
      return "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300";
    }
    if (domain.includes("aliexpress") || domain.includes("ali.")) {
      return "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300";
    }
    return "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300";
  };

  const itemsList = items.filter((item) => item.type === "place" ? false : true);
  const myItemsList = itemsList.filter((item) => item.createdById === user?.telegramId);
  const partnerItemsList = itemsList.filter((item) => item.createdById !== user?.telegramId);

  const placesList = items.filter((item) => item.type === "place");

  let displayedItems: WishlistItem[] = [];
  if (mainTab === "items") {
    displayedItems = itemSubTab === "my" ? myItemsList : partnerItemsList;
  } else {
    displayedItems = placesList;
  }

  const navigateToNew = () => {
    const typeQuery = mainTab === "places" ? "place" : "item";
    router.push(`/wishlist/new?type=${typeQuery}`);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          {mainTab === "items" ? "Вишлист" : "Места"}{" "}
          {mainTab === "items" ? (
            <Gift className="h-5 w-5 text-rose-500 fill-rose-500/20" />
          ) : (
            <MapPin className="h-5 w-5 text-rose-500 fill-rose-500/20" />
          )}
        </h1>
        <button
          onClick={navigateToNew}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative">
        <button
          onClick={() => {
            setMainTab("items");
            setExpandedItemId(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            mainTab === "items" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Вещи ({itemsList.length})
        </button>
        <button
          onClick={() => {
            setMainTab("places");
            setExpandedItemId(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            mainTab === "places" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Места ({placesList.length})
        </button>
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 ease-out ${
            mainTab === "items" ? "left-1.5" : "left-[calc(50%)]"
          }`}
        ></div>
      </div>

      {/* Sub-tabs for Items */}
      {mainTab === "items" && (
        <div className="flex bg-rose-50/40 dark:bg-rose-950/5 border border-rose-100/40 dark:border-rose-950/10 p-1.5 rounded-xl relative">
          <button
            onClick={() => {
              setItemSubTab("my");
              setExpandedItemId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 relative z-10 ${
              itemSubTab === "my" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Мой вишлист ({myItemsList.length})
          </button>
          <button
            onClick={() => {
              setItemSubTab("partner");
              setExpandedItemId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 relative z-10 ${
              itemSubTab === "partner" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Список {partner?.firstName || "партнера"} ({partnerItemsList.length})
          </button>
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-all duration-300 ease-out ${
              itemSubTab === "my" ? "left-1.5" : "left-[calc(50%)]"
            }`}
          ></div>
        </div>
      )}

      {/* Items / Places List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : mainTab === "items" && itemSubTab === "partner" && !partner ? (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 mb-4 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-rose-100 text-sm">
            Партнер еще не присоединился
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
            Поделитесь ссылкой-приглашением из профиля, чтобы объединить ваши аккаунты!
          </p>
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {displayedItems.map((item) => {
            const domain = getDomain(item.url);
            const isCreatorMe = item.createdById === user?.telegramId;
            const isExpanded = expandedItemId === item.id;
            const cardBg = item.isPurchased 
              ? "opacity-55 scale-[0.98] bg-slate-50/10 dark:bg-slate-900/10" 
              : "hover:scale-[1.01]";

            // Determine ratings
            const myRating = isCreatorMe ? item.creatorRating : item.partnerRating;
            const partnerRating = isCreatorMe ? item.partnerRating : item.creatorRating;

            return (
              <div key={item.id} className="flex flex-col">
                <div
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className={`glass-card rounded-3xl p-4 flex items-center justify-between transition-all duration-300 cursor-pointer ${cardBg} ${
                    isExpanded ? "ring-2 ring-rose-300/60 dark:ring-rose-950/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Toggle check button */}
                    <button
                      onClick={(e) => handleTogglePurchased(item.id, e)}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all flex-shrink-0 active:scale-90 ${
                        item.isPurchased
                          ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                          : "border-rose-200 dark:border-rose-950/60 hover:border-rose-400 text-rose-400"
                      }`}
                    >
                      {mainTab === "items" ? (
                        <Heart className={`h-4.5 w-4.5 ${item.isPurchased ? "fill-white stroke-none" : "stroke-[2.5px]"}`} />
                      ) : (
                        <Check className={`h-4.5 w-4.5 stroke-[3px] ${item.isPurchased ? "text-white" : "text-rose-400"}`} />
                      )}
                    </button>

                    {/* Thumbnail Image / Default Category Icon */}
                    <div className="h-12 w-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-50/60 dark:bg-slate-900/50 border border-slate-100/10 shadow-inner">
                      {item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photo} alt={item.title} className="h-full w-full object-cover" />
                      ) : item.type === "place" ? (
                        <MapPin className="h-5 w-5 text-indigo-500 fill-indigo-500/10" />
                      ) : (
                        <Gift className="h-5 w-5 text-rose-500 fill-rose-500/10" />
                      )}
                    </div>

                    {/* Text block */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3
                          className={`font-black text-sm text-slate-800 dark:text-rose-100 truncate ${
                            item.isPurchased ? "line-through text-slate-400 dark:text-slate-500" : ""
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.price && (
                          <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            {item.price}
                          </span>
                        )}
                      </div>

                      {/* Heart rating preview on collapsed card for places */}
                      {item.type === "place" && (myRating || partnerRating) && (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center mt-1 text-[10px]">
                          {myRating && (
                            <div className="flex gap-0.5 items-center text-slate-600 dark:text-slate-400">
                              <span className="font-bold">Вы:</span>
                              {Array.from({ length: myRating }).map((_, idx) => (
                                <HeartIcon key={`my-heart-col-${item.id}-${idx}`} className="h-3 w-3 text-rose-500 fill-rose-500" />
                              ))}
                            </div>
                          )}
                          {myRating && partnerRating && <span className="text-slate-300 dark:text-slate-700">|</span>}
                          {partnerRating && (
                            <div className="flex gap-0.5 items-center text-slate-600 dark:text-slate-400">
                              <span className="font-bold">{partner?.firstName || "Партнер"}:</span>
                              {Array.from({ length: partnerRating }).map((_, idx) => (
                                <HeartIcon key={`part-heart-col-${item.id}-${idx}`} className="h-3 w-3 text-indigo-500 fill-indigo-500" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Avoid expansion when clicking link
                            className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-opacity hover:opacity-90 ${getDomainStyle(domain)}`}
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span>{domain}</span>
                          </a>
                        )}
                        <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md">
                          Добавил(а): {isCreatorMe ? "Вы" : (partner?.firstName || "Партнер")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isCreatorMe && (
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="h-9 w-9 rounded-xl bg-slate-100/80 hover:bg-rose-100 text-slate-400 hover:text-rose-500 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:text-slate-500 transition-all flex items-center justify-center active:scale-95 ml-3"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="glass-card rounded-2xl mt-2 p-5 flex flex-col gap-4 border border-rose-100/40 dark:border-rose-950/10 bg-white/40 dark:bg-slate-950/40 animate-fade-in">
                    {item.description && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Дополнительная информация:</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* Places Ratings Setting Section */}
                    {item.type === "place" && (
                      <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4 flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Насколько мы хотим сходить сюда?
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          {/* My rating */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Ваша оценка:
                            </span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((heart) => (
                                <button
                                  key={`my-rating-${heart}`}
                                  type="button"
                                  onClick={() => handleUpdateRating(item.id, heart)}
                                  className="transition-all hover:scale-110 active:scale-95"
                                >
                                  <HeartIcon
                                    className={`h-5 w-5 ${
                                      (myRating || 0) >= heart
                                        ? "text-rose-500 fill-rose-500"
                                        : "text-slate-300 dark:text-slate-700"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Partner rating */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Оценка {partner?.firstName || "партнера"}:
                            </span>
                            <div className="flex gap-1 items-center">
                              {partner ? (
                                [1, 2, 3, 4, 5].map((heart) => (
                                  <HeartIcon
                                    key={`partner-rating-${heart}`}
                                    className={`h-5 w-5 ${
                                      (partnerRating || 0) >= heart
                                        ? "text-rose-400 fill-rose-400"
                                        : "text-slate-300 dark:text-slate-700"
                                    }`}
                                  />
                                ))
                              ) : (
                                <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
                                  Ожидаем партнера...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!item.description && item.type !== "place" && (
                      <span className="text-[10px] italic text-slate-400 dark:text-slate-500 text-center">
                        Дополнительной информации нет.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-4 animate-float">
            {mainTab === "items" ? <Gift className="h-7 w-7" /> : <MapPin className="h-7 w-7" />}
          </div>
          <h3 className="font-bold text-slate-700 dark:text-rose-100 text-sm">
            {mainTab === "items" 
              ? (itemSubTab === "my" ? "Ваш вишлист пока пуст" : `Вишлист ${partner?.firstName || "партнера"} пуст`)
              : "Список мест пока пуст"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            {mainTab === "items"
              ? (itemSubTab === "my" ? "Добавьте вещи и сюрпризы, о которых вы мечтаете!" : "Партнер еще не добавил сюда свои желания.")
              : "Добавьте места, куда вы хотели бы сходить вместе!"}
          </p>
        </div>
      )}
    </div>
  );
}
