"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Plus, Scale, Moon } from "lucide-react";

export default function BodyPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10">
          <Heart size={22} className="text-emerald-400" />
        </div>
        <h1 className="text-xl font-medium text-zinc-200">身体</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExerciseLogger />
        <BodyMetrics />
      </div>
      <EnergyHistory />
    </div>
  );
}

function ExerciseLogger() {
  const [logs, setLogs] = useState<{ id: number; date: string; type: string; duration_min: number; note: string }[]>([]);
  const [type, setType] = useState("力量训练");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  const fetchLogs = useCallback(async () => { const r = await fetch("/api/exercise"); setLogs(await r.json()); }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async () => {
    await fetch("/api/exercise", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, duration_min: parseInt(duration) || 0, note }) });
    setDuration(""); setNote(""); toast("运动已记录"); fetchLogs();
  };

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-base font-medium text-zinc-300">运动记录</h2>
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className="w-28 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["散步","跑步","羽毛球","游泳","力量训练","攀岩","骑行","爬楼"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="分钟"
            className="w-20 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注"
            className="flex-1 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <Button onClick={addLog} size="sm" className="shrink-0 rounded-xl text-sm"><Plus size={16} className="mr-1" />记录</Button>
        </div>
        <div className="space-y-1 max-h-56 overflow-auto">
          {logs.slice(0, 15).map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 px-2 rounded-lg text-sm hover:bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">{l.date.slice(5)}</span>
                <Badge variant="outline" className="text-xs">{l.type}</Badge>
                {l.duration_min > 0 && <span className="text-zinc-400">{l.duration_min}分钟</span>}
                <span className="text-zinc-500">{l.note}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BodyMetrics() {
  const [weight, setWeight] = useState(""); const [sleep, setSleep] = useState("");
  const [metrics, setMetrics] = useState<{ date: string; weight: number | null; sleep_hours: number | null }[]>([]);

  const fetchMetrics = useCallback(async () => { const r = await fetch("/api/metrics"); setMetrics(await r.json()); }, []);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const save = async () => {
    await fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: weight ? parseFloat(weight) : null, sleep_hours: sleep ? parseFloat(sleep) : null }) });
    setWeight(""); setSleep(""); toast("已记录"); fetchMetrics();
  };

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-base font-medium text-zinc-300">身体数据</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5"><Scale size={12} />体重 kg</label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5"><Moon size={12} />睡眠 h</label>
            <Input type="number" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          </div>
          <Button onClick={save} size="sm" className="shrink-0 rounded-xl text-sm"><Plus size={16} className="mr-1" />记录</Button>
        </div>
        {metrics.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-auto">
            {metrics.slice(0, 10).map((m) => (
              <div key={m.date} className="flex items-center gap-4 text-sm px-2 py-1 text-zinc-300">
                <span className="text-zinc-400 w-16">{m.date.slice(5)}</span>
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
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-base font-medium text-zinc-300">心力趋势</h2>
        <div className="flex gap-2 flex-wrap">
          {logs.slice(0, 30).map((e) => (
            <div key={e.date} className="text-center px-3 py-1.5 rounded-lg bg-zinc-800/50" title={`${e.date}: ${emojis[e.level]}`}>
              <div className="text-xl">{emojis[e.level]}</div>
              <div className="text-[11px] text-zinc-400">{e.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
