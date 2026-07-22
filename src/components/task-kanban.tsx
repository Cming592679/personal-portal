"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Brain, Briefcase, Heart, Users, ChevronDown, ChevronUp, GripVertical, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  closestCorners, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TaskLogTimeline from "@/components/task-log-timeline";

interface Task { id: number; title: string; description: string; quadrant: string; status: "todo" | "doing" | "done"; priority: "low" | "medium" | "high"; due_date: string | null; sort_order: number; }

const COLUMNS: { key: Task["status"]; label: string; bg: string; border: string }[] = [
  { key: "todo", label: "待办", bg: "bg-muted/60", border: "border-l-semantic-muted" },
  { key: "doing", label: "进行中", bg: "bg-[rgba(210,153,34,0.05)]", border: "border-l-semantic-yellow" },
  { key: "done", label: "已完成", bg: "bg-[rgba(63,185,80,0.05)]", border: "border-l-semantic-green" },
];
const STATUS_LABEL: Record<string, string> = { todo: "待办", doing: "进行中", done: "已完成" };
const PRIORITY_BORDER: Record<string, string> = { high: "border-l-semantic-red", medium: "border-l-semantic-yellow", low: "border-l-transparent" };
const PRIORITY_ICON: Record<string, string> = { high: "🔴", medium: "🟡", low: "🟢" };
const QUADRANT_ICON: Record<string, string> = { career: "💼", mental: "🧠", body: "💪", spirit: "🌟" };
const QUADRANT_LABEL: Record<string, string> = { career: "工作", mental: "心智", body: "身体", spirit: "精神" };
const QUADRANTS = [
  { key: "all", label: "全部", icon: null, color: "" },
  { key: "career", label: "工作", icon: Briefcase, color: "text-amber-400" },
  { key: "mental", label: "心智", icon: Brain, color: "text-violet-400" },
  { key: "body", label: "身体", icon: Heart, color: "text-emerald-400" },
  { key: "spirit", label: "精神", icon: Users, color: "text-rose-400" },
];

