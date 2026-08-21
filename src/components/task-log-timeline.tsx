"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

type LogEntry = {
  id: number;
  task_id: number;
  task_title: string;
  action: "created" | "status_change" | "note_update" | "deleted";
  old_value: string;
  new_value: string;
  note: string;
  created_at: string;
};

const actionConfig: Record<string, { icon: string; label: string; color: string }> = {
  created: { icon: "🆕", label: "创建", color: "#22c55e" },
  status_change: { icon: "🔄", label: "状态变更", color: "#3b82f6" },
  note_update: { icon: "📝", label: "备注", color: "#6b7280" },
  deleted: { icon: "🗑", label: "删除", color: "#ef4444" },
};

const statusLabels: Record<string, string> = {
  todo: "待办",
  doing: "进行中",
  done: "已完成",
};

function formatTime(datetime: string) {
  return datetime.slice(11, 16); // "09:23"
}

function formatDate(dateStr: string) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const d = new Date(dateStr);
  return `${dateStr.slice(5)} ${weekdays[d.getDay()]}`;
}

export default function TaskLogTimeline() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetch(`/api/tasks/logs?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month]);

  function prevMonth() {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  async function exportMonth() {
    const res = await fetch(`/api/tasks/logs?month=${month}&save=1`);
    const data = await res.json();
    if (data.ok) {
      alert(`已导出 ${data.count} 条记录到 ${data.dir}`);
    }
  }

  // 按天分组
  const grouped: Record<string, LogEntry[]> = {};
  for (const log of logs) {
    const day = log.created_at.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(log);
  }
  const sortedDays = Object.keys(grouped).sort().reverse();

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
      {/* 月份切换栏 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 0", borderBottom: "1px solid #27272a", marginBottom: 12
      }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#e4e4e7" }}>{month}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 日志统计 */}
      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
        {loading ? "加载中..." : `共 ${logs.length} 条操作，涉及 ${new Set(logs.map(l => l.task_id)).size} 个任务`}
      </div>

      {/* 时间线 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 24, color: "#71717a" }}>加载中...</div>
      ) : sortedDays.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "#71717a" }}>本月暂无日志</div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* 竖线 */}
          <div style={{
            position: "absolute", left: 5, top: 0, bottom: 0,
            width: 2, background: "#27272a"
          }} />
          {sortedDays.map((day) => (
            <div key={day} style={{ marginBottom: 20 }}>
              {/* 日期标题 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                position: "relative"
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#3b82f6", border: "2px solid #18181b",
                  position: "absolute", left: -29
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>
                  {formatDate(day)}
                </span>
              </div>
              {/* 当天事件 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {grouped[day].map((log) => {
                  const cfg = actionConfig[log.action] || actionConfig.created;
                  return (
                    <div key={log.id} style={{
                      fontSize: 13, color: "#d4d4d8", padding: "6px 10px",
                      background: "#18181b", borderRadius: 6,
                      borderLeft: `3px solid ${cfg.color}`
                    }}>
                      <span style={{ marginRight: 4 }}>{cfg.icon}</span>
                      <span style={{ fontWeight: 500 }}>「{log.task_title}」</span>
                      {log.action === "status_change" && (
                        <span style={{ color: "#a1a1aa" }}>
                          {" "}{statusLabels[log.old_value] || log.old_value} → {statusLabels[log.new_value] || log.new_value}
                        </span>
                      )}
                      {log.action === "note_update" && log.note && (
                        <span style={{ color: "#a1a1aa", fontSize: 12 }}>
                          {" "}“{log.note}”
                        </span>
                      )}
                      <span style={{ float: "right", fontSize: 11, color: "#52525b" }}>
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部导出按钮 */}
      <div style={{
        borderTop: "1px solid #27272a", paddingTop: 12, marginTop: 16,
        textAlign: "center"
      }}>
        <button
          onClick={exportMonth}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 6,
            background: "#27272a", color: "#e4e4e7", border: "none",
            fontSize: 13, cursor: "pointer"
          }}
        >
          <Download size={14} />
          导出本月文档
        </button>
      </div>
    </div>
  );
}
