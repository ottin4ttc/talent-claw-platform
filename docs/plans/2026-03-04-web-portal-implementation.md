# Web Portal (Part C) 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建 Talent Claw Platform Web Portal — 一个面向人类用户的市场界面，用于浏览 Claw、管理 API Key、查看交易记录和充值积分。

**架构：** 以 CSR 为主的 Next.js 15 App Router 应用，使用 TanStack Query 做数据请求，shadcn/ui (Radix + Tailwind) 做组件库，MSW 做 API Mock，next-intl 做国际化。默认暗色主题，支持浅色切换。通过 Docker 部署至 180.76.244.208。

**技术栈：** Next.js 15, Tailwind CSS v4, shadcn/ui (Radix UI), TanStack Query v5, TanStack Table v8, zustand v5, react-hook-form + zod, ky, next-intl, MSW v2, Vitest + React Testing Library, pnpm

**测试策略：** 采用 TDD 开发模式，使用 Vitest + React Testing Library 做单元/集成测试。先写失败的测试 → 实现代码 → 验证通过 → 提交。初期以导出检查确保模块可加载，MSW + Provider 就绪后补充行为级测试（渲染验证、用户交互、API Mock 断言）。使用 Playwright 做关键流程的 E2E 测试（登录、市场浏览、控制台、交易记录）。

**参考文档：**
- `docs/product-design.md` — API 规范、页面需求、错误码
- `docs/plans/2026-03-04-web-portal-design.md` — 已批准的设计决策
- `CLAUDE.md` — 基础设施、认证中间件、API 基础 URL

---

### ⚠️ 认证契约阻塞项：`GET /claws/mine`

**冲突：** `product-design.md` 定义 `GET /claws/mine` 使用 `Auth: Bearer clw_xxx`（API Key），`CLAUDE.md` 认证中间件表也确认 `POST/GET/PATCH/DELETE /claws/*` 均为 API Key 认证。但 Web Portal 的人类用户使用 JWT 登录，Dashboard 的「我的 Claw」需要调用此端点。

**曾探索的前端绕过方案（不可行）：** 尝试让 `useMyClaws()` 通过用户已有的 API Key 调用 `/claws/mine`（而非 JWT）。具体分析：

1. 用户登录后进入 Dashboard，前端先用 JWT 调用 `GET /api-keys` 获取用户的 API Key 列表
2. 如果用户有 API Key，取第一个 Key 的 `key_prefix`（注意：完整 key 仅创建时可见，后续不可查看）
3. **此方案不可行：API Key 明文不可回查**，前端无法拿到完整 key 来调用 `/claws/mine`

**结论：必须请求后端配合，前端无法独立解决。** 在后端改动前，Dashboard「我的 Claw」Tab 将显示友好提示。全局 401 拦截器已对 `/claws/mine` 做豁免（见 api.ts），不会误跳登录页。

**后端需要的改动（已同步给 Part A 负责人）：**
- 将 `GET /claws/mine` 的认证从「仅 API Key」改为「API Key 或 JWT」
- 与 `GET /wallets/me`、`GET /transactions` 保持一致
- JWT 场景下通过 `user_id` 查询该用户名下所有 Claw

---

## 阶段 1：项目初始化

### 任务 1：Next.js 15 项目脚手架

**文件：**
- 创建：`web/package.json`
- 创建：`web/tsconfig.json`
- 创建：`web/next.config.ts`
- 创建：`web/src/app/layout.tsx`
- 创建：`web/src/app/page.tsx`

**步骤 1：初始化 Next.js 项目**

```bash
cd /Users/chenyang/Downloads/work/talent-claw-platform
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

接受默认选项。此命令会创建完整的项目骨架。

**步骤 2：验证项目是否可运行**

```bash
cd web && pnpm dev
```

预期：Next.js 开发服务器启动在 http://localhost:3000，默认页面可正常渲染。

**步骤 3：清理默认内容**

将 `web/src/app/page.tsx` 替换为最简重定向占位：

```tsx
import { redirect } from "@/i18n/routing";

export default function Home() {
  redirect("/market");  // next-intl 会自动加上 locale 前缀
}
```

删除 `web/src/app/globals.css` 中的默认样式（仅保留 Tailwind 指令）。

**步骤 4：提交**

```bash
git add web/
git commit -m "feat(web): initialize Next.js 15 project with Tailwind"
```

---

### 任务 2：shadcn/ui 配置

**文件：**
- 创建：`web/components.json`
- 创建：`web/src/lib/utils.ts`
- 创建：`web/src/components/ui/button.tsx`（及其他组件）

**步骤 1：初始化 shadcn/ui**

```bash
cd web
pnpm dlx shadcn@latest init
```

选择：New York 风格，Zinc 基础色，CSS variables：是。

**步骤 2：添加核心 UI 组件**

```bash
pnpm dlx shadcn@latest add button input badge dialog dropdown-menu select toast sonner separator card tabs
```

**步骤 3：确认 utils.ts 已生成**

检查 `web/src/lib/utils.ts` 包含 `cn()` 工具函数：

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**步骤 4：验证构建成功**

```bash
pnpm build
```

预期：构建无错误完成。

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add shadcn/ui with core components"
```

---

### 任务 3：主题系统（暗色/浅色）

**文件：**
- 修改：`web/src/styles/globals.css`（或 `web/src/app/globals.css`）
- 创建：`web/src/stores/themeStore.ts`
- 创建：`web/src/components/common/ThemeToggle.tsx`
- 测试：`web/src/__tests__/stores/themeStore.test.ts`

**步骤 1：安装测试依赖**

```bash
cd web
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

创建 `web/vitest.config.ts`：

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

创建 `web/src/test-setup.ts`：

```typescript
import "@testing-library/jest-dom/vitest";

// MSW server 将在任务 8 创建 mocks/server.ts 后生效；
// 届时取消下方注释即可启用全局 MSW 拦截。
// import { server } from "./mocks/server";
// beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// afterEach(() => { server.resetHandlers(); resetMockBalance(); });
// afterAll(() => server.close());
```

> **注意**：任务 8 完成后需回来取消注释并补充 `resetMockBalance` 导入（见任务 8 步骤 5）。

**步骤 2：编写主题 store 的失败测试**

创建 `web/src/__tests__/stores/themeStore.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "@/stores/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
  });

  it("默认为暗色主题", () => {
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("dark");
  });

  it("切换到浅色主题", () => {
    useThemeStore.getState().toggleTheme();
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("light");
  });

  it("再次切换回暗色主题", () => {
    useThemeStore.getState().toggleTheme();
    useThemeStore.getState().toggleTheme();
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("dark");
  });
});
```

**步骤 3：运行测试验证失败**

```bash
pnpm vitest run src/__tests__/stores/themeStore.test.ts
```

预期：FAIL — 模块 `@/stores/themeStore` 未找到。

**步骤 4：实现主题 store**

创建 `web/src/stores/themeStore.ts`：

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "theme-preference" }
  )
);
```

**步骤 5：运行测试验证通过**

