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

  const activeIndex = navItems.findIndex((item) => pathname === item.href);
  const index = activeIndex === -1 ? 0 : activeIndex;
  const leftPercent = index * 25 + 12.5;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe max-w-md mx-auto overflow-visible select-none">
      {/* Sliding Fluid Background Scoop */}
      <div className="absolute top-0 left-0 w-full h-16 -z-10 overflow-visible pointer-events-none">
        {/* Left solid block */}
        <div 
          className="absolute left-0 top-0 h-16 bg-slate-950 dark:bg-slate-900 transition-all duration-300 ease-in-out rounded-tl-3xl"
          style={{ width: `calc(${leftPercent}% - 40px)` }}
        />
        {/* Scoop SVG */}
        <div 
          className="absolute top-0 h-16 w-20 transition-all duration-300 ease-in-out"
          style={{ left: `calc(${leftPercent}% - 40px)` }}
        >
          <svg viewBox="0 0 80 64" width="80" height="64" className="text-slate-950 dark:text-slate-900 fill-current">
            <path d="M 0 0 L 10 0 C 20 0, 24 24, 40 24 C 56 24, 60 0, 70 0 L 80 0 L 80 64 L 0 64 Z" />
          </svg>
        </div>
        {/* Right solid block */}
        <div 
          className="absolute right-0 top-0 h-16 bg-slate-950 dark:bg-slate-900 transition-all duration-300 ease-in-out rounded-tr-3xl"
          style={{ left: `calc(${leftPercent}% + 40px)` }}
        />
      </div>

      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full select-none"
            >
              {/* Elevated active icon container (no background circle) */}
              <div 
                className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
                  isActive 
                    ? "absolute -top-3 h-10 w-10 text-white scale-110 z-10" 
                    : "h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                  }`}
                />
              </div>
              
              {/* Text label that slides down and fades out when active */}
              <span 
                className={`text-[9px] font-bold tracking-wide mt-auto mb-1 transition-all duration-300 ${
                  isActive 
                    ? "opacity-0 translate-y-2 pointer-events-none" 
                    : "text-slate-400 dark:text-slate-500"
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
