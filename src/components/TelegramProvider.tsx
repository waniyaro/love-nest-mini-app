"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface Couple {
  id: string;
  startDate: string | null;
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

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "love_nest_bot";

  const fetchCoupleData = useCallback(async (dataStr: string) => {
    try {
      const response = await fetch("/api/couple", {
        headers: {
          Authorization: `Bearer ${dataStr}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPartner(data.partner);
        setCouple(data.couple);
      } else {
        console.error("Failed to load couple data", await response.text());
      }
    } catch (error) {
      console.error("Error loading couple data:", error);
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
      {loading ? (
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
