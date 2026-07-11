"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

// Capture tgWebAppStartParam synchronously at module load time before Next.js Router strips it
let initialStartParam: string | null = null;
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  initialStartParam = urlParams.get("tgWebAppStartParam") || urlParams.get("startParam");
}

interface Couple {
  id: string;
  startDate: string | null;
  score: number;
}

interface User {
  telegramId: string;
  username: string | null;
  firstName: string;
  photoUrl: string | null;
}

interface TelegramContextType {
  user: User | null;
  partner: User | null;
  couple: Couple | null;
  loading: boolean;
  refetch: () => Promise<void>;
  initData: string;
  botUsername: string;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [botUsername, setBotUsername] = useState(process.env.NEXT_PUBLIC_BOT_USERNAME || "IStwo_bot");

  const router = useRouter();
  const pathname = usePathname();

  // 1. BackButton click handler registration & cleanup
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const handleBack = () => {
        router.back();
      };
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [router]);

  // 2. BackButton visibility toggle depending on route pathname
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (pathname === "/") {
        tg.BackButton.hide();
      } else {
        tg.BackButton.show();
      }
    }
  }, [pathname]);

  const fetchCoupleData = useCallback(async (dataStr: string) => {
    try {
      // Retrieve startParam from Telegram WebApp or URL search param
      let startParam = null;
      if (typeof window !== "undefined") {
        const tg = window.Telegram?.WebApp;
        startParam = tg?.initDataUnsafe?.start_param || initialStartParam;
      }

      const url = startParam
        ? `/api/couple?startParam=${encodeURIComponent(startParam)}`
        : "/api/couple";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${dataStr}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPartner(data.partner);
        setCouple(data.couple);
        if (data.botUsername) {
          setBotUsername(data.botUsername);
        }
        setError(null);
      } else {
        const data = await response.json().catch(() => ({}));
        const errMsg = data.error || response.statusText || "Unknown error";
        console.error("Failed to load couple data:", errMsg);
        setError(`Ошибка сервера: ${errMsg} (Status: ${response.status})`);
      }
    } catch (err: any) {
      console.error("Error loading couple data:", err);
      setError(`Сетевая ошибка: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (initData) {
      await fetchCoupleData(initData);
    }
  }, [initData, fetchCoupleData]);

  useEffect(() => {
    // Check if we are running in the browser
    if (typeof window !== "undefined") {
      const tg = window.Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();

        const rawData = tg.initData;

        if (rawData) {
          setInitData(rawData);
          fetchCoupleData(rawData);
        } else if (process.env.NODE_ENV === "development") {
          // Dev Mock: Alexey (mock_987654321) or Dasha (mock_123456789)
          const mockData = "mock_987654321"; // Toggle to simulate other user
          setInitData(mockData);
          fetchCoupleData(mockData);
        } else {
          setLoading(false);
        }
      } else if (process.env.NODE_ENV === "development") {
        // Fallback for standard browser in development
        const mockData = "mock_987654321";
        setInitData(mockData);
        fetchCoupleData(mockData);
      } else {
        setLoading(false);
      }
    }
  }, [fetchCoupleData]);

  return (
    <TelegramContext.Provider
      value={{
        user,
        partner,
        couple,
        loading,
        refetch,
        initData,
        botUsername,
      }}
    >
      {error ? (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-rose-50/30 dark:bg-slate-950 p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2">Ошибка подключения</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mb-6 font-mono break-words bg-rose-50 dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-950">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              refetch();
            }}
            className="px-6 py-2.5 rounded-full bg-rose-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
          >
            Попробовать снова
          </button>
        </div>
      ) : loading ? (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-rose-50/30 dark:bg-slate-950">
          <div className="animate-pulse-heart text-6xl text-rose-500">💖</div>
          <p className="mt-4 font-sans text-sm font-medium text-rose-400 dark:text-rose-300">
            Соединяем ваши сердца...
          </p>
        </div>
      ) : (
        children
      )}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}
