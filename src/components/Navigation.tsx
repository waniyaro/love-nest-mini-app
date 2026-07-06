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
    <nav className="nav-blur fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${
                isActive
                  ? "text-rose-500 scale-105"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "fill-rose-500/10 stroke-[2.5px]" : "stroke-[2px]"
                }`}
              />
              <span className="mt-1 text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
