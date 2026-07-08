"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Calendar, Gift } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/dates", label: "Свидания", icon: Heart },
    { href: "/calendar", label: "Календарь", icon: Calendar },
    { href: "/wishlist", label: "Вишлист", icon: Gift },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto select-none">
      <div className="glass-card rounded-full px-4 py-2.5 flex items-center justify-around shadow-lg border border-white/20 dark:border-rose-950/20 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 relative ${
                isActive 
                  ? "text-rose-500 scale-105" 
                  : "text-slate-400 dark:text-slate-500 hover:text-rose-400/80"
              }`}
            >
              {/* Active Background Glow Pill */}
              {isActive && (
                <span className="absolute inset-0 bg-rose-50 dark:bg-rose-950/25 rounded-2xl -z-10 animate-fade-in" />
              )}
              
              <Icon
                className={`h-5 w-5 transition-transform duration-300 ${
                  isActive ? "stroke-[2.5px] scale-110" : "stroke-[2px]"
                }`}
              />
              
              <span 
                className={`text-[9px] font-extrabold tracking-wide mt-1.5 transition-colors duration-300 ${
                  isActive ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
