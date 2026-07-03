"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Habit {
  id: number;
  name: string;
  quadrant: string;
  frequency: string;
  today_value: number | null;
}

interface ExerciseLog {
  id: number;
  date: string;
  type: string;
  duration_min: number;
  note: string;
}

interface EnergyLog {
  date: string;
  level: number;
  note: string;
}

const EXERCISE_TYPES = ["散步", "跑步", "羽毛球", "游泳", "力量训练", "攀岩", "骑行", "爬楼", "其他"];

export default function BodyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Heart size={18} className="text-emerald-400" />
        <h1 className="text-lg font-medium">身体</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitTracker />
        <ExerciseLogger />
      </div>
      <EnergyHistory />
    </div>
  );
}

function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const fetchHabits = useCallback(async () => {
    const r = await fetch("/api/habits");
    const all = await r.json();
    setHabits(all.filter((h: Habit) => h.quadrant === "body"));
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
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-medium">今日习惯</h2>
        <div className="space-y-1">
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              className={cn(
                "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors",
                h.today_value
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700"
              )}
            >
              <span className="text-sm">{h.name}</span>
              {h.today_value ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <span className="text-[10px] text-zinc-600">点击打卡</span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseLogger() {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [type, setType] = useState("力量训练");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  const fetchLogs = useCallback(async () => {
    const r = await fetch("/api/exercise");
    setLogs(await r.json());
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async () => {
    if (!type) return;
    await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, duration_min: parseInt(duration) || 0, note }),
    });
    setDuration("");
    setNote("");
    toast("运动已记录");
    fetchLogs();
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-medium">运动记录</h2>

        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXERCISE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="分钟"
            className="w-20 bg-zinc-800 border-zinc-700"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注"
            className="flex-1 bg-zinc-800 border-zinc-700"
          />
          <Button onClick={addLog} size="sm" className="shrink-0">
            <Plus size={14} className="mr-1" />记录
          </Button>
        </div>

        <div className="space-y-1 max-h-64 overflow-auto">
          {logs.slice(0, 20).map((l) => (
            <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-zinc-900/50">
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

function EnergyHistory() {
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);

  useEffect(() => {
    fetch("/api/energy/logs")
      .then((r) => r.json())
      .then(setEnergyLogs);
  }, []);

  if (energyLogs.length === 0) return null;

  const emojis = ["", "🔴", "🟡", "🟢", "💚", "💚"];

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-medium">心力趋势</h2>
        <div className="flex gap-2 flex-wrap">
          {energyLogs.slice(0, 30).map((e) => (
            <div
              key={e.date}
              className="text-center px-2 py-1 rounded bg-zinc-800/50"
              title={`${e.date}: level ${e.level}`}
            >
              <div className="text-lg">{emojis[e.level]}</div>
              <div className="text-[9px] text-zinc-600">{e.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
