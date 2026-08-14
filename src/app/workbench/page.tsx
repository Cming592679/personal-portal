"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Plus, ListTodo, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task { id: number; title: string; status: "todo" | "doing" | "done"; sort_order: number; }
interface ActivityLog { id: number; content: string; task_id: number | null; created_at: string; }

const STATUS_LABEL: Record<string, string> = { todo: "待办", doing: "进行中", done: "已完成" };

export default function WorkbenchPage() {
  const [taskTitle, setTaskTitle] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/activity").then((r) => r.json()),
    ])
      .then(([t, a]) => {
        if (cancelled) return;
        setTasks(t);
        setActivities(a);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle.trim(), quadrant: "career", priority: "medium" }),
    });
    if (!res.ok) { toast("创建任务失败"); return; }
    setTaskTitle("");
    toast("任务已创建");
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

  const currentTasks = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.status === "doing" ? 0 : 1) - (b.status === "doing" ? 0 : 1))
    .slice(0, 8);
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-500/10"><Zap size={24} className="text-sky-400" /></div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">工作台</h1>
          <p className="text-base text-muted-foreground">一个页面：记下要做的，也记下刚发生的。</p>
        </div>
      </div>

      {/* 快速输入 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListTodo size={16} />新任务 · 我要做什么
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="新任务……"
                className="bg-muted border-border rounded-xl text-base"
                autoFocus
              />
              <Button type="submit" disabled={!taskTitle.trim()} size="sm" className="shrink-0 rounded-xl text-base">
                <Plus size={18} className="mr-1" />添加
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">Enter 提交 · 默认「工作 / 中优先级」，之后可在看板里改</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} />记录 · 刚刚发生了什么
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); addActivity(); }} className="flex gap-2">
              <Input
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="今天发生了什么……"
                className="bg-muted border-border rounded-xl text-base"
              />
              <Button type="submit" disabled={!activityContent.trim()} size="sm" className="shrink-0 rounded-xl text-base">
                <Plus size={18} className="mr-1" />记录
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">Enter 提交 · 不要求分类，想到就记</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近记录 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card rounded-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-muted-foreground">当前任务</h2>
              <Link href="/" className="text-xs text-semantic-blue hover:text-semantic-green flex items-center gap-0.5">
                查看全部 <ArrowRight size={12} />
              </Link>
            </div>
            {currentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">暂无进行中的任务</p>
            ) : (
              <div className="space-y-0.5">
                {currentTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/80">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", t.status === "doing" ? "bg-semantic-yellow" : "bg-semantic-muted")} />
                    <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{STATUS_LABEL[t.status]}</span>
                  </div>
                ))}
              </div>
            )}
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
  );
}
