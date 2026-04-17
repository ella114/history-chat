# Vercel + 阿里云域名上线说明

适用场景：

- 项目继续部署在 Vercel
- 域名由阿里云管理：`historypersona.cn`
- 目标是先把 MVP 正式可访问，并完成自定义域名绑定

注意：

- 这条路线适合快速上线 MVP。
- 如果你的目标是“尽量让国内访问更顺”，这条路线可以先跑起来，但不能等同于“中国大陆稳定可达保障”。Vercel 仍然是海外平台。

## 1. 先确认 Vercel 项目

本项目本地已经链接到 Vercel 项目：

- `projectName`: `history-chat`

本地生产构建已通过，可以直接继续走 Vercel 部署。

## 2. 在 Vercel 设置环境变量

进入 Vercel 项目 `history-chat`：

1. 打开 `Settings`
2. 打开 `Environment Variables`
3. 至少补齐这些变量

```bash
AI_PROVIDER=openai
NEXT_PUBLIC_APP_NAME=History Persona Chat
NEXT_PUBLIC_APP_URL=https://historypersona.cn
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_CHAT_MODEL=...
OPENAI_TITLE_MODEL=...
OPENAI_MODERATION_MODEL=...
```

说明：

- `NEXT_PUBLIC_APP_URL` 建议正式环境填 `https://historypersona.cn`
- 如果你使用的是 `www.historypersona.cn` 作为主站，也可以填成 `https://www.historypersona.cn`
- Supabase 这里优先使用项目里已经兼容的 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## 3. 在 Vercel 添加域名

进入：

1. `Project`
2. `Settings`
3. `Domains`

建议添加两个域名：

- `historypersona.cn`
- `www.historypersona.cn`

建议把其中一个设为主域名，另一个做重定向。对中文用户更简洁的做法是：

- 主域名：`historypersona.cn`
- 重定向：`www.historypersona.cn` -> `historypersona.cn`

Vercel 官方文档：

- [Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

## 4. 在阿里云配置 DNS 解析

到阿里云 `云解析 DNS` 中，为 `historypersona.cn` 添加记录。

常见配置如下：

### 根域名

- 记录类型：`A`
- 主机记录：`@`
- 记录值：`76.76.21.21`

### www 子域名

- 记录类型：`CNAME`
- 主机记录：`www`
- 记录值：`cname.vercel-dns-0.com`

重要：

- 如果 Vercel 域名页给你的提示值和上面不同，以 Vercel 页面显示的“精确值”为准
- 不要让 `@` 同时存在多个互相冲突的 `A` / `CNAME` / URL 转发记录
- `www` 如果要走 `CNAME`，就不要再保留同名 `A` 记录

阿里云添加记录参考：

- [阿里云：如何添加域名解析记录](https://help.aliyun.com/zh/dns/add-record/)

## 5. 等待校验与证书签发

完成 DNS 配置后，回到 Vercel `Domains` 页面等待状态变为 `Valid` 或 `Ready`。

这一步通常会自动完成：

- 域名校验
- HTTPS 证书签发
- SSL 生效

如果长时间未通过：

1. 检查阿里云是否还有旧解析冲突
2. 检查是否把 `www` 误填成完整域名
3. 检查是否有代理/CDN 干扰
4. 等待 DNS 生效，一般几分钟到数小时不等

## 6. 上线后自测

建议按下面顺序检查：

1. `https://historypersona.cn`
2. `https://www.historypersona.cn`
3. `https://historypersona.cn/api/health`
4. 首页打开是否正常
5. 进入任意人物页是否正常
6. 发一条聊天消息，确认 `/api/chat` 正常返回
7. 如果启用了 Supabase，测试登录和历史记录

健康检查接口返回 JSON 即表示应用服务已起来。

## 7. 可选优化

如果你的 Vercel 计划支持函数区域设置，可考虑把 Functions 区域调到更近的节点，例如 `hkg1`。

参考：

- [Vercel Regions](https://vercel.com/docs/regions)
- [Configuring regions for Vercel Functions](https://vercel.com/docs/serverless-functions/regions)

注意：

- Vercel 文档说明默认 Function 区域是 `iad1`
- 多区域能力和部分区域计费与套餐有关，启用前先看你当前团队套餐是否支持
