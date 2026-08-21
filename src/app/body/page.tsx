"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";
import { GoalBoard } from "@/components/goal-board";

export default function BodyPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10">
          <Heart size={24} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">身体</h1>
          <p className="text-base text-muted-foreground">目标与优化建议 · 记录交给工作台 / 每日习惯</p>
        </div>
      </div>

      <GoalBoard
        tag="body-goal"
        title="身体目标 / 优化建议"
        placeholder="体重 / 睡眠 / 运动相关目标，或想保持的习惯…"
        accent="text-emerald-400"
      />

      <Card className="border-border bg-card rounded-xl border-dashed">
        <CardContent className="p-5 flex items-center gap-3 text-muted-foreground">
          <Sparkles size={18} className="shrink-0 text-emerald-400" />
          <p className="text-base">未来：Daily 每周分析将在这里自动生成身体维度的优化建议。</p>
        </CardContent>
      </Card>
    </div>
  );
}
