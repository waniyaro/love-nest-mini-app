"use client";

import { useTelegram } from "@/components/TelegramProvider";
import { useState } from "react";
import { Heart, Calendar, Share2, Edit2, Check } from "lucide-react";

export default function Dashboard() {
  const { user, partner, couple, refetch, initData, botUsername } = useTelegram();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    couple?.startDate ? new Date(couple.startDate).toISOString().split("T")[0] : ""
  );
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculate days together
  const getDaysTogether = () => {
    if (!couple?.startDate) return null;
    const start = new Date(couple.startDate);
    const today = new Date();
    // Zero out time
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysCount = getDaysTogether();

  const handleSaveDate = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/couple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({ startDate: selectedDate }),
      });

      if (res.ok) {
        await refetch();
        setIsEditingDate(false);
      } else {
        console.error("Failed to update date");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const inviteLink = `https://t.me/${botUsername}?start=love`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    
    // WebApp haptic feedback
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header Profile Section */}
      <div className="flex items-center justify-center mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          Love Nest <span className="animate-pulse-heart">🌸</span>
        </h1>
      </div>

      {/* Avatars / Couple Matching */}
      <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
          {/* User Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full border-4 border-rose-400 bg-rose-200 overflow-hidden shadow-lg flex items-center justify-center text-rose-500 font-bold text-2xl">
              {user?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoUrl} alt={user.firstName} className="h-full w-full object-cover" />
              ) : (
                user?.firstName.charAt(0)
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {user?.firstName}
            </span>
          </div>

          {/* Connected Icon */}
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center animate-pulse-heart text-white shadow-md shadow-rose-300">
              <Heart className="h-5 w-5 fill-white stroke-none" />
            </div>
          </div>

          {/* Partner Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full border-4 border-rose-300 bg-slate-200 overflow-hidden shadow-lg flex items-center justify-center text-slate-400 font-bold text-2xl">
              {partner ? (
                partner.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partner.photoUrl} alt={partner.firstName} className="h-full w-full object-cover" />
                ) : (
                  partner.firstName.charAt(0)
                )
              ) : (
                "🤍"
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {partner ? partner.firstName : "Ожидаем..."}
            </span>
          </div>
        </div>

        {/* Status Text */}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {partner 
            ? `Соединено с @${partner.username || partner.firstName}`
            : "Поделитесь пригласительной ссылкой с партнером!"
          }
        </p>
      </div>

      {/* Days Together Counter Card */}
      <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <Heart className="absolute -right-6 -bottom-6 h-28 w-28 text-rose-500/5 stroke-[0.5px]" />
        
        <span className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          Мы вместе
        </span>
        
        {daysCount !== null ? (
          <div className="flex items-baseline mt-2">
            <span className="text-5xl font-black text-rose-500 tracking-tight">
              {daysCount}
            </span>
            <span className="text-lg font-bold text-rose-400 ml-2">
              {daysCount === 1 ? "день" : [2, 3, 4].includes(daysCount % 10) && ![12, 13, 14].includes(daysCount % 100) ? "дня" : "дней"}
            </span>
          </div>
        ) : (
          <span className="text-base font-bold text-slate-400 dark:text-slate-500 mt-2 text-center">
            Дата начала отношений не задана
          </span>
        )}

        <button
          onClick={() => {
            setSelectedDate(
              couple?.startDate ? new Date(couple.startDate).toISOString().split("T")[0] : ""
            );
            setIsEditingDate(true);
          }}
          className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold transition-all"
        >
          <Edit2 className="h-3 w-3" />
          {couple?.startDate ? "Изменить дату" : "Задать дату начала"}
        </button>
      </div>

      {/* Share / Invite Partner */}
      <div className="glass-card rounded-3xl p-5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 dark:text-rose-100">
            Ссылка для партнера
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Отправьте вашему партнеру в Telegram
          </span>
        </div>
        
        <button
          onClick={handleShare}
          className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
            copied
              ? "bg-emerald-500 text-white shadow-emerald-200 shadow-md"
              : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 shadow-md"
          }`}
        >
          {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Quick stats / Features info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-28">
          <Calendar className="h-6 w-6 text-rose-500" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Предстоящих</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block">Даты в календаре</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-28">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500/10" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Подарки и желания</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block">Наш вишлист</span>
          </div>
        </div>
      </div>

      {/* Edit Date Modal */}
      {isEditingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-xl animate-float">
            <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 mb-2">
              Когда всё началось? 💖
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Выберите дату, когда вы официально стали парой. Счётчик обновится у обоих.
            </p>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm font-semibold outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditingDate(false)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveDate}
                disabled={saving || !selectedDate}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all"
              >
                {saving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
