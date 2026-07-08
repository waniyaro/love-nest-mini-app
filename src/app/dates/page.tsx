"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useEffect, useState, useCallback, useRef } from "react";
import { Calendar, MapPin, Clock, Plus, Heart, Compass, Check, X, Trash2, Smile, MessageCircle, Image as ImageIcon } from "lucide-react";

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

export default function DatesPage() {
  const { initData, user, partner } = useTelegram();
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

  // Expanded card state
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null);

  // Review Form state
  const [reviewText, setReviewText] = useState("");
  const [reviewEmoji, setReviewEmoji] = useState("❤️");
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setTitle("");
        setDescription("");
        setLocation("");
        setDateVal("");
        setTimeVal("");
        
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

  const handleUpdateStatus = async (id: string, status: "accepted" | "declined") => {
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
        await loadDates();
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReview = async (id: string) => {
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
          feedback: reviewText,
          emoji: reviewEmoji,
          photo: reviewPhoto,
          isCompleted: true,
        }),
      });

      if (res.ok) {
        setReviewText("");
        setReviewEmoji("❤️");
        setReviewPhoto(null);
        await loadDates();
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteDate = async (id: string) => {
    const confirmed = window.confirm("Вы действительно хотите удалить это свидание?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dates?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${initData}` },
      });

      if (res.ok) {
        setExpandedDateId(null);
        await loadDates();
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
        }
      }
    } catch (err) {
      console.error(err);
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
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md shadow-rose-200/50 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Создать
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative">
        <button
          onClick={() => {
            setActiveTab("upcoming");
            setExpandedDateId(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            activeTab === "upcoming" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Предстоящие ({upcomingDates.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("past");
            setExpandedDateId(null);
          }}
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

            const isExpanded = expandedDateId === date.id;
            const isCreatorMe = date.createdById === user?.telegramId;
            const statusLabel = 
              date.status === "accepted" ? "Принято" : 
              date.status === "declined" ? "Перенесено" : "Ожидает ответа";

            return (
              <div key={date.id} className="flex flex-col">
                {/* Date Card Summary */}
                <div
                  onClick={() => setExpandedDateId(isExpanded ? null : date.id)}
                  className={`glass-card rounded-2xl flex overflow-hidden min-h-28 relative shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    isExpanded ? "ring-2 ring-rose-300/60 dark:ring-rose-950/60" : ""
                  }`}
                >
                  <div className={`w-1.5 flex-shrink-0 ${isCreatorMe ? "bg-rose-gradient" : "bg-partner-gradient"}`}></div>
                  
                  <div className="flex-1 p-4.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{getEventIcon(date.title)}</span>
                        <h3 className="font-extrabold text-slate-800 dark:text-rose-100 text-sm leading-tight truncate">
                          {date.title}
                        </h3>
                      </div>
                      {date.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {date.description}
                        </p>
                      )}
                    </div>
                    {date.location && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-2.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                        <span className="truncate max-w-[160px] font-semibold">{date.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-[1px] border-l-2 border-dashed border-rose-200/50 dark:border-rose-950/20 relative flex flex-col justify-between py-2">
                    <div className="absolute top-[-6px] left-[-7px] w-3 h-3 rounded-full bg-background border-b border-rose-200/30 dark:border-rose-950/20"></div>
                    <div className="absolute bottom-[-6px] left-[-7px] w-3 h-3 rounded-full bg-background border-t border-rose-200/30 dark:border-rose-950/20"></div>
                  </div>

                  <div className="w-24 bg-rose-50/15 dark:bg-slate-900/10 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-[9px] font-extrabold text-rose-400 dark:text-rose-300 uppercase tracking-widest leading-none">
                      {formattedMonth}
                    </span>
                    <span className="text-2xl font-black text-rose-500 dark:text-rose-200 mt-1 leading-none">
                      {formattedDay}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-0.5 leading-none">
                      <Clock className="h-2.5 w-2.5" /> {formattedTime}
                    </span>
                    <span className={`text-[8px] font-black mt-2.5 px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isCreatorMe
                        ? "bg-rose-100/60 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                        : "bg-indigo-100/60 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    }`}>
                      {isCreatorMe ? "Вы" : "Партнер"}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="glass-card rounded-2xl mt-2 p-5 flex flex-col gap-4 border border-rose-100/40 dark:border-rose-950/10 bg-white/40 dark:bg-slate-950/40 animate-fade-in">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Описание / Детали:</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                        {date.description || "Детали не указаны."}
                      </p>
                    </div>

                    {date.location && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Место проведения:</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-rose-400" />
                          {date.location}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Статус свидания:</h4>
                        <span className={`text-[10px] font-extrabold mt-1 inline-block ${
                          date.status === "accepted" ? "text-emerald-500" :
                          date.status === "declined" ? "text-red-400" : "text-amber-500"
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      {/* Delete Event Button */}
                      <button
                        onClick={() => handleDeleteDate(date.id)}
                        className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center transition-all"
                        title="Удалить свидание"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* UPCOMING DATE CONFIRMATIONS ACTIONS */}
                    {activeTab === "upcoming" && date.status === "pending" && (
                      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-rose-100/20 flex flex-col gap-2.5">
                        {isCreatorMe ? (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-center italic">
                            Ожидаем подтверждения от {partner?.firstName || "второй половинки"}...
                          </span>
                        ) : (
                          <>
                            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 text-center block">
                              {partner?.firstName || "Партнер"} приглашает вас на свидание!
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(date.id, "declined")}
                                className="flex-1 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <X className="h-3.5 w-3.5 text-red-400" /> Отклонить
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(date.id, "accepted")}
                                className="flex-1 h-9 rounded-lg bg-rose-gradient hover:opacity-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5" /> Принять
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* PAST DATE ALBUM & REVIEW SECTION */}
                    {activeTab === "past" && (
                      <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4 flex flex-col gap-4">
                        <h4 className="text-[10.5px] font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                          <Smile className="h-4 w-4" /> Альбом воспоминаний свидания
                        </h4>

                        {/* Display existing reviews */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Creator Review */}
                          <div className="bg-rose-50/20 dark:bg-rose-950/5 p-3 rounded-xl border border-rose-100/10">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                              {isCreatorMe ? "Ваши впечатления" : `Отзыв ${partner?.firstName || "партнера"}`}
                            </span>
                            {date.creatorFeedback ? (
                              <div className="mt-1.5">
                                <span className="text-base block">{date.creatorEmoji}</span>
                                <p className="text-[10.5px] text-slate-700 dark:text-slate-300 italic font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                                  {date.creatorFeedback}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-2 block italic">Впечатления еще не оставлены.</span>
                            )}
                          </div>

                          {/* Partner Review */}
                          <div className="bg-indigo-50/20 dark:bg-indigo-950/5 p-3 rounded-xl border border-indigo-100/10">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                              {!isCreatorMe ? "Ваши впечатления" : `Отзыв ${partner?.firstName || "партнера"}`}
                            </span>
                            {date.partnerFeedback ? (
                              <div className="mt-1.5">
                                <span className="text-base block">{date.partnerEmoji}</span>
                                <p className="text-[10.5px] text-slate-700 dark:text-slate-300 italic font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                                  {date.partnerFeedback}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-2 block italic">Впечатления еще не оставлены.</span>
                            )}
                          </div>
                        </div>

                        {/* Display shared photo if uploaded */}
                        {date.photo && (
                          <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100/20 w-full max-h-48 mt-1 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={date.photo} alt={date.title} className="w-full h-full object-cover max-h-48" />
                          </div>
                        )}

                        {/* Leave a review if not done yet */}
                        {((isCreatorMe && !date.creatorFeedback) || (!isCreatorMe && !date.partnerFeedback)) && (
                          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-rose-100/20 flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Поделитесь эмоциями от встречи:
                            </span>

                            <div className="flex gap-2.5">
                              {["❤️", "🥰", "🥳", "🍷", "🍿", "🌳", "😴"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setReviewEmoji(emoji)}
                                  className={`h-8 w-8 text-base rounded-lg flex items-center justify-center transition-all ${
                                    reviewEmoji === emoji ? "bg-rose-100 scale-110 shadow-sm" : "hover:bg-slate-100"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Было очень тепло и вкусно! Спасибо за этот вечер..."
                              rows={2}
                              className="p-3 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
                            />

                            {/* Photo upload input */}
                            {!date.photo && (
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef}
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                                {reviewPhoto ? (
                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-rose-200">
                                    <div className="flex items-center gap-2">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={reviewPhoto} alt="Review thumb" className="h-8 w-8 object-cover rounded" />
                                      <span className="text-[9px] font-bold text-slate-500">Фото готово!</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setReviewPhoto(null)}
                                      className="text-[9px] font-bold text-red-500 uppercase px-2 py-1"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-9 px-4 rounded-xl border border-dashed border-rose-300 text-rose-500 hover:bg-rose-50 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <ImageIcon className="h-4 w-4" /> Добавить фото встречи
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => handleSaveReview(date.id)}
                              disabled={savingReview || !reviewText.trim()}
                              className="h-10 rounded-xl bg-rose-gradient text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 mt-1"
                            >
                              {savingReview ? "Сохраняем..." : "Сохранить воспоминания"}
                            </button>
                          </div>
                        )}
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 overflow-y-auto max-h-[90vh] animate-float"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 flex items-center gap-1.5">
                Свидание мечты <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Заполните детали. Мы сразу уведомим вашего партнера через бота!
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Название свидания
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Романтический ужин, поход в кино..."
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Место встречи
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ресторан, парк, дома..."
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Дата
                </label>
                <input
                  type="date"
                  required
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Время
                </label>
                <input
                  type="time"
                  required
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Описание / Детали
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Секретный дресс-код, что взять с собой..."
                rows={3}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}
