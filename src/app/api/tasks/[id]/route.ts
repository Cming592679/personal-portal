import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, description, status, priority, due_date } = await req.json();
  const db = getDb();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (title !== undefined) { updates.push("title = ?"); values.push(title); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (priority !== undefined) { updates.push("priority = ?"); values.push(priority); }
  if (due_date !== undefined) { updates.push("due_date = ?"); values.push(due_date); }

  if (updates.length === 0) {
    return NextResponse.json({ error: "no fields" }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
