import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const logs = db.prepare("SELECT * FROM contact_logs WHERE contact_id = ? ORDER BY date DESC").all(id);
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { summary, date } = await req.json();
  const db = getDb();

  db.prepare("INSERT INTO contact_logs (contact_id, date, summary) VALUES (?, ?, ?)").run(
    id,
    date ?? new Date().toISOString().split("T")[0],
    summary ?? ""
  );
  db.prepare("UPDATE contacts SET last_contact = ? WHERE id = ?").run(
    date ?? new Date().toISOString().split("T")[0],
    id
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
