"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, Plus, ArrowRight, BatteryCharging, Activity as ActivityIcon } from "lucide-react";
import { cn, localYMD } from "@/lib/utils";
import { ENERGY_LEVELS, energyEmoji } from "@/lib/energy";
import { AutoTextarea } from "@/components/auto-textarea";
import { TaskList } from "@/components/task-list";

interface ActivityLog { id: number; content: string; task_id: number | null; created_at: string; }

export default function WorkbenchPage() {
  const [activityContent, setActivityContent] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [todayEnergy, setTodayEnergy] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const today = localYMD();
    Promise.all([
      fetch("/api/activity").then((r) => r.json()),
      fetch("/api/energy/logs").then((r) => r.json()),
    ])
      .then(([acts, logs]) => {
        if (cancelled) return;
        setActivities(acts as ActivityLog[]);
        const log = (logs as { date: string; level: number }[]).find((l) => l.date === today);
        setTodayEnergy(log?.level ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const addActivity = async () => {
    if (!activityContent.trim()) return;
    const res = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: activityContent.trim() }),
    });
    if (!res.ok) { toast("记录失败"); return; }
    setActivityContent("");
    toast("已记录");
    setRefreshKey((k) => k + 1);
  };

  const saveEnergy = async (level: number) => {
    const res = await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) { toast("记录失败"); return; }
    toast("已记录心力状态，并写入 Activity");
    setRefreshKey((k) => k + 1);
  };

  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-500/10"><Zap size={24} className="text-sky-400" /></div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">工作台</h1>
          <p className="text-base text-muted-foreground">一个页面：记下要做的，也记下刚发生的。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 左栏：任务 */}
        <TaskList />

        {/* 右栏：心力 + 记录 + 最近 Activity */}
        <div className="space-y-6">
          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BatteryCharging size={16} />心力状态
              </h2>
              <div className="flex gap-2">
                {ENERGY_LEVELS.map((e) => (
                  <button
                    key={e.level}
                    onClick={() => saveEnergy(e.level)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border text-base font-medium transition-all duration-150",
                      todayEnergy === e.level
                        ? "border-white/30 bg-zinc-700 text-white"
                        : "border-border bg-card text-foreground/70 hover:border-zinc-600/50 hover:text-foreground",
                    )}
                  >
                    {e.emoji} {e.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayEnergy
                  ? `今日已记录：${energyEmoji(todayEnergy)} ${ENERGY_LEVELS.find((e) => e.level === todayEnergy)?.label}`
                  : "点击即记录，并自动写进 Activity"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ActivityIcon size={16} />记录 · 刚刚发生了什么
              </h2>
              <AutoTextarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addActivity();
                  }
                }}
                placeholder="今天发生了什么……"
                maxHeight={200}
                className="bg-muted border border-border rounded-xl p-3 text-base text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enter 换行 · Ctrl/Cmd+Enter 提交</span>
                <Button onClick={addActivity} disabled={!activityContent.trim()} size="sm" className="shrink-0 rounded-xl text-base">
                  <Plus size={18} className="mr-1" />记录
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-medium text-muted-foreground">最近 Activity</h2>
                <Link href="/daily" className="text-xs text-semantic-blue hover:text-semantic-green flex items-center gap-0.5">
                  查看全部 <ArrowRight size={12} />
                </Link>
              </div>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无记录</p>
              ) : (
                <div className="space-y-0.5">
                  {recentActivities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/80">
                      <span className="text-xs text-muted-foreground font-mono pt-0.5 shrink-0">{a.created_at.slice(11, 16)}</span>
                      <span className="text-sm text-foreground flex-1 whitespace-pre-wrap break-words">{a.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
