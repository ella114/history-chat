# History Persona Chat

一个可本地运行的 MVP Web App，用于和历史真实人物进行高拟真、自由的文字对话。当前版本重点完成：

- 首页人物列表
- 人物详情页
- 对话页
- 聊天记录页
- 自动生成会话标题/摘要
- 回答反馈采集
- 基础 moderation 与免责声明
- 可替换的 AI Provider 抽象层
- OpenAI Responses API 真实接入
- Supabase Auth + Postgres 持久化

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件（本地实现）
- Supabase Auth + Postgres
- 本地 `localStorage` fallback
- OpenAI Responses API + Moderation API

## 运行方式

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

4. 打开浏览器

```text
http://localhost:3000
```

## 当前实现说明

### 1. AI Provider 抽象

核心接口在 [lib/ai/provider.ts](/Users/ella/Documents/history-chat/lib/ai/provider.ts)：

- `moderateInput()`
- `generateReply()`
- `generateConversationTitle()`

当前支持两套 provider：

- OpenAI： [lib/ai/providers/openai-provider.ts](/Users/ella/Documents/history-chat/lib/ai/providers/openai-provider.ts)
- Mock： [lib/ai/providers/mock-provider.ts](/Users/ella/Documents/history-chat/lib/ai/providers/mock-provider.ts)

如果后续接入真实模型，只需要：

1. 新增一个 provider 类实现 `AiProvider`
2. 在 [lib/ai/index.ts](/Users/ella/Documents/history-chat/lib/ai/index.ts) 注册
3. 将 `.env.local` 中的 `AI_PROVIDER` 改成新 provider key

### 2. 数据层

当前数据层分两种模式：

- 已配置并登录 Supabase：走 [browser-repository.ts](/Users/ella/Documents/history-chat/lib/storage/browser-repository.ts)
- 未配置 Supabase 或未登录：回落到 [local-store.ts](/Users/ella/Documents/history-chat/lib/storage/local-store.ts)

相关文件：

- Supabase browser client： [client.ts](/Users/ella/Documents/history-chat/lib/supabase/client.ts)
- Auth context： [auth.ts](/Users/ella/Documents/history-chat/lib/supabase/auth.ts)
- 人物种子数据在 [lib/data/personas.ts](/Users/ella/Documents/history-chat/lib/data/personas.ts)
- 类型定义在 [lib/types.ts](/Users/ella/Documents/history-chat/lib/types.ts)

### 3. 自动标题/摘要

每次会话开始后，系统会根据前几轮内容自动生成标题和摘要，用于历史记录展示。

当前版本默认使用 OpenAI 真实模型生成；若 OpenAI key、网络或额度异常，会自动回落到 mock provider，避免聊天直接中断。

### 4. 上下文策略

当前策略位于 [lib/context.ts](/Users/ella/Documents/history-chat/lib/context.ts)：

- 保留最近 8 条消息
- 携带已有会话标题和摘要
- 预留后续升级为“长期摘要 + 最近消息”的拼装方式

### 5. 安全与边界

当前提供基础安全处理：

- 输入 moderation 接口
- 危险与违法内容的规则拒绝
- 明确声明该产品是历史人物对话体，不是真人复现
- 回复避免伪装成活在当代的真实人物

## 目录结构

```text
app/
  api/chat/route.ts         # 聊天 API，串联 moderation / reply / title
  chat/[slug]/page.tsx      # 对话页
  history/page.tsx          # 聊天记录页
  personas/[slug]/page.tsx  # 人物详情页
components/
  chat/                     # 对话组件
  history/                  # 历史列表组件
  home/                     # 首页卡片
  ui/                       # shadcn/ui 风格基础组件
lib/
  ai/                       # provider 抽象与 mock 实现
  data/                     # 种子人物数据
  storage/                  # 本地持久化
  types.ts                  # 核心类型
public/personas/            # 人物头像 SVG
supabase/schema.sql         # 未来持久化 schema
```

## 已内置人物

- 老子
- 孔子
- 庄子
- 苏格拉底
- 鲁迅
- 达芬奇

## 后续接入真实 LLM 的建议

优先替换以下部分：

1. `generateReply()`：已接入 OpenAI Responses API
2. `generateConversationTitle()`：已接入 OpenAI Responses API
3. `moderateInput()`：已接入 OpenAI Moderation API

推荐保持当前入参结构不变，这样前端与数据层几乎不需要改动。

## TODO

- 新增匿名用户 ID 与本地数据迁移
- 加入服务端会话摘要裁剪
- 增加事件埋点与反馈统计

## 备注

当前仓库是手工搭建脚手架，没有执行 `create-next-app`。如果你希望我继续下一步，可以直接在这个基础上继续补：

- 登录/匿名身份
- 更完整的会话管理

## OpenAI 配置

在 `.env.local` 中设置：

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_server_side_key
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_TITLE_MODEL=gpt-5-mini
OPENAI_MODERATION_MODEL=omni-moderation-latest
```

实现策略：

- 所有 OpenAI 请求都只走服务端 route，不会把 key 暴露到浏览器
- 回复与标题生成走 `Responses API`
- 输入安全检查走 `Moderation API`
- OpenAI 失败时自动回落到 mock provider

## Supabase 配置

在 Supabase 控制台完成三步：

1. 执行 [schema.sql](/Users/ella/Documents/history-chat/supabase/schema.sql)
2. 执行 [seed_personas.sql](/Users/ella/Documents/history-chat/supabase/seed_personas.sql)
3. 在 Authentication 中开启 Email 登录

然后在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

当前实现行为：

- 顶部会显示登录入口
- 登录后，聊天记录、消息和反馈写入 Supabase
- 未登录时，继续使用本地 `localStorage`
- RLS 仅允许用户访问自己的会话数据

更直接的执行顺序见 [SETUP.md](/Users/ella/Documents/history-chat/supabase/SETUP.md)
