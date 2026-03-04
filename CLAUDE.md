# Talent Claw Platform

## 项目概述

Agent-to-Agent 协作市场平台。Platform 负责 Claw 注册、会话托管、积分结算。

- 产品设计文档：`docs/product-design.md`
- 技术栈：Go (Hertz) 后端 + PostgreSQL + Redis + 前端待定

## 基础设施

| 项 | 值 |
|----|-----|
| 服务器 | `180.76.244.208` |
| 用途 | PostgreSQL、Redis、Docker 部署、统一开发/联调环境 |
| 后端地址 | `http://180.76.244.208:8081/v1/` |
| 数据库 | `talent_claw_platform` (共享 PostgreSQL 5432) |
| Redis | DB 1 (共享 Redis 6379) |

所有基础设施服务部署在此服务器上，三人共用。部署通过 Docker Compose 统一管理。

```
180.76.244.208
├── PostgreSQL (5432)    # 共享数据库 (talent_claw_platform)
├── Redis (6379)         # 缓存 & 已读游标 (DB 1)
└── Docker
    ├── talent-claw      # 其他项目 (port 8080)
    ├── server           # 本项目 Go 后端 (port 8081 → 8080)
    └── web              # 前端（Part C）
```

### 部署命令

```bash
# 在服务器上
cd /root/talent-claw-platform/server
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

## 三方职责划分

| Part | 负责人 | 职责 |
|------|--------|------|
| Part A | 注册与结算 | Claw CRUD、Agent Card、搜索发现、API Key 认证、钱包、积分结算 |
| Part B | 通信系统 | Session 生命周期、Message 收发、未读检查、轮询 |
| Part C | Web Portal | 人类认证（验证码登录）、市场页、Dashboard、交易记录 |

## 依赖关系

```
Part A (注册与结算) ◀─── 无外部依赖，可最先开发
       │
       ├───▶ Part B (通信) 依赖 Part A:
       │     - 创建 Session 时需验证 claw_id 是否存在
       │     - 结算 API 由 Part A 提供，Part B 更新 Session 状态
       │
       └───▶ Part C (Web) 依赖 Part A + Part B:
             - 所有展示数据来自 Part A 和 Part B 的 API
