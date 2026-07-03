"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Search, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WikiResult {
  title: string;
  type: string;
  aliases: string;
  summary: string;
  related: string;
  status: string;
}

export default function MentalPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-violet-400" />
        <h1 className="text-lg font-medium">心智</h1>
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
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    setSearching(true);
    const r = await fetch(`/api/wiki?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    setResults(data.results ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    search("");
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      concept: "bg-violet-500/10 text-violet-400",
      entity: "bg-amber-500/10 text-amber-400",
      source: "bg-zinc-500/10 text-zinc-400",
      synthesis: "bg-emerald-500/10 text-emerald-400",
    };
    return colors[type] ?? "bg-zinc-500/10 text-zinc-400";
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Search size={14} />
          知识库搜索
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索概念、实体、来源..."
            className="bg-zinc-800 border-zinc-700"
          />
          <Button type="submit" size="sm" className="shrink-0" disabled={searching}>
            搜索
          </Button>
        </form>

        <div className="space-y-2 max-h-96 overflow-auto">
          {results.map((r, i) => (
            <div key={i} className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{r.title}</span>
                <Badge className={cn("text-[10px]", typeBadge(r.type))}>{r.type}</Badge>
                {r.status === "uncertain" && (
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">uncertain</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">{r.summary}</p>
              {r.aliases && r.aliases !== "-" && (
                <p className="text-[10px] text-zinc-600 mt-1">别名: {r.aliases}</p>
              )}
            </div>
          ))}
          {results.length === 0 && (
            <p className="text-xs text-zinc-600 py-4 text-center">无结果 — 试试其他关键词</p>
          )}
        </div>

        <div className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-3">
          数据来自 <code className="text-zinc-500">wiki/index.md</code> · 在 Obsidian 中打开获得完整链接跳转
        </div>
      </CardContent>
    </Card>
  );
}

function QuickNotes() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState<{ id: number; title: string; content: string; created_at: string }[]>([]);

  const fetchNotes = useCallback(async () => {
    const r = await fetch("/api/notes");
    setNotes(await r.json());
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const saveNote = async () => {
    if (!title.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setTitle("");
    setContent("");
    toast("笔记已保存");
    fetchNotes();
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-sm font-medium">快速笔记</h2>

        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="bg-zinc-800 border-zinc-700"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="内容..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-zinc-600"
          />
          <Button onClick={saveNote} disabled={!title.trim()} size="sm">
            <Plus size={14} className="mr-1" />保存
          </Button>
        </div>

        <div className="space-y-1 max-h-48 overflow-auto">
          {notes.slice(0, 15).map((n) => (
            <div key={n.id} className="p-2 rounded hover:bg-zinc-800/50">
              <p className="text-sm">{n.title}</p>
              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{n.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
