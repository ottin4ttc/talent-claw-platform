# Web Portal (Part C) 实现完成清单

> 日期: 2026-03-05  
> 分支: `codex/web-portal-part-c`

## 1. 对齐文档

- PRD: `prd.md`
- 产品设计: `docs/product-design.md`
- 技术方案: `docs/technical-plan.md`
- Part C 设计: `docs/plans/2026-03-04-web-portal-design.md`
- Part C 实施计划: `docs/plans/2026-03-04-web-portal-implementation.md`

## 2. 页面与功能交付状态

- [x] `/[locale]/login` 手机号 + 验证码登录
- [x] `/[locale]/market` Claw 市场列表、搜索、标签过滤、分页加载
- [x] `/[locale]/market/[id]` Claw 详情页
- [x] `/[locale]/dashboard` 余额、我的 Claw、API Key 管理、最近交易
- [x] `/[locale]/transactions` 交易列表 + 类型筛选 + 分页
- [x] `/[locale]/topup` 充值流程 + 成功反馈
- [x] Header 导航、主题切换、语言切换
- [x] JWT 登录态与受保护页面守卫

## 3. API 与契约对齐

- [x] `ApiResponse<T>` 与分页结构 `PagedData<T>` 统一封装
- [x] `useApiKeys` 使用分页 `data.items` 结构
- [x] Pricing 字段使用 `{ model, amount, description? }`
- [x] Transaction type 使用 `topup | escrow_hold | escrow_release | escrow_refund`
- [x] i18n 文案更新为担保冻结/放款/退款
- [x] 全局 401 处理按 locale 回跳登录页（默认回退 `en`）
- [x] `/claws/mine` 401 特判豁免（不清 token、不全局跳转）
- [x] `useMyClaws` 已设置 `retry: false` 并在 UI 友好降级

## 4. Mock 与前后端并行能力

- [x] MSW 浏览器端 `setupWorker` 接入
- [x] MSW Node 端 `setupServer` 接入（Vitest）
- [x] 覆盖 handlers:
  - [x] `POST /auth/send-code`
  - [x] `POST /auth/login`
  - [x] `GET /auth/me`
  - [x] `GET /claws`
  - [x] `GET /claws/:id`
  - [x] `GET /claws/mine`（API Key 校验模拟）
  - [x] `GET /wallets/me`
  - [x] `POST /wallets/topup`
  - [x] `GET /transactions`
  - [x] `GET /api-keys`
  - [x] `POST /api-keys`
  - [x] `DELETE /api-keys/:id`
- [x] topup mock 状态闭环（余额可变并可重置）

## 5. 自动化测试交付（按约定）

### 5.1 页面级（Playwright E2E）

- [x] `e2e/login.spec.ts`
- [x] `e2e/market.spec.ts`
- [x] `e2e/dashboard.spec.ts`
- [x] `e2e/transactions.spec.ts`
- [x] `e2e/topup.spec.ts`

### 5.2 组件/行为级（Vitest + Testing Library）

- [x] `LoginPage` 行为测试
- [x] `ClawCard` 行为测试
- [x] `ApiKeyManager` 行为测试
- [x] `useAuth/useCurrentUser` 行为测试
- [x] `useWallet/useTopup` 行为测试
- [x] store 与工具模块测试

## 6. 本地验证结果

- [x] `pnpm lint` 通过
- [x] `pnpm test` 通过
- [x] `pnpm typecheck` 通过
- [x] `pnpm test:e2e` 通过（5/5）

## 7. 已知外部依赖（非前端可独立闭环）

- [ ] 后端将 `GET /claws/mine` 从仅 API Key 扩展为支持 JWT（与 `/wallets/me`、`/transactions` 一致）

> 当前前端已实现兼容降级方案：该接口 401 不触发全局登出，页面展示友好提示。
