# Supabase Setup

在 Supabase SQL Editor 里按这个顺序执行：

1. 运行 [schema.sql](/Users/ella/Documents/history-chat/supabase/schema.sql)
2. 再运行 [seed_personas.sql](/Users/ella/Documents/history-chat/supabase/seed_personas.sql)
3. 到 `Authentication -> Providers` 确认启用 `Email`

然后在本地 `.env.local` 中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

执行完成后：

- `/auth` 可以注册 / 登录
- 登录后聊天记录、消息、反馈会写入 Supabase
- `conversations.persona_id` 的外键会正确指向 `personas.id`

注意：

- 当前人物列表页面仍然直接读取本地种子文件，不依赖数据库读 `personas`
- 但会话表依赖 `personas` 外键，所以 `seed_personas.sql` 必须执行
- 如果项目开启邮箱确认，注册后需要先去邮箱激活
