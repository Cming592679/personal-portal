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
        <div className="p-2.5 rounded-xl bg-amber-500/10"><Briefcase size={22} className="text-amber-400" /></div>
        <h1 className="text-xl font-medium text-zinc-200">职业</h1>
      </div>

      <Tabs defaultValue="goals">
        <TabsList className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-1">
          <TabsTrigger value="goals" className="text-sm rounded-lg">目标方向</TabsTrigger>
          <TabsTrigger value="notes" className="text-sm rounded-lg">思考笔记</TabsTrigger>
          <TabsTrigger value="research" className="text-sm rounded-lg">调研学习</TabsTrigger>
          <TabsTrigger value="experiments" className="text-sm rounded-lg">尝试实践</TabsTrigger>
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

  const fetch = useCallback(async () => { const r = await fetch("/api/notes?tag=career-goal"); setItems(await r.json()); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-goal" }) });
    setTitle(""); setContent(""); toast("已保存"); fetch();
  };
  const remove = async (id: number) => { await fetch(`/api/notes?id=${id}`, { method: "DELETE" }); fetch(); };

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="目标/里程碑..."
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="具体描述、时间节点、衡量标准..." rows={3}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-500" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-sm"><Plus size={16} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl hover:bg-zinc-800/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-amber-400" />
                    <h3 className="text-sm font-medium text-zinc-200">{item.title}</h3>
                  </div>
                  {item.content && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{item.content}</p>}
                </div>
                <button onClick={() => remove(item.id)} className="text-zinc-500 hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
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

  const fetch = useCallback(async () => { const r = await fetch("/api/notes?tag=career-note"); setNotes(await r.json()); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-note" }) });
    setTitle(""); setContent(""); toast("已保存"); fetch();
  };

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="想法/灵感..."
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="展开写..." rows={4}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-500" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-sm"><Plus size={16} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {notes.map((n) => (
          <Card key={n.id} className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={16} className="text-amber-400" />
                <h3 className="text-sm font-medium text-zinc-200">{n.title}</h3>
              </div>
              {n.content && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{n.content}</p>}
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

  const fetch = useCallback(async () => { const r = await fetch("/api/notes?tag=career-research"); setItems(await r.json()); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-research" }) });
    setTitle(""); setContent(""); toast("已保存"); fetch();
  };

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="调研主题..."
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="关键发现、参考链接、待验证假设..." rows={4}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-500" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-sm"><Plus size={16} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-violet-400" />
                <h3 className="text-sm font-medium text-zinc-200">{item.title}</h3>
              </div>
              {item.content && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{item.content}</p>}
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

  const fetch = useCallback(async () => { const r = await fetch("/api/notes?tag=career-experiment"); setItems(await r.json()); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: "career-experiment" }) });
    setTitle(""); setContent(""); toast("已保存"); fetch();
  };

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="尝试/实验..."
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="做了什么、结果如何、学到了什么..." rows={4}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-500" />
          <Button onClick={save} disabled={!title.trim()} size="sm" className="rounded-xl text-sm"><Plus size={16} className="mr-1" />保存</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical size={16} className="text-emerald-400" />
                <h3 className="text-sm font-medium text-zinc-200">{item.title}</h3>
              </div>
              {item.content && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{item.content}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