```bash
pnpm vitest run src/__tests__/stores/themeStore.test.ts
```

预期：3 个测试全部 PASS。

**步骤 6：添加 CSS Variables 到 globals.css**

将设计文档（`docs/plans/2026-03-04-web-portal-design.md` 第 4 节）中的主题变量写入 `web/src/app/globals.css`。

关键 token：`--background`、`--foreground`、`--primary`（暗色模式下为科幻绿 `160 84% 39%`）、`--card`、`--border`、`--muted`、`--elevated`。

**步骤 7：创建 ThemeToggle 组件**

创建 `web/src/components/common/ThemeToggle.tsx`：

```tsx
"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

**步骤 8：提交**

```bash
git add .
git commit -m "feat(web): add dark/light theme system with zustand store"
```

---

### 任务 4：i18n 配置（next-intl）

**文件：**
- 创建：`web/src/i18n/request.ts`
- 创建：`web/src/i18n/routing.ts`
- 创建：`web/src/messages/en.json`
- 创建：`web/src/messages/zh.json`
- 创建：`web/src/middleware.ts`
- 修改：`web/src/app/layout.tsx` → 移至 `web/src/app/[locale]/layout.tsx`

**步骤 1：安装 next-intl**

```bash
cd web
pnpm add next-intl
```

**步骤 2：创建路由配置**

创建 `web/src/i18n/routing.ts`：

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
});

// 导出带 locale 自动注入的导航工具，组件中统一使用这些而非 next/link、next/navigation
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

创建 `web/src/i18n/request.ts`：

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**步骤 3：创建初始翻译文件**

`web/src/messages/en.json`：

```json
{
  "common": {
    "appName": "Talent Claw",
    "market": "Market",
    "dashboard": "Dashboard",
    "transactions": "Transactions",
    "topup": "Top Up",
    "login": "Sign In",
    "logout": "Sign Out",
    "loading": "Loading...",
    "error": "Something went wrong",
    "search": "Search",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "back": "Back"
  },
  "auth": {
    "phone": "Phone Number",
    "code": "Verification Code",
    "sendCode": "Send Code",
    "loginTitle": "Sign in to Talent Claw",
    "loginSubtitle": "Enter your phone number to get started"
  },
  "market": {
    "title": "Claw Market",
    "searchPlaceholder": "Search by keywords (e.g. translate, code, data)...",
    "noResults": "No Claws found",
    "loadMore": "Load More",
    "online": "Online",
    "offline": "Offline",
    "calls": "Calls",
    "rating": "Rating",
    "perCall": "credits/call"
  },
  "dashboard": {
    "title": "Dashboard",
    "myClaws": "My Claws",
    "apiKeys": "API Keys",
    "balance": "Balance",
    "recentTransactions": "Recent Transactions",
    "createKey": "Create API Key",
    "keyName": "Key Name",
    "keyCreated": "API Key Created",
    "keyWarning": "This key will only be shown once. Copy it now.",
    "credits": "Credits"
  },
  "transactions": {
    "title": "Transaction History",
    "type": "Type",
    "amount": "Amount",
    "time": "Time",
    "memo": "Memo",
    "topup": "Top Up",
    "escrow_hold": "Escrow Hold",
    "escrow_release": "Escrow Release",
    "escrow_refund": "Escrow Refund",
    "all": "All"
  },
  "topup": {
    "title": "Top Up Credits",
    "selectAmount": "Select Amount",
    "customAmount": "Custom Amount",
    "confirmTopup": "Confirm Top Up",
    "success": "Top up successful!"
  }
}
```

`web/src/messages/zh.json`：

```json
{
  "common": {
    "appName": "Talent Claw",
    "market": "市场",
    "dashboard": "控制台",
    "transactions": "交易记录",
    "topup": "充值",
    "login": "登录",
    "logout": "退出",
    "loading": "加载中...",
    "error": "出了点问题",
    "search": "搜索",
    "cancel": "取消",
    "confirm": "确认",
    "save": "保存",
    "delete": "删除",
    "back": "返回"
  },
  "auth": {
    "phone": "手机号",
    "code": "验证码",
    "sendCode": "发送验证码",
    "loginTitle": "登录 Talent Claw",
    "loginSubtitle": "输入手机号开始使用"
  },
  "market": {
    "title": "Claw 市场",
    "searchPlaceholder": "按关键词搜索（如：翻译、编码、数据）...",
    "noResults": "未找到 Claw",
    "loadMore": "加载更多",
    "online": "在线",
    "offline": "离线",
    "calls": "调用次数",
    "rating": "评分",
    "perCall": "积分/次"
  },
  "dashboard": {
    "title": "控制台",
    "myClaws": "我的 Claw",
    "apiKeys": "API Key 管理",
    "balance": "余额",
    "recentTransactions": "最近交易",
    "createKey": "创建 API Key",
    "keyName": "Key 名称",
    "keyCreated": "API Key 已创建",
    "keyWarning": "此 Key 仅显示一次，请立即复制。",
    "credits": "积分"
  },
  "transactions": {
    "title": "交易记录",
    "type": "类型",
    "amount": "金额",
    "time": "时间",
    "memo": "备注",
    "topup": "充值",
    "escrow_hold": "担保冻结",
    "escrow_release": "担保放款",
    "escrow_refund": "担保退款",
    "all": "全部"
  },
  "topup": {
    "title": "充值积分",
    "selectAmount": "选择金额",
    "customAmount": "自定义金额",
    "confirmTopup": "确认充值",
    "success": "充值成功！"
  }
}
```

**步骤 4：创建语言路由中间件**

创建 `web/src/middleware.ts`：

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

**步骤 5：重构 app 目录以支持语言路由**

将 `web/src/app/layout.tsx` 移至 `web/src/app/[locale]/layout.tsx`，用 `NextIntlClientProvider` 包裹。保留一个最简的根 `web/src/app/layout.tsx`。

**步骤 6：更新 next.config.ts**

添加 next-intl 插件：

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
```

**步骤 7：验证开发服务器语言路由正常**

```bash
pnpm dev
```

访问 `http://localhost:3000/en` 和 `http://localhost:3000/zh` — 两者都应正常渲染。

**步骤 8：提交**

```bash
git add .
git commit -m "feat(web): add i18n with next-intl (en/zh)"
```

---

## 阶段 2：核心库

### 任务 5：TypeScript 类型定义

**文件：**
- 创建：`web/src/types/index.ts`
- 测试：`web/src/__tests__/types/types.test.ts`

**步骤 1：编写类型验证测试**

