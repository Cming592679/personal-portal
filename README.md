# Personal Portal — 个人管理门户

个人生活管理系统，覆盖职业、身体、心理、精神四个维度的日常追踪与回顾。

技术栈：Next.js + TypeScript + SQLite + shadcn/ui。

---

## 快速开始（新电脑）

```bash
# 1. clone 代码
git clone <repository-url> personal-portal
cd personal-portal

# 2. 安装依赖
npm install

# 3. 创建个人数据目录（可放在任意位置，例如家目录下）
mkdir -p ~/personal-portal-data

# 4.（换电脑时）把旧电脑的个人数据复制进来
#    例如：~/personal-portal-data/portal.db、~/personal-portal-data/task-logs/

# 5. 配置数据路径
cp .env.example .env.local
#    编辑 .env.local，设置：
#    PERSONAL_DATA_DIR=/home/<you>/personal-portal-data

# 6. 启动
npm run dev
# 打开 http://localhost:3000
```

> 换电脑 ≠ 改代码。换电脑 = clone 代码 + 恢复个人数据 + 配置数据路径。

---

## 个人数据与代码永久分离

- **代码仓库**（Git Repository）只保存：应用代码、UI、API、数据库 schema / migration、配置模板、文档。
- **个人数据**（Personal Data）永远不会进入 Git，集中存放在 `PERSONAL_DATA_DIR` 指定的外部目录。

```
personal-portal/               ← 公开代码仓库（可随时 clone / pull）
└── src/ public/ package.json .env.example ...

PERSONAL_DATA_DIR/             ← 真实个人数据（独立备份 / 迁移 / 恢复，永不进 Git）
├── portal.db                  # SQLite 数据库（Task / Activity / Notes / Habits …）
├── task-logs/                 # 任务日志月度导出（json / md）
└── future-data/               # 未来：attachments / exports / media …
```

个人数据目录由环境变量 `PERSONAL_DATA_DIR` 指定（**仅服务器端**，不暴露给浏览器）：

```
PERSONAL_DATA_DIR=/home/<you>/personal-portal-data
```

- 数据库最终路径：`${PERSONAL_DATA_DIR}/portal.db`
- 任务日志导出：`${PERSONAL_DATA_DIR}/task-logs/`
- 未来其他个人数据也应放在 `${PERSONAL_DATA_DIR}/...` 下。
- 真实路径写在本地 `.env.local`（已被 `.gitignore` 忽略）；仓库只提交 `.env.example` 示例。
- 如果未配置 `PERSONAL_DATA_DIR`，程序启动时会给出明确报错，而**不会**静默回退到项目目录 `data/`。

---

## 功能模块

| 模块 | 路由 | 用途 |
|------|------|------|
| 首页 | `/` | 今日概览，任务看板 + 时间线 |
| 日常 | `/daily` | 低摩擦 Activity 流：快速记录「实际发生了什么」 |
| 职业 | `/career` | 工作任务、学习进度、技术积累 |
| 身体 | `/body` | 运动、饮食、睡眠、体重追踪 |
| 心理 | `/mental` | 情绪日志、冥想、感恩记录 |
| 精神 | `/spirit` | 阅读、写作、创作、深度思考 |
| 设置 | `/settings` | 系统偏好、数据导出 |

### 任务管理

- 看板视图（待办 / 进行中 / 已完成）
- 时间线视图（操作日志追溯）
- 支持标签、优先级、截止日期

### Activity / Daily

- Task 记录「准备做什么」，Activity 记录「实际发生了什么」
- 输入 → Enter → 完成，不要求分类 / 标签 / 项目 / 优先级 / 情绪 / 时长

---

## 项目结构（代码）

```
personal-portal/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── layout.tsx    #   全局布局（侧边栏 + 内容区）
│   │   ├── page.tsx      #   首页：任务看板 + 时间线
│   │   ├── daily/        #   Daily / Activity
│   │   ├── career/       #   职业模块
│   │   ├── body/         #   身体模块
│   │   ├── mental/       #   心理模块
│   │   ├── spirit/       #   精神模块
│   │   └── settings/     #   设置
│   ├── components/
│   │   ├── ui/           #   shadcn/ui 基础组件
│   │   ├── sidebar.tsx   #   侧边栏导航
│   │   ├── task-kanban.tsx        #   任务看板
│   │   └── task-log-timeline.tsx  #   操作时间线
│   └── lib/
│       ├── db.ts         #   SQLite 数据库访问（统一入口 getDb）
│       ├── data-dir.ts   #   个人数据路径 helper（PERSONAL_DATA_DIR）
│       └── utils.ts      #   工具函数
├── .env.example          #   配置模板（示例路径，不含真实数据）
├── components.json       #   shadcn/ui 配置
├── next.config.ts
└── package.json
```

> 数据库文件 `portal.db` 与 `task-logs/` 已不在项目目录，全部位于 `PERSONAL_DATA_DIR`。

---

## 设计理念

- **轻量自托管**：本地 SQLite，不依赖云服务，数据完全私有
- **Code 与 Data 解耦**：代码可公开分享，个人数据独立备份迁移，永不相混
- **四维平衡**：不只追踪工作产出，同时关注身心状态
- **习惯先行**：工具服务于习惯养成，而非替代习惯

---

> 私人工具，不做多用户支持。个人数据在本地 `PERSONAL_DATA_DIR`，定期备份该目录即可。
