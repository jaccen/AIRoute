---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '80f83f12-b91b-4914-8b32-7a855d90fdfb'
  PropagateID: '80f83f12-b91b-4914-8b32-7a855d90fdfb'
  ReservedCode1: '2f911d7a-9c64-4215-adce-43b448b55736'
  ReservedCode2: '2f911d7a-9c64-4215-adce-43b448b55736'
---

<div align="center">

# AIRoute

### 面向国内合规增强的 AI 网关

基于 OmniRoute (v3.8.46) fork，全面适配中国网络环境、数据合规要求与国产云生态。

**237+ Provider · 90+ 免费额度 · 17 种路由策略 · RTK+Caveman 压缩引擎**

---

### 一个入口聚合所有大模型，智能路由择优调度，数据不出境。

**你遇到的问题，AIRoute 来解：**

| 痛点 | AIRoute 怎么解 |
|------|---------------|
| OpenAI/Claude 在国内连不上，换一个 Provider 就得改一版代码 | **统一入口** — 所有 Provider 接入一个 API，下游零改动切换 |
| DeepSeek 便宜但偶尔宕机，Claude 稳但贵，不知道该用谁 | **智能路由** — 17 种策略自动选：优先国产、成本最优、故障自动切换 |
| 想白嫖免费模型，但每个平台要单独注册、单独调接口 | **90+ 免费额度** — 内置免费 Provider，开箱即用，不花一分钱 |
| 用了海外模型，数据出境合规风险大 | **合规底座** — PII 自动脱敏、数据出境管控、强制加密，一个开关 `AIRROUTE_REGION=cn` 全搞定 |
| 多人/多团队共用，成本和权限管不住 | **企业级存储** — SQLCipher/PostgreSQL 双轨，审计日志、熔断限流、多租户就绪 |

**适合谁用？**

- **个人开发者** — 零成本接入 90+ 免费模型，一个 API Key 搞定所有 AI 能力
- **创业团队** — 不用逐个对接 Provider，智能路由自动控成本、保可用
- **企业 IT** — 合规、审计、加密、不出境，满足等保与《数据安全法》要求
- **AI 应用构建者** — Coze/Dify 等 Agent 平台一键接入，MCP 95 工具开箱调用

</div>

---

## 目录

