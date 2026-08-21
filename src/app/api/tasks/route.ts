import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const completedDate = req.nextUrl.searchParams.get("completed_date");
  if (completedDate) {
    const doneRows = db
      .prepare("SELECT * FROM tasks WHERE status = 'done' AND date(completed_at) = ? ORDER BY completed_at DESC")
      .all(completedDate);
    return NextResponse.json(doneRows);
  }
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC").all();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, description, quadrant, status, priority, due_date } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const result = db
    .prepare(
      "INSERT INTO tasks (title, description, quadrant, status, priority, due_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(title, description ?? "", quadrant ?? "career", status ?? "todo", priority ?? "medium", due_date ?? null, now);

  const taskId = result.lastInsertRowid;
  // 记录创建日志
  db.prepare("INSERT INTO task_logs (task_id, task_title, action, new_value) VALUES (?, ?, 'created', ?)")
    .run(taskId, title, status ?? "todo");

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  return NextResponse.json(task, { status: 201 });
}
