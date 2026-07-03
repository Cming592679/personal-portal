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
  "运动":   { icon: Dumbbell,  desc: "至少 20 分钟",       color: "text-emerald-400" },
  "阅读":   { icon: BookOpen,  desc: "读几页也好",          color: "text-violet-400" },
  "健康饮食": { icon: Apple,    desc: "控糖 · 少加工",       color: "text-rose-400" },
  "早睡":   { icon: Moon,      desc: "23:00 前躺下",        color: "text-indigo-400" },
  "早起":   { icon: Sunrise,   desc: "7:00 前起床",         color: "text-amber-400" },
  "冥想":   { icon: Sparkles,  desc: "10 分钟静坐",         color: "text-cyan-400" },
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

  if (!data) return <div className="flex items-center justify-center h-full text-zinc-400">加载中...</div>;

  const quadrants = [
    { icon: Brain, label: "心智", href: "/mental", stats: ["知识库 · 笔记"], color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: Briefcase, label: "职业", href: "/career", stats: [`待办 ${data.tasks.todo}`, `进行中 ${data.tasks.doing}`, `本月 ¥${data.monthlyExpense}`], color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Heart, label: "身体", href: "/body", stats: [`习惯 ${data.habits.done}/${data.habits.total}`, `运动 ${data.exercise.done}/${data.exercise.target}`, data.energy ? `心力 ${["🔴","🟡","🟢"][data.energy.level-1]}` : "心力未记"], color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Users, label: "精神", href: "/spirit", stats: [`联系人 ${data.spiritContacts}`], color: "text-rose-400", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium text-zinc-200">{data.today}</h1>

      {/* Quadrant Cards */}
      <div className="grid grid-cols-4 gap-3">
        {quadrants.map(({ icon: Icon, label, href, stats, color, bg }) => (
          <a key={label} href={href}>
            <Card className="border-zinc-800/50 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-600/50 transition-all duration-200 cursor-pointer rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", bg)}><Icon size={20} className={color} /></div>
                  <span className="font-medium text-zinc-200">{label}</span>
                </div>
                <div className="space-y-1">
                  {stats.map((s, i) => <p key={i} className="text-sm text-zinc-400">{s}</p>)}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Status + Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-zinc-300">状态</h2>
            <div className="flex gap-2">
              {[{ level: 1, e: "🔴", l: "枯竭" }, { level: 2, e: "🟡", l: "还行" }, { level: 3, e: "🟢", l: "活力无限" }].map(({ level, e, l }) => (
                <button key={level} onClick={() => saveEnergy(level)}
                  className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    energy === level ? "border-white/30 bg-zinc-700 text-white" : "border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600/50")}>
                  {e} {l}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-medium text-zinc-300">本周</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-zinc-400"><span>习惯</span><span>{data.habits.done}/{data.habits.total}</span></div>
                <Progress value={(data.habits.done / Math.max(data.habits.total, 1)) * 100} className="h-2 [&>div]:bg-emerald-500 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-zinc-400"><span>支出</span><span>¥{data.monthlyExpense}/¥{data.monthlyBudget}</span></div>
                <Progress value={(data.monthlyExpense / Math.max(data.monthlyBudget, 1)) * 100} className="h-2 [&>div]:bg-amber-500 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {habits.map((h) => {
          const meta = HABIT_META[h.name] ?? { icon: Heart, desc: "", color: "text-zinc-400" };
          const Icon = meta.icon;
          const done = !!h.today_value;
          return (
            <Card
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              className={cn(
                "border transition-all duration-200 cursor-pointer select-none rounded-2xl",
                done
                  ? "border-emerald-500/40 bg-emerald-500/10 shadow-sm shadow-emerald-500/5"
                  : "border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600/50 hover:bg-zinc-800/60"
              )}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={cn("p-2.5 rounded-xl", done ? "bg-emerald-500/20" : "bg-zinc-700/50")}>
                  <Icon size={22} className={done ? "text-emerald-400" : "text-zinc-300"} />
                </div>
                <p className={cn("text-sm font-medium", done ? "text-emerald-300" : "text-zinc-200")}>{h.name}</p>
                <p className="text-xs text-zinc-400">{meta.desc}</p>
                <div className={cn("w-10 h-5 rounded-full transition-colors relative mt-0.5", done ? "bg-emerald-500/50" : "bg-zinc-600")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", done ? "translate-x-5" : "translate-x-0.5")} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Kanban */}
      <TaskKanban />

      {/* Tools: Finance + KPT + Subscriptions */}
      <ToolsPanel />

      {/* Monthly Stats */}
      {stats && (
        <>
          <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-base font-medium text-zinc-300">本月统计</h2>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "记录天数", value: Object.keys(stats.calendarMap ?? {}).length, unit: "天" },
                  { label: "今日完成", value: habits.filter(h => !!h.today_value).length, unit: `/${habits.length}` },
                  { label: "月均完成率", value: stats.overallRate, unit: "%" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="text-center p-4 rounded-xl bg-zinc-800/50">
                    <p className="text-3xl font-semibold text-zinc-100">{value}<span className="text-base text-zinc-400 ml-0.5">{unit}</span></p>
                    <p className="text-sm text-zinc-400 mt-1.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-4">
                <Card className="col-span-2 border-0 bg-transparent shadow-none">
                  <CardContent className="p-2 text-center">
                    <h3 className="text-sm text-zinc-400 mb-2">完成率</h3>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={[{ v: stats.overallRate }, { v: 100 - stats.overallRate }]} dataKey="v"
                          cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                          startAngle={90} endAngle={-270}
                          cornerRadius={10} stroke="none">
                          <Cell fill="#34d399" /><Cell fill="#3f3f46" />
                        </Pie>
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#e4e4e7" fontSize={24} fontWeight={600}>
                          {stats.overallRate}%
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-3 border-0 bg-transparent shadow-none">
                  <CardContent className="p-2">
                    <h3 className="text-sm text-zinc-400 mb-2">维度达标</h3>
                    <ResponsiveContainer width="100%" height={170}>
                      <RadarChart data={stats.habitCompletion}>
                        <PolarGrid stroke="#52525b" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fill: "#d4d4d8" }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="rate" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.12} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm text-zinc-400 mb-3">习惯完成率</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.monthlyBar} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#d4d4d8" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="完成" stackId="a" fill="#34d399" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="未完成" stackId="a" fill="#3f3f46" radius={[6, 6, 0, 0]} />
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

function ToolsPanel() {
  return (
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5">
        <Tabs defaultValue="finance">
          <TabsList className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-1 mb-4">
            <TabsTrigger value="finance" className="text-sm rounded-lg">记账</TabsTrigger>
            <TabsTrigger value="kpt" className="text-sm rounded-lg">KPT 回顾</TabsTrigger>
            <TabsTrigger value="subs" className="text-sm rounded-lg">订阅</TabsTrigger>
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
        {[{ l: "收入", v: income, c: "text-emerald-400" }, { l: "支出", v: expense, c: "text-red-400" }, { l: "结余", v: income - expense, c: "text-zinc-200" }].map(({ l, v, c }) => (
          <div key={l} className="text-center p-3 rounded-xl bg-zinc-800/40">
            <p className="text-xs text-zinc-400">{l}</p><p className={cn("text-lg font-medium mt-0.5", c)}>¥{v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <Select value={type} onValueChange={(v) => v && setType(v as "expense"|"income")}>
          <SelectTrigger className="w-20 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="expense">支出</SelectItem><SelectItem value="income">收入</SelectItem></SelectContent>
        </Select>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" className="w-28 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-24 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注" className="flex-1 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
        <Button onClick={add} size="sm" className="shrink-0 rounded-xl text-sm"><Plus size={16} className="mr-1" />记录</Button>
      </div>
      <div className="space-y-0.5 max-h-48 overflow-auto">
        {txns.slice(0, 20).map(t => (
          <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded text-sm hover:bg-zinc-800/20">
            <div className="flex items-center gap-2"><span className="text-zinc-400 text-xs">{t.date.slice(5)}</span><Badge variant="outline" className="text-[10px]">{t.category}</Badge><span className="text-zinc-500 text-xs">{t.note}</span></div>
            <span className={cn("font-medium text-sm", t.type === "expense" ? "text-red-400" : "text-emerald-400")}>{t.type === "expense" ? "-" : "+"}¥{t.amount}</span>
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
          <SelectTrigger className="w-24 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="weekly">本周</SelectItem><SelectItem value="monthly">本月</SelectItem></SelectContent>
        </Select>
        <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-44 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
        <Button onClick={save} size="sm" className="rounded-xl text-sm"><Save size={16} className="mr-1" />保存</Button>
      </div>
      {[
        { k: "keep", l: "Keep 继续保持", v: keep, s: setKeep, p: "做对了什么？哪些要继续？", c: "border-emerald-500/50" },
        { k: "problem", l: "Problem 问题", v: problem, s: setProblem, p: "遇到了什么障碍？", c: "border-amber-500/50" },
        { k: "try", l: "Try 尝试", v: tryText, s: setTryText, p: "想尝试什么新做法？", c: "border-violet-500/50" },
      ].map(({ k, l, v, s, p, c }) => (
        <div key={k} className="space-y-1">
          <h3 className="text-xs text-zinc-400">{l}</h3>
          <textarea value={v} onChange={(e) => s(e.target.value)} placeholder={p} rows={2}
            className={`w-full bg-zinc-800/50 border-l-2 ${c} border-y-0 border-r-0 rounded-r-xl p-2.5 text-sm resize-none focus:outline-none focus:bg-zinc-800/80 text-zinc-200 placeholder:text-zinc-500`} />
        </div>
      ))}
      {reviews.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-zinc-800">
          {reviews.slice(0, 5).map((r, i) => (
            <button key={i} onClick={() => { setPeriodStart(r.period_start); setKeep(r.keep_text); setProblem(r.problem_text); setTryText(r.try_text); }}
              className="w-full text-left p-2 rounded text-xs text-zinc-500 hover:bg-zinc-800/30 flex gap-3">
              <span>{r.period_start}</span><span className="text-zinc-600 truncate">{(r.keep_text + r.problem_text).slice(0, 30)}</span>
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

  const fetch = useCallback(async () => { setSubs(await (await fetch("/api/subscriptions")).json()); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const add = async () => {
    if (!name || !amount) return;
    await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount: parseFloat(amount), cycle }) });
    setName(""); setAmount(""); fetch();
  };
  const del = async (id: number) => { await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); fetch(); };

  const total = subs.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="space-y-3">
      <div className="text-sm"><span className="text-zinc-400">月均 </span><span className="text-amber-400 font-medium text-lg">¥{total}</span></div>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="服务名" className="w-32 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" className="w-24 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
        <Select value={cycle} onValueChange={(v) => v && setCycle(v)}>
          <SelectTrigger className="w-20 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="monthly">月付</SelectItem><SelectItem value="yearly">年付</SelectItem></SelectContent>
        </Select>
        <Button onClick={add} size="sm" className="shrink-0 rounded-xl text-sm"><Plus size={16} className="mr-1" />添加</Button>
      </div>
      {subs.map(s => (
        <div key={s.id} className="flex items-center justify-between py-2 px-2 rounded text-sm hover:bg-zinc-800/20">
          <span className="text-zinc-300">{s.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{s.cycle === "monthly" ? "月付" : "年付"}</span>
            <span className="text-amber-400">¥{s.amount}</span>
            <button onClick={() => del(s.id)} className="text-zinc-500 hover:text-red-400"><Trash2 size={12} /></button>
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
    if (lvl === 1) return "rgba(248,113,113,0.3)"; if (lvl === 2) return "rgba(251,191,36,0.2)"; if (lvl === 3) return "rgba(52,211,153,0.2)"; return "transparent";
  };

  return (
    <>
      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-6">
          <h3 className="text-sm text-zinc-400 mb-4">{year}年{month + 1}月</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {["一","二","三","四","五","六","日"].map(w => <div key={w} className="text-center text-xs text-zinc-500 py-1.5">{w}</div>)}
            {days.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const ds = dateStr(d);
              const info = calendarMap[ds];
              const isToday = ds === todayStr;
              return (
                <div key={ds}
                  onClick={() => openEdit(ds)}
                  className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer hover:ring-1 hover:ring-white/20 transition-all", isToday && "ring-2 ring-white/30")}
                  style={{ background: energyBg(info?.energy ?? null) }}>
                  <span className={cn(isToday ? "text-white font-semibold" : "text-zinc-300")}>{d}</span>
                  {info && info.habits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">{info.habits.map(h => <span key={h} className="text-[10px]">{HABIT_ICONS[h] ?? "✓"}</span>)}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 mt-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-red-400/30 inline-block" />枯竭</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-amber-400/20 inline-block" />还行</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm bg-emerald-400/20 inline-block" />活力无限</span>
          </div>
        </CardContent>
      </Card>

      {/* Day Edit Dialog */}
      {editDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeEdit} />
          <Card className="relative z-10 w-80 border-zinc-700/50 bg-zinc-900 rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-zinc-200">{editDate}</h3>
                <button onClick={closeEdit} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
              </div>

              {/* Energy selector */}
              <div>
                <p className="text-sm text-zinc-400 mb-2">状态</p>
                <div className="flex gap-2">
                  {[{ level: 1, e: "🔴", l: "枯竭" }, { level: 2, e: "🟡", l: "还行" }, { level: 3, e: "🟢", l: "活力无限" }].map(({ level, e, l }) => (
                    <button key={level} onClick={() => saveEditEnergy(level)}
                      className={cn("flex-1 py-2 rounded-xl border text-sm transition-all",
                        editEnergy === level ? "border-white/30 bg-zinc-700 text-white" : "border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600/50")}>
                      {e} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habits */}
              <div>
                <p className="text-sm text-zinc-400 mb-2">习惯打卡</p>
                <div className="space-y-1.5">
                  {editHabits.map((h) => {
                    const meta = HABIT_META[h.name] ?? { icon: Heart, desc: "", color: "text-zinc-400" };
                    const Icon = meta.icon;
                    const done = !!h.today_value;
                    return (
                      <button key={h.id} onClick={() => toggleEditHabit(h.id)}
                        className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                          done ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50")}>
                        <Icon size={18} className={done ? "text-emerald-400" : "text-zinc-400"} />
                        <span className={cn("text-sm flex-1", done ? "text-emerald-300" : "text-zinc-300")}>{h.name}</span>
                        <div className={cn("w-8 h-4 rounded-full transition-colors", done ? "bg-emerald-500/40" : "bg-zinc-600")}>
                          <div className={cn("w-3 h-3 rounded-full bg-white shadow transition-transform mt-0.5", done ? "translate-x-4 ml-0.5" : "translate-x-0.5")} />
                        </div>
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
