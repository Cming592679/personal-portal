import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const tasks = db.prepare("SELECT * FROM tasks").all();
  const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
  const notes = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all();
  const observations = db.prepare("SELECT * FROM observations ORDER BY date DESC").all();
  const energy = db.prepare("SELECT date, level FROM energy_logs ORDER BY date").all();

  const data = { tasks, transactions, notes, observations, energy, exportedAt: new Date().toISOString() };
  return NextResponse.json(data);
}
