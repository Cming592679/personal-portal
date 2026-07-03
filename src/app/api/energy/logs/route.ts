import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT date, level, note FROM energy_logs ORDER BY date DESC LIMIT 30").all();
  return NextResponse.json(rows);
}
