"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useTelegram } from "@/components/TelegramProvider";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Clock, Trash2, Smile, ImageIcon, Check, X } from "lucide-react";

interface DateEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  isCompleted: boolean;
  createdById: string;
  status: string; // "pending" | "accepted" | "declined"
  creatorFeedback: string | null;
  creatorEmoji: string | null;
  partnerFeedback: string | null;
  partnerEmoji: string | null;
  photo: string | null;
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

export default function DateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { initData, user, partner, refetch: refetchContext } = useTelegram();
  const router = useRouter();

  const [date, setDate] = useState<DateEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [reviewText, setReviewText] = useState("");
  const [reviewEmoji, setReviewEmoji] = useState("❤️");
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDateDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/dates?id=${id}`, {
        headers: { Authorization: `Bearer ${initData}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDate(data.date);
      } else {
        router.push("/dates");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, initData, router]);

  useEffect(() => {
    loadDateDetails();
  }, [loadDateDetails]);

  const handleUpdateStatus = async (status: "accepted" | "declined") => {
    try {
      const res = await fetch(`/api/dates?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await loadDateDetails();
        await refetchContext();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewText.trim()) return;
    setSavingReview(true);
    try {
      const res = await fetch(`/api/dates?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          feedback: reviewText.trim(),
          emoji: reviewEmoji,
          photo: reviewPhoto,
          isCompleted: true,
        }),
      });

      if (res.ok) {
        setReviewText("");
        setReviewEmoji("❤️");
        setReviewPhoto(null);
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await loadDateDetails();
        await refetchContext();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteDate = async () => {
    const message = "Вы действительно хотите удалить это свидание?";
    const proceedDelete = async () => {
      try {
        const res = await fetch(`/api/dates?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${initData}` },
        });

        if (res.ok) {
          if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
          }
          await refetchContext();
          router.refresh();
          router.push("/dates");
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setReviewPhoto(compressed);
    } catch (err) {
      console.error("Error compressing image:", err);
      alert("Не удалось загрузить изображение.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!date) return null;

  const isCreatorMe = date.createdById === user?.telegramId;
  const isPast = new Date(date.dateTime) < new Date();
  
  const dateObj = new Date(date.dateTime);
  const formattedDate = dateObj.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel = 
    date.status === "accepted" ? "Принято" : 
    date.status === "declined" ? "Перенесено" : "Ожидает подтверждения";

  return (
    <div className="flex flex-col gap-6 pb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
          Детали встречи
        </h1>
        <button
          onClick={handleDeleteDate}
          className="h-9 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 hover:text-red-600 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <Trash2 className="h-4 w-4" /> Удалить
        </button>
      </div>

      {/* Main Details Card */}
      <div className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Свидание
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-rose-100 mt-1">
            {date.title}
          </h2>
        </div>

        {date.description && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Описание / Дресс-код
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
              {date.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Дата и время
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex flex-col gap-0.5">
              <span className="flex items-center gap-1">📅 {formattedDate}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {formattedTime}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Место встречи
            </span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span className="truncate">{date.location || "Не указано"}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Status */}
        <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Статус подтверждения
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              date.status === "accepted" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
              date.status === "declined" ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" :
              "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
            }`}>
              {statusLabel}
            </span>
            <span className="text-[9px] font-medium text-slate-400">
              Создал(а): {isCreatorMe ? "Вы" : (partner?.firstName || "Партнер")}
            </span>
          </div>

          {!isPast && date.status === "pending" && (
            <div className="bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-rose-100/20 mt-2">
              {isCreatorMe ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center italic">
                  Ожидаем ответа от {partner?.firstName || "второй половинки"}...
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                    {partner?.firstName || "Партнер"} приглашает вас! Подтвердите встречу:
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateStatus("declined")}
                      className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <X className="h-4 w-4 text-red-500" /> Отклонить
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("accepted")}
                      className="flex-1 h-10 rounded-xl bg-rose-gradient text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Check className="h-4 w-4" /> Принять
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Album & Reviews section for past dates */}
      {isPast && (
        <div className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          <h3 className="text-sm font-extrabold text-rose-500 flex items-center gap-1.5">
            <Smile className="h-5 w-5" /> Альбом воспоминаний свидания
          </h3>

          {/* Existing Reviews */}
          <div className="grid grid-cols-2 gap-4">
            {/* Creator Review */}
            <div className="bg-rose-50/30 dark:bg-rose-950/10 p-4 rounded-2xl border border-rose-100/10">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {isCreatorMe ? "Ваши впечатления" : `Отзыв ${partner?.firstName || "партнера"}`}
              </span>
              {date.creatorFeedback ? (
                <div className="mt-2">
                  <span className="text-xl block">{date.creatorEmoji}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic font-semibold mt-1.5 whitespace-pre-wrap leading-relaxed">
                    "{date.creatorFeedback}"
                  </p>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block italic mt-2">
                  Отзыв еще не оставлен
                </span>
              )}
            </div>

            {/* Partner Review */}
            <div className="bg-indigo-50/30 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-100/10">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {!isCreatorMe ? "Ваши впечатления" : `Отзыв ${partner?.firstName || "партнера"}`}
              </span>
              {date.partnerFeedback ? (
                <div className="mt-2">
                  <span className="text-xl block">{date.partnerEmoji}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic font-semibold mt-1.5 whitespace-pre-wrap leading-relaxed">
                    "{date.partnerFeedback}"
                  </p>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block italic mt-2">
                  Отзыв еще не оставлен
                </span>
              )}
            </div>
          </div>

          {/* Photo */}
          {date.photo && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Фотография воспоминания:
              </span>
              <div className="rounded-2xl overflow-hidden shadow-md border border-rose-100/20 max-h-64 w-full relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={date.photo} alt={date.title} className="w-full h-full object-cover max-h-64" />
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {((isCreatorMe && !date.creatorFeedback) || (!isCreatorMe && !date.partnerFeedback)) && (
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-rose-100/20 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Поделитесь впечатлениями от свидания:
              </span>

              {/* Emoji choices */}
              <div className="flex gap-2 justify-between">
                {["❤️", "🥰", "🥳", "🍷", "🍿", "🌳", "😴"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setReviewEmoji(emoji)}
                    className={`h-9 w-9 text-lg rounded-xl flex items-center justify-center transition-all ${
                      reviewEmoji === emoji ? "bg-rose-100 scale-110 shadow-sm" : "hover:bg-slate-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Note input */}
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Было очень тепло и вкусно! Спасибо за этот вечер..."
                rows={3}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white dark:bg-slate-950 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
              />

              {/* Photo Upload */}
              {!date.photo && (
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {reviewPhoto ? (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={reviewPhoto} alt="Review preview" className="h-9 w-9 object-cover rounded" />
                        <span className="text-[10px] font-bold text-slate-500">Изображение загружено!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewPhoto(null)}
                        className="text-[10px] font-bold text-red-500 uppercase px-2"
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
                      <ImageIcon className="h-4.5 w-4.5" /> Загрузить памятный кадр
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleSaveReview}
                disabled={savingReview || !reviewText.trim()}
                className="h-11 rounded-xl bg-rose-gradient text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 mt-1 active:scale-95"
              >
                {savingReview ? "Сохраняем..." : "Сохранить воспоминания"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
