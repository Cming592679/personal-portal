import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, status, priority, due_date, sort_order } = body;
  const db = getDb();

  // 查询旧值用于比较
  const oldTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!oldTask) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  // 构建 UPDATE SQL
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (title !== undefined) { updates.push("title = ?"); values.push(title); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (priority !== undefined) { updates.push("priority = ?"); values.push(priority); }
  if (due_date !== undefined) { updates.push("due_date = ?"); values.push(due_date); }
  if (sort_order !== undefined) { updates.push("sort_order = ?"); values.push(sort_order); }

  // 总是更新 updated_at
  updates.push("updated_at = ?");
  values.push(now);

  // 状态变为 done 时写入 completed_at
  if (status === "done" && oldTask.status !== "done") {
    updates.push("completed_at = ?");
    values.push(now);
  }

  // 状态从 done 改回非 done 时清除 completed_at
  if (status && status !== "done" && oldTask.status === "done") {
    updates.push("completed_at = NULL");
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "no fields" }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  // 写日志：状态变更
  if (status !== undefined && status !== oldTask.status) {
    const oldStatus = String(oldTask.status ?? "todo");
    db.prepare(
      "INSERT INTO task_logs (task_id, task_title, action, old_value, new_value, created_at) VALUES (?, ?, 'status_change', ?, ?, ?)"
    ).run(id, title ?? oldTask.title, oldStatus, status, now);
  }

  // 写日志：备注变更（只记录 description 的变化）
  if (description !== undefined && description !== (oldTask.description ?? "")) {
    const oldDesc = String(oldTask.description ?? "");
    const newDesc = String(description);
    // 有意义的备注变更才记录（空→空不记录）
    if (oldDesc !== newDesc) {
      const snippet = newDesc.length > 100 ? newDesc.slice(0, 100) + "..." : newDesc;
      db.prepare(
        "INSERT INTO task_logs (task_id, task_title, action, note, created_at) VALUES (?, ?, 'note_update', ?, ?)"
      ).run(id, title ?? oldTask.title, snippet || "（清空备注）", now);
    }
  }

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!task) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  // 删除前写日志
  db.prepare(
    "INSERT INTO task_logs (task_id, task_title, action, old_value, created_at) VALUES (?, ?, 'deleted', ?, ?)"
  ).run(id, task.title, String(task.status ?? "todo"), now);

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
