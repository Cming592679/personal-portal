import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, description, quadrant, status, priority, due_date } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO tasks (title, description, quadrant, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(title, description ?? "", quadrant ?? "career", status ?? "todo", priority ?? "medium", due_date ?? null);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}
