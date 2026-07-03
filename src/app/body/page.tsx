"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Plus, Scale, Moon, Dumbbell, BookOpen, Apple, Sunrise, Sunset, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Habit {
  id: number;
  name: string;
  quadrant: string;
  frequency: string;
  today_value: number | null;
}

const HABIT_META: Record<string, { icon: typeof Heart; desc: string; color: string }> = {
  "运动":   { icon: Dumbbell,  desc: "至少 20 分钟",       color: "text-emerald-400" },
  "阅读":   { icon: BookOpen,  desc: "读几页也好",          color: "text-violet-400" },
  "健康饮食": { icon: Apple,    desc: "控糖 · 少加工",       color: "text-rose-400" },
  "早睡":   { icon: Moon,      desc: "23:00 前躺下",        color: "text-indigo-400" },
  "早起":   { icon: Sunrise,   desc: "7:00 前起床",         color: "text-amber-400" },
  "冥想":   { icon: Sparkles,  desc: "10 分钟静坐",         color: "text-cyan-400" },
};

export default function BodyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Heart size={18} className="text-emerald-400" />
        </div>
        <h1 className="text-lg font-medium">身体</h1>
      </div>

      <HabitCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExerciseLogger />
        <BodyMetrics />
      </div>
      <EnergyHistory />
    </div>
  );
}

function HabitCards() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const fetchHabits = useCallback(async () => {
    const r = await fetch("/api/habits");
    const all = await r.json();
    setHabits(all.filter((h: Habit) => h.quadrant === "body" || h.quadrant === "mental"));
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const toggleHabit = async (id: number) => {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: id }),
    });
    fetchHabits();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {habits.map((h) => {
        const meta = HABIT_META[h.name] ?? { icon: Heart, desc: "", color: "text-zinc-400" };
        const Icon = meta.icon;
        const done = !!h.today_value;
        return (
          <Card
            key={h.id}
            className={cn(
              "border transition-all duration-200 cursor-pointer select-none rounded-2xl",
              done
                ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/5"
                : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 hover:bg-zinc-900/60"
            )}
            onClick={() => toggleHabit(h.id)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={cn("p-2.5 rounded-xl", done ? "bg-emerald-500/10" : "bg-zinc-800/50")}>
                <Icon size={20} className={done ? "text-emerald-400" : "text-zinc-500"} />
              </div>
              <div>
                <p className={cn("text-sm font-medium", done ? "text-emerald-300" : "text-zinc-300")}>{h.name}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{meta.desc}</p>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative mt-1",
                  done ? "bg-emerald-500/40" : "bg-zinc-700/50"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    done ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ExerciseLogger() {
  const [logs, setLogs] = useState<{ id: number; date: string; type: string; duration_min: number; note: string }[]>([]);
  const [type, setType] = useState("力量训练");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  const fetchLogs = useCallback(async () => {
    const r = await fetch("/api/exercise");
    setLogs(await r.json());
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async () => {
    await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, duration_min: parseInt(duration) || 0, note }),
    });
    setDuration(""); setNote("");
    toast("运动已记录");
    fetchLogs();
  };

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40 rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">运动记录</h2>
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className="w-28 bg-zinc-800/50 border-zinc-700/50 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["散步","跑步","羽毛球","游泳","力量训练","攀岩","骑行","爬楼"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="分钟"
            className="w-20 bg-zinc-800/50 border-zinc-700/50 rounded-xl" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注"
            className="flex-1 bg-zinc-800/50 border-zinc-700/50 rounded-xl" />
          <Button onClick={addLog} size="sm" className="shrink-0 rounded-xl"><Plus size={14} className="mr-1" />记录</Button>
        </div>
        <div className="space-y-1 max-h-48 overflow-auto">
          {logs.slice(0, 15).map((l) => (
            <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg text-sm hover:bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{l.date.slice(5)}</span>
                <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                {l.duration_min > 0 && <span className="text-xs text-zinc-500">{l.duration_min}分钟</span>}
                <span className="text-xs text-zinc-600">{l.note}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BodyMetrics() {
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [metrics, setMetrics] = useState<{ date: string; weight: number | null; sleep_hours: number | null }[]>([]);

  const fetchMetrics = useCallback(async () => {
    const r = await fetch("/api/metrics");
    setMetrics(await r.json());
  }, []);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const save = async () => {
    await fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: weight ? parseFloat(weight) : null, sleep_hours: sleep ? parseFloat(sleep) : null }) });
    setWeight(""); setSleep(""); toast("已记录"); fetchMetrics();
  };

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40 rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">身体数据</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 flex items-center gap-1 mb-1.5"><Scale size={11} />体重 kg</label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="bg-zinc-800/50 border-zinc-700/50 rounded-xl" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 flex items-center gap-1 mb-1.5"><Moon size={11} />睡眠 h</label>
            <Input type="number" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" className="bg-zinc-800/50 border-zinc-700/50 rounded-xl" />
          </div>
          <Button onClick={save} size="sm" className="shrink-0 rounded-xl"><Plus size={14} className="mr-1" />记录</Button>
        </div>
        {metrics.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-auto">
            {metrics.slice(0, 10).map((m) => (
              <div key={m.date} className="flex items-center gap-4 text-xs px-2 py-1 text-zinc-400">
                <span className="text-zinc-500 w-16">{m.date.slice(5)}</span>
                {m.weight && <span>{m.weight}kg</span>}
                {m.sleep_hours && <span>{m.sleep_hours}h</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EnergyHistory() {
  const [logs, setLogs] = useState<{ date: string; level: number }[]>([]);
  useEffect(() => { fetch("/api/energy/logs").then(r => r.json()).then(setLogs); }, []);
  if (logs.length === 0) return null;
  const emojis = ["", "🔴", "🟡", "🟢"];
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40 rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">心力趋势</h2>
        <div className="flex gap-2 flex-wrap">
          {logs.slice(0, 30).map((e) => (
            <div key={e.date} className="text-center px-2 py-1 rounded-lg bg-zinc-800/40" title={`${e.date}: ${emojis[e.level]}`}>
              <div className="text-base">{emojis[e.level]}</div>
              <div className="text-[9px] text-zinc-600">{e.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