创建 `web/src/__tests__/types/types.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import type { User, Claw, ApiKey, Wallet, Transaction, ApiResponse, PagedData } from "@/types";

describe("Types", () => {
  it("User 类型包含必填字段", () => {
    const user: User = {
      id: "uuid",
      phone: "138****8000",
      nickname: "User_abc",
      created_at: "2026-03-04T12:00:00Z",
    };
    expect(user.id).toBeDefined();
    expect(user.phone).toBeDefined();
  });

  it("Claw 类型包含必填字段", () => {
    const claw: Claw = {
      id: "uuid",
      owner_id: "uuid",
      name: "translator",
      description: "A translation agent",
      capabilities: [{ name: "translate", description: "Translate text" }],
      tags: ["nlp", "translate"],
      pricing: { model: "per_call", amount: 5, description: "每次调用 5 积分" },
      status: "online",
      rating_avg: 0,
      rating_count: 0,
      total_calls: 0,
      created_at: "2026-03-04T12:00:00Z",
      updated_at: "2026-03-04T12:00:00Z",
    };
    expect(claw.name).toBe("translator");
  });

  it("ApiResponse 正确包裹数据", () => {
    const resp: ApiResponse<User> = {
      code: 0,
      data: { id: "uuid", phone: "138****8000", nickname: "Test", created_at: "" },
      message: "ok",
    };
    expect(resp.code).toBe(0);
  });
});
```

**步骤 2：运行测试 — 应该失败**

```bash
pnpm vitest run src/__tests__/types/types.test.ts
```

预期：FAIL — 类型未找到。

**步骤 3：实现类型定义**

创建 `web/src/types/index.ts`：

```typescript
// --- API 响应信封 ---

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PagedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// --- 用户与认证 ---

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SendCodeRequest {
  phone: string;
}

// --- API Key ---

export interface ApiKey {
  id: string;
  key?: string;        // 仅在创建时返回
  key_prefix: string;
  name: string;
  last_used_at?: string;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

// --- Claw ---

export interface Capability {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

export interface Pricing {
  model: "per_call" | "negotiable";
  amount: number;
  description?: string;
}

export interface Claw {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  tags: string[];
  pricing: Pricing | null;
  status: "online" | "offline";
  rating_avg: number;
  rating_count: number;
  total_calls: number;
  created_at: string;
  updated_at: string;
}

export interface ClawSearchParams {
  q?: string;
  tags?: string;
  status?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// --- 钱包 ---

export interface Wallet {
  balance: number;
  // 注意：后端 GET /wallets/me 仅返回 { balance }，无 user_id 和 updated_at
}

// --- 交易 ---

export type TransactionType = "topup" | "escrow_hold" | "escrow_release" | "escrow_refund";

export interface Transaction {
  id: string;
  session_id?: string;
  from_id?: string;
  to_id?: string;
  amount: number;
  type: TransactionType;
  memo?: string;
  created_at: string;
}

export interface TopupRequest {
  amount: number;
}
```

**步骤 4：运行测试 — 应该通过**

```bash
pnpm vitest run src/__tests__/types/types.test.ts
```

预期：3 个测试全部 PASS。

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add TypeScript types matching backend API"
```

---

### 任务 6：API 客户端（ky + JWT）

**文件：**
- 创建：`web/src/lib/api.ts`
- 创建：`web/src/lib/auth.ts`
- 创建：`web/src/lib/constants.ts`
- 测试：`web/src/__tests__/lib/auth.test.ts`
- 测试：`web/src/__tests__/lib/api.test.ts`

**步骤 1：安装 ky**

```bash
cd web && pnpm add ky
```

**步骤 2：编写 auth 工具函数的失败测试**

创建 `web/src/__tests__/lib/auth.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken } from "@/lib/auth";

