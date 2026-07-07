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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe max-w-md mx-auto overflow-visible select-none h-16">
      {/* Sliding Fluid Background Scoop */}
      <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
        {/* Left solid block */}
        <div 
          className="absolute left-0 top-0 h-16 bg-slate-950 dark:bg-slate-900 transition-all duration-300 ease-in-out rounded-tl-3xl"
          style={{ width: `${index * 25}%` }}
        />
        
        {/* Scoop SVG Container (25% width of active column) */}
        <div 
          className="absolute top-0 h-16 w-[25%] transition-all duration-300 ease-in-out overflow-visible"
          style={{ left: `${index * 25}%` }}
        >
          {/* Left filler div inside column to avoid transparent gaps */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-slate-950 dark:bg-slate-900 transition-colors duration-300"
            style={{ right: 'calc(50% + 40px)' }}
          />
          
          {/* Centered Scoop SVG */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16">
            <svg viewBox="0 0 80 64" width="80" height="64" className="text-slate-950 dark:text-slate-900 fill-current">
              <path d="M 0 0 C 10 0, 18 36, 40 36 C 62 36, 70 0, 80 0 L 80 64 L 0 64 Z" />
            </svg>
          </div>

          {/* Right filler div inside column to avoid transparent gaps */}
          <div 
            className="absolute right-0 top-0 bottom-0 bg-slate-950 dark:bg-slate-900 transition-colors duration-300"
            style={{ left: 'calc(50% + 40px)' }}
          />
        </div>

        {/* Right solid block */}
        <div 
          className="absolute right-0 top-0 h-16 bg-slate-950 dark:bg-slate-900 transition-all duration-300 ease-in-out rounded-tr-3xl"
          style={{ left: `${(index + 1) * 25}%` }}
        />
      </div>

      {/* Navigation Items (4 equal columns) */}
      <div className="grid grid-cols-4 h-16 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center h-full w-full select-none"
            >
              {/* Elevated active icon container (no background circle) */}
              <div 
                className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
                  isActive 
                    ? "absolute -top-2.5 h-10 w-10 text-white scale-110 z-10" 
                    : "h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-5.5 w-5.5 transition-transform duration-300 ${
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

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute bottom-1 w-4 h-0.5 bg-rose-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
