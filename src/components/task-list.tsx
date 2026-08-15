"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoTextarea } from "@/components/auto-textarea";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: number; title: string; description: string; quadrant: string;
  status: "todo" | "doing" | "done"; priority: "low" | "medium" | "high";
  sort_order: number; completed_at: string | null;
}

const QUADRANT_ICON: Record<string, string> = { career: "💼", mental: "🧠", body: "💪", spirit: "🌟" };
const QUADRANT_LABEL: Record<string, string> = { career: "工作", mental: "心智", body: "身体", spirit: "精神" };
const PRIORITY_ICON: Record<string, string> = { high: "🔴", medium: "🟡", low: "🟢" };
const PRIORITY_LABEL: Record<string, string> = { high: "高", medium: "中", low: "低" };
const STATUS_LABEL: Record<string, string> = { todo: "待办", doing: "进行中", done: "已完成" };
const PRIORITY_BORDER: Record<string, string> = { high: "border-l-semantic-red", medium: "border-l-semantic-yellow", low: "border-l-transparent" };

function SortableTaskRow({
  task, expanded, onToggleExpand, onUpdate, onDelete,
}: {
  task: Task; expanded: boolean;
  onToggleExpand: (id: number) => void;
  onUpdate: (id: number, fields: Partial<Task>) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div className={cn("border border-border bg-card rounded-lg border-l-2 p-2 hover:bg-muted/60 transition-colors", PRIORITY_BORDER[task.priority])}>
        <div className="flex items-center gap-1">
          <button {...attributes} {...listeners} className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing">
            <GripVertical size={14} />
          </button>
          <button onClick={() => onToggleExpand(task.id)} className="text-muted-foreground hover:text-foreground shrink-0">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <span className="text-sm shrink-0" title={`优先级：${PRIORITY_LABEL[task.priority]}`}>{PRIORITY_ICON[task.priority]}</span>
          <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
          <span className="text-sm shrink-0" title={QUADRANT_LABEL[task.quadrant]}>{QUADRANT_ICON[task.quadrant]}</span>
          <Select value={task.status} onValueChange={(v) => v && onUpdate(task.id, { status: v as Task["status"] })}>
            <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-md px-1.5 gap-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", task.status === "doing" ? "bg-semantic-yellow" : task.status === "done" ? "bg-semantic-green" : "bg-semantic-muted")} />
              {STATUS_LABEL[task.status]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">待办</SelectItem>
              <SelectItem value="doing">进行中</SelectItem>
              <SelectItem value="done">已完成</SelectItem>
            </SelectContent>
          </Select>
          <Select value={task.quadrant} onValueChange={(v) => v && onUpdate(task.id, { quadrant: v })}>
            <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-md px-1.5">
              {QUADRANT_ICON[task.quadrant]}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUADRANT_ICON).map(([k, icon]) => (
                <SelectItem key={k} value={k}>{icon} {QUADRANT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={task.priority} onValueChange={(v) => v && onUpdate(task.id, { priority: v as Task["priority"] })}>
            <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-md px-1.5">
              {PRIORITY_ICON[task.priority]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 高</SelectItem>
              <SelectItem value="medium">🟡 中</SelectItem>
              <SelectItem value="low">🟢 低</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => onDelete(task.id)} className="text-muted-foreground/50 hover:text-destructive shrink-0" title="删除">
            <Trash2 size={14} />
          </button>
        </div>

        {expanded ? (
          <AutoTextarea
            key={task.id}
            defaultValue={task.description || ""}
            onBlur={(e) => { const v = e.target.value; if (v !== (task.description || "")) onUpdate(task.id, { description: v }); }}
            placeholder="备注…"
            maxHeight={200}
            className="mt-1.5 bg-muted border border-border rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        ) : (
          task.description ? (
            <p className="text-xs text-muted-foreground truncate pl-5 mt-1">📝 {task.description}</p>
          ) : null
        )}
      </div>
    </div>
  );
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newQuadrant, setNewQuadrant] = useState("career");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showAllDone, setShowAllDone] = useState(false);
  const [activeDrag, setActiveDrag] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setTasks(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const current = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));
  const visibleDone = showAllDone ? done : done.slice(0, 7);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), quadrant: newQuadrant, priority: newPriority }),
    });
    if (!res.ok) { toast("创建任务失败"); return; }
    setNewTitle("");
    toast("任务已创建");
    setRefreshKey((k) => k + 1);
  };

  const updateTask = async (id: number, fields: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
    setRefreshKey((k) => k + 1);
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveDrag(tasks.find((t) => t.id === e.active.id) || null);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = current.findIndex((t) => t.id === active.id);
    const newIdx = current.findIndex((t) => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(current, oldIdx, newIdx);
    for (let i = 0; i < reordered.length; i++) {
      await fetch(`/api/tasks/${reordered[i].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: i * 10 }) });
    }
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-3">
      {/* 新建任务 */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Select value={newQuadrant} onValueChange={(v) => v && setNewQuadrant(v)}>
            <SelectTrigger className="h-8 px-2 bg-muted border-border rounded-lg text-xs gap-1">
              {QUADRANT_ICON[newQuadrant]} {QUADRANT_LABEL[newQuadrant]}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUADRANT_ICON).map(([k, icon]) => (
                <SelectItem key={k} value={k}>{icon} {QUADRANT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Task["priority"])}>
            <SelectTrigger className="h-8 px-2 bg-muted border-border rounded-lg text-xs gap-1">
              {PRIORITY_ICON[newPriority]} {PRIORITY_LABEL[newPriority]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 高</SelectItem>
              <SelectItem value="medium">🟡 中</SelectItem>
              <SelectItem value="low">🟢 低</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="新任务…"
            className="flex-1 bg-muted border-border rounded-lg text-base"
          />
          <Button onClick={addTask} disabled={!newTitle.trim()} size="sm" className="shrink-0 rounded-lg text-base">
            <Plus size={16} className="mr-1" />添加
          </Button>
        </div>
      </div>

      {/* 当前任务 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={current.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {current.map((t) => (
              <SortableTaskRow key={t.id} task={t} expanded={expanded.has(t.id)} onToggleExpand={toggleExpand} onUpdate={updateTask} onDelete={deleteTask} />
            ))}
            {current.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">没有进行中的任务</p>}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDrag && (
            <div className="opacity-80 rotate-1 border border-border bg-card rounded-lg border-l-2 p-2 shadow-xl">
              <div className="flex items-center gap-1">
                <GripVertical size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{activeDrag.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 已完成归档 */}
      {done.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-sm text-muted-foreground">已完成 ({done.length})</div>
          <div className="mt-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {visibleDone.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-muted/60">
                <span className="text-sm shrink-0">{PRIORITY_ICON[t.priority]}</span>
                <span className="text-sm text-muted-foreground flex-1 truncate line-through">{t.title}</span>
                <span className="text-xs text-muted-foreground/60 shrink-0">{(t.completed_at || "").slice(0, 10)}</span>
                <button onClick={() => updateTask(t.id, { status: "todo" })} className="text-muted-foreground/50 hover:text-foreground shrink-0" title="恢复为待办">
                  <RotateCcw size={13} />
                </button>
              </div>
            ))}
          </div>
          {done.length > 7 && (
            <button onClick={() => setShowAllDone(!showAllDone)} className="mt-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {showAllDone ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAllDone ? "收起" : `查看更早历史（还有 ${done.length - 7} 条）`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
