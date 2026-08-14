import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const date = req.nextUrl.searchParams.get("date");
  let rows;
  if (date) {
    rows = db.prepare(
      "SELECT id, content, task_id, created_at FROM activity_logs WHERE date(created_at) = ? ORDER BY created_at DESC, id DESC"
    ).all(date);
  } else {
    rows = db.prepare(
      "SELECT id, content, task_id, created_at FROM activity_logs ORDER BY created_at DESC, id DESC LIMIT 200"
    ).all();
  }
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(
    "INSERT INTO activity_logs (content) VALUES (?)"
  ).run(String(content).trim());

  const row = db.prepare(
    "SELECT id, content, task_id, created_at FROM activity_logs WHERE id = ?"
  ).get(result.lastInsertRowid);

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM activity_logs WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
