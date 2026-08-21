"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity, Plus, X, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: number;
  content: string;
  task_id: number | null;
  created_at: string;
}

interface WeeklyData {
  weekStart: string;
  daysElapsed: number;
  quadrant: Record<string, number>;
  activityCount: number;
  habitRate: number;
  energyAvg: number | null;
  energyDays: number;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(day: string): string {
  const now = new Date();
  const today = localDateStr(now);
  const yesterday = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  if (day === today) return "今天";
  if (day === yesterday) return "昨天";
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const d = new Date(`${day}T00:00:00`);
  return `${day.slice(5)} ${weekdays[d.getDay()]}`;
}

export default function DailyPage() {
  const [content, setContent] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const url = filterDate ? `/api/activity?date=${encodeURIComponent(filterDate)}` : "/api/activity";
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setActivities(data); })
      .catch(() => { if (!cancelled) setActivities([]); });
    return () => { cancelled = true; };
  }, [filterDate, refreshKey]);

  const addActivity = async () => {
    if (!content.trim()) return;
    const res = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });
    if (!res.ok) { toast("记录失败"); return; }
    setContent("");
    toast("已记录");
    setRefreshKey((k) => k + 1);
  };

  const deleteActivity = async (id: number) => {
    await fetch(`/api/activity?id=${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  };

  const grouped = activities.reduce<Record<string, ActivityLog[]>>((acc, a) => {
    const day = a.created_at.slice(0, 10);
    (acc[day] ||= []).push(a);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10"><Activity size={24} className="text-cyan-400" /></div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">Daily</h1>
          <p className="text-base text-muted-foreground">今天发生了什么？</p>
        </div>
      </div>

      <WeeklyOverview />

      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-5 space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); addActivity(); }} className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入内容……"
              className="bg-muted border-border rounded-xl text-base"
              autoFocus
            />
            <Button type="submit" disabled={!content.trim()} size="sm" className="shrink-0 rounded-xl text-base">
              <Plus size={18} className="mr-1" />记录
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">筛选日期</span>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-44 bg-muted border-border rounded-xl text-base"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate("")} className="rounded-xl text-base">
            全部
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {days.map((day) => (
          <div key={day}>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">{dayLabel(day)}</span>
              <span className="text-sm text-muted-foreground">{day}</span>
            </div>
            <div className="space-y-1">
              {grouped[day].map((a) => (
                <div key={a.id} className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/80">
                  <span className="text-sm text-muted-foreground font-mono pt-0.5 shrink-0">
                    {a.created_at.slice(11, 16)}
                  </span>
                  <span className="text-base text-foreground flex-1 whitespace-pre-wrap break-words">{a.content}</span>
                  <button
                    onClick={() => deleteActivity(a.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                    title="删除"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {days.length === 0 && (
          <p className="text-base text-muted-foreground py-8 text-center">暂无记录</p>
        )}
      </div>
    </div>
  );
}

function WeeklyOverview() {
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weekly")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const quadrants = [
    { key: "career", label: "工作", icon: "💼", color: "text-amber-400" },
    { key: "mental", label: "心智", icon: "🧠", color: "text-violet-400" },
    { key: "body", label: "身体", icon: "💪", color: "text-emerald-400" },
    { key: "spirit", label: "精神", icon: "🌟", color: "text-rose-400" },
  ];

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 size={16} />本周概览（{data.weekStart} 起）
          </h2>
          <span className="text-xs text-muted-foreground">{data.daysElapsed} 天 · 按四象限统计完成任务</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quadrants.map(({ key, label, icon, color }) => (
            <div key={key} className="text-center p-3 rounded-xl bg-muted border-l-[3px] border-l-semantic-blue">
              <p className="text-sm">{icon} {label}</p>
              <p className={cn("text-2xl font-semibold font-mono tabular-nums mt-1", color)}>{data.quadrant[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">完成</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-muted">
            <p className="text-xl font-semibold font-mono tabular-nums text-foreground">{data.activityCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Activity 条数</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <p className="text-xl font-semibold font-mono tabular-nums text-foreground">{data.habitRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">习惯完成率</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <p className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {data.energyAvg !== null ? data.energyAvg : "—"}
              <span className="text-sm text-muted-foreground ml-0.5">{data.energyDays > 0 ? `/ ${data.energyDays}天` : ""}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">心力均值</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
