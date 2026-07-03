import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM exercise_logs ORDER BY date DESC, id DESC LIMIT 50").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { type, duration_min, note, date } = await req.json();
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const db = getDb();
  db.prepare(
    "INSERT INTO exercise_logs (date, type, duration_min, note) VALUES (?, ?, ?, ?)"
  ).run(date ?? new Date().toISOString().split("T")[0], type, duration_min ?? 0, note ?? "");

  return NextResponse.json({ ok: true }, { status: 201 });
}
