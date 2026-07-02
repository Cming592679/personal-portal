import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function SpiritPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-rose-400" />
        <h1 className="text-lg font-medium">精神</h1>
      </div>
      <p className="text-sm text-zinc-500">联系人、社交日志 — 即将在 Phase 3 实现。</p>
    </div>
  );
}
