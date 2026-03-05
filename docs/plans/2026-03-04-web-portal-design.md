# Web Portal (Part C) 前端设计文档

> 作者: Brian | 日期: 2026-03-04
> 状态: 已批准
> 范围: talent-claw-platform Part C — Web Portal 前端

---

## 1. 技术选型

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 框架 | Next.js 15 (App Router) | 团队标准（ttc-lovtalent、moltoffer 均使用 15） |
| UI 基础组件 | Radix UI（通过 shadcn/ui） | 与 EvoMap 视觉风格一致，完全可定制 |
| CSS | Tailwind CSS v4 | 原子化样式，CSS Variables 支持主题切换 |
| 表格 | TanStack Table v8 | 无头表格，用于交易记录和 API Key 列表 |
| 表单 | react-hook-form + zod | 类型安全的表单验证，兼容自定义组件 |
| 数据请求 | TanStack Query v5 | 缓存、自动重新验证、乐观更新 |
| 客户端状态 | zustand v5 | 管理认证令牌、主题偏好、语言设置 |
| HTTP 客户端 | ky | 轻量级，支持拦截器实现 JWT 自动注入 |
| 国际化 | next-intl | 原生支持 App Router，首期即支持中/英 |
| API Mock | MSW v2 | 前后端并行开发 |
| 包管理器 | pnpm | 团队标准 |
| 主题 | 暗色为主 + 浅色切换 | EvoMap 风格的科幻暗色主题，基于 CSS Variables |
| 部署 | Docker 部署至 180.76.244.208 | 遵循 CLAUDE.md 架构设计，Cloudflare DNS |

## 2. 架构

### 方案：CSR 为主 + TanStack Query

大多数页面使用客户端组件（Client Components）+ TanStack Query 进行数据请求。Market 页可选 SSR 做首屏加载。认证通过 JWT 存储在 localStorage，由 ky 拦截器自动注入。

```
浏览器
  └── Next.js App (App Router)
        ├── [locale]/layout.tsx     ← Providers (Query, Theme, Intl)
        ├── [locale]/login          ← 公开页面
        ├── [locale]/market         ← 公开页面（可选 SSR）
        ├── [locale]/market/[id]    ← 公开页面
        ├── [locale]/dashboard      ← AuthGuard（需 JWT）
        ├── [locale]/transactions   ← AuthGuard
        └── [locale]/topup          ← AuthGuard
              │
              ├── TanStack Query → ky HTTP 客户端 → API (180.76.244.208:8080)
              ├── zustand stores (auth, theme)
              └── MSW（仅开发环境，拦截 HTTP 请求）
```

### 为什么不用 SSR 重度方案

Radix 组件是客户端渲染的，强制 SSR 会导致 hydration 问题。后端 API 部署在同一台服务器上，客户端请求延迟极小。

## 3. 项目结构

```
web/
├── public/
│   └── mockServiceWorker.js
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # / → 重定向到 /market
│   │   │   ├── login/page.tsx
│   │   │   ├── market/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   └── topup/page.tsx
│   │   └── layout.tsx                # 根布局（Providers）
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (Radix + Tailwind)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── market/
│   │   │   ├── ClawCard.tsx
│   │   │   ├── ClawSearch.tsx
│   │   │   └── AgentCardDetail.tsx
│   │   ├── dashboard/
│   │   │   ├── MyClawList.tsx
│   │   │   ├── ApiKeyManager.tsx
│   │   │   ├── BalanceCard.tsx
│   │   │   └── RecentTransactions.tsx
│   │   └── common/
│   │       ├── ThemeToggle.tsx
│   │       ├── LocaleSwitcher.tsx
│   │       └── AuthGuard.tsx
│   ├── lib/
│   │   ├── api.ts                    # ky + JWT 拦截器
│   │   ├── auth.ts                   # JWT localStorage 存取
│   │   ├── utils.ts                  # cn() 工具函数
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClaws.ts
│   │   ├── useWallet.ts
│   │   └── useTransactions.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── themeStore.ts
│   ├── types/index.ts
│   ├── mocks/
│   │   ├── browser.ts
│   │   ├── handlers.ts
│   │   └── data/
│   ├── messages/
│   │   ├── zh.json
│   │   └── en.json
│   └── styles/
│       └── globals.css
├── components.json                   # shadcn/ui 配置
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
└── package.json
```

## 4. 主题系统

基于 CSS Variables，两种模式（暗色为默认 + 浅色可切换）：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --elevated: 210 40% 98%;
}

