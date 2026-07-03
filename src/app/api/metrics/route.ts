import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM body_metrics ORDER BY date DESC LIMIT 30").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { weight, sleep_hours, note, date } = await req.json();
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO body_metrics (date, weight, sleep_hours, note) VALUES (?, ?, ?, ?)"
  ).run(date ?? new Date().toISOString().split("T")[0], weight ?? null, sleep_hours ?? null, note ?? "");
  return NextResponse.json({ ok: true }, { status: 201 });
}
