"use client";

import Link from "next/link"; import { usePathname } from "next/navigation"; import { cn } from "@/lib/utils";
import { CalendarDays, Zap, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "回顾", icon: CalendarDays, color: "text-semantic-blue", border: "border-semantic-blue" },
  { href: "/workbench", label: "工作台", icon: Zap, color: "text-sky-400", border: "border-sky-400" },
];
const bottomItem = { href: "/settings", label: "设置", icon: Settings, color: "text-semantic-muted", border: "border-zinc-500" };

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 border-r border-border flex flex-col items-center py-5 gap-1.5 shrink-0">
      {navItems.map(({ href, label, icon: Icon, color, border }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2 rounded-xl w-16 text-xs transition-all duration-200",
              active
                ? `border-l-2 ${border} text-white`
                : "text-muted-foreground hover:text-foreground hover:bg-[#1c2129] border-l-2 border-transparent"
            )} title={label}>
            <Icon size={22} className={cn("transition-colors", active ? color : "")} />
            <span>{label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link href={bottomItem.href}
        className={cn(
          "flex flex-col items-center gap-0.5 p-2 rounded-xl w-16 text-xs transition-all duration-200",
          pathname.startsWith(bottomItem.href)
            ? `border-l-2 ${bottomItem.border} text-white`
            : "text-muted-foreground hover:text-foreground hover:bg-[#1c2129] border-l-2 border-transparent"
        )} title={bottomItem.label}>
        <Settings size={22} className={cn("transition-colors", pathname.startsWith(bottomItem.href) ? bottomItem.color : "")} />
        <span>{bottomItem.label}</span>
      </Link>
    </aside>
  );
}
