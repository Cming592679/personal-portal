import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT 100").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { type, amount, category, note, date } = await req.json();
  if (!type || !amount) return NextResponse.json({ error: "type and amount required" }, { status: 400 });

  const db = getDb();
  db.prepare(
    "INSERT INTO transactions (type, amount, category, note, date) VALUES (?, ?, ?, ?, ?)"
  ).run(type, amount, category ?? "other", note ?? "", date ?? new Date().toISOString().split("T")[0]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
