"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Settings, Download } from "lucide-react";

export default function SettingsPage() {
  const [budget, setBudget] = useState("8000");
  const [exporting, setExporting] = useState(false);

  const saveBudget = () => { localStorage.setItem("monthlyBudget", budget); toast("预算已保存"); };

  const doExport = async () => {
    setExporting(true);
    const r = await fetch("/api/export"); const data = await r.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `portal-export-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url); toast("数据已导出"); setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-zinc-500/10"><Settings size={22} className="text-zinc-400" /></div>
        <h1 className="text-xl font-medium text-zinc-200">设置</h1>
      </div>

      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-base font-medium text-zinc-300">月度预算</h2>
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-zinc-400">每月支出上限</label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-36 bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm mt-1.5" />
            </div>
            <Button onClick={saveBudget} size="sm" className="rounded-xl text-sm">保存</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-base font-medium text-zinc-300">数据导出</h2>
          <p className="text-sm text-zinc-400">导出所有数据为 JSON 文件，可用于备份或迁移。</p>
          <Button onClick={doExport} disabled={exporting} variant="outline" size="sm" className="rounded-xl text-sm">
            <Download size={16} className="mr-1" />{exporting ? "导出中..." : "导出 JSON"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
