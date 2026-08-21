"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Clock, ListTodo, History } from "lucide-react";
import { cn, localYMD } from "@/lib/utils";
import { AutoTextarea } from "@/components/auto-textarea";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TaskLogTimeline from "@/components/task-log-timeline";

interface Task {
  id: number;
  title: string;
  description: string;
  quadrant: "mental" | "career" | "body" | "spirit";
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
}

const QUADRANTS: { key: Task["quadrant"]; label: string; icon: string }[] = [
  { key: "career", label: "工作", icon: "💼" },
  { key: "mental", label: "心智", icon: "🧠" },
  { key: "body", label: "身体", icon: "💪" },
  { key: "spirit", label: "精神", icon: "🌟" },
];
const PRIORITIES: { key: Task["priority"]; label: string; icon: string }[] = [
  { key: "high", label: "高", icon: "🔴" },
  { key: "medium", label: "中", icon: "🟡" },
  { key: "low", label: "低", icon: "🟢" },
];
const STATUS_LABEL: Record<Task["status"], string> = { todo: "待办", doing: "进行中", done: "已完成" };

function quadrantMeta(key: string) {
  return QUADRANTS.find((q) => q.key === key) ?? QUADRANTS[0];
}
function priorityMeta(key: string) {
  return PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[1];
}

