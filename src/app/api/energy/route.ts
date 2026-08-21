import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { energyLabel } from "@/lib/energy";
import { localYMD } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { level, note } = await req.json();
  if (!level || level < 1 || level > 5) {
    return NextResponse.json({ error: "level 1-5 required" }, { status: 400 });
  }

  const db = getDb();
  const date = req.nextUrl.searchParams.get("date") ?? localYMD();
  db.prepare(
    "INSERT OR REPLACE INTO energy_logs (date, level, note) VALUES (?, ?, ?)"
  ).run(date, level, note ?? "");

  // 当天记录心力状态时，自动在活动流留一条记录（同一天同一状态不重复写）。
  // 补录历史日期不写，避免污染当天时间线。
  if (date === localYMD()) {
    const content = `记录心力状态：${energyLabel(level)}`;
    const existing = db
      .prepare("SELECT id FROM activity_logs WHERE date(created_at) = ? AND content = ? LIMIT 1")
      .get(date, content);
    if (!existing) {
      db.prepare("INSERT INTO activity_logs (content) VALUES (?)").run(content);
    }
  }

  return NextResponse.json({ ok: true });
}
