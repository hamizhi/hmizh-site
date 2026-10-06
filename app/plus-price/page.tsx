"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ExternalLink,
  Lock,
  MessageCircle,
  RotateCcw,
  UserCheck,
} from "lucide-react";

type Plan = "go" | "plus" | "pro";

const planClass = (selected: boolean) =>
  `relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 sm:p-7 ${
    selected
      ? "border-2 border-indigo-600 bg-white shadow-[0_12px_32px_-6px_rgba(99,102,241,0.18)] ring-4 ring-indigo-50"
      : "border border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-xl"
  }`;

const FeatureList = ({ items }: { items: string[] }) => (
  <div className="mb-6 space-y-2.5 border-t border-gray-100 pt-4 text-xs text-gray-600 sm:text-[13px]">
    {items.map((item) => (
      <div key={item} className="flex items-start gap-2">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" strokeWidth={2.5} />
        <span>{item}</span>
      </div>
    ))}
  </div>
);

export default function PlusPricePage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("plus");

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#111827] antialiased selection:bg-indigo-600 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
              G
            </div>
            <div>
              <div className="text-lg font-bold leading-tight tracking-[-0.5px] text-[#111827]">
                GETGPT <span className="text-indigo-600">Pro</span>
              </div>
              <div className="text-[11px] font-normal leading-tight text-gray-400">
                ChatGPT 订阅服务
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
            <Link href="/" className="transition-colors hover:text-indigo-600">
              ChatGPT 充值
            </Link>
            <Link href="/plus-price" className="font-semibold text-indigo-600">
              Pro 专区
            </Link>
            <Link href="/#process" className="transition-colors hover:text-indigo-600">
              充值教程
            </Link>
            <Link href="/blog" className="transition-colors hover:text-indigo-600">
              博客指南
            </Link>
            <Link href="/claude" className="inline-flex items-center gap-1 transition-colors hover:text-indigo-600">
              Claude 订阅
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </Link>
            <Link href="/gemini" className="transition-colors hover:text-indigo-600">
              Gemini
            </Link>
            <Link href="/grok" className="transition-colors hover:text-indigo-600">
              Grok
            </Link>
          </nav>

          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <span className="text-gray-400">☰</span>
            查询订单
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="mb-2.5 text-3xl font-extrabold tracking-[-0.8px] text-[#111827] sm:text-4xl">
            选择适合你的 AI 套餐
          </h1>
          <p className="mb-3 text-sm font-medium text-gray-500">
            所有套餐均享有 100% 充值失败退款保障，支持微信 / 支付宝扫码支付
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
            <Link href="/blog/chatgpt-register-guide" className="transition-colors hover:text-indigo-600">
              还没有 ChatGPT 账号？{" "}
              <span className="font-medium text-indigo-600 underline">注册教程 &gt;</span>
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/blog/codex-phone-verification" className="transition-colors hover:text-indigo-600">
              📋 Codex 登录要验证手机号？{" "}
              <span className="font-medium text-indigo-600 underline">验证指南 &gt;</span>
            </Link>
          </div>
        </div>

        <div className="mb-10 grid items-stretch gap-6 md:grid-cols-3">
          <article
            onClick={() => setSelectedPlan("go")}
            className={`${planClass(selectedPlan === "go")} cursor-pointer`}
          >
            <div className="absolute right-5 top-5">
              {selectedPlan === "go" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="block h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
            <div>
              <h2 className="mb-2 pr-6 text-2xl font-black tracking-[-0.5px] text-[#111827]">
                ChatGPT Go
              </h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                新用户首选
              </div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">
                  49
                </span>
                <span className="text-xs font-medium text-gray-400">/ 月</span>
              </div>
              <p className="mb-5 text-xs font-normal leading-relaxed text-gray-500">
                使用更多核心智能额度，写作、了解、创建和聊天都更多。
              </p>
              <FeatureList
                items={[
                  "更多使用工具的消息额度",
                  "更多图像创建额度",
                  "更多记忆和存储空间",
                  "更多语音聊天额度",
                ]}
              />
            </div>
            <Link
              href="/purchase?plan=go"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "go"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700"
                  : "bg-gray-100 text-[#111827] hover:bg-gray-200"
              }`}
            >
              立即购买
            </Link>
          </article>

          <article
            id="plus"
            onClick={() => setSelectedPlan("plus")}
            className={`${planClass(selectedPlan === "plus")} cursor-pointer`}
          >
            <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              最受欢迎 · 推荐
            </span>
            <div className="absolute right-5 top-5">
              {selectedPlan === "plus" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="block h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
            <div>
              <h2 className="mb-2 pr-6 text-2xl font-black tracking-[-0.5px] text-[#111827]">
                ChatGPT Plus
              </h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                限时优惠价 ¥149
              </div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">149</span>
                <span className="text-xs font-medium text-gray-400">/ 月</span>
                <span className="ml-1 text-xs text-gray-400 line-through">¥199</span>
              </div>
              <p className="mb-4 text-xs font-normal leading-relaxed text-gray-500">解锁高级智能，越用越懂你的偏好</p>
              <FeatureList
                items={[
                  "面向复杂工作的高级智能",
                  "更高质量的图像生成",
                  "工作智能体可跨应用和文件执行操作",
                  "用 Codex 自动化编码",
                  "个人理财和数据分析工具",
                  "支持开具正规采购凭证/收据用于财务报销",
                ]}
              />
            </div>
            <Link
              href="/purchase?plan=plus"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "plus" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700" : "bg-[#111827] text-white hover:bg-black"
              }`}
            >
              立即购买
            </Link>
          </article>

          <article
            id="pro"
            onClick={() => setSelectedPlan("pro")}
            className={`${planClass(selectedPlan === "pro")} cursor-pointer`}
          >
            <div className="absolute right-5 top-5">
              {selectedPlan === "pro" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="block h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
            <div>
              <h2 className="mb-2 pr-6 text-2xl font-black tracking-[-0.5px] text-[#111827]">
                ChatGPT Pro
              </h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                ChatGPT Pro $100 / $200 / $500
              </div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">720</span>
                <span className="text-xs font-medium text-gray-400">起 / 月</span>
              </div>
              <p className="mb-5 text-xs font-normal leading-relaxed text-gray-500">
                面向在整个工作日都依赖我们最强智能的用户
              </p>
              <FeatureList
                items={[
                  "我们最强大的前沿 Pro 模型",
                  "Dots，你的全天候在线智能体",
                  "更多工作模式和 Codex 使用额度",
                  "抢先体验新工具和模型",
                  "提供 3 档使用额度",
                  "支持开具正规采购凭证/收据用于财务报销",
                ]}
              />
            </div>
            <Link
              href="/purchase?plan=pro-5x"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "pro" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700" : "bg-[#111827] text-white hover:bg-black"
              }`}
            >
              立即购买
            </Link>
          </article>
        </div>

        <div className="grid gap-4 border-t border-gray-200 pt-6 text-center sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 sm:text-sm"><UserCheck className="h-4 w-4 shrink-0 text-emerald-600" /><span><strong>独立账户使用</strong>：不共享账号，独立独享</span></div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 sm:text-sm"><Lock className="h-4 w-4 shrink-0 text-indigo-600" /><span><strong>到期自动停止</strong>：无隐形扣费，到期即止</span></div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 sm:text-sm"><RotateCcw className="h-4 w-4 shrink-0 text-rose-500" /><span><strong>不成功全额退款</strong>：充值失败原路退回</span></div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <Link href="/purchase_credits" aria-label="联系客服" className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-indigo-700">
          <MessageCircle className="h-5 w-5" />
          <span className="mt-0.5 text-[9px] font-bold">客服</span>
        </Link>
      </div>
    </div>
  );
}
