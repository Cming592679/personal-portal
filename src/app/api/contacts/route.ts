import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const contacts = db.prepare("SELECT * FROM contacts ORDER BY name").all();
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const { name, tags, birthday, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const db = getDb();
  db.prepare(
    "INSERT INTO contacts (name, tags, birthday, notes) VALUES (?, ?, ?, ?)"
  ).run(name, tags ?? "", birthday ?? null, notes ?? "");

  return NextResponse.json({ ok: true }, { status: 201 });
}
