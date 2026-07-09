"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, CalendarHeart, Gift } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/dates", label: "Свидания", icon: Heart },
    { href: "/calendar", label: "Календарь", icon: CalendarHeart },
    { href: "/wishlist", label: "Вишлист", icon: Gift },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-rose-100/30 dark:border-rose-950/20 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl select-none">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 px-2 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all duration-300 relative ${
                isActive 
                  ? "text-rose-500 scale-105" 
                  : "text-slate-400 dark:text-slate-500 hover:text-rose-400/80"
              }`}
            >
              {/* Active Background Glow Pill */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-0.5 bg-rose-50 dark:bg-rose-950/25 rounded-2xl -z-10 animate-fade-in" />
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
