import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function mondayOfThisWeek(d: Date): string {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 本周（周一起）四象限任务完成数、Activity 数、习惯完成率、心力均值。纯统计，非 AI。 */
export async function GET() {
  const db = getDb();
  const now = new Date();
  const weekStart = mondayOfThisWeek(now);
  const daysElapsed = Math.max(1, ((now.getDay() + 6) % 7) + 1);

  const doneByQuadrant = db.prepare(`
    SELECT quadrant, COUNT(*) as count FROM tasks
    WHERE status = 'done' AND date(completed_at) >= ?
    GROUP BY quadrant
  `).all(weekStart) as { quadrant: string; count: number }[];

  const activityCount = (
    db.prepare("SELECT COUNT(*) as count FROM activity_logs WHERE date(created_at) >= ?").get(weekStart) as { count: number }
  ).count;

  const habitRows = db.prepare(`
    SELECT COUNT(*) as total FROM habits WHERE frequency = 'daily'
    UNION ALL
    SELECT COUNT(*) FROM habit_logs WHERE date >= ?
  `).all(weekStart) as { total: number }[];
  const totalPossible = (habitRows[0]?.total ?? 0) * daysElapsed;
  const habitDone = habitRows[1]?.total ?? 0;
  const habitRate = totalPossible > 0 ? Math.round((habitDone / totalPossible) * 100) : 0;

  const energyRows = db.prepare("SELECT level FROM energy_logs WHERE date >= ?").all(weekStart) as { level: number }[];
  const energyAvg = energyRows.length > 0
    ? Math.round((energyRows.reduce((s, r) => s + r.level, 0) / energyRows.length) * 10) / 10
    : null;

  const quadrant: Record<string, number> = { career: 0, mental: 0, body: 0, spirit: 0 };
  for (const row of doneByQuadrant) quadrant[row.quadrant] = row.count;

  return NextResponse.json({
    weekStart,
    daysElapsed,
    quadrant,
    activityCount,
    habitRate,
    energyAvg,
    energyDays: energyRows.length,
  });
}
