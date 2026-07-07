"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState } from "react";
import { Heart, Calendar, Share2, Edit2, Check } from "lucide-react";

const quotes = [
  "С тобой каждый день — праздник 🌸",
  "Ты — моя лучшая глава в книге жизни 💕",
  "Счастливы вместе каждый миг ✨",
  "Моё любимое место — рядом с тобой 💖",
  "Вместе теплее и уютнее 🧸",
  "Любовь — это наше маленькое приключение 🗺️",
  "С каждым днём люблю тебя всё сильнее 🥰"
];

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
  const currentQuote = daysCount !== null ? quotes[daysCount % quotes.length] : "Вместе создаем уют и счастье ✨";

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
    const inviteLink = couple?.id
      ? `https://t.me/${botUsername}?start=couple_${couple.id}`
      : `https://t.me/${botUsername}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    
    // WebApp haptic feedback
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-6 animate-float-slow">
      {/* Header Profile Section */}
      <div className="flex items-center justify-center mt-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          IS TWO <span className="animate-pulse-heart">🌸</span>
        </h1>
      </div>

      {/* Avatars / Couple Matching */}
      <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Soft pink highlight glow behind avatars */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-rose-300/20 dark:bg-rose-900/10 blur-2xl rounded-full"></div>
        
        <div className="flex items-center gap-6 z-10">
          {/* User Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full ring-4 ring-rose-400 ring-offset-2 dark:ring-offset-slate-950 bg-rose-200 overflow-hidden shadow-lg flex items-center justify-center text-rose-500 font-bold text-2xl transition-all duration-300">
              {user?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoUrl} alt={user.firstName} className="h-full w-full object-cover" />
              ) : (
                user?.firstName.charAt(0)
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              {user?.firstName}
            </span>
          </div>

          {/* Connected Icon */}
          <div className="relative">
            <div className="h-11 w-11 rounded-full bg-rose-gradient flex items-center justify-center animate-pulse-heart text-white shadow-lg">
              <Heart className="h-5 w-5 fill-white stroke-none" />
            </div>
          </div>

          {/* Partner Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className={`h-20 w-20 rounded-full ring-4 ring-offset-2 dark:ring-offset-slate-950 overflow-hidden shadow-lg flex items-center justify-center font-bold text-2xl transition-all duration-300 ${
              partner 
                ? "ring-rose-300 bg-rose-100 text-rose-500" 
                : "ring-slate-300 bg-slate-100 text-slate-400 border border-dashed border-slate-300"
            }`}>
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
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              {partner ? partner.firstName : "Ожидаем..."}
            </span>
          </div>
        </div>

        {/* Status Text */}
        <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-100/50 dark:bg-slate-900/50 px-3 py-1 rounded-full">
          {partner 
            ? `Связано с @${partner.username || partner.firstName}`
            : "В ожидании второй половинки..."
          }
        </p>
      </div>

      {/* Days Together Counter Card */}
      <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-48">
        {/* Floating wave liquid effect */}
        {daysCount !== null && (
          <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none overflow-hidden rounded-3xl">
            <svg className="absolute left-0 bottom-0 w-[200%] h-[40%] fill-rose-500 wave-shape" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z"></path>
            </svg>
          </div>
        )}
        
        <span className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Мы вместе уже
        </span>
        
        {daysCount !== null ? (
          <div className="flex flex-col items-center mt-3">
            <div className="flex items-baseline">
              <span className="text-6xl font-black text-rose-500 tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                {daysCount}
              </span>
              <span className="text-xl font-extrabold text-rose-400 ml-2">
                {daysCount === 1 ? "день" : [2, 3, 4].includes(daysCount % 10) && ![12, 13, 14].includes(daysCount % 100) ? "дня" : "дней"}
              </span>
            </div>
            {/* Love Quote */}
            <p className="mt-3 text-xs italic font-semibold text-rose-400/80 dark:text-rose-300/80 text-center max-w-[240px]">
              {currentQuote}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center max-w-[200px]">
              Дата начала отношений еще не задана
            </span>
          </div>
        )}

        <button
          onClick={() => {
            setSelectedDate(
              couple?.startDate ? new Date(couple.startDate).toISOString().split("T")[0] : ""
            );
            setIsEditingDate(true);
          }}
          className="mt-6 flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-rose-100/80 hover:bg-rose-200/80 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 text-xs font-extrabold shadow-sm transition-all"
        >
          <Edit2 className="h-3 w-3" />
          {couple?.startDate ? "Изменить дату" : "Задать дату начала"}
        </button>
      </div>

      {/* Share / Invite Partner */}
      <div className="glass-card rounded-3xl p-5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-rose-400/10 to-transparent blur-xl pointer-events-none"></div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 dark:text-rose-100">
            Связь сердец 🔗
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-[220px]">
            Отправьте пригласительную ссылку вашей второй половинке
          </span>
        </div>
        
        <button
          onClick={handleShare}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
            copied
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-300/40 scale-95"
              : "bg-rose-gradient text-white hover:opacity-95 shadow-md scale-100"
          }`}
        >
          {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Quick stats / Features info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4.5 flex flex-col justify-between h-28 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">Предстоящие</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">Знаменательные даты</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4.5 flex flex-col justify-between h-28 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <Heart className="h-4.5 w-4.5 fill-rose-500/10" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">Наши мечты</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">Общий вишлист</span>
          </div>
        </div>
      </div>

      {/* Edit Date Modal */}
      {isEditingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-float">
            <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 mb-2 flex items-center gap-1.5">
              Когда всё началось? 💖
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Выберите день, когда вы официально стали парой. Счётчик обновится у обоих партнёров.
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
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveDate}
                disabled={saving || !selectedDate}
                className="flex-1 h-11 rounded-xl bg-rose-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all"
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