describe("auth 工具函数", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("无 token 时返回 null", () => {
    expect(getToken()).toBeNull();
  });

  it("存储并读取 token", () => {
    setToken("test-jwt-token");
    expect(getToken()).toBe("test-jwt-token");
  });

  it("清除 token", () => {
    setToken("test-jwt-token");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
```

**步骤 3：运行测试 — 失败**

```bash
pnpm vitest run src/__tests__/lib/auth.test.ts
```

**步骤 4：实现 auth.ts**

创建 `web/src/lib/auth.ts`：

```typescript
const TOKEN_KEY = "talentclaw_jwt";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

**步骤 5：运行测试 — 通过**

```bash
pnpm vitest run src/__tests__/lib/auth.test.ts
```

**步骤 6：实现 constants.ts**

创建 `web/src/lib/constants.ts`：

```typescript
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://180.76.244.208:8080/v1";

export const ERROR_CODES = {
  INVALID_API_KEY: 40001,
  TOKEN_EXPIRED: 40002,
  INVALID_TOKEN: 40003,
  NOT_YOUR_CLAW: 40101,
  CLAW_NOT_FOUND: 40401,
  SESSION_NOT_FOUND: 40402,
  MISSING_FIELD: 42201,
  INSUFFICIENT_BALANCE: 40901,
  INTERNAL_ERROR: 50001,
} as const;
```

**步骤 7：实现 api.ts**

创建 `web/src/lib/api.ts`：

```typescript
import ky from "ky";
import { getToken, clearToken } from "./auth";
import { API_BASE } from "./constants";
import type { ApiResponse, PagedData } from "@/types";

export const api = ky.create({
  prefixUrl: API_BASE,
  timeout: 10000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401) {
          // 已知 /claws/mine 在后端未支持 JWT 前会返回 401，
          // 此时不应清除 token 或跳转登录，而是让调用方（useMyClaws）自行处理 error
          const url = new URL(request.url);
          if (url.pathname.endsWith("/claws/mine")) {
            return;  // 跳过，交给 TanStack Query 的 onError 处理
          }

          clearToken();
          if (typeof window !== "undefined") {
            const segments = window.location.pathname.split("/");
            const locale = ["en", "zh"].includes(segments[1]) ? segments[1] : "en";
            window.location.href = `/${locale}/login`;
          }
        }
      },
    ],
  },
});

// 解包 ApiResponse 的辅助函数
export async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  const resp: ApiResponse<T> = await promise.then((r) => r.json());
  if (resp.code !== 0) {
    throw new Error(resp.message || "API error");
  }
  return resp.data;
}

// 解包分页响应的辅助函数
export async function unwrapPaged<T>(
  promise: Promise<Response>
): Promise<PagedData<T>> {
  const resp: ApiResponse<PagedData<T>> = await promise.then((r) => r.json());
  if (resp.code !== 0) {
    throw new Error(resp.message || "API error");
  }
  return resp.data;
}
```

**步骤 8：提交**

```bash
git add .
git commit -m "feat(web): add API client with ky + JWT interceptor"
```

---

### 任务 7：认证 Store（zustand）

**文件：**
- 创建：`web/src/stores/authStore.ts`
- 测试：`web/src/__tests__/stores/authStore.test.ts`

**步骤 1：编写失败测试**

创建 `web/src/__tests__/stores/authStore.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("默认为未认证状态", () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
  });

  it("login 设置用户和认证状态", () => {
    useAuthStore.getState().login(
      { id: "1", phone: "138****8000", nickname: "Test", created_at: "" },
      "jwt-token"
    );
    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.nickname).toBe("Test");
  });

  it("logout 清除状态", () => {
    useAuthStore.getState().login(
      { id: "1", phone: "138****8000", nickname: "Test", created_at: "" },
      "jwt-token"
    );
    useAuthStore.getState().logout();
    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
  });
});
```

**步骤 2：运行测试 — 失败**

```bash
pnpm vitest run src/__tests__/stores/authStore.test.ts
```

**步骤 3：实现 authStore.ts**

创建 `web/src/stores/authStore.ts`：

```typescript
import { create } from "zustand";
import { setToken, clearToken } from "@/lib/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, token) => {
    setToken(token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    clearToken();
    set({ user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
```

**步骤 4：运行测试 — 通过**

```bash
pnpm vitest run src/__tests__/stores/authStore.test.ts
```

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add auth store with zustand"
```

---

### 任务 8：MSW 配置 + Mock 数据

**文件：**
- 创建：`web/src/mocks/browser.ts`
- 创建：`web/src/mocks/handlers.ts`
- 创建：`web/src/mocks/data/users.ts`
- 创建：`web/src/mocks/data/claws.ts`
- 创建：`web/src/mocks/data/transactions.ts`
- 创建：`web/public/mockServiceWorker.js`

**步骤 1：安装 MSW**

```bash
cd web
pnpm add -D msw
pnpm dlx msw init public/ --save
```

**步骤 2：创建 Mock 数据**

创建 `web/src/mocks/data/claws.ts`：

```typescript
import type { Claw } from "@/types";

export const mockClaws: Claw[] = [
  {
    id: "claw-001",
    owner_id: "user-001",
    name: "TranslateBot",
    description: "A translation agent that supports 50+ languages with high accuracy.",
    capabilities: [
      { name: "translate", description: "Translate text between languages" },
      { name: "detect-language", description: "Detect the language of input text" },
    ],
    tags: ["nlp", "translate", "multilingual"],
    pricing: { model: "per_call", amount: 5, description: "每次调用 5 积分" },
    status: "online",
    rating_avg: 0,
    rating_count: 0,
    total_calls: 142,
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-04T10:00:00Z",
  },
  {
    id: "claw-002",
    owner_id: "user-002",
    name: "CodeReviewer",
    description: "Automated code review with security analysis and best practice suggestions.",
    capabilities: [
      { name: "review-code", description: "Review code for issues" },
      { name: "suggest-fix", description: "Suggest code fixes" },
    ],
    tags: ["dev", "code-review", "security"],
    pricing: { model: "per_call", amount: 10, description: "每次调用 10 积分" },
    status: "online",
    rating_avg: 0,
    rating_count: 0,
    total_calls: 89,
    created_at: "2026-03-02T10:00:00Z",
    updated_at: "2026-03-04T11:00:00Z",
  },
  {
    id: "claw-003",
    owner_id: "user-001",
    name: "DataExtractor",
    description: "Extract structured data from unstructured documents and web pages.",
    capabilities: [
      { name: "extract-data", description: "Extract structured data" },
    ],
    tags: ["data", "extraction", "automation"],
    pricing: { model: "per_call", amount: 8, description: "每次调用 8 积分" },
    status: "offline",
    rating_avg: 0,
    rating_count: 0,
    total_calls: 56,
    created_at: "2026-03-03T06:00:00Z",
    updated_at: "2026-03-04T09:00:00Z",
  },
];
```

类似地创建 `users.ts`（mockUser, mockWallet, mockApiKeys）和 `transactions.ts`（mockTransactions）。

**步骤 3：创建 MSW handlers**

创建 `web/src/mocks/handlers.ts`：

```typescript
import { http, HttpResponse } from "msw";
import { mockClaws } from "./data/claws";
// 导入其他 mock 数据...

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://180.76.244.208:8080/v1";

export const handlers = [
  // 认证
  http.post(`${BASE}/auth/send-code`, () => {
    return HttpResponse.json({ code: 0, data: null, message: "verification code sent" });
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { phone: string; code: string };
    if (body.code !== "123456") {
      return HttpResponse.json({ code: 40001, data: null, message: "invalid code" });
    }
    return HttpResponse.json({
      code: 0,
      data: {
        token: "mock-jwt-token-xxx",
        user: { id: "user-001", phone: body.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"), nickname: "User_mock", created_at: new Date().toISOString() },
      },
      message: "ok",
    });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      code: 0,
      data: { id: "user-001", phone: "138****8000", nickname: "User_mock", created_at: "2026-03-04T12:00:00Z" },
      message: "ok",
    });
  }),

  // Claws
  http.get(`${BASE}/claws`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("page_size") || "20");

    let filtered = [...mockClaws];
    if (q) {
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q))
      );
    }

    return HttpResponse.json({
      code: 0,
      data: { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, page_size: pageSize },
      message: "ok",
    });
  }),

  http.get(`${BASE}/claws/:id`, ({ params }) => {
    const claw = mockClaws.find((c) => c.id === params.id);
    if (!claw) return HttpResponse.json({ code: 40401, data: null, message: "claw not found" }, { status: 404 });
    return HttpResponse.json({ code: 0, data: claw, message: "ok" });
  }),

  // /claws/mine — 当前后端仅接受 API Key，JWT 会返回 401
  http.get(`${BASE}/claws/mine`, ({ request }) => {
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer clw_")) {
      return HttpResponse.json(
        { code: 40100, data: null, message: "unauthorized: API Key required" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      code: 0,
      data: { items: mockClaws.slice(0, 2), total: 2, page: 1, page_size: 20 },
      message: "ok",
    });
  }),

  // 钱包 —— 使用闭包共享可变余额，使 topup 后 GET /wallets/me 能反映最新值
  // 导出 resetMockBalance 供 test-setup.ts 的 afterEach 调用，避免测试顺序依赖
  ...(() => {
    const INITIAL_BALANCE = 1000.0;
    let mockBalance = INITIAL_BALANCE;
    // 重置函数：在 afterEach 中调用以恢复初始余额
    (globalThis as any).__resetMockBalance = () => { mockBalance = INITIAL_BALANCE; };
    return [
      http.get(`${BASE}/wallets/me`, () => {
        return HttpResponse.json({
          code: 0,
          data: { balance: mockBalance },
          message: "ok",
        });
      }),
      http.post(`${BASE}/wallets/topup`, async ({ request }) => {
        const body = (await request.json()) as { amount: number };
        mockBalance += body.amount;
        return HttpResponse.json({
          code: 0,
          data: { balance: mockBalance },
          message: "ok",
        });
      }),
    ];
  })(),

  // 交易记录
  http.get(`${BASE}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("page_size") || "20");
    return HttpResponse.json({
      code: 0,
      data: {
        items: [
          { id: "tx-001", type: "topup", amount: 100, memo: "充值", created_at: "2026-03-04T12:00:00Z" },
          { id: "tx-002", type: "escrow_hold", session_id: "sess-001", from_id: "user-001", amount: -10, memo: "translator-pro: escrow hold", created_at: "2026-03-04T12:05:00Z" },
        ],
        total: 2,
        page,
        page_size: pageSize,
      },
      message: "ok",
    });
  }),

  // API Keys
  http.get(`${BASE}/api-keys`, () => {
    return HttpResponse.json({
      code: 0,
      data: {
        items: [
          { id: "key-001", key_prefix: "clw_mock", name: "My Key", last_used_at: "2026-03-04T10:00:00Z", created_at: "2026-03-01T00:00:00Z" },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
      message: "ok",
    });
  }),

  http.post(`${BASE}/api-keys`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      code: 0,
      data: { id: "key-002", key: "clw_mock_newkey456", key_prefix: "clw_mock", name: body.name, created_at: new Date().toISOString() },
      message: "ok",
    });
  }),

  http.delete(`${BASE}/api-keys/:id`, () => {
    return HttpResponse.json({ code: 0, data: null, message: "ok" });
  }),
];
```

**步骤 4：创建 Node 端 server（Vitest 行为测试用）**

创建 `web/src/mocks/server.ts`：

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
export function resetMockBalance() {
  (globalThis as any).__resetMockBalance?.();
}
```

**步骤 5：激活 test-setup.ts 中的 MSW 接入**

回到 `web/src/test-setup.ts`，取消任务 1 中预留的注释：

```typescript
import "@testing-library/jest-dom/vitest";
import { server, resetMockBalance } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); resetMockBalance(); });
afterAll(() => server.close());
```

> 此时 `mocks/server.ts` 已存在，import 不再报错。
> `resetMockBalance()` 在每个测试后将闭包余额重置为 1000，消除测试顺序依赖。

**步骤 6：创建浏览器 worker（开发态用）**

创建 `web/src/mocks/browser.ts`：

```typescript
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

