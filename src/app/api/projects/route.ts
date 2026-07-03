import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { title, description, color } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const db = getDb();
  db.prepare("INSERT INTO projects (title, description, color) VALUES (?, ?, ?)").run(
    title, description ?? "", color ?? "#6366f1"
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
