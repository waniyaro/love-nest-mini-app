"use client";

export const dynamic = "force-dynamic";

import { useTelegram } from "@/components/TelegramProvider";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gift, MapPin, DollarSign, Link as LinkIcon, AlignLeft, ImageIcon, Heart } from "lucide-react";

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

function NewWishlistForm() {
  const { initData, refetch } = useTelegram();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get("type") === "place" ? "places" : "items";
  const [mainTab, setMainTab] = useState<"items" | "places">(initialType);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        await refetch();
        router.refresh();
        router.push("/wishlist");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не удалось добавить элемент.");
      }
    } catch (error) {
      console.error(error);
      alert("Сетевая ошибка при создании элемента.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col mt-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-rose-100 flex items-center gap-2">
          {mainTab === "items" ? "Новое желание" : "Новое место"}{" "}
          {mainTab === "items" ? (
            <Gift className="h-6 w-6 text-rose-500 fill-rose-500/20" />
          ) : (
            <MapPin className="h-6 w-6 text-rose-500 fill-rose-500/20" />
          )}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {mainTab === "items"
            ? "Добавьте товар в вишлист, и мы сразу сообщим вашему партнеру!"
            : "Добавьте место для свиданий, куда бы вы хотели сходить вместе!"}
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl relative">
        <button
          type="button"
          onClick={() => setMainTab("items")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            mainTab === "items" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Вещь
        </button>
        <button
          type="button"
          onClick={() => setMainTab("places")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
            mainTab === "places" ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Место
        </button>
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 ease-out ${
            mainTab === "items" ? "left-1.5" : "left-[calc(50%)]"
          }`}
        ></div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            {mainTab === "items" ? "Название желания" : "Название места"}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mainTab === "items" ? "Парные кулоны, плед..." : "Ресторан с панорамным видом, каток..."}
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Budget/Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-rose-400" />
            {mainTab === "items" ? "Примерная цена (необязательно)" : "Примерный бюджет (необязательно)"}
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={mainTab === "items" ? "1500 ₽, $20..." : "3000 ₽, бесплатно..."}
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* URL Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <LinkIcon className="h-3 w-3 text-rose-400" />
            {mainTab === "items" ? "Ссылка на товар (необязательно)" : "Ссылка на карту / информацию (необязательно)"}
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={mainTab === "items" ? "https://wildberries.ru/..." : "https://yandex.ru/maps/..."}
            className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlignLeft className="h-3 w-3 text-rose-400" /> Описание / Детали (необязательно)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Размер, цвет или примечания..."
            rows={3}
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-rose-100 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none transition-all"
          />
        </div>

        {/* Image Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-rose-400" /> Изображение (необязательно)
          </label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {photo ? (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Upload thumb" className="h-9 w-9 object-cover rounded" />
                <span className="text-[10px] font-bold text-slate-500">Фото загружено!</span>
              </div>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-[10px] font-bold text-red-500 uppercase px-2 py-1"
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

        {/* Rating for Places */}
        {mainTab === "places" && (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              Ваша оценка желания сходить сюда:
            </label>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={`new-rating-${val}`}
                  type="button"
                  onClick={() => setRating(val)}
                  className={`h-10 w-10 text-xs rounded-xl flex items-center justify-center transition-all ${
                    rating === val 
                      ? "bg-rose-100 text-rose-500 font-extrabold scale-110 shadow-sm border border-rose-200" 
                      : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {val} <Heart className="h-3 w-3 fill-current ml-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push("/wishlist")}
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

export default function NewWishlistPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    }>
      <NewWishlistForm />
    </Suspense>
  );
}
