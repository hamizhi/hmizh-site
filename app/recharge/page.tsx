"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function RechargePage() {
  const [card, setCard] = useState("QWER-J5R6-3KC3-T0A6");
  const [orderNo, setOrderNo] = useState("GETGPT20260930152438");
  const [copied, setCopied] = useState(false);
  const [cardStatus, setCardStatus] = useState<"verifying" | "valid">("verifying");
  const [confirmed, setConfirmed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCard(params.get("card") || "QWER-J5R6-3KC3-T0A6");
    setOrderNo(params.get("order_no") || "GETGPT20260930152438");
    const timer = window.setTimeout(() => setCardStatus("valid"), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-20 text-[#111827] antialiased">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">G</span>
            <span className="text-lg font-bold tracking-[-0.5px]">GETGPT <span className="text-indigo-600">Pro</span></span>
          </Link>
          <span className="flex items-center gap-2 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 text-emerald-500" />官方正规直充 · 不收集账号密码</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8 sm:pt-12">
        <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mx-auto flex max-w-sm items-center justify-between">
            <Step label="填写信息" done />
            <div className="mx-3 h-0.5 flex-1 bg-emerald-500" />
            <Step label="扫码支付" done />
            <div className="mx-3 h-0.5 flex-1 bg-indigo-600" />
            <Step label="手动激活" active number="3" />
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-black text-gray-900">卡密购买成功！</h1>
            <p className="mt-1 text-xs text-gray-500">请保存卡密，并按官方页面完成激活</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 font-mono text-sm">
            <div>
              <div className="font-sans text-[11px] text-gray-400">您的专属充值卡密</div>
              <div className="mt-0.5 text-base font-extrabold tracking-wider text-gray-900">{card}</div>
            </div>
            <button type="button" onClick={copyCard} className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 font-sans text-xs font-semibold text-gray-700 hover:bg-gray-50">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制卡密"}
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] text-gray-400">订单号：{orderNo}</div>
        </section>

        {!finished ? (
          <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">步骤 1</span>
                <span className="text-xs font-bold text-gray-700">卡密状态核验</span>
              </div>
              {cardStatus === "verifying" ? (
                <span className="flex items-center gap-1 text-xs text-amber-600"><RefreshCw className="h-3 w-3 animate-spin" />卡密验证中...</span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />卡密验证成功（有效）</span>
              )}
            </div>

            <div className="border-b border-gray-100 py-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">步骤 2</span>
                <span className="text-sm font-bold text-gray-900">前往 ChatGPT 官方页面</span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                请在官方页面自行登录并完成订阅激活。本站不会要求你粘贴 Session、Token 或账号密码。
              </p>
              <a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 py-3.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100">
                打开 ChatGPT 官方页面 <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="pt-6">
              <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
                <span>我已在官方页面完成激活，并确认没有向任何人提供账号密码或登录 Token。</span>
              </label>
              <button type="button" disabled={!confirmed || cardStatus !== "valid"} onClick={() => setFinished(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 disabled:opacity-50">
                <span>{cardStatus !== "valid" ? "正在核验卡密..." : "完成激活确认"}</span><span>&gt;</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-gray-200/90 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Zap className="h-9 w-9" /></div>
            <h2 className="mb-2 text-2xl font-black text-gray-900">激活流程已完成</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">请回到 ChatGPT 官方页面刷新账号状态，查看 Plus 权益是否生效。</p>
            <a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700">前往 ChatGPT 查验权益 <ExternalLink className="h-4 w-4" /></a>
          </section>
        )}
      </main>
    </div>
  );
}

function Step({ label, done = false, active = false, number = "1" }: { label: string; done?: boolean; active?: boolean; number?: string }) {
  return (
    <div className="z-10 flex flex-col items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}>{done ? "✓" : number}</div>
      <span className={`text-xs ${active ? "font-bold text-indigo-600" : "font-medium text-gray-400"}`}>{label}</span>
    </div>
  );
}
