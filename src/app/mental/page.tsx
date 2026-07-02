import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function MentalPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-violet-400" />
        <h1 className="text-lg font-medium">心智</h1>
      </div>
      <p className="text-sm text-zinc-500">知识管理、外部观察、笔记 — 即将在 Phase 2 实现。</p>
    </div>
  );
}
