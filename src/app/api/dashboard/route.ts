import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const tasks = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE status = ?"
    )
    .get("todo") as { count: number };
  const doing = db
    .prepare("SELECT COUNT(*) as count FROM tasks WHERE status = ?")
    .get("doing") as { count: number };

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // Habit stats for today
  const todayStr = new Date().toISOString().split("T")[0];
  const habits = db
    .prepare(
      `SELECT COUNT(*) as total FROM habits WHERE frequency = 'daily'
       UNION ALL
       SELECT COUNT(*) FROM habit_logs WHERE date = ?`
    )
    .all(todayStr) as { total: number }[];

  // Exercise this week
  const weekStart = getWeekStart();
  const exerciseDone = db
    .prepare("SELECT COUNT(*) as count FROM exercise_logs WHERE date >= ?")
    .get(weekStart) as { count: number };

  // Monthly transactions
  const monthStart = new Date().toISOString().slice(0, 8) + "01";
  const expense = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND date >= ?"
    )
    .get(monthStart) as { total: number };

  // Today's energy
  const energy = db
    .prepare("SELECT level, note FROM energy_logs WHERE date = ?")
    .get(todayStr) as { level: number; note: string } | undefined;

  // Today's observation
  const obs = db
    .prepare("SELECT problem FROM observations WHERE date = ? ORDER BY id DESC LIMIT 1")
    .get(todayStr) as { problem: string } | undefined;

  // Spirit contacts count
  const contacts = db
    .prepare("SELECT COUNT(*) as count FROM contacts")
    .get() as { count: number };

  return NextResponse.json({
    today,
    tasks: { todo: tasks.count, doing: doing.count },
    habits: {
      done: habits[1]?.total ?? 0,
      total: habits[0]?.total ?? 4,
    },
    exercise: { done: exerciseDone.count, target: 3 },
    monthlyExpense: Math.round(expense.total),
    monthlyBudget: 8000,
    spiritContacts: contacts.count,
    energy: energy ?? null,
    observation: obs?.problem ?? "",
  });
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().split("T")[0];
}
