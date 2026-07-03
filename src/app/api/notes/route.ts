import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const notes = db.prepare("SELECT id, title, content, created_at FROM notes ORDER BY updated_at DESC LIMIT 30").all();
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const { title, content, tags } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  db.prepare(
    "INSERT INTO notes (title, content, tags, updated_at) VALUES (?, ?, ?, datetime('now','localtime'))"
  ).run(title, content ?? "", tags ?? "");

  return NextResponse.json({ ok: true }, { status: 201 });
}
