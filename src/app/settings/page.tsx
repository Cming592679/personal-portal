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

  const saveBudget = () => {
    localStorage.setItem("monthlyBudget", budget);
    toast("预算已保存");
  };

  const doExport = async () => {
    setExporting(true);
    const r = await fetch("/api/export");
    const data = await r.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portal-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("数据已导出");
    setExporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-zinc-400" />
        <h1 className="text-lg font-medium">设置</h1>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-sm font-medium">月度预算</h2>
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-[10px] text-zinc-500">每月支出上限</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-32 bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <Button onClick={saveBudget} size="sm">保存</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium">数据导出</h2>
          <p className="text-xs text-zinc-500">导出所有数据为 JSON 文件，可用于备份或迁移。</p>
          <Button onClick={doExport} disabled={exporting} variant="outline" size="sm">
            <Download size={14} className="mr-1" />
            {exporting ? "导出中..." : "导出 JSON"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