/* ═══ 可拖动任务行（待办 / 进行中） ═══ */
function SortableTaskRow({
  task, expanded, onToggleExpand, onUpdate, onDelete,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: (id: number) => void;
  onUpdate: (id: number, fields: Partial<Task>) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const priority = priorityMeta(task.priority);

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div className={cn(
        "border border-border bg-card rounded-lg border-l-2 p-2 hover:bg-muted/60 transition-colors",
        task.priority === "high" && "border-l-semantic-red",
        task.priority === "medium" && "border-l-semantic-yellow",
        task.priority === "low" && "border-l-transparent",
      )}>
        <div className="flex items-center gap-1.5">
          <button {...attributes} {...listeners}
            className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing transition-colors">
            <GripVertical size={14} />
          </button>
          <button onClick={() => onToggleExpand(task.id)}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <span className="text-sm shrink-0" title={`优先级：${priority.label}`}>{priority.icon}</span>
          <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
          <span className="text-sm shrink-0" title={quadrantMeta(task.quadrant).label}>
            {quadrantMeta(task.quadrant).icon}
          </span>
          <Select value={task.status} onValueChange={(v) => v && onUpdate(task.id, { status: v as Task["status"] })}>
            <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-md px-1.5 gap-0.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                task.status === "doing" ? "bg-semantic-yellow" : "bg-semantic-muted",
              )} />
              {STATUS_LABEL[task.status]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">待办</SelectItem>
              <SelectItem value="doing">进行中</SelectItem>
              <SelectItem value="done">已完成</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => onDelete(task.id)}
            className="text-muted-foreground/50 hover:text-danger shrink-0 transition-colors" title="删除">
            <Trash2 size={14} />
          </button>
        </div>

        {expanded ? (
          <AutoTextarea
            key={task.id}
            defaultValue={task.description || ""}
            onBlur={(e) => {
              const v = e.target.value;
              if (v !== (task.description || "")) onUpdate(task.id, { description: v });
            }}
            placeholder="备注…"
            maxHeight={200}
            className="mt-1.5 bg-muted border border-border rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        ) : task.description ? (
          <p className="text-xs text-muted-foreground truncate pl-5 mt-1">📝 {task.description}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ═══ 工作台任务面板：新任务 + 当前任务 + 最近已完成 + 日志 ═══ */
export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newQuadrant, setNewQuadrant] = useState<Task["quadrant"]>("career");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showAllDone, setShowAllDone] = useState(false);
  const [activeDrag, setActiveDrag] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const reload = useCallback(async () => {
    const r = await fetch("/api/tasks");
    setTasks(await r.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setTasks(data as Task[]); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const current = useMemo(
    () => tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [tasks],
  );
  const done = useMemo(
    () => tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || "")),
    [tasks],
  );
  const recentDone = useMemo(
    () => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const doneCutoff = localYMD(d);
      return done.filter((t) => (t.completed_at || "").slice(0, 10) >= doneCutoff);
    },
    [done],
  );
  const visibleDone = showAllDone ? recentDone : recentDone.slice(0, 7);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const maxOrder = Math.max(0, ...current.map((t) => t.sort_order || 0));
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          quadrant: newQuadrant,
          priority: newPriority,
          sort_order: maxOrder + 10,
        }),
      });
      if (!res.ok) { toast(`创建失败: ${res.status}`); return; }
      setNewTitle("");
      toast("任务已创建");
      await reload();
    } catch (e: unknown) {
      toast(`网络错误: ${e instanceof Error ? e.message : "unknown"}`);
    }
  };

  const updateTask = async (id: number, fields: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    await reload();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await reload();
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveDrag(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = current.findIndex((t) => t.id === active.id);
    const newIdx = current.findIndex((t) => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(current, oldIdx, newIdx);
    for (let i = 0; i < reordered.length; i++) {
      await fetch(`/api/tasks/${reordered[i].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: i * 10 }),
      });
    }
    await reload();
  };

  return (
    <div className="space-y-6">
      {/* ═══ 新任务 ═══ */}
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ListTodo size={16} />新任务 · 我要做什么
          </h2>
          <form
            onSubmit={(e) => { e.preventDefault(); addTask(); }}
            className="flex gap-2"
          >
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新任务……"
              className="bg-muted border-border rounded-xl text-base"
              autoFocus
            />
            <Button type="submit" disabled={!newTitle.trim()} size="sm" className="shrink-0 rounded-xl text-base">
              <Plus size={18} className="mr-1" />添加
            </Button>
          </form>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">分类</span>
            {QUADRANTS.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => setNewQuadrant(q.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-sm border transition-all",
                  newQuadrant === q.key
                    ? "border-white/30 bg-zinc-700 text-white"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-[#1c2129]",
                )}
              >
                {q.icon} {q.label}
              </button>
            ))}
            <span className="text-xs text-muted-foreground shrink-0 ml-2">优先级</span>
            {PRIORITIES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setNewPriority(p.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-sm border transition-all",
                  newPriority === p.key
                    ? "border-white/30 bg-zinc-700 text-white"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-[#1c2129]",
                )}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Enter 提交 · 分类和优先级创建时直接选定，之后随时可改</p>
        </CardContent>
      </Card>

      {/* ═══ 当前任务 + 最近已完成 ═══ */}
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <History size={16} />当前任务
            </h2>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger className="px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1 cursor-pointer">
                  <Clock size={14} />日志
                </DialogTrigger>
                <DialogContent className="max-w-lg bg-[#09090b] border-[#27272a] text-foreground max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">📋 任务日志</DialogTitle>
                  </DialogHeader>
                  <TaskLogTimeline />
                </DialogContent>
              </Dialog>
              <Link href="/" className="text-xs text-semantic-blue hover:text-semantic-green">
                仪表盘回顾
              </Link>
            </div>
          </div>

          {current.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无待办和进行中的任务</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={current.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {current.map((task) => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      expanded={expanded.has(task.id)}
                      onToggleExpand={toggleExpand}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeDrag && (
                  <div className="opacity-80 rotate-2">
                    <Card className="border-border bg-card rounded-lg border-l-2 shadow-xl">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <GripVertical size={14} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">{activeDrag.title}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* 最近已完成 */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => setShowAllDone(!showAllDone)}
              className="w-full flex items-center justify-between py-1"
            >
              <span className="text-sm font-medium text-muted-foreground">最近已完成</span>
              <span className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs">{done.length}</Badge>
                {showAllDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {visibleDone.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">暂无已完成任务</p>
            ) : (
              <div className="space-y-0.5 mt-1">
                {visibleDone.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/80">
                    <span className="text-sm shrink-0">✅</span>
                    <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                    {t.description && (
                      <span title={t.description} className="text-xs text-muted-foreground shrink-0">📝</span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0 font-mono">
                      {(t.completed_at || "").slice(5, 10)}
                    </span>
                    <Select value={t.status} onValueChange={(v) => v && updateTask(t.id, { status: v as Task["status"] })}>
                      <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-md px-1.5 gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-semantic-green shrink-0" />
                        {STATUS_LABEL[t.status]}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">待办</SelectItem>
                        <SelectItem value="doing">进行中</SelectItem>
                        <SelectItem value="done">已完成</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => deleteTask(t.id)}
                      className="text-muted-foreground/50 hover:text-danger shrink-0 transition-colors" title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {done.length > recentDone.length && (
              <p className="text-xs text-muted-foreground mt-1">
                更早的完成记录可在仪表盘日历中按日期查看
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
