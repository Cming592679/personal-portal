"use client";

import Link from "next/link"; import { usePathname } from "next/navigation"; import { cn } from "@/lib/utils";
import { Brain, Briefcase, Heart, Users, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/mental", label: "心智", icon: Brain },
  { href: "/career", label: "职业", icon: Briefcase },
  { href: "/body", label: "身体", icon: Heart },
  { href: "/spirit", label: "精神", icon: Users },
];
const bottomItem = { href: "/settings", label: "设置", icon: Settings };

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-16 border-r border-zinc-800/50 flex flex-col items-center py-5 gap-1.5 shrink-0">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn(
            "flex flex-col items-center gap-0.5 p-2.5 rounded-2xl w-13 text-[10px] transition-all duration-200",
            active ? "bg-zinc-800/80 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50")} title={label}>
            <Icon size={19} /><span>{label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link href={bottomItem.href} className={cn(
        "flex flex-col items-center gap-0.5 p-2.5 rounded-2xl w-13 text-[10px] transition-all duration-200",
        pathname.startsWith(bottomItem.href) ? "bg-zinc-800/80 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50")} title={bottomItem.label}>
        <Settings size={19} /><span>{bottomItem.label}</span>
      </Link>
    </aside>
  );
}
