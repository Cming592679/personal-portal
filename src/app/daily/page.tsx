"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity, Plus, X } from "lucide-react";

interface ActivityLog {
  id: number;
  content: string;
  task_id: number | null;
  created_at: string;
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
