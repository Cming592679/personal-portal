import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const today = new Date();
  const monthStart = today.toISOString().slice(0, 8) + "01";
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysSoFar = Math.min(today.getDate(), daysInMonth);

  // Expense by category (this month)
  const expensePie = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as total
    FROM transactions WHERE type = 'expense' AND date >= ?
    GROUP BY category ORDER BY total DESC
  `).all(monthStart);

  // Energy + habits per day for calendar
  const energyMap = db.prepare("SELECT date, level FROM energy_logs WHERE date >= ?").all(monthStart) as { date: string; level: number }[];
  const habitsAll = db.prepare("SELECT id, name FROM habits").all() as { id: number; name: string }[];
  const habitLogsMonth = db.prepare("SELECT hl.date, hl.habit_id FROM habit_logs hl WHERE hl.date >= ?").all(monthStart) as { date: string; habit_id: number }[];
  const doneByDay = db.prepare(`
    SELECT date(completed_at) as date, COUNT(*) as count
    FROM tasks
    WHERE status = 'done' AND completed_at IS NOT NULL AND date(completed_at) >= ?
    GROUP BY date(completed_at)
  `).all(monthStart) as { date: string; count: number }[];

  // Calendar map
  const habitByDate: Record<string, string[]> = {};
  for (const log of habitLogsMonth) {
    if (!habitByDate[log.date]) habitByDate[log.date] = [];
    const h = habitsAll.find((h) => h.id === log.habit_id);
    if (h) habitByDate[log.date].push(h.name);
  }
  const calendarMap: Record<string, { energy: number | null; habits: string[]; doneCount?: number }> = {};
  for (const e of energyMap) calendarMap[e.date] = { energy: e.level, habits: habitByDate[e.date] ?? [] };
  for (const [date, names] of Object.entries(habitByDate)) {
    if (!calendarMap[date]) calendarMap[date] = { energy: null, habits: names };
  }
  for (const row of doneByDay) {
    if (!calendarMap[row.date]) calendarMap[row.date] = { energy: null, habits: habitByDate[row.date] ?? [] };
    calendarMap[row.date].doneCount = row.count;
  }

  // Per-habit completion (days done / days so far)
  const habitCompletion = habitsAll.map((h) => {
    const done = habitLogsMonth.filter((l) => l.habit_id === h.id).length;
    return { name: h.name, done, total: daysSoFar, rate: Math.round((done / daysSoFar) * 100) };
  });

  // Overall rate
  const totalPossible = habitsAll.length * daysSoFar;
  const totalDone = habitLogsMonth.length;
  const overallRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  // Monthly bar: per-habit daily count
  const monthlyBar = habitCompletion.map((h) => ({ name: h.name, 完成: h.done, 未完成: daysSoFar - h.done }));

  return NextResponse.json({
    expensePie,
    calendarMap,
    habitCompletion,
    overallRate,
    monthlyBar,
  });
}
