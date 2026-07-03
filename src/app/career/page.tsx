"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, ClipboardList } from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
}

interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "待办", color: "border-zinc-600" },
  { key: "doing", label: "进行中", color: "border-amber-500" },
  { key: "done", label: "已完成", color: "border-emerald-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-zinc-500/10 text-zinc-400",
};

const CATEGORIES = [
  "餐饮", "交通", "购物", "住房", "娱乐",
  "医疗", "教育", "订阅", "其他",
];

export default function CareerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-lg font-medium">职业</h1>
      <Tabs defaultValue="tasks">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="tasks">任务看板</TabsTrigger>
          <TabsTrigger value="finance">记账</TabsTrigger>
          <TabsTrigger value="review">KPT 回顾</TabsTrigger>
          <TabsTrigger value="subscriptions">订阅</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <KanbanBoard />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinanceTracker />
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          <KptReview />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const fetchTasks = useCallback(async () => {
    const r = await fetch("/api/tasks");
    setTasks(await r.json());
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    toast("任务已创建");
    fetchTasks();
  };

  const moveTask = async (id: number, status: Task["status"]) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast("已删除");
    fetchTasks();
  };

  const tasksByColumn = (key: Task["status"]) =>
    tasks.filter((t) => t.status === key);

  return (
    <div className="space-y-4">
      {/* Add task */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="新任务..."
          className="bg-zinc-800 border-zinc-700"
        />
        <Button onClick={addTask} size="sm" className="shrink-0">
          <Plus size={14} className="mr-1" />添加
        </Button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(({ key, label, color }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <Badge variant="outline" className="text-[10px]">
                {tasksByColumn(key).length}
              </Badge>
            </div>
            <div className={`space-y-2 min-h-[100px] rounded-lg border-l-2 ${color} bg-zinc-900/50 p-2`}>
              {tasksByColumn(key).map((task) => (
                <Card
                  key={task.id}
                  className="border-zinc-800 bg-zinc-900 cursor-grab"
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-600 hover:text-red-400 shrink-0 mt-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", PRIORITY_COLORS[task.priority])}>
                        {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-zinc-600">{task.due_date}</span>
                      )}
                    </div>
                    <Select
                      value={task.status}
                      onValueChange={(v) => moveTask(task.id, v as Task["status"])}
                    >
                      <SelectTrigger className="h-6 text-[10px] bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceTracker() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("餐饮");
  const [note, setNote] = useState("");

  const fetchTxns = useCallback(async () => {
    const r = await fetch("/api/transactions");
    setTxns(await r.json());
  }, []);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  const addTxn = async () => {
    if (!amount) return;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: parseFloat(amount),
        category,
        note,
      }),
    });
    setAmount("");
    setNote("");
    toast("已记录");
    fetchTxns();
  };

  const totalExpense = txns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">本月收入</p>
            <p className="text-lg font-medium text-emerald-400">¥{totalIncome}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">本月支出</p>
            <p className="text-lg font-medium text-red-400">¥{totalExpense}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-500">结余</p>
            <p className="text-lg font-medium">¥{totalIncome - totalExpense}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add form */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex gap-2 items-end">
            <div className="w-20">
              <Select value={type} onValueChange={(v) => v && setType(v as "expense" | "income")}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">收入</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="金额"
              className="w-24 bg-zinc-800 border-zinc-700"
            />
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注"
              className="flex-1 bg-zinc-800 border-zinc-700"
            />
            <Button onClick={addTxn} size="sm" className="shrink-0">
              <Plus size={14} className="mr-1" />记录
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <div className="space-y-1">
        {txns.slice(0, 30).map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between py-2 px-3 rounded text-sm hover:bg-zinc-900/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{t.date}</span>
              <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
              <span className="text-zinc-400">{t.note}</span>
            </div>
            <span className={cn("font-medium", t.type === "expense" ? "text-red-400" : "text-emerald-400")}>
              {t.type === "expense" ? "-" : "+"}¥{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionTracker() {
  const [subs, setSubs] = useState<{ id: number; name: string; amount: number; cycle: string; next_payment: string }[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("monthly");

  const fetchSubs = useCallback(async () => {
    const r = await fetch("/api/subscriptions");
    setSubs(await r.json());
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const addSub = async () => {
    if (!name || !amount) return;
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: parseFloat(amount), cycle }),
    });
    setName(""); setAmount("");
    toast("订阅已添加");
    fetchSubs();
  };

  const deleteSub = async (id: number) => {
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    fetchSubs();
  };

  const totalMonthly = subs.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-500">月均</span>
        <span className="font-medium text-amber-400">¥{totalMonthly}</span>
      </div>

      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="服务名" className="w-32 bg-zinc-800 border-zinc-700" />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额" className="w-24 bg-zinc-800 border-zinc-700" />
        <Select value={cycle} onValueChange={(v) => v && setCycle(v)}>
          <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">月付</SelectItem>
            <SelectItem value="yearly">年付</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={addSub} size="sm" disabled={!name || !amount} className="shrink-0">
          <Plus size={14} className="mr-1" />添加
        </Button>
      </div>

      <div className="space-y-1">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded text-sm hover:bg-zinc-900/50">
            <span>{s.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{s.cycle === "monthly" ? "月付" : "年付"}</span>
              <span className="text-amber-400">¥{s.amount}</span>
              <button onClick={() => deleteSub(s.id)} className="text-zinc-600 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KptReview() {
  const [type, setType] = useState<"weekly" | "monthly">("weekly");
  const [periodStart, setPeriodStart] = useState(getMonday());
  const [keep, setKeep] = useState("");
  const [problem, setProblem] = useState("");
  const [tryText, setTryText] = useState("");
  const [reviews, setReviews] = useState<{ type: string; period_start: string; keep_text: string; problem_text: string; try_text: string }[]>([]);

  const fetchReviews = useCallback(async () => {
    const r = await fetch(`/api/reviews?type=${type}`);
    setReviews(await r.json());
  }, [type]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const saveReview = async () => {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, period_start: periodStart, keep_text: keep, problem_text: problem, try_text: tryText }),
    });
    toast("回顾已保存");
    fetchReviews();
  };

  const loadReview = (r: typeof reviews[0]) => {
    setPeriodStart(r.period_start);
    setKeep(r.keep_text);
    setProblem(r.problem_text);
    setTryText(r.try_text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={type} onValueChange={(v) => v && setType(v as "weekly" | "monthly")}>
          <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">本周</SelectItem>
            <SelectItem value="monthly">本月</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="w-40 bg-zinc-800 border-zinc-700 text-sm"
        />
        <Button onClick={saveReview} size="sm">
          <Save size={14} className="mr-1" />保存
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { key: "keep", label: "Keep 继续保持", value: keep, setter: setKeep, placeholder: "这周/月做对了什么？哪些要继续？", color: "border-emerald-500/50" },
          { key: "problem", label: "Problem 问题", value: problem, setter: setProblem, placeholder: "遇到了什么障碍？哪里不顺？", color: "border-amber-500/50" },
          { key: "try", label: "Try 尝试", value: tryText, setter: setTryText, placeholder: "下周/月想尝试什么新做法？", color: "border-violet-500/50" },
        ].map(({ key, label, value, setter, placeholder, color }) => (
          <Card key={key} className={`border-zinc-800 bg-zinc-900/50 border-l-2 ${color}`}>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium">{label}</h3>
              <textarea
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-zinc-600"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History */}
      <div className="space-y-1">
        <h3 className="text-xs text-zinc-500 font-medium mb-2">历史回顾</h3>
        {reviews.map((r, i) => (
          <button
            key={i}
            onClick={() => loadReview(r)}
            className="w-full text-left p-2 rounded hover:bg-zinc-800/50 text-xs text-zinc-400 flex items-center gap-3"
          >
            <span>{r.period_start}</span>
            <span className="text-zinc-600 truncate">{(r.keep_text + r.problem_text).slice(0, 40)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split("T")[0];
}

function cn(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
