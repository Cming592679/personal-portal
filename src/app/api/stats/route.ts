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

  // Exercise this week
  const exerciseWeek = db.prepare(`
    SELECT date, type, SUM(duration_min) as mins
    FROM exercise_logs
    WHERE date >= date('now', '-7 days')
    GROUP BY date ORDER BY date
  `).all();

  return NextResponse.json({
    habitHeatmap,
    expensePie,
    energyTrend,
    exerciseWeek,
  });
}
