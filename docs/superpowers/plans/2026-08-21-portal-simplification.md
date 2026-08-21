# Personal Portal 简化重构实现计划

> **For agentic workers:** 本计划由当前会话 inline 执行（不派生子代理），每完成一组任务即验证并提交。

**Goal:** 按 2026-08-21 设计文档，把 personal-portal 从 339f355 改造成"工作台=操作中枢、仪表盘=回顾、日常=历史+周概览、身体/精神=目标与建议"的简化版本。

**Architecture:** 客户端页面 + Next.js Route Handlers + SQLite（better-sqlite3）。复用现有 shadcn 风格组件与 dnd-kit。

**Tech Stack:** Next.js 16.2（Turbopack）、React 19、TypeScript、Tailwind v4、better-sqlite3、@dnd-kit。

---

## 文件结构

**新建**
- `src/lib/energy.ts` — 心力等级常量与 label 映射
- `src/components/auto-textarea.tsx` — 自动增高 textarea
- `src/components/task-list.tsx` — 工作台任务面板（新任务/当前任务/最近已完成/日志）
- `src/app/api/weekly/route.ts` — 本周四象限概览
- `PROJECT_CONTEXT.md` — 项目认知文档

**修改**
- `src/lib/utils.ts` — 增加本地日期 `localYMD`
- `src/app/api/energy/route.ts` — 当天记录自动写 activity
- `src/app/api/tasks/route.ts` — GET 支持 `completed_date`
- `src/app/workbench/page.tsx` — 重写
- `src/app/page.tsx` — 仪表盘瘦身 + 紧凑日历
- `src/app/daily/page.tsx` — 本周概览
- `src/app/body/page.tsx` — 目标/建议空间
- `src/app/spirit/page.tsx` — 联系人 + 未联系提醒 + 精神目标
- `README.md` — 同步

**删除**
- `src/components/task-kanban.tsx` — 任务看板移入工作台后不再使用

## 任务

### 任务 1：文档（设计 + 计划）
- [x] 设计文档写入 `docs/superpowers/specs/2026-08-21-portal-simplification-design.md`
- [x] 计划写入 `docs/superpowers/plans/2026-08-21-portal-simplification.md`
- [ ] 提交 `docs: add portal simplification spec and plan`

### 任务 2：基础库与 API
- [ ] `src/lib/energy.ts`：ENERGY_LEVELS（1 枯竭/2 还行/3 活力无限）+ energyLabel
- [ ] `src/lib/utils.ts`：localYMD
- [ ] `src/app/api/energy/route.ts`：当天自动写 activity（去重）
- [ ] `src/app/api/tasks/route.ts`：GET 支持 completed_date
- [ ] 提交 `feat(api): energy auto activity + tasks completed_date filter`

### 任务 3：工作台
- [ ] `src/components/auto-textarea.tsx`
- [ ] `src/components/task-list.tsx`
- [ ] `src/app/workbench/page.tsx` 重写（两栏 50/50）
- [ ] 删除 `src/components/task-kanban.tsx`（确认无引用）
- [ ] 验证：build
- [ ] 提交 `feat(workbench): task quadrant/priority picker, sortable list, auto-grow activity input, energy quick record`

### 任务 4：仪表盘
- [ ] `src/app/page.tsx` 瘦身：移除四象限/TASKS/TOOLS/支出/心力快选
- [ ] 紧凑日历 + 当天完成任务弹窗
- [ ] 验证：build
- [ ] 提交 `feat(dashboard): remove quadrant/tasks/tools, compact calendar with day review`

### 任务 5：日常页周概览
- [ ] `src/app/api/weekly/route.ts`
- [ ] `src/app/daily/page.tsx` 顶部概览卡片
- [ ] 验证：build
- [ ] 提交 `feat(daily): weekly four-quadrant overview`

### 任务 6：身体/精神页
- [ ] `src/app/body/page.tsx` 目标/建议
- [ ] `src/app/spirit/page.tsx` 联系人 + 未联系提醒 + 精神目标
- [ ] 验证：build
- [ ] 提交 `feat(quadrant-pages): body goals hub, spirit contacts + reminders`

### 任务 7：文档同步
- [ ] README.md 同步页面定位/功能表
- [ ] PROJECT_CONTEXT.md 新建
- [ ] 提交 `docs: sync README and add PROJECT_CONTEXT`

### 任务 8：整体验证与汇报
- [ ] `npm run lint` + `npm run build` + `next start` 路由 smoke
- [ ] 汇报（含 Git 状态与推送建议）
