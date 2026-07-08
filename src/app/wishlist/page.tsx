"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback, useRef } from "react";
import { Gift, Plus, ExternalLink, Heart, Trash2, MapPin, Check, Sparkles, Image as ImageIcon, HeartIcon } from "lucide-react";

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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function WishlistPage() {
  const { initData, user, partner } = useTelegram();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation Tabs State
  const [mainTab, setMainTab] = useState<"items" | "places">("items");
  const [itemSubTab, setItemSubTab] = useState<"my" | "partner">("my");

  // Expanded card state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!title) return;

    let formattedUrl = url.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
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
          title: title.trim(),
          url: formattedUrl || undefined,
          price: price.trim() || undefined,
          type: mainTab === "items" ? "item" : "place",
          description: description.trim() || undefined,
          photo: photo || undefined,
          rating: rating || undefined,
        }),
      });

      if (res.ok) {
        await loadWishlist();
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setUrl("");
        setPrice("");
        setPhoto(null);
        setRating(null);
        
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

    const confirmed = window.confirm("Вы уверены, что хотите удалить этот элемент?");
    if (!confirmed) return;

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch (err) {
      console.error("Error compressing image:", err);
      alert("Не удалось загрузить изображение.");
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
          onClick={() => setIsModalOpen(true)}
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
                  className={`glass-card rounded-2xl p-5 flex items-center justify-between transition-all duration-300 cursor-pointer ${cardBg} ${
                    isExpanded ? "ring-2 ring-rose-300/60 dark:ring-rose-950/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3
                          className={`font-extrabold text-sm text-slate-800 dark:text-rose-100 truncate ${
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

                    {item.photo && (
                      <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100/20 w-full max-h-48 mt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.photo} alt={item.title} className="w-full h-full object-cover max-h-48" />
                      </div>
                    )}

                    {/* Places Ratings Section */}
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

                    {!item.description && !item.photo && item.type !== "place" && (
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

      {/* Add Item / Place Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 overflow-y-auto max-h-[90vh] animate-float"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
                {mainTab === "items" ? "Новое желание" : "Новое место"}{" "}
                {mainTab === "items" ? (
                  <Gift className="h-5 w-5 text-rose-500" />
                ) : (
                  <MapPin className="h-5 w-5 text-rose-500" />
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mainTab === "items"
                  ? "Добавьте товар в вишлист, и мы сразу сообщим вашему партнеру!"
                  : "Добавьте место для свиданий, куда бы вы хотели сходить!"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Название {mainTab === "items" ? "желания" : "места"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={mainTab === "items" ? "Парные кулоны, плед..." : "Ресторан с панорамным видом, каток..."}
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {mainTab === "items" ? "Примерная цена (необязательно)" : "Примерный бюджет (необязательно)"}
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={mainTab === "items" ? "1500 ₽, $20..." : "3000 ₽, бесплатно..."}
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {mainTab === "items" ? "Ссылка на товар (необязательно)" : "Ссылка на карту / информацию (необязательно)"}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={mainTab === "items" ? "https://wildberries.ru/..." : "https://yandex.ru/maps/..."}
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Описание / Детали (необязательно)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Размер, цвет или примечания..."
                rows={2}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
              />
            </div>

            {/* Photo upload input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Фото / Иконка (необязательно)
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photo ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-rose-200">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Upload thumb" className="h-8 w-8 object-cover rounded" />
                    <span className="text-[9px] font-bold text-slate-500">Фото загружено!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="text-[9px] font-bold text-red-500 uppercase px-2 py-1"
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-xl border border-dashed border-rose-300 text-rose-500 hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="h-4.5 w-4.5" /> Выбрать изображение
                </button>
              )}
            </div>

            {/* Initial Rating setting for Places */}
            {mainTab === "places" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Ваша оценка желания пойти:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`new-rating-${val}`}
                      type="button"
                      onClick={() => setRating(val)}
                      className={`h-9 w-9 text-xs rounded-xl flex items-center justify-center transition-all ${
                        rating === val ? "bg-rose-100 text-rose-500 font-bold scale-110 shadow-sm" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {val} <HeartIcon className="h-3 w-3 fill-current ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setTitle("");
                  setUrl("");
                  setPrice("");
                  setPhoto(null);
                  setRating(null);
                  setDescription("");
                }}
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
      )}
    </div>
  );
}
