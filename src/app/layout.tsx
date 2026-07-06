import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { TelegramProvider } from "@/components/TelegramProvider";
import Navigation from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IS TWO 💖",
  description: "Our little digital nest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Telegram WebApp script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-rose-50/50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 relative">
        {/* Background ambient glow bubbles */}
        <div className="ambient-glow-pink top-10 left-5"></div>
        <div className="ambient-glow-indigo bottom-20 right-5"></div>

        <TelegramProvider>
          <main className="mx-auto w-full max-w-md flex-1 pb-24 px-4 pt-4 relative z-10">
            {children}
          </main>
          <Navigation />
        </TelegramProvider>
      </body>
    </html>
  );
}
