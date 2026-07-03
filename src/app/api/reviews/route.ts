import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "weekly";
  const db = getDb();
  const reviews = db.prepare("SELECT * FROM reviews WHERE type = ? ORDER BY period_start DESC LIMIT 12").all(type);
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const { type, period_start, keep_text, problem_text, try_text } = await req.json();
  if (!type || !period_start) return NextResponse.json({ error: "type and period_start required" }, { status: 400 });

  const db = getDb();
  // Upsert: replace if exists
  db.prepare(
    `INSERT OR REPLACE INTO reviews (type, period_start, keep_text, problem_text, try_text, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))`
  ).run(type, period_start, keep_text ?? "", problem_text ?? "", try_text ?? "");

  return NextResponse.json({ ok: true }, { status: 201 });
}
