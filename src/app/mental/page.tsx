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
        <div className="p-2.5 rounded-xl bg-violet-500/10"><Brain size={22} className="text-violet-400" /></div>
        <h1 className="text-xl font-medium text-zinc-200">心智</h1>
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
    const colors: Record<string, string> = { concept: "bg-violet-500/10 text-violet-400", entity: "bg-amber-500/10 text-amber-400", source: "bg-zinc-500/10 text-zinc-400", synthesis: "bg-emerald-500/10 text-emerald-400" };
    return colors[type] ?? "bg-zinc-500/10 text-zinc-400";
  };

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-base font-medium text-zinc-300 flex items-center gap-2"><Search size={18} />知识库搜索</h2>
        <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索概念、实体、来源..."
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <Button type="submit" size="sm" className="shrink-0 rounded-xl text-sm">搜索</Button>
        </form>
        <div className="space-y-2 max-h-96 overflow-auto">
          {results.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-zinc-200">{r.title}</span>
                <Badge className={cn("text-[10px]", typeBadge(r.type))}>{r.type}</Badge>
                {r.status === "uncertain" && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">uncertain</Badge>}
              </div>
              <p className="text-sm text-zinc-400">{r.summary}</p>
              {r.aliases && r.aliases !== "-" && <p className="text-xs text-zinc-500 mt-1">别名: {r.aliases}</p>}
            </div>
          ))}
          {results.length === 0 && <p className="text-sm text-zinc-500 py-4 text-center">无结果</p>}
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
    <Card className="border-zinc-800/50 bg-zinc-900/60 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-base font-medium text-zinc-300">快速笔记</h2>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题"
            className="bg-zinc-800/50 border-zinc-700/50 rounded-xl text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="内容..." rows={3}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-zinc-500" />
          <Button onClick={saveNote} disabled={!title.trim()} size="sm" className="rounded-xl text-sm"><Plus size={16} className="mr-1" />保存</Button>
        </div>
        <div className="space-y-1 max-h-48 overflow-auto">
          {notes.slice(0, 15).map((n) => (
            <div key={n.id} className="p-2.5 rounded-lg hover:bg-zinc-800/40 text-sm">
              <p className="text-zinc-200">{n.title}</p>
              <p className="text-zinc-500 mt-0.5 line-clamp-1">{n.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
