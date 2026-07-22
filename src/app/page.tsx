"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Briefcase, Heart, Users, Dumbbell, BookOpen, Apple, Moon, Sunrise, Sparkles, X, Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskKanban } from "@/components/task-kanban";
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
  today: string; tasks: { todo: number; doing: number };
  habits: { done: number; total: number }; exercise: { done: number; target: number };
  monthlyExpense: number; monthlyBudget: number; spiritContacts: number;
  energy: { level: number; note: string } | null;
}
interface Habit { id: number; name: string; quadrant: string; today_value: number | null; }
interface StatsData {
  expensePie: { category: string; total: number }[];
  calendarMap: Record<string, { energy: number | null; habits: string[] }>;
  habitCompletion: { name: string; done: number; total: number; rate: number }[];
  overallRate: number;
  monthlyBar: { name: string; "完成": number; "未完成": number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [energy, setEnergy] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const [d, s, h] = await Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/habits").then(r => r.json()),
    ]);
    setData(d); setStats(s);
    setHabits(h.filter((x: Habit) => x.quadrant === "body" || x.quadrant === "mental"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveEnergy = async (level: number) => {
    setEnergy(level);
    await fetch("/api/energy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level }) });
    refresh();
  };

  const toggleHabit = async (id: number) => {
    await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habit_id: id }) });
    refresh();
  };

  if (!data) return <div className="flex items-center justify-center h-full text-muted-foreground">加载中...</div>;

  const habitRate = data.habits.total > 0 ? data.habits.done / data.habits.total : 0;
  const expenseRate = data.monthlyBudget > 0 ? data.monthlyExpense / data.monthlyBudget : 0;
  const energyLevel = energy ?? data.energy?.level ?? null;

  // Determine hero status (mirrors investment dashboard exit-banner states)
  let heroStatus: "good" | "warning" | "danger" | "unknown" = "unknown";
  let heroEmoji = "⏳";
  let heroAction = "记录今日状态";
  if (energyLevel === 3 && habitRate >= 0.7) { heroStatus = "good"; heroEmoji = "🟢"; heroAction = "状态良好，保持节奏"; }
  else if (energyLevel === 3) { heroStatus = "good"; heroEmoji = "🟢"; heroAction = "精力充沛，适合攻坚"; }
  else if (energyLevel === 2) { heroStatus = "warning"; heroEmoji = "🟡"; heroAction = "维持运转，别太勉强"; }
  else if (energyLevel === 1) { heroStatus = "danger"; heroEmoji = "🔴"; heroAction = "需要休息，优先恢复"; }
  else if (energyLevel === null && habitRate > 0) { heroStatus = "warning"; heroEmoji = "🟡"; heroAction = "还没记录心力状态"; }

  const quadrants = [
    { icon: Brain, label: "心智", href: "/mental", stat: "知识库 · 笔记", color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: Briefcase, label: "职业", href: "/career", stat: `${data.tasks.todo} 待办 · ${data.tasks.doing} 进行中`, color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Heart, label: "身体", href: "/body", stat: `习惯 ${data.habits.done}/${data.habits.total} · 运动 ${data.exercise.done}/${data.exercise.target}`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Users, label: "精神", href: "/spirit", stat: `${data.spiritContacts} 位联系人`, color: "text-rose-400", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ Hero Banner (mirrors investment dashboard .exit-banner) ═══ */}
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
        </div>
        {/* Score box (mirrors .exit-score-box) */}
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-background min-w-[60px]">
          <span className={cn("text-2xl font-bold font-mono tabular-nums",
            habitRate >= 0.7 ? "text-good" : habitRate >= 0.4 ? "text-warn" : "text-danger"
          )}>{data.habits.done}/{data.habits.total}</span>
          <span className="text-xs text-muted-foreground">习惯</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-background min-w-[60px]">
          <span className={cn("text-2xl font-bold font-mono tabular-nums",
            expenseRate < 0.8 ? "text-info" : expenseRate < 1.0 ? "text-warn" : "text-danger"
          )}>¥{Math.round(data.monthlyExpense / 1000)}k</span>
          <span className="text-xs text-muted-foreground">支出</span>
        </div>
      </div>

      {/* ═══ Energy quick-check ═══ */}
      <div className="flex gap-2">
        {[{ level: 1, e: "🔴", l: "枯竭" }, { level: 2, e: "🟡", l: "还行" }, { level: 3, e: "🟢", l: "活力无限" }].map(({ level, e, l }) => (
          <button key={level} onClick={() => saveEnergy(level)}
            className={cn("flex-1 py-2.5 rounded-xl border text-base font-medium transition-all duration-150",
              energy === level
                ? "border-white/30 bg-zinc-700 text-white"
                : "border-border bg-card text-foreground/70 hover:border-zinc-600/50 hover:text-foreground")}>
            {e} {l}
          </button>
        ))}
      </div>

      {/* ═══ Quadrant navigation (compact chips, like .idx-chip) ═══ */}
      <div className="grid grid-cols-4 gap-3">
        {quadrants.map(({ icon: Icon, label, href, stat, color, bg }) => (
          <a key={label} href={href}
            className={cn("flex items-center gap-3 p-3 rounded-xl border border-border bg-card transition-all duration-150",
              "hover:border-zinc-600/50 hover:bg-[#1c2129]")}>
            <div className={cn("p-2 rounded-lg shrink-0", bg)}><Icon size={20} className={color} /></div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <p className="text-xs text-muted-foreground truncate">{stat}</p>
            </div>
          </a>
        ))}
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

      {/* ═══ Section: Tasks ═══ */}
      <div className="section-label">TASKS</div>
      <TaskKanban />

      {/* ═══ Section: Tools ═══ */}
      <div className="section-label">TOOLS</div>
      <ToolsPanel />

      {/* ═══ Section: Analytics ═══ */}
      {stats && (
        <>
          <div className="section-label">ANALYTICS</div>
          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* Stat summaries */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "记录天数", value: Object.keys(stats.calendarMap ?? {}).length, unit: "天" },
                  { label: "今日完成", value: habits.filter(h => !!h.today_value).length, unit: `/${habits.length}` },
                  { label: "月均完成率", value: stats.overallRate, unit: "%" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="text-center p-4 rounded-xl bg-muted border-l-[3px] border-l-semantic-blue">
                    <p className="text-4xl font-semibold text-foreground font-mono tabular-nums">{value}<span className="text-lg text-muted-foreground ml-0.5">{unit}</span></p>
                    <p className="text-sm text-muted-foreground mt-1.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
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

              {/* Bar chart */}
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

          <MonthCalendar calendarMap={stats.calendarMap ?? {}} habits={habits} onRefresh={refresh} />
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
    setText(localStorage.getItem("scratchpad") || "");
    try {
      setItems(JSON.parse(localStorage.getItem("shopping-list") || "[]"));
    } catch { setItems([]); }
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

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 购物清单 — 1/3 */}
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
                    className="text-muted-foreground/30 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground/50">列表为空</p>
              )}
            </div>
            <div className="flex gap-1">
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
            </div>
          </div>

          {/* 备忘 — 2/3 */}
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

