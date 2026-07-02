import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { level, note } = await req.json();
  if (!level || level < 1 || level > 5) {
    return NextResponse.json({ error: "level 1-5 required" }, { status: 400 });
  }

  const db = getDb();
  const date = new Date().toISOString().split("T")[0];
  db.prepare(
    "INSERT OR REPLACE INTO energy_logs (date, level, note) VALUES (?, ?, ?)"
  ).run(date, level, note ?? "");

  return NextResponse.json({ ok: true });
}
