"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, Briefcase, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#a78bfa", "#f472b6", "#60a5fa", "#fbbf24", "#34d399", "#fb923c", "#94a3b8", "#cbd5e1"];

interface StatsData {
  habitHeatmap: { date: string; done: number }[];
  expensePie: { category: string; total: number }[];
  energyTrend: { date: string; level: number }[];
}

interface DashboardData {
  today: string;
  tasks: { todo: number; doing: number };
  habits: { done: number; total: number };
  exercise: { done: number; target: number };
  monthlyExpense: number;
  monthlyBudget: number;
  spiritContacts: number;
  energy: { level: number; note: string } | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const saveEnergy = async (level: number) => {
    setEnergy(level);
    await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    const emoji = level === 3 ? "🟢" : level === 2 ? "🟡" : "🔴";
    toast(`心力已记录 ${emoji}`);
    const r = await fetch("/api/dashboard");
    setData(await r.json());
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        加载中...
      </div>
    );
  }

  const quadrantCards = [
    {
      icon: Brain,
      label: "心智",
      href: "/mental",
      stats: ["知识库 · 笔记"],
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Briefcase,
      label: "职业",
      href: "/career",
      stats: [
        `待办 ${data.tasks.todo}`,
        `进行中 ${data.tasks.doing}`,
        `本月 ¥${data.monthlyExpense}`,
      ],
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Heart,
      label: "身体",
      href: "/body",
      stats: [
        `习惯 ${data.habits.done}/${data.habits.total}`,
        `运动 ${data.exercise.done}/${data.exercise.target}`,
        data.energy
          ? `心力 ${["🔴", "🟡", "🟢"][data.energy.level - 1]}`
          : "心力未记",
      ],
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Users,
      label: "精神",
      href: "/spirit",
      stats: [`联系人 ${data.spiritContacts}`],
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-lg font-medium">{data.today}</h1>

      {/* Four Quadrant Cards */}
      <div className="grid grid-cols-4 gap-3">
        {quadrantCards.map(({ icon: Icon, label, href, stats, color, bg }) => (
          <a key={label} href={href}>
            <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", bg)}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <div className="space-y-0.5">
                  {stats.map((s, i) => (
                    <p key={i} className="text-xs text-zinc-500">{s}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Energy Check */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-medium">今日心力</h2>
          <div className="flex gap-3">
            {[
              { level: 1, emoji: "🔴", label: "枯竭", desc: "连瘫着都累" },
              { level: 2, emoji: "🟡", label: "勉强", desc: "能动但不想" },
              { level: 3, emoji: "🟢", label: "还行", desc: "能做点事" },
            ].map(({ level, emoji, label, desc }) => (
              <button
                key={level}
                onClick={() => saveEnergy(level)}
                className={cn(
                  "flex-1 p-3 rounded-lg border text-center transition-colors",
                  energy === level
                    ? "border-white/30 bg-zinc-800"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                )}
              >
                <p className="text-lg">{emoji} {label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-medium">本周概览</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>习惯打卡</span>
                <span>{data.habits.done}/{data.habits.total}</span>
              </div>
              <Progress
                value={(data.habits.done / Math.max(data.habits.total, 1)) * 100}
                className="h-2 [&>div]:bg-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>本月支出</span>
                <span>¥{data.monthlyExpense} / ¥{data.monthlyBudget}</span>
              </div>
              <Progress
                value={(data.monthlyExpense / Math.max(data.monthlyBudget, 1)) * 100}
                className="h-2 [&>div]:bg-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          {/* Habit Heatmap */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <h3 className="text-xs font-medium text-zinc-500 mb-3">习惯热力图 (30天)</h3>
              <div className="flex flex-wrap gap-1">
                {stats.habitHeatmap.map((d) => {
                  const intensity = Math.min(d.done / 4, 1);
                  return (
                    <div
                      key={d.date}
                      className="w-3.5 h-3.5 rounded-sm"
                      style={{ backgroundColor: `rgba(52, 211, 153, ${0.15 + intensity * 0.85})` }}
                      title={`${d.date}: ${d.done} 完成`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Expense Pie */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <h3 className="text-xs font-medium text-zinc-500 mb-1">本月支出分布</h3>
              {stats.expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.expensePie} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={55} innerRadius={25}>
                      {stats.expensePie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-zinc-600 py-8 text-center">暂无数据</p>
              )}
            </CardContent>
          </Card>

          {/* Energy Trend */}
          <Card className="border-zinc-800 bg-zinc-900/50 col-span-2">
            <CardContent className="p-4">
              <h3 className="text-xs font-medium text-zinc-500 mb-1">心力趋势 (30天)</h3>
              {stats.energyTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={stats.energyTrend}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                    <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tick={{ fontSize: 10, fill: "#71717a" }} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="level" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-zinc-600 py-4 text-center">需要至少 2 天数据</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
