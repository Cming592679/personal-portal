"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WikiResult { title: string; type: string; aliases: string; summary: string; related: string; status: string; }

export default function MentalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10"><Brain size={24} className="text-violet-400" /></div>
        <h1 className="text-2xl font-medium text-foreground">心智</h1>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <WikiSearch />
        <QuickNotes />
      </div>
    </div>
  );
}

function WikiSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);

  const search = useCallback(async (q: string) => {
    const r = await fetch(`/api/wiki?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    setResults(data.results ?? []);
  }, []);

  useEffect(() => { search(""); }, [search]);

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = { concept: "bg-violet-500/10 text-violet-400", entity: "bg-amber-500/10 text-amber-400", source: "bg-zinc-500/10 text-muted-foreground", synthesis: "bg-emerald-500/10 text-emerald-400" };
    return colors[type] ?? "bg-zinc-500/10 text-muted-foreground";
  };

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-lg font-medium text-foreground/90 flex items-center gap-2"><Search size={20} />知识库搜索</h2>
        <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索概念、实体、来源..."
            className="bg-muted border-border rounded-xl text-base" />
          <Button type="submit" size="sm" className="shrink-0 rounded-xl text-base">搜索</Button>
        </form>
        <div className="space-y-2 max-h-96 overflow-auto">
          {results.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/80 hover:bg-[#1c2129] transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-medium text-foreground">{r.title}</span>
                <Badge className={cn("text-xs", typeBadge(r.type))}>{r.type}</Badge>
                {r.status === "uncertain" && <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">uncertain</Badge>}
              </div>
              <p className="text-base text-muted-foreground">{r.summary}</p>
              {r.aliases && r.aliases !== "-" && <p className="text-sm text-muted-foreground mt-1">别名: {r.aliases}</p>}
            </div>
          ))}
          {results.length === 0 && <p className="text-base text-muted-foreground py-4 text-center">无结果</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickNotes() {
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [notes, setNotes] = useState<{ id: number; title: string; content: string; created_at: string }[]>([]);

  const fetchNotes = useCallback(async () => { const r = await fetch("/api/notes"); setNotes(await r.json()); }, []);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const saveNote = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    setTitle(""); setContent(""); toast("笔记已保存"); fetchNotes();
  };

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-lg font-medium text-foreground/90">快速笔记</h2>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题"
            className="bg-muted border-border rounded-xl text-base" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="内容..." rows={3}
            className="w-full bg-muted border border-border rounded-xl p-3 text-base resize-none focus:outline-none focus:border-zinc-600 text-foreground placeholder:text-muted-foreground" />
          <Button onClick={saveNote} disabled={!title.trim()} size="sm" className="rounded-xl text-base"><Plus size={18} className="mr-1" />保存</Button>
        </div>
        <div className="space-y-1 max-h-48 overflow-auto">
          {notes.slice(0, 15).map((n) => (
            <div key={n.id} className="p-2.5 rounded-lg hover:bg-muted/80 text-base">
              <p className="text-foreground">{n.title}</p>
              <p className="text-muted-foreground mt-0.5 line-clamp-1">{n.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
