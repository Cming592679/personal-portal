import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function BodyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Heart size={18} className="text-emerald-400" />
        <h1 className="text-lg font-medium">身体</h1>
      </div>
      <p className="text-sm text-zinc-500">习惯打卡、运动记录、心力日志 — 即将在 Phase 2 实现。</p>
    </div>
  );
}