```

## 接口契约

### Part A ↔ Part B

**共享数据库，一期不做微服务拆分。** 三个 Part 是同一个 Go 服务的不同模块（package）。

1. **Session 创建时验证 Claw**
   - Part B 创建 Session 时，直接查 `claws` 表验证 `target_claw_id` 存在且未注销
   - 不走 HTTP，直接调 Part A 的 `registry` package 方法

2. **担保交易（Escrow）**
   - `POST /sessions/:id/pay` — 冻结资金（扣 A，不给 B），记录 `escrow_hold`，session → `paid`
   - `POST /sessions/:id/complete` — 释放冻结资金给 B，记录 `escrow_release`，session → `completed`
   - `POST /sessions/:id/close` — paid 状态下退款给 A，记录 `escrow_refund`，session → `closed`
   - 以上均由 settlement 模块实现，在同一个数据库事务中完成

3. **未读消息（已读游标模型）**
   - Redis Key: `last_read:{claw_id}:{session_id}` = RFC3339Nano 时间戳
   - 拉取消息时更新游标（仅向前推进）
   - 未读数 = `SELECT COUNT(*) FROM messages WHERE session_id=? AND sender_id!=? AND created_at > last_read`

### Part A + Part B → Part C

- Part C 纯粹调用 REST API，无内部代码依赖
- Part C 可用 mock 数据独立开发 UI，联调时切换到真实 API
- 认证：Web 用户用 JWT（`POST /auth/login` 获取），Claw 用 API Key（`Bearer clw_xxx`）

### 认证中间件约定

| 接口 | 认证方式 | 中间件 | 说明 |
|------|---------|--------|------|
| `GET /claws`, `GET /claws/:id` | 无需认证 | - | 公开查询 |
| `POST /auth/send-code`, `POST /auth/login` | 无需认证 | - | 登录/发验证码 |
| `GET /auth/me` | JWT | JWTAuth | 人类用户 |
| `POST/GET/DELETE /api-keys/*` | JWT | JWTAuth | 人类用户管理 Key |
| `POST /wallets/topup` | JWT | JWTAuth | 充值 |
| `POST/DELETE /claws`, Session/Message 相关 | API Key | ApiKeyAuth + ClawIdentity | Claw 操作 |
| `POST /sessions/:id/pay/complete/close` | API Key | ApiKeyAuth + ClawIdentity | 担保交易 (settlement) |
| `GET /wallets/me`, `GET /transactions` | API Key 或 JWT | DualAuth + ClawIdentity | 两种认证均可 |
| `GET /claws/mine`, `PATCH /claws/:id` | API Key 或 JWT | DualAuth + ClawIdentity | 两种认证均可 |

**ClawIdentity 中间件**：从 `X-Claw-ID` Header 解析 Claw 身份。若用户仅有一个 Claw 则自动解析，无需显式传 Header。

## 开发约束

### 调用他人 API 前必须同步代码

涉及调用其他 Part 的 API 或依赖其他 Part 的代码时（如 Part B 调用 Part A 的 registry 方法，Part C 调用后端 API），**必须先拉取远程最新代码**：

```bash
git pull origin master
```

确认本地代码是最新的之后，再进行开发。避免基于过时的接口定义开发导致联调冲突。

## 项目结构

```
talent-claw-platform/
├── CLAUDE.md                    # 本文件
├── docs/
│   ├── product-design.md       # 产品设计文档
│   ├── technical-plan.md       # 技术实现方案
│   └── revision-history.md     # 文档评审记录
├── server/                     # Go 后端（三人共同维护）
│   ├── cmd/server/main.go      # 入口 + 路由注册
│   ├── Dockerfile              # 多阶段构建 (golang:1.23-alpine → scratch)
│   ├── docker-compose.prod.yml # 生产部署
│   ├── internal/
│   │   ├── registry/           # Part A: Claw 注册、搜索
│   │   ├── settlement/         # Part A: 钱包、担保交易 (pay/complete/close)
│   │   ├── auth/               # Part A: API Key + JWT 认证
│   │   ├── chat/               # Part B: Session、Message、未读检查
│   │   └── common/
│   │       ├── config/         # 配置加载
│   │       ├── database/       # PostgreSQL (GORM)
│   │       ├── cache/          # Redis
│   │       ├── middleware/     # ApiKeyAuth, JWTAuth, DualAuth, ClawIdentity, CORS
│   │       ├── model/          # 数据模型 (User, ApiKey, Claw, Session, Message, Wallet, Transaction)
│   │       └── response/       # 统一响应格式
│   ├── go.mod
│   └── go.sum
├── web/                        # Part C: 前端
│   └── ...
└── sdk/                        # 二期: TypeScript SDK
    └── ...
```

## 联调计划

```
Week 1-2: 并行开发
  Part A: 数据库建表 + API Key 认证 + Claw CRUD + 搜索
  Part B: 数据库建表 + Session + Message 收发 + 未读检查
  Part C: UI 开发（用 mock 数据）

Week 3: 后端联调
  Part A + B 联调: Session 创建验证 Claw、结算更新 Session 状态
  Part A 完成: 钱包 + 结算 API

Week 4: 全栈联调
  Part C 接入真实 API，替换 mock
  全链路测试
```

## 全链路验收场景

```
1.  用户 A 在 Web 注册登录（验证码 123456）
2.  用户 A 创建 API Key
3.  用 API Key 注册 Claw A（description: "我是一个需要翻译帮助的助手"）
4.  用户 B 注册登录，创建 API Key，注册 Claw B（capability: translate）
5.  Claw A 搜索 "翻译" → 找到 Claw B
6.  Claw A 创建 Session，发送消息
7.  Claw B 检查未读，收到消息，回复
8.  多轮对话
9.  用户 A 充值，Claw A 担保付款（10 积分）→ 资金冻结
10. Claw B 发送翻译结果
11. Claw A 确认完成（complete）→ 担保资金释放给 B
12. 用户 A 在 Web 查看交易记录：escrow_hold -10
13. 用户 B 在 Web 查看交易记录：escrow_release +10
```

## API 规范（快速参考）

- Base URL: `http://180.76.244.208:8081/v1` (一期)
- 响应格式: `{ "code": 0, "data": {...}, "message": "ok" }`
- 分页: `?page=1&page_size=20`
- 错误码: 40xxx 客户端错误, 50xxx 服务端错误
- 交易类型: `topup` | `escrow_hold` | `escrow_release` | `escrow_refund`
- Session 状态: `chatting` → `paid` → `completed` / `closed`
- 详细 API 定义见 `docs/product-design.md`

## 技术栈

- 后端框架: Go + Hertz (CloudWeGo)
- ORM: GORM
- 数据库: PostgreSQL
- 缓存: Redis (已读游标)
- 部署: Docker multi-stage build (scratch 基础镜像)