function ToolsPanel() {
  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5">
        <Tabs defaultValue="finance">
          <TabsList className="bg-muted border border-border rounded-xl p-1 mb-4">
            <TabsTrigger value="finance" className="text-base rounded-lg">记账</TabsTrigger>
            <TabsTrigger value="kpt" className="text-base rounded-lg">KPT 回顾</TabsTrigger>
            <TabsTrigger value="subs" className="text-base rounded-lg">订阅</TabsTrigger>
          </TabsList>
          <TabsContent value="finance"><FinanceWidget /></TabsContent>
          <TabsContent value="kpt"><KptWidget /></TabsContent>
          <TabsContent value="subs"><SubsWidget /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const CATEGORIES = ["餐饮","交通","购物","住房","娱乐","医疗","教育","订阅","其他"];

function FinanceWidget() {
  const [txns, setTxns] = useState<{ id: number; type: string; amount: number; category: string; note: string; date: string }[]>([]);
  const [type, setType] = useState<"expense"|"income">("expense");
  const [amount, setAmount] = useState(""); const [category, setCategory] = useState("餐饮"); const [note, setNote] = useState("");

  useEffect(() => { fetch("/api/transactions").then(r => r.json()).then(setTxns); }, []);

  const add = async () => {
    if (!amount) return;
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, amount: parseFloat(amount), category, note }) });
    setAmount(""); setNote(""); const r = await fetch("/api/transactions"); setTxns(await r.json());
  };

  const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[{ l: "收入", v: income, c: "text-good" }, { l: "支出", v: expense, c: "text-danger" }, { l: "结余", v: income - expense, c: "text-foreground" }].map(({ l, v, c }) => (
          <div key={l} className="text-center p-3 rounded-xl bg-muted border-l-[3px] border-l-semantic-blue">
            <p className="text-sm text-muted-foreground">{l}</p><p className={cn("text-lg font-medium mt-0.5 font-mono tabular-nums", c)}>¥{v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <Select value={type} onValueChange={(v) => v && setType(v as "expense"|"income")}>
          <SelectTrigger className="w-20 bg-card border-border rounded-xl text-base"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="expense">支出</SelectItem><SelectItem value="income">收入</SelectItem></SelectContent>
        </Select>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" className="w-28 bg-card border-border rounded-xl text-base" />
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-24 bg-card border-border rounded-xl text-base"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注" className="flex-1 bg-card border-border rounded-xl text-base" />
        <Button onClick={add} size="sm" className="shrink-0 rounded-xl text-base"><Plus size={18} className="mr-1" />记录</Button>
      </div>
      <div className="space-y-0.5 max-h-48 overflow-auto">
        {txns.slice(0, 20).map(t => (
          <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded text-base hover:bg-muted transition-colors duration-150">
            <div className="flex items-center gap-2"><span className="text-muted-foreground text-sm">{t.date.slice(5)}</span><Badge variant="outline" className="text-xs">{t.category}</Badge><span className="text-muted-foreground text-sm">{t.note}</span></div>
            <span className={cn("font-medium text-base font-mono tabular-nums", t.type === "expense" ? "text-danger" : "text-good")}>{t.type === "expense" ? "-" : "+"}¥{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KptWidget() {
  const [type, setType] = useState<"weekly"|"monthly">("weekly");
  const [periodStart, setPeriodStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; });
  const [keep, setKeep] = useState(""); const [problem, setProblem] = useState(""); const [tryText, setTryText] = useState("");
  const [reviews, setReviews] = useState<{ type: string; period_start: string; keep_text: string; problem_text: string; try_text: string }[]>([]);

  const fetchReviews = useCallback(async () => { const r = await fetch(`/api/reviews?type=${type}`); setReviews(await r.json()); }, [type]);
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const save = async () => {
    await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, period_start: periodStart, keep_text: keep, problem_text: problem, try_text: tryText }) });
    fetchReviews();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => v && setType(v as "weekly"|"monthly")}>
          <SelectTrigger className="w-24 bg-card border-border rounded-xl text-base"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="weekly">本周</SelectItem><SelectItem value="monthly">本月</SelectItem></SelectContent>
        </Select>
        <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-44 bg-card border-border rounded-xl text-base" />
        <Button onClick={save} size="sm" className="rounded-xl text-base"><Save size={18} className="mr-1" />保存</Button>
      </div>
      {[
        { k: "keep", l: "Keep 继续保持", v: keep, s: setKeep, p: "做对了什么？哪些要继续？", c: "border-l-semantic-green" },
        { k: "problem", l: "Problem 问题", v: problem, s: setProblem, p: "遇到了什么障碍？", c: "border-l-semantic-yellow" },
        { k: "try", l: "Try 尝试", v: tryText, s: setTryText, p: "想尝试什么新做法？", c: "border-l-semantic-blue" },
      ].map(({ k, l, v, s, p, c }) => (
        <div key={k} className="space-y-1">
          <h3 className="text-sm text-muted-foreground">{l}</h3>
          <textarea value={v} onChange={(e) => s(e.target.value)} placeholder={p} rows={2}
            className={`w-full bg-card border-l-[3px] ${c} border-y-0 border-r-0 rounded-r-xl p-2.5 text-base resize-none focus:outline-none focus:bg-muted text-foreground placeholder:text-muted-foreground`} />
        </div>
      ))}
      {reviews.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border">
          {reviews.slice(0, 5).map((r, i) => (
            <button key={i} onClick={() => { setPeriodStart(r.period_start); setKeep(r.keep_text); setProblem(r.problem_text); setTryText(r.try_text); }}
              className="w-full text-left p-2 rounded text-sm text-muted-foreground hover:bg-muted transition-colors duration-150 flex gap-3">
              <span>{r.period_start}</span><span className="text-muted-foreground/50 truncate">{(r.keep_text + r.problem_text).slice(0, 30)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubsWidget() {
  const [subs, setSubs] = useState<{ id: number; name: string; amount: number; cycle: string }[]>([]);
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [cycle, setCycle] = useState("monthly");

  const fetchSubs = useCallback(async () => { setSubs(await (await fetch("/api/subscriptions")).json()); }, []);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const add = async () => {
    if (!name || !amount) return;
    await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount: parseFloat(amount), cycle }) });
    setName(""); setAmount(""); fetchSubs();
  };
  const del = async (id: number) => { await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); fetchSubs(); };

  const total = subs.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="space-y-3">
      <div className="text-base"><span className="text-muted-foreground">月均 </span><span className="text-warn font-medium text-lg font-mono">¥{total}</span></div>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="服务名" className="w-32 bg-card border-border rounded-xl text-base" />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" className="w-24 bg-card border-border rounded-xl text-base" />
        <Select value={cycle} onValueChange={(v) => v && setCycle(v)}>
          <SelectTrigger className="w-20 bg-card border-border rounded-xl text-base"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="monthly">月付</SelectItem><SelectItem value="yearly">年付</SelectItem></SelectContent>
        </Select>
        <Button onClick={add} size="sm" className="shrink-0 rounded-xl text-base"><Plus size={18} className="mr-1" />添加</Button>
      </div>
      {subs.map(s => (
        <div key={s.id} className="flex items-center justify-between py-2 px-2 rounded text-base hover:bg-muted transition-colors duration-150">
          <span className="text-foreground">{s.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{s.cycle === "monthly" ? "月付" : "年付"}</span>
            <span className="text-warn font-mono">¥{s.amount}</span>
            <button onClick={() => del(s.id)} className="text-muted-foreground hover:text-danger transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthCalendar({ calendarMap, habits, onRefresh }: { calendarMap: StatsData["calendarMap"]; habits: Habit[]; onRefresh: () => void }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const todayStr = now.toISOString().split("T")[0];
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const [editDate, setEditDate] = useState<string | null>(null);
  const [editEnergy, setEditEnergy] = useState<number | null>(null);
  const [editHabits, setEditHabits] = useState<Habit[]>([]);

  const openEdit = async (date: string) => {
    setEditDate(date);
    const info = calendarMap[date];
    setEditEnergy(info?.energy ?? null);
    const r = await fetch(`/api/habits?date=${date}`);
    const h = await r.json();
    setEditHabits(h);
  };

  const toggleEditHabit = async (habitId: number) => {
    await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habit_id: habitId, date: editDate }) });
    const r = await fetch(`/api/habits?date=${editDate}`);
    setEditHabits(await r.json());
  };

  const saveEditEnergy = async (level: number) => {
    setEditEnergy(level);
    await fetch(`/api/energy?date=${editDate}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level }) });
  };

  const closeEdit = () => { setEditDate(null); onRefresh(); };

  const energyBg = (lvl: number | null) => {
    if (lvl === 1) return "rgba(248,113,73,0.25)"; if (lvl === 2) return "rgba(210,153,34,0.15)"; if (lvl === 3) return "rgba(63,185,80,0.15)"; return "transparent";
  };

  return (
    <>
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-6">
          <h3 className="text-sm text-muted-foreground mb-4">{year}年{month + 1}月</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {["一","二","三","四","五","六","日"].map(w => <div key={w} className="text-center text-sm text-muted-foreground py-1.5">{w}</div>)}
            {days.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const ds = dateStr(d);
              const info = calendarMap[ds];
              const isToday = ds === todayStr;
              return (
                <div key={ds}
                  onClick={() => openEdit(ds)}
                  className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer hover:ring-1 hover:ring-white/20 transition-all duration-150", isToday && "ring-2 ring-semantic-blue/50")}
                  style={{ background: energyBg(info?.energy ?? null) }}>
                  <span className={cn(isToday ? "text-foreground font-semibold" : "text-foreground/80")}>{d}</span>
                  {info && info.habits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">{info.habits.map(h => <span key={h} className="text-xs">{HABIT_ICONS[h] ?? "✓"}</span>)}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 mt-4 text-sm text-muted-foreground">
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

              {/* Energy selector */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">状态</p>
                <div className="flex gap-2">
                  {[{ level: 1, e: "🔴", l: "枯竭" }, { level: 2, e: "🟡", l: "还行" }, { level: 3, e: "🟢", l: "活力无限" }].map(({ level, e, l }) => (
                    <button key={level} onClick={() => saveEditEnergy(level)}
                      className={cn("flex-1 py-2 rounded-xl border text-sm transition-all duration-150",
                        editEnergy === level ? "border-white/30 bg-zinc-700 text-white" : "border-border bg-card text-foreground/70 hover:border-zinc-600/50")}>
                      {e} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habits */}
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
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
