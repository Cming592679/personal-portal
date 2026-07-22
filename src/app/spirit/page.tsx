"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact { id: number; name: string; tags: string; birthday: string | null; last_contact: string | null; notes: string; }
interface ContactLog { id: number; contact_id: number; date: string; summary: string; }

export default function SpiritPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState(""); const [tags, setTags] = useState("");

  const fetchContacts = useCallback(async () => { const r = await fetch("/api/contacts"); setContacts(await r.json()); }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const addContact = async () => {
    if (!name.trim()) return;
    await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, tags }) });
    setName(""); setTags(""); toast("联系人已添加"); fetchContacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-500/10"><Users size={24} className="text-rose-400" /></div>
        <h1 className="text-2xl font-medium text-foreground">精神</h1>
      </div>

      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名"
              className="w-36 bg-muted border-border rounded-xl text-base" />
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签 (如: 家人, 朋友)"
              className="flex-1 bg-muted border-border rounded-xl text-base" />
            <Button onClick={addContact} size="sm" disabled={!name.trim()} className="shrink-0 rounded-xl text-base">
              <Plus size={18} className="mr-1" />添加
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {contacts.map((c) => <ContactCard key={c.id} contact={c} onUpdate={fetchContacts} />)}
        {contacts.length === 0 && <p className="text-base text-muted-foreground text-center py-8">还没有联系人</p>}
      </div>
    </div>
  );
}

function ContactCard({ contact, onUpdate }: { contact: Contact; onUpdate: () => void }) {
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [summary, setSummary] = useState(""); const [open, setOpen] = useState(false);

  const fetchLogs = useCallback(async () => { const r = await fetch(`/api/contacts/${contact.id}/logs`); setLogs(await r.json()); }, [contact.id]);

  const addLog = async () => {
    if (!summary.trim()) return;
    await fetch(`/api/contacts/${contact.id}/logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary }) });
    setSummary(""); toast("联系记录已保存"); fetchLogs(); onUpdate();
  };

  const daysSince = contact.last_contact ? Math.floor((Date.now() - new Date(contact.last_contact).getTime()) / 86400000) : 999;

  return (
    <Card className="border-border bg-card rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-medium text-foreground">{contact.name}</span>
            {contact.tags && <div className="flex gap-1">{contact.tags.split(",").map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t.trim()}</Badge>)}</div>}
            {contact.last_contact && (
              <span className={cn("text-sm", daysSince > 30 ? "text-amber-400" : "text-muted-foreground")}>{daysSince}天前联系</span>
            )}
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchLogs(); }}>
            <DialogTrigger className="inline-flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-xl transition-colors">
              <MessageCircle size={18} />联系记录
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-border max-w-md rounded-xl">
              <DialogHeader><DialogTitle className="text-lg text-foreground">{contact.name} · 联系记录</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="这次聊了什么..."
                    className="bg-muted border-border rounded-xl text-base" onKeyDown={(e) => e.key === "Enter" && addLog()} />
                  <Button onClick={addLog} size="sm" disabled={!summary.trim()} className="rounded-xl text-base">保存</Button>
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {logs.map((l) => (
                    <div key={l.id} className="text-base p-2.5 rounded-lg bg-muted/80">
                      <span className="text-muted-foreground">{l.date}</span>
                      <p className="text-foreground/90 mt-0.5">{l.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
