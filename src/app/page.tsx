"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, Briefcase, Heart, Users, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  today: string;
  tasks: { todo: number; doing: number };
  habits: { done: number; total: number };
  exercise: { done: number; target: number };
  monthlyExpense: number;
  monthlyBudget: number;
  spiritContacts: number;
  energy: { level: number; note: string } | null;
  observation: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [observation, setObservation] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const saveObservation = async () => {
    if (!observation.trim()) return;
    setSaving(true);
    await fetch("/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: observation }),
    });
    setObservation("");
    setSaving(false);
    toast("已记录");
    const r = await fetch("/api/dashboard");
    setData(await r.json());
  };

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
      stats: [
        data.observation ? "今日已记" : "今日未记",
      ],
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
      {/* Header */}
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
                    <p key={i} className="text-xs text-zinc-500">
                      {s}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Today's Focus: Observation */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Pencil size={14} />
            外部观察（今天注意到了什么问题？）
          </h2>
          <div className="flex gap-2">
            <Input
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveObservation()}
              placeholder="一句话描述你注意到的现实问题..."
              className="bg-zinc-800 border-zinc-700"
            />
            <Button
              onClick={saveObservation}
              disabled={saving || !observation.trim()}
              size="sm"
              className="shrink-0"
            >
              <Check size={14} className="mr-1" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-lg">
                  {emoji} {label}
                </p>
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
                value={(data.monthlyExpense / data.monthlyBudget) * 100}
                className="h-2 [&>div]:bg-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
