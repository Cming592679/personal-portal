import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const habits = db.prepare(`
    SELECT h.*, hl.value as today_value
    FROM habits h
    LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = ?
    ORDER BY h.id
  `).all(date);
  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const { habit_id, date: bodyDate } = await req.json();
  if (!habit_id) return NextResponse.json({ error: "habit_id required" }, { status: 400 });

  const db = getDb();
  const date = bodyDate ?? new Date().toISOString().split("T")[0];

  // Toggle: if logged, delete; if not, insert
  const existing = db.prepare("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?").get(habit_id, date);
  if (existing) {
    db.prepare("DELETE FROM habit_logs WHERE habit_id = ? AND date = ?").run(habit_id, date);
  } else {
    db.prepare("INSERT OR REPLACE INTO habit_logs (habit_id, date, value) VALUES (?, ?, 1)").run(habit_id, date);
  }

  return NextResponse.json({ ok: true, toggled: !existing });
}
