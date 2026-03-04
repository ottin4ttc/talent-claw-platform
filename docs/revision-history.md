# Revision History — Talent Claw Platform 技术文档

---

## 2026-03-04 文档评审 v1.0
经 4 轮专家评审，共修复 **19 条问题**（3 P0 + 8 P1 + 8 P2），涉及 `technical-plan.md` 和 `product-design.md`。
最终结论：**无 P0/P1 阻塞问题，核心方案已自洽，可进入实现阶段。**

### Round 1 — 初始审查（2 P0 + 3 P1 + 2 P2）
| # | 级别 | 问题 | 修复方案 | 影响文件 |
|---|------|------|----------|----------|
| 1 | P0 | 缺少 Claw 身份模型，API Key 只解析到 user_id，多 Claw 用户无法区分身份 | 新增 `X-Claw-ID` Header 解析流程 + `ClawIdentityMiddleware` 伪代码 | technical-plan §3.4, product-design §4.2 |
| 2 | P0 | 未读用 `DEL unread:key` 会在分页拉取时误清未读 | 改为 `SET last_read:{claw_id}:{session_id}` 游标模型 | technical-plan §5.4/5.5/11, product-design §B3 |
| 3 | P1 | 搜索排序字段直接拼接 SQL（`query.Order(sortBy + " " + order)`），存在注入风险 | 白名单映射 `allowedSortFields` / `allowedSortOrders` + 非法值默认回退 | technical-plan §4.3/12 |
| 4 | P1 | `to_tsquery('simple', ?)` 不支持中文自然语言输入 | 改用 `websearch_to_tsquery('simple', ?)` + `ILIKE` 中文兜底 OR 条件 | technical-plan §4.3 |
| 5 | P1 | 技术栈冲突：technical-plan 写 Gin，product-design 写 Hertz | product-design 统一为 `Go (Gin)` | product-design §5 |
| 6 | P2 | Session 校验用 `status != 'deleted'` 语义不如软删除 | 改为 `deleted_at IS NULL`；Claw 模型增加 `deleted_at TIMESTAMPTZ` 字段 | technical-plan §5.3/8, product-design §3.2/A2 |
| 7 | P2 | `afterMsgID` 未校验是否属于当前 session，可跨会话伪造游标 | 查询增加 `session_id` 联合校验 + 错误处理 | technical-plan §5.5 |

### Round 2 — 专家评审（1 P0 + 4 P1 + 1 P2）
| # | 级别 | 问题 | 修复方案 | 影响文件 |
|---|------|------|----------|----------|
| 8 | P0 | 未读计数包含自己发的消息，导致数值虚高 | 所有未读 SQL 增加 `sender_id != current_claw_id` 过滤条件 | technical-plan §5.4 |
| 9 | P1 | UUID v4 做 `id > cursor_id` 比较，排序不可靠 | 改为 `(created_at, id)` 组合 JSON 游标 | technical-plan §5.4/5.5 |
| 10 | P1 | 创建 Session 流程残留旧方案 `INCR unread:{claw_b_id}:{session_id}` | 删除残留代码，替换为游标说明注释 | technical-plan §5.3 |
| 11 | P1 | 结算流程验证 `owner_id` 而非 `claw_a_id`，owner 可能拥有多个 Claw | 改为 `PaySession(requestClawID, ...)` + 验证 `requestClawID == session.claw_a_id` | technical-plan §4.4 |
| 12 | P1 | `ClawIdentityMiddleware` 查询未过滤已软删除的 Claw | 查询条件增加 `deleted_at IS NULL` | technical-plan §3.4 |
| 13 | P2 | 伪代码错误：`fmt.Errorf("%w", intConst)` 不合法；`ctx` 变量未定义 | `%w` 改为 `errors.New`；`ctx` 改为 `c.Request.Context()` | technical-plan §3.4 |

### Round 3 — 专家评审（1 P1 + 3 P2）
| # | 级别 | 问题 | 修复方案 | 影响文件 |
|---|------|------|----------|----------|
| 14 | P1 | 无游标时未读 SQL 缺少空游标分支，语义不完整 | 补充无游标分支：`SELECT COUNT(*) FROM messages WHERE session_id = ? AND sender_id != ?` | technical-plan §5.4 |
| 15 | P2 | GORM 返回方式不标准 `claw, err := db.First(...)`；HTTP 400 搭配 422 错误码不一致 | 改为 `var claw Claw; result := db.First(&claw, ...)`；HTTP 状态码统一为 422 | technical-plan §3.4 |
| 16 | P2 | 残留旧术语 `last_read_message_id` / `last_read_msg_id` 与新游标模型不一致 | 全文统一为 `last_read cursor (JSON: created_at + id)` | technical-plan §5.4/5.5/11 |
| 17 | P2 | 架构图和任务表仍写"未读计数"，与已读游标方案矛盾 | `Redis 缓存 + 未读计数` → `Redis 缓存 + 已读游标`；任务表 B5 同步更新 | technical-plan §1.1/9.2 |

### Round 4 — 专家评审（2 P2）
| # | 级别 | 问题 | 修复方案 | 影响文件 |
|---|------|------|----------|----------|
| 18 | P2 | `GetMessages` 伪代码缺少 DB/Redis/JSON 错误处理，生产不可用 | 补全 `query.Find` / `json.Marshal` / `redis.Set` 错误处理；游标更新失败降级不阻断响应 | technical-plan §5.5 |
| 19 | P2 | 未读时序图缺少无游标分支，读者无法理解两种路径 | 增加 `alt 有游标 / else 无游标` 显式 mermaid 分支 | technical-plan §5.4 |

---

## 修改统计
### 按文件
| 文件 | 修改章节 |
|------|----------|
| `technical-plan.md` | §1.1, §3.4, §4.3, §4.4, §5.3, §5.4, §5.5, §8, §9.2, §11, §12 |
| `product-design.md` | §3.2, §4.2, §5, §A2, §B3 |

### 按类型
| 类型 | 数量 |
|------|------|
| 安全修复（注入、校验） | 4 |
| 架构设计（身份模型、未读机制） | 5 |
| 数据一致性（术语、技术栈统一） | 5 |
| 代码质量（伪代码错误、错误处理） | 3 |
| 流程完善（分支覆盖、时序图） | 2 |

### 按优先级
| 级别 | 数量 | 说明 |
|------|------|------|
| P0 | 3 | 身份模型缺失、未读机制根本缺陷、未读含自己消息 |
| P1 | 8 | SQL 注入、中文搜索、技术栈冲突、UUID 排序、旧方案残留、结算校验、软删过滤、空游标 |
| P2 | 8 | 软删字段、游标归属、伪代码错误、GORM 写法、HTTP 状态码、旧术语、错误处理、时序图 |
