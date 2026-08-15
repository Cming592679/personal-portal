"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { energyMeta } from "@/lib/energy";

interface OverviewData {
  activityByDay: Record<string, number>;
  taskDoneByDay: Record<string, number>;
  energyByDay: Record<string, number>;
}

function localYMD(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function activityTint(count: number): string {
  if (!count) return "transparent";
  if (count === 1) return "rgba(88,166,255,0.14)";
  if (count <= 3) return "rgba(88,166,255,0.3)";
  if (count <= 6) return "rgba(88,166,255,0.46)";
  return "rgba(88,166,255,0.62)";
}

export function ReviewCalendar({ data }: { data: OverviewData }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const todayStr = localYMD(now);
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const [selected, setSelected] = useState<string | null>(null);
  const [activities, setActivities] = useState<{ id: number; content: string; created_at: string }[]>([]);

  const openDay = async (date: string) => {
    setSelected(date);
    const r = await fetch(`/api/activity?date=${date}`);
    setActivities(await r.json());
  };

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">{year}年{month + 1}月</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>少</span>
            {[0, 1, 3, 7].map((c) => <span key={c} className="w-3 h-3 rounded-sm" style={{ background: activityTint(c) }} />)}
            <span>多</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
            <div key={w} className="text-center text-xs text-muted-foreground py-1">{w}</div>
          ))}
          {days.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const ds = dateStr(d);
            const actCount = data.activityByDay[ds] ?? 0;
            const doneCount = data.taskDoneByDay[ds] ?? 0;
            const energy = data.energyByDay[ds];
            const isToday = ds === todayStr;
            return (
              <button
                key={ds}
                onClick={() => openDay(ds)}
                className={cn(
                  "aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-all hover:ring-1 hover:ring-white/25",
                  isToday && "ring-2 ring-semantic-blue/60"
                )}
                style={{ background: activityTint(actCount) }}
                title={`${ds} · ${actCount} 条记录`}
              >
                <span className={cn("text-sm leading-none", isToday ? "text-foreground font-semibold" : "text-foreground/80")}>{d}</span>
                {(energy !== undefined || doneCount > 0) && (
                  <span className="flex items-center gap-1 mt-0.5">
                    {energy !== undefined && <span className="w-1.5 h-1.5 rounded-full" style={{ background: energyMeta(energy).dot }} />}
                    {doneCount > 0 && <span className="text-[9px] text-muted-foreground">✓{doneCount}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <Card className="relative z-10 w-96 max-w-[90vw] max-h-[80vh] border-border bg-card rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">{selected}</h3>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{activities.length} 条记录</span>
                <span>完成 {data.taskDoneByDay[selected] ?? 0} 个任务</span>
                {data.energyByDay[selected] !== undefined && (
                  <span>心力 {energyMeta(data.energyByDay[selected]).label}</span>
                )}
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">当天没有记录</p>
              ) : (
                <div className="space-y-0.5">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 py-1">
                      <span className="text-xs text-muted-foreground font-mono pt-0.5 shrink-0">{a.created_at.slice(11, 16)}</span>
                      <span className="text-sm text-foreground whitespace-pre-wrap break-words">{a.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
