import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { problem, who, scenario, workaround, willingness_to_pay } =
    await req.json();
  if (!problem) {
    return NextResponse.json({ error: "problem required" }, { status: 400 });
  }

  const db = getDb();
  const date = new Date().toISOString().split("T")[0];
  db.prepare(
    "INSERT INTO observations (date, problem, who, scenario, workaround, willingness_to_pay) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(date, problem, who ?? "", scenario ?? "", workaround ?? "", willingness_to_pay ?? "");

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM observations ORDER BY date DESC, id DESC LIMIT 50")
    .all();
  return NextResponse.json(rows);
}
