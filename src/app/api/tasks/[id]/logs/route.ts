import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const task = db.prepare("SELECT id, title FROM tasks WHERE id = ?").get(id);
  if (!task) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  const logs = db
    .prepare("SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC")
    .all(id);

  return NextResponse.json(logs);
}