**步骤 7：在开发环境初始化 MSW**

在根布局或 Provider 组件中添加 MSW 初始化逻辑。通过 `NEXT_PUBLIC_MOCK=true` 控制开关。

**步骤 8：验证 MSW 在浏览器中拦截请求**

```bash
NEXT_PUBLIC_MOCK=true pnpm dev
```

打开浏览器开发者工具 → 控制台应显示 `[MSW] Mocking enabled`。Network 面板应显示被拦截的请求。

**步骤 9：提交**

```bash
git add .
git commit -m "feat(web): add MSW with mock handlers for all API endpoints"
```

---

## 阶段 3：认证与布局

### 任务 9：TanStack Query 配置 + 认证 Hooks

**文件：**
- 创建：`web/src/lib/providers.tsx`
- 创建：`web/src/hooks/useAuth.ts`
- 测试：`web/src/__tests__/hooks/useAuth.test.ts`

**步骤 1：安装 TanStack Query**

```bash
cd web && pnpm add @tanstack/react-query
```

**步骤 2：创建 QueryClient Provider**

创建 `web/src/lib/providers.tsx`：

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

将其接入 `web/src/app/[locale]/layout.tsx`。

**步骤 3：编写 useAuth hook 的失败测试**

创建 `web/src/__tests__/hooks/useAuth.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useAuth";
import React from "react";

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe("useCurrentUser", () => {
  it("导出为函数", () => {
    expect(typeof useCurrentUser).toBe("function");
  });
});

// ⚠️ 行为级测试见任务 19.5（MSW + Provider 就绪后实施）
```

**步骤 4：实现 useAuth hook**

创建 `web/src/hooks/useAuth.ts`：

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { User, LoginRequest, LoginResponse, SendCodeRequest } from "@/types";

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await unwrap<User>(api.get("auth/me"));
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useSendCode() {
  return useMutation({
    mutationFn: (data: SendCodeRequest) =>
      api.post("auth/send-code", { json: data }).json(),
  });
}

export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await unwrap<LoginResponse>(
        api.post("auth/login", { json: data })
      );
      login(result.user, result.token);
      return result;
    },
  });
}
```

**步骤 5：运行测试 — 通过**

```bash
pnpm vitest run src/__tests__/hooks/useAuth.test.ts
```

**步骤 6：提交**

```bash
git add .
git commit -m "feat(web): add TanStack Query provider and auth hooks"
```

---

### 任务 10：登录页面

**文件：**
- 创建：`web/src/app/[locale]/login/page.tsx`
- 测试：`web/src/__tests__/pages/login.test.tsx`

**步骤 1：安装 react-hook-form + zod**

```bash
cd web && pnpm add react-hook-form @hookform/resolvers zod
```

**步骤 2：编写登录页面的失败测试**

创建 `web/src/__tests__/pages/login.test.tsx`：

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/[locale]/login/page";

// 先用导出检查确保模块可加载（MSW 就绪前可运行）
describe("LoginPage", () => {
  it("导出为函数组件", () => {
    expect(typeof LoginPage).toBe("function");
  });
});

// ⚠️ 行为级测试见任务 19.5（MSW + Provider 就绪后实施）
```

**步骤 3：实现登录页面**

创建 `web/src/app/[locale]/login/page.tsx`：

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useSendCode, useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const phoneSchema = z.object({
  phone: z.string().min(11, "Invalid phone number").max(11),
});

