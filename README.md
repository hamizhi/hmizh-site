# GETGPT Pro

当前版本使用 Next.js、Tailwind CSS v4 和 `lucide-react`，页面包含响应式导航、教程下拉、套餐切换、充值流程、FAQ 和客服入口。

后台数据层已经切换为 Supabase PostgreSQL。请先在 Supabase SQL Editor 中执行 `supabase/schema.sql`，再配置服务端环境变量。

## 启动

```bash
npm install
npm run dev
```

然后打开 <http://localhost:3000/>。

需要配置 `.env.local`：

```text
SUPABASE_URL=你的 Supabase 项目 URL
SUPABASE_SERVICE_ROLE_KEY=仅服务端使用的 service role key
ADMIN_PASSWORD=后台管理密码
NEXT_PUBLIC_SITE_URL=https://你的正式域名
LUCKYWOOD_PID=幸运木商户 ID
LUCKYWOOD_KEY=幸运木商户密钥
LUCKYWOOD_API_BASE_URL=https://xrapi1.xymzf.cn/xpay/epay
LUCKYWOOD_CHANNEL_ID=可选的幸运木通道编号
```

`SUPABASE_SERVICE_ROLE_KEY` 不能以 `NEXT_PUBLIC_` 开头，也不能暴露到浏览器端。
幸运木商户密钥只能放在服务端环境变量中。本项目当前自动支付只接入幸运木支付宝；前台微信按钮仍走原来的人工客服流程。

如果你已经执行过旧版 `supabase/schema.sql`，还需要在 Supabase 的 SQL Editor 中执行：

```text
supabase/migrations/003_luckywood_provider.sql
```

这条迁移会补充支付订单字段和“支付成功后原子发卡”的数据库函数。

幸运木后台需要把异步通知地址配置为：

```text
https://你的正式域名/api/payment/notify
```

同步回跳地址由程序自动生成，格式为：

```text
https://你的正式域名/api/payment/return?order_id=订单号
```

`NEXT_PUBLIC_SITE_URL` 必须填写用户实际访问网站的 HTTPS 域名，否则支付平台会把回调发送到错误的网站。
本地使用 Cloudflare Tunnel 测试时，应填写当前隧道的 HTTPS 地址，并从该地址下单。
支付完成后的同步回跳也使用这个地址；不要使用 `https://localhost:端口`。
临时隧道地址改变后，需要更新 `.env.local` 并重启本地服务。付款页面显示成功
并不能代替异步回调，订单与发卡状态以数据库记录为准。

生产构建：

```bash
npm run build
npm start
```

## 卡密兑换

卡密兑换页面为 `/redeem`，服务端代理 ZovoCard 的公开兑换流程：

1. 预览完整卡密；
2. 预检用户提供的 ChatGPT Session；
3. 提交兑换订单；
4. 轮询订单直到最终状态。

本地测试时在 `.env.local` 配置：

```text
ZOVOCARD_ORIGIN=https://sandbox.zovocard.com
```

沙盒和生产的账号、卡密、域名、数据完全隔离。切换生产时使用 `https://zovocard.com`，不要在浏览器代码中放置 ZovoCard API Key。兑换接口会将 Session 直接转交给 ZovoCard，不写入 Supabase；生产环境必须使用 HTTPS。
