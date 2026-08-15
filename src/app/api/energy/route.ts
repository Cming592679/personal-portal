import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { energyLabel } from "@/lib/energy";

export async function POST(req: NextRequest) {
  const { level, note } = await req.json();
  if (!level || level < 1 || level > 5) {
    return NextResponse.json({ error: "level 1-5 required" }, { status: 400 });
  }

  const db = getDb();
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  db.prepare(
    "INSERT OR REPLACE INTO energy_logs (date, level, note) VALUES (?, ?, ?)"
  ).run(date, level, note ?? "");

  // 自动留一条 Activity，用户不需要再手动记录心力状态。
  db.prepare("INSERT INTO activity_logs (content) VALUES (?)").run(
    `记录心力状态：${energyLabel(level)}`
  );

  return NextResponse.json({ ok: true });
}