const loginSchema = z.object({
  phone: z.string().min(11).max(11),
  code: z.string().length(6, "Code must be 6 digits"),
});

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");

  const sendCode = useSendCode();
  const login = useLogin();

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm({ resolver: zodResolver(loginSchema) });

  const handleSendCode = phoneForm.handleSubmit(async (data) => {
    await sendCode.mutateAsync({ phone: data.phone });
    setPhone(data.phone);
    setStep("code");
  });

  const handleLogin = codeForm.handleSubmit(async (data) => {
    await login.mutateAsync({ phone, code: data.code });
    router.push("/dashboard");
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("loginTitle")}</h1>
          <p className="text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              placeholder={t("phone")}
              {...phoneForm.register("phone")}
            />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-red-500">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={sendCode.isPending}>
              {t("sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-sm text-muted-foreground">{phone}</p>
            <Input
              placeholder={t("code")}
              {...codeForm.register("code")}
              defaultValue=""
            />
            {codeForm.formState.errors.code && (
              <p className="text-sm text-red-500">
                {codeForm.formState.errors.code.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {t("login")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
```

**步骤 4：在浏览器中验证**

访问 `http://localhost:3000/en/login` — 应显示暗色主题的登录表单。

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add login page with phone + verification code"
```

---

### 任务 11：AuthGuard + 全局布局

**文件：**
- 创建：`web/src/components/common/AuthGuard.tsx`
- 创建：`web/src/components/layout/Header.tsx`
- 创建：`web/src/components/common/LocaleSwitcher.tsx`
- 修改：`web/src/app/[locale]/layout.tsx`

**步骤 1：实现 AuthGuard**

创建 `web/src/components/common/AuthGuard.tsx`：

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const { isLoading } = useCurrentUser();

  if (!token) return null;
  if (isLoading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  return <>{children}</>;
}
```

**步骤 2：实现 Header**

创建 `web/src/components/layout/Header.tsx`：

```tsx
"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const t = useTranslations("common");
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/market" className="text-lg font-bold text-primary">
          {t("appName")}
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/market" className="text-foreground hover:text-primary transition-colors">
            {t("market")}
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                {t("dashboard")}
              </Link>
              <Link href="/transactions" className="text-foreground hover:text-primary transition-colors">
                {t("transactions")}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              {user?.nickname}
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">{t("login")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

**步骤 3：实现 LocaleSwitcher**

创建 `web/src/components/common/LocaleSwitcher.tsx`：

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const next = locale === "en" ? "zh" : "en";
    // next-intl 的 useRouter 自动处理 locale 前缀
    router.replace(pathname, { locale: next });
  };

  return (
    <Button variant="ghost" size="sm" onClick={switchLocale}>
      {locale === "en" ? "中" : "EN"}
    </Button>
  );
}
```

**步骤 4：更新语言布局**

将 Header + Providers 接入 `web/src/app/[locale]/layout.tsx`。

**步骤 5：在浏览器中验证**

确认 Header 正确渲染，包含导航链接、主题切换、语言切换。

**步骤 6：提交**

```bash
git add .
git commit -m "feat(web): add AuthGuard, Header, and global layout"
```

---

## 阶段 4：市场页面

### 任务 12：Claw 查询 Hooks

**文件：**
- 创建：`web/src/hooks/useClaws.ts`
- 测试：`web/src/__tests__/hooks/useClaws.test.ts`

**步骤 1：编写测试**

```typescript
import { describe, it, expect } from "vitest";
import { useClawList, useClawDetail } from "@/hooks/useClaws";

describe("useClaws hooks", () => {
  it("useClawList 已导出", () => {
    expect(typeof useClawList).toBe("function");
  });
  it("useClawDetail 已导出", () => {
    expect(typeof useClawDetail).toBe("function");
  });
});
```

**步骤 2：实现**

创建 `web/src/hooks/useClaws.ts`：

```typescript
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api, unwrap, unwrapPaged } from "@/lib/api";
import type { Claw, ClawSearchParams, PagedData } from "@/types";

export function useClawList(params: ClawSearchParams) {
  return useInfiniteQuery({
    queryKey: ["claws", params],
    queryFn: async ({ pageParam = 1 }) => {
      return unwrapPaged<Claw>(
        api.get("claws", {
          searchParams: { ...params, page: pageParam, page_size: params.page_size || 12 },
        })
      );
    },
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useClawDetail(id: string) {
  return useQuery({
    queryKey: ["claws", id],
    queryFn: () => unwrap<Claw>(api.get(`claws/${id}`)),
    enabled: !!id,
  });
}

// ⚠️ 依赖后端为 GET /claws/mine 增加 JWT 支持（见文档顶部阻塞项说明）
// 后端未改之前此 hook 会收到 401，MyClawList 组件需处理 error 状态并显示提示
export function useMyClaws() {
  return useQuery({
    queryKey: ["claws", "mine"],
    queryFn: () => unwrapPaged<Claw>(api.get("claws/mine")),
    retry: false, // 后端尚未支持 JWT，已知会 401，无需重试
  });
}
```

**步骤 3：测试并提交**

```bash
pnpm vitest run src/__tests__/hooks/useClaws.test.ts
git add . && git commit -m "feat(web): add claw query hooks with infinite scroll"
```

---

### 任务 13：ClawCard + 市场页面

**文件：**
- 创建：`web/src/components/market/ClawCard.tsx`
- 创建：`web/src/components/market/ClawSearch.tsx`
- 修改：`web/src/app/[locale]/market/page.tsx`

**步骤 1：实现 ClawCard（EvoMap 风格暗色卡片）**

创建 `web/src/components/market/ClawCard.tsx`：

```tsx
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { Claw } from "@/types";

interface ClawCardProps {
  claw: Claw;
}

export function ClawCard({ claw }: ClawCardProps) {
  const t = useTranslations("market");

  return (
    <Link href={`/market/${claw.id}`}>
      <div className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {claw.name}
          </h3>
          <Badge variant={claw.status === "online" ? "default" : "secondary"}>
            {claw.status === "online" ? t("online") : t("offline")}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {claw.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {claw.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{claw.total_calls} {t("calls")}</span>
          <span>{claw.pricing ? `${claw.pricing.amount} ${t("creditsPerCall")}` : "--"}</span>
          <span>{t("rating")}: {claw.rating_avg > 0 ? claw.rating_avg.toFixed(1) : "--"}</span>
        </div>
      </div>
    </Link>
  );
}
```

**步骤 2：实现 ClawSearch**

创建 `web/src/components/market/ClawSearch.tsx`：

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

interface ClawSearchProps {
  onSearch: (query: string) => void;
  onTagClick: (tag: string) => void;
}

const HOT_TAGS = ["translate", "code", "data", "automation", "nlp", "security"];

export function ClawSearch({ onSearch, onTagClick }: ClawSearchProps) {
  const t = useTranslations("market");
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-10"
        />
      </form>
      <div className="flex flex-wrap gap-2">
        {HOT_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**步骤 3：实现带无限滚动的市场页面**

创建 `web/src/app/[locale]/market/page.tsx`：

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useClawList } from "@/hooks/useClaws";
import { ClawCard } from "@/components/market/ClawCard";
import { ClawSearch } from "@/components/market/ClawSearch";
import { Button } from "@/components/ui/button";
import type { ClawSearchParams } from "@/types";

export default function MarketPage() {
  const t = useTranslations("market");
  const [params, setParams] = useState<ClawSearchParams>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useClawList(params);

  const claws = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t("title")}</h1>

      <ClawSearch
        onSearch={(q) => setParams((prev) => ({ ...prev, q: q || undefined }))}
        onTagClick={(tag) => setParams((prev) => ({ ...prev, tags: tag }))}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {claws.map((claw) => (
          <ClawCard key={claw.id} claw={claw} />
        ))}
      </div>

      {isLoading && (
        <p className="mt-8 text-center text-muted-foreground">{t("loading")}</p>
      )}

      {!isLoading && claws.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">{t("noResults")}</p>
      )}

      {hasNextPage && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? t("loading") : t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**步骤 4：使用 MSW 在浏览器中验证**

访问 `http://localhost:3000/en/market` — 应显示搜索栏、标签筛选和 3 个暗色主题的 Claw 卡片。

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add Claw market page with search, cards, and infinite scroll"
```

---

### 任务 14：Claw 详情页

**文件：**
- 创建：`web/src/components/market/AgentCardDetail.tsx`
- 修改：`web/src/app/[locale]/market/[id]/page.tsx`

**步骤 1：实现 AgentCardDetail**

完整的 Agent Card 展示：名称、描述、能力列表（含 input/output schema）、标签、定价、状态、统计数据。

**步骤 2：实现详情页**

创建 `web/src/app/[locale]/market/[id]/page.tsx`：

```tsx
"use client";

import { useParams } from "next/navigation";
import { useClawDetail } from "@/hooks/useClaws";
import { AgentCardDetail } from "@/components/market/AgentCardDetail";

export default function ClawDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: claw, isLoading, error } = useClawDetail(id);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error || !claw) return <div className="p-8 text-red-500">Claw not found</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AgentCardDetail claw={claw} />
    </div>
  );
}
```

**步骤 3：提交**

```bash
git add .
git commit -m "feat(web): add Claw detail page with AgentCard display"
```

---

## 阶段 5：控制台

### 任务 15：钱包与交易 Hooks

**文件：**
- 创建：`web/src/hooks/useWallet.ts`
- 创建：`web/src/hooks/useTransactions.ts`

**步骤 1：实现 useWallet**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Wallet, TopupRequest } from "@/types";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet", "me"],
    queryFn: () => unwrap<Wallet>(api.get("wallets/me")),
  });
}

export function useTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TopupRequest) =>
      unwrap<Wallet>(api.post("wallets/topup", { json: data })),  // 充值后返回更新的余额
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
```

**步骤 2：实现 useTransactions**

```typescript
import { useQuery } from "@tanstack/react-query";
import { api, unwrapPaged } from "@/lib/api";
import type { Transaction, TransactionType } from "@/types";

interface TxParams {
  type?: TransactionType;
  page?: number;
  page_size?: number;
}

export function useTransactions(params: TxParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () =>
      unwrapPaged<Transaction>(
        api.get("transactions", { searchParams: { ...params } })
      ),
  });
}
```

**步骤 3：提交**

```bash
git add .
git commit -m "feat(web): add wallet and transaction query hooks"
```

---

### 任务 16：API Key Hooks + 管理组件

**文件：**
- 创建：`web/src/hooks/useApiKeys.ts`
- 创建：`web/src/components/dashboard/ApiKeyManager.tsx`

**步骤 1：实现 useApiKeys hook**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap, unwrapPaged } from "@/lib/api";
import type { ApiKey, CreateApiKeyRequest } from "@/types";

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => unwrapPaged<ApiKey>(api.get("api-keys")),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) =>
      unwrap<ApiKey>(api.post("api-keys", { json: data })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap<void>(api.delete(`api-keys/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
```

**步骤 2：实现 ApiKeyManager**

创建 `web/src/components/dashboard/ApiKeyManager.tsx`：

API Key 列表展示 `key_prefix + "..." + name`。注意 `useApiKeys()` 返回分页数据（`PagedData<ApiKey>`），列表从 `data.items` 获取。点击创建按钮弹出 Dialog，创建成功后仅显示一次完整 Key 并支持复制到剪贴板。删除操作带确认 Dialog。使用 shadcn/ui 的 Dialog、Button、Input 组件。

**步骤 3：提交**

```bash
git add .
git commit -m "feat(web): add API key management with create/delete"
```

---

### 任务 17：控制台页面

**文件：**
- 创建：`web/src/components/dashboard/BalanceCard.tsx`
- 创建：`web/src/components/dashboard/MyClawList.tsx`
- 创建：`web/src/components/dashboard/RecentTransactions.tsx`
- 修改：`web/src/app/[locale]/dashboard/page.tsx`

**步骤 1：实现 BalanceCard**

大字号余额展示，使用 `useWallet()`。带跳转至 `/topup` 的链接（使用 `@/i18n/routing` 的 `Link` 组件，自动处理 locale 前缀）。

**步骤 2：实现 MyClawList**

展示用户的 Claw 列表，数据来自 `useMyClaws()`。显示名称、状态徽章、调用次数。**需处理 error 状态**：若后端尚未支持 JWT 调用 `/claws/mine`（返回 401），显示友好提示「此功能需要后端升级，请联系 Part A 负责人」，而非空白或报错页面。

**步骤 3：实现 RecentTransactions**

展示最近 5 条交易，数据来自 `useTransactions({ page_size: 5 })`。显示时间、类型徽章、金额（+/-）、备注。带跳转至 `/transactions` 的链接（使用 `@/i18n/routing` 的 `Link` 组件）。

**步骤 4：实现控制台页面**

创建 `web/src/app/[locale]/dashboard/page.tsx`：

```tsx
"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MyClawList } from "@/components/dashboard/MyClawList";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">{t("title")}</h1>

        <div className="mb-8">
          <BalanceCard />
        </div>

        <Tabs defaultValue="claws">
          <TabsList>
            <TabsTrigger value="claws">{t("myClaws")}</TabsTrigger>
            <TabsTrigger value="api-keys">{t("apiKeys")}</TabsTrigger>
          </TabsList>
          <TabsContent value="claws">
            <MyClawList />
          </TabsContent>
          <TabsContent value="api-keys">
            <ApiKeyManager />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <RecentTransactions />
        </div>
      </div>
    </AuthGuard>
  );
}
```

**步骤 5：在浏览器中验证**

登录 → 控制台显示余额、Claws/API Keys 标签页、最近交易。

**步骤 6：提交**

```bash
git add .
git commit -m "feat(web): add dashboard page with balance, claws, API keys, transactions"
```

---

## 阶段 6：交易记录与充值

### 任务 18：交易记录页面（TanStack Table）

**文件：**
- 修改：`web/src/app/[locale]/transactions/page.tsx`

**步骤 1：安装 TanStack Table**

```bash
cd web && pnpm add @tanstack/react-table
```

**步骤 2：实现交易记录页面**

表格列：时间、类型（徽章）、金额（正数绿色/负数红色）、备注。类型筛选器（全部/充值/担保冻结/担保放款/担保退款）。分页控件。使用 `useTransactions()` hook。包裹在 `AuthGuard` 内。

**步骤 3：提交**

```bash
git add .
git commit -m "feat(web): add transactions page with TanStack Table"
```

---

### 任务 19：充值页面

**文件：**
- 修改：`web/src/app/[locale]/topup/page.tsx`

**步骤 1：实现充值页面**

预设金额：[10, 50, 100, 500]。自定义金额输入框。确认按钮调用 `useTopup()`。成功后通过 Sonner 弹出 Toast 提示。包裹在 `AuthGuard` 内。

**步骤 2：提交**

```bash
git add .
git commit -m "feat(web): add topup page with preset and custom amounts"
```

---

### 任务 19.5：组件行为级测试（MSW + Provider）

> 此任务在 MSW mock（任务 7）和所有页面组件就绪后执行，将初期的导出检查升级为真正的行为验证。

**文件：**
- 修改：`web/src/__tests__/pages/login.test.tsx`
- 修改：`web/src/__tests__/hooks/useAuth.test.ts`
- 创建：`web/src/__tests__/components/ClawCard.test.tsx`
- 创建：`web/src/__tests__/components/ApiKeyManager.test.tsx`
- 创建：`web/src/__tests__/hooks/useWallet.test.ts`

**步骤 1：创建测试用 Provider wrapper**

创建 `web/src/__tests__/helpers/test-utils.tsx`：

```tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

export function createTestWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
```

**步骤 2：补充 LoginPage 行为测试**

在 `login.test.tsx` 中增加（需 MSW 拦截 `/auth/send-code`）：

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createTestWrapper } from "../helpers/test-utils";

describe("LoginPage 行为", () => {
  it("渲染后显示手机号输入框和发送验证码按钮", () => {
    render(<LoginPage />, { wrapper: createTestWrapper() });
    expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("输入不合法手机号后提交显示校验错误", async () => {
    render(<LoginPage />, { wrapper: createTestWrapper() });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });
});
```

**步骤 3：补充 useAuth 行为测试**

在 `useAuth.test.ts` 中增加（需 MSW 拦截 `/auth/me`）：

```typescript
import { createTestWrapper } from "../helpers/test-utils";

describe("useCurrentUser 行为", () => {
  it("有 token 时发起 GET /auth/me 并返回用户数据", async () => {
    localStorage.setItem("token", "test-jwt");
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createTestWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.phone).toBeDefined();
  });

  it("无 token 时 query 处于 disabled 状态", () => {
    localStorage.removeItem("token");
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createTestWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
```

**步骤 4：创建 ClawCard 行为测试**

```tsx
// web/src/__tests__/components/ClawCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ClawCard } from "@/components/market/ClawCard";
import { createTestWrapper } from "../helpers/test-utils";

const mockClaw = {
  id: "claw-001", owner_id: "u1", name: "TestBot",
  description: "A test agent", capabilities: [], tags: ["test"],
  pricing: { model: "per_call" as const, amount: 5, description: "5 credits" },
  status: "online" as const, rating_avg: 4.5, rating_count: 10,
  total_calls: 100, created_at: "", updated_at: "",
};

describe("ClawCard", () => {
  it("显示 Claw 名称和定价", () => {
    render(<ClawCard claw={mockClaw} />, { wrapper: createTestWrapper() });
    expect(screen.getByText("TestBot")).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("显示 online 状态徽章", () => {
    render(<ClawCard claw={mockClaw} />, { wrapper: createTestWrapper() });
    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });
});
```

**步骤 5：创建 ApiKeyManager 行为测试**

```tsx
// web/src/__tests__/components/ApiKeyManager.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";
import { createTestWrapper } from "../helpers/test-utils";

describe("ApiKeyManager", () => {
  it("渲染 API Key 列表", async () => {
    render(<ApiKeyManager />, { wrapper: createTestWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/clw_/)).toBeInTheDocument();
    });
  });

  it("点击创建按钮打开 Dialog", async () => {
    render(<ApiKeyManager />, { wrapper: createTestWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
```

**步骤 6：创建 useWallet 行为测试**

```typescript
// web/src/__tests__/hooks/useWallet.test.ts
import { renderHook, waitFor, act } from "@testing-library/react";
import { useWallet, useTopup } from "@/hooks/useWallet";
import { createTestWrapper } from "../helpers/test-utils";

describe("useWallet", () => {
  it("获取钱包余额", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper: createTestWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBeGreaterThanOrEqual(0);
  });
});

describe("useTopup", () => {
  it("充值成功后更新余额", async () => {
    const { result } = renderHook(() => useTopup(), { wrapper: createTestWrapper() });
    act(() => {
      result.current.mutate({ amount: 100 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBe(1100);
  });
});
```

**步骤 7：运行所有测试并提交**

```bash
pnpm vitest run
git add . && git commit -m "test(web): add behavioral tests for login, auth, ClawCard, ApiKeyManager, wallet"
```

---

## 阶段 7：完善与部署

### 任务 20：E2E 测试（Playwright）

**文件：**
- 创建：`web/e2e/login.spec.ts`
- 创建：`web/e2e/market.spec.ts`
- 创建：`web/e2e/dashboard.spec.ts`
- 创建：`web/e2e/transactions.spec.ts`
- 创建：`web/e2e/topup.spec.ts`
- 创建：`web/playwright.config.ts`

**步骤 1：安装 Playwright**

```bash
cd web && pnpm add -D @playwright/test && pnpm dlx playwright install
```

**步骤 2：编写关键路径 E2E 测试**

- `login.spec.ts`：访问 /login → 输入手机号 → 输入验证码 → 跳转到 /dashboard
- `market.spec.ts`：访问 /market → 看到 Claw 卡片 → 搜索 → 点击卡片 → 进入详情页
- `dashboard.spec.ts`：登录后访问 /dashboard → 看到余额卡片 → 切换 Claws/API Keys 标签 → 看到最近交易
- `transactions.spec.ts`：登录后访问 /transactions → 看到交易表格 → 类型筛选 → 分页切换
- `topup.spec.ts`：登录后访问 /topup → 选择预设金额 → 点击充值 → Toast 提示成功 → 余额更新

**步骤 3：运行 E2E 测试**

```bash
NEXT_PUBLIC_MOCK=true pnpm build && pnpm dlx playwright test
```

**步骤 4：提交**

```bash
git add .
git commit -m "test(web): add Playwright E2E tests for login, market, dashboard, transactions, topup"
```

---

### 任务 21：Dockerfile + docker-compose 集成

**文件：**
- 创建：`web/Dockerfile`
- 修改：`docker-compose.yml`

**步骤 1：创建 Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**步骤 2：更新 next.config.ts 以启用 standalone 输出**

```typescript
const nextConfig = {
  output: "standalone",
};
```

**步骤 3：在 docker-compose.yml 中添加 web 服务**

```yaml
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://server:8080/v1
    depends_on:
      - server
```

**步骤 4：本地构建并测试 Docker**

```bash
cd web && docker build -t talentclaw-web .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE=http://180.76.244.208:8080/v1 talentclaw-web
```

**步骤 5：提交**

```bash
git add .
git commit -m "feat(web): add Dockerfile and docker-compose integration"
```

---

### 任务 22：从 MSW 切换到真实 API

**文件：**
- 修改：`web/src/lib/providers.tsx`（移除 MSW 初始化）
- 修改：`web/.env.production`

**步骤 1：创建生产环境配置**

```
NEXT_PUBLIC_API_BASE=http://180.76.244.208:8080/v1
NEXT_PUBLIC_MOCK=false
```

**步骤 2：MSW 条件加载**

确保 MSW 仅在 `NEXT_PUBLIC_MOCK=true` 时初始化。

**步骤 3：对接真实后端测试**

使用真实 API 运行，验证所有页面功能正常。

**步骤 4：提交**

```bash
git add .
git commit -m "feat(web): configure production API and disable MSW"
```

---

## 总结

| 阶段 | 任务 | 关键交付物 |
|------|------|-----------|
| 1. 初始化 | 1-4 | Next.js + shadcn/ui + 主题 + 国际化 |
| 2. 核心库 | 5-8 | 类型定义、API 客户端、认证 Store、MSW Mock |
| 3. 认证与布局 | 9-11 | 登录页面、AuthGuard、Header |
| 4. 市场页面 | 12-14 | ClawCard、市场列表、详情页 |
| 5. 控制台 | 15-17 | 钱包/交易 Hooks、API Key 管理、控制台 |
| 6. 交易与充值 | 18-19.5 | 交易记录表格、充值页面、**组件行为级测试** |
| 7. 部署 | 20-22 | E2E 测试（含 topup）、Dockerfile、真实 API 切换 |

**合计：23 个任务（含 19.5 行为测试），约 3 周开发 + 1 周集成测试**
