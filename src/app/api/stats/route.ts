import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  // Habit heatmap: last 30 days
  const habitHeatmap = db.prepare(`
    SELECT date, COUNT(*) as done
    FROM habit_logs
    WHERE date >= date('now', '-30 days')
    GROUP BY date ORDER BY date
  `).all();

  // Expense by category (this month)
  const expensePie = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'expense' AND date >= date('now', 'start of month')
    GROUP BY category ORDER BY total DESC
  `).all();

  // Energy trend: last 30 days
  const energyTrend = db.prepare(`
    SELECT date, level FROM energy_logs
    WHERE date >= date('now', '-30 days')
    ORDER BY date
  `).all();

  // Calendar: current month energy + habits per day
  const monthStart = new Date().toISOString().slice(0, 8) + "01";
  const energyMap = db.prepare(`
    SELECT date, level FROM energy_logs WHERE date >= ? ORDER BY date
  `).all(monthStart) as { date: string; level: number }[];

  const habitsAll = db.prepare("SELECT id, name FROM habits").all() as { id: number; name: string }[];
  const habitLogsMonth = db.prepare(`
    SELECT hl.date, hl.habit_id FROM habit_logs hl WHERE hl.date >= ?
  `).all(monthStart) as { date: string; habit_id: number }[];

  // Group habit logs by date
  const habitByDate: Record<string, string[]> = {};
  for (const log of habitLogsMonth) {
    if (!habitByDate[log.date]) habitByDate[log.date] = [];
    const h = habitsAll.find((h) => h.id === log.habit_id);
    if (h) habitByDate[log.date].push(h.name);
  }

  // Build calendar map
  const calendarMap: Record<string, { energy: number | null; habits: string[] }> = {};
  for (const e of energyMap) {
    calendarMap[e.date] = { energy: e.level, habits: habitByDate[e.date] ?? [] };
  }
  // Also include dates that only have habits
  for (const [date, names] of Object.entries(habitByDate)) {
    if (!calendarMap[date]) calendarMap[date] = { energy: null, habits: names };
  }

  return NextResponse.json({
    habitHeatmap,
    expensePie,
    calendarMap,
  });
}
