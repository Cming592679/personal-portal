import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "data", "task-logs");

function ensureDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getMonthRange(month: string) {
  // month 格式: "2026-07"
  const [y, m] = month.split("-");
  const start = `${y}-${m}-01 00:00:00`;
  // 下个月第一天
  const nextMonth = new Date(Number(y), Number(m), 1); // month is 0-indexed in JS
  const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01 00:00:00`;
  return { start, end };
}

function generateMarkdown(logs: Array<Record<string, unknown>>, month: string) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const actionIcons: Record<string, string> = {
    created: "🆕",
    status_change: "🔄",
    note_update: "📝",
    deleted: "🗑",
  };
  const actionLabels: Record<string, string> = {
    created: "创建",
    status_change: "状态变更",
    note_update: "备注更新",
    deleted: "删除",
  };

  // 按天分组
  const grouped: Record<string, Array<Record<string, unknown>>> = {};
  for (const log of logs) {
    const day = String(log.created_at).slice(0, 10); // "2026-07-15"
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(log);
  }

  const taskIds = new Set(logs.map((l) => l.task_id));
  let md = `# 任务日志 - ${month}\n\n`;
  md += `> 共记录 ${logs.length} 条操作，涉及 ${taskIds.size} 个任务\n\n`;

  const sortedDays = Object.keys(grouped).sort();
  for (const day of sortedDays) {
    const d = new Date(day);
    const weekday = weekdays[d.getDay()];
    md += `## ${day.slice(5)} ${weekday}\n\n`;
    for (const log of grouped[day]) {
      const icon = actionIcons[String(log.action)] || "📌";
      const label = actionLabels[String(log.action)] || log.action;
      const title = log.task_title || `任务#${log.task_id}`;
      let line = `- ${icon} **${label}** 「${title}」(ID:${log.task_id})`;
      if (log.action === "status_change") {
        line += `: ${log.old_value} → ${log.new_value}`;
      } else if (log.action === "note_update" && log.note) {
        line += `: "${log.note}"`;
      }
      md += line + "\n";
    }
    md += "\n";
  }
  return md;
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = searchParams.get("month") || defaultMonth;
  const format = searchParams.get("format") || "json";
  const save = searchParams.get("save") === "1";

  const { start, end } = getMonthRange(month);
  const logs = db
    .prepare("SELECT * FROM task_logs WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC")
    .all(start, end) as Array<Record<string, unknown>>;

  if (save) {
    ensureDir();
    // 保存 JSON
    const jsonPath = path.join(LOGS_DIR, `${month}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(logs, null, 2), "utf-8");
    // 保存 Markdown
    const mdPath = path.join(LOGS_DIR, `${month}.md`);
    const md = generateMarkdown(logs, month);
    fs.writeFileSync(mdPath, md, "utf-8");
    return NextResponse.json({
      ok: true,
      count: logs.length,
      saved: [`${month}.json`, `${month}.md`],
      dir: LOGS_DIR,
    });
  }

  if (format === "md") {
    return new NextResponse(generateMarkdown(logs, month), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json(logs);
}
