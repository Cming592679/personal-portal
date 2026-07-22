"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Briefcase, Target, Lightbulb, FlaskConical, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CareerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10"><Briefcase size={24} className="text-amber-400" /></div>
        <h1 className="text-2xl font-medium text-foreground">职业</h1>
      </div>

      <Tabs defaultValue="goals">
        <TabsList className="bg-muted border border-border rounded-xl p-1">
          <TabsTrigger value="goals" className="text-base rounded-lg">目标方向</TabsTrigger>
          <TabsTrigger value="notes" className="text-base rounded-lg">思考笔记</TabsTrigger>
          <TabsTrigger value="research" className="text-base rounded-lg">调研学习</TabsTrigger>
          <TabsTrigger value="experiments" className="text-base rounded-lg">尝试实践</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-4"><GoalsPanel /></TabsContent>
        <TabsContent value="notes" className="mt-4"><CareerNotes /></TabsContent>
        <TabsContent value="research" className="mt-4"><ResearchPanel /></TabsContent>
        <TabsContent value="experiments" className="mt-4"><ExperimentsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function GoalsPanel() {
  const [items, setItems] = useState<{ id: number; title: string; content: string; created_at: string }[]>([]);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");

  const fetchItems = useCallback(async () => { const r = await fetch("/api/notes?tag=career-goal"); setItems(await r.json()); }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-goal" }) });
    setTitle(""); setContent(""); toast("已保存"); fetchItems();
  };
  const remove = async (id: number) => { await fetch(`/api/notes?id=${id}`, { method: "DELETE" }); fetchItems(); };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="目标/里程碑..."
            className="bg-muted border-border rounded-xl text-base" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="具体描述、时间节点、衡量标准..." rows={3}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-base"><Plus size={18} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-border bg-card rounded-xl hover:bg-muted/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-amber-400" />
                    <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                  </div>
                  {item.content && <p className="text-base text-muted-foreground whitespace-pre-wrap">{item.content}</p>}
                </div>
                <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-red-400 shrink-0"><Trash2 size={16} /></button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CareerNotes() {
  const [notes, setNotes] = useState<{ id: number; title: string; content: string }[]>([]);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");

  const fetchNotes = useCallback(async () => { const r = await fetch("/api/notes?tag=career-note"); setNotes(await r.json()); }, []);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-note" }) });
    setTitle(""); setContent(""); toast("已保存"); fetchNotes();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="想法/灵感..."
            className="bg-muted border-border rounded-xl text-base" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="展开写..." rows={4}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-base"><Plus size={18} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {notes.map((n) => (
          <Card key={n.id} className="border-border bg-card rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={18} className="text-amber-400" />
                <h3 className="text-base font-medium text-foreground">{n.title}</h3>
              </div>
              {n.content && <p className="text-base text-muted-foreground whitespace-pre-wrap">{n.content}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResearchPanel() {
  const [items, setItems] = useState<{ id: number; title: string; content: string }[]>([]);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");

  const fetchItems = useCallback(async () => { const r = await fetch("/api/notes?tag=career-research"); setItems(await r.json()); }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-research" }) });
    setTitle(""); setContent(""); toast("已保存"); fetchItems();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="调研主题..."
            className="bg-muted border-border rounded-xl text-base" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="关键发现、参考链接、待验证假设..." rows={4}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-base"><Plus size={18} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-border bg-card rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target size={18} className="text-violet-400" />
                <h3 className="text-base font-medium text-foreground">{item.title}</h3>
              </div>
              {item.content && <p className="text-base text-muted-foreground whitespace-pre-wrap">{item.content}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ExperimentsPanel() {
  const [items, setItems] = useState<{ id: number; title: string; content: string }[]>([]);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");

  const fetchItems = useCallback(async () => { const r = await fetch("/api/notes?tag=career-experiment"); setItems(await r.json()); }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-experiment" }) });
    setTitle(""); setContent(""); toast("已保存"); fetchItems();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="尝试/实验..."
            className="bg-muted border-border rounded-xl text-base" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="做了什么、结果如何、学到了什么..." rows={4}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-base"><Plus size={18} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-border bg-card rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical size={18} className="text-emerald-400" />
                <h3 className="text-base font-medium text-foreground">{item.title}</h3>
              </div>
              {item.content && <p className="text-base text-muted-foreground whitespace-pre-wrap">{item.content}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
