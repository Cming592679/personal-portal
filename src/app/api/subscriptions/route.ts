import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM subscriptions ORDER BY next_payment ASC").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, amount, cycle, next_payment } = await req.json();
  if (!name || !amount) return NextResponse.json({ error: "name and amount required" }, { status: 400 });
  const db = getDb();
  db.prepare(
    "INSERT INTO subscriptions (name, amount, cycle, next_payment) VALUES (?, ?, ?, ?)"
  ).run(name, amount, cycle ?? "monthly", next_payment ?? null);
  return NextResponse.json({ ok: true }, { status: 201 });
}