.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 12%;
  --muted-foreground: 215 20% 55%;
  --primary: 160 84% 39%;           /* 科幻绿色强调色 */
  --primary-foreground: 222 47% 5%;
  --card: 222 47% 8%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --elevated: 222 47% 11%;
}
```

- 主题存储路径：zustand → localStorage → `<html class="dark">`
- shadcn/ui 组件原生使用这些变量
- Tailwind 工具类：`bg-background`、`text-foreground`、`bg-card`、`border-border`

## 5. API 层

### HTTP 客户端

```typescript
// lib/api.ts
const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE || 'http://180.76.244.208:8080/v1',
  hooks: {
    beforeRequest: [(req) => {
      const token = getToken();
      if (token) req.headers.set('Authorization', `Bearer ${token}`);
    }],
    afterResponse: [(_, __, res) => {
      if (res.status === 401) { clearToken(); /* 重定向至 /{locale}/login */ }
    }],
  },
});
```

### 响应类型

```typescript
type ApiResponse<T> = { code: number; data: T; message: string };
type PagedData<T> = { items: T[]; total: number; page: number; page_size: number };
```

### TanStack Query Hooks

每个 API 端点封装为自定义 Hook，使用合理的 query key 进行缓存管理。

## 6. 页面规格

与 product-design.md Part C 部分对齐：

| 路由 | 页面 | 核心组件 | 认证 | API |
|------|------|---------|------|-----|
| `/login` | 手机号 + 验证码登录 | 表单 (react-hook-form + zod) | 否 | POST /auth/send-code, POST /auth/login |
| `/market` | Claw 市场 | ClawSearch, ClawCard 网格, 加载更多 | 否 | GET /claws |
| `/market/:id` | Claw 详情 | AgentCardDetail | 否 | GET /claws/:id |
| `/dashboard` | 用户面板 | MyClawList, ApiKeyManager, BalanceCard, RecentTransactions | JWT | GET /claws/mine⚠️, GET /api-keys, GET /wallets/me, GET /transactions |

> ⚠️ `GET /claws/mine` 当前后端仅支持 API Key 认证，需要请求后端增加 JWT 支持（详见实施计划 P0 说明）。
| `/transactions` | 交易记录 | TanStack Table, 类型筛选, 分页 | JWT | GET /transactions |
| `/topup` | 充值积分 | 金额选择器, 确认按钮 | JWT | POST /wallets/topup |

### 布局结构（EvoMap 风格）

- **Header**：Logo（左）→ 导航链接（中）→ 主题切换 + 语言切换 + 用户头像（右）
- **Market**：全宽搜索框 → 热门标签 → 排序 → 卡片网格（2-3列）→ 加载更多
- **Dashboard**：Tab 导航（Claws / API Keys / 余额）→ 内容区域
- **无全局侧边栏** — 单列主内容区，与 EvoMap 布局风格一致

## 7. Mock 策略（MSW）

MSW v2 在开发环境中拦截所有 API 请求：

- Handler 对照 product-design.md 中的后端 API 规范编写
- Mock 数据覆盖所有页面（用户、Claw、交易、钱包）
- 通过 `NEXT_PUBLIC_MOCK=true/false` 环境变量开关
- 生产构建时移除 MSW 初始化

## 8. Docker 部署

多阶段构建 → Next.js standalone 输出 → 部署至 180.76.244.208：

```dockerfile
FROM node:20-alpine AS deps
# 安装依赖

FROM node:20-alpine AS builder
# 构建 Next.js（standalone 输出）

FROM node:20-alpine AS runner
# 复制 standalone + static + public，运行 server.js 监听 :3000
```

与现有 docker-compose.yml 集成，作为 `web` 服务，与 `server`（Go 后端）、`postgres`、`redis` 并列。

### 域名

`talentclaw.ai` 在 Cloudflare 上配置 → A 记录指向 `180.76.244.208`。Cloudflare 负责 SSL 终止和 CDN。

## 9. 组件库参考

| 组件类型 | 来源 | 示例 |
|---------|------|------|
| 交互基础组件 | shadcn/ui (Radix) | Button, Dialog, Select, Toast, DropdownMenu, Badge, Input |
| 表格 | TanStack Table + 自定义 | 交易记录列表, API Key 列表 |
| 表单 | react-hook-form + zod + shadcn/ui Input | 登录, 充值 |
| 市场卡片 | 自定义 Tailwind | ClawCard, AgentCardDetail |
| 导航 | 自定义 Tailwind | Header, Footer |
| 数据展示 | 自定义 Tailwind | BalanceCard, KPI 统计 |
| 主题切换 | 自定义 Tailwind | ThemeToggle, LocaleSwitcher |

## 10. 备选方案分析

| 方案 | 淘汰原因 |
|------|---------|
| Ant Design 5 + Tailwind | AntD 组件与 EvoMap 风格的自定义组件视觉不统一 |
| 纯手写（不用 UI 库） | 一个人 4 周时间不够 |
| SSR 重度 + Server Actions | 客户端 Radix 组件的 hydration 问题 |
| 静态导出 | 丧失 Next.js 中间件、i18n 路由和 SSR 能力 |
| Railway 部署 | CLAUDE.md 指定 Docker 部署至 180.76.244.208，团队架构决策 |
