# PROJECT_CONTEXT — Personal Portal

## 1. 项目认知

Personal Portal 是一个**本地运行、个人数据独立存储**的个人管理工具（Next.js + SQLite）。核心只有两件事：记下要做的（Task）和记下发生的（Daily/Activity）。页面按"操作"与"回顾"划分：工作台负责当下操作，仪表盘/日常负责回顾。

本项目位于 `~/AI-project/personal-portal/`，代码可公开，个人数据在 `PERSONAL_DATA_DIR`（gitignore），两者永久分离。

## 2. 产品目标

- 极低摩擦：想到就记，不要求分类、不要求整理。
- 一页完成日常操作：工作台 = 建任务（分类/优先级）+ 管任务（拖动/备注/状态）+ 记 Activity + 记心力。
- 回顾可视化：仪表盘日历（心力颜色 + 习惯图标 + 完成数）、统计图表、日常本周四象限概览。
- 不为记录本身增加负担：分类和优先级在创建时一次点选，不做复杂的流程。

## 3. 用户工作流

```
打开工作台
  ├─ 想到要做的事 → 输入标题 + 点分类/优先级 → Enter（Task）
  ├─ 刚发生的事   → 输入 → Ctrl/Cmd+Enter（Activity）
  └─ 心力状态     → 点枯竭/还行/活力无限（自动写入 Activity）
推进任务 → 拖动排序 / 改状态 / 写备注
事情完成 → 状态改「已完成」
回顾     → 仪表盘（习惯/统计/日历）· 日常（本周概览 + 历史时间线）
```

## 4. 投资体系

不适用（个人管理工具，非投资类项目；同目录的 investment-dashboard 另立项目）。

## 5. 技术架构

- **框架**：Next.js 16（App Router，Turbopack）+ React 19 + TypeScript。
- **数据**：better-sqlite3（`PERSONAL_DATA_DIR/portal.db`），WAL 模式；客户端组件直接调 Route Handlers。
- **样式**：Tailwind CSS v4 + shadcn 风格组件（`src/components/ui/*`），暗色 GitHub 风格主题。
- **交互**：@dnd-kit 实现任务拖动排序；recharts 做统计图表。
- **关键模块**：工作台（`src/components/task-list.tsx` + `src/app/workbench/page.tsx`）、仪表盘（`src/app/page.tsx`）、日常（`src/app/daily/page.tsx`）、目标面板（`src/components/goal-board.tsx`）、自动增高输入（`src/components/auto-textarea.tsx`）。
- **心力等级常量**：`src/lib/energy.ts`；本地日期工具：`src/lib/utils.ts` 的 `localYMD`。

## 6. 当前问题

- 心智/职业/设置页尚未纳入本轮简化（保留原样，待使用数据决定去留）。
- 记账/KPT/订阅等 UI 已裁但数据与 API 保留，后续若确认不用可考虑清理。
- AI Weekly Review 未实现，四象限周分析目前是纯统计。
- 本地 main 与 origin/main 分叉（魔改版已存档到 `archive/mogai-origin-main`），推送策略待确认。

## 7. 长期目标

- Daily 积累足够真实记录后，实现手动 AI Weekly Review：提炼本周完成、问题、知识、建议。
- 周分析按四象限（工作/心智/身体/精神）给出优化建议，写入身体/精神页。
- 基于真实使用数据持续裁剪/收敛模块，保持工具极简。

## 8. Agent 工作原则

- 按 `~/AI-project/` 完整工程负责人规则执行：需求理解 → 影响面分析 → 实现 → 验证 → 原子 commit → 汇报。
- 个人数据红线：`PERSONAL_DATA_DIR`、`.env.local` 永不进入 Git；裁剪功能不删历史数据。
- 改动涉及页面定位/入口/功能时，必须同步 README。
- 大改前先写设计文档（`docs/superpowers/specs/`）并经用户确认。
