import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const tag = req.nextUrl.searchParams.get("tag");
  let notes;
  if (tag) {
    notes = db.prepare("SELECT id, title, content, created_at FROM notes WHERE tags = ? ORDER BY updated_at DESC LIMIT 50").all(tag);
  } else {
    notes = db.prepare("SELECT id, title, content, created_at FROM notes ORDER BY updated_at DESC LIMIT 30").all();
  }
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

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM notes WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
