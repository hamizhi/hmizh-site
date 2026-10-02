"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ExternalLink,
  Key,
  Lock,
  MessageCircle,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";

type Plan = "plus" | "pro" | "account";

const planClass = (selected: boolean) =>
  `relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 sm:p-7 ${
    selected
      ? "border-2 border-indigo-600 bg-white shadow-[0_12px_32px_-6px_rgba(99,102,241,0.18)] ring-4 ring-indigo-50"
      : "border border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-xl"
  }`;

const FeatureCell = ({
  icon: Icon,
  label,
  sublabel,
  divided = false,
}: {
  icon: typeof Shield;
  label: string;
  sublabel: string;
  divided?: boolean;
}) => (
  <div
    className={`flex flex-col items-center ${divided ? "border-x border-gray-200/80 px-1" : ""}`}
  >
    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-indigo-600 shadow-sm">
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-xs font-bold leading-tight text-gray-900">{label}</div>
    <div className="mt-0.5 text-[10px] leading-tight text-gray-400">
      {sublabel}
    </div>
  </div>
);

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
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs font-medium text-emerald-800 sm:text-sm">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ✓
          </span>
          <span>
            OpenAI 已重新开放 Pro 20x 新订阅与升级！无需历史 20x
            订阅记录，即可前往下单升级～
          </span>
          <a
            href="#pro"
            onClick={() => setSelectedPlan("pro")}
            className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            查看 20x 方案 <span>→</span>
          </a>
        </div>
      </div>

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
            选择适合您的 ChatGPT 方案
          </h1>
          <p className="mb-3 text-sm font-medium text-gray-500">
            官方通道直充，支付宝 / 微信支付，不成功全额退款
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
            onClick={() => setSelectedPlan("plus")}
            className={`${planClass(selectedPlan === "plus")} cursor-pointer`}
          >
            <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              推荐
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
                ChatGPT Plus 充值
              </h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                个人 / 办公 / 轻度开发首选
              </div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">
                  169
                </span>
                <span className="text-xs font-medium text-gray-400">/ 月</span>
                <span className="ml-1 text-xs text-gray-400 line-through">¥199</span>
                <span className="ml-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-500">
                  立省 ¥30
                </span>
              </div>
              <p className="mb-5 text-xs font-normal leading-relaxed text-gray-500">
                原账号升级 Plus，无需账号密码，失败全额退款
              </p>
              <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-gray-100 bg-gray-50/90 px-2 py-3 text-center">
                <FeatureCell icon={Shield} label="直充你号" sublabel="自动处理" />
                <FeatureCell icon={Lock} label="无需账密" sublabel="安全便捷" divided />
                <FeatureCell icon={Zap} label="实时到账" sublabel="快速生效" />
              </div>
              <FeatureList
                items={[
                  "访问 GPT-6-Astra、Image 2.5 等官方最新模型",
                  "支持 Codex App / CLI / Web",
                  "自动处理，通常几分钟内生效",
                ]}
              />
            </div>
            <Link
              href="/purchase?plan=plus"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "plus"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700"
                  : "bg-gray-100 text-[#111827] hover:bg-gray-200"
              }`}
            >
              立即升级 Plus
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
                ChatGPT Pro 充值 <span className="text-base font-bold text-gray-500">(5x/20x)</span>
              </h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                重度使用 / Codex / 深度研究优选
              </div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">879</span>
                <span className="text-xs font-medium text-gray-400">/ 月起</span>
                <span className="ml-1 text-xs text-gray-400 line-through">¥929</span>
                <span className="ml-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-500">立省 ¥50</span>
              </div>
              <p className="mb-4 text-xs font-normal leading-relaxed text-gray-500">更高用量，更适合专业工作、开发与长任务处理</p>
              <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200/90 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>GPT-6 · Pro 已开放</span>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-gray-100 bg-gray-50/90 px-2 py-3 text-center">
                <FeatureCell icon={Zap} label="多倍额度" sublabel="用量更足" />
                <FeatureCell icon={Sparkles} label="旗舰模型" sublabel="GPT-6 Pro" divided />
                <FeatureCell icon={ShieldCheck} label="安全可靠" sublabel="放心下单" />
              </div>
              <FeatureList items={["Plus 的 5 倍 / 20 倍用量，两档可选", "包含 Plus 所有特性，专属 Pro 深度推理模型", "Codex 额度拉满，强烈推荐高强度用户"]} />
            </div>
            <Link
              href="/purchase?plan=pro"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "pro" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700" : "bg-[#111827] text-white hover:bg-black"
              }`}
            >
              立即升级 Pro
            </Link>
          </article>

          <article
            onClick={() => setSelectedPlan("account")}
            className={`${planClass(selectedPlan === "account")} cursor-pointer`}
          >
            <div className="absolute right-5 top-5">
              {selectedPlan === "account" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="block h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
            <div>
              <h2 className="mb-2 pr-6 text-2xl font-black tracking-[-0.5px] text-[#111827]">ChatGPT Plus 新号成品</h2>
              <div className="mb-4 inline-block rounded-md bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-600">全新账号 · 已开 Plus · 到手即用</div>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#111827]">¥</span>
                <span className="text-4xl font-black leading-none tracking-[-1.5px] text-[#111827] sm:text-[42px]">189</span>
                <span className="text-xs font-medium text-gray-400">/ 月</span>
                <span className="ml-1 text-xs text-gray-400 line-through">¥199</span>
                <span className="ml-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-500">立省 ¥10</span>
              </div>
              <p className="mb-5 text-xs font-normal leading-relaxed text-gray-500">= 全新账号 ¥10 + 一个月 Plus 充值 ¥179</p>
              <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-gray-100 bg-gray-50/90 px-2 py-3 text-center">
                <FeatureCell icon={UserCheck} label="全新账号" sublabel="独享干净号" />
                <FeatureCell icon={Key} label="永久归属" sublabel="永久归您" divided />
                <FeatureCell icon={Zap} label="实时发货" sublabel="下单即交付" />
              </div>
              <FeatureList items={["全新 GPT 账号，已预充值一个月 Plus 会员", "交付账号密码及邮箱密码，支持自行换绑", "到手直接登录可用，免自备海外网络与邮箱"]} />
            </div>
            <Link
              href="/purchase?plan=account"
              onClick={(event) => event.stopPropagation()}
              className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                selectedPlan === "account" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700" : "bg-[#111827] text-white hover:bg-black"
              }`}
            >
              购买 Plus 新号
            </Link>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/purchase-go" className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300">
            <span>
              <strong className="block">ChatGPT Go <small className="font-normal text-slate-500">预算之选</small></strong>
              <small className="mt-1 block text-slate-500">官方直充 · 最快 1 分钟到账</small>
              <span className="mt-2 block text-sm font-bold text-indigo-600">¥ 90 /月起</span>
            </span>
            <span className="text-xl text-indigo-600">→</span>
          </Link>
          <Link href="/purchase_credits" className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300">
            <span><strong className="block">Codex 额度充值</strong><small className="mt-1 block text-slate-500">在线充值 / 扫码咨询</small></span>
            <span className="text-xl text-indigo-600">→</span>
          </Link>
          <Link href="/business-recharge" className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300">
            <span><strong className="block">Business 开通</strong><small className="mt-1 block text-slate-500">添加客服办理</small></span>
            <span className="text-xl text-indigo-600">→</span>
          </Link>
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