/* ═══ Sortable task wrapper ═══ */
function SortableTask({
  task, expanded, onToggleExpand, onUpdate, onDelete, onMove,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: (id: number) => void;
  onUpdate: (id: number, fields: Partial<Task>) => void;
  onDelete: (id: number) => void;
  onMove: (id: number, status: Task["status"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <Card className={cn(
        "border-border bg-card rounded-lg border-l-2 hover:bg-muted transition-colors duration-150",
        PRIORITY_BORDER[task.priority] || "border-l-transparent"
      )}>
        <CardContent className="p-2.5 space-y-1.5">
          <div className="flex items-start gap-1">
            {/* Drag handle */}
            <button {...attributes} {...listeners} className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 mt-0.5 cursor-grab active:cursor-grabbing transition-colors">
              <GripVertical size={14} />
            </button>
            {/* Expand button */}
            <button
              onClick={() => onToggleExpand(task.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <p className="text-sm text-foreground flex-1">{task.title}</p>
            <button onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-danger shrink-0 mt-0.5 transition-colors"><Trash2 size={16} /></button>
          </div>
          {expanded && (
            <textarea
              defaultValue={task.description || ""}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (task.description || "")) onUpdate(task.id, { description: val });
              }}
              placeholder="备注..."
              rows={2}
              className="w-full bg-muted border border-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-semantic-blue text-foreground placeholder:text-muted-foreground"
            />
          )}
          <div className="flex items-center gap-1.5">
            <Select value={task.quadrant} onValueChange={(v) => v && onUpdate(task.id, { quadrant: v })}>
              <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-lg w-9 justify-center p-0">
                <span>{QUADRANT_ICON[task.quadrant] || "?"}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUADRANT_ICON).map(([k, icon]) => (
                  <SelectItem key={k} value={k}>{icon} {QUADRANT_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={task.priority} onValueChange={(v) => v && onUpdate(task.id, { priority: v as Task["priority"] })}>
              <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-lg w-9 justify-center p-0">
                <span>{PRIORITY_ICON[task.priority]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 高</SelectItem>
                <SelectItem value="medium">🟡 中</SelectItem>
                <SelectItem value="low">🟢 低</SelectItem>
              </SelectContent>
            </Select>
            <Select value={task.status} onValueChange={(v) => v && onMove(task.id, v as Task["status"])}>
              <SelectTrigger className="h-6 text-xs bg-muted border-border rounded-lg px-2">
                <span>{STATUS_LABEL[task.status] || task.status}</span>
              </SelectTrigger>
              <SelectContent>{COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            {task.due_date && <span className="text-xs text-muted-foreground ml-auto">{task.due_date}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══ Main Kanban ═══ */
export function TaskKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quadrant, setQuadrant] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newQuadrant, setNewQuadrant] = useState("career");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [doneCollapsed, setDoneCollapsed] = useState(false);
  const [activeDrag, setActiveDrag] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(async () => {
    const r = await fetch("/api/tasks"); setTasks(await r.json());
  }, []);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = quadrant === "all" ? tasks : tasks.filter(t => t.quadrant === quadrant);

  const handleQuadrantChange = (q: string) => {
    setQuadrant(q);
    if (q !== "all") setNewQuadrant(q);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const maxOrder = Math.max(0, ...tasks.filter(t => t.status === "todo").map(t => t.sort_order || 0));
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), quadrant: newQuadrant, priority: newPriority, sort_order: maxOrder + 10 }),
      });
      if (!res.ok) { toast(`添加失败: ${res.status}`); return; }
      setNewTitle(""); toast("任务已创建"); await fetchTasks();
    } catch (e: unknown) {
      toast(`网络错误: ${e instanceof Error ? e.message : "unknown"}`);
    }
  };

  const updateTask = async (id: number, fields: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
    await fetchTasks();
  };

  const moveTask = async (id: number, status: Task["status"]) => {
    const colTasks = filtered.filter(t => t.status === status);
    const maxOrder = Math.max(0, ...colTasks.map(t => t.sort_order || 0));
    await updateTask(id, { status, sort_order: maxOrder + 10 });
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await fetchTasks();
  };

  const tasksByColumn = (key: Task["status"]) =>
    filtered.filter(t => t.status === key).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  /* ═══ Drag & Drop handlers ═══ */
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveDrag(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Find which column the task was dropped on
    const overTask = tasks.find(t => t.id === over.id);
    const overStatus = overTask
      ? overTask.status
      : (COLUMNS.find(c => c.key === over.id) ? over.id as Task["status"] : null);

    if (!overStatus) return;

    if (activeTask.status !== overStatus) {
      // Moved to a different column
      const colTasks = filtered.filter(t => t.status === overStatus).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const insertIdx = overTask ? colTasks.findIndex(t => t.id === overTask.id) : colTasks.length;
      const newOrder = insertIdx * 10;
      await fetch(`/api/tasks/${activeTask.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: overStatus, sort_order: newOrder }),
      });
    } else {
      // Reorder within same column
      const colTasks = filtered.filter(t => t.status === activeTask.status).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const oldIdx = colTasks.findIndex(t => t.id === active.id);
      const newIdx = colTasks.findIndex(t => t.id === over.id);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      // Update sort_order for all items in this column
      for (let i = 0; i < reordered.length; i++) {
        await fetch(`/api/tasks/${reordered[i].id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: i * 10 }),
        });
      }
    }
    await fetchTasks();
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5 space-y-4">
        {/* Quadrant tabs + 日志按钮 */}
        <div className="flex gap-1.5 flex-wrap items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {QUADRANTS.map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => handleQuadrantChange(key)}
                className={cn("px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5",
                  quadrant === key ? "bg-zinc-700 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {Icon && <Icon size={16} className={quadrant === key ? color : ""} />}
                {label}
              </button>
            ))}
          </div>
          <Dialog>
            <DialogTrigger className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5 cursor-pointer border-0 bg-transparent">
              <Clock size={16} />
              日志
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-[#09090b] border-[#27272a] text-foreground max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="text-foreground">📋 任务日志</DialogTitle>
              </DialogHeader>
              <TaskLogTimeline />
            </DialogContent>
          </Dialog>
        </div>

        {/* New task input */}
        <div className="flex gap-2 items-center">
          <Select value={newQuadrant} onValueChange={(v) => v && setNewQuadrant(v)}>
            <SelectTrigger className="h-8 w-12 text-sm bg-muted border-border rounded-lg justify-center">
              <span>{QUADRANT_ICON[newQuadrant]}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUADRANT_ICON).map(([k, icon]) => (
                <SelectItem key={k} value={k}>{icon} {QUADRANT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Task["priority"])}>
            <SelectTrigger className="h-8 w-12 text-sm bg-muted border-border rounded-lg justify-center">
              <span>{PRIORITY_ICON[newPriority]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 高</SelectItem>
              <SelectItem value="medium">🟡 中</SelectItem>
              <SelectItem value="low">🟢 低</SelectItem>
            </SelectContent>
          </Select>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="新任务..." className="flex-1 bg-muted border-border rounded-lg text-base" />
          <Button onClick={addTask} size="sm" className="shrink-0 rounded-lg text-base"><Plus size={18} className="mr-1" />添加</Button>
        </div>

        {/* Kanban columns with DnD */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map(({ key, label, bg, border }) => {
              const colTasks = tasksByColumn(key);
              const colIds = colTasks.map(t => t.id);
              const isDone = key === "done";

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-muted-foreground">{label}</span>
                      <Badge variant="outline" className="text-sm">{colTasks.length}</Badge>
                    </div>
                    {isDone && (
                      <button
                        onClick={() => setDoneCollapsed(!doneCollapsed)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {doneCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    )}
                  </div>

                  <SortableContext items={colIds} id={key} strategy={verticalListSortingStrategy}>
                    <div
                      data-droppable={key}
                      className={`space-y-2 min-h-[80px] rounded-xl border-l-2 ${border} ${bg} p-2 transition-all ${isDone && doneCollapsed ? 'hidden' : ''}`}
                    >
                      {colTasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          expanded={expanded.has(task.id)}
                          onToggleExpand={toggleExpand}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                          onMove={moveTask}
                        />
                      ))}
                      {colTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground/40 text-center py-4">拖拽任务到此处</p>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          {/* Drag overlay — ghost of the dragged task */}
          <DragOverlay>
            {activeDrag && (
              <div className="opacity-80 rotate-2">
                <Card className="border-border bg-card rounded-lg border-l-2 shadow-xl">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1">
                      <GripVertical size={14} className="text-muted-foreground" />
                      <p className="text-sm text-foreground">{activeDrag.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
