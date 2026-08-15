"use client";

import { useState, useEffect } from "react";
import { ReviewCalendar } from "@/components/review-calendar";
import { energyMeta } from "@/lib/energy";
import { CalendarDays } from "lucide-react";

interface Overview {
  month: string;
  activityByDay: Record<string, number>;
  taskDoneByDay: Record<string, number>;
  energyByDay: Record<string, number>;
  todayActivityCount: number;
  weekActivityCount: number;
  weekTaskDoneCount: number;
  todayEnergy: number | null;
}

export default function ReviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!data) return <div className="flex items-center justify-center h-full text-muted-foreground">加载中...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-semantic-blue/10"><CalendarDays size={24} className="text-semantic-blue" /></div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">回顾</h1>
          <p className="text-base text-muted-foreground">从过去发生的事里，看到自己做了什么。</p>
        </div>
      </div>

      {/* 简洁统计 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "本周 Activity", value: data.weekActivityCount, unit: "条", color: "border-l-semantic-blue" },
          { label: "本周完成任务", value: data.weekTaskDoneCount, unit: "个", color: "border-l-semantic-green" },
          { label: "今日心力", value: data.todayEnergy ? energyMeta(data.todayEnergy).label : "—", unit: "", color: data.todayEnergy ? "border-l-transparent" : "border-l-semantic-muted" },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className={`text-center p-4 rounded-xl bg-card border border-border border-l-[3px] ${color}`}>
            <p className="text-3xl font-semibold text-foreground font-mono tabular-nums">
              {value}<span className="text-base text-muted-foreground ml-0.5">{unit}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 日历热力 */}
      <ReviewCalendar data={data} />
    </div>
  );
}
