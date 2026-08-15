import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function localYMD(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function toMap(rows: { day?: string; date?: string; level?: number; c?: number }[], key: "day" | "date") {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const k = r[key];
    if (!k) continue;
    map[k] = (r.level !== undefined ? r.level : r.c ?? 0) as number;
  }
  return map;
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const now = new Date();
  const month = req.nextUrl.searchParams.get("month") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  // 下个月第一天（作为范围上限，date 比较）
  const end = `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const activityRows = db.prepare(
    "SELECT substr(created_at, 1, 10) as day, COUNT(*) as c FROM activity_logs WHERE created_at >= ? AND created_at < ? GROUP BY day"
  ).all(start, end) as { day: string; c: number }[];

  const taskDoneRows = db.prepare(
    "SELECT substr(completed_at, 1, 10) as day, COUNT(*) as c FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ? GROUP BY day"
  ).all(start, end) as { day: string; c: number }[];

  const energyRows = db.prepare(
    "SELECT date, level FROM energy_logs WHERE date >= ? AND date < ?"
  ).all(start, end) as { date: string; level: number }[];

  // 本周（周一起）
  const weekStart = new Date(now);
  const day = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1; // 周一为 0
  weekStart.setDate(weekStart.getDate() - day);
  const weekStartStr = localYMD(weekStart);
  const todayStr = localYMD(now);

  const todayActivity = db.prepare(
    "SELECT COUNT(*) as c FROM activity_logs WHERE substr(created_at, 1, 10) = ?"
  ).get(todayStr) as { c: number };
  const weekActivity = db.prepare(
    "SELECT COUNT(*) as c FROM activity_logs WHERE substr(created_at, 1, 10) >= ?"
  ).get(weekStartStr) as { c: number };
  const weekTaskDone = db.prepare(
    "SELECT COUNT(*) as c FROM tasks WHERE completed_at IS NOT NULL AND substr(completed_at, 1, 10) >= ?"
  ).get(weekStartStr) as { c: number };
  const todayEnergy = db.prepare("SELECT level FROM energy_logs WHERE date = ?").get(todayStr) as { level: number } | undefined;

  return NextResponse.json({
    month,
    activityByDay: toMap(activityRows, "day"),
    taskDoneByDay: toMap(taskDoneRows, "day"),
    energyByDay: toMap(energyRows, "date"),
    todayActivityCount: todayActivity.c,
    weekActivityCount: weekActivity.c,
    weekTaskDoneCount: weekTaskDone.c,
    todayEnergy: todayEnergy?.level ?? null,
  });
}
