"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Brain, Briefcase, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task { id: number; title: string; description: string; quadrant: string; status: "todo" | "doing" | "done"; priority: "low" | "medium" | "high"; due_date: string | null; }

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "待办", color: "border-zinc-500" },
  { key: "doing", label: "进行中", color: "border-amber-500" },
  { key: "done", label: "已完成", color: "border-emerald-500" },
];
const PRIORITY: Record<string, string> = { high: "bg-red-500/10 text-red-400", medium: "bg-amber-500/10 text-amber-400", low: "bg-zinc-500/10 text-zinc-400" };
const QUADRANTS = [
  { key: "all", label: "全部", icon: null, color: "" },
  { key: "career", label: "职业", icon: Briefcase, color: "text-amber-400" },
  { key: "mental", label: "心智", icon: Brain, color: "text-violet-400" },
  { key: "body", label: "身体", icon: Heart, color: "text-emerald-400" },
  { key: "spirit", label: "精神", icon: Users, color: "text-rose-400" },
];

export function TaskKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quadrant, setQuadrant] = useState("all");
  const [newTitle, setNewTitle] = useState("");

  const fetchTasks = useCallback(async () => {
    const r = await fetch("/api/tasks"); setTasks(await r.json());
  }, []);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = quadrant === "all" ? tasks : tasks.filter(t => t.quadrant === quadrant);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const q = quadrant === "all" ? "career" : quadrant;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, quadrant: q }) });
    setNewTitle(""); toast("任务已创建"); fetchTasks();
  };
  const moveTask = async (id: number, status: Task["status"]) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchTasks();
  };
  const deleteTask = async (id: number) => { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); fetchTasks(); };
  const tasksByColumn = (key: Task["status"]) => filtered.filter(t => t.status === key);

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-base font-medium text-zinc-300">任务看板</h2>

        {/* Quadrant tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {QUADRANTS.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setQuadrant(key)}
              className={cn("px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
                quadrant === key ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50")}>
              {Icon && <Icon size={14} className={quadrant === key ? color : ""} />}
              {label}
            </button>
          ))}
        </div>

        {/* New task input */}
        <div className="flex gap-2">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="新任务..." className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <Button onClick={addTask} size="sm" className="shrink-0 rounded-xl text-sm"><Plus size={16} className="mr-1" />添加</Button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">{label}</span>
                <Badge variant="outline" className="text-xs">{tasksByColumn(key).length}</Badge>
              </div>
              <div className={`space-y-2 min-h-[80px] rounded-xl border-l-2 ${color} bg-zinc-800/30 p-2`}>
                {tasksByColumn(key).map((task) => {
                  const q = QUADRANTS.find(qq => qq.key === task.quadrant);
                  return (
                    <Card key={task.id} className="border-zinc-700/50 bg-zinc-800/60 rounded-xl">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-zinc-200">{task.title}</p>
                          <button onClick={() => deleteTask(task.id)} className="text-zinc-500 hover:text-red-400 shrink-0 mt-0.5"><Trash2 size={14} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          {q && q.icon && <q.icon size={12} className={q.color} />}
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", PRIORITY[task.priority])}>
                            {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                          </span>
                          {task.due_date && <span className="text-xs text-zinc-500">{task.due_date}</span>}
                        </div>
                        <Select value={task.status} onValueChange={(v) => v && moveTask(task.id, v as Task["status"])}>
                          <SelectTrigger className="h-7 text-xs bg-zinc-700/50 border-zinc-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
