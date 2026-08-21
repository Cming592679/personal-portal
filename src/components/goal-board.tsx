"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Target, Trash2 } from "lucide-react";

interface GoalItem { id: number; title: string; content: string; created_at: string; }

/** 目标 / 优化建议面板：基于 notes（tag 区分维度），支持新增与删除。 */
export function GoalBoard({
  tag, title, placeholder, accent = "text-emerald-400",
}: {
  tag: string;
  title: string;
  placeholder: string;
  accent?: string;
}) {
  const [items, setItems] = useState<GoalItem[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [content, setContent] = useState("");

  const reload = useCallback(async () => {
    const r = await fetch(`/api/notes?tag=${tag}`);
    setItems(await r.json());
  }, [tag]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notes?tag=${tag}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setItems(data as GoalItem[]); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tag]);

  const save = async () => {
    if (!goalTitle.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: goalTitle.trim(), content, tags: tag }),
    });
    setGoalTitle("");
    setContent("");
    toast("已保存");
    reload();
  };

  const remove = async (id: number) => {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-lg font-medium text-foreground/90 flex items-center gap-2">
          <Target size={20} className={accent} />{title}
        </h2>
        <div className="space-y-3">
          <Input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="目标 / 提醒…"
            className="bg-muted border-border rounded-xl text-base"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={save} disabled={!goalTitle.trim()} size="sm" className="rounded-xl text-base">
            <Plus size={18} className="mr-1" />保存
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="p-3 rounded-xl bg-muted/80 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-base font-medium text-foreground">{item.title}</p>
                {item.content && (
                  <p className="text-base text-muted-foreground whitespace-pre-wrap break-words">{item.content}</p>
                )}
              </div>
              <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-danger shrink-0 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-base text-muted-foreground/60 py-3 text-center">还没有目标，先写一个？</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