- [项目定位](#项目定位)
- [国内增强特性](#国内增强特性)
- [架构概览](#架构概览)
- [国内特性文件清单](#国内特性文件清单)
- [部署指南](#部署指南)
- [公网暴露（FreeDomain + Cloudflare Named Tunnel）](#公网暴露freedomain--cloudflare-named-tunnel)
- [开发路线图](#开发路线图)
- [快速开始](#快速开始)
- [技术栈](#技术栈)
- [License](#license)

---

## 项目定位

AIRoute 是 [OmniRoute](https://github.com/diegosouzapw/AIRoute) 的国内合规 fork。OmniRoute 是一个开源的 AI Gateway，聚合 237+ LLM Provider、95 种 MCP 工具、17 种路由策略和 10 级 Token 压缩管线。AIRoute 在此基础上：

1. **合规先行** — 满足《个人信息保护法》(PIPL)、《数据安全法》(DSL) 对 PII 脱敏、数据出境管控、强制加密的要求
2. **本地优先** — 默认优先国内 Provider，降低跨境延迟 100-300ms
3. **信创适配** — 华为云盘古、阿里云百炼、腾讯混元、百度千帆等国产大模型一等公民
4. **企业级存储** — SQLCipher / PostgreSQL 双轨可选，满足等保与审计要求

核心开关：`AIRROUTE_REGION=cn`。设置后自动激活全部中国区特性。

---

## 国内增强特性

### P0 — 合规底座（必选）

| 特性 | 说明 | 关键文件 |
|------|------|----------|
| **华为云盘古 Provider** | ModelArts / 盘古大模型接入，满足信创要求 | `open-sse/config/providers/registry/huawei/index.ts` |
| **国产 PII 脱敏** | 中国身份证号(18位)、手机号(11位)、银联卡号自动识别与脱敏 | `src/lib/piiSanitizer.ts`, `src/shared/utils/inputSanitizer.ts` |
| **强制加密** | `AIRROUTE_REGION=cn` 时未配置 `STORAGE_ENCRYPTION_KEY` 拒绝启动 | `src/lib/db/encryption.ts` |
| **区域感知默认值** | 区域敏感配置项支持 `"auto"` 默认值，按 `AIRROUTE_REGION` 自动解析 | `src/shared/constants/featureFlagDefinitions.ts`, `src/shared/utils/featureFlags.ts` |

### P1 — 功能增强

| 特性 | 说明 | 关键文件 |
|------|------|----------|
| **百度/必应中国搜索** | `baidu-search` 与 `bing-cn-search` 搜索 Provider | `open-sse/config/searchRegistry.ts`, `src/shared/constants/providers/search.ts` |
| **数据出境管控** | 域名白名单 + 出境日志记录，符合《数据安全法》要求 | `src/lib/compliance/dataExportControl.ts` |
| **区域感知路由** | 国内 Provider 评分权重自动上浮，跨境 Provider 延迟惩罚 | `open-sse/services/regionProviders.ts`, `open-sse/services/autoCombo/scoring.ts` |
| **策略引擎合规** | 自动注入 `cn-prefer-domestic` / `cn-block-overseas-free-tier` 等策略 | `src/domain/policyEngine.ts` |
| **Coze/Dify 适配层** | Agent 平台集成：RAG、工具调用、多轮工作流委托 | `src/lib/integrations/coze/adapter.ts`, `src/lib/integrations/dify/adapter.ts` |
| **ACK/CCE 部署模板** | 阿里云 ACK / 华为云 CCE 一键部署 YAML，含 HPA/PDB/NetworkPolicy | `deploy/ack/airoute.yaml`, `deploy/cce/airoute.yaml` |

### P2 — 企业级

| 特性 | 说明 | 关键文件 |
|------|------|----------|
| **SQLCipher / PostgreSQL** | 企业级存储层三选一：SQLite(默认) / SQLCipher(中国区) / PostgreSQL(大规模) | `src/lib/db/adapters/sqlcipherAdapter.ts`, `src/lib/db/adapters/pgAdapter.ts` |
| **PG SQL 转译器** | 15+ 自动转换规则：AUTOINCREMENT→SERIAL、datetime→CURRENT_TIMESTAMP 等 | `src/lib/db/pgSqlTranspiler.ts` |
| **PG 迁移覆盖** | FTS5→tsvector/GIN、rowid→SERIAL+触发器 等手工覆盖 | `src/lib/db/migrations_pg/022_add_memory_fts5.sql`, `023_fix_memory_fts_uuid.sql` |
| **MITM 审计日志** | HMAC 链式校验和，防篡改审计所有 MITM 操作 | `src/mitm/mitmAuditLogger.ts` |
| **MITM 作用域限制** | 国内 80+ 金融/政务域名自动绕过；限制 tproxy-decrypt 等高危功能 | `src/mitm/cnScopeLimitation.ts` |
| **MITM DNS 区域感知** | 国内用 AliDNS (223.5.5.5)，海外用 Google DNS (8.8.8.8) | `src/mitm/server.cjs` |
| **国产模型自动同步** | 6 大国产 Provider 模型列表后台轮询同步（6h 间隔，退避重试） | `src/lib/cnProviderModelSync.ts` |
| **Provider modelsUrl** | DeepSeek、豆包、Moonshot、腾讯混元、GLM 增加 modelsUrl 配置 | `open-sse/config/providers/registry/{deepseek,doubao,moonshot,tencent,glm}/index.ts` |

---

## 架构概览

```
┌──────────────────────────────────────────────────────────┐
│     IDE / CLI (Claude Code, Codex, Cursor, Cline …)     │
└─────────────────────────┬────────────────────────────────┘
                          │ http://localhost:20128/v1
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   AIRoute — 智能路由网关                   │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ 区域感知路由  │  │ PIPI 合规层  │  │ 10级压缩管线     │ │
│  │ (CN优先策略) │  │ (脱敏/管控)  │  │ (RTK+Caveman)   │ │
│  └─────────────┘  └─────────────┘  └──────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ 熔断器×3层   │  │ MITM 审计   │  │ MCP(95工具)/A2A  │ │
│  │ (Provider/  │  │ (HMAC链式)  │  │ (Coze/Dify适配)  │ │
│  │  Key/Model) │  │             │  │                  │ │
│  └─────────────┘  └─────────────┘  └──────────────────┘ │
└───────────────┬──────────┬──────────────┬────────────────┘
                ▼          ▼              ▼
        ┌──────────┐ ┌──────────┐ ┌─────────────┐
        │ 国产云    │ │ 国际云    │ │ 免费额度     │
        │ 盘古/百炼 │ │ OpenAI/  │ │ Kiro/Qoder/ │
        │ 混元/千帆 │ │ Claude/  │ │ Pollinations│
        │ DeepSeek │ │ Gemini   │ │ Cloudflare  │
        └──────────┘ └──────────┘ └─────────────┘
```

---

## 国内特性文件清单

以下仅列出 AIRoute 新增/修改的文件（不含 OmniRoute 原有文件）。

### 核心合规

```
src/
├── lib/
│   ├── piiSanitizer.ts                        # [修改] 增加18位身份证、11位手机号、银联卡PII模式
│   ├── compliance/
│   │   └── dataExportControl.ts               # [新增] 数据出境管控：域名白名单+出境日志
│   ├── db/
│   │   ├── encryption.ts                      # [修改] CN区强制加密策略
│   │   ├── core.ts                            # [修改] PG异步初始化路径、pg_dump备份
│   │   ├── pgSqlTranspiler.ts                 # [新增] SQLite→PG SQL自动转译(15+规则)
│   │   ├── pgMigrationRunner.ts               # [新增] PG专用迁移执行器(information_schema)
│   │   ├── migrations_pg/
│   │   │   ├── 022_add_memory_fts5.sql        # [新增] FTS5→tsvector/GIN PG覆盖
│   │   │   └── 023_fix_memory_fts_uuid.sql    # [新增] rowid→SERIAL+PG触发器覆盖
│   │   └── adapters/
│   │       ├── types.ts                       # [修改] SqliteDriverKind扩展postgresql
│   │       ├── driverFactory.ts               # [修改] resolveDbType(), SQLCipher/PG路径
│   │       ├── sqlcipherAdapter.ts             # [新增] SQLCipher完整适配器
│   │       └── pgAdapter.ts                    # [新增] PostgreSQL完整适配器
│   ├── cnProviderModelSync.ts                  # [新增] 国产模型自动同步服务
│   └── integrations/
│       ├── coze/adapter.ts                     # [新增] Coze(扣子) Agent平台适配
│       └── dify/adapter.ts                     # [新增] Dify Agent平台适配
├── mitm/
│   ├── mitmAuditLogger.ts                     # [新增] HMAC链式MITM审计日志
│   ├── cnScopeLimitation.ts                   # [新增] CN区MITM作用域限制(80+域名绕过)
│   ├── manager.ts                             # [修改] CN作用域校验、审计日志集成
│   └── server.cjs                             # [修改] 区域感知DNS(AliDNS/Google)
├── domain/
│   └── policyEngine.ts                        # [修改] 注入cn-prefer-domestic等合规策略
├── shared/
│   ├── constants/
│   │   ├── providers/
│   │   │   ├── apikey/regional.ts             # [修改] 华为/Coze/Dify前端展示字段
│   │   │   ├── search.ts                      # [修改] 百度/必应中国搜索Provider
│   │   │   ├── providers.ts                   # [修改] ENTERPRISE_CLOUD_PROVIDER_IDS
│   │   │   └── featureFlagDefinitions.ts      # [修改] 区域感知"auto"默认值
│   │   └── utils/
│   │       ├── featureFlags.ts                # [修改] isChinaRegion() + "auto"解析
│   │       └── inputSanitizer.ts              # [修改] 中国PII模式
├── lib/a2a/skills/
│   ├── cozeDelegation.ts                      # [新增] Coze A2A技能
│   └── difyDelegation.ts                      # [新增] Dify A2A技能
└── instrumentation-node.ts                    # [修改] CN模型同步接入启动流程
```

### Provider 注册

```
open-sse/config/providers/
├── registry/
│   ├── huawei/index.ts                        # [新增] 华为云ModelArts/盘古
│   ├── huawei-cn/index.ts                     # [新增] 华为云(中国区端点)
│   ├── coze-bot/index.ts                      # [新增] Coze(扣子)Bot
│   ├── dify-workflow/index.ts                 # [新增] Dify工作流
│   ├── deepseek/index.ts                      # [修改] 增加modelsUrl+passthroughModels
│   ├── doubao/index.ts                        # [修改] 增加modelsUrl+passthroughModels
│   ├── moonshot/index.ts                      # [修改] 增加modelsUrl+passthroughModels
│   ├── tencent/index.ts                       # [修改] 增加modelsUrl+passthroughModels
│   └── glm/index.ts                           # [修改] 增加modelsUrl+passthroughModels
├── index.ts                                   # [修改] barrel导出
├── searchRegistry.ts                          # [修改] 百度/必应中国搜索
└── services/
    └── regionProviders.ts                     # [新增] 区域Provider配置
```

### 路由与策略

```
open-sse/services/
├── regionProviders.ts                         # [新增] 区域Provider配置与评分调整
├── autoCombo/scoring.ts                       # [修改] CN区评分权重上浮
└── combo/autoConfig.ts                        # [修改] CN区auto-combo默认配置
```

### 部署

```
deploy/
├── ack/airoute.yaml                           # [修改] DB_TYPE/PG连接/NetworkPolicy
├── cce/airoute.yaml                           # [修改] DB_TYPE/PG连接/NetworkPolicy
├── postgres/postgresql.yaml                   # [新增] PG StatefulSet独立部署
├── redis/redis.yaml                           # [新增] Redis StatefulSet
└── README.md                                  # [修改] 数据库模式选择指南
```

### 配置

```
.env.example                                   # [修改] DB_TYPE/DB_CONNECTION_STRING/SQLCIPHER_*环境变量
```

---

## 部署指南

### 环境变量速查

#### 基础配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AIRROUTE_REGION` | — | 设为 `cn` 激活全部中国区特性 |
| `STORAGE_ENCRYPTION_KEY` | — | AES-256-GCM 密钥（CN 区强制要求；非 CN 区同样强制，除非 `ENCRYPTION_OPT_OUT=true`） |
| `DB_TYPE` | `sqlite` | 可选 `sqlite` / `sqlcipher` / `postgresql` |
| `DB_CONNECTION_STRING` | — | PostgreSQL 连接串（DB_TYPE=postgresql 时必填） |
| `SQLCIPHER_KEY` | — | SQLCipher 密钥（DB_TYPE=sqlcipher 时必填） |
| `PORT` | `20128` | API + 仪表盘端口 |
| `DATA_DIR` | `~/.airoute/` | 数据目录 |

#### 安全配置（v3.8.46 安全加固后新增）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_SECRET` | — | **必填**，>=32 字符，启动时校验长度与占位符 |
| `INITIAL_PASSWORD` | — | 管理员初始密码，**不可为 `CHANGEME`**，否则拒绝启动 |
| `GUARDRAIL_ON_ERROR` | `block` | Guardrail 异常时的行为：`block`（拒绝请求）或 `warn`（放行并告警） |
| `ENCRYPTION_OPT_OUT` | `false` | 设为 `true` 可跳过强制加密（仅限非生产环境调试用） |
| `AUTH_COOKIE_SECURE` | `true` | 认证 Cookie Secure 标志，本地 HTTP 调试可设为 `false` |
| `PIPELINE_TIMEOUT_MS` | `300000` | AI Pipeline 总超时（毫秒），默认 5 分钟 |
| `STAGE_TIMEOUT_MS` | `120000` | AI Pipeline 单阶段超时（毫秒），默认 2 分钟 |

### 阿里云 ACK 部署

```bash
# 1. 创建命名空间
kubectl create namespace airoute

# 2. 创建加密密钥
kubectl create secret generic airoute-secrets \
  --namespace airoute \
  --from-literal=STORAGE_ENCRYPTION_KEY=$(openssl rand -hex 32)

# 3. 部署
kubectl apply -f deploy/ack/airoute.yaml

# 4. 验证
kubectl get pods -n airoute
kubectl port-forward svc/airoute 20128:20128 -n airoute
```

详见 `deploy/README.md`。

### 华为云 CCE 部署

```bash
kubectl apply -f deploy/cce/airoute.yaml
```

### PostgreSQL 模式部署

```bash
# 先部署 PG
kubectl apply -f deploy/postgres/postgresql.yaml

# 再部署 AIRoute（DB_TYPE=postgresql）
# 详见 deploy/ack/airoute.yaml 中 DB_TYPE/DB_CONNECTION_STRING 配置
```

### Docker 部署

#### 前置要求

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 24.0+ | 支持 BuildKit（`DOCKER_BUILDKIT=1`） |
| Docker Compose | v2.20+ | `docker compose`（非 `docker-compose`） |

> Windows 用户推荐 [Docker Desktop](https://www.docker.com/products/docker-desktop/)，安装后 `docker` 和 `docker compose` 均可用。

#### 镜像说明

Dockerfile 提供三个运行时目标（target），按需选择：

| Target | 镜像标签 | 大小 | 适用场景 |
|--------|----------|------|----------|
| `runner-base` | `airoute:base` | ~2.3 GB | 绝大多数 Provider，推荐默认使用 |
| `runner-web` | `airoute:web` | ~3.8 GB | 需要 Playwright/Chromium 的 Web-Cookie Provider（gemini-web、claude-web、claude-turnstile） |
| `runner-cli` | `airoute:cli` | ~5.6 GB | 容器内安装 Codex/Claude Code/Droid/OpenClaw CLI |

#### 方式一：Docker Compose（推荐）

**1. 准备环境变量**

```bash
cp .env.example .env
```

编辑 `.env`，至少填写以下必填项：

```bash
AIRROUTE_REGION=cn
STORAGE_ENCRYPTION_KEY=<openssl rand -hex 32>   # 加密密钥
JWT_SECRET=<32字符的随机字符串>                  # JWT 签名密钥
INITIAL_PASSWORD=<你的强密码>                     # 管理员密码，不可为 CHANGEME
REDIS_PASSWORD=<Redis密码>                        # Redis 认证密码
```

> 生成密钥快捷命令：`openssl rand -hex 32`

**2. 选择 Profile 启动**

```bash
# 最小化启动（推荐大多数用户）
docker compose --profile base up -d

# 需要 Web-Cookie Provider 时
docker compose --profile web up -d

# 需要容器内 CLI 工具时
docker compose --profile cli up -d

# 容器内 CLI + CLIProxyAPI 侧车
docker compose --profile cli --profile cliproxyapi up -d

# 添加 Qdrant 语义记忆侧车（百万级向量场景）
docker compose --profile base --profile memory up -d

# 添加 Bifrost Go LLM 路由侧车
docker compose --profile base --profile bifrost up -d

# Host 模式：挂载宿主机已安装的 CLI 二进制
docker compose --profile host up -d
```

**3. 验证**

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f AIRoute

# 健康检查
curl http://localhost:20128/api/monitoring/health
```

**4. 访问服务**

| 入口 | 地址 |
|------|------|
| 仪表盘 | `http://localhost:20128` |
| API 端点 | `http://localhost:20128/v1` |
| API（独立端口） | `http://localhost:20129`（需设置 `API_PORT=20129`） |

#### 方式二：docker run

**最小化启动**

```bash
docker run -d --name airoute --restart unless-stopped \
  -p 20128:20128 \
  -e AIRROUTE_REGION=cn \
  -e STORAGE_ENCRYPTION_KEY=$(openssl rand -hex 32) \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e INITIAL_PASSWORD=YourStrongPassword123! \
  -v airoute-data:/app/data \
  airoute:base
```

**带 Redis + 认证**

```bash
# 1. 启动 Redis
docker run -d --name airoute-redis --restart unless-stopped \
  redis:7-alpine \
  redis-server --save 60 1 --loglevel warning --requirepass your_redis_password

# 2. 启动 AIRoute
docker run -d --name airoute --restart unless-stopped \
  --link airoute-redis:redis \
  -p 20128:20128 \
  -e AIRROUTE_REGION=cn \
  -e STORAGE_ENCRYPTION_KEY=$(openssl rand -hex 32) \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e INITIAL_PASSWORD=YourStrongPassword123! \
  -e REDIS_URL=redis://:your_redis_password@redis:6379 \
  -v airoute-data:/app/data \
  airoute:base
```

#### 方式三：生产环境 Compose

```bash
# 启动（端口 20130/20131，与开发环境隔离）
docker compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 停止
docker compose -f docker-compose.prod.yml down
```

生产环境默认使用 `runner-cli` target，端口映射 `20130→20128`（仪表盘）、`20131→20129`（API）。

#### 构建自定义镜像

```bash
# 默认构建（runner-base）
docker build -t airoute:base .

# 指定 target
docker build --target runner-web -t airoute:web .
docker build --target runner-cli -t airoute:cli .

# 调整构建内存（默认 4GB，大型项目可能需要更多）
docker build --build-arg AIRoute_BUILD_MEMORY_MB=6144 -t airoute:base .

# 多平台构建（ARM64 / AMD64）
docker buildx build --platform linux/amd64,linux/arm64 -t airoute:base .
```

#### 数据卷管理

| 路径 | 用途 | 建议 |
|------|------|------|
| `./data:/app/data` | 应用数据（SQLite/SQLCipher 数据库、日志、配置） | 必须挂载，否则容器重建后数据丢失 |
| `airoute-data` | Docker 命名卷（替代 bind mount） | 生产环境推荐命名卷 |

```bash
# 备份数据
docker run --rm -v airoute-data:/app/data -v $(pwd):/backup alpine \
  tar czf /backup/airoute-backup-$(date +%Y%m%d).tar.gz -C /app data

# 恢复数据
docker run --rm -v airoute-data:/app/data -v $(pwd):/backup alpine \
  tar xzf /backup/airoute-backup-20260803.tar.gz -C /app
```

#### 运行时内存调优

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `AIRoute_MEMORY_MB` | `1024` | Node.js V8 堆上限（MB），容器运行时生效 |
| `AIRoute_BUILD_MEMORY_MB` | `4096` | 构建阶段 V8 堆上限（MB），仅 `docker build` 时使用 |

```bash
# 低内存 VPS（1-2 GB RAM）
docker compose --profile base up -d -e AIRoute_MEMORY_MB=512

# 高并发生产环境
docker compose --profile base up -d -e AIRoute_MEMORY_MB=2048
```

#### Docker Compose Profile 速查

| Profile | 包含组件 | 用途 |
|---------|----------|------|
| `base` | AIRoute + Redis | 最小化部署，覆盖绝大多数场景 |
| `web` | AIRoute(含Chromium) + Redis | Web-Cookie Provider（gemini-web/claude-web/claude-turnstile） |
| `cli` | AIRoute(含CLI工具) + Redis | 容器内直接使用 Codex/Claude Code/Droid/OpenClaw |
| `host` | AIRoute + Redis | 挂载宿主机 CLI 二进制（Linux 优先） |
| `memory` | Qdrant 侧车 | 百万级向量语义记忆（需 `QDRANT_ENABLED=true`） |
| `bifrost` | Bifrost Go 侧车 | Tier-1 LLM 路由（需 `BIFROST_ENABLED=true`） |
| `cliproxyapi` | CLIProxyAPI 侧车 | CLI Proxy API 端口 8317 |

#### 常见问题

**Q: 容器启动后显示 `unhealthy`**

健康检查脚本会依次探测 `127.0.0.1` → `localhost` → `::1` → 容器内网 IP。启动需要 10-15 秒，如果持续 unhealthy：

```bash
# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' airoute | python3 -m json.tool

# 手动测试
docker exec airoute node healthcheck.mjs
```

**Q: 数据卷权限错误（`WARNING: /app/data is not writable`）**

```bash
# Docker 环境
sudo chown -R 1000:1000 ./data
chmod -R u+rwX ./data

# Podman 环境
podman unshare chown -R $(id -u):$(id -g) ./data
```

**Q: 构建时 `JavaScript heap out of memory`**

```bash
# 增大构建内存
docker build --build-arg AIRoute_BUILD_MEMORY_MB=6144 -t airoute:base .
```

**Q: 需要 Web-Cookie Provider 但用了 `base` 镜像**

Web-Cookie Provider 依赖 Playwright/Chromium，`base` 镜像不包含。请切换到 `web` profile：

```bash
docker compose --profile web up -d
```

**Q: 如何查看完整环境变量列表**

`.env.example` 文件包含 940+ 行环境变量文档，覆盖所有可配置项：

```bash
cp .env.example .env
# 按 .env 中的注释说明逐项配置
```

### 本地源码运行

> **Node.js 版本要求**：`>=22.0.0 <23 || >=24.0.0 <27`（推荐 Node 22.x LTS 或 24.x LTS）
>
> 低于 Node 22 会导致 `undici` 的 `webidl` 兼容性错误，项目无法启动。

```bash
# 1. 确保 Node.js 版本正确
node -v   # 应输出 v22.x 或 v24.x 或 v25.x

# 2. 复制环境变量并修改
cp .env.example .env
# 编辑 .env，必填项：
#   AIRROUTE_REGION=cn
#   STORAGE_ENCRYPTION_KEY=<openssl rand -hex 32>
#   JWT_SECRET=<>=32字符的随机字符串>
#   INITIAL_PASSWORD=<强密码，不可为 CHANGEME>

# 3. 安装依赖
npm install

# 4. 如果切换过 Node 版本，需重编译原生模块
npm rebuild better-sqlite3

# 5. 启动开发服务器
PORT=20128 npm run dev
```

仪表盘：`http://localhost:20128`
API 端点：`http://localhost:20128/v1`

> **Windows 注意**：系统中可能存在多个 Node.js 安装。请确保 PATH 中优先使用 `>=22` 的版本，或使用完整路径启动：
> ```powershell
> & "node.exe" --max-old-space-size=8192 scripts/dev/run-next.mjs dev
> ```

---

## 公网暴露（FreeDomain + Cloudflare Named Tunnel）

AIRoute 内置的 Cloudflare Quick Tunnel 生成临时域名（`*.trycloudflare.com`），每次重启都会变。要获得稳定、免备案的公网固定入口，可用 [DigitalPlat FreeDomain](https://github.com/DigitalPlatDev/FreeDomain) 免费域名 + Cloudflare Named Tunnel 绑定。

> 详细操作步骤见 [`FreeDomain_Cloudflare_Tunnel_AIRoute_绑定指南.docx`](FreeDomain_Cloudflare_Tunnel_AIRoute_绑定指南.docx)，Tunnel 通用文档见 [`docs/ops/TUNNELS_GUIDE.md`](docs/ops/TUNNELS_GUIDE.md)。

**5 步快速配置：**

```bash
# 1. 注册 FreeDomain 免费域名，将 NS 指向 Cloudflare
#    （在 FreeDomain 面板把 NS 改为 Cloudflare 给的两个 NS 地址）

# 2. 安装 cloudflared CLI 并登录
cloudflared tunnel login          # 浏览器授权，选你的域名

# 3. 创建 Named Tunnel 并配 DNS 路由
cloudflared tunnel create airoute-tunnel
cloudflared tunnel route dns airoute-tunnel airoute.你的域名.js.cool

# 4. 编写配置文件 ~/.cloudflared/config.yml
#    tunnel: <Tunnel-ID>
#    credentials-file: ~/.cloudflared/<Tunnel-ID>.json
#    ingress:
#      - hostname: airoute.你的域名.js.cool
#        service: http://127.0.0.1:20128
#      - service: http_status:404

# 5. 启动 Tunnel（AIRoute 须已在 127.0.0.1:20128 运行）
cloudflared tunnel run airoute-tunnel

# 可选：设为系统服务自启动
cloudflared service install       # Windows/Linux/macOS 均可
```

**如需 OAuth Provider（Claude/Cursor/Gemini 等），额外设置：**

```bash
# .env 中添加
NEXT_PUBLIC_BASE_URL=https://airoute.你的域名.js.cool
REQUIRE_API_KEY=true              # 公网暴露后必须开启认证
```

> **安全提醒**：公网暴露后必须启用 `REQUIRE_API_KEY`。Named Tunnel 不受 AIRoute 内置 Tunnel 安全门禁（`tunnelAuthGate.ts`）管控，需手动确保认证已开启。建议在 Cloudflare 侧启用 Access Policy 增加一层访问控制。**切勿用于政务或企业合规场景**，免费域名无 SLA 保证，也无法满足等保要求。

**三种公网暴露方案对比：**

| 方案 | 域名稳定性 | 适用场景 |
|------|-----------|---------|
| Cloudflare Quick Tunnel | 临时，重启变化 | 临时 Demo，不想配置 |
| Cloudflare Named Tunnel + FreeDomain | 稳定，自定义域名 | 长期使用，需固定 URL |
| ngrok Reserved Domain | 稳定（需付费） | 已有 ngrok 付费计划 |
| Tailscale Funnel | 稳定（每节点固定） | 团队内部，已有 Tailscale |

---

## 开发路线图

### 已完成 (v3.8.46-cn)

- [x] **P0-1** 华为云盘古 Provider（含中国区端点 `huawei-cn`）
- [x] **P0-2** 国产 PII 脱敏（身份证/手机号/银联卡）+ 区域默认值翻转
- [x] **P0-3** 凭证强制加密（所有区域未配置密钥拒绝启动，CN 区同理）
- [x] **P1-4** 百度搜索 / 必应中国搜索 Provider
- [x] **P1-5** 数据出境管控（域名白名单 + 出境日志）
- [x] **P1-6** 区域感知路由（评分权重自动调整）
- [x] **P1-7** Coze/Dify Agent 平台适配层
- [x] **P1-8** ACK/CCE K8s 部署模板
- [x] **P2-9** SQLCipher / PostgreSQL 企业级存储层
- [x] **P2-10** MITM 使用审计 + 作用域限制
- [x] **P2-11** 国产模型版本自动同步（6 Provider, 6h 间隔）
- [x] **SEC-1** 安全审计 — 三视角审计（安全/网络/AI安全）完成，28 项发现，19 项已修复
- [x] **SEC-2** Phase 1 紧急修复 — 15 项修复已落地（Guardrail fail-closed、加密强制、JWT 校验、OAuth state 验证、注入防护默认 block 等）
- [x] **SEC-3** Phase 2 加固修复 — 4 项修复已落地（CSP nonce、SSRF 逐跳校验、模板注入防护、Pipeline 超时）
- [x] **NODE-1** Node.js 升级至 v25.2.1 — 满足 `>=22.0.0` 要求，better-sqlite3 已重编译

### 进行中

- [ ] **PG 覆盖迁移补全** — 为 025/075/096/103 号迁移文件编写 PostgreSQL 手工覆盖（涉及 JSON1 函数重写）
- [ ] **SEC-4 Phase 3 持续验证** — 安全加固回归测试、定期重审、安全基线自动化扫描
- [ ] **GitHub 远程仓库** — 初始化远程仓库并推送

### 规划中 (v3.9.x-cn)

- [ ] **等保三级加固（续）** — 审计日志持久化(PG)、操作留存 90 天、管理员双因素认证（部分已在 SEC-1/2/3 完成：mandatory encryption、JWT 校验、Guardrail fail-closed）
- [ ] **国密算法支持** — SM2/SM3/SM4 替代 AES-256/RSA/HMAC-SHA256 用于加密签名
- [ ] **WAF 规则集** — 针对中国常见攻击模式的请求过滤规则
- [ ] **Prometheus + Grafana 监控** — 国产化监控栈集成（华为 AOM / 阿里云 ARMS）
- [ ] **国产向量数据库** — Milvus / TDengine 适配（替代 Qdrant/sqlite-vec）
- [ ] **政务云适配** — 公有云政务区 / 专属云部署模板
- [ ] **多租户隔离** — 企业级租户隔离（Schema级别 / 数据库级别）
- [ ] **API 网关前置** — Kong / APISIX 集成模板（限流、认证、流量镜像）
- [ ] **I18N 中文优化** — 仪表盘中文翻译完善、中文错误码提示
- [ ] **CI/CD 流水线** — GitHub Actions / 华为云 CodeArts 自动化构建与发布

---

## 快速开始

### 1. 安装与启动

```bash
npm install -g airoute
AIRROUTE_REGION=cn STORAGE_ENCRYPTION_KEY=$(openssl rand -hex 32) airoute
```

### 2. 连接 Provider

仪表盘 → **Providers** → 连接 **DeepSeek** / **阿里云百炼** / **Kiro AI**(免费)

### 3. 配置 IDE/CLI

```
Base URL: http://localhost:20128/v1
API Key:  [从仪表盘 Endpoints 页复制]
Model:    auto            # 零配置智能路由
```

### 4. 验证

```bash
curl http://localhost:20128/v1/models -H "Authorization: Bearer YOUR_KEY"
```

---

## 核心能力概览（继承自 OmniRoute）

| 能力 | 详情 |
|------|------|
| Provider | 237+ LLM Provider，90+ 免费额度，11 个永久免费 |
| 路由策略 | 17 种：priority / weighted / cost-optimized / context-relay / fusion 等 |
| 压缩 | 10 级管线：Session-Dedup → CCR → RTK → Headroom → Relevance → Caveman → LLMLingua-2 → Lite → Aggressive → Ultra |
| 压缩节省 | 最高 95%（RTK+Caveman 堆叠），平均 89%（工具密集会话） |
| MCP | 95 工具 / 3 传输 / 30 作用域 |
| A2A | JSON-RPC 2.0 + SSE，6 技能（含 Coze/Dify 委托） |
| 韧性 | 三层独立：Provider 熔断器 → Key 冷却 → Model 锁定 |
| 协议 | OpenAI / Claude / Gemini / Responses API 自动互译 |
| 安全 | PII 脱敏 / 注入防护(block 默认) / 视觉审查 / MITM 审计 / CSP nonce / SSRF 逐跳校验 / Guardrail fail-closed / OAuth state 验证 / Pipeline 超时 |
| 内存 | FTS5 全文搜索 + 向量检索（Qdrant/sqlite-vec） |

### 安全加固（v3.8.46 审计修复）

基于三视角（安全 / 网络 / AI 安全）审计，共发现 28 项安全问题，已修复 19 项：

**Phase 1 — 紧急修复（15 项，已落地）**

| 编号 | 修复内容 | 涉及文件 |
|------|----------|----------|
| S-01 | Guardrail 异常默认 fail-closed | `registry.ts` |
| S-02 | 移除客户端可控的 Guardrail 开关 | `registry.ts` |
| S-03 | 强制加密策略全局生效 | `encryption.ts` |
| S-05 | 拒绝 CHANGEME 作为初始密码 | `managementPassword.ts` |
| S-06 | JWT_SECRET 启动校验（长度 + 占位符） | `instrumentation-node.ts` |
| N-01 | 限流器 Redis 故障时 fail-closed | `rateLimiter.ts` |
| N-03 | 认证 Cookie 默认 Secure 标志 | `pipeline.ts`, `login/route.ts` |
| N-05 | OAuth 2.0 state 服务端校验（10 分钟 TTL） | `oauth/[provider]/[action]/route.ts` |
| N-07 | Docker Redis 加固（认证 + 禁用危险命令） | `docker-compose.yml` |
| N-08 | 启动时不安全配置检测（6 项环境变量） | `instrumentation-node.ts` |
| A-01 | 中文注入模式 + 扫描范围提升至 32KB | `inputSanitizer.ts` |
| A-02 | Memory 注入上下文检测 | `injection.ts` |
| A-03 | Copilot CLI 命令白名单 | `tools.ts` |
| A-04 | Memory 存储 PII 脱敏 | `store.ts` |
| A-05 | 注入防护默认策略从 `warn` 改为 `block` | `promptInjection.ts` |

**Phase 2 — 加固修复（4 项，已落地）**

| 编号 | 修复内容 | 涉及文件 |
|------|----------|----------|
| S-07 | CSP 按请求生成 nonce，移除 `unsafe-inline`（生产） | `next.config.mjs`, `layout.tsx`, `pipeline.ts` |
| N-04 | SSRF 出站请求逐跳 URL 校验 | `safeOutboundFetch.ts` |
| A-06 | 模板注入防护（转义 `{` `}`） | `prompts.ts`, `db/prompts.ts` |
| A-07 | Pipeline 超时 + 单阶段超时 + AbortSignal | `pipeline.ts` |

**Phase 3 — 持续验证（进行中）**

回归测试、定期重审与安全基线自动化扫描。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 运行时 | Node.js 22.x / 24.x LTS（`>=22.0.0 <23 \|\| >=24.0.0 <27`） |
| 语言 | TypeScript 6.0，100% 类型覆盖（核心模块零 `any`） |
| 框架 | Next.js 16 + React 19 + Tailwind CSS 4 |
| 数据库 | SQLite (better-sqlite3) / SQLCipher / PostgreSQL |
| 校验 | Zod（MCP 工具 I/O、API 契约） |
| 协议 | MCP (stdio/HTTP/SSE) + A2A v0.3 (JSON-RPC 2.0) |
| 流式 | Server-Sent Events + WebSocket |
| 认证 | OAuth 2.0 PKCE + JWT + API Keys + MCP Scoped Auth |
| 测试 | Node.js test runner + Vitest（21,000+ 测试用例） |
| 平台 | Desktop(Electron) / Android(Termux) / PWA |
| 部署 | Docker / ACK / CCE / Fly.io / 本地 |

---

## 数据库模式选择

| 模式 | 适用场景 | 环境变量 | 说明 |
|------|----------|----------|------|
| SQLite | 个人/小团队 | `DB_TYPE=sqlite`(默认) | 零配置，单文件 |
| SQLCipher | 中国区合规/等保 | `DB_TYPE=sqlcipher` | 透明加密，CN区自动默认 |
| PostgreSQL | 大规模/企业级 | `DB_TYPE=postgresql` | 含自动SQL转译、PG覆盖迁移 |

---

## License

— 详见 [LICENSE](LICENSE)

---

<div align="center">

AIRoute v1.0 cn · Node >=22.0.0

基于 [OmniRoute](https://github.com/diegosouzapw/AIRoute) 开源项目

</div>