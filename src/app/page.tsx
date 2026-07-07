"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState } from "react";
import { Heart, Calendar, Share2, Edit2, Check, Settings, HeartOff } from "lucide-react";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBreakingUp, setIsBreakingUp] = useState(false);

  const handleBreakup = async () => {
    const confirmed = window.confirm("Вы уверены, что хотите разорвать пару? Это сотрет общую историю и свидания!");
    if (!confirmed) return;

    setIsBreakingUp(true);
    try {
      const res = await fetch("/api/couple/breakup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${initData}`,
        },
      });

      if (res.ok) {
        setIsSettingsOpen(false);
        await refetch();
      } else {
        console.error("Failed to break up couple:", await res.text());
        alert("Не удалось разорвать пару. Попробуйте еще раз.");
      }
    } catch (e) {
      console.error(e);
      alert("Сетевая ошибка при разрыве пары.");
    } finally {
      setIsBreakingUp(false);
    }
  };

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
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
    
    // WebApp haptic feedback
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    // Natively share in Telegram if inside WebApp
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.openTelegramLink) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Присоединяйся к нашему гнездышку в IS TWO! 🌸")}`;
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6 animate-float-slow">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="w-9"></div> {/* Spacer to center the title */}
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          IS TWO <span className="animate-pulse-heart">🌸</span>
        </h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="h-9 w-9 rounded-2xl bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm border border-rose-100/30 dark:border-rose-950/20"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
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

          {/* Connected Icon (Heart Wave Flow) */}
          <div className="relative w-16 h-10 flex items-center justify-center overflow-visible select-none">
            <span className="absolute text-rose-500 animate-heart-flow-1 text-base">❤️</span>
            <span className="absolute text-pink-500 animate-heart-flow-2 text-xs">💖</span>
            <span className="absolute text-rose-400 animate-heart-flow-3 text-sm">❤️</span>
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
      <div className="glass-card rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-rose-400/10 to-transparent blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
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

        {couple?.id && (
          <div className="flex items-center gap-2 mt-1 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2 border border-rose-100/50 dark:border-rose-950/20">
            <input
              type="text"
              readOnly
              value={`https://t.me/${botUsername}?start=couple_${couple.id}`}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-transparent text-[10px] font-mono text-slate-600 dark:text-rose-200 outline-none select-all truncate"
            />
            <span className="text-[8px] font-extrabold uppercase text-rose-400 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
              Ссылка
            </span>
          </div>
        )}
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-float">
            <h3 className="text-lg font-bold text-slate-800 dark:text-rose-100 mb-2 flex items-center gap-1.5">
              Настройки отношений ⚙️
            </h3>
            
            <div className="my-6 flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-rose-100/30 dark:border-rose-950/10 text-center">
              {partner ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-3 animate-pulse-heart">
                    <Heart className="h-7 w-7 fill-rose-500 stroke-none" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Вы состоите в паре с <span className="text-rose-500">{partner.firstName}</span>.
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                    Разорвав пару, вы перестанете видеть общий календарь, свидания и списки желаний.
                  </p>
                  
                  <button
                    onClick={handleBreakup}
                    disabled={isBreakingUp}
                    className="mt-6 flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-200 dark:shadow-none transition-all"
                  >
                    <HeartOff className="h-4 w-4" />
                    {isBreakingUp ? "Разрываем связь..." : "Разорвать пару"}
                  </button>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-3">
                    🤍
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Вы пока не состоите в паре
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                    Отправьте пригласительную ссылку вашей второй половинке, чтобы соединить ваши сердца!
                  </p>
                </>
              )}
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
