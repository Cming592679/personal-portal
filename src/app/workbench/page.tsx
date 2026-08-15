"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, Plus, ArrowRight } from "lucide-react";
import { AutoTextarea } from "@/components/auto-textarea";
import { TaskList } from "@/components/task-list";
import { ENERGY_LEVELS } from "@/lib/energy";

interface ActivityLog { id: number; content: string; task_id: number | null; created_at: string; }

export default function WorkbenchPage() {
  const [activityContent, setActivityContent] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setActivities(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const saveEnergy = async (level: number) => {
    const res = await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) { toast("记录失败"); return; }
    const meta = ENERGY_LEVELS.find((e) => e.level === level);
    toast(`已记录心力状态：${meta?.label ?? level}`);
    setRefreshKey((k) => k + 1);
  };

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

  const recent = activities.slice(0, 10);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-500/10"><Zap size={24} className="text-sky-400" /></div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">工作台</h1>
          <p className="text-base text-muted-foreground">记下要做的，也记下刚发生的。</p>
        </div>
      </div>

      {/* 心力状态快选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground shrink-0">心力状态</span>
        {ENERGY_LEVELS.map((e) => (
          <button
            key={e.level}
            onClick={() => saveEnergy(e.level)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm transition-all hover:border-zinc-600/50 hover:bg-[#1c2129]"
            title={`记录心力状态：${e.label}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: e.dot }} />
            {e.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task 区 */}
        <Card className="border-border bg-card rounded-xl">
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">任务 · 我要做什么</h2>
            <TaskList />
          </CardContent>
        </Card>

        {/* Activity 区 */}
        <Card className="border-border bg-card rounded-xl">
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">记录 · 刚刚发生了什么</h2>
            <AutoTextarea
              value={activityContent}
              onChange={(e) => setActivityContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addActivity(); } }}
              placeholder="今天发生了什么……（Ctrl/Cmd + Enter 提交）"
              maxHeight={200}
              className="bg-muted border border-border rounded-xl p-3 text-base text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Enter 换行 · Ctrl/Cmd+Enter 提交 · 不要求分类</span>
              <Button onClick={addActivity} disabled={!activityContent.trim()} size="sm" className="shrink-0 rounded-lg text-base">
                <Plus size={16} className="mr-1" />记录
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">最近 Activity</h3>
              <Link href="/daily" className="text-xs text-semantic-blue hover:text-semantic-green flex items-center gap-0.5">
                查看全部 <ArrowRight size={12} />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">暂无记录</p>
            ) : (
              <div className="mt-1.5 space-y-0.5">
                {recent.map((a) => (
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
  );
}
