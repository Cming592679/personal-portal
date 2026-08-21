"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, BookOpen, Apple, Moon, Sunrise, Sparkles, Heart, X } from "lucide-react";
import { cn, localYMD } from "@/lib/utils";
import { ENERGY_LEVELS, energyEmoji, energyLabel } from "@/lib/energy";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

const HABIT_ICONS: Record<string, string> = {
  "运动": "🏋️", "阅读": "📖", "健康饮食": "🥗", "早睡": "🌙", "早起": "☀️", "冥想": "🧘",
};
const HABIT_META: Record<string, { icon: typeof Heart; desc: string; color: string }> = {
  "运动":   { icon: Dumbbell,  desc: "至少 20 分钟",       color: "text-good" },
  "阅读":   { icon: BookOpen,  desc: "读几页也好",          color: "text-violet-400" },
  "健康饮食": { icon: Apple,    desc: "控糖 · 少加工",       color: "text-good" },
  "早睡":   { icon: Moon,      desc: "23:00 前躺下",        color: "text-info" },
  "早起":   { icon: Sunrise,   desc: "7:00 前起床",         color: "text-warn" },
  "冥想":   { icon: Sparkles,  desc: "10 分钟静坐",         color: "text-violet-400" },
};

interface DashboardData {
  today: string;
  tasks: { todo: number; doing: number };
  habits: { done: number; total: number };
  energy: { level: number; note: string } | null;
}
interface Habit { id: number; name: string; quadrant: string; today_value: number | null; }
interface StatsData {
  calendarMap: Record<string, { energy: number | null; habits: string[]; doneCount?: number }>;
  habitCompletion: { name: string; done: number; total: number; rate: number }[];
  overallRate: number;
  monthlyBar: { name: string; "完成": number; "未完成": number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);

