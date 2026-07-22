"use client";

import Link from "next/link"; import { usePathname } from "next/navigation"; import { cn } from "@/lib/utils";
import { Brain, Briefcase, Heart, Users, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard, color: "text-semantic-blue", bg: "bg-semantic-blue/10", border: "border-semantic-blue" },
  { href: "/mental", label: "心智", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400" },
  { href: "/career", label: "职业", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400" },
  { href: "/body", label: "身体", icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400" },
  { href: "/spirit", label: "精神", icon: Users, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-400" },
];
const bottomItem = { href: "/settings", label: "设置", icon: Settings, color: "text-semantic-muted", bg: "bg-zinc-500/10", border: "border-zinc-500" };

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 border-r border-border flex flex-col items-center py-5 gap-1.5 shrink-0">
      {navItems.map(({ href, label, icon: Icon, color, bg, border }) => {
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