  const refresh = useCallback(async () => {
    const [d, s, h] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/habits").then((r) => r.json()),
    ]);
    setData(d as DashboardData);
    setStats(s as StatsData);
    setHabits((h as Habit[]).filter((x) => x.quadrant === "body" || x.quadrant === "mental"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/habits").then((r) => r.json()),
    ])
      .then(([d, s, h]) => {
        if (cancelled) return;
        setData(d as DashboardData);
        setStats(s as StatsData);
        setHabits((h as Habit[]).filter((x) => x.quadrant === "body" || x.quadrant === "mental"));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const toggleHabit = async (id: number) => {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: id }),
    });
    refresh();
  };

  if (!data) return <div className="flex items-center justify-center h-full text-muted-foreground">加载中...</div>;

  const habitRate = data.habits.total > 0 ? data.habits.done / data.habits.total : 0;
  const energyLevel = data.energy?.level ?? null;

  let heroStatus: "good" | "warning" | "danger" | "unknown" = "unknown";
  let heroEmoji = "⏳";
  let heroAction = "记录今日状态";
  if (energyLevel === 3 && habitRate >= 0.7) { heroStatus = "good"; heroEmoji = "🟢"; heroAction = "状态良好，保持节奏"; }
  else if (energyLevel === 3) { heroStatus = "good"; heroEmoji = "🟢"; heroAction = "精力充沛，适合攻坚"; }
  else if (energyLevel === 2) { heroStatus = "warning"; heroEmoji = "🟡"; heroAction = "维持运转，别太勉强"; }
  else if (energyLevel === 1) { heroStatus = "danger"; heroEmoji = "🔴"; heroAction = "需要休息，优先恢复"; }
  else if (energyLevel === null && habitRate > 0) { heroStatus = "warning"; heroEmoji = "🟡"; heroAction = "还没记录心力状态"; }

  return (
    <div className="space-y-6">
      {/* ═══ Hero Banner ═══ */}
      <div className={cn(
        "flex items-center gap-4 p-4 border rounded-xl transition-all",
        heroStatus === "good"    && "bg-[rgba(63,185,80,0.08)] border-[rgba(63,185,80,0.3)]",
        heroStatus === "warning" && "bg-[rgba(210,153,34,0.08)] border-[rgba(210,153,34,0.35)]",
        heroStatus === "danger"  && "bg-[rgba(248,81,73,0.1)] border-[rgba(248,81,73,0.4)]",
        heroStatus === "unknown" && "bg-card border-border",
      )}>
        <span className="text-3xl leading-none">{heroEmoji}</span>
        <div className="flex flex-col gap-0.5 flex-1">
          <span className={cn("text-base font-semibold",
            heroStatus === "good" && "text-good",
            heroStatus === "warning" && "text-warn",
            heroStatus === "danger" && "text-danger",
            heroStatus === "unknown" && "text-foreground",
          )}>{heroAction}</span>
          <span className="text-sm text-muted-foreground">{data.today}</span>
          {energyLevel === null ? (
            <Link href="/workbench" className="text-xs text-semantic-blue hover:text-semantic-green mt-0.5">
              去工作台记录今日心力状态 →
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground mt-0.5">
              今日心力：{energyEmoji(energyLevel)} {energyLabel(energyLevel)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-background min-w-[60px]">
          <span className={cn("text-2xl font-bold font-mono tabular-nums",
            habitRate >= 0.7 ? "text-good" : habitRate >= 0.4 ? "text-warn" : "text-danger"
          )}>{data.habits.done}/{data.habits.total}</span>
          <span className="text-xs text-muted-foreground">习惯</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-background min-w-[60px]">
          <span className="text-2xl font-bold font-mono tabular-nums text-info">{data.tasks.todo}</span>
          <span className="text-xs text-muted-foreground">待办</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-background min-w-[60px]">
          <span className="text-2xl font-bold font-mono tabular-nums text-warn">{data.tasks.doing}</span>
          <span className="text-xs text-muted-foreground">进行中</span>
        </div>
      </div>

      {/* ═══ Section: Daily Habits ═══ */}
      <div className="section-label">DAILY HABITS</div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {habits.map((h) => {
          const meta = HABIT_META[h.name] ?? { icon: Heart, desc: "", color: "text-muted-foreground" };
          const Icon = meta.icon;
          const done = !!h.today_value;
          return (
            <button
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              className={cn(
                "flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border transition-all duration-150",
                "border-l-[3px]",
                done
                  ? "border-l-semantic-green bg-[rgba(63,185,80,0.06)] border-[rgba(63,185,80,0.2)]"
                  : "border-l-transparent border-border bg-card hover:border-zinc-600/50 hover:bg-[#1c2129]"
              )}
            >
              <div className={cn("p-2 rounded-lg", done ? "bg-[rgba(63,185,80,0.15)]" : "bg-muted")}>
                <Icon size={20} className={done ? "text-good" : "text-muted-foreground"} />
              </div>
              <span className={cn("text-sm font-medium", done ? "text-good" : "text-foreground")}>{h.name}</span>
              <span className="text-xs text-muted-foreground">{meta.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Section: Scratchpad ═══ */}
      <div className="section-label">SCRATCHPAD</div>
      <ScratchPad />

      {/* ═══ Section: Analytics ═══ */}
      {stats && (
        <>
          <div className="section-label">ANALYTICS</div>
          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "记录天数", value: Object.keys(stats.calendarMap ?? {}).length, unit: "天" },
                  { label: "今日完成", value: habits.filter((h) => !!h.today_value).length, unit: `/${habits.length}` },
                  { label: "月均完成率", value: stats.overallRate, unit: "%" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="text-center p-4 rounded-xl bg-muted border-l-[3px] border-l-semantic-blue">
                    <p className="text-4xl font-semibold text-foreground font-mono tabular-nums">{value}<span className="text-lg text-muted-foreground ml-0.5">{unit}</span></p>
                    <p className="text-sm text-muted-foreground mt-1.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4">
                <Card className="col-span-2 border-0 bg-transparent shadow-none">
                  <CardContent className="p-2 text-center">
                    <h3 className="text-sm text-muted-foreground mb-2">完成率</h3>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={[{ v: stats.overallRate }, { v: 100 - stats.overallRate }]} dataKey="v"
                          cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                          startAngle={90} endAngle={-270}
                          cornerRadius={10} stroke="none">
                          <Cell fill="var(--semantic-green)" /><Cell fill="var(--border)" />
                        </Pie>
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize={28} fontWeight={600}>
                          {stats.overallRate}%
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-3 border-0 bg-transparent shadow-none">
                  <CardContent className="p-2">
                    <h3 className="text-sm text-muted-foreground mb-2">维度达标</h3>
                    <ResponsiveContainer width="100%" height={170}>
                      <RadarChart data={stats.habitCompletion}>
                        <PolarGrid stroke="#30363d" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 15, fill: "#c9d1d9" }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="rate" stroke="var(--semantic-blue)" fill="var(--semantic-blue)" fillOpacity={0.12} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm text-muted-foreground mb-3">习惯完成率</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.monthlyBar} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 15, fill: "#c9d1d9" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="完成" stackId="a" fill="var(--semantic-green)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="未完成" stackId="a" fill="var(--border)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <MonthCalendar calendarMap={stats.calendarMap ?? {}} onRefresh={refresh} />
        </>
      )}
    </div>
  );
}

interface ShopItem { text: string; done: boolean }

function ScratchPad() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<ShopItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    // 客户端一次性初始化 localStorage（SSR 阶段无法访问 localStorage，不能用 useState 惰性初始化）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(localStorage.getItem("scratchpad") || "");
    try {
      setItems(JSON.parse(localStorage.getItem("shopping-list") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  const saveText = (val: string) => {
    setText(val);
    localStorage.setItem("scratchpad", val);
  };

  const saveItems = (next: ShopItem[]) => {
    setItems(next);
    localStorage.setItem("shopping-list", JSON.stringify(next));
  };

  const toggleItem = (i: number) => {
    const next = [...items];
    next[i] = { ...next[i], done: !next[i].done };
    saveItems(next);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    saveItems([...items, { text: newItem.trim(), done: false }]);
    setNewItem("");
  };

  const delItem = (i: number) => {
    saveItems(items.filter((_, idx) => idx !== i));
  };

  const clearDone = () => {
    saveItems(items.filter((item) => !item.done));
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-1/3 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">🛒 购物清单</h3>
            <div className="space-y-1 max-h-[160px] overflow-auto">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(i)}
                    className="size-3.5 rounded accent-semantic-green cursor-pointer"
                  />
                  <span className={cn("text-sm flex-1", item.done && "line-through text-muted-foreground/50")}>
                    {item.text}
                  </span>
                  <button onClick={() => delItem(i)}
                    title="删除"
                    className="text-red-400/60 hover:text-red-300 hover:bg-red-400/10 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground/50">列表为空</p>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="添加…"
                className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-semantic-blue text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={addItem} disabled={!newItem.trim()}
                className="text-xs text-semantic-blue hover:text-semantic-green disabled:text-muted-foreground/30 transition-colors shrink-0">
                添加
              </button>
              {doneCount > 0 && (
                <button onClick={clearDone}
                  className="text-xs text-red-400/70 hover:text-red-300 transition-colors shrink-0 whitespace-nowrap">
                  🗑 清理({doneCount})
                </button>
              )}
            </div>
          </div>

          <div className="w-2/3 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">📝 备忘</h3>
            <textarea
              value={text}
              onChange={(e) => saveText(e.target.value)}
              placeholder="记录代码片段、命令、小技巧…"
              rows={5}
              className="w-full bg-muted border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-semantic-blue text-foreground placeholder:text-muted-foreground min-h-[130px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DoneTask { id: number; title: string; }

function MonthCalendar({ calendarMap, onRefresh }: {
  calendarMap: StatsData["calendarMap"];
  onRefresh: () => void;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const todayStr = localYMD(now);
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const [editDate, setEditDate] = useState<string | null>(null);
  const [editEnergy, setEditEnergy] = useState<number | null>(null);
  const [editHabits, setEditHabits] = useState<Habit[]>([]);
  const [editDoneTasks, setEditDoneTasks] = useState<DoneTask[]>([]);

  const openEdit = async (date: string) => {
    setEditDate(date);
    const info = calendarMap[date];
    setEditEnergy(info?.energy ?? null);
    const [hRes, tRes] = await Promise.all([
      fetch(`/api/habits?date=${date}`),
      fetch(`/api/tasks?completed_date=${date}`),
    ]);
    setEditHabits(await hRes.json());
    setEditDoneTasks(await tRes.json());
  };

  const toggleEditHabit = async (habitId: number) => {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habitId, date: editDate }),
    });
    const r = await fetch(`/api/habits?date=${editDate}`);
    setEditHabits(await r.json());
  };

  const saveEditEnergy = async (level: number) => {
    setEditEnergy(level);
    await fetch(`/api/energy?date=${editDate}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
  };

  const closeEdit = () => { setEditDate(null); onRefresh(); };

  const energyBg = (lvl: number | null) => {
    if (lvl === 1) return "rgba(248,113,73,0.25)";
    if (lvl === 2) return "rgba(210,153,34,0.15)";
    if (lvl === 3) return "rgba(63,185,80,0.15)";
    return "transparent";
  };

  return (
    <>
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-muted-foreground">{year}年{month + 1}月 · 点击日期回顾/修改</h3>
            <span className="text-xs text-muted-foreground">格子底色 = 心力 · 图标 = 习惯 · ✓n = 完成 n 个任务</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
              <div key={w} className="text-center text-sm text-muted-foreground py-1">{w}</div>
            ))}
            {days.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const ds = dateStr(d);
              const info = calendarMap[ds];
              const isToday = ds === todayStr;
              return (
                <div
                  key={ds}
                  onClick={() => openEdit(ds)}
                  className={cn(
                    "h-10 rounded-md flex flex-col items-center justify-center cursor-pointer hover:ring-1 hover:ring-white/20 transition-all duration-150 relative",
                    isToday && "ring-2 ring-semantic-blue/50",
                  )}
                  style={{ background: energyBg(info?.energy ?? null) }}
                  title={ds}
                >
                  <span className={cn("text-base leading-none", isToday ? "text-foreground font-semibold" : "text-foreground/85")}>
                    {d}
                  </span>
                  {info && (info.habits.length > 0 || info.doneCount) && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {info.habits.slice(0, 3).map((h) => (
                        <span key={h} className="text-[13px] leading-none">{HABIT_ICONS[h] ?? "✓"}</span>
                      ))}
                      {info.habits.length > 3 && (
                        <span className="text-[10px] text-muted-foreground leading-none">+{info.habits.length - 3}</span>
                      )}
                    </div>
                  )}
                  {info?.doneCount ? (
                    <span className="absolute bottom-0.5 right-1 text-[10px] text-good leading-none">✓{info.doneCount}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-[rgba(248,113,73,0.25)] inline-block" />枯竭</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-[rgba(210,153,34,0.15)] inline-block" />还行</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-[rgba(63,185,80,0.15)] inline-block" />活力无限</span>
          </div>
        </CardContent>
      </Card>

      {/* Day Edit Dialog */}
      {editDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeEdit} />
          <Card className="relative z-10 w-80 border-border bg-card rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">{editDate}</h3>
                <button onClick={closeEdit} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">状态</p>
                <div className="flex gap-2">
                  {ENERGY_LEVELS.map((e) => (
                    <button key={e.level} onClick={() => saveEditEnergy(e.level)}
                      className={cn("flex-1 py-2 rounded-xl border text-sm transition-all duration-150",
                        editEnergy === e.level ? "border-white/30 bg-zinc-700 text-white" : "border-border bg-card text-foreground/70 hover:border-zinc-600/50")}>
                      {e.emoji} {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">习惯打卡</p>
                <div className="space-y-1.5">
                  {editHabits.map((h) => {
                    const meta = HABIT_META[h.name] ?? { icon: Heart, desc: "", color: "text-muted-foreground" };
                    const Icon = meta.icon;
                    const done = !!h.today_value;
                    return (
                      <button key={h.id} onClick={() => toggleEditHabit(h.id)}
                        className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 text-left border-l-[3px]",
                          done ? "bg-[rgba(63,185,80,0.06)] border-l-semantic-green border-[rgba(63,185,80,0.2)]" : "bg-muted border-l-transparent border-border hover:border-zinc-600/50")}>
                        <Icon size={20} className={done ? "text-good" : "text-muted-foreground"} />
                        <span className={cn("text-sm flex-1", done ? "text-good" : "text-foreground")}>{h.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">当日完成任务</p>
                {editDoneTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60">无</p>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-auto">
                    {editDoneTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm text-foreground/90">
                        <span className="shrink-0">✅</span>
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
